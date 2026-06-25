import React, { useState, useMemo } from 'react';
import { Upload, Search, Download, Trash2, FileSpreadsheet, CheckCircle2, UserPlus, Info, HelpCircle, X, Trophy } from 'lucide-react';
import { parseEPresensi, exportToRekapUsulan, getTopSekretariat } from './utils/excelParser';
import logoDKP from './assets/logo_DKP.png';

function App() {
  const [data, setData] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [error, setError] = useState(null);
  const [showAbout, setShowAbout] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showSekretariatModal, setShowSekretariatModal] = useState(false);

  const processFile = async (file) => {
    if (!file) return;
    setIsParsing(true);
    setError(null);
    try {
      const parsedData = await parseEPresensi(file);
      setData(parsedData);
      setFileName(file.name);
    } catch (err) {
      setError(err.message || 'Gagal membaca file. Pastikan formatnya benar.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileUpload = (e) => {
    processFile(e.target.files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    processFile(e.dataTransfer.files[0]);
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) return [];
    const term = searchTerm.toLowerCase();
    return data.filter(emp => {
      const isSelected = selectedEmployees.some(s => s['NIP'] === emp['NIP'] && s['Nama Pegawai'] === emp['Nama Pegawai']);
      if (isSelected) return false;

      const nameMatch = emp['Nama Pegawai'] && emp['Nama Pegawai'].toLowerCase().includes(term);
      const nipMatch = emp['NIP'] && emp['NIP'].toString().toLowerCase().includes(term);
      return nameMatch || nipMatch;
    }).slice(0, 10);
  }, [searchTerm, data, selectedEmployees]);

  const handleSelect = (employee) => {
    setSelectedEmployees([...selectedEmployees, employee]);
    setSearchTerm('');
  };

  const handleRemove = (indexToRemove) => {
    setSelectedEmployees(selectedEmployees.filter((_, idx) => idx !== indexToRemove));
  };

  const handleDownload = () => {
    if (selectedEmployees.length === 0) return;
    exportToRekapUsulan(selectedEmployees);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6 md:p-12 relative">
      
      {/* About Button */}
      <button 
        onClick={() => setShowAbout(true)}
        className="absolute top-6 right-6 flex items-center gap-2 bg-white text-slate-600 hover:text-blue-600 px-4 py-2 rounded-full shadow-sm border border-slate-200 transition-all font-medium"
      >
        <HelpCircle className="w-5 h-5" />
        <span className="hidden md:inline">Panduan Penggunaan</span>
      </button>

      <div className="max-w-4xl mx-auto space-y-8 mt-4">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <img src={logoDKP} alt="Logo DKP Jatim" className="h-24 drop-shadow-md" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">E-Presensi Extractor</h1>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg leading-relaxed">
            Alat bantu pintar untuk mengonversi data E-Presensi mentah dari BKD menjadi format standar Rekap Usulan EOM Dinas Kelautan dan Perikanan Provinsi Jawa Timur. Seluruh proses berjalan di peramban Anda dengan aman tanpa penyimpanan data permanen.
          </p>
        </div>

        {/* Upload Section */}
        {!fileName ? (
          <div 
            className={`p-10 rounded-3xl shadow-sm border-2 text-center transition-all ${isDragging ? 'bg-blue-50 border-blue-400 border-dashed scale-[1.02]' : 'bg-white border-slate-200 hover:shadow-md border-solid'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              id="file-upload" 
              className="hidden" 
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
            />
            <label 
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center space-y-6"
            >
              <div className={`p-6 rounded-full border-2 border-dashed transition-colors ${isDragging ? 'bg-blue-200 border-blue-500' : 'bg-blue-50 border-blue-300 group-hover:bg-blue-100'}`}>
                <Upload className={`w-10 h-10 ${isDragging ? 'text-blue-700' : 'text-blue-500'}`} />
              </div>
              <div>
                <p className={`text-xl font-bold ${isDragging ? 'text-blue-800' : 'text-blue-700'}`}>Unggah File E-Presensi BKD</p>
                <p className="text-slate-500 mt-2 max-w-sm mx-auto">Seret file ke sini atau klik untuk memilih file Excel (.xlsx). Pastikan baris ke-2 berisi header asli.</p>
              </div>
            </label>
            {isParsing && <p className="mt-6 text-blue-600 animate-pulse font-medium">Sedang membaca dan memetakan data sel...</p>}
            {error && <p className="mt-6 text-red-500 font-medium bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Search & Select Panel */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    Data Siap Diproses
                  </h2>
                  <button 
                    onClick={() => { setData([]); setFileName(null); setSelectedEmployees([]); }}
                    className="text-sm font-medium text-slate-400 hover:text-red-500 transition-colors bg-slate-50 hover:bg-red-50 px-3 py-1 rounded-full"
                  >
                    Tutup & Ganti File
                  </button>
                </div>
                <div className="text-sm text-slate-600 bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-900">{fileName}</p>
                    <p className="text-blue-700 opacity-80">{data.length} baris pegawai terdeteksi</p>
                  </div>
                </div>

                <div className="mt-6 relative">
                  <label className="text-sm font-bold text-slate-700 mb-2 block">Pencarian Pegawai</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="w-5 h-5 absolute left-4 top-3 text-slate-400" />
                      <input 
                        type="text" 
                        className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                        placeholder="Ketik Nama atau NIP pegawai..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <button
                      onClick={() => setShowSekretariatModal(true)}
                      className="flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-4 py-3 rounded-xl font-bold transition-colors whitespace-nowrap"
                      title="Lihat Top Absen Sekretariat"
                    >
                      <Trophy className="w-5 h-5" />
                      <span className="hidden xl:inline">Top Sekretariat</span>
                    </button>
                  </div>

                  {/* Search Results Dropdown */}
                  {searchTerm && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                      {filteredData.length > 0 ? (
                        <ul className="py-1">
                          {filteredData.map((emp, idx) => (
                            <li key={idx}>
                              <button
                                onClick={() => handleSelect(emp)}
                                className="w-full text-left px-5 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 flex items-center justify-between group transition-colors"
                              >
                                <div>
                                  <p className="font-bold text-slate-900">{emp['Nama Pegawai']}</p>
                                  <p className="text-xs text-slate-500 mt-0.5 font-medium">{emp['NIP']} • {emp['OPD']?.substring(0,35)}...</p>
                                </div>
                                <div className="bg-blue-50 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                  <UserPlus className="w-5 h-5 text-blue-600" />
                                </div>
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                         <div className="p-6 text-center text-sm text-slate-500">
                           <p className="font-medium text-slate-700">Tidak ada hasil.</p>
                           <p>Pastikan ejaan nama atau NIP sudah benar.</p>
                         </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Selected Panel */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col h-[520px]">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-800">Daftar Ekspor Terpilih</h2>
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full border border-blue-200">
                  {selectedEmployees.length} Ditambahkan
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4 custom-scrollbar">
                {selectedEmployees.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                     <div className="bg-slate-50 p-4 rounded-full border border-slate-100">
                       <UserPlus className="w-8 h-8 text-slate-300" />
                     </div>
                     <p className="text-sm font-medium">Belum ada pegawai dipilih.</p>
                     <p className="text-xs text-center px-4">Gunakan kolom pencarian di sebelah kiri untuk menambahkan pegawai ke daftar ini.</p>
                  </div>
                ) : (
                  selectedEmployees.map((emp, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-900">{emp['Nama Pegawai']}</p>
                          <p className="text-xs text-slate-500 font-medium">{emp['NIP']}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleRemove(idx)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus dari daftar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <button
                onClick={handleDownload}
                disabled={selectedEmployees.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 px-4 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
              >
                <Download className="w-5 h-5" />
                Ekspor Rekap Usulan EOM (.xlsx)
              </button>
            </div>

          </div>
        )}

      </div>

      {/* About Modal */}
      {showAbout && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Info className="w-6 h-6 text-blue-600" />
                Tentang E-Presensi Extractor
              </h3>
              <button 
                onClick={() => setShowAbout(false)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-8 space-y-6 text-slate-600 leading-relaxed max-h-[70vh] overflow-y-auto">
              <div>
                <h4 className="font-bold text-slate-900 text-lg mb-2">Apa itu E-Presensi Extractor?</h4>
                <p>E-Presensi Extractor adalah aplikasi utilitas internal yang dirancang khusus untuk Sekretariat Dinas Kelautan dan Perikanan (DKP) Provinsi Jawa Timur. Aplikasi ini berfungsi menjembatani data mentah presensi bulanan yang diunduh dari sistem BKD menjadi format Excel rapi "Rekap Usulan EOM" yang siap cetak dan olah.</p>
              </div>
              
              <div>
                <h4 className="font-bold text-slate-900 text-lg mb-2">Panduan Penggunaan</h4>
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li>Unduh file Excel E-Presensi bulanan dari sistem absen pusat.</li>
                  <li>Klik tombol atau seret file tersebut ke area <strong>"Unggah File E-Presensi"</strong>.</li>
                  <li>Ketik Nama atau NIP pegawai yang akan dibuatkan usulannya pada kolom pencarian.</li>
                  <li>Klik nama pegawai yang muncul untuk memasukkannya ke <strong>Daftar Ekspor Terpilih</strong>. Lakukan berulang sesuai jumlah pegawai yang dibutuhkan.</li>
                  <li>Setelah daftar dirasa cukup (misal 50 pegawai), klik tombol <strong>"Ekspor Rekap Usulan"</strong>.</li>
                  <li>File Excel baru dengan format standar akan otomatis terunduh dengan warna header dan pemetaan absen (TAD, TAP, Alpha, dll) yang akurat.</li>
                </ol>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm">
                <p className="font-bold text-blue-900 mb-1">Keamanan & Penyimpanan Data</p>
                <p className="text-blue-800">Aplikasi ini berjalan 100% secara lokal di perangkat Anda (*Client-side*). Data absensi yang Anda unggah <strong>tidak dikirimkan atau disimpan di database mana pun</strong>. Setelah halaman dimuat ulang (Refresh/F5), seluruh data akan otomatis terhapus demi menjaga keamanan privasi presensi pegawai.</p>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 text-center">
              <button 
                onClick={() => setShowAbout(false)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-2.5 rounded-xl font-medium transition-colors"
              >
                Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sekretariat Modal */}
      {showSekretariatModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col h-[80vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-amber-50">
              <h3 className="text-xl font-bold text-amber-800 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-amber-600" />
                Rekomendasi Top Absen Sekretariat
              </h3>
              <button 
                onClick={() => setShowSekretariatModal(false)}
                className="p-2 hover:bg-amber-200 rounded-full transition-colors text-amber-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-0 bg-slate-50 custom-scrollbar">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-white sticky top-0 shadow-sm z-10">
                  <tr className="text-slate-600 border-b border-slate-200">
                    <th className="px-6 py-4 font-bold">Peringkat</th>
                    <th className="px-6 py-4 font-bold">Nama / NIP</th>
                    <th className="px-6 py-4 font-bold">Hadir</th>
                    <th className="px-6 py-4 font-bold">Terlambat</th>
                    <th className="px-6 py-4 font-bold">Alpha</th>
                    <th className="px-6 py-4 font-bold text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {getTopSekretariat(data).map((emp, idx) => {
                    const isSelected = selectedEmployees.some(s => s['NIP'] === emp['NIP'] && s['Nama Pegawai'] === emp['Nama Pegawai']);
                    return (
                      <tr key={idx} className="hover:bg-blue-50/50 transition-colors bg-white">
                        <td className="px-6 py-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${idx < 3 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                            {idx + 1}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900">{emp['Nama Pegawai']}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{emp['NIP']} • {emp['kelas jabatan'] || '-'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-md font-bold text-xs">{emp['kehadiran'] || 0} Hari</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-slate-600">{emp['menit terlambat'] || 0} Menit</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-slate-600">{emp['alpha'] || 0} Hari</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => {
                              if (!isSelected) handleSelect(emp);
                            }}
                            disabled={isSelected}
                            className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 mx-auto ${isSelected ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                          >
                            {isSelected ? (
                              <>
                                <CheckCircle2 className="w-4 h-4" /> Ditambahkan
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-4 h-4" /> Tambah
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {getTopSekretariat(data).length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                        Tidak ada data pegawai Sekretariat ditemukan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-slate-100 bg-white text-xs text-slate-500 text-center">
              Daftar ini diurutkan hierarkis berdasarkan: 1. Kehadiran Terbanyak, 2. Pelanggaran Berat Terminim (Alpha/TAD/TAP), 3. Pelanggaran Ringan Terminim (Apel/Senam), 4. Keterlambatan Terminim.
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
