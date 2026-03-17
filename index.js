// ╔══════════════════════════════════════════════════════════╗
// ║     WhatsApp Bot - Layanan Kecamatan Medan Johor         ║
// ║     Powered by Baileys + Node.js                         ║
// ║     Author: Bot Pelayanan Digital                        ║
// ╚══════════════════════════════════════════════════════════╝

import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  Browsers
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import readline from 'readline';
import fs from 'fs';
import { handleMessage } from './handler.js';
import { getPendingFeedbacks, markFeedbackDone, getPendingLivechatReplies, markLivechatReplyDone, addLivechatMessage, closeLivechatSession } from './store.js';
import logger from './logger.js';

// ─── Configuration ────────────────────────────────────────
const CONFIG = {
  AUTH_DIR: './auth_info_baileys',
  RECONNECT_DELAY: 5000,
  PAIRING_TIMEOUT: 120,
  MAX_RECONNECT_ATTEMPTS: 10,
};

// Silent pino logger (supaya tidak flood console)
const pinoLogger = pino({ level: 'silent' });

// ─── Readline Helper ──────────────────────────────────────
const question = (prompt) => {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
};

// ─── Delay ───────────────────────────────────────────────
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ─── Track Reconnect ─────────────────────────────────────
let reconnectCount = 0;

// ─── Feedback Worker ──────────────────────────────────────
// Poll feedback_queue.json setiap 5 detik, kirim WA ke pelapor
let feedbackInterval = null;
let livechatReplyInterval = null;

function startFeedbackWorker(sock) {
  // Bersihkan interval lama jika ada (reconnect)
  if (feedbackInterval) clearInterval(feedbackInterval);

  feedbackInterval = setInterval(async () => {
    let pending;
    try { pending = getPendingFeedbacks(); }
    catch { return; }

    for (const fb of pending) {
      try {
        const jid = fb.pelapor.includes('@') ? fb.pelapor : `${fb.pelapor}@s.whatsapp.net`;
        const noLaporan = String(fb.laporanId || '').padStart(4, '0');

        const headerText =
          `✅ *Pembaruan Laporan #${noLaporan}*\n` +
          `Halo ${fb.namaPelapor || 'Bapak/Ibu'}, berikut tanggapan dari *Kecamatan Medan Johor*:\n\n` +
          `${fb.pesan}\n\n` +
          `_Terima kasih telah menggunakan layanan Hallo Johor_ 🏙️`;

        if (fb.fotoPath && fs.existsSync(fb.fotoPath)) {
          // Kirim pesan dengan foto
          const imgBuffer = fs.readFileSync(fb.fotoPath);
          await sock.sendMessage(jid, {
            image: imgBuffer,
            caption: headerText,
            mimetype: 'image/jpeg',
          });
        } else {
          // Kirim teks saja
          await sock.sendMessage(jid, { text: headerText });
        }

        markFeedbackDone(fb.id, 'done');
        logger.success('FEEDBACK', `Balasan terkirim ke ${jid}`, `Laporan #${noLaporan}`);

      } catch (err) {
        markFeedbackDone(fb.id, 'failed');
        logger.error('FEEDBACK', `Gagal kirim balasan ke ${fb.pelapor}`, err.message);
      }

      // Delay antar pesan agar tidak spam
      await delay(1500);
    }
  }, 5000);

  logger.info('FEEDBACK', '📬 Feedback worker aktif (poll setiap 5 detik)');
}

