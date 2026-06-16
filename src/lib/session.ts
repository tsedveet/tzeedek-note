/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Stateless session handling via a signed JWT stored in an httpOnly cookie.
 * The cookie only identifies *who* the user is; it carries no vault secrets.
 */

import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

const COOKIE_NAME = 'vault_session';
const PENDING_GOOGLE_COOKIE = 'vault_google_pending';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days
const PENDING_MAX_AGE_SECONDS = 60 * 10; // 10 minutes to finish the passphrase step

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET is not set. Add it to .env.local (see .env.example).');
  }
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  uid: number;
  email: string;
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await new SignJWT({ uid: payload.uid, email: payload.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return { uid: payload.uid as number, email: payload.email as string };
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// ── Pending Google identity (signed-in via Google, awaiting vault passphrase) ──

export { PENDING_GOOGLE_COOKIE, PENDING_MAX_AGE_SECONDS };

/** Sign a short-lived token; the caller attaches it to the redirect response. */
export async function signPendingGoogleToken(email: string): Promise<string> {
  return new SignJWT({ email, kind: 'google-pending' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${PENDING_MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

export async function getPendingGoogle(): Promise<{ email: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(PENDING_GOOGLE_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.kind !== 'google-pending') return null;
    return { email: payload.email as string };
  } catch {
    return null;
  }
}

export async function destroyPendingGoogle(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(PENDING_GOOGLE_COOKIE);
}
