// ╔══════════════════════════════════════════════════════════╗
// ║     LAUNCHER — Jalankan Bot + Dashboard sekaligus        ║
// ╚══════════════════════════════════════════════════════════╝

import { spawn } from 'child_process';

const PREFIX_BOT = '\x1b[36m[BOT]\x1b[0m ';
const PREFIX_WEB = '\x1b[35m[WEB]\x1b[0m ';
const PREFIX_SYS = '\x1b[33m[SYS]\x1b[0m ';

function spawnProcess(name, file, prefix) {
  const proc = spawn('node', [file], {
    stdio: ['inherit', 'pipe', 'pipe'],
    env: process.env,
  });

  proc.stdout.on('data', (data) => {
    data.toString().split('\n').filter(Boolean).forEach(line => {
      process.stdout.write(prefix + line + '\n');
    });
  });

  proc.stderr.on('data', (data) => {
    data.toString().split('\n').filter(Boolean).forEach(line => {
      process.stderr.write(prefix + line + '\n');
    });
  });

  proc.on('exit', (code, signal) => {
    console.error(`${PREFIX_SYS}Proses ${name} berhenti (code=${code}, signal=${signal})`);
    if (code !== 0 && code !== null) {
      console.error(`${PREFIX_SYS}${name} keluar dengan error. Menghentikan semua proses...`);
      process.exit(code);
    }
  });

  return proc;
}

console.log(`${PREFIX_SYS}Memulai Hallo Johor Bot + Dashboard...`);
console.log(`${PREFIX_SYS}Node.js ${process.version}`);

const botProc = spawnProcess('BOT', 'index.js', PREFIX_BOT);
const webProc = spawnProcess('WEB', 'web.js', PREFIX_WEB);

process.on('SIGINT', () => {
  console.log(`\n${PREFIX_SYS}SIGINT diterima. Menghentikan semua proses...`);
  botProc.kill('SIGINT');
  webProc.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(`${PREFIX_SYS}SIGTERM diterima. Menghentikan semua proses...`);
  botProc.kill('SIGTERM');
  webProc.kill('SIGTERM');
  process.exit(0);
});
