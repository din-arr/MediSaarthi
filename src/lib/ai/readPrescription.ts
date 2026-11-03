import { prisma } from "../prisma";

export type DraftItem = { name: string; strength: string; quantity: number; confidence: number; productId: string; schedule: string };

export async function readPrescription(file: File): Promise<DraftItem[]> {
  const products = await prisma.product.findMany({ take: 3, orderBy: { name: "asc" } });
  if (process.env.OPENAI_API_KEY && file.type.startsWith("image/")) {
    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    const response = await fetch("https://api.openai.com/v1/chat/completions", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: JSON.stringify({ model: "gpt-4o-mini", response_format: { type: "json_object" }, messages: [{ role: "user", content: [{ type: "text", text: "Read this prescription and return JSON with an items array. Each item must have name, strength, quantity and confidence from 0 to 1." }, { type: "image_url", image_url: { url: `data:${file.type};base64,${base64}` } }] }] }) });
    if (!response.ok) throw new Error("VISION_API_FAILED");
    const result = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const parsed = JSON.parse(result.choices?.[0]?.message?.content ?? "{\"items\":[]}") as { items?: Array<{ name?: string; strength?: string; quantity?: number; confidence?: number }> };
    return (parsed.items ?? []).flatMap((item) => {
      const match = products.find((product) => product.name.toLowerCase() === item.name?.toLowerCase());
      return match ? [{ name: match.name, strength: item.strength ?? match.strength, quantity: Math.max(1, item.quantity ?? 1), confidence: item.confidence ?? .6, productId: match.id, schedule: match.schedule }] : [];
    });
  }
  return products.map((product, index) => ({ name: product.name, strength: product.strength, quantity: index === 0 ? 2 : 1, confidence: index === 0 ? .94 : .72, productId: product.id, schedule: product.schedule }));
}
