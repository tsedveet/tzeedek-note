/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NextResponse } from 'next/server';
import { destroySession, destroyPendingGoogle } from '@/lib/session';

export async function POST() {
  await destroySession();
  await destroyPendingGoogle();
  return NextResponse.json({ ok: true });
}
