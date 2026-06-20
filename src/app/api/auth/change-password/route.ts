/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Change the master passphrase. The client re-derives keys + re-encrypts the
 * whole vault with the new passphrase; the server verifies the old auth hash,
 * then atomically stores the new salt, verifier and ciphertext.
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/session';
import { findUserByEmail, updatePassphrase } from '@/lib/db';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    if (!rateLimit(`changepw:${clientIp(req)}`, 8, 60_000)) {
      return NextResponse.json({ error: 'Хэт олон оролдлого. Түр хүлээнэ үү.' }, { status: 429 });
    }

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Нэвтрээгүй байна.' }, { status: 401 });
    }

    const { currentAuthHash, newSalt, newAuthHash, vault } = await req.json();
    if (!currentAuthHash || !newSalt || !newAuthHash || !vault?.iv || !vault?.ciphertext) {
      return NextResponse.json({ error: 'Мэдээлэл дутуу байна.' }, { status: 400 });
    }

    const user = await findUserByEmail(session.email);
    if (!user) {
      return NextResponse.json({ error: 'Хэрэглэгч олдсонгүй.' }, { status: 404 });
    }

    const ok = await bcrypt.compare(currentAuthHash, user.auth_verifier);
    if (!ok) {
      return NextResponse.json({ error: 'Одоогийн нууц үг буруу байна.' }, { status: 401 });
    }

    const newVerifier = await bcrypt.hash(newAuthHash, 10);
    await updatePassphrase(user.id, newSalt, newVerifier, vault.iv, vault.ciphertext);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('change-password error', err);
    return NextResponse.json({ error: 'Дотоод серверийн алдаа.' }, { status: 500 });
  }
}
