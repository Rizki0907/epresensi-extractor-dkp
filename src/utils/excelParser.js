import * as XLSX from 'xlsx';

export const parseEPresensi = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Read the worksheet as a 2D array
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // E-Presensi format usually has headers on the second row (index 1)
        // Row 0 is the "export-skp..." metadata row
        const headers = jsonData[1];
        if (!headers || !headers.includes('Nama Pegawai')) {
          throw new Error('Format file tidak dikenali. Pastikan ini adalah file E-Presensi DKP Jatim.');
        }

        // Map data based on headers
        const parsedData = jsonData.slice(2).map((row) => {
          const rowObj = {};
          headers.forEach((header, index) => {
            if (header) {
              rowObj[header] = row[index];
            }
          });
          return rowObj;
        }).filter(row => row['Nama Pegawai']); // Only keep rows with names

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
    'Kategori Pegawai Terbaik', 'PIC', 'Kriteria Penilaian', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
  ];
  
  const headersRow3 = [
    '', '', '', '', '', '', '', '', 'Rekap Kehadiran sesuai E Presensi (hari)', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'Kelengkapan dan Kesesuaian Bukti (evidence) Kinerja', '', '', '', ''
  ];

  const headersRow4 = [
    '', '', '', '', '', '', '', '', 'Kehadiran (hari)', 'DL/Ijin/Cuti', 
    'Tidak Absen Datang', 'Tidak Absen Pulang', 'Menit Terlambat', 'Alpha', 
    'Tidak Senam', 'Tidak Apel', 'Ijin Dg Ket (di potong)', 'Lupa Absen', 
    'Dihitung Terlambat Menit (Flexi Working)', 'Frekuensi Terlambat (Hari)', 
    'Toleransi Terlambat 5 Hari (menit)', 'Cuti', 'Tidak Masuk Tanpa Keterangan', 
    '', 'Total Nilai Predikat SKP', 'Durasi Dihitung', 'Skor SKP', ''
  ];

  // Map selected employees to the format
  const dataRows = selectedEmployees.map((emp, index) => {
    return [
      index + 1, // No
      emp['Nama Pegawai'] || '',
      emp['NIP'] ? emp['NIP'].toString().replace(/[`']/g, '') : '', // Clean NIP
      emp['Status'] || '',
      emp['kelas jabatan'] || '', // Fallback for Jabatan, wait user said leave blank if not sure, let's try 'OPD' string or leave blank. Let's just put 'kelas jabatan'.
      emp['OPD'] || '', // Unit Kerja
      '', // Kategori Pegawai Terbaik
      '', // PIC
      emp['kehadiran'] || 0, // Kehadiran
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
      '', // Kelengkapan Bukti (empty)
      '', // Total Nilai Predikat SKP (empty)
      emp['2026 - Durasi Dihitung'] || '',
      '', // Skor SKP (empty)
    ];
  });

  // Add the title row
  const titleRow = ['Periode :  ' + new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' })];

  const finalData = [
    titleRow,
    [], // Empty row
    headersRow2,
    headersRow3,
    headersRow4,
    ...dataRows
  ];

  const ws = XLSX.utils.aoa_to_sheet(finalData);

  // Merging cells for styling
  ws['!merges'] = [
    { s: { r: 2, c: 0 }, e: { r: 4, c: 0 } }, // No
    { s: { r: 2, c: 1 }, e: { r: 4, c: 1 } }, // Usulan Nama
    { s: { r: 2, c: 2 }, e: { r: 4, c: 2 } }, // NIP
    { s: { r: 2, c: 3 }, e: { r: 4, c: 3 } }, // Status ASN
    { s: { r: 2, c: 4 }, e: { r: 4, c: 4 } }, // Jabatan
    { s: { r: 2, c: 5 }, e: { r: 4, c: 5 } }, // Unit Kerja
    { s: { r: 2, c: 6 }, e: { r: 4, c: 6 } }, // Kategori Pegawai Terbaik
    { s: { r: 2, c: 7 }, e: { r: 4, c: 7 } }, // PIC
    { s: { r: 2, c: 8 }, e: { r: 2, c: 27 } }, // Kriteria Penilaian
    { s: { r: 3, c: 8 }, e: { r: 3, c: 22 } }, // Rekap Kehadiran
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Rekap_Usulan");
  
  XLSX.writeFile(wb, "Hasil_Rekap_Usulan_EOM.xlsx");
};
