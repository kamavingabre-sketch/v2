// ═══════════════════════════════════════════════════════════
//   WEB-PAGES.JS — HTML Page Templates
//   Hallo Johor Dashboard: Login & Dashboard
// ═══════════════════════════════════════════════════════════

// ─── Shared Helpers ───────────────────────────────────────
export const esc = (s) =>
  String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

export const fmtDate = (iso) => {
  try {
    return new Date(iso).toLocaleString('id-ID', {
      timeZone:'Asia/Jakarta', day:'2-digit', month:'short',
      year:'numeric', hour:'2-digit', minute:'2-digit'
    });
  } catch { return iso || '-'; }
};

// ─── Login Page ───────────────────────────────────────────
export const pageLogin = (error = '') => `<!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Login — Hallo Johor Admin</title>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#040d1a;--card:#0e1e38;--border:#1a3356;--cyan:#00c8ff;--green:#00e5a0;--text:#e2eaf5;--muted:#4a6a8a}
body{background:var(--bg);color:var(--text);font-family:'DM Sans',sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;background-image:radial-gradient(ellipse 70% 60% at 15% 10%,rgba(0,200,255,.07) 0%,transparent 60%),radial-gradient(ellipse 60% 50% at 85% 85%,rgba(0,229,160,.05) 0%,transparent 60%),linear-gradient(rgba(0,200,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,200,255,.025) 1px,transparent 1px);background-size:auto,auto,48px 48px,48px 48px}
.wrap{width:100%;max-width:400px;padding:24px;animation:up .5s ease both}
@keyframes up{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
.logo{text-align:center;margin-bottom:36px}
.logo-box{width:60px;height:60px;background:linear-gradient(135deg,var(--cyan),var(--green));border-radius:18px;display:inline-flex;align-items:center;justify-content:center;font-size:26px;margin-bottom:14px;box-shadow:0 0 36px rgba(0,200,255,.3)}
.logo-name{font-family:'Syne',sans-serif;font-size:24px;font-weight:800;background:linear-gradient(135deg,#fff 30%,var(--cyan));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.logo-sub{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:2px;margin-top:3px}
.card{background:var(--card);border:1px solid var(--border);border-radius:20px;padding:32px;box-shadow:0 24px 60px rgba(0,0,0,.4)}
.card h2{font-family:'Syne',sans-serif;font-size:19px;font-weight:700;margin-bottom:5px}
.card p{font-size:13px;color:var(--muted);margin-bottom:24px}
.field{margin-bottom:16px}
label{display:block;font-size:11px;font-weight:500;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:7px}
input{width:100%;background:#0d1f3c;border:1px solid var(--border);border-radius:10px;padding:12px 14px;color:var(--text);font-family:'DM Sans',sans-serif;font-size:14px;outline:none;transition:border-color .2s,box-shadow .2s}
input:focus{border-color:#0090c8;box-shadow:0 0 0 3px rgba(0,200,255,.1)}
.btn{width:100%;padding:13px;background:linear-gradient(135deg,#0090c8,var(--cyan));border:none;border-radius:10px;color:#040d1a;font-family:'Syne',sans-serif;font-size:14px;font-weight:700;cursor:pointer;margin-top:6px;transition:opacity .2s}
.btn:hover{opacity:.88}
.err{background:rgba(255,77,109,.1);border:1px solid rgba(255,77,109,.25);color:#ff8fa3;border-radius:10px;padding:11px 14px;font-size:13px;margin-bottom:18px}
.foot{text-align:center;font-size:11px;color:var(--muted);margin-top:22px}
</style></head><body>
<div class="wrap">
  <div class="logo">
    <div class="logo-box">🏙️</div>
    <div class="logo-name">Hallo Johor</div>
    <div class="logo-sub">Dashboard Admin</div>
  </div>
  <div class="card">
    <h2>Selamat Datang 👋</h2>
    <p>Masuk untuk mengelola laporan pengaduan masyarakat.</p>
    ${error ? `<div class="err">⚠️ ${esc(error)}</div>` : ''}
    <form method="POST" action="/login">
      <div class="field"><label>Username</label><input type="text" name="username" placeholder="admin" required autocomplete="username"></div>
      <div class="field"><label>Password</label><input type="password" name="password" placeholder="••••••••" required autocomplete="current-password"></div>
      <button type="submit" class="btn">Masuk ke Dashboard →</button>
    </form>
  </div>
  <p class="foot">Kecamatan Medan Johor — Sistem Pengaduan Digital</p>
</div></body></html>`;

