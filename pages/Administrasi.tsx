
import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, Search, FileCheck, FileX, Building2, 
  ShieldCheck, UserCheck, FileText, Award, AlertCircle, 
  ExternalLink, Eye, Info, X, FileSearch, MapPin, Download,
  Fingerprint, Calendar, CheckCircle2, Maximize2, Loader2,
  ExternalLink as OpenIcon
} from 'lucide-react';
import { LKS } from '../types';

interface AdministrasiPageProps {
  data: LKS[];
}

const AdministrasiPage: React.FC<AdministrasiPageProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'lengkap' | 'belum'>('all');
  const [previewDoc, setPreviewDoc] = useState<{ 
    lks: LKS, 
    docLabel: string, 
    fileData: string, 
    docKey: string
  } | null>(null);
  
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);

  // Convert Base64 to Blob URL to prevent Chrome/browser blocking
  useEffect(() => {
    let currentUrl: string | null = null;

    if (previewDoc?.fileData?.startsWith('data:application/pdf')) {
      setIsLoadingPdf(true);
      try {
        const base64Parts = previewDoc.fileData.split(',');
        const contentType = base64Parts[0].split(':')[1].split(';')[0];
        const base64Data = base64Parts[1];
        
        // Decoding base64
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
        console.error("Gagal mengonversi data PDF:", e);
        setPdfUrl(null);
      } finally {
        // Beri sedikit jeda agar transisi loading terasa smooth
        setTimeout(() => setIsLoadingPdf(false), 500);
      }
    } else {
      setPdfUrl(null);
      setIsLoadingPdf(false);
    }

    // Cleanup Blob URL saat modal ditutup atau ganti dokumen
    return () => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
    };
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

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      {/* Header Info */}
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

      {/* Filter Bar */}
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

      {/* Grid View */}
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
                    {isLengkap ? 'Dokumen Lengkap' : `${docCount}/4 Dokumen`}
                  </div>
                </div>
                <div className="flex-1 p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <DocItem 
                    label="KTP Ketua" 
                    status={getDocStatus(lks, 'ktpKetua')} 
                    fileData={getFileData(lks, 'ktpKetua')}
                    icon={UserCheck} 
                    onOpen={() => handleOpenDoc(lks, "KTP Ketua", getFileData(lks, 'ktpKetua'), 'ktpKetua')}
                  />
                  <DocItem 
                    label="SK Kemenkumham" 
                    status={getDocStatus(lks, 'skKemenkumham')} 
                    fileData={getFileData(lks, 'skKemenkumham')}
                    icon={ShieldCheck} 
                    onOpen={() => handleOpenDoc(lks, "SK Kemenkumham", getFileData(lks, 'skKemenkumham'), 'skKemenkumham')}
                  />
                  <DocItem 
                    label="Tanda Daftar" 
                    status={getDocStatus(lks, 'tandaDaftar')} 
                    fileData={getFileData(lks, 'tandaDaftar')}
                    icon={FileText} 
                    onOpen={() => handleOpenDoc(lks, "Tanda Daftar", getFileData(lks, 'tandaDaftar'), 'tandaDaftar')}
                  />
                  <DocItem 
                    label="Akreditasi" 
                    status={getDocStatus(lks, 'sertifikatAkreditasi')} 
                    fileData={getFileData(lks, 'sertifikatAkreditasi')}
                    icon={Award} 
                    onOpen={() => handleOpenDoc(lks, "Sertifikat Akreditasi", getFileData(lks, 'sertifikatAkreditasi'), 'sertifikatAkreditasi')}
                  />
                </div>
              </div>
            </div>
          );
        })}
        {filteredData.length === 0 && (
          <div className="py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
             <Info className="mx-auto text-slate-300 mb-4" size={48} />
             <p className="text-slate-400 font-bold">Tidak ada data LKS yang sesuai dengan filter.</p>
          </div>
        )}
      </div>

      {/* DOCUMENT PREVIEW MODAL (FIXED PDF VIEWER) */}
      {previewDoc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setPreviewDoc(null)}></div>
          <div className="relative bg-white w-full max-w-6xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col h-[92vh]">
            <div className="p-6 border-b flex items-center justify-between bg-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                  <FileSearch size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 leading-tight">Pratinjau Dokumen PDF</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{previewDoc.docLabel} — {previewDoc.lks.nama}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                 {pdfUrl && (
                   <button 
                    onClick={() => window.open(pdfUrl, '_blank')}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl font-black text-[10px] uppercase hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                    title="Buka di Tab Baru"
                   >
                     <OpenIcon size={16} /> Buka di Tab Baru
                   </button>
                 )}
                 <button 
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = pdfUrl || previewDoc.fileData;
                    link.download = `${previewDoc.docLabel}_${previewDoc.lks.nama}.pdf`;
                    link.click();
                  }}
                  className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                  title="Unduh PDF"
                 >
                   <Download size={20} />
                 </button>
                 <div className="w-px h-8 bg-slate-200 mx-2"></div>
                 <button onClick={() => setPreviewDoc(null)} className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all shadow-sm">
                   <X size={20} />
                 </button>
              </div>
            </div>
            
            <div className="flex-1 bg-slate-100 p-4 lg:p-10 flex flex-col items-center justify-center overflow-hidden">
              {isLoadingPdf ? (
                <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                  <div className="relative">
                    <Loader2 className="animate-spin text-blue-600" size={64} />
                    <FileText className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-400" size={24} />
                  </div>
                  <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] animate-pulse">Memuat Berkas Digital...</p>
                </div>
              ) : pdfUrl ? (
                <div className="w-full h-full bg-white rounded-3xl shadow-2xl overflow-hidden relative border-4 border-white">
                   <iframe 
                    src={`${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1`} 
                    className="w-full h-full border-none"
                    title={`Pratinjau ${previewDoc.docLabel}`}
                    loading="lazy"
                   />
                </div>
              ) : (
                <div className="max-w-md w-full bg-white p-12 rounded-[3.5rem] shadow-xl text-center space-y-6">
                   <div className="w-24 h-24 bg-amber-50 text-amber-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
                      <AlertCircle size={48} />
                   </div>
                   <div>
                     <h3 className="text-2xl font-black text-slate-800 leading-tight">Berkas Tidak Ditemukan</h3>
                     <p className="text-sm text-slate-500 leading-relaxed font-medium mt-2">
                       File PDF untuk dokumen <b>{previewDoc.docLabel}</b> belum diunggah atau data tidak valid. 
                       Gunakan menu <b>Data LKS &gt; Edit</b> untuk mengunggah file PDF asli.
                     </p>
                   </div>
                   <button 
                    onClick={() => setPreviewDoc(null)} 
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-slate-900/20"
                   >
                    Tutup Pratinjau
                   </button>
                </div>
              )}
            </div>

            <div className="px-10 py-5 bg-white border-t flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg">
                    <ShieldCheck size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Akses Aman Terenkripsi</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg">
                    <Fingerprint size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">ID: {previewDoc.lks.id.toUpperCase()}</span>
                  </div>
               </div>
               <div className="text-right">
                 <span className="text-[10px] font-bold text-slate-400">SI-LKS Kabupaten Blora © 2024 — Dinas Sosial P3A</span>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DocItem = ({ 
  label, 
  status, 
  fileData,
  icon: Icon, 
  onOpen 
}: { 
  label: string, 
  status: boolean, 
  fileData: string,
  icon: any, 
  onOpen: () => void 
}) => (
  <div className={`p-6 rounded-[2rem] border-2 transition-all group/item hover:border-blue-200 hover:bg-white ${status ? 'border-emerald-50 bg-emerald-50/20' : 'border-slate-50 bg-slate-50/30'}`}>
    <div className="flex items-center justify-between mb-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${status ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 group-hover/item:scale-110' : 'bg-slate-200 text-slate-400'}`}><Icon size={24} /></div>
      {status ? <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg"><FileCheck size={16} /></div> : <div className="p-1.5 bg-slate-100 text-slate-300 rounded-lg"><FileX size={16} /></div>}
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">{label}</p>
    <div className="flex items-center justify-between mt-2">
       <p className={`text-xs font-black ${status ? 'text-emerald-700' : 'text-slate-400'}`}>{status ? 'VERIFIKASI OK' : 'BELUM ADA'}</p>
       {status && (
         <button 
           onClick={(e) => {
             e.stopPropagation();
             onOpen();
           }}
           className="p-2 bg-blue-600 text-white rounded-xl hover:bg-slate-900 transition-all shadow-md flex items-center gap-1.5 active:scale-90"
         >
           <Maximize2 size={14} />
           <span className="text-[9px] font-black uppercase tracking-tight">Pratinjau</span>
         </button>
       )}
    </div>
    {status ? (
      <div className="mt-4 pt-4 border-t border-emerald-100 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
        <p className="text-[8px] text-emerald-600 font-bold uppercase tracking-widest truncate">Berkas digital aktif</p>
      </div>
    ) : (
      <div className="mt-4 pt-4 border-t border-slate-100">
        <p className="text-[8px] text-slate-300 font-bold uppercase tracking-widest italic">Dokumen belum diunggah</p>
      </div>
    )}
  </div>
);

export default AdministrasiPage;
