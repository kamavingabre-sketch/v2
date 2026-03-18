// ═══════════════════════════════════════════════
//   HANDLER - Message Processing Logic
// ═══════════════════════════════════════════════

import { downloadMediaMessage } from '@whiskeysockets/baileys';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FOTO_DIR = path.join(__dirname, 'data', 'foto');
if (!fs.existsSync(FOTO_DIR)) fs.mkdirSync(FOTO_DIR, { recursive: true });
const FOTO_LC_DIR = path.join(__dirname, 'data', 'foto_livechat');
if (!fs.existsSync(FOTO_LC_DIR)) fs.mkdirSync(FOTO_LC_DIR, { recursive: true });
import axios from 'axios';
import {
  getSession, setSession, clearSession,
  getLaporanGroups, addLaporanGroup, removeLaporanGroup,
  getNextLaporanId, saveLaporan,
  getGroupRouting,
  getLivechatByJid, startLivechatSession, addLivechatMessage, closeLivechatSession,
  buildKegiatanMenu
} from './store.js';
import {
  MENU_UTAMA, MENU_IMAGE_URL,
  MENU_PERSYARATAN, PERSYARATAN,
  MENU_PBB, MENU_KONTAK,
  MENU_FORMULIR, FORMULIR_LINKS,
  MENU_PROGRAM, MENU_PARIWISATA, WISATA,
  KATEGORI_PENGADUAN, KELURAHAN_LIST,
  buildKategoriMenu, buildKelurahanMenu
} from './menu.js';
import logger from './logger.js';

// Delay helper
const delay = (ms) => new Promise(res => setTimeout(res, ms));

// Get address from coordinates via Nominatim (OpenStreetMap)
const getAddressFromCoords = async (lat, lon) => {
  try {
    const res = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
      { headers: { 'User-Agent': 'BotKecamatanMedanJohor/1.0' }, timeout: 8000 }
    );
    return res.data.display_name || `${lat}, ${lon}`;
  } catch {
    return `Koordinat: ${lat}, ${lon}`;
  }
};

// Fetch image buffer dari URL eksternal (untuk gambar menu)
const fetchImageBuffer = async (url) => {
  try {
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
    return Buffer.from(res.data);
  } catch {
    return null;
  }
};

// Download foto dari pesan WhatsApp menggunakan Baileys (BUKAN via URL mmg)
const downloadWAImage = async (sock, msg) => {
  try {
    const buffer = await downloadMediaMessage(
      msg,           // full message object
      'buffer',      // return as buffer
      {},
      { logger: { info: () => {}, error: () => {}, warn: () => {} }, reuploadRequest: sock.updateMediaMessage }
    );
    return buffer;
  } catch (err) {
    logger.error('MEDIA', 'Gagal download foto dari WA', err.message);
    return null;
  }
};

