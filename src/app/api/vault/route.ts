/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Persist (PUT) or wipe (DELETE) the current user's encrypted vault blob.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession, destroySession } from '@/lib/session';
import { saveVaultBlob, deleteUser } from '@/lib/db';

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Нэвтрээгүй байна.' }, { status: 401 });
    }

    const { vault } = await req.json();
    if (!vault?.iv || !vault?.ciphertext) {
      return NextResponse.json({ error: 'Шифрлэгдсэн өгөгдөл буруу байна.' }, { status: 400 });
    }

    await saveVaultBlob(session.uid, vault.iv, vault.ciphertext);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('vault PUT error', err);
    return NextResponse.json({ error: 'Дотоод серверийн алдаа.' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Нэвтрээгүй байна.' }, { status: 401 });
    }
    await deleteUser(session.uid);
    await destroySession();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('vault DELETE error', err);
    return NextResponse.json({ error: 'Дотоод серверийн алдаа.' }, { status: 500 });
  }
}
