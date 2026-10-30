import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // Standard recommended IV length for AES-GCM
const AUTH_TAG_LENGTH = 16;

/**
 * Returns the 32-byte encryption key from environment variable ENCRYPTION_MASTER_KEY.
 * If the key is not 64 hex characters, derives a 32-byte key via SHA-256.
 */
function getMasterKey(): Buffer {
  const envKey = process.env.ENCRYPTION_MASTER_KEY || "default_super_secret_aicenter_master_encryption_key_production_32bytes";
  if (/^[0-9a-fA-F]{64}$/.test(envKey)) {
    return Buffer.from(envKey, "hex");
  }
  return crypto.createHash("sha256").update(envKey).digest();
}

export interface EncryptedData {
  encryptedKey: string;
  iv: string;
  authTag: string;
}

/**
 * Encrypts an API key using AES-256-GCM authenticated encryption.
 */
export function encryptApiKey(plainKey: string): EncryptedData {
  if (!plainKey) {
    throw new Error("Cannot encrypt empty key");
  }

  const masterKey = getMasterKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, masterKey, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let encrypted = cipher.update(plainKey, "utf8", "base64");
  encrypted += cipher.final("base64");
  const authTag = cipher.getAuthTag().toString("base64");

  return {
    encryptedKey: encrypted,
    iv: iv.toString("base64"),
    authTag: authTag,
  };
}

/**
 * Decrypts an API key using AES-256-GCM.
 */
export function decryptApiKey(data: EncryptedData): string {
  if (!data.encryptedKey || !data.iv || !data.authTag) {
    throw new Error("Missing encrypted components (key, iv, or auth tag)");
  }

  const masterKey = getMasterKey();
  const iv = Buffer.from(data.iv, "base64");
  const authTag = Buffer.from(data.authTag, "base64");

  const decipher = crypto.createDecipheriv(ALGORITHM, masterKey, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(data.encryptedKey, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Masks an API key for safe display in the frontend UI.
 * e.g., 'gsk_1234567890abcdef' -> 'gsk_...cdef'
 */
export function maskApiKey(plainKey: string): string {
  if (!plainKey || plainKey.length < 8) {
    return "••••••••";
  }

  // Detect prefixes like gsk_, sk-, etc.
  const prefixMatch = plainKey.match(/^([a-zA-Z0-9_-]{3,6}_)/);
  const prefix = prefixMatch ? prefixMatch[1] : plainKey.slice(0, 3);
  const suffix = plainKey.slice(-4);

  return `${prefix}...${suffix}`;
}

/**
 * Redacts potential secrets and API keys from logs, error messages, and responses.
 */
export function redactSecrets(text: string): string {
  if (!text || typeof text !== "string") return text;

  let redacted = text;

  // Google API keys: AIzaSy...
  redacted = redacted.replace(/AIza[0-9A-Za-z-_]{35}/g, "[REDACTED_GOOGLE_KEY]");

  // Groq API keys: gsk_...
  redacted = redacted.replace(/gsk_[0-9A-Za-z]{40,64}/g, "[REDACTED_GROQ_KEY]");

  // OpenRouter / OpenAI: sk-or-... or sk-...
  redacted = redacted.replace(/sk-[a-zA-Z0-9_\-\.]{20,80}/g, "[REDACTED_SECRET_KEY]");

  // Hugging Face: hf_...
  redacted = redacted.replace(/hf_[a-zA-Z0-9]{34,40}/g, "[REDACTED_HF_KEY]");

  // Mistral / Cloudflare generic hex/alphanumeric tokens
  redacted = redacted.replace(/(?:Bearer\s+)([a-zA-Z0-9_\-\.]{20,})/gi, "Bearer [REDACTED_AUTH_TOKEN]");

  // Header tokens in query params or json
  redacted = redacted.replace(/(["']?(?:apiKey|api_key|token|secret|authorization)["']?\s*[:=]\s*["'])([^"'\s]{8,})(["'])/gi, '$1[REDACTED]$3');

  return redacted;
}
