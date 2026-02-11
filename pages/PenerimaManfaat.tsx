
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, ChevronRight, User, Users, MapPin, Trash2, 
  Printer, ArrowLeft, Upload, FileSpreadsheet, Download, 
  Info, AlertCircle, CheckCircle2, X, Plus, Loader2, 
  UserPlus, Calendar, Home, Globe, Hash, Landmark, Save, Edit3,
  FileText, Filter, CheckCircle, Building2, FileOutput, FileInput, AlertTriangle, Eye,
  ChevronUp, ChevronDown, ArrowUpDown
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

type SortConfig = {
  key: string;
  direction: 'asc' | 'desc' | null;
};

const PenerimaManfaatPage: React.FC<PenerimaManfaatPageProps> = ({ lksData, pmData, setPmData, initialSelectedPmId, onNotify }) => {
  const [selectedLksId, setSelectedLksId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(''); // Untuk cari PM
  const [searchTermLks, setSearchTermLks] = useState(''); // Untuk cari LKS di halaman utama
  const [categoryFilter, setCategoryFilter] = useState<'Semua' | PMKategori>('Semua');
  const [isImporting, setIsImporting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [viewingPm, setViewingPm] = useState<PMType | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [deleteConfirmPm, setDeleteConfirmPm] = useState<PMType | null>(null);
  
  // Sorting States
  const [sortLks, setSortLks] = useState<SortConfig>({ key: 'nama', direction: 'asc' });
  const [sortPm, setSortPm] = useState<SortConfig>({ key: 'nama', direction: 'asc' });

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

  // Effect: Auto-calculate Age based on Birth Date
  useEffect(() => {
    if (formData.tanggalLahir) {
      const birthDate = new Date(formData.tanggalLahir);
      const today = new Date();
      if (!isNaN(birthDate.getTime())) {
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        setFormData(prev => ({ ...prev, umur: age < 0 ? 0 : age }));
      }
    }
  }, [formData.tanggalLahir]);

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

  // Sorting Handler
  const handleSortLks = (key: string) => {
    setSortLks(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSortPm = (key: string) => {
    setSortPm(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Filter & Sort LKS
  const filteredLksSelection = useMemo(() => {
    let result = lksData.filter(l => 
      l.nama.toLowerCase().includes(searchTermLks.toLowerCase()) ||
      l.kecamatan.toLowerCase().includes(searchTermLks.toLowerCase())
    );

    if (sortLks.key && sortLks.direction) {
      result.sort((a, b) => {
        let valA: any = a[sortLks.key as keyof LKS];
        let valB: any = b[sortLks.key as keyof LKS];

        if (sortLks.key === 'jumlahPM') {
           valA = pmData.filter(p => p.lksId === a.id).length;
           valB = pmData.filter(p => p.lksId === b.id).length;
        }

        if (valA < valB) return sortLks.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortLks.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [lksData, searchTermLks, sortLks, pmData]);

  // Filter & Sort PM
  const filteredPm = useMemo(() => {
    let result = pmData.filter(p => 
      p.lksId === selectedLksId && 
      (categoryFilter === 'Semua' || p.kategori === categoryFilter) &&
      (p.nama.toLowerCase().includes(searchTerm.toLowerCase()) || p.nik.includes(searchTerm))
    );

    if (sortPm.key && sortPm.direction) {
      result.sort((a, b) => {
        const valA = (a[sortPm.key as keyof PMType] || '').toString().toLowerCase();
        const valB = (b[sortPm.key as keyof PMType] || '').toString().toLowerCase();
        if (valA < valB) return sortPm.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortPm.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [pmData, selectedLksId, categoryFilter, searchTerm, sortPm]);

  // Filter for LKS dropdown in Add/Edit form
  const filteredLksOptions = useMemo(() => {
    return lksData.filter(l => 
      l.nama.toLowerCase().includes(lksSearchTerm.toLowerCase())
    );
  }, [lksData, lksSearchTerm]);

  const handleOpenEdit = (pm: PMType) => {
    setFormData(pm);
    const lks = lksData.find(l => l.id === pm.lksId);
    setLksSearchTerm(lks?.nama || '');
    setIsAdding(true);
    setViewingPm(null);
  };

  const handleSavePm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama || !formData.lksId || !formData.nik) {
      alert('Nama, NIK, dan Lembaga (LKS) wajib diisi.');
      return;
    }

    if (formData.id) {
      setPmData(prev => prev.map(p => p.id === formData.id ? { 
        ...p, 
        ...(formData as PMType),
        alamat: `${formData.asalDesa}, ${formData.asalKecamatan}, ${formData.asalKabKota}`
      } : p));
      if (onNotify) onNotify('Mengupdate PM', formData.nama || 'Data PM');
    } else {
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

  const handleConfirmDelete = () => {
    if (deleteConfirmPm) {
      setPmData(prev => prev.filter(p => p.id !== deleteConfirmPm.id));
      if (onNotify) onNotify('Menghapus PM', deleteConfirmPm.nama);
      setDeleteConfirmPm(null);
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

  const handleExportCSVPM = () => {
    const headers = ["Nama PM", "LKS", "NIK", "No KK", "Tempat Lahir", "Tgl Lahir", "Umur", "JK", "KabKota", "Kecamatan", "Desa", "Kategori"];
    const rows = pmData.map(p => {
      const lks = lksData.find(l => l.id === p.lksId)?.nama || '-';
      return [
        `"${p.nama}"`, `"${lks}"`, `"${p.nik}"`, `"${p.noKK || ''}"`,
        `"${p.tempatLahir || ''}"`, `"${p.tanggalLahir || ''}"`, `"${p.umur || ''}"`,
        `"${p.jenisKelamin}"`, `"${p.asalKabKota || ''}"`, `"${p.asalKecamatan || ''}"`,
        `"${p.asalDesa || ''}"`, `"${p.kategori}"`
      ];
    });
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Data_PM_Blora_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  // Helper untuk Ikon Sort
  const getSortIcon = (config: SortConfig, key: string) => {
    if (config.key !== key) return <ArrowUpDown size={14} className="opacity-30 group-hover:opacity-100 transition-opacity" />;
    return config.direction === 'asc' ? <ChevronUp size={14} className="text-blue-400" /> : <ChevronDown size={14} className="text-blue-400" />;
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-6">
      {/* Header Utama PM */}
      <div className="bg-slate-900 rounded-[2.5rem] lg:rounded-[3rem] p-6 lg:p-10 text-white relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 no-print">
        <div className="relative z-10">
          <h2 className="text-xl lg:text-3xl font-black mb-1 lg:mb-3 uppercase tracking-tighter">Warga Binaan (PM)</h2>
          <p className="text-slate-400 max-w-xl text-[10px] lg:text-sm font-bold uppercase tracking-widest">Pendataan Terpadu By Name By Address.</p>
        </div>
        <div className="flex flex-wrap gap-2 lg:gap-3 relative z-10 justify-center">
          <button onClick={handleExportCSVPM} className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-4 lg:px-6 py-3 lg:py-4 rounded-xl lg:rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm flex items-center gap-2">
            <FileOutput size={16} /> EXPORT CSV
          </button>
          <button onClick={() => setIsImporting(true)} className="bg-indigo-50 text-indigo-600 border border-indigo-100 px-4 lg:px-6 py-3 lg:py-4 rounded-xl lg:rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm flex items-center gap-2">
            <FileInput size={16} /> IMPORT CSV
          </button>
          <button onClick={() => setIsDownloadModalOpen(true)} className="bg-white text-slate-900 px-4 lg:px-6 py-3 lg:py-4 rounded-xl lg:rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center gap-2">
            <Download size={18} /> BNBA PDF
          </button>
          <button onClick={() => { resetForm(); setIsAdding(true); }} className="bg-blue-600 text-white px-4 lg:px-6 py-3 lg:py-4 rounded-xl lg:rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center gap-2">
            <Plus size={18} /> TAMBAH PM
          </button>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
      </div>

      {!selectedLksId ? (
        <div className="space-y-6">
          {/* SEARCH LKS PADA HALAMAN UTAMA */}
          <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1 relative w-full">
               <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
               <input 
                  type="text" 
                  placeholder="Cari Nama Lembaga (LKS) atau Wilayah..." 
                  className="w-full pl-14 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm" 
                  value={searchTermLks} 
                  onChange={(e) => setSearchTermLks(e.target.value)} 
               />
            </div>
            <div className="px-6 py-2 hidden lg:flex items-center gap-2 bg-blue-50 text-blue-600 rounded-2xl font-black text-[10px] uppercase">
               <Building2 size={16} /> Pilih Lembaga untuk melihat Daftar PM
            </div>
          </div>

          {/* TAMPILAN MOBILE: Card View */}
          <div className="lg:hidden grid grid-cols-1 gap-4">
            {filteredLksSelection.map(lks => {
              const pmCount = pmData.filter(p => p.lksId === lks.id).length;
              return (
                <button 
                  key={lks.id} 
                  onClick={() => setSelectedLksId(lks.id)} 
                  className={`p-6 rounded-[2rem] border shadow-sm text-left group active:scale-95 transition-all ${pmCount === 0 ? 'bg-red-50/30 border-red-100' : 'bg-white border-slate-100'}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-inner ${pmCount === 0 ? 'bg-red-100 text-red-600' : 'bg-slate-50 text-slate-400 group-hover:bg-blue-600 group-hover:text-white'}`}>
                      {pmCount === 0 ? <AlertTriangle size={24} /> : <User size={24} />}
                    </div>
                    <ChevronRight size={18} className="text-slate-300" />
                  </div>
                  <h3 className={`font-black text-lg mb-1 line-clamp-1 ${pmCount === 0 ? 'text-red-900' : 'text-slate-800'}`}>{lks.nama}</h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-widest"><MapPin size={12} className="text-blue-500" /> {lks.kecamatan}</div>
                  <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                     <p className={`text-[9px] font-black uppercase ${pmCount === 0 ? 'text-red-600' : 'text-slate-800'}`}>{pmCount} PM Terdaftar</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* TAMPILAN DESKTOP: Tabel View LKS dengan Sorting & Warning */}
          <div className="hidden lg:block bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-900 text-white select-none">
                  <th onClick={() => handleSortLks('nama')} className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer group hover:bg-slate-800 transition-colors">
                    <div className="flex items-center gap-2">Nama Lembaga (LKS) {getSortIcon(sortLks, 'nama')}</div>
                  </th>
                  <th onClick={() => handleSortLks('kecamatan')} className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer group hover:bg-slate-800 transition-colors">
                    <div className="flex items-center gap-2">Wilayah / Kecamatan {getSortIcon(sortLks, 'kecamatan')}</div>
                  </th>
                  <th onClick={() => handleSortLks('jumlahPM')} className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-center text-slate-400 cursor-pointer group hover:bg-slate-800 transition-colors">
                    <div className="flex items-center justify-center gap-2">Total PM {getSortIcon(sortLks, 'jumlahPM')}</div>
                  </th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-right text-slate-400">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLksSelection.map((lks) => {
                  const pmCount = pmData.filter(p => p.lksId === lks.id).length;
                  const isZero = pmCount === 0;
                  return (
                    <tr 
                      key={lks.id} 
                      onClick={() => setSelectedLksId(lks.id)}
                      className={`transition-colors cursor-pointer group ${isZero ? 'bg-red-50/40 hover:bg-red-50' : 'hover:bg-blue-50/50'}`}
                    >
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isZero ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-600 group-hover:text-white'}`}>
                            {isZero ? <AlertTriangle size={20} /> : <Building2 size={20} />}
                          </div>
                          <p className={`font-black text-sm uppercase tracking-tight ${isZero ? 'text-red-900' : 'text-slate-800'}`}>{lks.nama}</p>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <MapPin size={14} className="text-blue-500" /> {lks.kecamatan}
                        </p>
                      </td>
                      <td className="px-10 py-6 text-center">
                        <span className={`px-4 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 mx-auto w-fit ${isZero ? 'bg-red-100 text-red-700 shadow-sm shadow-red-200 animate-pulse' : 'bg-slate-100 text-slate-700'}`}>
                          {isZero && <AlertCircle size={12} />} {pmCount} PM
                        </span>
                      </td>
                      <td className="px-10 py-6 text-right">
                         <div className={`flex items-center justify-end font-black text-[10px] uppercase tracking-widest gap-2 opacity-0 group-hover:opacity-100 transition-all ${isZero ? 'text-red-600' : 'text-blue-600'}`}>
                            Lihat Daftar <ChevronRight size={16} />
                         </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredLksSelection.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-10 py-20 text-center text-slate-300 italic font-medium">Data lembaga tidak ditemukan.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header View PM per LKS */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
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
                className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3.5 rounded-2xl hover:bg-black shadow-xl shadow-slate-900/20 active:scale-95 transition-all font-black text-xs tracking-widest"
              >
                <Printer size={18} /> CETAK PDF
              </button>
            </div>
          </div>

          <div className="bg-white p-4 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-4 no-print">
            <div className="flex-1 relative w-full">
               <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
               <input type="text" placeholder="Cari Nama atau NIK PM..." className="w-full pl-14 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex gap-2 p-1 bg-slate-50 border rounded-2xl">
               {['Semua', 'Dalam', 'Luar'].map(f => (
                 <button key={f} onClick={() => setCategoryFilter(f as any)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${categoryFilter === f ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                   {f === 'Semua' ? 'SEMUA' : f === 'Dalam' ? 'DALAM' : 'LUAR'}
                 </button>
               ))}
            </div>
          </div>

          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden no-print">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-900 text-white select-none">
                  <tr>
                    <th onClick={() => handleSortPm('nama')} className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer group hover:bg-slate-800 transition-colors">
                      <div className="flex items-center gap-2">Penerima Manfaat {getSortIcon(sortPm, 'nama')}</div>
                    </th>
                    <th onClick={() => handleSortPm('nik')} className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer group hover:bg-slate-800 transition-colors">
                      <div className="flex items-center gap-2">NIK / No. KK {getSortIcon(sortPm, 'nik')}</div>
                    </th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-right text-slate-400">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPm.map((pm) => (
                    <tr key={pm.id} className={`hover:bg-slate-50 transition-colors ${initialSelectedPmId === pm.id ? 'bg-blue-50/50 ring-1 ring-inset ring-blue-500' : ''}`}>
                      <td className="px-8 py-6">
                        <button 
                          onClick={() => setViewingPm(pm)} 
                          className="font-black text-slate-800 text-sm uppercase hover:text-blue-600 hover:underline transition-all text-left group flex items-center gap-2"
                        >
                          {pm.nama}
                          <Eye size={14} className="opacity-0 group-hover:opacity-100 text-blue-400 transition-opacity" />
                        </button>
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
                          <button onClick={() => handleOpenEdit(pm)} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm" title="Edit Data">
                            <Edit3 size={18} />
                          </button>
                          <button onClick={() => setDeleteConfirmPm(pm)} className="p-2.5 text-slate-300 hover:text-red-600 transition-all" title="Hapus Data">
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

      {/* MODAL DETAIL PM (VIEW MODE) */}
      {viewingPm && (
        <div className="fixed inset-0 z-[900] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setViewingPm(null)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-10 py-8 bg-slate-900 text-white flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg"><User size={32} /></div>
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter leading-tight">{viewingPm.nama}</h3>
                    <p className="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em]">Profil Penerima Manfaat</p>
                  </div>
               </div>
               <button onClick={() => setViewingPm(null)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"><X size={24} /></button>
            </div>

            <div className="p-10 space-y-8 overflow-y-auto max-h-[70vh] no-scrollbar">
               {/* Identity Card Section */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                     <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b pb-2 flex items-center gap-2"><Hash size={14}/> Nomor Identitas</h4>
                     <DetailRow label="NIK (Nomor Induk Kependudukan)" value={viewingPm.nik} />
                     <DetailRow label="Nomor Kartu Keluarga (KK)" value={viewingPm.noKK || '-'} />
                  </div>
                  <div className="space-y-4">
                     <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b pb-2 flex items-center gap-2"><Calendar size={14}/> Kelahiran & Gender</h4>
                     <DetailRow label="Tempat, Tanggal Lahir" value={`${viewingPm.tempatLahir || '-'}, ${formatDate(viewingPm.tanggalLahir)}`} />
                     <div className="flex justify-between items-end">
                        <DetailRow label="Jenis Kelamin" value={viewingPm.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'} />
                        <div className="px-4 py-2 bg-slate-100 rounded-xl text-sm font-black text-slate-700">{viewingPm.umur} TAHUN</div>
                     </div>
                  </div>
               </div>

               {/* Origin & Location */}
               <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest border-b pb-2 flex items-center gap-2"><MapPin size={14}/> Alamat Asal (Domisili Asli)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <DetailRow label="Kabupaten/Kota" value={viewingPm.asalKabKota || 'Blora'} />
                     <DetailRow label="Kecamatan" value={viewingPm.asalKecamatan || '-'} />
                     <DetailRow label="Desa/Kelurahan" value={viewingPm.asalDesa || '-'} />
                  </div>
               </div>

               {/* Institutional Info */}
               <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="space-y-1">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lembaga Pengampu (LKS)</p>
                     <p className="text-sm font-black text-slate-800 uppercase flex items-center gap-2">
                        <Building2 size={16} className="text-blue-500" />
                        {lksData.find(l => l.id === viewingPm.lksId)?.nama || '-'}
                     </p>
                  </div>
                  <div className="flex flex-col md:items-end">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status Keberadaan</p>
                     <span className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ${viewingPm.kategori === 'Dalam' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'}`}>
                        {viewingPm.kategori === 'Dalam' ? 'Dalam Panti (Residensial)' : 'Luar Panti (Non-Residensial)'}
                     </span>
                  </div>
               </div>

               {/* Notes */}
               <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Keterangan / Catatan Khusus</p>
                  <div className="p-6 bg-amber-50 border border-amber-100 rounded-2xl text-slate-700 text-sm italic font-medium">
                     "{viewingPm.keterangan || 'Tidak ada catatan tambahan untuk warga binaan ini.'}"
                  </div>
               </div>
            </div>

            <div className="p-10 bg-slate-50 border-t flex gap-4">
               <button 
                 onClick={() => handleOpenEdit(viewingPm)} 
                 className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center gap-3"
               >
                 <Edit3 size={18} /> EDIT DATA PROFIL
               </button>
               <button 
                 onClick={() => setViewingPm(null)} 
                 className="px-10 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all"
               >
                 TUTUP
               </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS PM */}
      {deleteConfirmPm && (
        <div className="fixed inset-0 z-[800] flex items-center justify-center p-4 no-print">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setDeleteConfirmPm(null)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[3rem] p-10 text-center shadow-2xl animate-in zoom-in-95">
             <div className="w-20 h-20 mx-auto bg-red-50 text-red-600 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-inner"><AlertTriangle size={36} /></div>
             <h3 className="text-2xl font-black text-slate-800 mb-2 uppercase tracking-tighter">Hapus Warga Binaan?</h3>
             <p className="text-slate-500 text-xs mb-8 leading-relaxed font-bold uppercase tracking-widest">
                Anda akan menghapus data <span className="text-red-600">{deleteConfirmPm.nama}</span> secara permanen dari basis data BNBA.
             </p>
             <div className="flex gap-3">
                <button onClick={() => setDeleteConfirmPm(null)} className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest">BATAL</button>
                <button onClick={handleConfirmDelete} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-600/30 active:scale-95 transition-all">HAPUS PERMANEN</button>
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
                      Laporan akan mencakup <span className="text-blue-600">banyak data PM</span> terdaftar. 
                      Format PDF berorientasi Landscape (Mendatar).
                   </p>
                </div>

                <div className="flex gap-4 pt-4">
                   <button onClick={() => setIsDownloadModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest">BATAL</button>
                   <button 
                     onClick={handleDownloadBNBAPDF} 
                     disabled={isGenerating}
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
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 no-print">
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
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Umur (Tahun) — <span className="text-blue-500 italic">Otomatis</span></label>
                    <input type="number" value={formData.umur} readOnly className="w-full px-5 py-3.5 bg-slate-100 border border-slate-200 rounded-2xl outline-none font-bold text-slate-500 cursor-not-allowed" />
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
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 no-print">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setIsImporting(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 text-center animate-in zoom-in-95">
             <div className="w-20 h-20 mx-auto bg-indigo-50 text-indigo-600 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-inner"><Upload size={36} /></div>
             <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tighter uppercase">Import Batch PM</h3>
             <div className="bg-slate-50 p-4 rounded-2xl mb-10 text-left border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Urutan Kolom CSV (Total 12 Kolom):</p>
                <div className="text-[8px] font-bold text-slate-600 leading-relaxed space-y-1">
                  <p>1. Nama, 2. Lembaga, 3. NIK, 4. No KK, 5. Tempat Lahir, 6. Tgl Lahir, 7. Umur, 8. JK, 9. KabKota, 10. Kecamatan, 11. Desa, 12. Kategori</p>
                </div>
             </div>
             <div className="flex gap-2">
                <button onClick={() => setIsImporting(false)} className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest">BATAL</button>
                <label className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg cursor-pointer flex items-center justify-center gap-2">
                   <FileSpreadsheet size={18} /> PILIH CSV
                   <input type="file" accept=".csv" className="hidden" />
                </label>
             </div>
          </div>
        </div>
      )}

      {/* PRINT AREA BNBA */}
      <div id="print-bnba-full-list" className="hidden p-12 bg-white text-black arial-force">
        <div className="text-center mb-8 border-b-4 border-double border-black pb-4 arial-force">
          <h1 className="text-xl font-bold uppercase arial-force">PEMERINTAH KABUPATEN BLORA</h1>
          <h2 className="text-2xl font-black uppercase arial-force">DINAS SOSIAL PEMBERDAYAAN PEREMPUAN DAN PERLINDUNGAN ANAK</h2>
          <div className="mt-6 pt-4 border-t border-black arial-force">
            <h3 className="text-lg font-bold underline uppercase arial-force">DATA BY NAME BY ADDRESS (BNBA) PM</h3>
          </div>
        </div>
        <table className="w-full text-[8pt] border-collapse border border-black arial-force">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-black p-2">No</th>
              <th className="border border-black p-2">Nama PM</th>
              <th className="border border-black p-2">NIK</th>
              <th className="border border-black p-2">Asal</th>
              <th className="border border-black p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredPm.map((pm, i) => (
              <tr key={pm.id}>
                <td className="border border-black p-1.5 text-center">{i + 1}</td>
                <td className="border border-black p-1.5 font-bold uppercase">{pm.nama}</td>
                <td className="border border-black p-1.5">{pm.nik}</td>
                <td className="border border-black p-1.5 uppercase text-[7pt]">{pm.asalDesa}, {pm.asalKecamatan}</td>
                <td className="border border-black p-1.5 text-center uppercase font-black">{pm.kategori}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        .arial-force { font-family: Arial, sans-serif !important; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

const DetailRow = ({ label, value }: { label: string; value: string | number }) => (
  <div className="space-y-1">
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    <p className="text-sm font-bold text-slate-800 uppercase leading-tight">{value}</p>
  </div>
);

export default PenerimaManfaatPage;
