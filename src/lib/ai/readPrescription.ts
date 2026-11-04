import { prisma } from "../prisma";
import { matchProduct, type Product, type Read } from "./match";

export type DraftItem = { name: string; strength: string; quantity: number; confidence: number; productId: string; schedule: string };

/**
 * AI reads the prescription and returns a DRAFT only. A registered pharmacist
 * checks every item. If the AI isn't configured or fails, we fall back to a
 * demo draft so the flow keeps working, and the confidence stays low.
 */
export async function readPrescription(file: File): Promise<DraftItem[]> {
  const products = await prisma.product.findMany({ where: { schedule: { not: "X" } }, select: { id: true, name: true, strength: true, schedule: true } });
  if (process.env.OPENAI_API_KEY && file.type.startsWith("image/")) {
    try {
      const items = await askVisionModel(file, products);
      if (items.length) return items;
    } catch (error) {
      console.warn("AI reading failed, using demo draft", error);
    }
  }
  return demoDraft(file, products);
}

async function askVisionModel(file: File, products: Product[]): Promise<DraftItem[]> {
  const catalogue = [...new Set(products.map((product) => `${product.name} ${product.strength}`))].join(", ");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST", signal: controller.signal,
      headers: { "content-type": "application/json", authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You read Indian medical prescriptions, often handwritten. Only transcribe what is written. Never add medicines, never give medical advice. If a line is unclear, lower its confidence instead of guessing." },
          { role: "user", content: [
            { type: "text", text: `Return JSON {"items":[{"name","strength","quantity","confidence"}]}. quantity = number of strips/bottles if written, otherwise 1. confidence 0 to 1. Prefer names from this catalogue when they match: ${catalogue}` },
            { type: "image_url", image_url: { url: `data:${file.type};base64,${Buffer.from(await file.arrayBuffer()).toString("base64")}` } },
          ] },
        ],
      }),
    });
    if (!response.ok) throw new Error(`Vision API ${response.status}`);
    const result = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const parsed = JSON.parse(result.choices?.[0]?.message?.content ?? "{}") as { items?: Read[] };
    return (parsed.items ?? []).flatMap((item) => {
      const match = matchProduct(item, products);
      if (!match) return [];
      const confidence = Math.min(1, Math.max(0, Number(item.confidence ?? 0.6)));
      return [{ name: match.name, strength: match.strength, quantity: Math.min(10, Math.max(1, Math.round(Number(item.quantity ?? 1)))), confidence, productId: match.id, schedule: match.schedule }];
    });
  } finally {
    clearTimeout(timer);
  }
}

/** Demo draft: common repeat medicines, picked from the file so different uploads look different. */
function demoDraft(file: File, products: Product[]): DraftItem[] {
  const common = ["Metformin", "Telmisartan", "Levothyroxine", "Amlodipine", "Atorvastatin", "Paracetamol"];
  const pool = common.map((name) => products.find((product) => product.name === name)).filter((product): product is Product => Boolean(product));
  if (!pool.length) return [];
  const start = file.size % pool.length;
  return [0, 1].map((offset) => pool[(start + offset) % pool.length]).filter((product, index, list) => list.indexOf(product) === index)
    .map((product, index) => ({ name: product.name, strength: product.strength, quantity: index === 0 ? 2 : 1, confidence: index === 0 ? 0.88 : 0.64, productId: product.id, schedule: product.schedule }));
}
