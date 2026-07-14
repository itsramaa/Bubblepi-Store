import { createCipheriv, createDecipheriv, randomBytes } from "crypto"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 12 // 96-bit IV for GCM
const TAG_LENGTH = 16

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key || key.length !== 64) {
    throw new Error("ENCRYPTION_KEY must be a 64-char hex string (32 bytes)")
  }
  return Buffer.from(key, "hex")
}

/**
 * Encrypts plaintext using AES-256-GCM.
 * Output format: iv:authTag:ciphertext (all hex-encoded, colon-separated)
 */
export function encrypt(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const authTag = cipher.getAuthTag()
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`
}

/**
 * Decrypts ciphertext produced by encrypt().
 * Returns original plaintext string.
 */
export function decrypt(ciphertext: string): string {
  const key = getKey()
  const parts = ciphertext.split(":")
  if (parts.length !== 3) throw new Error("Invalid ciphertext format")
  const [ivHex, authTagHex, encryptedHex] = parts
  const iv = Buffer.from(ivHex, "hex")
  const authTag = Buffer.from(authTagHex, "hex")
  const encrypted = Buffer.from(encryptedHex, "hex")
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
  return decrypted.toString("utf8")
}

/**
 * Fix 5: Returns true if a string looks like an encrypted value (iv:tag:ciphertext format).
 * Validates hex encoding of iv (24 chars) and authTag (32 chars) to avoid false positives
 * on credentials like "user@email.com:pass:extra".
 */
export function isEncrypted(value: string): boolean {
  const parts = value.split(":")
  if (parts.length !== 3) return false
  if (parts[0].length !== 24 || parts[1].length !== 32) return false
  return /^[0-9a-f]+$/i.test(parts[0]) && /^[0-9a-f]+$/i.test(parts[1])
}

// Re-export TAG_LENGTH for tests
export { TAG_LENGTH }
