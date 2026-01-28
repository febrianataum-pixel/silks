
import React, { useState, useMemo, useRef } from 'react';
import { 
  Search, ChevronRight, User, Users, MapPin, Trash2, 
  Printer, ArrowLeft, Upload, FileSpreadsheet, Download, 
  Info, AlertCircle, CheckCircle2, X, Plus
} from 'lucide-react';
import { LKS, PenerimaManfaat as PMType, PMKategori } from '../types';

interface PenerimaManfaatPageProps {
  lksData: LKS[];
  pmData: PMType[];
  setPmData: React.Dispatch<React.SetStateAction<PMType[]>>;
}

const PenerimaManfaatPage: React.FC<PenerimaManfaatPageProps> = ({ lksData, pmData, setPmData }) => {
  const [selectedLksId, setSelectedLksId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'Semua' | PMKategori>('Semua');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedLks = lksData.find(l => l.id === selectedLksId);

  const filteredPm = useMemo(() => {
    return pmData.filter(p => 
      p.lksId === selectedLksId && 
      (categoryFilter === 'Semua' || p.kategori === categoryFilter) &&
      (p.nama.toLowerCase().includes(searchTerm.toLowerCase()) || p.nik.includes(searchTerm))
    );
  }, [pmData, selectedLksId, categoryFilter, searchTerm]);

  const handlePrint = () => {
    window.print();
  };

  const handleDeletePm = (id: string) => {
    if(confirm('Hapus data penerima manfaat ini?')) {
      setPmData(prev => prev.filter(p => p.id !== id));
    }
  };

  const downloadTemplate = () => {
    const headers = "NAMA,PANTI,NIK,NO KK,TEMPAT LAHIR,TANGGAL LAHIR,UMUR,JENIS KELAMIN,ASAL KAB/KOTA,ASAL KECAMATAN,ASAL DESA,STATUS KEBERADAAN";
    const example = "\nBudi Santoso,LKS Bina Sejahtera Blora,3316010101010001,3316010101010002,Blora,1990-05-12,34,L,Blora,Blora,Tempelan,Dalam Panti";
    const blob = new Blob([headers + example], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "template_import_bnba.csv");
    link.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const newEntries: PMType[] = [];
      let successCount = 0;
      let failCount = 0;

      // Start from index 1 to skip header
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        if (cols.length < 2) continue;

        const nama = cols[0] || 'Tanpa Nama';
        const pantiName = cols[1] || '';
        
        // Cari LKS ID berdasarkan nama panti di CSV
        const targetLks = lksData.find(l => l.nama.toLowerCase().includes(pantiName.toLowerCase()) || pantiName.toLowerCase().includes(l.nama.toLowerCase()));
        
        if (!targetLks) {
          failCount++;
          continue;
        }

        const nik = cols[2] || '';
        const noKK = cols[3] || '';
        const tempatLahir = cols[4] || '';
        const tanggalLahir = cols[5] || '';
        const umur = parseInt(cols[6]) || 0;
        const jkInput = (cols[7] || 'L').toUpperCase();
        const jenisKelamin: 'L' | 'P' = jkInput.startsWith('P') ? 'P' : 'L';
        const asalKab = cols[8] || '';
        const asalKec = cols[9] || '';
        const asalDesa = cols[10] || '';
        const statusKeb = (cols[11] || 'Luar').toLowerCase();
        const kategori: PMKategori = statusKeb.includes('dalam') ? 'Dalam' : 'Luar';

        newEntries.push({
          id: Math.random().toString(36).substr(2, 9),
          lksId: targetLks.id,
          nama,
          nik,
          noKK,
          tempatLahir,
          tanggalLahir,
          umur,
          jenisKelamin,
          alamat: `${asalDesa}, ${asalKec}, ${asalKab}`,
          asalDesa,
          asalKecamatan: asalKec,
          asalKabKota: asalKab,
          jenisBantuan: targetLks.jenisBantuan || 'Lainnya',
          kategori,
          keterangan: `Imported via CSV (${pantiName})`
        });
        successCount++;
      }

      if (newEntries.length > 0) {
        setPmData(prev => [...prev, ...newEntries]);
        alert(`Impor Berhasil!\n- ${successCount} data diterima\n- ${failCount} data ditolak (LKS tidak cocok)`);
        setIsImporting(false);
      } else {
        alert('Gagal: Tidak ada data valid yang cocok dengan daftar LKS di sistem.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-6">
      {!selectedLksId ? (
        <>
          <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="relative z-10">
              <h2 className="text-3xl font-black mb-3 text-white">Data Penerima Manfaat (BNBA)</h2>
              <p className="text-slate-400 max-w-xl text-lg font-medium">Kelola data warga binaan per lembaga atau impor data sekaligus via CSV.</p>
            </div>
            <div className="relative z-10 flex flex-col sm:flex-row gap-3">
               <button 
                onClick={() => setIsImporting(true)} 
                className="flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-2xl hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 font-black text-xs tracking-widest uppercase active:scale-95"
               >
                 <Upload size={20} /> IMPORT DATA CSV
               </button>
            </div>
            {/* Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full -mr-32 -mt-32"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lksData.map(lks => (
              <button key={lks.id} onClick={() => setSelectedLksId(lks.id)} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all text-left group">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner"><User size={28} /></div>
                  <div className="p-2 bg-slate-50 rounded-xl text-slate-300 group-hover:text-blue-600 transition-colors"><ChevronRight size={20} /></div>
                </div>
                <h3 className="font-black text-slate-800 text-xl mb-2 group-hover:text-blue-600 transition-colors">{lks.nama}</h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold uppercase tracking-widest">
                   <MapPin size={14} className="text-blue-500" /> {lks.kecamatan}
                </div>
                <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{pmData.filter(p => p.lksId === lks.id).length} PM Aktif</p>
                   </div>
                   <span className="text-[9px] font-black px-2.5 py-1 bg-slate-100 text-slate-400 rounded-lg uppercase">Lihat Detail</span>
                </div>
              </button>
            ))}
            <button onClick={() => window.location.hash = '#lks'} className="border-2 border-dashed border-slate-200 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:bg-blue-50/30 transition-all group">
               <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-100 group-hover:text-blue-600 transition-all"><Plus size={28}/></div>
               <p className="text-sm font-black uppercase tracking-widest">Tambah LKS Baru</p>
            </button>
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
            <div className="flex items-center gap-4">
              <button onClick={() => setSelectedLksId(null)} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm">
                <ArrowLeft size={20} />
              </button>
              <div>
                <h3 className="font-black text-slate-800 text-xl leading-tight uppercase tracking-tight">{selectedLks?.nama}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Daftar Warga Binaan Terverifikasi</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handlePrint} className="flex items-center gap-2 bg-slate-900 text-white px-8 py-3.5 rounded-2xl hover:bg-black shadow-xl shadow-slate-900/20 font-black text-xs tracking-widest active:scale-95 transition-all">
                <Printer size={18} /> CETAK LAPORAN BNBA
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-4 print:hidden">
            <div className="flex-1 relative w-full">
               <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
               <input 
                type="text" 
                placeholder="Cari berdasarkan Nama atau NIK PM..." 
                className="w-full pl-14 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
            <div className="flex bg-slate-50 p-1.5 rounded-2xl border">
               {(['Semua', 'Dalam', 'Luar'] as const).map(f => (
                 <button 
                  key={f}
                  onClick={() => setCategoryFilter(f)}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${categoryFilter === f ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                   {f} PANTI
                 </button>
               ))}
            </div>
          </div>

          {/* PRINT-ONLY AREA */}
          <div id="print-bnba-list" className="hidden print:block font-serif text-black p-0 m-0">
            <div className="text-center mb-8 border-b-4 border-double border-black pb-4">
              <h1 className="text-xl font-bold uppercase leading-tight">PEMERINTAH KABUPATEN BLORA</h1>
              <h2 className="text-2xl font-black uppercase leading-tight">DINAS SOSIAL PEMBERDAYAAN PEREMPUAN</h2>
              <h2 className="text-2xl font-black uppercase leading-tight">DAN PERLINDUNGAN ANAK</h2>
              <p className="text-[10px] font-medium mt-1">Jl. Pemuda No.16 A Blora 58215, No. Tlp: (0296) 5298541</p>
              <div className="mt-6 pt-4 border-t border-slate-300 text-black">
                <h3 className="text-lg font-bold underline uppercase">DATA PENERIMA MANFAAT (BY NAME BY ADDRESS)</h3>
                <p className="text-sm font-bold mt-2">Lembaga: {selectedLks?.nama}</p>
                <p className="text-xs">Dicetak pada: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>

            <table className="w-full text-[8pt] border-collapse border border-black text-black">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-black p-2 text-center">No</th>
                  <th className="border border-black p-2 text-left">Nama Lengkap</th>
                  <th className="border border-black p-2 text-left">NIK / No KK</th>
                  <th className="border border-black p-2 text-center">JK</th>
                  <th className="border border-black p-2 text-left">Tempat, Tgl Lahir (Umur)</th>
                  <th className="border border-black p-2 text-left">Asal Wilayah</th>
                  <th className="border border-black p-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPm.map((pm, i) => (
                  <tr key={pm.id} className="text-black">
                    <td className="border border-black p-1.5 text-center">{i + 1}</td>
                    <td className="border border-black p-1.5 font-bold">{pm.nama}</td>
                    <td className="border border-black p-1.5">
                       <p>{pm.nik}</p>
                       <p className="text-[7pt] text-slate-600">{pm.noKK}</p>
                    </td>
                    <td className="border border-black p-1.5 text-center">{pm.jenisKelamin}</td>
                    <td className="border border-black p-1.5">
                       {pm.tempatLahir}, {pm.tanggalLahir} ({pm.umur} Thn)
                    </td>
                    <td className="border border-black p-1.5">
                       {pm.asalDesa}, {pm.asalKecamatan}, {pm.asalKabKota}
                    </td>
                    <td className="border border-black p-1.5 text-center uppercase font-bold">{pm.kategori}</td>
                  </tr>
                ))}
                {filteredPm.length === 0 && (
                  <tr>
                    <td colSpan={7} className="border border-black p-4 text-center italic">Tidak ada data Penerima Manfaat untuk kriteria ini.</td>
                  </tr>
                )}
              </tbody>
            </table>
            
            <div className="mt-12 flex justify-end">
               <div className="text-center w-64">
                  <p>Blora, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <p className="font-bold uppercase mt-1">Petugas Verifikator</p>
                  <div className="h-20"></div>
                  <p className="font-bold underline">( ____________________ )</p>
               </div>
            </div>
          </div>

          {/* Screen List View */}
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden print:hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">No</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Penerima Manfaat</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">NIK / KK</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Asal Wilayah</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Kategori</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-right text-slate-400">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredPm.map((pm, i) => (
                    <tr key={pm.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-8 py-6 text-xs font-bold text-slate-300">{i + 1}</td>
                      <td className="px-8 py-6">
                        <p className="font-black text-slate-800 text-sm group-hover:text-blue-600 transition-colors">{pm.nama}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                          {pm.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'} • {pm.umur} Thn
                        </p>
                      </td>
                      <td className="px-8 py-6">
                         <p className="text-xs font-bold text-slate-600 tracking-tight">{pm.nik}</p>
                         <p className="text-[9px] text-slate-400 font-bold mt-0.5 uppercase tracking-tighter">KK: {pm.noKK}</p>
                      </td>
                      <td className="px-8 py-6">
                         <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                            <MapPin size={12} className="text-blue-500" /> {pm.asalDesa}, {pm.asalKecamatan}
                         </div>
                      </td>
                      <td className="px-8 py-6">
                         <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${pm.kategori === 'Dalam' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                            {pm.kategori} PANTI
                         </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button onClick={() => handleDeletePm(pm.id)} className="p-2.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))}
                  {filteredPm.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-24 text-center">
                         <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                            <Users size={40} className="text-slate-200" />
                         </div>
                         <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Belum ada data Penerima Manfaat terdaftar.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* IMPORT CSV MODAL */}
      {isImporting && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsImporting(false)}></div>
          <div className="relative bg-white w-full max-w-xl rounded-[3.5rem] shadow-2xl p-12 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-10">
               <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center shadow-inner">
                    <FileSpreadsheet size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 leading-tight">Batch Import BNBA</h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Multi-LKS CSV Upload</p>
                  </div>
               </div>
               <button onClick={() => setIsImporting(false)} className="p-3 hover:bg-slate-100 rounded-2xl transition-all"><X size={24} className="text-slate-400" /></button>
            </div>

            <div className="space-y-8">
               <div className="p-10 bg-slate-50 border-4 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center text-center gap-6 group hover:border-blue-400 transition-all">
                  <div className="w-20 h-20 bg-white rounded-[2rem] shadow-xl flex items-center justify-center text-slate-300 group-hover:scale-110 transition-transform">
                    <Upload size={40} />
                  </div>
                  <div>
                    <p className="text-lg font-black text-slate-800">Pilih Berkas CSV</p>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Pastikan nama panti sesuai sistem</p>
                  </div>
                  <input 
                    type="file" 
                    accept=".csv" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden" 
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/30 active:scale-95 transition-all"
                  >
                    CARI FILE DI PERANGKAT
                  </button>
               </div>

               <div className="bg-indigo-50 p-8 rounded-[2.5rem] border border-indigo-100">
                  <div className="flex gap-4">
                     <AlertCircle className="text-indigo-600 shrink-0" size={24} />
                     <div>
                        <h4 className="text-xs font-black text-indigo-800 uppercase tracking-widest mb-2">Panduan Impor Data</h4>
                        <p className="text-[11px] text-indigo-700 leading-relaxed font-medium">
                          Gunakan kolom <b>PANTI</b> (kolom ke-2) untuk menentukan ke lembaga mana data warga binaan akan masuk. Nama harus persis sama dengan yang terdaftar di menu "Data LKS".
                        </p>
                        <button 
                          onClick={downloadTemplate}
                          className="mt-4 flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase hover:text-blue-800 transition-all bg-white px-4 py-2 rounded-xl shadow-sm border border-blue-50"
                        >
                          <Download size={16} /> Unduh Format CSV Terbaru
                        </button>
                     </div>
                  </div>
               </div>
            </div>

            <div className="mt-10 pt-8 border-t flex justify-end">
               <button onClick={() => setIsImporting(false)} className="px-10 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">Tutup</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #print-bnba-list, #print-bnba-list * { visibility: visible !important; }
          #print-bnba-list { 
            position: absolute !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 100% !important; 
            display: block !important;
            padding: 1cm !important; 
            margin: 0 !important;
            background: white !important;
          }
          @page { size: A4 landscape; margin: 0; }
        }
      `}</style>
    </div>
  );
};

export default PenerimaManfaatPage;
