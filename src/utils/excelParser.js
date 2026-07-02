import * as XLSX from 'xlsx-js-style';

export const parseEPresensi = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        const headers = jsonData[1];
        if (!headers || !headers.includes('Nama Pegawai')) {
          throw new Error('Format file tidak dikenali. Pastikan ini adalah file E-Presensi DKP Jatim.');
        }

        const parsedData = jsonData.slice(2).map((row) => {
          const rowObj = {};
          headers.forEach((header, index) => {
            if (header) {
              rowObj[header] = row[index];
            }
          });
          return rowObj;
        }).filter(row => row['Nama Pegawai']); 

        resolve(parsedData);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

export const exportToRekapUsulan = (selectedEmployees) => {
  // Define headers based on Rekap Usulan EOM
  const headersRow2 = [
    'No', 'Usulan Nama', 'NIP', 'Status ASN', 'Jabatan', 'Unit Kerja', 
    'Kategori Pegawai Terbaik', 'PIC', 'Kriteria Penilaian', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
  ];
  
  const headersRow3 = [
    '', '', '', '', '', '', '', '', 'Rekap Kehadiran sesuai E Presensi (hari)', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'Kelengkapan dan Kesesuaian Bukti (evidence) Kinerja', 'Total Nilai Predikat SKP', 'Durasi Dihitung'
  ];

  const headersRow4 = [
    '', '', '', '', '', '', '', '', 'Kehadiran (hari)', 'DL/Ijin/Cuti', 
    'Tidak Absen Datang', 'Tidak Absen Pulang', 'Menit Terlambat', 'Alpha', 
    'Tidak Senam', 'Tidak Apel', 'Ijin Dg Ket (di potong)', 'Lupa Absen', 
    'Dihitung Terlambat Menit (Flexi Working)', 'Frekuensi Terlambat (Hari)', 
    'Toleransi Terlambat 5 Hari (menit)', 'Cuti', 'Tidak Masuk Tanpa Keterangan', 
    '', '', ''
  ];

  const dataRows = selectedEmployees.map((emp, index) => {
    return [
      index + 1, 
      emp['Nama Pegawai'] || '',
      emp['NIP'] ? emp['NIP'].toString().replace(/[`']/g, '') : '', 
      emp['Status'] || '',
      emp['kelas jabatan'] || '', 
      emp['OPD'] || '', 
      '', 
      '', 
      emp['kehadiran'] || 0, 
      emp['DL/Ijin/Cuti'] || 0,
      emp['tad'] || 0,
      emp['tap'] || 0,
      emp['menit terlambat'] || 0,
      emp['alpha'] || 0,
      emp['tidak senam'] || 0,
      emp['tidak apel'] || 0,
      emp['Ijin Dg Ket (di potong)'] || 0,
      emp['lupaabsen'] || 0,
      emp['Dihitung Terlambat Menit (Flexi Working)'] || 0,
      emp['Frekuensi Terlambat (Hari)'] || 0,
      emp['Toleransi 5 Hari (menit)'] || 0,
      emp['Total Cuti'] || 0,
      emp['2026 - Tidak Masuk Tanpa Keterangan'] || 0,
      '', 
      '', 
      emp['2026 - Durasi Dihitung'] || '',
    ];
  });

  const monthNames = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  let periodString = new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' });
  
  if (selectedEmployees.length > 0 && selectedEmployees[0]['Bulan'] && selectedEmployees[0]['Tahun']) {
    const bulanNum = parseInt(selectedEmployees[0]['Bulan']);
    const tahunNum = selectedEmployees[0]['Tahun'];
    if (!isNaN(bulanNum) && bulanNum >= 1 && bulanNum <= 12) {
      periodString = `${monthNames[bulanNum]} ${tahunNum}`;
    }
  }

  const titleRow = ['Periode : ' + periodString];

  const finalData = [
    titleRow,
    [], 
    headersRow2,
    headersRow3,
    headersRow4,
    ...dataRows
  ];

  const ws = XLSX.utils.aoa_to_sheet(finalData);

  ws['!merges'] = [
    { s: { r: 2, c: 0 }, e: { r: 4, c: 0 } }, // No
    { s: { r: 2, c: 1 }, e: { r: 4, c: 1 } }, // Usulan Nama
    { s: { r: 2, c: 2 }, e: { r: 4, c: 2 } }, // NIP
    { s: { r: 2, c: 3 }, e: { r: 4, c: 3 } }, // Status ASN
    { s: { r: 2, c: 4 }, e: { r: 4, c: 4 } }, // Jabatan
    { s: { r: 2, c: 5 }, e: { r: 4, c: 5 } }, // Unit Kerja
    { s: { r: 2, c: 6 }, e: { r: 4, c: 6 } }, // Kategori Pegawai Terbaik
    { s: { r: 2, c: 7 }, e: { r: 4, c: 7 } }, // PIC
    { s: { r: 2, c: 8 }, e: { r: 2, c: 25 } }, // Kriteria Penilaian
    { s: { r: 3, c: 8 }, e: { r: 3, c: 22 } }, // Rekap Kehadiran
    { s: { r: 3, c: 23 }, e: { r: 4, c: 23 } }, // Kelengkapan
    { s: { r: 3, c: 24 }, e: { r: 4, c: 24 } }, // SKP
    { s: { r: 3, c: 25 }, e: { r: 4, c: 25 } }, // Durasi
  ];

  // Styling for Headers
  const headerStyle = {
    fill: { fgColor: { rgb: "ADD8E6" } }, // Light blue background
    font: { bold: true, color: { rgb: "000000" } },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    }
  };

  // Apply styles to all cells in rows 2, 3, 4 (0-indexed -> 2,3,4)
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let R = 2; R <= 4; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = { c: C, r: R };
      const cellRef = XLSX.utils.encode_cell(cellAddress);
      
      if (!ws[cellRef]) {
        ws[cellRef] = { t: 's', v: '' }; // Create empty cell if undefined to apply style to merged area
      }
      ws[cellRef].s = headerStyle;
    }
  }

  // Styling for Data Rows (Borders only)
  const dataStyle = {
    font: { color: { rgb: "000000" } },
    alignment: { vertical: "center", wrapText: true },
    border: {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    }
  };

  // Apply styles to data rows
  for (let R = 5; R < 5 + dataRows.length; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = { c: C, r: R };
      const cellRef = XLSX.utils.encode_cell(cellAddress);
      
      if (!ws[cellRef]) {
        ws[cellRef] = { t: 's', v: '' };
      }
      ws[cellRef].s = dataStyle;
    }
  }

  // Auto-width for columns
  const colWidths = [
    { wch: 5 },  // No
    { wch: 30 }, // Nama
    { wch: 20 }, // NIP
    { wch: 15 }, // Status
    { wch: 20 }, // Jabatan
    { wch: 40 }, // Unit Kerja
    { wch: 20 }, // Kategori
    { wch: 10 }, // PIC
  ];
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Rekap_Usulan");
  
  XLSX.writeFile(wb, "Hasil_Rekap_Usulan_EOM.xlsx");
};

export const getTopSekretariat = (data) => {
  const sekretariatData = data.filter(emp => 
    emp['OPD'] && emp['OPD'].toLowerCase().includes('sekretariat')
  );

  return sekretariatData.sort((a, b) => {
    // 1. Kehadiran (DESC)
    const hadirA = parseFloat(a['kehadiran']) || 0;
    const hadirB = parseFloat(b['kehadiran']) || 0;
    if (hadirB !== hadirA) return hadirB - hadirA;

    // 2. Penalty Score (ASC)
    // Bobot: Alpha(1000), LupaAbsen/TAD/TAP(100), Apel/Senam(50), Terlambat(1/menit)
    const getPenalty = (emp) => {
      return (parseFloat(emp['alpha']) || 0) * 1000 +
             (parseFloat(emp['tad']) || 0) * 100 +
             (parseFloat(emp['tap']) || 0) * 100 +
             (parseFloat(emp['lupaabsen']) || 0) * 100 +
             (parseFloat(emp['tidak apel']) || 0) * 50 +
             (parseFloat(emp['tidak senam']) || 0) * 50 +
             (parseFloat(emp['menit terlambat']) || 0);
    };

    return getPenalty(a) - getPenalty(b);
  });
};

export const exportTopSekretariat = (sekretariatData) => {
  const headers = [
    'Peringkat', 'Nama Pegawai', 'NIP', 'Status ASN', 'Jabatan', 'Unit Kerja', 'Kehadiran (hari)', 'Ijin/Cuti',
    'Alpha', 'Lupa Absen', 'TAD', 'TAP', 'Tidak Apel', 'Tidak Senam', 'Menit Terlambat'
  ];

  const dataRows = sekretariatData.map((emp, index) => [
    index + 1,
    emp['Nama Pegawai'] || '',
    emp['NIP'] ? String(emp['NIP']).replace(/[`']/g, '') : '',
    emp['Status'] || '',
    emp['kelas jabatan'] || '',
    emp['OPD'] || '',
    emp['kehadiran'] || 0,
    emp['DL/Ijin/Cuti'] || 0,
    emp['alpha'] || 0,
    emp['lupaabsen'] || 0,
    emp['tad'] || 0,
    emp['tap'] || 0,
    emp['tidak apel'] || 0,
    emp['tidak senam'] || 0,
    emp['menit terlambat'] || 0
  ]);

  const finalData = [headers, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(finalData);

  const headerStyle = {
    fill: { fgColor: { rgb: "F59E0B" } }, // Amber-500
    font: { bold: true, color: { rgb: "FFFFFF" } },
    alignment: { horizontal: "center", vertical: "center" }
  };

  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cellRef = XLSX.utils.encode_cell({ c: C, r: 0 });
    if (ws[cellRef]) ws[cellRef].s = headerStyle;
  }

  const colWidths = [
    { wch: 10 }, { wch: 35 }, { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 35 }, { wch: 15 },
    { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 10 },
    { wch: 12 }, { wch: 12 }, { wch: 15 }
  ];
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Top_Sekretariat");
  XLSX.writeFile(wb, "Top_Absensi_Sekretariat.xlsx");
};
