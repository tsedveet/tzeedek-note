/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Kicks off Google OAuth: stores PKCE verifier + state in short-lived cookies
 * and redirects the browser to Google's consent screen.
 */

import { NextRequest, NextResponse } from 'next/server';
import { isGoogleConfigured, createPkce, randomState, buildAuthorizeUrl } from '@/lib/google-oauth';

export async function GET(req: NextRequest) {
  if (!isGoogleConfigured()) {
    return NextResponse.redirect(`${req.nextUrl.origin}/?auth_error=${encodeURIComponent('Google нэвтрэлт тохируулагдаагүй байна.')}`);
  }

  const origin = req.nextUrl.origin;
  const { verifier, challenge } = createPkce();
  const state = randomState();

  const res = NextResponse.redirect(buildAuthorizeUrl({ origin, state, challenge }));
  const secure = process.env.NODE_ENV === 'production';
  const opts = { httpOnly: true, secure, sameSite: 'lax' as const, path: '/', maxAge: 600 };
  res.cookies.set('g_pkce', verifier, opts);
  res.cookies.set('g_state', state, opts);
  return res;
}
