import { pipeline, redisEnabled } from './redis.js';
import { timingSafeEqual, createHash } from 'node:crypto';

// Contador con ventana fija. Usa Redis (compartido entre instancias) y,
// si no está configurado o falla, memoria local (mejor esfuerzo).
const mem = new Map();

export async function over(key, limit, windowSec) {
  if (redisEnabled()) {
    try {
      const [n] = await pipeline([['INCR', key], ['EXPIRE', key, windowSec, 'NX']]);
      return n > limit;
    } catch (e) {
      console.error('limits redis:', e.message);
    }
  }
  const now = Date.now();
  const arr = (mem.get(key) || []).filter((t) => now - t < windowSec * 1000);
  arr.push(now);
  mem.set(key, arr);
  if (mem.size > 5000) mem.clear();
  return arr.length > limit;
}

export function clientIp(req) {
  return String(req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || 'anon').split(',')[0].trim();
}

export const isPid = (v) => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);

const h = (s) => createHash('sha256').update(String(s)).digest();
export function safeEqual(a, b) {
  return timingSafeEqual(h(a), h(b));
}
