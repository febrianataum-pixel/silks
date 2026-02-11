
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, ChevronRight, User, Users, MapPin, Trash2, 
  Printer, ArrowLeft, Upload, FileSpreadsheet, Download, 
  Info, AlertCircle, CheckCircle2, X, Plus, Loader2, 
  UserPlus, Calendar, Home, Globe, Hash, Landmark, Save, Edit3,
  FileText, Filter, CheckCircle, Building2, FileOutput, FileInput, AlertTriangle, Eye,
  ChevronUp, ChevronDown, ArrowUpDown, RefreshCw
} from 'lucide-react';
import { LKS, PenerimaManfaat as PMType, PMKategori } from '../types';
import { KECAMATAN_BLORA, MOCK_LKS } from '../constants';

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
  const [searchTerm, setSearchTerm] = useState(''); 
  const [searchTermLks, setSearchTermLks] = useState(''); 
  const [categoryFilter, setCategoryFilter] = useState<'Semua' | PMKategori>('Semua');
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [importResult, setImportResult] = useState({ success: 0, skipped: 0 });
  const [isAdding, setIsAdding] = useState(false);
  const [viewingPm, setViewingPm] = useState<PMType | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [deleteConfirmPm, setDeleteConfirmPm] = useState<PMType | null>(null);
  
  const [sortLks, setSortLks] = useState<SortConfig>({ key: 'nama', direction: 'asc' });
  const [sortPm, setSortPm] = useState<SortConfig>({ key: 'nama', direction: 'asc' });
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [downloadLksId, setDownloadLksId] = useState<string>('all');
  const [downloadCategory, setDownloadCategory] = useState<'Semua' | PMKategori>('Semua');
  const [lksSearchTerm, setLksSearchTerm] = useState('');
  const [showLksDropdown, setShowLksDropdown] = useState(false);

  const [formData, setFormData] = useState<Partial<PMType>>({
    nama: '', lksId: '', nik: '', noKK: '', tempatLahir: '', tanggalLahir: '',
    umur: 0, jenisKelamin: 'L', asalKabKota: 'Blora', asalKecamatan: '',
    asalDesa: '', kategori: 'Dalam', keterangan: ''
  });

  useEffect(() => {
    if (formData.tanggalLahir) {
      const birthDate = new Date(formData.tanggalLahir);
      const today = new Date();
      if (!isNaN(birthDate.getTime())) {
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        setFormData(prev => ({ ...prev, umur: age < 0 ? 0 : age }));
      }
    }
  }, [formData.tanggalLahir]);

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

  const filteredLksOptions = useMemo(() => {
    return lksData.filter(l => l.nama.toLowerCase().includes(lksSearchTerm.toLowerCase()));
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

  const handleDownloadTemplatePM = () => {
    const headers = ["Nama PM", "LKS", "NIK", "No KK", "Tempat Lahir", "Tgl Lahir", "Umur", "JK", "KabKota", "Kecamatan", "Desa", "Kategori"];
    const example = ["Budi Santoso", MOCK_LKS[0].nama, "3316012345678901", "3316012345678902", "Blora", "2000-01-01", "24", "L", "Blora", "Blora", "Tempelan", "Dalam"];
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + example.join(",");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Template_Import_PM_Blora.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSVPM = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus('processing');
    setImportResult({ success: 0, skipped: 0 });

    const reader = new FileReader();
    reader.onload = (event) => {
      // Simulate slight delay for UI feedback
      setTimeout(() => {
        try {
          const text = event.target?.result as string;
          const lines = text.split(/\r?\n/);
          const newEntries: PMType[] = [];
          let skipped = 0;

          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            
            // Detect separator (comma or semicolon)
            const separator = lines[i].includes(';') ? ';' : ',';
            const cols = lines[i].split(separator).map(c => c.trim().replace(/^"|"$/g, ''));
            
            if (cols.length < 3) { skipped++; continue; }

            const [namaPM, namaLembaga, nik, noKK, tptLahir, tglLahir, umur, jk, kabKota, kec, desa, kategori] = cols;
            const targetLks = lksData.find(l => l.nama.trim().toLowerCase() === namaLembaga?.trim().toLowerCase());
            
            if (targetLks && namaPM && nik) {
              newEntries.push({
                id: Math.random().toString(36).substr(2, 9),
                lksId: targetLks.id,
                nama: namaPM,
                nik: nik,
                noKK: noKK || '',
                tempatLahir: tptLahir || '',
                tanggalLahir: tglLahir || '',
                umur: parseInt(umur) || 0,
                jenisKelamin: (jk?.toUpperCase() === 'P' ? 'P' : 'L') as 'L' | 'P',
                asalKabKota: kabKota || 'Blora',
                asalKecamatan: kec || '',
                asalDesa: desa || '',
                alamat: `${desa || ''}, ${kec || ''}, ${kabKota || 'Blora'}`,
                jenisBantuan: targetLks.jenisBantuan,
                kategori: (kategori?.toLowerCase() === 'luar' ? 'Luar' : 'Dalam') as PMKategori,
                keterangan: 'Import'
              });
            } else {
              skipped++;
            }
          }

          if (newEntries.length > 0) {
            setPmData(prev => [...newEntries, ...prev]);
            setImportResult({ success: newEntries.length, skipped });
            setImportStatus('success');
            if (onNotify) onNotify('Import PM', `${newEntries.length} Data`);
          } else {
            setImportStatus('error');
          }
        } catch (err) {
          console.error(err);
          setImportStatus('error');
        }
      }, 1500);
    };
    reader.readAsText(file);
    e.target.value = ''; 
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
      return [`"${p.nama}"`, `"${lks}"`, `"${p.nik}"`, `"${p.noKK || ''}"`, `"${p.tempatLahir || ''}"`, `"${p.tanggalLahir || ''}"`, `"${p.umur || ''}"`, `"${p.jenisKelamin}"`, `"${p.asalKabKota || ''}"`, `"${p.asalKecamatan || ''}"`, `"${p.asalDesa || ''}"`, `"${p.kategori}"`];
    });
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Data_PM_Blora.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadBNBAPDF = async () => {
    const element = document.getElementById('print-bnba-full-list');
    if (!element) return;
    setIsGenerating(true);
    const fileName = downloadLksId === 'all' ? `BNBA_Seluruh_LKS.pdf` : `BNBA_LKS_Pilihan.pdf`;
    const options = { margin: 10, filename: fileName, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' } };
    try {
      element.classList.remove('hidden');
      await html2pdf().set(options).from(element).save();
      element.classList.add('hidden');
      setIsDownloadModalOpen(false);
    } catch (err) { alert('Gagal.'); } finally { setIsGenerating(false); }
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-';
    try { return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return dateStr; }
  };

  const getSortIcon = (config: SortConfig, key: string) => {
    if (config.key !== key) return <ArrowUpDown size={14} className="opacity-30" />;
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
          <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1 relative w-full">
               <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
               <input type="text" placeholder="Cari Nama Lembaga (LKS) atau Wilayah..." className="w-full pl-14 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm" value={searchTermLks} onChange={(e) => setSearchTermLks(e.target.value)} />
            </div>
          </div>
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
                  return (
                    <tr key={lks.id} onClick={() => setSelectedLksId(lks.id)} className="transition-colors cursor-pointer group hover:bg-blue-50/50">
                      <td className="px-10 py-6"><p className="font-black text-sm uppercase tracking-tight text-slate-800">{lks.nama}</p></td>
                      <td className="px-10 py-6"><p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><MapPin size={14} className="text-blue-500" /> {lks.kecamatan}</p></td>
                      <td className="px-10 py-6 text-center"><span className="px-4 py-2 rounded-xl text-xs font-black bg-slate-100 text-slate-700">{pmCount} PM</span></td>
                      <td className="px-10 py-6 text-right"><div className="flex items-center justify-end font-black text-[10px] uppercase tracking-widest gap-2 opacity-0 group-hover:opacity-100 transition-all text-blue-600">Lihat Daftar <ChevronRight size={16} /></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
            <div className="flex items-center gap-4">
              <button onClick={() => { setSelectedLksId(null); setSearchTerm(''); }} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"><ArrowLeft size={20} /></button>
              <div>
                <h3 className="font-black text-slate-800 text-xl leading-tight uppercase tracking-tight">{selectedLks?.nama}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Daftar BNBA Terverifikasi</p>
              </div>
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
                    <tr key={pm.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-6"><button onClick={() => setViewingPm(pm)} className="font-black text-slate-800 text-sm uppercase hover:text-blue-600 transition-all text-left">{pm.nama}</button></td>
                      <td className="px-8 py-6"><p className="text-xs font-bold text-slate-700">NIK: {pm.nik}</p></td>
                      <td className="px-8 py-6 text-center"><span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${pm.kategori === 'Dalam' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>{pm.kategori}</span></td>
                      <td className="px-8 py-6 text-right"><div className="flex items-center justify-end gap-2"><button onClick={() => handleOpenEdit(pm)} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Edit3 size={18} /></button><button onClick={() => setDeleteConfirmPm(pm)} className="p-2.5 text-slate-300 hover:text-red-600"><Trash2 size={18} /></button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* POPUP PROGRES IMPORT */}
      {importStatus !== 'idle' && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl"></div>
          <div className="relative bg-white w-full max-w-sm rounded-[3rem] p-10 text-center shadow-2xl animate-in zoom-in-95">
             {importStatus === 'processing' ? (
               <div className="space-y-6">
                 <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
                    <RefreshCw size={36} className="animate-spin" />
                 </div>
                 <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Memproses Data...</h3>
                 <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Mohon tunggu, sedang menvalidasi BNBA.</p>
               </div>
             ) : importStatus === 'success' ? (
               <div className="space-y-6">
                 <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 size={40} />
                 </div>
                 <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Import Selesai!</h3>
                 <div className="bg-slate-50 p-4 rounded-2xl text-left border border-slate-100">
                    <p className="text-[10px] font-black text-emerald-600 uppercase mb-1 flex items-center gap-2"><CheckCircle size={14}/> {importResult.success} Berhasil</p>
                    <p className="text-[10px] font-black text-rose-500 uppercase flex items-center gap-2"><X size={14}/> {importResult.skipped} Dilewati</p>
                 </div>
                 <button onClick={() => { setImportStatus('idle'); setIsImporting(false); }} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest">LANJUTKAN</button>
               </div>
             ) : (
               <div className="space-y-6">
                 <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
                    <AlertTriangle size={40} />
                 </div>
                 <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Gagal Import</h3>
                 <p className="text-slate-500 text-xs font-bold leading-relaxed uppercase tracking-widest">File tidak dapat dibaca atau format kolom salah.</p>
                 <button onClick={() => setImportStatus('idle')} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest">COBA LAGI</button>
               </div>
             )}
          </div>
        </div>
      )}

      {/* MODAL IMPORT SELECTION */}
      {isImporting && importStatus === 'idle' && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 no-print">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setIsImporting(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 text-center animate-in zoom-in-95">
             <div className="w-20 h-20 mx-auto bg-indigo-50 text-indigo-600 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-inner"><Upload size={36} /></div>
             <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tighter uppercase">Import Batch PM</h3>
             <button onClick={handleDownloadTemplatePM} className="w-full mb-4 py-3 bg-emerald-50 text-emerald-600 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-100 transition-all"><Download size={14} /> UNDUH TEMPLATE CSV</button>
             <div className="flex gap-2">
                <button onClick={() => setIsImporting(false)} className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest">BATAL</button>
                <label className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg cursor-pointer flex items-center justify-center gap-2">
                   <FileSpreadsheet size={18} /> PILIH CSV
                   <input type="file" accept=".csv" className="hidden" onChange={handleImportCSVPM} />
                </label>
             </div>
          </div>
        </div>
      )}

      {/* REMAINDER OF UI (Modals etc.) stays standard ... */}
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
                </div>
              </div>
              <button onClick={() => setIsAdding(false)} className="p-3 hover:bg-slate-100 rounded-2xl transition-all"><X size={24} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleSavePm} className="flex-1 overflow-y-auto p-12 space-y-10 no-scrollbar">
               <div className="space-y-4">
                <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 border-b border-blue-100 pb-2"><Landmark size={14} /> Pilih Lembaga (LKS)</label>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="text" placeholder="Cari nama LKS..." className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all" value={lksSearchTerm} onChange={(e) => { setLksSearchTerm(e.target.value); setShowLksDropdown(true); }} onFocus={() => setShowLksDropdown(true)} />
                  </div>
                  {showLksDropdown && lksSearchTerm.length > 0 && (
                    <div className="absolute z-[700] left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto no-scrollbar">
                      {filteredLksOptions.length > 0 ? filteredLksOptions.map(l => (
                        <button key={l.id} type="button" className="w-full px-6 py-4 text-left hover:bg-blue-50 transition-colors border-b last:border-0" onClick={() => { setFormData({ ...formData, lksId: l.id }); setLksSearchTerm(l.nama); setShowLksDropdown(false); }}>
                          <p className="text-sm font-black text-slate-800 uppercase">{l.nama}</p>
                        </button>
                      )) : <div className="px-6 py-4 text-center text-slate-400 italic text-sm">LKS tidak ditemukan.</div>}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nama Lengkap</label>
                  <input type="text" required value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">NIK (16 Digit)</label>
                  <input type="text" required maxLength={16} value={formData.nik} onChange={e => setFormData({...formData, nik: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800" />
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

      {/* Detail Modal PM */}
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
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <DetailRow label="NIK" value={viewingPm.nik} />
                  <DetailRow label="Kategori" value={viewingPm.kategori} />
               </div>
            </div>
            <div className="p-10 bg-slate-50 border-t flex gap-4">
               <button onClick={() => handleOpenEdit(viewingPm)} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3"><Edit3 size={18} /> EDIT DATA</button>
               <button onClick={() => setViewingPm(null)} className="px-10 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest">TUTUP</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation PM */}
      {deleteConfirmPm && (
        <div className="fixed inset-0 z-[800] flex items-center justify-center p-4 no-print">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setDeleteConfirmPm(null)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[3rem] p-10 text-center shadow-2xl animate-in zoom-in-95">
             <div className="w-20 h-20 mx-auto bg-red-50 text-red-600 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-inner"><AlertTriangle size={36} /></div>
             <h3 className="text-2xl font-black text-slate-800 mb-2 uppercase tracking-tighter">Hapus PM?</h3>
             <p className="text-slate-500 text-xs mb-8 font-bold uppercase tracking-widest">Anda akan menghapus data <span className="text-red-600">{deleteConfirmPm.nama}</span>.</p>
             <div className="flex gap-3">
                <button onClick={() => setDeleteConfirmPm(null)} className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest">BATAL</button>
                <button onClick={handleConfirmDelete} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-600/30">HAPUS</button>
             </div>
          </div>
        </div>
      )}

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