// ─── LiveChat Reply Worker ─────────────────────────────────
// Poll livechat_replies.json setiap 2 detik — near-instant delivery
function startLivechatReplyWorker(sock) {
  if (livechatReplyInterval) clearInterval(livechatReplyInterval);

  livechatReplyInterval = setInterval(async () => {
    let pending;
    try { pending = getPendingLivechatReplies(); }
    catch { return; }

    for (const reply of pending) {
      try {
        const jid = reply.jid.includes('@') ? reply.jid : `${reply.jid}@s.whatsapp.net`;
        await sock.sendMessage(jid, { text: reply.text });
        markLivechatReplyDone(reply.id, 'sent');
        logger.success('LIVECHAT', `Reply terkirim ke ${jid}`, `"${reply.text.substring(0, 40)}..."`);
      } catch (err) {
        markLivechatReplyDone(reply.id, 'failed');
        logger.error('LIVECHAT', `Gagal kirim reply ke ${reply.jid}`, err.message);
      }
      await delay(300);
    }
  }, 2000); // 2 detik untuk near-instant delivery

  // Worker untuk menutup sesi yang di-close dari dashboard
  setInterval(() => {
    try {
      const closedFile = './data/livechat_close_queue.json';
      if (!fs.existsSync(closedFile)) return;
      const data = JSON.parse(fs.readFileSync(closedFile, 'utf8'));
      const pending = (data.queue || []).filter(c => c.status === 'pending');
      if (!pending.length) return;
      pending.forEach(async (c) => {
        try {
          const jid = c.jid.includes('@') ? c.jid : `${c.jid}@s.whatsapp.net`;
          await sock.sendMessage(jid, { text: `✅ Sesi LiveChat Anda telah ditutup oleh admin.\n\nTerima kasih! Ketik *menu* untuk kembali ke menu utama.` });
          c.status = 'done';
          fs.writeFileSync(closedFile, JSON.stringify(data, null, 2), 'utf8');
          // Clear session
          const { clearSession } = await import('./store.js');
          clearSession(jid);
        } catch {}
      });
    } catch {}
  }, 3000);

  logger.info('LIVECHAT', '💬 LiveChat reply worker aktif (poll setiap 2 detik)');
}

