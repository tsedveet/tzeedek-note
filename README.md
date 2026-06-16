# 🔐 VaultNote

A cinematic, premium **zero-knowledge** vault for notes, passwords, and AI prompts.
Built with **Next.js (App Router)**, **Neon Postgres**, **Tailwind CSS v4**, and **Web Crypto** client-side encryption.

> Your master password never leaves the browser. Notes, passwords and prompts are
> encrypted with AES-256-GCM **on your device**; the server only ever stores ciphertext.

---

## How the zero-knowledge model works

1. From your master password + a per-user salt, the browser derives 64 bytes via
   **PBKDF2-HMAC-SHA256 (250k iterations)**.
2. Bytes `0..31` → an **AES-256-GCM key** that stays in the browser only.
3. Bytes `32..63` → an **auth hash** sent to the server purely for login. The server
   stores `bcrypt(authHash)`.
4. The whole vault is encrypted client-side and stored in Neon as a single ciphertext
   blob (`vault_iv` + `vault_ct`). A database leak reveals nothing without your password.

---

## Run locally

**Prerequisites:** Node.js 18+ and a free [Neon](https://neon.tech) Postgres database.

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env.local` (copy from [.env.example](.env.example)) and set:
   - `DATABASE_URL` — your Neon pooled connection string
   - `SESSION_SECRET` — a long random string (one is auto-generated for you in `.env.local`)
3. Create the database table:
   ```bash
   npm run db:init
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000

---

## Deploy to Vercel

1. Push this repo to GitHub (or use the Vercel CLI directly).
2. Import the project in [Vercel](https://vercel.com/new) — it auto-detects Next.js.
3. Add the environment variables in **Project → Settings → Environment Variables**:
   - `DATABASE_URL`
   - `SESSION_SECRET`
   (Tip: Vercel's **Neon integration** can set `DATABASE_URL` automatically.)
4. Deploy. The `vault_users` table is created automatically on first request, or run
   `npm run db:init` once against the production database.

---

## Project structure

```
src/
  app/
    layout.tsx, page.tsx, globals.css
    api/
      auth/{salt,register,login,logout,me}/route.ts
      vault/route.ts                 # PUT (save) / DELETE (wipe) encrypted blob
  components/                        # VaultApp (client root) + UI tabs
  lib/
    crypto-client.ts                 # PBKDF2 + AES-GCM (browser)
    db.ts                            # Neon access layer
    session.ts                       # signed JWT cookie sessions
    api-client.ts                    # browser → API helpers
  types.ts
scripts/init-db.mjs                  # one-off schema initialiser
```
