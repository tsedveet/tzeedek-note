/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Handles Google's redirect: validates state, exchanges the code, and stores a
 * short-lived "pending Google identity" cookie. The browser is then sent back
 * to the app, which will ask for the vault passphrase to finish unlocking.
 */

import { NextRequest, NextResponse } from 'next/server';
import { exchangeCode } from '@/lib/google-oauth';
import { signPendingGoogleToken, PENDING_GOOGLE_COOKIE, PENDING_MAX_AGE_SECONDS } from '@/lib/session';

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const fail = (msg: string) =>
    NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(msg)}`);

  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');
  const oauthError = req.nextUrl.searchParams.get('error');

  if (oauthError) return fail('Google нэвтрэлт цуцлагдлаа.');

  const cookieState = req.cookies.get('g_state')?.value;
  const verifier = req.cookies.get('g_pkce')?.value;
  if (!code || !state || !cookieState || state !== cookieState || !verifier) {
    return fail('Хүсэлт хүчингүй байна. Дахин оролдоно уу.');
  }

  try {
    const identity = await exchangeCode({ origin, code, verifier });
    if (!identity.emailVerified) return fail('Google имэйл баталгаажаагүй байна.');

    const token = await signPendingGoogleToken(identity.email);
    const res = NextResponse.redirect(`${origin}/?google=1`);
    res.cookies.set(PENDING_GOOGLE_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: PENDING_MAX_AGE_SECONDS,
    });
    res.cookies.delete('g_pkce');
    res.cookies.delete('g_state');
    return res;
  } catch (err) {
    console.error('google callback error', err);
    return fail('Google нэвтрэлт амжилтгүй боллоо.');
  }
}
