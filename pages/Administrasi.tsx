
import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, Search, FileCheck, FileX, Building2, 
  ShieldCheck, UserCheck, FileText, Award, AlertCircle, 
  ExternalLink, Eye, Info, X, FileSearch, MapPin, Download,
  Fingerprint, Calendar, CheckCircle2, Maximize2, Loader2,
  ExternalLink as OpenIcon, Trash2
} from 'lucide-react';
import { LKS } from '../types';

interface AdministrasiPageProps {
  data: LKS[];
  setData: React.Dispatch<React.SetStateAction<LKS[]>>;
  onNotify?: (action: string, target: string) => void;
}

const AdministrasiPage: React.FC<AdministrasiPageProps> = ({ data, setData, onNotify }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'lengkap' | 'belum'>('all');
  const [previewDoc, setPreviewDoc] = useState<{ 
    lks: LKS, 
    docLabel: string, 
    fileData: string, 
    docKey: string
  } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ lks: LKS, docKey: string, docLabel: string } | null>(null);
  
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);

  useEffect(() => {
    let currentUrl: string | null = null;
    if (previewDoc?.fileData?.startsWith('data:application/pdf')) {
      setIsLoadingPdf(true);
      try {
        const base64Parts = previewDoc.fileData.split(',');
        const contentType = base64Parts[0].split(':')[1].split(';')[0];
        const base64Data = base64Parts[1];
        const byteCharacters = window.atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: contentType });
        currentUrl = URL.createObjectURL(blob);
        setPdfUrl(currentUrl);
      } catch (e) {
        setPdfUrl(null);
      } finally {
        setTimeout(() => setIsLoadingPdf(false), 500);
      }
    } else {
      setPdfUrl(null);
      setIsLoadingPdf(false);
    }
    return () => { if (currentUrl) URL.revokeObjectURL(currentUrl); };
  }, [previewDoc]);

  const filteredData = data.filter(lks => {
    const docCount = Object.keys(lks.dokumen || {}).length;
    const isLengkap = docCount === 4;
    const matchesSearch = lks.nama.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'lengkap' ? isLengkap : !isLengkap);
    return matchesSearch && matchesStatus;
  });

  const getDocStatus = (lks: LKS, field: string) => {
    return (lks.dokumen as any)[field] ? true : false;
  };

  const getFileData = (lks: LKS, field: string) => {
    return (lks.dokumen as any)[field] || '';
  };

  const handleOpenDoc = (lks: LKS, docLabel: string, fileData: string, docKey: string) => {
    setPreviewDoc({ lks, docLabel, fileData, docKey });
  };

  const handleDeleteDocument = () => {
    if (!deleteConfirm) return;
    const { lks, docKey, docLabel } = deleteConfirm;
    
    setData(prev => prev.map(item => {
      if (item.id === lks.id) {
        const newDocs = { ...item.dokumen };
        delete (newDocs as any)[docKey];
        return { ...item, dokumen: newDocs };
      }
      return item;
    }));

    if (onNotify) onNotify('Hapus Dokumen', `${docLabel} - ${lks.nama}`);
    setDeleteConfirm(null);
    alert('Dokumen berhasil dihapus.');
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <FileCheck size={28} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800">{data.filter(l => Object.keys(l.dokumen || {}).length === 4).length}</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Dokumen Lengkap</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
            <AlertCircle size={28} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800">{data.filter(l => Object.keys(l.dokumen || {}).length < 4).length}</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Perlu Melengkapi</p>
          </div>
        </div>
        <div className="bg-slate-900 p-6 rounded-[2rem] text-white flex items-center gap-4 shadow-xl shadow-slate-900/20">
          <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center">
            <FileSearch size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">Status Pantauan</p>
            <h3 className="text-xl font-black uppercase leading-tight">Arsip Dokumen</h3>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari LKS berdasarkan nama..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border">
          {(['all', 'lengkap', 'belum'] as const).map(f => (
            <button 
              key={f} 
              onClick={() => setStatusFilter(f)} 
              className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === f ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {f === 'all' ? 'Semua' : f === 'lengkap' ? 'Lengkap' : 'Belum'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredData.map((lks) => {
          const docCount = Object.keys(lks.dokumen || {}).length;
          const isLengkap = docCount === 4;
          return (
            <div key={lks.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="flex flex-col lg:flex-row">
                <div className="p-8 bg-slate-50/50 lg:w-80 border-r border-slate-100 flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 mb-4 shadow-sm group-hover:scale-110 transition-transform"><Building2 size={24} /></div>
                    <h4 className="font-black text-slate-800 mb-1 leading-tight text-lg">{lks.nama}</h4>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-widest flex items-center gap-1">
                      <MapPin size={12} className="text-blue-500" /> {lks.kecamatan}
                    </p>
                  </div>
                  <div className={`mt-6 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${isLengkap ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {isLengkap ? <FileCheck size={14} /> : <AlertCircle size={14} />}
                    {isLengkap ? 'Lengkap' : `${docCount}/4 Berkas`}
                  </div>
                </div>
                <div className="flex-1 p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <DocItem 
                    label="KTP Ketua" 
                    status={getDocStatus(lks, 'ktpKetua')} 
                    icon={UserCheck} 
                    onOpen={() => handleOpenDoc(lks, "KTP Ketua", getFileData(lks, 'ktpKetua'), 'ktpKetua')}
                    onDelete={() => setDeleteConfirm({ lks, docKey: 'ktpKetua', docLabel: 'KTP Ketua' })}
                  />
                  <DocItem 
                    label="SK Kemenkumham" 
                    status={getDocStatus(lks, 'skKemenkumham')} 
                    icon={ShieldCheck} 
                    onOpen={() => handleOpenDoc(lks, "SK Kemenkumham", getFileData(lks, 'skKemenkumham'), 'skKemenkumham')}
                    onDelete={() => setDeleteConfirm({ lks, docKey: 'skKemenkumham', docLabel: 'SK Kemenkumham' })}
                  />
                  <DocItem 
                    label="Tanda Daftar" 
                    status={getDocStatus(lks, 'tandaDaftar')} 
                    icon={FileText} 
                    onOpen={() => handleOpenDoc(lks, "Tanda Daftar", getFileData(lks, 'tandaDaftar'), 'tandaDaftar')}
                    onDelete={() => setDeleteConfirm({ lks, docKey: 'tandaDaftar', docLabel: 'Surat Tanda Daftar' })}
                  />
                  <DocItem 
                    label="Akreditasi" 
                    status={getDocStatus(lks, 'sertifikatAkreditasi')} 
                    icon={Award} 
                    onOpen={() => handleOpenDoc(lks, "Sertifikat Akreditasi", getFileData(lks, 'sertifikatAkreditasi'), 'sertifikatAkreditasi')}
                    onDelete={() => setDeleteConfirm({ lks, docKey: 'sertifikatAkreditasi', docLabel: 'Sertifikat Akreditasi' })}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {previewDoc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setPreviewDoc(null)}></div>
          <div className="relative bg-white w-full max-w-6xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col h-[92vh]">
            <div className="p-6 border-b flex items-center justify-between bg-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><FileSearch size={24} /></div>
                <div><h3 className="text-xl font-black text-slate-800 leading-tight">Pratinjau Dokumen</h3><p className="text-[10px] text-slate-400 font-black uppercase mt-1">{previewDoc.docLabel} — {previewDoc.lks.nama}</p></div>
              </div>
              <div className="flex items-center gap-2">
                 <button onClick={() => window.open(pdfUrl || '', '_blank')} className="px-4 py-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl font-black text-[10px] uppercase hover:bg-indigo-600 hover:text-white transition-all shadow-sm"><OpenIcon size={16} /> Buka di Tab Baru</button>
                 <button onClick={() => { const l = document.createElement('a'); l.href = pdfUrl || previewDoc.fileData; l.download = `${previewDoc.docLabel}.pdf`; l.click(); }} className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-900 hover:text-white transition-all"><Download size={20} /></button>
                 <button onClick={() => setPreviewDoc(null)} className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-red-600 transition-all"><X size={20} /></button>
              </div>
            </div>
            <div className="flex-1 bg-slate-100 p-4 lg:p-10 flex flex-col items-center justify-center">
              {isLoadingPdf ? <div className="flex flex-col items-center gap-4 animate-pulse"><Loader2 className="animate-spin text-blue-600" size={48} /><p className="text-[10px] font-black text-slate-500 uppercase">Memuat Berkas...</p></div> : pdfUrl ? <div className="w-full h-full bg-white rounded-3xl overflow-hidden border-4 border-white"><iframe src={`${pdfUrl}#toolbar=1`} className="w-full h-full border-none" /></div> : <div className="text-center p-20 bg-white rounded-[3rem] shadow-xl"><AlertCircle size={48} className="mx-auto text-amber-500 mb-4" /><p className="font-bold text-slate-600">Berkas tidak dapat dimuat.</p></div>}
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setDeleteConfirm(null)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 text-center animate-in zoom-in-95">
             <div className="w-20 h-20 mx-auto bg-red-50 text-red-600 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-inner"><Trash2 size={36} /></div>
             <h3 className="text-2xl font-black text-slate-800 mb-2">Hapus Berkas?</h3>
             <p className="text-slate-500 text-sm mb-10 leading-relaxed font-medium">Hapus dokumen <b>{deleteConfirm.docLabel}</b> milik {deleteConfirm.lks.nama} secara permanen?</p>
             <div className="flex gap-4">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest">BATAL</button>
                <button onClick={handleDeleteDocument} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-600/20 active:scale-95 transition-all">HAPUS SEKARANG</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DocItem = ({ label, status, icon: Icon, onOpen, onDelete }: { label: string, status: boolean, icon: any, onOpen: () => void, onDelete: () => void }) => (
  <div className={`p-6 rounded-[2rem] border-2 transition-all group/item hover:border-blue-200 hover:bg-white ${status ? 'border-emerald-50 bg-emerald-50/20' : 'border-slate-50 bg-slate-50/30'}`}>
    <div className="flex items-center justify-between mb-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${status ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-200 text-slate-400'}`}><Icon size={24} /></div>
      {status ? (
        <div className="flex gap-1">
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all" title="Hapus Berkas"><Trash2 size={16} /></button>
          <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg"><FileCheck size={16} /></div>
        </div>
      ) : <div className="p-1.5 bg-slate-100 text-slate-300 rounded-lg"><FileX size={16} /></div>}
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">{label}</p>
    <div className="flex items-center justify-between mt-2">
       <p className={`text-xs font-black ${status ? 'text-emerald-700' : 'text-slate-400'}`}>{status ? 'VERIFIKASI OK' : 'BELUM ADA'}</p>
       {status && <button onClick={(e) => { e.stopPropagation(); onOpen(); }} className="p-2 bg-blue-600 text-white rounded-xl hover:bg-slate-900 transition-all shadow-md flex items-center gap-1.5 active:scale-90"><Maximize2 size={14} /><span className="text-[9px] font-black uppercase">Buka</span></button>}
    </div>
  </div>
);

export default AdministrasiPage;
