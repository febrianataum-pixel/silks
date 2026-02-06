
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, ChevronRight, User, Users, MapPin, Trash2, 
  Printer, ArrowLeft, Upload, FileSpreadsheet, Download, 
  Info, AlertCircle, CheckCircle2, X, Plus, Loader2, 
  UserPlus, Calendar, Home, Globe, Hash, Landmark, Save, Edit3,
  FileText, Filter, CheckCircle
} from 'lucide-react';
import { LKS, PenerimaManfaat as PMType, PMKategori } from '../types';
import { KECAMATAN_BLORA } from '../constants';

declare const html2pdf: any;

interface PenerimaManfaatPageProps {
  lksData: LKS[];
  pmData: PMType[];
  setPmData: React.Dispatch<React.SetStateAction<PMType[]>>;
  initialSelectedPmId?: string;
  onNotify?: (action: string, target: string) => void;
}

const PenerimaManfaatPage: React.FC<PenerimaManfaatPageProps> = ({ lksData, pmData, setPmData, initialSelectedPmId, onNotify }) => {
  const [selectedLksId, setSelectedLksId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'Semua' | PMKategori>('Semua');
  const [isImporting, setIsImporting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // States for Download Modal
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [downloadLksId, setDownloadLksId] = useState<string>('all');
  const [downloadCategory, setDownloadCategory] = useState<'Semua' | PMKategori>('Semua');

  // Searchable LKS Select States
  const [lksSearchTerm, setLksSearchTerm] = useState('');
  const [showLksDropdown, setShowLksDropdown] = useState(false);

  // Form State for Adding/Editing
  const [formData, setFormData] = useState<Partial<PMType>>({
    nama: '',
    lksId: '',
    nik: '',
    noKK: '',
    tempatLahir: '',
    tanggalLahir: '',
    umur: 0,
    jenisKelamin: 'L',
    asalKabKota: 'Blora',
    asalKecamatan: '',
    asalDesa: '',
    kategori: 'Dalam',
    keterangan: ''
  });

  // Shortcut Handler: Auto-filter PM from Dashboard
  useEffect(() => {
    if (initialSelectedPmId) {
      const target = pmData.find(p => p.id === initialSelectedPmId);
      if (target) {
        setSelectedLksId(target.lksId);
        setSearchTerm(target.nama);
      }
    }
  }, [initialSelectedPmId, pmData]);

  const selectedLks = lksData.find(l => l.id === selectedLksId);

  // Filter LKS for dropdown search
  const filteredLksOptions = useMemo(() => {
    return lksData.filter(l => l.nama.toLowerCase().includes(lksSearchTerm.toLowerCase()));
  }, [lksData, lksSearchTerm]);

  const filteredPm = useMemo(() => {
    return pmData.filter(p => 
      p.lksId === selectedLksId && 
      (categoryFilter === 'Semua' || p.kategori === categoryFilter) &&
      (p.nama.toLowerCase().includes(searchTerm.toLowerCase()) || p.nik.includes(searchTerm))
    );
  }, [pmData, selectedLksId, categoryFilter, searchTerm]);

  // Data for PDF Download
  const pmToDownload = useMemo(() => {
    return pmData.filter(p => {
      const matchesLks = downloadLksId === 'all' || p.lksId === downloadLksId;
      const matchesCat = downloadCategory === 'Semua' || p.kategori === downloadCategory;
      return matchesLks && matchesCat;
    }).sort((a, b) => {
        // Sort by LKS Name then PM Name
        const lksA = lksData.find(l => l.id === a.lksId)?.nama || '';
        const lksB = lksData.find(l => l.id === b.lksId)?.nama || '';
        if (lksA !== lksB) return lksA.localeCompare(lksB);
        return a.nama.localeCompare(b.nama);
    });
  }, [pmData, downloadLksId, downloadCategory, lksData]);

  const handleOpenEdit = (pm: PMType) => {
    setFormData(pm);
    const lks = lksData.find(l => l.id === pm.lksId);
    setLksSearchTerm(lks?.nama || '');
    setIsAdding(true);
  };

  const handleSavePm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama || !formData.lksId || !formData.nik) {
      alert('Nama, NIK, dan Lembaga (LKS) wajib diisi.');
      return;
    }

    if (formData.id) {
      // Edit Mode
      setPmData(prev => prev.map(p => p.id === formData.id ? { 
        ...p, 
        ...(formData as PMType),
        alamat: `${formData.asalDesa}, ${formData.asalKecamatan}, ${formData.asalKabKota}`
      } : p));
      if (onNotify) onNotify('Mengupdate PM', formData.nama || 'Data PM');
    } else {
      // Create Mode
      const pmToAdd: PMType = {
        id: Math.random().toString(36).substr(2, 9),
        ...(formData as PMType),
        alamat: `${formData.asalDesa}, ${formData.asalKecamatan}, ${formData.asalKabKota}`,
        jenisBantuan: lksData.find(l => l.id === formData.lksId)?.jenisBantuan || 'Umum'
      };
      setPmData(prev => [pmToAdd, ...prev]);
      if (onNotify) onNotify('Menambah PM', pmToAdd.nama);
    }

    setIsAdding(false);
    resetForm();
  };

  const handleDeletePm = (pm: PMType) => {
    if(confirm(`Hapus data ${pm.nama}?`)) {
      setPmData(prev => prev.filter(p => p.id !== pm.id));
      if (onNotify) onNotify('Menghapus PM', pm.nama);
    }
  };

  const resetForm = () => {
    setFormData({
      nama: '', lksId: '', nik: '', noKK: '', tempatLahir: '', tanggalLahir: '',
      umur: 0, jenisKelamin: 'L', asalKabKota: 'Blora', asalKecamatan: '',
      asalDesa: '', kategori: 'Dalam', keterangan: ''
    });
    setLksSearchTerm('');
    setShowLksDropdown(false);
  };

  const handleDownloadBNBAPDF = async () => {
    const element = document.getElementById('print-bnba-full-list');
    if (!element) return;
    setIsGenerating(true);
    
    const fileName = downloadLksId === 'all' 
      ? `BNBA_Seluruh_LKS_Blora_${downloadCategory}.pdf`
      : `BNBA_${lksData.find(l => l.id === downloadLksId)?.nama || 'LKS'}_${downloadCategory}.pdf`;

    const options = {
      margin: 10,
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    try {
      element.classList.remove('hidden');
      await html2pdf().set(options).from(element).save();
      element.classList.add('hidden');
      setIsDownloadModalOpen(false);
    } catch (err) { 
      alert('Gagal download PDF.'); 
    } finally { 
      setIsGenerating(false); 
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-6">
      {/* Header Utama PM */}
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="relative z-10">
          <h2 className="text-3xl font-black mb-3">Manajemen Warga Binaan (PM)</h2>
          <p className="text-slate-400 max-w-xl text-lg font-medium">Data Terpadu Penerima Manfaat Berdasarkan Lembaga Kesejahteraan Sosial.</p>
        </div>
        <div className="flex flex-wrap gap-3 relative z-10 justify-center">
          <button onClick={() => setIsDownloadModalOpen(true)} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-xs tracking-widest uppercase shadow-xl shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-2">
            <Download size={20} /> DOWNLOAD BNBA PM
          </button>
          <button onClick={() => { resetForm(); setIsAdding(true); }} className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-black text-xs tracking-widest uppercase shadow-xl active:scale-95 transition-all flex items-center gap-2">
            <Plus size={20} /> TAMBAH PM
          </button>
          <button onClick={() => setIsImporting(true)} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs tracking-widest uppercase shadow-xl shadow-blue-600/20 active:scale-95 transition-all flex items-center gap-2">
            <Upload size={20} /> IMPORT CSV
          </button>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full -mr-32 -mt-32"></div>
      </div>

      {!selectedLksId ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lksData.map(lks => (
            <button key={lks.id} onClick={() => setSelectedLksId(lks.id)} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all text-left group">
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner"><User size={28} /></div>
                <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-600" />
              </div>
              <h3 className="font-black text-slate-800 text-xl mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">{lks.nama}</h3>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold uppercase tracking-widest"><MapPin size={14} className="text-blue-500" /> {lks.kecamatan}</div>
              <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                 <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{pmData.filter(p => p.lksId === lks.id).length} Orang PM</p>
                 <span className="text-[9px] font-black px-3 py-1 bg-slate-100 text-slate-400 rounded-lg">DETAIL</span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button onClick={() => { setSelectedLksId(null); setSearchTerm(''); }} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                <ArrowLeft size={20} />
              </button>
              <div>
                <h3 className="font-black text-slate-800 text-xl leading-tight uppercase tracking-tight">{selectedLks?.nama}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Daftar BNBA Terverifikasi</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => {
                resetForm();
                setFormData(prev => ({ ...prev, lksId: selectedLksId }));
                setLksSearchTerm(selectedLks?.nama || '');
                setIsAdding(true);
              }} className="bg-blue-600 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all flex items-center gap-2">
                <Plus size={18} /> TAMBAH PM
              </button>
              <button 
                onClick={() => {
                  setDownloadLksId(selectedLksId);
                  setIsDownloadModalOpen(true);
                }} 
                className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3.5 rounded-2xl hover:bg-black shadow-xl shadow-slate-900/20 active:scale-95 transition-all"
              >
                <Printer size={18} /> CETAK PDF
              </button>
            </div>
          </div>

          <div className="bg-white p-4 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1 relative w-full">
               <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
               <input type="text" placeholder="Cari Nama atau NIK..." className="w-full pl-14 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex gap-2 p-1 bg-slate-50 border rounded-2xl">
               {['Semua', 'Dalam', 'Luar'].map(f => (
                 <button key={f} onClick={() => setCategoryFilter(f as any)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${categoryFilter === f ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                   {f === 'Semua' ? 'SEMUA' : f === 'Dalam' ? 'DALAM PANTI' : 'LUAR PANTI'}
                 </button>
               ))}
            </div>
          </div>

          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-900 text-white">
                  <tr>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Penerima Manfaat</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">NIK / No. KK</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-right text-slate-400">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPm.map((pm) => (
                    <tr key={pm.id} className={`hover:bg-slate-50 transition-colors ${initialSelectedPmId === pm.id ? 'bg-blue-50/50 ring-1 ring-inset ring-blue-500' : ''}`}>
                      <td className="px-8 py-6">
                        <p className="font-black text-slate-800 text-sm uppercase">{pm.nama}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1.5 mt-1">
                          <MapPin size={12} className="text-rose-500" /> {pm.asalDesa}, {pm.asalKecamatan}
                        </p>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-xs font-bold text-slate-700">NIK: {pm.nik}</p>
                        <p className="text-[10px] text-slate-400 font-medium">KK: {pm.noKK || '-'}</p>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${pm.kategori === 'Dalam' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {pm.kategori === 'Dalam' ? 'Residensial' : 'Non-Residensial'}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleOpenEdit(pm)} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                            <Edit3 size={18} />
                          </button>
                          <button onClick={() => handleDeletePm(pm)} className="p-2.5 text-slate-300 hover:text-red-600 transition-all">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredPm.length === 0 && (
                    <tr><td colSpan={4} className="px-8 py-20 text-center text-slate-300 italic font-medium">Data warga binaan tidak ditemukan.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DOWNLOAD BNBA */}
      {isDownloadModalOpen && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setIsDownloadModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-xl rounded-[3rem] shadow-2xl p-10 animate-in zoom-in-95">
             <div className="flex items-center gap-4 mb-8">
               <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-lg"><FileText size={28} /></div>
               <div>
                  <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Download BNBA PM</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Konfigurasi Laporan PDF Berdasarkan Filter</p>
               </div>
             </div>

             <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Landmark size={14}/> Pilih Lembaga (LKS)</label>
                   <select 
                     value={downloadLksId} 
                     onChange={(e) => setDownloadLksId(e.target.value)}
                     className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 transition-all"
                   >
                      <option value="all">-- SELURUH LKS KABUPATEN --</option>
                      {lksData.map(l => <option key={l.id} value={l.id}>{l.nama}</option>)}
                   </select>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Filter size={14}/> Kategori Keberadaan</label>
                   <div className="grid grid-cols-3 gap-2 p-1 bg-slate-50 rounded-2xl border">
                      {['Semua', 'Dalam', 'Luar'].map(cat => (
                        <button 
                          key={cat} 
                          onClick={() => setDownloadCategory(cat as any)}
                          className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all ${downloadCategory === cat ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                          {cat === 'Semua' ? 'SEMUA' : cat === 'Dalam' ? 'DALAM' : 'LUAR'}
                        </button>
                      ))}
                   </div>
                </div>

                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                   <div className="flex items-center gap-3 mb-2">
                      <CheckCircle className="text-blue-500" size={18} />
                      <p className="text-[10px] font-black text-slate-800 uppercase">Ringkasan Data</p>
                   </div>
                   <p className="text-[9px] text-slate-500 font-bold uppercase leading-relaxed">
                      Laporan akan mencakup <span className="text-blue-600">{pmToDownload.length} data PM</span> terdaftar. 
                      Format PDF berorientasi Landscape (Mendatar) untuk kolom yang lebih luas.
                   </p>
                </div>

                <div className="flex gap-4 pt-4">
                   <button onClick={() => setIsDownloadModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest">BATAL</button>
                   <button 
                     onClick={handleDownloadBNBAPDF} 
                     disabled={isGenerating || pmToDownload.length === 0}
                     className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
                   >
                     {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Printer size={18} />} DOWNLOAD PDF
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH/EDIT PM */}
      {isAdding && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setIsAdding(false)}></div>
          <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="px-10 py-8 border-b flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 ${formData.id ? 'bg-amber-500' : 'bg-blue-600'} text-white rounded-2xl flex items-center justify-center shadow-lg`}>
                  {formData.id ? <Edit3 size={28}/> : <UserPlus size={28}/>}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{formData.id ? 'Perbarui Data PM' : 'Entri Penerima Manfaat'}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Lengkapi data warga binaan sesuai BNBA</p>
                </div>
              </div>
              <button onClick={() => setIsAdding(false)} className="p-3 hover:bg-slate-100 rounded-2xl transition-all"><X size={24} className="text-slate-400" /></button>
            </div>

            <form onSubmit={handleSavePm} className="flex-1 overflow-y-auto p-12 space-y-10 no-scrollbar">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 border-b border-blue-100 pb-2">
                  <Landmark size={14} /> Pilih Lembaga Kesejahteraan Sosial (LKS)
                </h4>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Cari nama LKS..." 
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all"
                      value={lksSearchTerm}
                      onChange={(e) => {
                        setLksSearchTerm(e.target.value);
                        setShowLksDropdown(true);
                      }}
                      onFocus={() => setShowLksDropdown(true)}
                    />
                  </div>
                  {showLksDropdown && lksSearchTerm.length > 0 && (
                    <div className="absolute z-[700] left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto no-scrollbar">
                      {filteredLksOptions.length > 0 ? filteredLksOptions.map(l => (
                        <button 
                          key={l.id} 
                          type="button"
                          className="w-full px-6 py-4 text-left hover:bg-blue-50 transition-colors border-b last:border-0"
                          onClick={() => {
                            setFormData({ ...formData, lksId: l.id });
                            setLksSearchTerm(l.nama);
                            setShowLksDropdown(false);
                          }}
                        >
                          <p className="text-sm font-black text-slate-800 uppercase">{l.nama}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{l.kecamatan} — {l.jenisBantuan}</p>
                        </button>
                      )) : (
                        <div className="px-6 py-4 text-center text-slate-400 italic text-sm">LKS tidak ditemukan.</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 border-b pb-2">
                  <User size={14} /> Identitas Diri
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nama Lengkap</label>
                    <input type="text" required value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">NIK (16 Digit)</label>
                    <input type="text" required maxLength={16} value={formData.nik} onChange={e => setFormData({...formData, nik: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">No. Kartu Keluarga (KK)</label>
                    <input type="text" maxLength={16} value={formData.noKK} onChange={e => setFormData({...formData, noKK: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800" />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 border-b pb-2">
                  <Calendar size={14} /> Data Kelahiran & Gender
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Tempat Lahir</label>
                    <input type="text" value={formData.tempatLahir} onChange={e => setFormData({...formData, tempatLahir: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Tanggal Lahir</label>
                    <input type="date" value={formData.tanggalLahir} onChange={e => setFormData({...formData, tanggalLahir: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Umur (Tahun)</label>
                    <input type="number" value={formData.umur} onChange={e => setFormData({...formData, umur: parseInt(e.target.value) || 0})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800" />
                  </div>
                  <div className="md:col-span-3 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Jenis Kelamin</label>
                    <div className="flex gap-4">
                       <button type="button" onClick={()=>setFormData({...formData, jenisKelamin: 'L'})} className={`flex-1 py-3.5 rounded-2xl font-black text-xs uppercase border transition-all ${formData.jenisKelamin === 'L' ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>Laki-laki</button>
                       <button type="button" onClick={()=>setFormData({...formData, jenisKelamin: 'P'})} className={`flex-1 py-3.5 rounded-2xl font-black text-xs uppercase border transition-all ${formData.jenisKelamin === 'P' ? 'bg-rose-600 border-rose-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>Perempuan</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 border-b pb-2">
                  <Globe size={14} /> Alamat Asal Wilayah
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Kab/Kota Asal</label>
                    <input type="text" value={formData.asalKabKota} onChange={e => setFormData({...formData, asalKabKota: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Kecamatan Asal</label>
                    <select value={formData.asalKecamatan} onChange={e => setFormData({...formData, asalKecamatan: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800">
                       <option value="">-- Pilih Kecamatan --</option>
                       {KECAMATAN_BLORA.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Desa/Kelurahan Asal</label>
                    <input type="text" value={formData.asalDesa} onChange={e => setFormData({...formData, asalDesa: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800" />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 border-b pb-2">
                  <Home size={14} /> Status Keberadaan PM
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <button type="button" onClick={()=>setFormData({...formData, kategori: 'Dalam'})} className={`p-8 rounded-[2.5rem] border text-left transition-all group flex items-center gap-4 ${formData.kategori === 'Dalam' ? 'bg-blue-600 border-blue-600 text-white shadow-2xl' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                      <Home size={32} className={`${formData.kategori === 'Dalam' ? 'text-white' : 'text-slate-300'}`} />
                      <div>
                        <p className="font-black text-sm uppercase">Dalam Panti</p>
                        <p className={`text-[10px] font-medium ${formData.kategori === 'Dalam' ? 'text-blue-100' : 'text-slate-400'}`}>Residensial / Menetap</p>
                      </div>
                   </button>
                   <button type="button" onClick={()=>setFormData({...formData, kategori: 'Luar'})} className={`p-8 rounded-[2.5rem] border text-left transition-all group flex items-center gap-4 ${formData.kategori === 'Luar' ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xl' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                      <Globe size={32} className={`${formData.kategori === 'Luar' ? 'text-white' : 'text-slate-300'}`} />
                      <div>
                        <p className="font-black text-sm uppercase">Luar Panti</p>
                        <p className={`text-[10px] font-medium ${formData.kategori === 'Luar' ? 'text-emerald-100' : 'text-slate-400'}`}>Non-Residensial / Masyarakat</p>
                      </div>
                   </button>
                </div>
              </div>

              <div className="pt-8 border-t">
                 <button type="submit" className={`w-full py-5 ${formData.id ? 'bg-amber-500' : 'bg-blue-600'} text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-3`}>
                   <Save size={20} /> {formData.id ? 'PERBARUI DATA' : 'SIMPAN DATA'}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isImporting && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setIsImporting(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 text-center animate-in zoom-in-95">
             <div className="w-20 h-20 mx-auto bg-blue-50 text-blue-600 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-inner"><Upload size={36} /></div>
             <h3 className="text-2xl font-black text-slate-800 mb-2">Import Data BNBA</h3>
             <p className="text-slate-500 text-sm mb-10 leading-relaxed font-medium">Gunakan template CSV standar untuk mengunggah data PM dalam jumlah banyak.</p>
             <div className="space-y-3">
                <button onClick={() => {
                   const headers = "NAMA,PANTI,NIK,NO KK,TEMPAT LAHIR,TANGGAL LAHIR,UMUR,JENIS KELAMIN,ASAL KAB/KOTA,ASAL KECAMATAN,ASAL DESA,STATUS KEBERADAAN";
                   const example = "\nBudi Santoso,LKS Bina Sejahtera Blora,3316010101010001,3316010101010002,Blora,1990-05-12,34,L,Blora,Blora,Tempelan,Dalam Panti";
                   const blob = new Blob([headers + example], { type: 'text/csv;charset=utf-8;' });
                   const link = document.createElement("a");
                   link.href = URL.createObjectURL(blob);
                   link.setAttribute("download", "template_bnba_blora.csv");
                   link.click();
                }} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-black text-[10px] uppercase tracking-widest hover:border-blue-400 hover:text-blue-600 transition-all flex items-center justify-center gap-2 mb-4">
                   <Download size={18} /> UNDUH TEMPLATE CSV
                </button>
                <div className="flex gap-2">
                   <button onClick={() => setIsImporting(false)} className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest">BATAL</button>
                   <label className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg cursor-pointer flex items-center justify-center gap-2">
                      <FileSpreadsheet size={18} /> PILIH FILE
                      <input type="file" accept=".csv" className="hidden" onChange={(e) => {
                         const file = e.target.files?.[0];
                         if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                               const text = event.target?.result as string;
                               const lines = text.split('\n');
                               const newEntries: PMType[] = [];
                               for (let i = 1; i < lines.length; i++) {
                                  const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
                                  if (cols.length < 2) continue;
                                  const targetLks = lksData.find(l => l.nama.toLowerCase().includes(cols[1].toLowerCase()));
                                  if (!targetLks) continue;
                                  newEntries.push({
                                     id: Math.random().toString(36).substr(2, 9),
                                     lksId: targetLks.id,
                                     nama: cols[0], nik: cols[2], noKK: cols[3], tempatLahir: cols[4],
                                     tanggalLahir: cols[5], umur: parseInt(cols[6]) || 0,
                                     jenisKelamin: cols[7] as any, alamat: `${cols[10]}, ${cols[9]}, ${cols[8]}`,
                                     asalDesa: cols[10], asalKecamatan: cols[9], asalKabKota: cols[8],
                                     jenisBantuan: targetLks.jenisBantuan, 
                                     kategori: cols[11].includes('Dalam') ? 'Dalam' : 'Luar', keterangan: 'Imported CSV'
                                  });
                               }
                               setPmData(prev => [...prev, ...newEntries]);
                               if (onNotify) onNotify('Import PM', `${newEntries.length} Data BNBA`);
                               setIsImporting(false);
                               alert('Data berhasil diimpor.');
                            };
                            reader.readAsText(file);
                         }
                      }} />
                   </label>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* PRINT AREA BNBA LENGKAP - Disesuaikan untuk Filter Dinamis */}
      <div id="print-bnba-full-list" className="hidden p-12 bg-white text-black arial-force">
        <div className="text-center mb-8 border-b-4 border-double border-black pb-4 arial-force">
          <h1 className="text-xl font-bold uppercase arial-force">PEMERINTAH KABUPATEN BLORA</h1>
          <h2 className="text-2xl font-black uppercase arial-force">DINAS SOSIAL PEMBERDAYAAN PEREMPUAN DAN PERLINDUNGAN ANAK</h2>
          <p className="text-[10px] font-medium mt-1 arial-force">Jl. Pemuda No.16 A Blora 58215, No. Tlp: (0296) 5298541</p>
          <div className="mt-6 pt-4 border-t border-black arial-force">
            <h3 className="text-lg font-bold underline uppercase arial-force">DATA BY NAME BY ADDRESS (BNBA) PENERIMA MANFAAT</h3>
            <p className="text-sm font-bold mt-2 arial-force">
                Lembaga: {downloadLksId === 'all' ? 'SELURUH LKS KABUPATEN BLORA' : lksData.find(l => l.id === downloadLksId)?.nama} | 
                Kategori: {downloadCategory === 'Semua' ? 'SEMUA (DALAM & LUAR PANTI)' : downloadCategory === 'Dalam' ? 'DALAM PANTI (RESIDENSIAL)' : 'LUAR PANTI (NON-RESIDENSIAL)'}
            </p>
          </div>
        </div>
        <table className="w-full text-[8pt] border-collapse border border-black arial-force">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-black p-2 arial-force">No</th>
              <th className="border border-black p-2 arial-force">Nama PM</th>
              <th className="border border-black p-2 arial-force">LKS / Lembaga</th>
              <th className="border border-black p-2 arial-force">NIK</th>
              <th className="border border-black p-2 arial-force">No. KK</th>
              <th className="border border-black p-2 arial-force">Tempat/Tgl Lahir</th>
              <th className="border border-black p-2 arial-force">JK</th>
              <th className="border border-black p-2 arial-force">Asal Wilayah (Desa/Kec/Kab)</th>
              <th className="border border-black p-2 arial-force">Status</th>
            </tr>
          </thead>
          <tbody>
            {pmToDownload.map((pm, i) => {
              const currentLks = lksData.find(l => l.id === pm.lksId);
              return (
                <tr key={pm.id}>
                  <td className="border border-black p-1.5 text-center arial-force">{i + 1}</td>
                  <td className="border border-black p-1.5 font-bold arial-force uppercase">{pm.nama}</td>
                  <td className="border border-black p-1.5 arial-force text-[7pt] uppercase">{currentLks?.nama || '-'}</td>
                  <td className="border border-black p-1.5 arial-force">{pm.nik}</td>
                  <td className="border border-black p-1.5 arial-force">{pm.noKK || '-'}</td>
                  <td className="border border-black p-1.5 arial-force text-[7pt]">{pm.tempatLahir || '-'}, {pm.tanggalLahir || '-'}</td>
                  <td className="border border-black p-1.5 text-center arial-force">{pm.jenisKelamin}</td>
                  <td className="border border-black p-1.5 arial-force text-[7pt] uppercase">{pm.asalDesa}, {pm.asalKecamatan}, {pm.asalKabKota}</td>
                  <td className="border border-black p-1.5 text-center uppercase arial-force text-[7pt] font-black">{pm.kategori === 'Dalam' ? 'DALAM' : 'LUAR'}</td>
                </tr>
              );
            })}
            {pmToDownload.length === 0 && (
              <tr><td colSpan={9} className="border border-black p-10 text-center italic arial-force">TIDAK ADA DATA DITEMUKAN PADA FILTER INI</td></tr>
            )}
          </tbody>
        </table>
        <div className="mt-10 flex justify-end arial-force">
          <div className="text-center w-64 arial-force">
             <p className="arial-force text-sm">Blora, {new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
             <p className="font-bold arial-force mt-1 text-sm">Petugas Verifikator,</p>
             <div className="h-20"></div>
             <p className="font-bold underline arial-force">( ........................................ )</p>
          </div>
        </div>
      </div>

      <style>{`
        .arial-force { font-family: Arial, sans-serif !important; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default PenerimaManfaatPage;
