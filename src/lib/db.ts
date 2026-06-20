/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Neon Postgres access layer.
 *
 * The vault is stored as a single AES-GCM encrypted blob per user. The server
 * never sees plaintext notes/passwords/prompts — only ciphertext (vault_iv /
 * vault_ct) and a bcrypt of the client-derived auth hash.
 */

import { neon } from '@neondatabase/serverless';

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set. Add it to .env.local (see .env.example).');
  }
  return neon(url);
}

let schemaReady = false;

/** Create the table on first use. Cheap & idempotent (IF NOT EXISTS). */
export async function ensureSchema(): Promise<void> {
  if (schemaReady) return;
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS vault_users (
      id            SERIAL PRIMARY KEY,
      email         TEXT UNIQUE NOT NULL,
      salt          TEXT NOT NULL,
      auth_verifier TEXT NOT NULL,
      vault_iv      TEXT,
      vault_ct      TEXT,
      login_count   INTEGER NOT NULL DEFAULT 1,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  schemaReady = true;
}

export interface VaultUserRow {
  id: number;
  email: string;
  salt: string;
  auth_verifier: string;
  vault_iv: string | null;
  vault_ct: string | null;
  login_count: number;
  created_at: string;
}

export async function findUserByEmail(email: string): Promise<VaultUserRow | null> {
  await ensureSchema();
  const sql = getSql();
  const rows = (await sql`
    SELECT id, email, salt, auth_verifier, vault_iv, vault_ct, login_count, created_at
    FROM vault_users WHERE email = ${email} LIMIT 1
  `) as VaultUserRow[];
  return rows[0] ?? null;
}

export async function createUser(params: {
  email: string;
  salt: string;
  authVerifier: string;
  vaultIv: string;
  vaultCt: string;
}): Promise<VaultUserRow> {
  await ensureSchema();
  const sql = getSql();
  const rows = (await sql`
    INSERT INTO vault_users (email, salt, auth_verifier, vault_iv, vault_ct)
    VALUES (${params.email}, ${params.salt}, ${params.authVerifier}, ${params.vaultIv}, ${params.vaultCt})
    RETURNING id, email, salt, auth_verifier, vault_iv, vault_ct, login_count, created_at
  `) as VaultUserRow[];
  return rows[0];
}

export async function incrementLoginCount(id: number): Promise<number> {
  const sql = getSql();
  const rows = (await sql`
    UPDATE vault_users SET login_count = login_count + 1, updated_at = now()
    WHERE id = ${id} RETURNING login_count
  `) as { login_count: number }[];
  return rows[0]?.login_count ?? 1;
}

export async function saveVaultBlob(id: number, vaultIv: string, vaultCt: string): Promise<void> {
  await ensureSchema();
  const sql = getSql();
  await sql`
    UPDATE vault_users SET vault_iv = ${vaultIv}, vault_ct = ${vaultCt}, updated_at = now()
    WHERE id = ${id}
  `;
}

export async function updatePassphrase(
  id: number,
  salt: string,
  authVerifier: string,
  vaultIv: string,
  vaultCt: string,
): Promise<void> {
  await ensureSchema();
  const sql = getSql();
  await sql`
    UPDATE vault_users
    SET salt = ${salt}, auth_verifier = ${authVerifier}, vault_iv = ${vaultIv}, vault_ct = ${vaultCt}, updated_at = now()
    WHERE id = ${id}
  `;
}

export async function deleteUser(id: number): Promise<void> {
  const sql = getSql();
  await sql`DELETE FROM vault_users WHERE id = ${id}`;
}
