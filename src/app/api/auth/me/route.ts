/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Returns the current session's user + encrypted vault blob (if logged in).
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { findUserByEmail } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Нэвтрээгүй байна.' }, { status: 401 });
    }

    const user = await findUserByEmail(session.email);
    if (!user) {
      return NextResponse.json({ error: 'Хэрэглэгч олдсонгүй.' }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        email: user.email,
        registeredAt: user.created_at,
        loginCount: user.login_count,
      },
      vault: user.vault_iv && user.vault_ct ? { iv: user.vault_iv, ciphertext: user.vault_ct } : null,
    });
  } catch (err) {
    console.error('me error', err);
    return NextResponse.json({ error: 'Дотоод серверийн алдаа.' }, { status: 500 });
  }
}
