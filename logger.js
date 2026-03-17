// ═══════════════════════════════════════════════
//   LOGGER - WhatsApp Bot Kecamatan Medan Johor
// ═══════════════════════════════════════════════

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgBlue: '\x1b[44m',
  bgGreen: '\x1b[42m',
  bgRed: '\x1b[41m',
  bgYellow: '\x1b[43m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
};

const getTimestamp = () => {
  const now = new Date();
  return now.toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

const pad = (str, len = 8) => str.toString().padEnd(len);

export const logger = {
  banner() {
    console.log(`\n${COLORS.cyan}${COLORS.bright}`);
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║       🤝  HALLO JOHOR — Kecamatan Medan Johor  🤝   ║');
    console.log('║          Sistem Pelayanan Digital Terpadu            ║');
    console.log('║       #MEDANUNTUKSEMUA  |  #AWAKANAKJOHOR            ║');
    console.log('╚══════════════════════════════════════════════════════╝');
    console.log(`${COLORS.reset}\n`);
  },

  info(module, msg, extra = '') {
    console.log(
      `${COLORS.dim}[${getTimestamp()}]${COLORS.reset} ` +
      `${COLORS.bgBlue}${COLORS.white}${COLORS.bright} ${pad(module)} ${COLORS.reset} ` +
      `${COLORS.cyan}${msg}${COLORS.reset}` +
      (extra ? ` ${COLORS.dim}${extra}${COLORS.reset}` : '')
    );
  },

  success(module, msg, extra = '') {
    console.log(
      `${COLORS.dim}[${getTimestamp()}]${COLORS.reset} ` +
      `${COLORS.bgGreen}${COLORS.white}${COLORS.bright} ${pad(module)} ${COLORS.reset} ` +
      `${COLORS.green}✓ ${msg}${COLORS.reset}` +
      (extra ? ` ${COLORS.dim}${extra}${COLORS.reset}` : '')
    );
  },

  warn(module, msg, extra = '') {
    console.log(
      `${COLORS.dim}[${getTimestamp()}]${COLORS.reset} ` +
      `${COLORS.bgYellow}${COLORS.white}${COLORS.bright} ${pad(module)} ${COLORS.reset} ` +
      `${COLORS.yellow}⚠ ${msg}${COLORS.reset}` +
      (extra ? ` ${COLORS.dim}${extra}${COLORS.reset}` : '')
    );
  },

  error(module, msg, extra = '') {
    console.log(
      `${COLORS.dim}[${getTimestamp()}]${COLORS.reset} ` +
      `${COLORS.bgRed}${COLORS.white}${COLORS.bright} ${pad(module)} ${COLORS.reset} ` +
      `${COLORS.red}✗ ${msg}${COLORS.reset}` +
      (extra ? ` ${COLORS.dim}${extra}${COLORS.reset}` : '')
    );
  },

  message(from, name, text, type = 'text') {
    const typeIcon = {
      text: '💬',
      image: '🖼️',
      location: '📍',
      document: '📄',
      audio: '🎵',
      video: '🎥',
      sticker: '🎭',
    }[type] || '📨';

    console.log(
      `${COLORS.dim}[${getTimestamp()}]${COLORS.reset} ` +
      `${COLORS.bgMagenta}${COLORS.white}${COLORS.bright} ${pad('MSG')} ${COLORS.reset} ` +
      `${COLORS.magenta}${typeIcon} [${name}]${COLORS.reset} ` +
      `${COLORS.dim}(${from})${COLORS.reset} ` +
      `${COLORS.white}→ ${text?.substring(0, 80) ?? `[${type}]`}${COLORS.reset}`
    );
  },

  send(to, summary) {
    console.log(
      `${COLORS.dim}[${getTimestamp()}]${COLORS.reset} ` +
      `${COLORS.bgCyan}${COLORS.white}${COLORS.bright} ${pad('SEND')} ${COLORS.reset} ` +
      `${COLORS.cyan}📤 → ${to}${COLORS.reset} ` +
      `${COLORS.dim}| ${summary}${COLORS.reset}`
    );
  },

  state(event, detail = '') {
    console.log(
      `${COLORS.dim}[${getTimestamp()}]${COLORS.reset} ` +
      `${COLORS.bgGreen}${COLORS.white}${COLORS.bright} ${pad('STATE')} ${COLORS.reset} ` +
      `${COLORS.green}🔄 ${event}${COLORS.reset}` +
      (detail ? ` ${COLORS.dim}→ ${detail}${COLORS.reset}` : '')
    );
  },

  report(from, name, category) {
    console.log(
      `${COLORS.dim}[${getTimestamp()}]${COLORS.reset} ` +
      `${COLORS.bgRed}${COLORS.white}${COLORS.bright} ${pad('REPORT')} ${COLORS.reset} ` +
      `${COLORS.red}📢 Laporan baru dari ${name} (${from})${COLORS.reset} ` +
      `${COLORS.dim}Kategori: ${category}${COLORS.reset}`
    );
  },

  divider() {
    console.log(`${COLORS.dim}${'─'.repeat(60)}${COLORS.reset}`);
  }
};

export default logger;
