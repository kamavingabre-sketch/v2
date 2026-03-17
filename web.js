// ╔══════════════════════════════════════════════════════════╗
// ║     WEB.JS — HTTP Server & Router                        ║
// ║     Hallo Johor Dashboard Admin                          ║
// ╚══════════════════════════════════════════════════════════╝

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ── Local modules ──────────────────────────────────────────
import { createSession, validateSession, deleteSession, parseCookies, parseBody, parseJSONBody } from './web-auth.js';
import { pageLogin, pageDashboard } from './web-pages.js';
import { handleExcelExport } from './web-excel.js';
import {
  queueFeedback,
  getLivechatSessions,
  addLivechatMessage,
  closeLivechatSessionById,
  markLivechatRead,
  queueLivechatReply,
} from './store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Config ───────────────────────────────────────────────
const CONFIG = {
  PORT: process.env.PORT || process.env.WEB_PORT || 3000,
  ADMIN_USERNAME: process.env.ADMIN_USER || 'admin',
  ADMIN_PASSWORD: process.env.ADMIN_PASS || 'medanjohor2025',
  DATA_DIR: './data',
  SESSION_EXPIRE_HOURS: 8,
};

// ─── Data Helpers ─────────────────────────────────────────
const readJSON = (file) => {
  const p = path.join(__dirname, CONFIG.DATA_DIR, file);
  if (!fs.existsSync(p)) return {};
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return {}; }
};

const getLaporan = () => {
  const d = readJSON('laporan_archive.json');
  return (d.laporan || []).sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
};

const getGroups = () => (readJSON('laporan_groups.json').groups || []);

// ─── Foto feedback dir ────────────────────────────────────
const FOTO_FEEDBACK_DIR = path.join(__dirname, CONFIG.DATA_DIR, 'foto_feedback');
if (!fs.existsSync(FOTO_FEEDBACK_DIR)) fs.mkdirSync(FOTO_FEEDBACK_DIR, { recursive: true });

// ─── SSE Clients & Broadcaster ───────────────────────────
const sseClients = new Set();

const broadcastUpdate = () => {
  const data = JSON.stringify({ laporan: getLaporan() });
  for (const client of sseClients) {
    try { client.write(`event: update\ndata: ${data}\n\n`); }
    catch { sseClients.delete(client); }
  }
};

const broadcastLivechat = () => {
  const data = JSON.stringify({ sessions: getLivechatSessions() });
  for (const client of sseClients) {
    try { client.write(`event: livechat\ndata: ${data}\n\n`); }
    catch { sseClients.delete(client); }
  }
};

export const broadcastLivechatNew = (name, text) => {
  const data = JSON.stringify({ name, text });
  for (const client of sseClients) {
    try { client.write(`event: livechat_new\ndata: ${data}\n\n`); }
    catch { sseClients.delete(client); }
  }
};

// ─── File Watcher (SSE trigger) ───────────────────────────
const startWatcher = () => {
  if (!fs.existsSync(path.join(__dirname, CONFIG.DATA_DIR))) {
    fs.mkdirSync(path.join(__dirname, CONFIG.DATA_DIR), { recursive: true });
  }

  const laporanFile = path.join(__dirname, CONFIG.DATA_DIR, 'laporan_archive.json');
  if (!fs.existsSync(laporanFile)) {
    fs.writeFileSync(laporanFile, JSON.stringify({ laporan: [] }), 'utf8');
  }
  let debounce = null;
  fs.watch(laporanFile, () => {
    clearTimeout(debounce);
    debounce = setTimeout(broadcastUpdate, 300);
  });

  const lcFile = path.join(__dirname, CONFIG.DATA_DIR, 'livechat_sessions.json');
  if (!fs.existsSync(lcFile)) fs.writeFileSync(lcFile, JSON.stringify({ sessions: [] }), 'utf8');
  let lcDebounce = null;
  fs.watch(lcFile, () => {
    clearTimeout(lcDebounce);
    lcDebounce = setTimeout(broadcastLivechat, 150);
  });

  console.log(`  👁️  Memantau: ${laporanFile}`);
};

