/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { findUserByEmail, incrementLoginCount } from '@/lib/db';
import { createSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const { email, authHash } = await req.json();
    if (!email || !authHash) {
      return NextResponse.json({ error: 'Имэйл болон түлхүүр шаардлагатай.' }, { status: 400 });
    }

    const user = await findUserByEmail(String(email).toLowerCase());
    // Constant-ish response: run bcrypt.compare even on a dummy hash for unknown
    // users so timing does not leak whether the account exists.
    const dummy = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8DvH7v0V0Z8t1q1Q1q1Q1q1Q1q1Q1q';
    const ok = await bcrypt.compare(authHash, user?.auth_verifier ?? dummy);

    if (!user || !ok) {
      return NextResponse.json({ error: 'Имэйл эсвэл нууц үг буруу байна.' }, { status: 401 });
    }

    const loginCount = await incrementLoginCount(user.id);
    await createSession({ uid: user.id, email: user.email });

    return NextResponse.json({
      user: {
        email: user.email,
        registeredAt: user.created_at,
        loginCount,
      },
      vault: user.vault_iv && user.vault_ct ? { iv: user.vault_iv, ciphertext: user.vault_ct } : null,
    });
  } catch (err) {
    console.error('login error', err);
    return NextResponse.json({ error: 'Дотоод серверийн алдаа.' }, { status: 500 });
  }
}
