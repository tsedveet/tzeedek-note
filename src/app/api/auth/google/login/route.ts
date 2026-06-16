/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Finishes an EXISTING Google user's login: authorized by the pending-google
 * cookie, it verifies the vault passphrase and returns the encrypted vault.
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { findUserByEmail, incrementLoginCount } from '@/lib/db';
import { getPendingGoogle, createSession, destroyPendingGoogle } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const pending = await getPendingGoogle();
    if (!pending) {
      return NextResponse.json({ error: 'Google баталгаажуулалт хугацаа дууссан. Дахин нэвтэрнэ үү.' }, { status: 401 });
    }

    const { authHash } = await req.json();
    if (!authHash) {
      return NextResponse.json({ error: 'Vault нууц үг шаардлагатай.' }, { status: 400 });
    }

    const user = await findUserByEmail(pending.email);
    if (!user) {
      return NextResponse.json({ error: 'Хэрэглэгч олдсонгүй.' }, { status: 404 });
    }

    const ok = await bcrypt.compare(authHash, user.auth_verifier);
    if (!ok) {
      return NextResponse.json({ error: 'Vault нууц үг буруу байна.' }, { status: 401 });
    }

    const loginCount = await incrementLoginCount(user.id);
    await createSession({ uid: user.id, email: user.email });
    await destroyPendingGoogle();

    return NextResponse.json({
      user: { email: user.email, registeredAt: user.created_at, loginCount },
      vault: user.vault_iv && user.vault_ct ? { iv: user.vault_iv, ciphertext: user.vault_ct } : null,
    });
  } catch (err) {
    console.error('google login error', err);
    return NextResponse.json({ error: 'Дотоод серверийн алдаа.' }, { status: 500 });
  }
}
