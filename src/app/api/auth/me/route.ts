/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Reports the current state:
 *  - a full session   → { user, vault }
 *  - a pending Google identity awaiting the vault passphrase
 *                      → { pendingGoogle: { email, isNewUser, salt } }
 *  - otherwise        → 401
 */

import { NextResponse } from 'next/server';
import { getSession, getPendingGoogle } from '@/lib/session';
import { findUserByEmail } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSession();
    if (session) {
      const user = await findUserByEmail(session.email);
      if (!user) {
        return NextResponse.json({ error: 'Хэрэглэгч олдсонгүй.' }, { status: 401 });
      }
      return NextResponse.json({
        user: { email: user.email, registeredAt: user.created_at, loginCount: user.login_count },
        vault: user.vault_iv && user.vault_ct ? { iv: user.vault_iv, ciphertext: user.vault_ct } : null,
      });
    }

    const pending = await getPendingGoogle();
    if (pending) {
      const existing = await findUserByEmail(pending.email);
      return NextResponse.json({
        pendingGoogle: {
          email: pending.email,
          isNewUser: !existing,
          salt: existing?.salt ?? null,
        },
      });
    }

    return NextResponse.json({ error: 'Нэвтрээгүй байна.' }, { status: 401 });
  } catch (err) {
    console.error('me error', err);
    return NextResponse.json({ error: 'Дотоод серверийн алдаа.' }, { status: 500 });
  }
}
