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

export type StoredPrescription = { encryptedFilePath: string; fileData: Uint8Array<ArrayBuffer> | null };

function seal(data: Buffer) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]);
}

/**
 * Encrypts a prescription. By default the encrypted bytes go into the database
 * (works on Vercel, where the disk is wiped). Set PRESCRIPTION_STORAGE=disk to
 * keep them in /uploads instead.
 */
export async function encryptBuffer(data: Buffer, extension: string): Promise<StoredPrescription> {
  const sealed = seal(data);
  if (process.env.PRESCRIPTION_STORAGE !== "disk") return { encryptedFilePath: `db:${extension}`, fileData: new Uint8Array(sealed) };
  const filename = `${Date.now()}-${randomBytes(8).toString("hex")}.${extension}.enc`;
  const directory = path.join(process.cwd(), "uploads");
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, filename), sealed);
  return { encryptedFilePath: `uploads/${filename}`, fileData: null };
}

export async function encryptPrescription(file: File) {
  return encryptBuffer(Buffer.from(await file.arrayBuffer()), extensions[file.type] ?? "jpg");
}

/** Decrypts a stored prescription. Only call this after checking the viewer's role. */
export async function decryptPrescription(stored: { encryptedFilePath: string; fileData?: Uint8Array | null }) {
  const storedPath = stored.encryptedFilePath;
  const file = stored.fileData ? Buffer.from(stored.fileData) : await readFile(path.join(process.cwd(), storedPath));
  const iv = file.subarray(0, 12);
  const authTag = file.subarray(12, 28);
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(authTag);
  const data = Buffer.concat([decipher.update(file.subarray(28)), decipher.final()]);
  const extension = storedPath.startsWith("db:") ? storedPath.slice(3) : storedPath.replace(/\.enc$/, "").split(".").pop() ?? "jpg";
  return { data, contentType: mimeTypes[extension] ?? "image/jpeg" };
}