// Build vCard yang valid untuk Baileys
const buildVCard = (name, phone) => {
  // Pastikan nomor dalam format internasional tanpa +
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${name}`,
    `N:${name};;;`,
    `TEL;type=CELL;type=VOICE;waid=${cleanPhone}:+${cleanPhone}`,
    'END:VCARD'
  ].join('\n');
};

// Keywords trigger menu utama
const GREET_KEYWORDS = [
  'hi', 'hai', 'halo', 'hallo', 'hello',
  'assalamualaikum', 'waalaikumsalam', 'assalam',
  'test', 'tes', 'p', 'ping', 'menu',
  'mulai', 'start', 'help', 'bantuan',
  'hei', 'hey', 'selamat pagi', 'selamat siang',
  'selamat sore', 'selamat malam', 'pagi', 'siang', 'sore', 'malam',
  'bot', 'info', '?', 'ada apa', 'apa ada',
];

const isGreeting = (text) => {
  const lower = text?.toLowerCase().trim() ?? '';
  return GREET_KEYWORDS.some(kw =>
    lower === kw || lower.startsWith(kw + ' ') || lower.includes(kw)
  );
};

// ─── Main Handler ────────────────────────────────────────
export const handleMessage = async (sock, msg) => {
  const jid = msg.key.remoteJid;
  const isGroup = jid.endsWith('@g.us');
  const senderJid = isGroup ? msg.key.participant : jid;
  const pushName = msg.pushName || 'Pengguna';

  const msgContent = msg.message;
  if (!msgContent) return;

  // Unwrap view-once jika ada
  const actualContent = msgContent.viewOnceMessage?.message || msgContent;

  const textMsg = (
    actualContent.conversation ||
    actualContent.extendedTextMessage?.text ||
    actualContent.buttonsResponseMessage?.selectedButtonId ||
    ''
  ).trim();

  const imageMsg = actualContent.imageMessage;
  const locationMsg = actualContent.locationMessage;
  const contactMsg = actualContent.contactMessage || actualContent.contactsArrayMessage;

  // Logging
  let msgType = 'text';
  if (imageMsg) msgType = 'image';
  else if (locationMsg) msgType = 'location';
  else if (contactMsg) msgType = 'contact';
  logger.message(senderJid, pushName, textMsg || null, msgType);

  // Skip pesan sendiri
  if (msg.key.fromMe) return;

  // ─── GROUP ADMIN COMMANDS ───────────────────────────
  if (isGroup) {
    const cmd = textMsg.toLowerCase().trim();

    if (cmd === 'applylaporan') {
      const groupMeta = await sock.groupMetadata(jid).catch(() => null);
      const groupName = groupMeta?.subject || jid;
      const added = addLaporanGroup(jid, groupName);
      if (added) {
        await sendText(sock, jid,
          `✅ *Grup ini telah didaftarkan* sebagai wadah laporan pengaduan!\n\nNama: *${groupName}*\nID: \`${jid}\``
        );
        logger.success('ADMIN', `Grup laporan ditambahkan: ${groupName} (${jid})`);
      } else {
        await sendText(sock, jid, `ℹ️ Grup ini *sudah terdaftar* sebagai wadah laporan.`);
      }
      return;
    }

    if (cmd === 'removelaporan') {
      const removed = removeLaporanGroup(jid);
      if (removed) {
        await sendText(sock, jid, `✅ Grup ini telah *dihapus* dari daftar wadah laporan.`);
        logger.warn('ADMIN', `Grup laporan dihapus: ${jid}`);
      } else {
        await sendText(sock, jid, `ℹ️ Grup ini tidak terdaftar sebagai wadah laporan.`);
      }
      return;
    }

    return; // Abaikan pesan grup lainnya
  }

  // ─── PRIVATE CHAT ───────────────────────────────────
  const session = getSession(senderJid);

  // Alur pengaduan aktif
  if (session?.flow === 'laporan') {
    // Teruskan msg lengkap agar foto bisa di-download
    await handleLaporanFlow(sock, senderJid, pushName, msg, session, {
      textMsg, imageMsg, locationMsg
    });
    return;
  }

  // Alur LiveChat aktif
  if (session?.flow === 'livechat') {
    await handleLivechatFlow(sock, senderJid, pushName, msg, session, { textMsg, imageMsg });
    return;
  }

  // Tidak ada konten yang bisa diproses
  if (!textMsg && !imageMsg && !locationMsg) return;

  // Greeting → tampilkan menu
  if (isGreeting(textMsg) || textMsg === '0') {
    await sendMenuUtama(sock, senderJid, pushName);
    return;
  }

  // ── MENU SELECTION ──
  switch (textMsg) {
    case '1':
      await sendText(sock, senderJid, MENU_PERSYARATAN);
      logger.send(senderJid, 'Menu Persyaratan Surat');
      break;

    case '2':
      clearSession(senderJid);
      setSession(senderJid, { flow: 'laporan', step: 'kategori' });
      await sendText(sock, senderJid, buildKategoriMenu());
      logger.send(senderJid, 'Mulai alur pengaduan');
      break;

    case '3':
      await sendText(sock, senderJid, buildKegiatanMenu());
      logger.send(senderJid, 'Menu Kegiatan');
      break;

    case '4':
      await sendText(sock, senderJid, MENU_PBB);
      logger.send(senderJid, 'Menu PBB');
      break;

    case '5':
      await sendText(sock, senderJid, MENU_KONTAK);
      logger.send(senderJid, 'Menu Kontak');
      break;

    case '6':
      await sendText(sock, senderJid, MENU_FORMULIR);
      logger.send(senderJid, 'Menu Formulir');
      break;

    case '7':
      await sendText(sock, senderJid, MENU_PROGRAM);
      logger.send(senderJid, 'Menu Program Kecamatan');
      break;

    case '8':
      await sendText(sock, senderJid, MENU_PARIWISATA);
      logger.send(senderJid, 'Menu Wisata Medan Johor');
      break;

    case '9': {
      const existing = getLivechatByJid(senderJid);
      if (existing) {
        setSession(senderJid, { flow: 'livechat' });
        await sendText(sock, senderJid,
          `💬 *LIVECHAT ADMIN*\n━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `Anda sudah memiliki sesi LiveChat yang aktif.\n` +
          `Silakan langsung kirim pesan Anda.\n\n` +
          `Ketik *0* untuk keluar dari LiveChat.`
        );
      } else {
        startLivechatSession(senderJid, pushName);
        setSession(senderJid, { flow: 'livechat' });
        await sendText(sock, senderJid,
          `💬 *LIVECHAT ADMIN*\n━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `Halo *${pushName}*! Anda telah terhubung dengan layanan LiveChat Kecamatan Medan Johor.\n\n` +
          `🕐 Jam Layanan LiveChat:\n` +
          `Senin - Kamis: 08.00 - 15.00 WIB\n` +
          `Jumat: 08.00 - 11.30 WIB\n\n` +
          `Silakan ketik pertanyaan atau keperluan Anda. Admin akan segera merespons.\n\n` +
          `Ketik *0* untuk keluar dari LiveChat.`
        );
        logger.success('LIVECHAT', `Sesi baru dimulai oleh ${pushName} (${senderJid})`);
      }
      break;
    }

    case 'W1': case 'w1':
    case 'W2': case 'w2':
    case 'W3': case 'w3':
    case 'W4': case 'w4': {
      const wKey = textMsg.toUpperCase();
      if (WISATA[wKey]) {
        await sendText(sock, senderJid, WISATA[wKey]);
        logger.send(senderJid, `Wisata kategori ${wKey}`);
      }
      break;
    }

    // ── Persyaratan Surat (A–S) ──────────────────────────
    case 'A': case 'a': case 'B': case 'b':
    case 'C': case 'c': case 'D': case 'd':
    case 'E': case 'e': case 'F': case 'f':
    case 'G': case 'g': case 'H': case 'h':
    case 'I': case 'i': case 'J': case 'j':
    case 'K': case 'k': case 'L': case 'l':
    case 'M': case 'm': case 'N': case 'n':
    case 'O': case 'o': case 'P': case 'p':
    case 'Q': case 'q': case 'R': case 'r':
    case 'S': case 's': {
      const key = textMsg.toUpperCase();
      if (PERSYARATAN[key]) {
        await sendText(sock, senderJid, PERSYARATAN[key]);
        logger.send(senderJid, `Persyaratan Surat kode ${key}`);
      }
      break;
    }

    case 'F1': case 'f1':
    case 'F2': case 'f2':
    case 'F3': case 'f3': {
      const key = textMsg.toUpperCase();
      if (FORMULIR_LINKS[key]) {
        await sendText(sock, senderJid, FORMULIR_LINKS[key]);
        logger.send(senderJid, `Link formulir ${key}`);
      }
      break;
    }

    default:
      if (textMsg.length > 0) {
        await sendText(sock, senderJid,
          `❓ Maaf, saya tidak mengerti pesan Anda.\n\nKetik *menu* atau angka *1-8* untuk memilih layanan. 😊`
        );
        logger.warn('BOT', `Pesan tidak dikenali dari ${pushName}`, `"${textMsg}"`);
      }
  }
};

