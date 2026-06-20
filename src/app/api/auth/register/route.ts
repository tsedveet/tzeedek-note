/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createUser, findUserByEmail } from '@/lib/db';
import { createSession } from '@/lib/session';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    if (!rateLimit(`register:${clientIp(req)}`, 6, 60_000)) {
      return NextResponse.json({ error: 'Хэт олон оролдлого. Түр хүлээгээд дахин оролдоно уу.' }, { status: 429 });
    }
    const { email, salt, authHash, vault } = await req.json();

    if (!email || !salt || !authHash || !vault?.iv || !vault?.ciphertext) {
      return NextResponse.json({ error: 'Бүртгэлийн мэдээлэл дутуу байна.' }, { status: 400 });
    }

    const normalizedEmail = String(email).toLowerCase();
    const existing = await findUserByEmail(normalizedEmail);
    if (existing) {
      return NextResponse.json(
        { error: 'Энэ имэйл хаягаар бүртгэлтэй сейф аль хэдийн үүссэн байна.' },
        { status: 409 },
      );
    }

    const authVerifier = await bcrypt.hash(authHash, 10);
    const user = await createUser({
      email: normalizedEmail,
      salt,
      authVerifier,
      vaultIv: vault.iv,
      vaultCt: vault.ciphertext,
    });

    await createSession({ uid: user.id, email: user.email });

    return NextResponse.json({
      user: {
        email: user.email,
        registeredAt: user.created_at,
        loginCount: user.login_count,
      },
    });
  } catch (err) {
    console.error('register error', err);
    return NextResponse.json({ error: 'Дотоод серверийн алдаа.' }, { status: 500 });
  }
}
