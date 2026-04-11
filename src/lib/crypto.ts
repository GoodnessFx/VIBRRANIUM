import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const ENCRYPTION_KEY = process.env.EMERGENCY_KEYPAIR_ENCRYPTION_KEY; // Must be 32 bytes (64 hex characters)

if (!ENCRYPTION_KEY && process.env.NODE_ENV !== "test") {
  console.error("EMERGENCY_KEYPAIR_ENCRYPTION_KEY environment variable is not set.");
}

export interface EncryptedData {
  encrypted: string;
  iv: string;
  tag: string;
}

export function encrypt(text: string): EncryptedData {
  if (!ENCRYPTION_KEY) throw new Error("ENCRYPTION_KEY not set");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, "hex"),
    iv
  );

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");

  return {
    encrypted,
    iv: iv.toString("hex"),
    tag,
  };
}

export function decrypt(encryptedData: EncryptedData): string {
  if (!ENCRYPTION_KEY) throw new Error("ENCRYPTION_KEY not set");
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, "hex"),
    Buffer.from(encryptedData.iv, "hex")
  );

  decipher.setAuthTag(Buffer.from(encryptedData.tag, "hex"));

  let decrypted = decipher.update(encryptedData.encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
