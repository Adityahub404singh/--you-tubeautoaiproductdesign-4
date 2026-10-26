import crypto from "node:crypto";

function key(): Buffer {
  const raw = process.env.YOUTUBE_TOKEN_ENCRYPTION_KEY;
  if (!raw || !/^[a-fA-F0-9]{64}$/.test(raw)) {
    throw new Error("YOUTUBE_TOKEN_ENCRYPTION_KEY must be 64 hexadecimal characters.");
  }
  return Buffer.from(raw, "hex");
}

export function encryptSocialToken(value: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptSocialToken(value: string): string {
  const parts = value.split(":");
  if (parts.length !== 4 || parts[0] !== "v1") {
    throw new Error("Stored social token has an unsupported format.");
  }
  const [, ivHex, tagHex, dataHex] = parts;
  const decipher = crypto.createDecipheriv("aes-256-gcm", key(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return Buffer.concat([decipher.update(Buffer.from(dataHex, "hex")), decipher.final()]).toString("utf8");
}
