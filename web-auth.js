// ═══════════════════════════════════════════════════════════
//   WEB-AUTH.JS — Session Management & Request Utilities
//   Hallo Johor Dashboard
// ═══════════════════════════════════════════════════════════

import crypto from 'crypto';

// ─── In-Memory Session Store ──────────────────────────────
const sessions = new Map();

/**
 * Buat sesi baru, kembalikan token.
 * @param {number} expireHours - Durasi sesi dalam jam
 */
export const createSession = (expireHours = 8) => {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { createdAt: Date.now(), expireHours });
  return token;
};

/**
 * Validasi token sesi.
 * @param {string} token
 * @returns {boolean}
 */
export const validateSession = (token) => {
  if (!token || !sessions.has(token)) return false;
  const s = sessions.get(token);
  if (Date.now() - s.createdAt > s.expireHours * 3600000) {
    sessions.delete(token);
    return false;
  }
  return true;
};

/**
 * Hapus sesi (logout).
 * @param {string} token
 */
export const deleteSession = (token) => {
  sessions.delete(token);
};

// ─── Cookie & Body Parsers ────────────────────────────────

/**
 * Parse header Cookie menjadi object key-value.
 * @param {import('http').IncomingMessage} req
 * @returns {Record<string, string>}
 */
export const parseCookies = (req) => {
  const raw = req.headers.cookie || '';
  return Object.fromEntries(
    raw.split(';').map(c => {
      const [k, ...v] = c.trim().split('=');
      return [k?.trim(), decodeURIComponent(v.join('='))];
    }).filter(([k]) => k)
  );
};

/**
 * Baca body request sebagai application/x-www-form-urlencoded.
 * @param {import('http').IncomingMessage} req
 * @returns {Promise<Record<string, string>>}
 */
export const parseBody = (req) => new Promise(resolve => {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    try { resolve(Object.fromEntries(new URLSearchParams(body))); }
    catch { resolve({}); }
  });
});

/**
 * Baca body request sebagai JSON.
 * @param {import('http').IncomingMessage} req
 * @returns {Promise<any>}
 */
export const parseJSONBody = (req) => new Promise(resolve => {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    try { resolve(JSON.parse(body)); }
    catch { resolve({}); }
  });
});
