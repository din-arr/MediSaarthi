import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

function key() {
  const raw = process.env.PRESCRIPTION_KEY;
  if (!raw) throw new Error("PRESCRIPTION_KEY is not configured");
  const parsed = Buffer.from(raw, "base64");
  if (parsed.length !== 32) throw new Error("PRESCRIPTION_KEY must be a base64-encoded 32-byte key");
  return parsed;
}

const extensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf", "image/svg+xml": "svg" };
const mimeTypes: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", pdf: "application/pdf", svg: "image/svg+xml" };

export async function encryptBuffer(data: Buffer, extension: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const filename = `${Date.now()}-${randomBytes(8).toString("hex")}.${extension}.enc`;
  const directory = path.join(process.cwd(), "uploads");
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, filename), Buffer.concat([iv, authTag, encrypted]));
  return `uploads/${filename}`;
}

export async function encryptPrescription(file: File) {
  return encryptBuffer(Buffer.from(await file.arrayBuffer()), extensions[file.type] ?? "jpg");
}

/** Decrypts a stored prescription. Only call this after checking the viewer's role. */
export async function decryptPrescription(storedPath: string) {
  const file = await readFile(path.join(process.cwd(), storedPath));
  const iv = file.subarray(0, 12);
  const authTag = file.subarray(12, 28);
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(authTag);
  const data = Buffer.concat([decipher.update(file.subarray(28)), decipher.final()]);
  const extension = storedPath.replace(/\.enc$/, "").split(".").pop() ?? "jpg";
  return { data, contentType: mimeTypes[extension] ?? "image/jpeg" };
}
