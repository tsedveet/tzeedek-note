/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Minimal in-memory fixed-window rate limiter to slow down auth brute-force.
 * Per serverless instance (resets on cold start), so it's a lightweight
 * safeguard rather than a hard guarantee — combine with bcrypt's own cost.
 */

import { NextRequest } from 'next/server';

const buckets = new Map<string, { count: number; reset: number }>();

/** Returns true if the request is allowed, false if the limit is exceeded. */
export function rateLimit(key: string, limit = 10, windowMs = 60_000): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}
