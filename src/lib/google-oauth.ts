/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Minimal Google OAuth 2.0 (Authorization Code + PKCE) helpers.
 *
 * Google only proves *identity* here. The vault itself stays zero-knowledge:
 * after Google sign-in the user still enters a separate vault passphrase from
 * which the AES key is derived in the browser (see crypto-client.ts). Google
 * never sees that passphrase and the server never sees the encryption key.
 */

import { createHash, randomBytes } from 'crypto';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

export function isGoogleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set. Add it to .env.local (see .env.example).`);
  return v;
}

export function callbackUrl(origin: string): string {
  return `${origin}/api/auth/google/callback`;
}

const b64url = (buf: Buffer) => buf.toString('base64url');

/** PKCE pair: keep verifier in a cookie, send challenge to Google. */
export function createPkce(): { verifier: string; challenge: string } {
  const verifier = b64url(randomBytes(32));
  const challenge = b64url(createHash('sha256').update(verifier).digest());
  return { verifier, challenge };
}

export function randomState(): string {
  return b64url(randomBytes(16));
}

export function buildAuthorizeUrl(params: { origin: string; state: string; challenge: string }): string {
  const url = new URL(GOOGLE_AUTH_URL);
  url.searchParams.set('client_id', requireEnv('GOOGLE_CLIENT_ID'));
  url.searchParams.set('redirect_uri', callbackUrl(params.origin));
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('state', params.state);
  url.searchParams.set('code_challenge', params.challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('access_type', 'online');
  url.searchParams.set('prompt', 'select_account');
  return url.toString();
}

export interface GoogleIdentity {
  email: string;
  emailVerified: boolean;
  name?: string;
  sub: string;
}

/** Exchange the auth code for tokens and read the verified identity. */
export async function exchangeCode(params: {
  origin: string;
  code: string;
  verifier: string;
}): Promise<GoogleIdentity> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code: params.code,
      client_id: requireEnv('GOOGLE_CLIENT_ID'),
      client_secret: requireEnv('GOOGLE_CLIENT_SECRET'),
      redirect_uri: callbackUrl(params.origin),
      grant_type: 'authorization_code',
      code_verifier: params.verifier,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Google token exchange failed: ${res.status} ${detail}`);
  }

  const data = (await res.json()) as { id_token?: string };
  if (!data.id_token) throw new Error('Google response missing id_token.');

  // The id_token came directly from Google's token endpoint over TLS, so we can
  // trust its payload without re-verifying the signature.
  const payloadPart = data.id_token.split('.')[1];
  const payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8')) as {
    email?: string;
    email_verified?: boolean;
    name?: string;
    sub?: string;
  };

  if (!payload.email || !payload.sub) throw new Error('Google identity missing email/sub.');

  return {
    email: payload.email.toLowerCase(),
    emailVerified: Boolean(payload.email_verified),
    name: payload.name,
    sub: payload.sub,
  };
}
