// ═══════════════════════════════════════════════════════════
//   WEB-EXCEL.JS — Export Excel Handler
//   Hallo Johor Dashboard
// ═══════════════════════════════════════════════════════════

import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FOTO_COL      = 10;  // Kolom J = Foto Bukti
const IMG_ROW_HEIGHT = 80;

/**
 * Generate dan kirim file Excel laporan ke HTTP response.
 * @param {import('http').ServerResponse} res
 * @param {Array} laporanData
 * @param {string} dataDir - Relative path ke folder data, e.g. './data'
 */
export const handleExcelExport = async (res, laporanData, dataDir = './data') => {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Hallo Johor Bot';
  wb.created = new Date();

  const ws = wb.addWorksheet('Laporan Pengaduan', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true }
  });

  // ── Column widths ──
  ws.columns = [
    { key: 'no',        width: 12  },
    { key: 'tanggal',   width: 24  },
    { key: 'pelapor',   width: 22  },
    { key: 'nowa',      width: 18  },
    { key: 'kategori',  width: 22  },
    { key: 'kelurahan', width: 20  },
    { key: 'uraian',    width: 42  },
    { key: 'alamat',    width: 42  },
    { key: 'maps',      width: 38  },
    { key: 'foto',      width: 22  },
  ];

  const HEADER_LABELS = [
    'No. Laporan', 'Tanggal', 'Pelapor', 'No. WA',
    'Kategori', 'Kelurahan', 'Uraian', 'Alamat', 'Google Maps', 'Foto Bukti'
  ];

  const HEADER_COLORS = [
    '1E3A5F','1E3A5F','1E3A5F','1E3A5F',
    '2D1B69','1A4731','1A3A4F','1A3A4F','1A3A4F','2D3748'
  ];

  // ── Header row ──
  const headerRow = ws.addRow(HEADER_LABELS);
  headerRow.height = 26;
  headerRow.eachCell((cell, colNum) => {
    cell.value    = HEADER_LABELS[colNum - 1];
    cell.font     = { name: 'Arial', bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
    cell.fill     = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + HEADER_COLORS[colNum - 1] } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top:    { style: 'thin', color: { argb: 'FF2D4A6F' } },
      left:   { style: 'thin', color: { argb: 'FF2D4A6F' } },
      bottom: { style: 'thin', color: { argb: 'FF2D4A6F' } },
      right:  { style: 'thin', color: { argb: 'FF2D4A6F' } },
    };
  });

  // ── Data rows ──
  for (let i = 0; i < laporanData.length; i++) {
    const l = laporanData[i];
    const hasFoto = !!l.fotoPath;
    const lat = l.koordinat?.lat || l.koordinat?.latitude || '';
    const lon = l.koordinat?.lon || l.koordinat?.longitude || '';
    const mapsUrl = lat && lon ? `https://maps.google.com/?q=${lat},${lon}` : '';
    const tanggalFormatted = l.tanggal
      ? new Date(l.tanggal).toLocaleString('id-ID', { timeZone:'Asia/Jakarta', day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })
      : '-';

    const rowValues = [
      `#${String(l.id||0).padStart(4,'0')}`,
      tanggalFormatted,
      l.namaPelapor || '-',
      (l.pelapor||'').replace('@s.whatsapp.net','') || '-',
      l.kategori || '-',
      l.kelurahan || '-',
      l.isi || '-',
      l.alamat || '-',
      mapsUrl,
      hasFoto ? '' : '(Tidak ada foto)',
    ];

    const row = ws.addRow(rowValues);
    row.height = hasFoto ? IMG_ROW_HEIGHT : 20;

    // Maps URL as hyperlink
    if (mapsUrl) {
      const mapsCell = row.getCell(9);
      mapsCell.value = { text: 'Buka Google Maps', hyperlink: mapsUrl };
      mapsCell.font  = { color:{ argb:'FF0070C0' }, underline:true, name:'Arial', size:10 };
    }

    // Zebra stripe
    const bgColor = i % 2 === 0 ? 'FFFFFFFF' : 'FFF0F4FA';
    row.eachCell({ includeEmpty:true }, (cell, colNum) => {
      if (colNum === 9 && mapsUrl) return;
      cell.font      = cell.font || {};
      cell.font.name = 'Arial';
      cell.font.size = 10;
      cell.fill = { type:'pattern', pattern:'solid', fgColor:{ argb: bgColor } };
      cell.alignment = { vertical:'middle', wrapText:true, ...(colNum===1 ? {horizontal:'center'} : {}) };
      cell.border = {
        top:   { style:'hair', color:{ argb:'FFD0D8E4' } },
        left:  { style:'hair', color:{ argb:'FFD0D8E4' } },
        bottom:{ style:'hair', color:{ argb:'FFD0D8E4' } },
        right: { style:'hair', color:{ argb:'FFD0D8E4' } },
      };
    });

    // ── Embed foto ──
    if (hasFoto) {
      const fotoFilename = path.basename(l.fotoPath);
      const fotoFullPath = path.join(__dirname, dataDir, 'foto', fotoFilename);
      if (fs.existsSync(fotoFullPath)) {
        try {
          const ext = fotoFilename.split('.').pop().toLowerCase();
          const imageId = wb.addImage({
            filename: fotoFullPath,
            extension: ext === 'png' ? 'png' : 'jpeg',
          });
          const excelRow = i + 2; // +1 header, +1 karena 1-indexed
          ws.addImage(imageId, {
            tl: { col: FOTO_COL - 1, row: excelRow - 1 },
            br: { col: FOTO_COL,     row: excelRow },
            editAs: 'oneCell',
          });
        } catch {
          row.getCell(FOTO_COL).value = '(Foto gagal dimuat)';
        }
      } else {
        row.getCell(FOTO_COL).value = '(File foto tidak ditemukan)';
      }
    }
  }

  // ── Summary sheet ──
  const ws2 = wb.addWorksheet('Ringkasan');
  ws2.columns = [
    { key:'label', width:30 },
    { key:'value', width:20 },
  ];

  const nowID = new Date().toLocaleString('id-ID', { timeZone:'Asia/Jakarta', dateStyle:'full', timeStyle:'short' });
  const summaryData = [
    ['RINGKASAN LAPORAN HALLO JOHOR', ''],
    ['Diekspor pada', nowID],
    ['', ''],
    ['Total Laporan', laporanData.length],
  ];

  const katCount = {};
  laporanData.forEach(l => { katCount[l.kategori||'Lainnya'] = (katCount[l.kategori||'Lainnya']||0)+1; });
  summaryData.push(['', '']);
  summaryData.push(['REKAPITULASI PER KATEGORI', '']);
  Object.entries(katCount).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => summaryData.push([k, v]));

  const kelCount = {};
  laporanData.forEach(l => { kelCount[l.kelurahan||'Lainnya'] = (kelCount[l.kelurahan||'Lainnya']||0)+1; });
  summaryData.push(['', '']);
  summaryData.push(['REKAPITULASI PER KELURAHAN', '']);
  Object.entries(kelCount).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => summaryData.push([k, v]));

  summaryData.forEach((rowData, idx) => {
    const r = ws2.addRow(rowData);
    r.getCell(1).font = { name:'Arial', size: idx===0||rowData[0].startsWith('REKAP') ? 12 : 10, bold: idx===0||rowData[0].startsWith('REKAP') };
    if (typeof rowData[1] === 'number') {
      r.getCell(2).font   = { name:'Arial', size:10, bold:true, color:{argb:'FF1A4731'} };
      r.getCell(2).alignment = { horizontal:'center' };
    }
  });

  // ── Kirim response ──
  const filename = `Laporan_HalloJohor_${new Date().toISOString().slice(0,10)}.xlsx`;
  const buffer = await wb.xlsx.writeBuffer();
  res.writeHead(200, {
    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Content-Length': buffer.length,
  });
  res.end(Buffer.from(buffer));
};
