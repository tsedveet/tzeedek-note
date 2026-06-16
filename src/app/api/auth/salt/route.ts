/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Returns the per-user salt the client needs to derive keys before login.
 * For unknown emails we return a deterministic pseudo-salt (HMAC of the email)
 * so attackers cannot enumerate which emails are registered.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { findUserByEmail } from '@/lib/db';

function pseudoSalt(email: string): string {
  const secret = process.env.SESSION_SECRET || 'vaultnote-fallback-pepper';
  return createHmac('sha256', secret).update(`salt:${email.toLowerCase()}`).digest('base64').slice(0, 24);
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Имэйл шаардлагатай.' }, { status: 400 });
    }
    const user = await findUserByEmail(email.toLowerCase());
    return NextResponse.json({ salt: user ? user.salt : pseudoSalt(email) });
  } catch (err) {
    console.error('salt error', err);
    return NextResponse.json({ error: 'Дотоод серверийн алдаа.' }, { status: 500 });
  }
}