// ─── Dashboard Page ───────────────────────────────────────
export const pageDashboard = (laporan, groups) => {
  const total = laporan.length;
  const now = new Date();
  const today = laporan.filter(l => new Date(l.tanggal).toDateString() === now.toDateString()).length;
  const thisMonth = laporan.filter(l => {
    const d = new Date(l.tanggal);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const katCount = {}, kelCount = {}, dailyCount = {};
  laporan.forEach(l => {
    katCount[l.kategori] = (katCount[l.kategori] || 0) + 1;
    kelCount[l.kelurahan] = (kelCount[l.kelurahan] || 0) + 1;
    const day = new Date(l.tanggal).toLocaleDateString('id-ID', { day:'2-digit', month:'short' });
    dailyCount[day] = (dailyCount[day] || 0) + 1;
  });

  const katList = Object.entries(katCount).sort((a,b) => b[1]-a[1]);
  const kelList = Object.entries(kelCount).sort((a,b) => b[1]-a[1]);
  const allKat  = [...new Set(laporan.map(l => l.kategori))].filter(Boolean);
  const allKel  = [...new Set(laporan.map(l => l.kelurahan))].filter(Boolean);
  const last10  = Object.entries(dailyCount).slice(-10);

  const cDayL = JSON.stringify(last10.map(d=>d[0]));
  const cDayD = JSON.stringify(last10.map(d=>d[1]));
  const cKatL = JSON.stringify(katList.slice(0,7).map(k=>k[0]));
  const cKatD = JSON.stringify(katList.slice(0,7).map(k=>k[1]));
  const cKelL = JSON.stringify(kelList.slice(0,6).map(k=>k[0]));
  const cKelD = JSON.stringify(kelList.slice(0,6).map(k=>k[1]));

  const rows = laporan.map(l => `
    <tr data-kat="${esc(l.kategori)}" data-kel="${esc(l.kelurahan)}">
      <td><span class="id-badge">#${String(l.id||0).padStart(4,'0')}</span></td>
      <td><div class="fw5">${esc(l.namaPelapor)}</div><div class="fz12 text-muted">${esc((l.pelapor||'').replace('@s.whatsapp.net',''))}</div></td>
      <td><span class="kat-tag">${esc(l.kategori)}</span></td>
      <td>${esc(l.kelurahan)}</td>
      <td class="fz13 text-muted2" style="max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${esc(l.isi)}">${esc((l.isi||'').substring(0,60))}${(l.isi||'').length>60?'…':''}</td>
      <td><a class="map-link" href="https://maps.google.com/?q=${l.koordinat?.lat||0},${l.koordinat?.lon||0}" target="_blank">📍 Peta</a></td>
      <td class="fz12 text-muted2">${fmtDate(l.tanggal)}</td>
      <td><button class="det-btn" onclick='showDetail(${JSON.stringify(JSON.stringify(l))})'>Detail</button></td>
    </tr>`).join('');

  const katOpts = allKat.map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');
  const kelOpts = allKel.map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');
  const groupRows = groups.length ? groups.map(g=>`
    <tr>
      <td class="fz13 fw5">${esc(g.name||g.id)}</td>
      <td><span class="id-badge fz11">${esc(g.id)}</span></td>
      <td class="fz12 text-muted2">${fmtDate(g.addedAt)}</td>
      <td><span class="status-ok">● Aktif</span></td>
    </tr>`).join('') :
    `<tr><td colspan="4" class="empty-row">Belum ada grup terdaftar</td></tr>`;

  const recentRows = laporan.slice(0,5).map(l=>`
    <tr>
      <td><span class="id-badge">#${String(l.id||0).padStart(4,'0')}</span></td>
      <td class="fw5">${esc(l.namaPelapor)}</td>
      <td><span class="kat-tag">${esc(l.kategori)}</span></td>
      <td>${esc(l.kelurahan)}</td>
      <td class="fz12 text-muted2">${fmtDate(l.tanggal)}</td>
      <td><button class="det-btn" onclick='showDetail(${JSON.stringify(JSON.stringify(l))})'>Detail</button></td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Dashboard — Hallo Johor Admin</title>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"><\/script>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#040d1a;--bg2:#071326;--bg3:#0d1f3c;--card:#0e1e38;--border:#1a3356;--border2:#243d5c;--cyan:#00c8ff;--cyan2:#0090c8;--green:#00e5a0;--amber:#fbbf24;--red:#ff4d6d;--purple:#a78bfa;--text:#e2eaf5;--text2:#8facc5;--muted:#4a6a8a;--sb:256px}
body{background:var(--bg);color:var(--text);font-family:'DM Sans',sans-serif;min-height:100vh;display:flex}
a{color:inherit;text-decoration:none}
::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:var(--bg2)}::-webkit-scrollbar-thumb{background:var(--border2);border-radius:3px}
.sb{width:var(--sb);background:var(--bg2);border-right:1px solid var(--border);display:flex;flex-direction:column;position:fixed;top:0;left:0;bottom:0;z-index:100}
.sb-logo{padding:24px 20px 18px;border-bottom:1px solid var(--border)}
.sb-logo .ico{font-size:28px;display:block;margin-bottom:8px}
.sb-logo .name{font-family:'Syne',sans-serif;font-size:18px;font-weight:800;background:linear-gradient(135deg,#fff 20%,var(--cyan));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.sb-logo .sub{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:1.5px;margin-top:2px}
.sb-nav{padding:16px 12px;flex:1;overflow-y:auto}
.nav-sec{font-size:9px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:2px;padding:0 8px;margin:16px 0 6px}
.nav-sec:first-child{margin-top:0}
.ni{display:flex;align-items:center;gap:9px;padding:9px 10px;border-radius:9px;font-size:13px;font-weight:500;color:var(--text2);cursor:pointer;transition:all .15s;margin-bottom:1px}
.ni:hover{background:var(--bg3);color:var(--text)}.ni.on{background:rgba(0,200,255,.12);color:var(--cyan)}
.ni .ic{font-size:15px;width:18px;text-align:center}
.sb-foot{padding:14px;border-top:1px solid var(--border)}
.logout{display:flex;align-items:center;gap:8px;width:100%;padding:9px 12px;background:rgba(255,77,109,.08);border:1px solid rgba(255,77,109,.15);border-radius:9px;color:#ff8fa3;font-family:'DM Sans',sans-serif;font-size:13px;cursor:pointer;transition:all .15s}
.logout:hover{background:rgba(255,77,109,.15)}
.main{margin-left:var(--sb);flex:1;display:flex;flex-direction:column;min-height:100vh}
.topbar{background:var(--bg2);border-bottom:1px solid var(--border);padding:16px 28px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:50}
.topbar-title{font-family:'Syne',sans-serif;font-size:17px;font-weight:700}
.topbar-r{display:flex;align-items:center;gap:10px}
.badge-live{display:flex;align-items:center;gap:5px;font-size:11px;color:var(--green);background:rgba(0,229,160,.1);border:1px solid rgba(0,229,160,.2);padding:4px 10px;border-radius:20px}
.badge-live::before{content:'';width:5px;height:5px;background:var(--green);border-radius:50%;animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
.ref-btn{background:var(--bg3);border:1px solid var(--border2);border-radius:7px;padding:6px 12px;color:var(--text2);font-size:12px;cursor:pointer;transition:all .15s}
.ref-btn:hover{border-color:var(--cyan2);color:var(--cyan)}
.content{padding:28px;flex:1}
.sec{display:none}.sec.on{display:block}
.sec-title{font-family:'Syne',sans-serif;font-size:21px;font-weight:800;margin-bottom:3px}
.sec-sub{font-size:12px;color:var(--muted);margin-bottom:22px}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px}
.sc{background:var(--card);border:1px solid var(--border);border-radius:15px;padding:20px 22px;position:relative;overflow:hidden;animation:fi .4s ease both}
@keyframes fi{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.sc::after{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--ac,var(--cyan))}
.sc.g{--ac:var(--green)}.sc.a{--ac:var(--amber)}.sc.p{--ac:var(--purple)}
.sc-lbl{font-size:10px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px}
.sc-val{font-family:'JetBrains Mono',monospace;font-size:34px;font-weight:500;line-height:1}
.sc-desc{font-size:11px;color:var(--text2);margin-top:7px}.sc-ico{position:absolute;right:18px;top:18px;font-size:26px;opacity:.25}
.charts{display:grid;grid-template-columns:2fr 1fr 1fr;gap:14px;margin-bottom:24px}
.cc{background:var(--card);border:1px solid var(--border);border-radius:15px;padding:20px 22px}
.cc-title{font-family:'Syne',sans-serif;font-size:13px;font-weight:700;margin-bottom:2px}
.cc-sub{font-size:11px;color:var(--muted);margin-bottom:16px}
.tc{background:var(--card);border:1px solid var(--border);border-radius:15px;overflow:hidden}
.tc-head{padding:18px 22px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
.tc-head-l{display:flex;align-items:center;gap:10px}
.tc-name{font-family:'Syne',sans-serif;font-size:14px;font-weight:700}
.cnt-badge{background:rgba(0,200,255,.1);border:1px solid rgba(0,200,255,.2);color:var(--cyan);font-family:'JetBrains Mono',monospace;font-size:11px;padding:2px 9px;border-radius:20px}
.filters{display:flex;gap:8px;flex-wrap:wrap}
select,input[type=text]{background:var(--bg3);border:1px solid var(--border2);border-radius:7px;padding:7px 10px;color:var(--text);font-family:'DM Sans',sans-serif;font-size:12px;outline:none;transition:border-color .2s}
select:focus,input[type=text]:focus{border-color:var(--cyan2)}
input[type=text]{width:180px}
.tbl-wrap{overflow-x:auto}
table{width:100%;border-collapse:collapse;font-size:13px}
th{background:var(--bg3);padding:11px 16px;text-align:left;font-size:10px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid var(--border);white-space:nowrap}
td{padding:13px 16px;border-bottom:1px solid rgba(26,51,86,.5);vertical-align:middle}
tr:last-child td{border-bottom:none}
tr:hover td{background:rgba(13,31,60,.5)}
.id-badge{font-family:'JetBrains Mono',monospace;font-size:12px;background:rgba(0,200,255,.08);color:var(--cyan);padding:2px 8px;border-radius:6px}
.kat-tag{background:rgba(167,139,250,.1);border:1px solid rgba(167,139,250,.2);color:var(--purple);font-size:11px;padding:2px 8px;border-radius:20px;white-space:nowrap}
.map-link{color:var(--cyan2);font-size:12px}.map-link:hover{color:var(--cyan)}
.det-btn{background:rgba(0,200,255,.08);border:1px solid rgba(0,200,255,.2);border-radius:6px;color:var(--cyan);font-size:11px;padding:4px 10px;cursor:pointer;transition:all .15s;font-family:'DM Sans',sans-serif}
.det-btn:hover{background:rgba(0,200,255,.18)}
.fw5{font-weight:500}.fz12{font-size:12px}.fz13{font-size:13px}.fz11{font-size:11px}
.text-muted{color:var(--muted)}.text-muted2{color:var(--text2)}
.empty-row{text-align:center;color:var(--muted);padding:40px!important;font-size:13px}
.status-ok{color:var(--green);font-size:12px}
.overlay{position:fixed;inset:0;background:rgba(4,13,26,.88);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px);animation:fo .2s ease}
@keyframes fo{from{opacity:0}to{opacity:1}}
.modal{background:var(--card);border:1px solid var(--border2);border-radius:18px;width:100%;max-width:560px;max-height:88vh;overflow-y:auto;animation:ms .25s ease}
@keyframes ms{from{opacity:0;transform:scale(.95) translateY(10px)}to{opacity:1;transform:none}}
.modal-head{padding:22px 24px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
.modal-title{font-family:'Syne',sans-serif;font-size:16px;font-weight:700}
.close-btn{background:rgba(255,255,255,.06);border:none;width:30px;height:30px;border-radius:8px;color:var(--text2);font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s}
.close-btn:hover{background:rgba(255,77,109,.15);color:var(--red)}
.modal-body{padding:22px 24px}
.detail-row{display:flex;gap:8px;margin-bottom:14px}
.detail-label{font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:1px;min-width:90px;padding-top:1px}
.detail-val{font-size:13px;color:var(--text);flex:1;line-height:1.6}
.detail-divider{border:none;border-top:1px solid var(--border);margin:16px 0}
.no-img{background:var(--bg3);border:1px dashed var(--border2);border-radius:10px;padding:24px;text-align:center;font-size:12px;color:var(--muted)}
.export-btn{background:linear-gradient(135deg,rgba(0,229,160,.15),rgba(0,229,160,.08));border:1px solid rgba(0,229,160,.3);border-radius:7px;padding:6px 14px;color:var(--green);font-size:12px;font-weight:500;cursor:pointer;transition:all .15s;text-decoration:none}
.export-btn:hover{background:rgba(0,229,160,.2);border-color:var(--green)}
.export-btn.loading{opacity:.6;pointer-events:none}
.info-card{background:var(--card);border:1px solid var(--border);border-radius:15px;padding:22px 24px}
.guide-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.fb-box{background:rgba(0,200,255,.04);border:1px solid rgba(0,200,255,.15);border-radius:12px;padding:18px;margin-top:4px}
.fb-box .fb-title{font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:var(--cyan);margin-bottom:14px;display:flex;align-items:center;gap:7px}
.fb-textarea{width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:10px 12px;color:var(--text);font-family:'DM Sans',sans-serif;font-size:13px;resize:vertical;min-height:90px;outline:none;transition:border-color .2s}
.fb-textarea:focus{border-color:var(--cyan2)}
.fb-file-label{display:flex;align-items:center;gap:8px;cursor:pointer;background:var(--bg3);border:1px dashed var(--border2);border-radius:8px;padding:10px 14px;font-size:12px;color:var(--text2);transition:all .2s;margin-top:10px}
.fb-file-label:hover{border-color:var(--cyan2);color:var(--cyan)}
.fb-preview{max-width:100%;max-height:140px;border-radius:8px;margin-top:10px;display:none;border:1px solid var(--border2)}
.fb-send-btn{width:100%;padding:11px;background:linear-gradient(135deg,#0090c8,var(--cyan));border:none;border-radius:9px;color:#040d1a;font-family:'Syne',sans-serif;font-size:13px;font-weight:700;cursor:pointer;margin-top:12px;transition:opacity .2s}
.fb-send-btn:hover{opacity:.88}
.fb-send-btn:disabled{opacity:.5;cursor:not-allowed}
.fb-status{margin-top:10px;font-size:12px;text-align:center;border-radius:8px;padding:9px;display:none}
.fb-status.ok{background:rgba(0,229,160,.1);border:1px solid rgba(0,229,160,.25);color:var(--green);display:block}
.fb-status.err{background:rgba(255,77,109,.1);border:1px solid rgba(255,77,109,.25);color:#ff8fa3;display:block}
/* ── LiveChat ── */
.lc-layout{display:grid;grid-template-columns:300px 1fr;gap:14px;height:calc(100vh - 180px);min-height:500px}
.lc-list{background:var(--card);border:1px solid var(--border);border-radius:15px;overflow:hidden;display:flex;flex-direction:column}
.lc-list-head{padding:16px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
.lc-list-body{overflow-y:auto;flex:1}
.lc-item{padding:14px 16px;border-bottom:1px solid rgba(26,51,86,.4);cursor:pointer;transition:background .15s;display:flex;align-items:flex-start;gap:10px}
.lc-item:hover{background:rgba(0,200,255,.05)}
.lc-item.active{background:rgba(0,200,255,.1);border-left:3px solid var(--cyan)}
.lc-item.closed{opacity:.5}
.lc-avatar{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,var(--cyan2),var(--green));display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#040d1a;flex-shrink:0}
.lc-meta{flex:1;min-width:0}
.lc-name{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lc-preview{font-size:11px;color:var(--text2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}
.lc-time{font-size:10px;color:var(--muted);flex-shrink:0}
.lc-unread{background:var(--cyan);color:#040d1a;font-size:10px;font-weight:700;border-radius:10px;padding:1px 6px;margin-left:4px}
.lc-chat{background:var(--card);border:1px solid var(--border);border-radius:15px;overflow:hidden;display:flex;flex-direction:column}
.lc-chat-head{padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
.lc-chat-info{display:flex;align-items:center;gap:12px}
.lc-status-dot{width:8px;height:8px;border-radius:50%;background:var(--green);box-shadow:0 0 6px var(--green)}
.lc-status-dot.closed{background:var(--muted)}
.lc-msgs{flex:1;overflow-y:auto;padding:18px;display:flex;flex-direction:column;gap:10px}
.lc-msg{max-width:72%;display:flex;flex-direction:column;gap:3px}
.lc-msg.user{align-self:flex-start}
.lc-msg.admin{align-self:flex-end;align-items:flex-end}
.lc-bubble{padding:10px 14px;border-radius:14px;font-size:13px;line-height:1.55}
.lc-msg.user .lc-bubble{background:var(--bg3);border:1px solid var(--border);border-bottom-left-radius:4px}
.lc-msg.admin .lc-bubble{background:linear-gradient(135deg,rgba(0,144,200,.25),rgba(0,200,255,.15));border:1px solid rgba(0,200,255,.25);border-bottom-right-radius:4px}
.lc-msg-time{font-size:10px;color:var(--muted);padding:0 4px}
.lc-msg-sender{font-size:10px;color:var(--cyan);padding:0 4px;font-weight:600}
.lc-input-box{padding:14px 16px;border-top:1px solid var(--border);display:flex;gap:10px;align-items:center;flex-shrink:0}
.lc-input{flex:1;background:var(--bg3);border:1px solid var(--border2);border-radius:10px;padding:10px 14px;color:var(--text);font-family:'DM Sans',sans-serif;font-size:13px;outline:none;transition:border-color .2s}
.lc-input:focus{border-color:var(--cyan2)}
.lc-send-btn{background:linear-gradient(135deg,#0090c8,var(--cyan));border:none;border-radius:9px;padding:10px 18px;color:#040d1a;font-family:'Syne',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:opacity .2s;white-space:nowrap}
.lc-send-btn:hover{opacity:.85}
.lc-send-btn:disabled{opacity:.4;cursor:not-allowed}
.lc-close-btn{background:rgba(255,77,109,.1);border:1px solid rgba(255,77,109,.2);border-radius:7px;padding:6px 12px;color:#ff8fa3;font-size:12px;cursor:pointer;transition:all .15s;font-family:'DM Sans',sans-serif}
.lc-close-btn:hover{background:rgba(255,77,109,.2)}
.lc-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--muted);font-size:13px;gap:10px}
.lc-closed-banner{background:rgba(255,77,109,.08);border:1px solid rgba(255,77,109,.2);border-radius:8px;padding:10px 14px;font-size:12px;color:#ff8fa3;text-align:center;margin:0 16px 12px}
.lc-msg-img{max-width:220px;max-height:200px;border-radius:10px;border:1px solid var(--border2);cursor:zoom-in;display:block;transition:opacity .15s}
.lc-msg-img:hover{opacity:.88}
</style></head><body>

<div class="sb">
  <div class="sb-logo">
    <span class="ico">🏙️</span>
    <div class="name">Hallo Johor</div>
    <div class="sub">Dashboard Admin</div>
  </div>
  <div class="sb-nav">
    <div class="nav-sec">Utama</div>
    <div class="ni on" onclick="showSec('overview',this)"><span class="ic">📊</span> Overview</div>
    <div class="ni" onclick="showSec('laporan',this)"><span class="ic">📋</span> Semua Laporan</div>
    <div class="nav-sec">Manajemen</div>
    <div class="ni" onclick="showSec('livechat',this)"><span class="ic">💬</span> LiveChat <span id="lc-unread-badge" style="display:none;margin-left:auto;background:var(--red);color:#fff;font-size:10px;font-weight:700;border-radius:10px;padding:1px 7px"></span></div>
    <div class="ni" onclick="showSec('grup',this)"><span class="ic">📡</span> Grup WhatsApp</div>
    <div class="nav-sec">Info</div>
    <div class="ni" onclick="showSec('panduan',this)"><span class="ic">📖</span> Panduan</div>
  </div>
  <div class="sb-foot"><a class="logout" href="/logout">🚪 Keluar</a></div>
</div>

<div class="main">
  <div class="topbar">
    <div class="topbar-title" id="topbar-title">Overview</div>
    <div class="topbar-r">
      <div class="badge-live">Live</div>
      <button class="ref-btn" onclick="location.reload()">🔄 Refresh</button>
      <a href="/export/excel" class="export-btn" id="export-btn" onclick="startExport(this)">📊 Export Excel</a>
    </div>
  </div>

  <div class="content">

    <div class="sec on" id="sec-overview">
      <div class="sec-title">Dashboard Laporan</div>
      <div class="sec-sub">Ringkasan data pengaduan masyarakat Kecamatan Medan Johor</div>
      <div class="stats">
        <div class="sc"><span class="sc-ico">📋</span><div class="sc-lbl">Total Laporan</div><div class="sc-val">${total}</div><div class="sc-desc">Semua waktu</div></div>
        <div class="sc g"><span class="sc-ico">📅</span><div class="sc-lbl">Hari Ini</div><div class="sc-val">${today}</div><div class="sc-desc">${new Date().toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'})}</div></div>
        <div class="sc a"><span class="sc-ico">📆</span><div class="sc-lbl">Bulan Ini</div><div class="sc-val">${thisMonth}</div><div class="sc-desc">${new Date().toLocaleDateString('id-ID',{month:'long',year:'numeric'})}</div></div>
        <div class="sc p"><span class="sc-ico">💬</span><div class="sc-lbl">Grup Aktif</div><div class="sc-val">${groups.length}</div><div class="sc-desc">Grup penerima laporan</div></div>
      </div>
      <div class="charts">
        <div class="cc"><div class="cc-title">Laporan per Hari</div><div class="cc-sub">Tren 10 hari terakhir</div><canvas id="chartDay" height="110"></canvas></div>
        <div class="cc"><div class="cc-title">Per Kategori</div><div class="cc-sub">Distribusi kategori</div><canvas id="chartKat" height="160"></canvas></div>
        <div class="cc"><div class="cc-title">Per Kelurahan</div><div class="cc-sub">Distribusi wilayah</div><canvas id="chartKel" height="160"></canvas></div>
      </div>
      <div class="tc">
        <div class="tc-head">
          <div class="tc-head-l"><span class="tc-name">Laporan Terbaru</span><span class="cnt-badge">5 terakhir</span></div>
          <button class="det-btn" onclick="showSec('laporan',document.querySelectorAll('.ni')[1])">Lihat Semua →</button>
        </div>
        <div class="tbl-wrap"><table>
          <thead><tr><th>No</th><th>Pelapor</th><th>Kategori</th><th>Kelurahan</th><th>Waktu</th><th></th></tr></thead>
          <tbody>${recentRows || '<tr><td colspan="6" class="empty-row">Belum ada laporan</td></tr>'}</tbody>
        </table></div>
      </div>
    </div>

    <div class="sec" id="sec-laporan">
      <div class="sec-title">Semua Laporan</div>
      <div class="sec-sub">Data lengkap pengaduan yang diterima melalui WhatsApp Bot</div>
      <div class="tc">
        <div class="tc-head">
          <div class="tc-head-l"><span class="tc-name">Daftar Laporan</span><span class="cnt-badge" id="row-count">${total}</span></div>
          <div class="filters">
            <input type="text" id="search-box" placeholder="🔍  Cari nama / isi..." oninput="filterTable()">
            <select id="filter-kat" onchange="filterTable()"><option value="">Semua Kategori</option>${katOpts}</select>
            <select id="filter-kel" onchange="filterTable()"><option value="">Semua Kelurahan</option>${kelOpts}</select>
          </div>
        </div>
        <div class="tbl-wrap"><table>
          <thead><tr><th>No</th><th>Pelapor</th><th>Kategori</th><th>Kelurahan</th><th>Isi Laporan</th><th>Lokasi</th><th>Waktu</th><th></th></tr></thead>
          <tbody id="table-body">${rows || '<tr><td colspan="8" class="empty-row">Belum ada laporan masuk</td></tr>'}</tbody>
        </table></div>
      </div>
    </div>

    <div class="sec" id="sec-grup">
      <div class="sec-title">Grup WhatsApp</div>
      <div class="sec-sub">Grup yang terdaftar sebagai penerima notifikasi laporan</div>
      <div class="tc" style="margin-bottom:16px">
        <div class="tc-head"><div class="tc-head-l"><span class="tc-name">Daftar Grup</span><span class="cnt-badge">${groups.length} grup</span></div></div>
        <div class="tbl-wrap"><table>
          <thead><tr><th>Nama Grup</th><th>Group ID</th><th>Terdaftar</th><th>Status</th></tr></thead>
          <tbody>${groupRows}</tbody>
        </table></div>
      </div>
      <div class="info-card">
        <div class="cc-title" style="margin-bottom:10px">📱 Cara Mendaftarkan Grup</div>
        <div style="font-size:13px;color:var(--text2);line-height:2">
          1. Tambahkan bot WhatsApp ke grup yang diinginkan<br>
          2. Ketik <code style="background:var(--bg3);padding:1px 7px;border-radius:4px;color:var(--cyan)">applylaporan</code> di dalam grup tersebut<br>
          3. Bot akan mengkonfirmasi pendaftaran grup<br>
          4. Untuk menghapus, ketik <code style="background:var(--bg3);padding:1px 7px;border-radius:4px;color:var(--red)">removelaporan</code>
        </div>
      </div>
    </div>

    <div class="sec" id="sec-panduan">
      <div class="sec-title">Panduan Sistem</div>
      <div class="sec-sub">Informasi lengkap pengoperasian Hallo Johor Bot</div>
      <div class="guide-grid">
        <div class="info-card"><div style="font-size:26px;margin-bottom:10px">📲</div><div class="cc-title" style="margin-bottom:10px">Bot Commands</div><div style="font-size:13px;color:var(--text2);line-height:2"><code style="color:var(--cyan)">applylaporan</code> — Daftarkan grup<br><code style="color:var(--red)">removelaporan</code> — Hapus grup<br><code style="color:var(--green)">menu</code> / <code style="color:var(--green)">hi</code> — Menu utama bot</div></div>
        <div class="info-card"><div style="font-size:26px;margin-bottom:10px">📋</div><div class="cc-title" style="margin-bottom:10px">Alur Laporan</div><div style="font-size:13px;color:var(--text2);line-height:1.9">1. Pilih menu → Laporan Pengaduan<br>2. Pilih kategori & kelurahan<br>3. Tulis uraian laporan<br>4. Kirim foto bukti<br>5. Bagikan lokasi GPS</div></div>
        <div class="info-card"><div style="font-size:26px;margin-bottom:10px">💾</div><div class="cc-title" style="margin-bottom:10px">Penyimpanan Data</div><div style="font-size:13px;color:var(--text2);line-height:2"><code style="color:var(--cyan)">data/laporan_archive.json</code> — Arsip laporan<br><code style="color:var(--cyan)">data/laporan_groups.json</code> — Daftar grup<br><code style="color:var(--cyan)">data/laporan_counter.json</code> — Nomor urut</div></div>
        <div class="info-card"><div style="font-size:26px;margin-bottom:10px">🔐</div><div class="cc-title" style="margin-bottom:10px">Keamanan Dashboard</div><div style="font-size:13px;color:var(--text2);line-height:2">Ubah password lewat ENV variable:<br><code style="color:var(--cyan)">ADMIN_USER=namaadmin</code><br><code style="color:var(--cyan)">ADMIN_PASS=passwordbaru node web.js</code></div></div>
      </div>
    </div>

    <div class="sec" id="sec-livechat">
      <div class="sec-title">LiveChat Admin</div>
      <div class="sec-sub">Chat real-time dengan warga yang menghubungi via WhatsApp Bot</div>
      <div class="lc-layout">
        <div class="lc-list">
          <div class="lc-list-head">
            <div style="font-family:'Syne',sans-serif;font-size:13px;font-weight:700">Sesi Chat</div>
            <span class="cnt-badge" id="lc-count">0</span>
          </div>
          <div class="lc-list-body" id="lc-sessions"><div style="padding:30px;text-align:center;color:var(--muted);font-size:12px">Belum ada sesi aktif</div></div>
        </div>
        <div class="lc-chat" id="lc-chat-panel">
          <div class="lc-empty" id="lc-no-chat"><div style="font-size:40px">💬</div><div>Pilih sesi untuk membalas</div></div>
          <div id="lc-active-chat" style="display:none;flex:1;flex-direction:column">
            <div class="lc-chat-head">
              <div class="lc-chat-info">
                <div class="lc-status-dot" id="lc-status-dot"></div>
                <div>
                  <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:15px" id="lc-chat-name">-</div>
                  <div style="font-size:11px;color:var(--muted)" id="lc-chat-jid">-</div>
                </div>
              </div>
              <button class="lc-close-btn" id="lc-end-btn" onclick="endSession()">✕ Akhiri Sesi</button>
            </div>
            <div class="lc-msgs" id="lc-messages"></div>
            <div id="lc-closed-banner" class="lc-closed-banner" style="display:none">Sesi ini sudah ditutup. Tidak bisa membalas lagi.</div>
            <div class="lc-input-box" id="lc-input-area">
              <input class="lc-input" id="lc-reply-input" placeholder="Ketik balasan..." onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendReply()}">
              <button class="lc-send-btn" id="lc-reply-btn" onclick="sendReply()">Kirim ➤</button>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</div>

<div class="overlay" id="modal-overlay" style="display:none" onclick="closeModal(event)">
  <div class="modal" id="modal-box">
    <div class="modal-head">
      <div class="modal-title" id="modal-title">Detail Laporan</div>
      <button class="close-btn" onclick="closeModalDirect()">✕</button>
    </div>
    <div class="modal-body" id="modal-body"></div>
  </div>
</div>

<script>
const sections=['overview','laporan','grup','livechat','panduan'];
const titles={overview:'Overview',laporan:'Semua Laporan',grup:'Grup WhatsApp',livechat:'LiveChat Admin',panduan:'Panduan'};
function showSec(id,el){
  sections.forEach(s=>document.getElementById('sec-'+s).classList.toggle('on',s===id));
  document.querySelectorAll('.ni').forEach(n=>n.classList.remove('on'));
  if(el)el.classList.add('on');
  document.getElementById('topbar-title').textContent=titles[id]||id;
}
function filterTable(){
  const q=document.getElementById('search-box').value.toLowerCase();
  const kat=document.getElementById('filter-kat').value;
  const kel=document.getElementById('filter-kel').value;
  let vis=0;
  document.querySelectorAll('#table-body tr').forEach(r=>{
    const ok=(!q||r.textContent.toLowerCase().includes(q))&&(!kat||r.dataset.kat===kat)&&(!kel||r.dataset.kel===kel);
    r.style.display=ok?'':'none';
    if(ok)vis++;
  });
  document.getElementById('row-count').textContent=vis;
}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function showDetail(jsonStr){
  const l=JSON.parse(jsonStr);
  const id='#'+String(l.id||0).padStart(4,'0');
  document.getElementById('modal-title').textContent='Detail Laporan '+id;
  const row=(lbl,val)=>'<div class="detail-row"><div class="detail-label">'+lbl+'</div><div class="detail-val">'+val+'</div></div>';
  const lat=l.koordinat?.lat||l.koordinat?.latitude||0;
  const lon=l.koordinat?.lon||l.koordinat?.longitude||0;
  let html='';
  html+=row('No. Laporan','<span class="id-badge">'+id+'</span>');
  html+=row('Pelapor','<strong>'+esc(l.namaPelapor)+'</strong>');
  html+=row('No. WA',esc((l.pelapor||'').replace('@s.whatsapp.net',''))||'-');
  html+='<hr class="detail-divider">';
  html+=row('Kategori','<span class="kat-tag">'+esc(l.kategori)+'</span>');
  html+=row('Kelurahan',esc(l.kelurahan)||'-');
  html+=row('Uraian',esc(l.isi)||'-');
  html+='<hr class="detail-divider">';
  html+=row('Alamat',esc(l.alamat)||'-');
  html+=row('Lokasi','<a class="map-link" href="https://maps.google.com/?q='+lat+','+lon+'" target="_blank">📍 '+lat+', '+lon+' — Buka Google Maps</a>');
  html+=row('Waktu',esc(l.tanggal?new Date(l.tanggal).toLocaleString('id-ID',{timeZone:'Asia/Jakarta',dateStyle:'full',timeStyle:'short'}):'-'));
  html+='<hr class="detail-divider">';
  if (l.fotoPath) {
    html+=row('Foto Bukti','<a href="'+l.fotoPath+'" target="_blank"><img src="'+l.fotoPath+'" class="modal-img" alt="Foto bukti laporan" loading="lazy"></a><div style="font-size:11px;color:var(--muted);margin-top:6px">Klik foto untuk buka ukuran penuh</div>');
  } else {
    html+=row('Foto Bukti','<div class="no-img">📷 Foto tidak tersedia untuk laporan ini</div>');
  }
  html+='<hr class="detail-divider">';
  html+='<div class="fb-box">'
    +'<div class="fb-title">💬 Kirim Balasan ke Pelapor</div>'
    +'<textarea class="fb-textarea" id="fb-pesan-'+l.id+'" placeholder="Tulis balasan / hasil tindak lanjut laporan ini..."></textarea>'
    +'<label class="fb-file-label" for="fb-foto-'+l.id+'">'
    +'📎 Lampirkan Foto (opsional)'
    +'<input type="file" id="fb-foto-'+l.id+'" accept="image/*" style="display:none" onchange="previewFbFoto(this,'+l.id+')">'
    +'</label>'
    +'<img id="fb-preview-'+l.id+'" class="fb-preview" alt="Preview">'
    +'<button class="fb-send-btn" data-id="'+l.id+'" data-pelapor="'+esc(l.pelapor||'')+'" data-nama="'+esc(l.namaPelapor||'')+'" onclick="sendFeedback(this.dataset.id,this.dataset.pelapor,this.dataset.nama,this)">📤 Kirim Balasan via WhatsApp</button>'
    +'<div class="fb-status" id="fb-status-'+l.id+'"></div>'
    +'</div>';
  document.getElementById('modal-body').innerHTML=html;
  document.getElementById('modal-overlay').style.display='flex';
}
function closeModal(e){if(e.target.id==='modal-overlay')closeModalDirect()}
function closeModalDirect(){document.getElementById('modal-overlay').style.display='none'}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModalDirect()});

const COLORS=['#00c8ff','#00e5a0','#fbbf24','#a78bfa','#ff4d6d','#38bdf8','#fb923c'];
const gridOpts={color:'rgba(26,51,86,.6)'};
const tickOpts={color:'#4a6a8a',font:{size:11}};
new Chart(document.getElementById('chartDay').getContext('2d'),{
  type:'bar',
  data:{labels:${cDayL},datasets:[{data:${cDayD},backgroundColor:'rgba(0,200,255,.2)',borderColor:'#00c8ff',borderWidth:1.5,borderRadius:5}]},
  options:{plugins:{legend:{display:false}},scales:{x:{grid:gridOpts,ticks:tickOpts},y:{grid:gridOpts,ticks:{...tickOpts,stepSize:1},beginAtZero:true}},responsive:true}
});
new Chart(document.getElementById('chartKat').getContext('2d'),{
  type:'doughnut',
  data:{labels:${cKatL},datasets:[{data:${cKatD},backgroundColor:COLORS,borderWidth:0,hoverOffset:6}]},
  options:{plugins:{legend:{position:'bottom',labels:{color:'#8facc5',font:{size:11},padding:10,boxWidth:12}}},cutout:'62%',responsive:true}
});
new Chart(document.getElementById('chartKel').getContext('2d'),{
  type:'bar',
  data:{labels:${cKelL},datasets:[{data:${cKelD},backgroundColor:COLORS.map(c=>c+'33'),borderColor:COLORS,borderWidth:1.5,borderRadius:4}]},
  options:{indexAxis:'y',plugins:{legend:{display:false}},scales:{x:{grid:gridOpts,ticks:{...tickOpts,stepSize:1},beginAtZero:true},y:{grid:{display:false},ticks:tickOpts}},responsive:true}
});

// ── SSE REAL-TIME UPDATE ─────────────────────────────────
const toastStyle = \`
  position:fixed;bottom:24px;right:24px;z-index:999;
  background:#0e1e38;border:1px solid rgba(0,229,160,.35);
  border-radius:12px;padding:14px 18px;
  display:flex;align-items:center;gap:10px;
  box-shadow:0 8px 32px rgba(0,0,0,.5);
  font-family:'DM Sans',sans-serif;font-size:13px;color:#e2eaf5;
  animation:slideIn .35s cubic-bezier(.16,1,.3,1) both;
  max-width:320px;
\`;
const toastKeyframes = \`@keyframes slideIn{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:none}}\`;
const styleEl = document.createElement('style');
styleEl.textContent = toastKeyframes;
document.head.appendChild(styleEl);

function showToast(msg, emoji='🔔') {
  const t = document.createElement('div');
  t.style.cssText = toastStyle;
  t.innerHTML = '<span style="font-size:20px">'+emoji+'</span><div><div style="font-weight:600;margin-bottom:2px">Laporan Baru Masuk!</div><div style="font-size:12px;color:#8facc5">'+msg+'</div></div><button onclick="this.parentElement.remove()" style="background:none;border:none;color:#4a6a8a;font-size:18px;cursor:pointer;margin-left:auto;padding:0 0 0 8px">✕</button>';
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 8000);
}

function fmtDateClient(iso) {
  try { return new Date(iso).toLocaleString('id-ID',{timeZone:'Asia/Jakarta',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}); }
  catch { return iso||'-'; }
}

function buildRow(l) {
  const id='#'+String(l.id||0).padStart(4,'0');
  const jsonEsc=esc(JSON.stringify(l)).replace(/'/g,"\\\\'");
  return '<tr data-kat="'+esc(l.kategori)+'" data-kel="'+esc(l.kelurahan)+'" style="animation:fi .4s ease both">'
    +'<td><span class="id-badge">'+id+'</span></td>'
    +'<td><div class="fw5">'+esc(l.namaPelapor)+'</div><div class="fz12 text-muted">'+esc((l.pelapor||'').replace('@s.whatsapp.net',''))+'</div></td>'
    +'<td><span class="kat-tag">'+esc(l.kategori)+'</span></td>'
    +'<td>'+esc(l.kelurahan)+'</td>'
    +'<td class="fz13 text-muted2" style="max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="'+esc(l.isi)+'">'+(l.isi||'').substring(0,60)+((l.isi||'').length>60?'…':'')+'</td>'
    +'<td><a class="map-link" href="https://maps.google.com/?q='+(l.koordinat?.lat||0)+','+(l.koordinat?.lon||0)+'" target="_blank">📍 Peta</a></td>'
    +'<td class="fz12 text-muted2">'+fmtDateClient(l.tanggal)+'</td>'
    +'<td><button class="det-btn" onclick=\\'showDetail(JSON.stringify('+jsonEsc+'))\\'>Detail</button></td>'
    +'</tr>';
}

let knownCount = ${total};

const evtSource = new EventSource('/sse');
evtSource.addEventListener('update', (e) => {
  const data = JSON.parse(e.data);
  const laporan = data.laporan;
  if (!laporan || laporan.length === knownCount) return;

  const newCount = laporan.length;
  const newItems = laporan.slice(0, newCount - knownCount);
  knownCount = newCount;

  document.querySelector('#sec-overview .sc-val').textContent = newCount;
  const todayCount = laporan.filter(l=>new Date(l.tanggal).toDateString()===new Date().toDateString()).length;
  document.querySelectorAll('#sec-overview .sc-val')[1].textContent = todayCount;
  const now=new Date();
  const monthCount = laporan.filter(l=>{const d=new Date(l.tanggal);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();}).length;
  document.querySelectorAll('#sec-overview .sc-val')[2].textContent = monthCount;

  document.getElementById('row-count').textContent = newCount;

  const tbody = document.getElementById('table-body');
  newItems.reverse().forEach(l => {
    tbody.insertAdjacentHTML('afterbegin', buildRow(l));
  });

  const overviewTbody = document.querySelector('#sec-overview table tbody');
  if (overviewTbody) {
    newItems.reverse().forEach(l => {
      const id='#'+String(l.id||0).padStart(4,'0');
      const jsonEsc=esc(JSON.stringify(l)).replace(/'/g,"\\\\'");
      const row='<tr style="animation:fi .4s ease both">'
        +'<td><span class="id-badge">'+id+'</span></td>'
        +'<td class="fw5">'+esc(l.namaPelapor)+'</td>'
        +'<td><span class="kat-tag">'+esc(l.kategori)+'</span></td>'
        +'<td>'+esc(l.kelurahan)+'</td>'
        +'<td class="fz12 text-muted2">'+fmtDateClient(l.tanggal)+'</td>'
        +'<td><button class="det-btn" onclick=\\'showDetail(JSON.stringify('+jsonEsc+'))\\'>Detail</button></td>'
        +'</tr>';
      overviewTbody.insertAdjacentHTML('afterbegin', row);
    });
    Array.from(overviewTbody.querySelectorAll('tr')).slice(5).forEach(r=>r.remove());
  }

  newItems.forEach(l => {
    showToast(esc(l.kategori)+' — '+esc(l.kelurahan)+' oleh '+esc(l.namaPelapor));
  });
});

evtSource.addEventListener('error', () => {});

function startExport(el) {
  el.classList.add('loading');
  el.textContent = '⏳ Menyiapkan...';
  setTimeout(() => {
    el.classList.remove('loading');
    el.textContent = '📊 Export Excel';
  }, 4000);
}

function previewFbFoto(input, laporanId) {
  const preview = document.getElementById('fb-preview-' + laporanId);
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = e => {
      preview.src = e.target.result;
      preview.style.display = 'block';
    };
    reader.readAsDataURL(input.files[0]);
    input.previousElementSibling && (input.parentElement.childNodes[0].textContent = '✅ ' + input.files[0].name);
  }
}

async function sendFeedback(laporanId, pelapor, namaPelapor, btn) {
  const pesanEl = document.getElementById('fb-pesan-' + laporanId);
  const fotoEl  = document.getElementById('fb-foto-'  + laporanId);
  const statusEl= document.getElementById('fb-status-'+ laporanId);
  const pesan = pesanEl.value.trim();

  if (!pesan) { pesanEl.focus(); return; }

  btn.disabled = true;
  btn.textContent = '⏳ Mengirim...';
  statusEl.className = 'fb-status';
  statusEl.style.display = 'none';

  let foto_base64 = null, foto_mime = null;
  const file = fotoEl.files && fotoEl.files[0];
  if (file) {
    foto_base64 = await new Promise(resolve => {
      const r = new FileReader();
      r.onload = e => resolve(e.target.result.split(',')[1]);
      r.readAsDataURL(file);
    });
    foto_mime = file.type || 'image/jpeg';
  }

  try {
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ laporanId, pelapor, namaPelapor, pesan, foto_base64, foto_mime })
    });
    const json = await res.json();
    if (json.ok) {
      statusEl.textContent = '✅ Balasan berhasil diantrekan! Bot akan mengirim ke pelapor sebentar lagi.';
      statusEl.className = 'fb-status ok';
      pesanEl.value = '';
      fotoEl.value = '';
      document.getElementById('fb-preview-' + laporanId).style.display = 'none';
      btn.textContent = '✅ Terkirim';
    } else {
      throw new Error(json.error || 'Gagal');
    }
  } catch(e) {
    statusEl.textContent = '❌ Gagal: ' + e.message;
    statusEl.className = 'fb-status err';
    btn.disabled = false;
    btn.textContent = '📤 Kirim Balasan via WhatsApp';
  }
}

// ══════════════════════════════════════════════
//   LIVECHAT ADMIN — Real-time via SSE
// ══════════════════════════════════════════════
let lcSessions = [];
let lcActiveId  = null;

function fmtTime(iso) {
  try { return new Date(iso).toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit', timeZone:'Asia/Jakarta' }); }
  catch { return ''; }
}

function renderSessions(sessions) {
  const el = document.getElementById('lc-sessions');
  document.getElementById('lc-count').textContent = sessions.length;

  const totalUnread = sessions.reduce((n,s) => n + (s.status==='active' ? (s.unread||0) : 0), 0);
  const badge = document.getElementById('lc-unread-badge');
  if (totalUnread > 0) { badge.textContent = totalUnread; badge.style.display='inline'; }
  else { badge.style.display='none'; }

  if (!sessions.length) {
    el.innerHTML = '<div style="padding:30px;text-align:center;color:var(--muted);font-size:12px">Belum ada sesi</div>';
    return;
  }

  el.innerHTML = sessions.map(s => {
    const lastMsg = s.messages?.slice(-1)[0];
    const preview = lastMsg ? lastMsg.text.substring(0,40) + (lastMsg.text.length>40?'…':'') : 'Sesi dimulai';
    const initials = (s.name||'?').charAt(0).toUpperCase();
    const active = s.id === lcActiveId ? 'active' : '';
    const closedCls = s.status==='closed' ? 'closed' : '';
    const unreadHtml = s.status==='active' && s.unread > 0
      ? \`<span class="lc-unread">\${s.unread}</span>\` : '';
    return \`<div class="lc-item \${active} \${closedCls}" onclick="openChat('\${s.id}')">
      <div class="lc-avatar">\${initials}</div>
      <div class="lc-meta">
        <div class="lc-name">\${esc(s.name)} \${unreadHtml}</div>
        <div class="lc-preview">\${esc(preview)}</div>
      </div>
      <div class="lc-time">\${fmtTime(s.lastMessageAt)}</div>
    </div>\`;
  }).join('');
}

function renderMessages(session) {
  const el = document.getElementById('lc-messages');
  if (!session.messages?.length) {
    el.innerHTML = '<div style="text-align:center;color:var(--muted);font-size:12px;padding:20px">Belum ada pesan</div>';
    return;
  }
  el.innerHTML = session.messages.map(m => {
    let bubbleContent = '';
    if (m.mediaPath) {
      bubbleContent += \`<a href="\${m.mediaPath}" target="_blank" rel="noopener">
        <img src="\${m.mediaPath}" class="lc-msg-img" alt="Foto" loading="lazy">
      </a>\`;
      if (m.text && m.text !== '[Foto]') {
        bubbleContent += \`<div style="margin-top:6px;font-size:13px">\${esc(m.text)}</div>\`;
      }
    } else {
      bubbleContent = esc(m.text);
    }
    return \`
    <div class="lc-msg \${m.from}">
      <div class="lc-msg-sender">\${m.from==='admin'?'Admin':'👤 '+esc(session.name)}</div>
      <div class="lc-bubble">\${bubbleContent}</div>
      <div class="lc-msg-time">\${fmtTime(m.timestamp)}</div>
    </div>\`;
  }).join('');
  el.scrollTop = el.scrollHeight;
}

function openChat(sessionId) {
  lcActiveId = sessionId;
  const session = lcSessions.find(s => s.id === sessionId);
  if (!session) return;

  fetch('/api/livechat/read', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId }) });

  document.querySelectorAll('.lc-item').forEach(el => {
    el.classList.toggle('active', el.getAttribute('onclick').includes(sessionId));
  });

  document.getElementById('lc-no-chat').style.display = 'none';
  const panel = document.getElementById('lc-active-chat');
  panel.style.display = 'flex';

  document.getElementById('lc-chat-name').textContent = session.name;
  document.getElementById('lc-chat-jid').textContent = (session.jid||'').replace('@s.whatsapp.net','');

  const dot = document.getElementById('lc-status-dot');
  dot.className = 'lc-status-dot' + (session.status==='closed' ? ' closed' : '');

  document.getElementById('lc-closed-banner').style.display = session.status==='closed' ? 'block' : 'none';
  document.getElementById('lc-input-area').style.display = session.status==='closed' ? 'none' : 'flex';
  document.getElementById('lc-end-btn').style.display = session.status==='closed' ? 'none' : '';

  renderMessages(session);
  session.unread = 0;
  renderSessions(lcSessions);
}

async function sendReply() {
  if (!lcActiveId) return;
  const input = document.getElementById('lc-reply-input');
  const btn   = document.getElementById('lc-reply-btn');
  const text  = input.value.trim();
  if (!text) return;

  const session = lcSessions.find(s => s.id === lcActiveId);
  if (!session || session.status === 'closed') return;

  btn.disabled = true;
  input.disabled = true;

  try {
    const res = await fetch('/api/livechat/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: lcActiveId, text })
    });
    const json = await res.json();
    if (!json.ok) alert('Gagal kirim: ' + (json.error || 'Unknown error'));
    else input.value = '';
  } catch(e) {
    alert('Error: ' + e.message);
  } finally {
    btn.disabled = false;
    input.disabled = false;
    input.focus();
  }
}

async function endSession() {
  if (!lcActiveId) return;
  if (!confirm('Akhiri sesi LiveChat dengan warga ini?')) return;
  try {
    const res = await fetch('/api/livechat/close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: lcActiveId })
    });
    const json = await res.json();
    if (!json.ok) alert('Gagal: ' + (json.error||''));
  } catch(e) { alert('Error: '+e.message); }
}

evtSource.addEventListener('livechat', (e) => {
  const data = JSON.parse(e.data);
  lcSessions = data.sessions || [];
  renderSessions(lcSessions);

  if (lcActiveId) {
    const current = lcSessions.find(s => s.id === lcActiveId);
    if (current) {
      renderMessages(current);
      document.getElementById('lc-closed-banner').style.display = current.status==='closed' ? 'block' : 'none';
      document.getElementById('lc-input-area').style.display = current.status==='closed' ? 'none' : 'flex';
      document.getElementById('lc-end-btn').style.display = current.status==='closed' ? 'none' : '';
      const dot = document.getElementById('lc-status-dot');
      dot.className = 'lc-status-dot' + (current.status==='closed'?' closed':'');
    }
  }
});

evtSource.addEventListener('livechat_new', (e) => {
  const data = JSON.parse(e.data);
  showToast(esc(data.name)+': '+esc((data.text||'').substring(0,50)), '💬');
});
<\/script></body></html>`;
};
