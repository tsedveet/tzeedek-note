/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Finishes a NEW Google user's signup: authorized by the pending-google cookie,
 * it stores the salt + bcrypt(authHash) + encrypted vault and opens a session.
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createUser, findUserByEmail } from '@/lib/db';
import { getPendingGoogle, createSession, destroyPendingGoogle } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const pending = await getPendingGoogle();
    if (!pending) {
      return NextResponse.json({ error: 'Google баталгаажуулалт хугацаа дууссан. Дахин нэвтэрнэ үү.' }, { status: 401 });
    }

    const { salt, authHash, vault } = await req.json();
    if (!salt || !authHash || !vault?.iv || !vault?.ciphertext) {
      return NextResponse.json({ error: 'Мэдээлэл дутуу байна.' }, { status: 400 });
    }

    if (await findUserByEmail(pending.email)) {
      return NextResponse.json({ error: 'Энэ имэйл аль хэдийн бүртгэлтэй байна.' }, { status: 409 });
    }

    const authVerifier = await bcrypt.hash(authHash, 10);
    const user = await createUser({
      email: pending.email,
      salt,
      authVerifier,
      vaultIv: vault.iv,
      vaultCt: vault.ciphertext,
    });

    await createSession({ uid: user.id, email: user.email });
    await destroyPendingGoogle();

    return NextResponse.json({
      user: { email: user.email, registeredAt: user.created_at, loginCount: user.login_count },
    });
  } catch (err) {
    console.error('google register error', err);
    return NextResponse.json({ error: 'Дотоод серверийн алдаа.' }, { status: 500 });
  }
}
