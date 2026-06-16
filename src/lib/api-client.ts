/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Thin browser-side wrapper around the VaultNote API routes.
 */

import { Note, PasswordEntry, AIPrompt, VaultLog, VaultUser } from '@/types';
import { EncryptedBlob } from './crypto-client';

export interface VaultData {
  notes: Note[];
  passwords: PasswordEntry[];
  prompts: AIPrompt[];
  logs: VaultLog[];
}

async function jsonOrThrow<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || 'Сервер дээр алдаа гарлаа.');
  }
  return data as T;
}

/** Fetch the per-user salt needed to derive keys before login. */
export async function fetchSalt(email: string): Promise<{ salt: string }> {
  const res = await fetch('/api/auth/salt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return jsonOrThrow(res);
}

export async function registerVault(params: {
  email: string;
  salt: string;
  authHash: string;
  vault: EncryptedBlob;
}): Promise<{ user: VaultUser }> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return jsonOrThrow(res);
}

export async function loginVault(params: {
  email: string;
  authHash: string;
}): Promise<{ user: VaultUser; vault: EncryptedBlob | null }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return jsonOrThrow(res);
}

export async function fetchSession(): Promise<{
  user: VaultUser;
  vault: EncryptedBlob | null;
} | null> {
  const res = await fetch('/api/auth/me', { method: 'GET' });
  if (res.status === 401) return null;
  return jsonOrThrow(res);
}

export async function saveVault(vault: EncryptedBlob): Promise<void> {
  const res = await fetch('/api/vault', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vault }),
  });
  await jsonOrThrow(res);
}

export async function logoutVault(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST' });
}

export async function deleteVault(): Promise<void> {
  const res = await fetch('/api/vault', { method: 'DELETE' });
  await jsonOrThrow(res);
}
