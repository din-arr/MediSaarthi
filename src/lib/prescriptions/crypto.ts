import { createCipheriv, randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

function key() {
  const raw = process.env.PRESCRIPTION_KEY;
  if (!raw) throw new Error("PRESCRIPTION_KEY is not configured");
  const parsed = Buffer.from(raw, "base64");
  if (parsed.length !== 32) throw new Error("PRESCRIPTION_KEY must be a base64-encoded 32-byte key");
  return parsed;
}

export async function encryptPrescription(file: File) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(Buffer.from(await file.arrayBuffer())), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const filename = `${Date.now()}-${randomBytes(8).toString("hex")}.enc`;
  const directory = path.join(process.cwd(), "uploads");
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, filename), Buffer.concat([iv, authTag, encrypted]));
  return `uploads/${filename}`;
}
