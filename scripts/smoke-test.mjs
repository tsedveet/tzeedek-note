/**
 * End-to-end smoke test that mimics the browser's zero-knowledge crypto and
 * exercises the live API + Neon round-trip. Run with the dev server up:
 *   node scripts/smoke-test.mjs
 * It registers a throwaway user, verifies decrypt, login, save, then deletes it.
 */
import { webcrypto } from 'crypto';

const { subtle } = webcrypto;
const BASE = process.env.BASE_URL || 'http://localhost:3000';
const ITER = 250_000;

const b64 = (buf) => Buffer.from(buf).toString('base64');
const unb64 = (s) => new Uint8Array(Buffer.from(s, 'base64'));

async function deriveKeys(password, saltB64) {
  const baseKey = await subtle.importKey('raw', new TextEncoder().encode(password), { name: 'PBKDF2' }, false, ['deriveBits']);
  const bits = await subtle.deriveBits({ name: 'PBKDF2', salt: unb64(saltB64), iterations: ITER, hash: 'SHA-256' }, baseKey, 64 * 8);
  const material = new Uint8Array(bits);
  const encKey = await subtle.importKey('raw', material.slice(0, 32), { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
  return { authHash: b64(material.slice(32, 64)), encKey };
}
async function encryptVault(encKey, data) {
  const iv = webcrypto.getRandomValues(new Uint8Array(12));
  const ct = await subtle.encrypt({ name: 'AES-GCM', iv }, encKey, new TextEncoder().encode(JSON.stringify(data)));
  return { iv: b64(iv), ciphertext: b64(ct) };
}
async function decryptVault(encKey, blob) {
  const pt = await subtle.decrypt({ name: 'AES-GCM', iv: unb64(blob.iv) }, encKey, unb64(blob.ciphertext));
  return JSON.parse(new TextDecoder().decode(pt));
}

let cookie = '';
async function api(path, opts = {}) {
  const res = await fetch(BASE + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}), ...(opts.headers || {}) },
  });
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) cookie = setCookie.split(';')[0];
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

function assert(cond, msg) {
  if (!cond) { console.error('✗ FAIL:', msg); process.exit(1); }
  console.log('✓', msg);
}

const email = `smoke_${Date.now()}@test.local`;
const password = 'super-secret-123';
const salt = b64(webcrypto.getRandomValues(new Uint8Array(16)));

// 1. Register
const { authHash, encKey } = await deriveKeys(password, salt);
const seed = { notes: [{ id: 'n1', title: 'hello', content: 'secret note' }], passwords: [], prompts: [], logs: [] };
const blob = await encryptVault(encKey, seed);
let r = await api('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, salt, authHash, vault: blob }) });
assert(r.status === 200 && r.body.user?.email === email, `register → ${r.status}`);

// 2. /me returns the encrypted vault, which decrypts to the seed
r = await api('/api/auth/me');
assert(r.status === 200 && r.body.vault, `me returns vault → ${r.status}`);
const dec = await decryptVault(encKey, r.body.vault);
assert(dec.notes[0].content === 'secret note', 'decrypted vault matches seed');

// 3. Save a modified vault
const updated = { ...seed, notes: [{ id: 'n1', title: 'hello', content: 'EDITED' }] };
const blob2 = await encryptVault(encKey, updated);
r = await api('/api/vault', { method: 'PUT', body: JSON.stringify({ vault: blob2 }) });
assert(r.status === 200, `vault PUT → ${r.status}`);

// 4. Logout then full login flow with a fresh cookie
cookie = '';
r = await api('/api/auth/salt', { method: 'POST', body: JSON.stringify({ email }) });
assert(r.status === 200 && r.body.salt === salt, 'salt matches stored salt');
const { authHash: ah2, encKey: ek2 } = await deriveKeys(password, r.body.salt);
r = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, authHash: ah2 }) });
assert(r.status === 200 && r.body.vault, `login → ${r.status}`);
const dec2 = await decryptVault(ek2, r.body.vault);
assert(dec2.notes[0].content === 'EDITED', 'login returns the updated (persisted) vault');

// 5. Wrong password is rejected
r = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, authHash: 'wronghash' }) });
assert(r.status === 401, `wrong password rejected → ${r.status}`);

// 6. Cleanup: delete the test user (need a valid session first)
r = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, authHash: ah2 }) });
r = await api('/api/vault', { method: 'DELETE' });
assert(r.status === 200, `cleanup delete → ${r.status}`);

console.log('\n🎉 All smoke tests passed against the live Neon database.');
