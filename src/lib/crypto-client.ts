/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Client-side zero-knowledge cryptography helpers (Web Crypto API).
 *
 * The master password never leaves the browser. From it we derive — via
 * PBKDF2-HMAC-SHA256 — 64 bytes of key material that is split in two halves:
 *
 *   • bytes  0..31  → AES-256-GCM encryption key (stays in the browser only)
 *   • bytes 32..63  → "auth hash" sent to the server purely for login
 *                     verification (the server stores bcrypt(authHash)).
 *
 * Because the encryption key is a *different* half of the PBKDF2 output and is
 * never transmitted, a full database leak (salt + bcrypt(authHash) + ciphertext)
 * does not reveal the vault contents without brute-forcing the password.
 */

const PBKDF2_ITERATIONS = 250_000;
const KEY_MATERIAL_BYTES = 64; // 32 for AES key + 32 for auth hash

// ── base64 helpers ───────────────────────────────────────────────────────────
function bufToBase64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBuf(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// ── salt ─────────────────────────────────────────────────────────────────────
export function generateSalt(): string {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return bufToBase64(salt);
}

export interface DerivedKeys {
  /** Base64 value sent to the server for login verification. */
  authHash: string;
  /** AES-GCM key kept in the browser; used to encrypt/decrypt the vault. */
  encKey: CryptoKey;
}

/**
 * Derive the auth hash + AES encryption key from the master password and salt.
 */
export async function deriveKeys(password: string, saltB64: string): Promise<DerivedKeys> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: base64ToBuf(saltB64),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    KEY_MATERIAL_BYTES * 8,
  );

  const material = new Uint8Array(bits);
  const encKeyBytes = material.slice(0, 32);
  const authBytes = material.slice(32, 64);

  const encKey = await crypto.subtle.importKey(
    'raw',
    encKeyBytes,
    { name: 'AES-GCM' },
    true, // extractable so we can cache it in sessionStorage for reloads
    ['encrypt', 'decrypt'],
  );

  return { authHash: bufToBase64(authBytes), encKey };
}

export interface EncryptedBlob {
  iv: string;
  ciphertext: string;
}

/** Encrypt an arbitrary JSON-serialisable object with AES-256-GCM. */
export async function encryptVault(encKey: CryptoKey, data: unknown): Promise<EncryptedBlob> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(data));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, encKey, plaintext);
  return { iv: bufToBase64(iv), ciphertext: bufToBase64(ciphertext) };
}

/** Decrypt an AES-256-GCM blob back into the original object. */
export async function decryptVault<T = unknown>(encKey: CryptoKey, blob: EncryptedBlob): Promise<T> {
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBuf(blob.iv) },
    encKey,
    base64ToBuf(blob.ciphertext),
  );
  return JSON.parse(new TextDecoder().decode(plaintext)) as T;
}

// ── sessionStorage key caching (survives reloads within the same tab) ─────────
const ENC_KEY_STORAGE = 'vault_enc_key_v1';

export async function cacheEncKey(encKey: CryptoKey): Promise<void> {
  const raw = await crypto.subtle.exportKey('raw', encKey);
  sessionStorage.setItem(ENC_KEY_STORAGE, bufToBase64(raw));
}

export async function loadCachedEncKey(): Promise<CryptoKey | null> {
  const stored = sessionStorage.getItem(ENC_KEY_STORAGE);
  if (!stored) return null;
  try {
    return await crypto.subtle.importKey(
      'raw',
      base64ToBuf(stored),
      { name: 'AES-GCM' },
      true,
      ['encrypt', 'decrypt'],
    );
  } catch {
    return null;
  }
}

export function clearCachedEncKey(): void {
  sessionStorage.removeItem(ENC_KEY_STORAGE);
}