// ─── Laporan Flow Handler ─────────────────────────────────
// msg = full message object (dibutuhkan untuk download foto)
const handleLaporanFlow = async (sock, jid, name, msg, session, { textMsg, imageMsg, locationMsg }) => {
  const step = session.step;

  // Batal kapan saja
  if (textMsg === '0' || textMsg?.toLowerCase() === 'batal') {
    clearSession(jid);
    await sendText(sock, jid, `❌ Pengaduan dibatalkan.\n\nKetik *menu* untuk kembali ke menu utama.`);
    logger.info('LAPORAN', `Pengaduan dibatalkan oleh ${name}`);
    return;
  }

  switch (step) {

    // Step 1: Pilih Kategori
    case 'kategori': {
      const kategori = KATEGORI_PENGADUAN.find(k => k.id === textMsg);
      if (!kategori) {
        await sendText(sock, jid,
          `⚠️ Pilihan tidak valid. Silakan ketik angka *1-7* sesuai kategori.\n\nAtau ketik *0* untuk batal.`
        );
        return;
      }
      setSession(jid, {
        ...session,
        step: 'kelurahan',
        kategori: kategori.label,
        kategoriEmoji: kategori.emoji
      });
      await sendText(sock, jid, buildKelurahanMenu());
      logger.info('LAPORAN', `${name} pilih kategori: ${kategori.label}`);
      break;
    }

    // Step 2: Pilih Kelurahan
    case 'kelurahan': {
      const kel = KELURAHAN_LIST.find(k => k.id === textMsg);
      if (!kel) {
        await sendText(sock, jid,
          `⚠️ Pilihan tidak valid. Ketik angka *1-6* sesuai kelurahan.\n\nAtau ketik *0* untuk batal.`
        );
        return;
      }
      setSession(jid, { ...session, step: 'isi', kelurahan: kel.label });
      await sendText(sock, jid,
        `📝 *ISI LAPORAN*\n━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `Kategori: *${session.kategoriEmoji} ${session.kategori}*\n` +
        `Kelurahan: *${kel.label}*\n\n` +
        `Silakan ketik *uraian laporan* Anda secara detail:\n` +
        `_(jelaskan masalah, lokasi detail, dll)_\n\n` +
        `Atau ketik *0* untuk batal.`
      );
      logger.info('LAPORAN', `${name} pilih kelurahan: ${kel.label}`);
      break;
    }

    // Step 3: Isi laporan teks
    case 'isi': {
      if (!textMsg || textMsg.length < 10) {
        await sendText(sock, jid,
          `⚠️ Uraian terlalu singkat. Mohon jelaskan lebih detail (minimal 10 karakter).\n\nAtau ketik *0* untuk batal.`
        );
        return;
      }
      setSession(jid, { ...session, step: 'foto', isiLaporan: textMsg });
      await sendText(sock, jid,
        `📸 *KIRIM FOTO BUKTI*\n━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `✅ Uraian laporan diterima!\n\n` +
        `Sekarang *kirimkan foto* lokasi/masalah sebagai bukti laporan.\n\n` +
        `⚠️ *Foto wajib dikirimkan* untuk melanjutkan.\n\n` +
        `Atau ketik *0* untuk batal.`
      );
      logger.info('LAPORAN', `${name} isi laporan`);
      break;
    }

    // Step 4: Foto bukti — download langsung via Baileys
    case 'foto': {
      if (!imageMsg) {
        await sendText(sock, jid,
          `⚠️ *Foto belum dikirimkan!*\n\nAnda *wajib* mengirimkan foto sebagai bukti.\n\nSilakan kirim foto sekarang, atau ketik *0* untuk batal.`
        );
        return;
      }

      logger.info('LAPORAN', `${name} mengirim foto — sedang didownload...`);

      // Download foto langsung dari pesan (bukan via URL mmg)
      const fotoBuffer = await downloadWAImage(sock, msg);

      if (!fotoBuffer) {
        await sendText(sock, jid,
          `⚠️ Gagal memproses foto. Coba kirim ulang foto Anda.\n\nAtau ketik *0* untuk batal.`
        );
        return;
      }

      logger.success('LAPORAN', `Foto berhasil didownload (${fotoBuffer.length} bytes)`);

      // Simpan buffer di session (sebagai base64 agar bisa disimpan)
      setSession(jid, {
        ...session,
        step: 'lokasi',
        fotoBuffer: fotoBuffer.toString('base64'),
        fotoMime: imageMsg.mimetype || 'image/jpeg'
      });

      await sendText(sock, jid,
        `📍 *KIRIM LOKASI*\n━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `✅ Foto diterima!\n\n` +
        `Sekarang *bagikan lokasi* kejadian:\n\n` +
        `1. Tap ikon *📎 (Lampiran)*\n` +
        `2. Pilih *"Lokasi"*\n` +
        `3. Pilih *"Kirim Lokasi Anda Saat Ini"*\n\n` +
        `⚠️ *Lokasi wajib dikirimkan* untuk melanjutkan.\n\n` +
        `Atau ketik *0* untuk batal.`
      );
      break;
    }

    // Step 5: Lokasi — proses & kirim ke grup
    case 'lokasi': {
      if (!locationMsg) {
        await sendText(sock, jid,
          `⚠️ *Lokasi belum dikirimkan!*\n\n` +
          `Cara kirim lokasi:\n` +
          `1. Tap ikon *📎 (Lampiran)*\n` +
          `2. Pilih *"Lokasi"*\n` +
          `3. Pilih *"Kirim Lokasi Anda Saat Ini"*\n\n` +
          `Atau ketik *0* untuk batal.`
        );
        return;
      }

      const latitude = locationMsg.degreesLatitude ?? locationMsg.latitude;
      const longitude = locationMsg.degreesLongitude ?? locationMsg.longitude;

      if (!latitude || !longitude) {
        await sendText(sock, jid,
          `⚠️ *Gagal membaca koordinat lokasi!*\n\n` +
          `Silakan coba kirim ulang lokasi Anda:\n` +
          `1. Tap ikon *📎 (Lampiran)*\n` +
          `2. Pilih *"Lokasi"*\n` +
          `3. Pilih *"Kirim Lokasi Anda Saat Ini"*\n\n` +
          `Atau ketik *0* untuk batal.`
        );
        return;
      }

      await sendText(sock, jid, `⏳ Memproses laporan Anda... Mohon tunggu sebentar.`);
      await delay(1000);

      // Ambil alamat dari koordinat
      const alamat = await getAddressFromCoords(latitude, longitude);
      const laporanId = getNextLaporanId();
      const now = new Date();
      const tanggal = now.toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        dateStyle: 'full',
        timeStyle: 'short'
      });

      // Simpan foto ke disk
      let fotoPath = null;
      if (session.fotoBuffer) {
        const ext = (session.fotoMime || 'image/jpeg').includes('png') ? 'png' : 'jpg';
        const fotoFilename = `laporan_${String(laporanId).padStart(4, '0')}.${ext}`;
        const fotoFullPath = path.join(FOTO_DIR, fotoFilename);
        try {
          fs.writeFileSync(fotoFullPath, Buffer.from(session.fotoBuffer, 'base64'));
          fotoPath = `/foto/${fotoFilename}`;
          logger.success('LAPORAN', `Foto disimpan: ${fotoFilename}`);
        } catch (err) {
          logger.error('LAPORAN', 'Gagal simpan foto ke disk', err.message);
        }
      }

      // Simpan arsip laporan
      saveLaporan({
        id: laporanId,
        pelapor: jid,
        namaPelapor: name,
        kategori: session.kategori,
        kelurahan: session.kelurahan,
        isi: session.isiLaporan,
        koordinat: { lat: latitude, lon: longitude },
        alamat,
        fotoPath,
        tanggal: now.toISOString(),
        status: 'terkirim'
      });

      logger.report(jid, name, session.kategori);

      // ── Kirim konfirmasi ke pelapor ──
      await sendText(sock, jid,
        `✅ *LAPORAN BERHASIL DIKIRIM!*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `📋 *No. Laporan: #${String(laporanId).padStart(4, '0')}*\n\n` +
        `${session.kategoriEmoji} *Kategori:* ${session.kategori}\n` +
        `🏘️ *Kelurahan:* ${session.kelurahan}\n` +
        `📍 *Lokasi:* ${alamat}\n` +
        `📅 *Tanggal:* ${tanggal}\n\n` +
        `📝 *Uraian:*\n${session.isiLaporan}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Laporan Anda telah diteruskan ke petugas terkait.\n` +
        `Terima kasih telah berpartisipasi menjaga Kecamatan Medan Johor! 🙏\n` +
        `🏙️ *#MEDANUNTUKSEMUA*\n\n` +
        `Ketik *menu* untuk kembali ke menu utama.`
      );

      // ── Kirim ke grup sesuai routing kategori ──
      const groups = getLaporanGroups();
      if (groups.length === 0) {
        logger.warn('LAPORAN', 'Tidak ada grup laporan terdaftar! Ketik "applylaporan" di grup tujuan.');
        clearSession(jid);
        return;
      }

      // Cek routing: forward ke grup spesifik sesuai kategori jika dikonfigurasi
      const routing = getGroupRouting();
      const routedGroupId = routing[session.kategori];
      let forwardGroups;
      if (routedGroupId) {
        const matched = groups.filter(g => g.id === routedGroupId);
        forwardGroups = matched.length > 0 ? matched : groups; // fallback ke semua jika grup routing sudah dihapus
        if (matched.length === 0) {
          logger.warn('LAPORAN', `Grup routing untuk kategori "${session.kategori}" tidak ditemukan, fallback ke semua grup`);
        } else {
          logger.info('LAPORAN', `Routing aktif: kategori "${session.kategori}" → grup "${matched[0].name}"`);
        }
      } else {
        forwardGroups = groups; // tidak ada routing → forward ke semua grup
      }

      const groupText =
        `📢 *LAPORAN PENGADUAN MASUK*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `📋 *No. Laporan: #${String(laporanId).padStart(4, '0')}*\n` +
        `👤 *Pelapor:* ${name}\n\n` +
        `${session.kategoriEmoji} *Kategori:* ${session.kategori}\n` +
        `🏘️ *Kelurahan:* ${session.kelurahan}\n` +
        `📍 *Lokasi:* ${alamat}\n` +
        `🗺️ *Maps:* https://maps.google.com/?q=${latitude},${longitude}\n` +
        `📅 *Waktu:* ${tanggal}\n\n` +
        `📝 *Uraian Laporan:*\n${session.isiLaporan}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `_Laporan otomatis dari Hallo Johor — Bot Kecamatan Medan Johor_\n` +
        `_#MEDANUNTUKSEMUA_`;

      // Konversi base64 balik ke buffer
      const fotoBuffer = session.fotoBuffer
        ? Buffer.from(session.fotoBuffer, 'base64')
        : null;
      const phone = jid.replace('@s.whatsapp.net', '');
      const vcard = buildVCard(name, phone);

      for (const group of forwardGroups) {
        try {
          // 1. Kirim teks laporan
          await sendText(sock, group.id, groupText);
          await delay(600);

          // 2. Kirim foto bukti (buffer hasil download Baileys)
          if (fotoBuffer) {
            await sock.sendMessage(group.id, {
              image: fotoBuffer,
              mimetype: session.fotoMime || 'image/jpeg',
              caption: `📸 *Foto Bukti*\nLaporan #${String(laporanId).padStart(4, '0')} — ${name}`
            });
            logger.success('LAPORAN', `Foto bukti dikirim ke grup ${group.name}`);
            await delay(600);
          }

          // 3. Kirim lokasi
          await sock.sendMessage(group.id, {
            location: {
              degreesLatitude: latitude,
              degreesLongitude: longitude,
              name: `Lokasi Laporan #${String(laporanId).padStart(4, '0')}`,
              address: alamat
            }
          });
          logger.success('LAPORAN', `Lokasi dikirim ke grup ${group.name}`);
          await delay(600);

          // 4. Kirim vCard pelapor
          await sock.sendMessage(group.id, {
            contacts: {
              displayName: name,
              contacts: [{ vcard }]
            }
          });
          logger.success('LAPORAN', `vCard pelapor dikirim ke grup ${group.name}`);

          logger.success('LAPORAN', `✅ Laporan #${laporanId} lengkap dikirim ke: ${group.name}`);
        } catch (err) {
          logger.error('LAPORAN', `Gagal kirim ke grup ${group.name}`, err.message);
        }
      }

      clearSession(jid);
      break;
    }
  }
};

