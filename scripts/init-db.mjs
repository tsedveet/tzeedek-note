/**
 * One-off Neon schema initialiser.
 *
 * Usage (after putting DATABASE_URL in .env.local):
 *   npm run db:init
 */
import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('✗ DATABASE_URL is not set. Add it to .env.local first.');
  process.exit(1);
}

const sql = neon(url);

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

console.log('✓ vault_users table is ready.');
