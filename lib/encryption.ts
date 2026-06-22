// Field-level encryption for PHI (Protected Health Information)
// Uses AES-256-GCM for authenticated encryption
import "server-only";

import crypto from "crypto";

import { env } from "./env";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function getEncryptionKey(): Buffer {
  const secret = env.DATA_ENCRYPTION_KEY || env.SESSION_SECRET;
  if (env.DATA_ENCRYPTION_KEY) {
    return Buffer.from(env.DATA_ENCRYPTION_KEY.slice(0, 64), 'hex');
  }
  return crypto.scryptSync(secret, "phi-encryption-salt", KEY_LENGTH);
}

export function encryptPHI(plaintext: string | number | null): string {
  if (plaintext === null || plaintext === undefined) {
    return "";
  }
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const text = plaintext.toString();
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

export function decryptPHI(encrypted: string): string {
  if (!encrypted) {
    return "";
  }
  try {
    const key = getEncryptionKey();
    const buffer = Buffer.from(encrypted, "base64");
    const iv = buffer.subarray(0, IV_LENGTH);
    const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encryptedData = buffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
    return decrypted.toString("utf8");
  } catch {
    return "";
  }
}