// ─── LiveChat Flow Handler ───────────────────────────────
const handleLivechatFlow = async (sock, jid, name, msg, session, { textMsg, imageMsg }) => {
  // Keluar dari LiveChat
  if (textMsg === '0' || textMsg?.toLowerCase() === 'keluar') {
    closeLivechatSession(jid);
    clearSession(jid);
    await sendText(sock, jid,
      `✅ Sesi LiveChat ditutup.\n\nTerima kasih sudah menghubungi kami, *${name}*! 🙏\n\nKetik *menu* untuk kembali ke menu utama.`
    );
    logger.info('LIVECHAT', `Sesi ditutup oleh ${name} (${jid})`);
    return;
  }

  // ── Pesan Foto ──
  if (imageMsg) {
    logger.info('LIVECHAT', `[${name}] mengirim foto — mengunduh...`);
    const fotoBuffer = await downloadWAImage(sock, msg);
    if (!fotoBuffer) {
      await sendText(sock, jid, `⚠️ Foto gagal diproses. Coba kirim ulang.`);
      return;
    }

    const ext = (imageMsg.mimetype || 'image/jpeg').includes('png') ? 'png' : 'jpg';
    const fname = `lc_${Date.now()}_${Math.random().toString(36).slice(2,6)}.${ext}`;
    const fpath = path.join(FOTO_LC_DIR, fname);
    fs.writeFileSync(fpath, fotoBuffer);

    const caption = imageMsg.caption?.trim() || null;
    const result = addLivechatMessage(jid, 'user', caption || '[Foto]', `/foto-livechat/${fname}`);

    if (!result) {
      clearSession(jid);
      await sendText(sock, jid, `ℹ️ Sesi LiveChat Anda telah berakhir.\n\nKetik *9* untuk memulai sesi baru.`);
      return;
    }

    logger.success('LIVECHAT', `[${name}] foto disimpan: ${fname}`);
    return;
  }

  // ── Pesan Teks ──
  if (!textMsg) return;

  const result = addLivechatMessage(jid, 'user', textMsg);
  if (!result) {
    clearSession(jid);
    await sendText(sock, jid,
      `ℹ️ Sesi LiveChat Anda telah berakhir.\n\nKetik *9* untuk memulai sesi baru atau *menu* untuk kembali.`
    );
    return;
  }

  logger.info('LIVECHAT', `[${name}] → "${textMsg.substring(0, 50)}"`);
};

// ─── Helpers ──────────────────────────────────────────────
const sendText = async (sock, jid, text) => {
  try {
    await sock.sendMessage(jid, { text });
    logger.send(jid, text.substring(0, 60) + '...');
    await delay(300);
  } catch (err) {
    logger.error('SEND', `Gagal kirim teks ke ${jid}`, err.message);
  }
};

const sendMenuUtama = async (sock, jid, name) => {
  try {
    const imgBuffer = await fetchImageBuffer(MENU_IMAGE_URL);
    if (imgBuffer) {
      await sock.sendMessage(jid, {
        image: imgBuffer,
        caption: MENU_UTAMA,
        mimetype: 'image/jpeg'
      });
      logger.send(jid, `Menu utama + gambar → ${name}`);
    } else {
      await sock.sendMessage(jid, { text: MENU_UTAMA });
      logger.warn('SEND', `Gambar gagal diambil, kirim teks menu saja ke ${name}`);
    }
    await delay(300);
  } catch (err) {
    logger.error('SEND', `Gagal kirim menu utama ke ${jid}`, err.message);
    try { await sock.sendMessage(jid, { text: MENU_UTAMA }); } catch {}
  }
};

export { sendText, sendMenuUtama };