// ─── Start Bot ───────────────────────────────────────────
async function startBot() {
  logger.banner();
  logger.info('BOOT', 'Inisialisasi sistem bot...');
  await delay(500);

  // Load auth state
  const { state, saveCreds } = await useMultiFileAuthState(CONFIG.AUTH_DIR);
  logger.info('AUTH', 'Auth state dimuat', CONFIG.AUTH_DIR);

  // Fetch latest Baileys version
  const { version, isLatest } = await fetchLatestBaileysVersion();
  logger.info('VERSION', `Baileys v${version.join('.')}`, isLatest ? '(latest)' : '(outdated)');

  // Create WA Socket
  const sock = makeWASocket({
    version,
    logger: pinoLogger,
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pinoLogger),
    },
    browser: Browsers.ubuntu('Chrome'),
    syncFullHistory: false,
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: false,
    getMessage: async () => {
      return { conversation: 'hello' };
    }
  });

  // ─── Pairing Code Handler ─────────────────────────────
  if (!sock.authState.creds.registered) {
    await delay(2000); // Delay penting agar handshake tidak error

    logger.divider();
    logger.info('PAIR', 'Akun belum terdaftar. Memulai proses Pairing Code...');
    logger.divider();

    // Railway / non-interactive: baca dari env var PHONE_NUMBER
    // Lokal: input manual via terminal
    let phoneNumber;
    if (process.env.PHONE_NUMBER) {
      phoneNumber = process.env.PHONE_NUMBER;
      logger.info('PAIR', `Menggunakan PHONE_NUMBER dari environment: ${phoneNumber}`);
    } else {
      phoneNumber = await question(
        '\n📱 Masukkan nomor WhatsApp (format: 628xxxxxxxxxx): '
      );
    }

    phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
    if (!phoneNumber.startsWith('62')) {
      phoneNumber = '62' + phoneNumber.replace(/^0/, '');
    }

    logger.info('PAIR', `Nomor yang digunakan: +${phoneNumber}`);
    logger.info('PAIR', 'Meminta pairing code...');

    await delay(3000); // Delay untuk stabilisasi koneksi sebelum request

    try {
      const code = await sock.requestPairingCode(phoneNumber);
      const formattedCode = code?.match(/.{1,4}/g)?.join('-') || code;

      logger.divider();
      console.log(`\n`);
      console.log(`  ╔══════════════════════════════╗`);
      console.log(`  ║   🔑  PAIRING CODE ANDA      ║`);
      console.log(`  ║                              ║`);
      console.log(`  ║      \x1b[33m\x1b[1m${formattedCode}\x1b[0m          ║`);
      console.log(`  ║                              ║`);
      console.log(`  ╚══════════════════════════════╝`);
      console.log(`\n`);
      logger.info('PAIR', 'Cara pairing:');
      logger.info('PAIR', '1. Buka WhatsApp di HP');
      logger.info('PAIR', '2. Tap tiga titik > Perangkat Tertaut');
      logger.info('PAIR', '3. Tap "Tautkan Perangkat"');
      logger.info('PAIR', '4. Masukkan kode pairing di atas');
      logger.divider();
      logger.info('PAIR', `Kode kedaluwarsa dalam ${CONFIG.PAIRING_TIMEOUT} detik...`);
    } catch (err) {
      logger.error('PAIR', 'Gagal mendapatkan pairing code', err.message);
      logger.warn('PAIR', 'Mencoba restart dalam 5 detik...');
      await delay(5000);
      return startBot();
    }
  }

  // ─── Connection Update ────────────────────────────────
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, isOnline } = update;

    if (connection === 'connecting') {
      logger.state('CONNECTING', 'Menghubungkan ke server WhatsApp...');
    }

    if (connection === 'open') {
      reconnectCount = 0;
      const botJid = sock.user?.id;
      const botName = sock.user?.name;
      logger.success('CONNECTED', `Bot terhubung!`, `${botName} (${botJid})`);
      logger.divider();
      logger.success('READY', '🚀 Bot siap menerima pesan!');
      logger.info('READY', 'Ketik Ctrl+C untuk menghentikan bot');
      logger.divider();
      startFeedbackWorker(sock);
      startLivechatReplyWorker(sock);
    }

    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
      logger.warn('CONNECTION', `Koneksi terputus`, `Kode: ${reason}`);

      if (reason === DisconnectReason.badSession) {
        logger.error('AUTH', 'Sesi rusak! Hapus folder auth_info_baileys dan jalankan ulang.');
        process.exit(1);
      } else if (reason === DisconnectReason.connectionReplaced) {
        logger.error('AUTH', 'Sesi digantikan perangkat lain. Bot berhenti.');
        process.exit(1);
      } else if (reason === DisconnectReason.loggedOut) {
        logger.error('AUTH', 'Bot di-logout! Hapus folder auth dan jalankan ulang.');
        process.exit(1);
      } else {
        logger.warn('RECONNECT', `Disconnect (${reason}). Mencoba reconnect...`);
        await scheduleReconnect();
      }
    }

    if (isOnline !== undefined) {
      logger.state('ONLINE STATUS', isOnline ? '🟢 Online' : '🔴 Offline');
    }
  });

  // ─── Credentials Update ───────────────────────────────
  sock.ev.on('creds.update', async () => {
    await saveCreds();
    logger.info('AUTH', 'Credentials disimpan');
  });

  // ─── Message Handler ──────────────────────────────────
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (msg.key.remoteJid === 'status@broadcast') continue;
      if (!msg.message) continue;

      try {
        await handleMessage(sock, msg);
      } catch (err) {
        logger.error('HANDLER', `Error memproses pesan`, err.message);
        console.error(err);
      }
    }
  });

  // ─── Group Events ─────────────────────────────────────
  sock.ev.on('groups.update', (updates) => {
    for (const update of updates) {
      logger.info('GROUP', `Update grup: ${update.id}`, JSON.stringify(update).substring(0, 80));
    }
  });

  sock.ev.on('group-participants.update', ({ id, participants, action }) => {
    logger.info('GROUP', `Grup ${id}: ${action}`, participants.join(', '));
  });

  // ─── Reconnect Scheduler ──────────────────────────────
  async function scheduleReconnect() {
    if (reconnectCount >= CONFIG.MAX_RECONNECT_ATTEMPTS) {
      logger.error('RECONNECT', `Gagal reconnect setelah ${CONFIG.MAX_RECONNECT_ATTEMPTS} percobaan. Bot berhenti.`);
      process.exit(1);
    }
    reconnectCount++;
    const waitTime = CONFIG.RECONNECT_DELAY * reconnectCount;
    logger.info('RECONNECT', `Percobaan ke-${reconnectCount}/${CONFIG.MAX_RECONNECT_ATTEMPTS}`, `tunggu ${waitTime / 1000}s`);
    await delay(waitTime);
    startBot();
  }

  return sock;
}

// ─── Process Handlers ─────────────────────────────────────
process.on('uncaughtException', (err) => {
  logger.error('SYSTEM', 'Uncaught Exception', err.message);
  console.error(err);
});

process.on('unhandledRejection', (err) => {
  logger.error('SYSTEM', 'Unhandled Rejection', err?.message || String(err));
});

process.on('SIGINT', () => {
  logger.warn('SYSTEM', 'Menerima SIGINT. Bot dihentikan dengan aman...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.warn('SYSTEM', 'Menerima SIGTERM. Bot dihentikan...');
  process.exit(0);
});

// ─── Run ──────────────────────────────────────────────────
startBot().catch(err => {
  logger.error('BOOT', 'Gagal menjalankan bot', err.message);
  console.error(err);
  process.exit(1);
});
