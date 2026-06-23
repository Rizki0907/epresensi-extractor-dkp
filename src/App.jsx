import React, { useState, useMemo } from 'react';
import { Upload, Search, Download, Trash2, FileSpreadsheet, CheckCircle2, UserPlus, Info } from 'lucide-react';
import { parseEPresensi, exportToRekapUsulan } from './utils/excelParser';

function App() {
  const [data, setData] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [error, setError] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
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

  const filteredData = useMemo(() => {
    if (!searchTerm) return [];
    const term = searchTerm.toLowerCase();
    return data.filter(emp => {
      const isSelected = selectedEmployees.some(s => s['NIP'] === emp['NIP'] && s['Nama Pegawai'] === emp['Nama Pegawai']);
      if (isSelected) return false;

      const nameMatch = emp['Nama Pegawai'] && emp['Nama Pegawai'].toLowerCase().includes(term);
      const nipMatch = emp['NIP'] && emp['NIP'].toString().toLowerCase().includes(term);
      return nameMatch || nipMatch;
    }).slice(0, 10); // Limit search results to 10
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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-4 rounded-2xl shadow-lg shadow-blue-200">
              <FileSpreadsheet className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">E-Presensi Extractor</h1>
          <p className="text-slate-500">Tarik data spesifik pegawai dari E-Presensi menjadi format Rekap Usulan EOM dengan satu klik.</p>
        </div>

        {/* Upload Section */}
        {!fileName ? (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
            <input 
              type="file" 
              id="file-upload" 
              className="hidden" 
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
            />
            <label 
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center space-y-4"
            >
              <div className="p-4 bg-slate-50 rounded-full border border-dashed border-slate-300">
                <Upload className="w-8 h-8 text-slate-400" />
              </div>
              <div>
                <p className="text-lg font-medium text-blue-600">Pilih file E-Presensi</p>
                <p className="text-sm text-slate-500">Format .xlsx atau .xls</p>
              </div>
            </label>
            {isParsing && <p className="mt-4 text-blue-600 animate-pulse">Sedang membaca file...</p>}
            {error && <p className="mt-4 text-red-500 font-medium">{error}</p>}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Search & Select Panel */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    Data Dimuat
                  </h2>
                  <button 
                    onClick={() => { setData([]); setFileName(null); setSelectedEmployees([]); }}
                    className="text-sm text-slate-500 hover:text-red-500 transition-colors"
                  >
                    Ganti File
                  </button>
                </div>
                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-slate-400" />
                  {fileName} <span className="text-slate-400">({data.length} baris)</span>
                </p>

                <div className="mt-6 relative">
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Cari Pegawai (Nama/NIP)</label>
                  <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
                    <input 
                      type="text" 
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="Ketik untuk mencari..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {/* Search Results Dropdown */}
                  {searchTerm && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                      {filteredData.length > 0 ? (
                        <ul className="py-1">
                          {filteredData.map((emp, idx) => (
                            <li key={idx}>
                              <button
                                onClick={() => handleSelect(emp)}
                                className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 flex items-center justify-between group transition-colors"
                              >
                                <div>
                                  <p className="font-medium text-slate-900">{emp['Nama Pegawai']}</p>
                                  <p className="text-xs text-slate-500">{emp['NIP']} • {emp['OPD']?.substring(0,30)}...</p>
                                </div>
                                <UserPlus className="w-5 h-5 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                         <div className="p-4 text-center text-sm text-slate-500">Tidak ada pegawai ditemukan.</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Selected Panel */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[500px]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Daftar Terpilih</h2>
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
                  {selectedEmployees.length} Pegawai
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4">
                {selectedEmployees.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                     <Info className="w-8 h-8" />
                     <p className="text-sm">Belum ada pegawai yang dipilih</p>
                  </div>
                ) : (
                  selectedEmployees.map((emp, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 group">
                      <div>
                        <p className="font-medium text-sm text-slate-900">{emp['Nama Pegawai']}</p>
                        <p className="text-xs text-slate-500">{emp['NIP']}</p>
                      </div>
                      <button 
                        onClick={() => handleRemove(idx)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus"
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
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-blue-200"
              >
                <Download className="w-5 h-5" />
                Download Rekap Usulan EOM
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default App;