// ─── HTTP Server ──────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const url_    = new URL(req.url, 'http://localhost');
  const path_   = url_.pathname;
  const cookies = parseCookies(req);
  const authed  = validateSession(cookies.session);

  const send = (code, body, type = 'text/html; charset=utf-8', extra = {}) => {
    res.writeHead(code, { 'Content-Type': type, ...extra });
    res.end(body);
  };

  // ── Auth routes ──────────────────────────────────────────
  if (path_ === '/login' && req.method === 'GET') return send(200, pageLogin());

  if (path_ === '/login' && req.method === 'POST') {
    const body = await parseBody(req);
    if (body.username === CONFIG.ADMIN_USERNAME && body.password === CONFIG.ADMIN_PASSWORD) {
      const token = createSession(CONFIG.SESSION_EXPIRE_HOURS);
      return send(302, '', 'text/plain', {
        'Set-Cookie': `session=${token}; HttpOnly; Path=/; Max-Age=${CONFIG.SESSION_EXPIRE_HOURS * 3600}`,
        'Location': '/'
      });
    }
    return send(200, pageLogin('Username atau password salah!'));
  }

  if (path_ === '/logout') {
    deleteSession(cookies.session);
    return send(302, '', 'text/plain', {
      'Set-Cookie': 'session=; HttpOnly; Path=/; Max-Age=0',
      'Location': '/login'
    });
  }

  if (!authed) return send(302, '', 'text/plain', { 'Location': '/login' });

  // ── SSE endpoint ─────────────────────────────────────────
  if (path_ === '/sse') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.write(': connected\n\n');
    sseClients.add(res);

    // Initial data burst
    res.write(`event: update\ndata: ${JSON.stringify({ laporan: getLaporan() })}\n\n`);
    res.write(`event: livechat\ndata: ${JSON.stringify({ sessions: getLivechatSessions() })}\n\n`);

    // Heartbeat (keep connection alive through proxies)
    const heartbeat = setInterval(() => {
      try { res.write(': ping\n\n'); }
      catch { clearInterval(heartbeat); sseClients.delete(res); }
    }, 25000);

    req.on('close', () => {
      clearInterval(heartbeat);
      sseClients.delete(res);
    });
    return;
  }

  // ── Dashboard ────────────────────────────────────────────
  if (path_ === '/') return send(200, pageDashboard(getLaporan(), getGroups()));

  // ── API: Laporan ─────────────────────────────────────────
  if (path_ === '/api/laporan') {
    return send(200, JSON.stringify(getLaporan()), 'application/json');
  }

  // ── API: Kirim Feedback ke Pelapor ───────────────────────
  if (path_ === '/api/feedback' && req.method === 'POST') {
    try {
      const body = await parseJSONBody(req);
      const { laporanId, pelapor, namaPelapor, pesan, foto_base64, foto_mime } = body;

      if (!pelapor || !pesan?.trim()) {
        return send(400, JSON.stringify({ ok: false, error: 'Data tidak lengkap' }), 'application/json');
      }

      let fotoPath = null;
      if (foto_base64) {
        const ext = (foto_mime || 'image/jpeg').split('/')[1]?.replace('jpeg','jpg') || 'jpg';
        const fname = `feedback_${Date.now()}.${ext}`;
        const fpath = path.join(FOTO_FEEDBACK_DIR, fname);
        fs.writeFileSync(fpath, Buffer.from(foto_base64, 'base64'));
        fotoPath = fpath;
      }

      queueFeedback({ laporanId, pelapor, namaPelapor, pesan: pesan.trim(), fotoPath });
      return send(200, JSON.stringify({ ok: true }), 'application/json');
    } catch (err) {
      return send(500, JSON.stringify({ ok: false, error: err.message }), 'application/json');
    }
  }

  // ── API: LiveChat – Get sessions ─────────────────────────
  if (path_ === '/api/livechat/sessions') {
    return send(200, JSON.stringify(getLivechatSessions()), 'application/json');
  }

  // ── API: LiveChat – Admin reply ──────────────────────────
  if (path_ === '/api/livechat/reply' && req.method === 'POST') {
    try {
      const body = await parseJSONBody(req);
      const { sessionId, text } = body;
      if (!sessionId || !text?.trim()) {
        return send(400, JSON.stringify({ ok: false, error: 'Data tidak lengkap' }), 'application/json');
      }
      const sessions = getLivechatSessions();
      const session  = sessions.find(s => s.id === sessionId);
      if (!session) return send(404, JSON.stringify({ ok: false, error: 'Sesi tidak ditemukan' }), 'application/json');
      if (session.status === 'closed') return send(400, JSON.stringify({ ok: false, error: 'Sesi sudah ditutup' }), 'application/json');

      addLivechatMessage(session.jid, 'admin', text.trim());
      queueLivechatReply({ jid: session.jid, text: text.trim() });
      return send(200, JSON.stringify({ ok: true }), 'application/json');
    } catch (err) {
      return send(500, JSON.stringify({ ok: false, error: err.message }), 'application/json');
    }
  }

  // ── API: LiveChat – Close session ────────────────────────
  if (path_ === '/api/livechat/close' && req.method === 'POST') {
    try {
      const body = await parseJSONBody(req);
      const { sessionId } = body;
      if (!sessionId) return send(400, JSON.stringify({ ok: false, error: 'sessionId diperlukan' }), 'application/json');

      const session = getLivechatSessions().find(s => s.id === sessionId);
      if (!session) return send(404, JSON.stringify({ ok: false, error: 'Sesi tidak ditemukan' }), 'application/json');

      closeLivechatSessionById(sessionId);
      queueLivechatReply({
        jid: session.jid,
        text: `✅ Sesi LiveChat Anda telah ditutup oleh admin.\n\nTerima kasih sudah menghubungi *Kecamatan Medan Johor*! 🙏\n\nKetik *menu* untuk kembali ke menu utama.`
      });
      return send(200, JSON.stringify({ ok: true }), 'application/json');
    } catch (err) {
      return send(500, JSON.stringify({ ok: false, error: err.message }), 'application/json');
    }
  }

  // ── API: LiveChat – Mark read ────────────────────────────
  if (path_ === '/api/livechat/read' && req.method === 'POST') {
    try {
      const body = await parseJSONBody(req);
      markLivechatRead(body.sessionId);
      return send(200, JSON.stringify({ ok: true }), 'application/json');
    } catch {
      return send(500, JSON.stringify({ ok: false }), 'application/json');
    }
  }

  // ── Export Excel ─────────────────────────────────────────
  if (path_ === '/export/excel') {
    try {
      await handleExcelExport(res, getLaporan(), CONFIG.DATA_DIR);
    } catch (err) {
      send(500, `Export gagal: ${err.message}`, 'text/plain');
    }
    return;
  }

  // ── Serve foto laporan ───────────────────────────────────
  if (path_.startsWith('/foto/')) {
    const filename = path_.replace('/foto/', '').replace(/[^a-zA-Z0-9._-]/g, '');
    if (!filename) return send(400, 'Bad Request', 'text/plain');
    const fotoFile = path.join(__dirname, CONFIG.DATA_DIR, 'foto', filename);
    if (!fs.existsSync(fotoFile)) return send(404, 'Foto tidak ditemukan', 'text/plain');
    const ext = filename.split('.').pop().toLowerCase();
    const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'public, max-age=86400' });
    return res.end(fs.readFileSync(fotoFile));
  }

  // ── Serve foto livechat ──────────────────────────────────
  if (path_.startsWith('/foto-livechat/')) {
    const filename = path_.replace('/foto-livechat/', '').replace(/[^a-zA-Z0-9._-]/g, '');
    if (!filename) return send(400, 'Bad Request', 'text/plain');
    const fotoFile = path.join(__dirname, CONFIG.DATA_DIR, 'foto_livechat', filename);
    if (!fs.existsSync(fotoFile)) return send(404, 'Foto tidak ditemukan', 'text/plain');
    const ext = filename.split('.').pop().toLowerCase();
    const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'public, max-age=86400' });
    return res.end(fs.readFileSync(fotoFile));
  }

  return send(404, '404 Not Found', 'text/plain');
});

// ─── Start ────────────────────────────────────────────────
server.listen(CONFIG.PORT, () => {
  console.log(`\n╔══════════════════════════════════════════╗`);
  console.log(`║  🌐  Dashboard Hallo Johor               ║`);
  console.log(`║  ✅  Berjalan di http://localhost:${CONFIG.PORT}   ║`);
  console.log(`║  👤  Username : ${CONFIG.ADMIN_USERNAME.padEnd(24)}║`);
  console.log(`║  🔑  Password : ${CONFIG.ADMIN_PASSWORD.padEnd(24)}║`);
  console.log(`║  📡  SSE      : Real-time aktif          ║`);
  console.log(`╚══════════════════════════════════════════╝\n`);
  startWatcher();
});
