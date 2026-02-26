
import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, Search, FileCheck, FileX, Building2, 
  ShieldCheck, UserCheck, FileText, Award, AlertCircle, 
  ExternalLink, Eye, Info, X, FileSearch, MapPin, Download,
  Fingerprint, Calendar, CheckCircle2, Maximize2, Loader2,
  ExternalLink as OpenIcon, Trash2, FileType, UploadCloud, Upload
} from 'lucide-react';
import { LKS, LKSDocuments } from '../types';

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
  const [isUploading, setIsUploading] = useState<{lksId: string, docKey: string} | null>(null);

  useEffect(() => {
    if (previewDoc?.fileData?.startsWith('http')) {
      setPdfUrl(previewDoc.fileData);
      setIsLoadingPdf(false);
    } else if (previewDoc?.fileData?.startsWith('data:application/pdf')) {
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
        const currentUrl = URL.createObjectURL(blob);
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

  const handleFileUpload = async (lks: LKS, field: keyof LKSDocuments, file: File) => {
    setIsUploading({ lksId: lks.id, docKey: field });
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload/google-drive', {
        method: 'POST',
        body: formData
      });

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const uploadData = await response.json();
        
        if (!response.ok) {
          if (response.status === 401) {
            alert("Silakan hubungkan Google Drive Anda terlebih dahulu di menu Profil.");
          } else {
            throw new Error(uploadData.error || "Gagal upload ke Google Drive");
          }
          return;
        }

        // Update local state
        setData(prev => prev.map(item => {
          if (item.id === lks.id) {
            return {
              ...item,
              dokumen: {
                ...item.dokumen,
                [field]: uploadData.viewLink
              }
            };
          }
          return item;
        }));

        if (onNotify) onNotify('Upload Berkas', `${field} - ${lks.nama} Berhasil`);
        alert("Berkas berhasil diunggah ke Google Drive.");
      } else {
        const text = await response.text();
        console.error("Server returned non-JSON response:", text);
        throw new Error("Server mengembalikan respon yang tidak valid (Bukan JSON).");
      }
    } catch (error: any) {
      console.error("Upload Error:", error);
      alert(error.message || "Gagal mengunggah berkas ke Google Drive.");
    } finally {
      setIsUploading(null);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4 lg:space-y-6">
      {/* Stats - Grid optimized for mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-6">
        <div className="bg-white p-4 lg:p-6 rounded-[1.5rem] lg:rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-3 lg:gap-4">
          <div className="w-10 h-10 lg:w-14 lg:h-14 bg-emerald-50 text-emerald-600 rounded-xl lg:rounded-2xl flex items-center justify-center shrink-0"><FileCheck size={20} className="lg:hidden" /><FileCheck size={28} className="hidden lg:block" /></div>
          <div className="min-w-0">
            <h3 className="text-lg lg:text-2xl font-black text-slate-800">{data.filter(l => Object.keys(l.dokumen || {}).length === 4).length}</h3>
            <p className="text-[7px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">Lengkap</p>
          </div>
        </div>
        <div className="bg-white p-4 lg:p-6 rounded-[1.5rem] lg:rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-3 lg:gap-4">
          <div className="w-10 h-10 lg:w-14 lg:h-14 bg-amber-50 text-amber-600 rounded-xl lg:rounded-2xl flex items-center justify-center shrink-0"><AlertCircle size={20} className="lg:hidden" /><AlertCircle size={28} className="hidden lg:block" /></div>
          <div className="min-w-0">
            <h3 className="text-lg lg:text-2xl font-black text-slate-800">{data.filter(l => Object.keys(l.dokumen || {}).length < 4).length}</h3>
            <p className="text-[7px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">Melengkapi</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-3 lg:p-4 rounded-[1.5rem] lg:rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-3 lg:gap-4">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Cari LKS..." 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none text-sm font-medium" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
        <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border w-full lg:w-auto">
          {(['all', 'lengkap', 'belum'] as const).map(f => (
            <button 
              key={f} 
              onClick={() => setStatusFilter(f)} 
              className={`flex-1 lg:flex-none px-3 lg:px-5 py-2 rounded-lg text-[8px] lg:text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === f ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500'}`}
            >
              {f === 'all' ? 'Semua' : f === 'lengkap' ? 'Ok' : 'Kurang'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:gap-6">
        {filteredData.map((lks) => {
          const docCount = Object.keys(lks.dokumen || {}).length;
          const isLengkap = docCount === 4;
          return (
            <div key={lks.id} className="bg-white rounded-[1.5rem] lg:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden group">
              {/* TAMPILAN MOBILE: Satu Baris Kompak */}
              <div className="lg:hidden p-4 flex flex-col gap-3">
                 <div className="flex items-center justify-between">
                    <div className="min-w-0">
                       <h4 className="font-black text-slate-800 text-xs uppercase truncate pr-2">{lks.nama}</h4>
                       <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{lks.kecamatan}</p>
                    </div>
                    <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${isLengkap ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                       {docCount}/4
                    </div>
                 </div>
                 <div className="grid grid-cols-4 gap-2">
                    <MiniDoc label="KTP" status={getDocStatus(lks, 'ktpKetua')} onOpen={() => handleOpenDoc(lks, "KTP", getFileData(lks, 'ktpKetua'), 'ktpKetua')} onUpload={(file) => handleFileUpload(lks, 'ktpKetua', file)} isUploading={isUploading?.lksId === lks.id && isUploading?.docKey === 'ktpKetua'} />
                    <MiniDoc label="SK" status={getDocStatus(lks, 'skKemenkumham')} onOpen={() => handleOpenDoc(lks, "SK", getFileData(lks, 'skKemenkumham'), 'skKemenkumham')} onUpload={(file) => handleFileUpload(lks, 'skKemenkumham', file)} isUploading={isUploading?.lksId === lks.id && isUploading?.docKey === 'skKemenkumham'} />
                    <MiniDoc label="Izin" status={getDocStatus(lks, 'tandaDaftar')} onOpen={() => handleOpenDoc(lks, "Tanda Daftar", getFileData(lks, 'tandaDaftar'), 'tandaDaftar')} onUpload={(file) => handleFileUpload(lks, 'tandaDaftar', file)} isUploading={isUploading?.lksId === lks.id && isUploading?.docKey === 'tandaDaftar'} />
                    <MiniDoc label="Akred" status={getDocStatus(lks, 'sertifikatAkreditasi')} onOpen={() => handleOpenDoc(lks, "Akreditasi", getFileData(lks, 'sertifikatAkreditasi'), 'sertifikatAkreditasi')} onUpload={(file) => handleFileUpload(lks, 'sertifikatAkreditasi', file)} isUploading={isUploading?.lksId === lks.id && isUploading?.docKey === 'sertifikatAkreditasi'} />
                 </div>
              </div>

              {/* TAMPILAN LAPTOP (Asli) */}
              <div className="hidden lg:flex flex-col lg:flex-row">
                <div className="p-8 bg-slate-50/50 lg:w-80 border-r border-slate-100 flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 mb-4 shadow-sm"><Building2 size={24} /></div>
                    <h4 className="font-black text-slate-800 mb-1 leading-tight text-lg">{lks.nama}</h4>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-widest"><MapPin size={12} className="text-blue-500" /> {lks.kecamatan}</p>
                  </div>
                  <div className={`mt-6 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${isLengkap ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {isLengkap ? <FileCheck size={14} /> : <AlertCircle size={14} />} {docCount}/4 Berkas
                  </div>
                </div>
                <div className="flex-1 p-8 grid grid-cols-4 gap-6">
                  <DocItem label="KTP Ketua" status={getDocStatus(lks, 'ktpKetua')} icon={UserCheck} onOpen={() => handleOpenDoc(lks, "KTP Ketua", getFileData(lks, 'ktpKetua'), 'ktpKetua')} onDelete={() => setDeleteConfirm({ lks, docKey: 'ktpKetua', docLabel: 'KTP Ketua' })} onUpload={(file) => handleFileUpload(lks, 'ktpKetua', file)} isUploading={isUploading?.lksId === lks.id && isUploading?.docKey === 'ktpKetua'} />
                  <DocItem label="SK Kemenkumham" status={getDocStatus(lks, 'skKemenkumham')} icon={ShieldCheck} onOpen={() => handleOpenDoc(lks, "SK Kemenkumham", getFileData(lks, 'skKemenkumham'), 'skKemenkumham')} onDelete={() => setDeleteConfirm({ lks, docKey: 'skKemenkumham', docLabel: 'SK Kemenkumham' })} onUpload={(file) => handleFileUpload(lks, 'skKemenkumham', file)} isUploading={isUploading?.lksId === lks.id && isUploading?.docKey === 'skKemenkumham'} />
                  <DocItem label="Tanda Daftar" status={getDocStatus(lks, 'tandaDaftar')} icon={FileText} onOpen={() => handleOpenDoc(lks, "Tanda Daftar", getFileData(lks, 'tandaDaftar'), 'tandaDaftar')} onDelete={() => setDeleteConfirm({ lks, docKey: 'tandaDaftar', docLabel: 'Surat Tanda Daftar' })} onUpload={(file) => handleFileUpload(lks, 'tandaDaftar', file)} isUploading={isUploading?.lksId === lks.id && isUploading?.docKey === 'tandaDaftar'} />
                  <DocItem label="Akreditasi" status={getDocStatus(lks, 'sertifikatAkreditasi')} icon={Award} onOpen={() => handleOpenDoc(lks, "Sertifikat Akreditasi", getFileData(lks, 'sertifikatAkreditasi'), 'sertifikatAkreditasi')} onDelete={() => setDeleteConfirm({ lks, docKey: 'sertifikatAkreditasi', docLabel: 'Sertifikat Akreditasi' })} onUpload={(file) => handleFileUpload(lks, 'sertifikatAkreditasi', file)} isUploading={isUploading?.lksId === lks.id && isUploading?.docKey === 'sertifikatAkreditasi'} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {previewDoc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 lg:p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setPreviewDoc(null)}></div>
          <div className="relative bg-white w-full max-w-6xl h-full lg:h-[92vh] lg:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 lg:p-6 border-b flex items-center justify-between">
              <h3 className="text-xs lg:text-xl font-black text-slate-800 uppercase truncate pr-4">{previewDoc.docLabel} — {previewDoc.lks.nama}</h3>
              <button onClick={() => setPreviewDoc(null)} className="p-2 text-slate-400"><X size={20} /></button>
            </div>
            <div className="flex-1 bg-slate-100 flex flex-col items-center justify-center relative">
              {isLoadingPdf ? (
                <Loader2 className="animate-spin text-blue-600" size={32} />
              ) : pdfUrl ? (
                pdfUrl.includes('drive.google.com') ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-6">
                    <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center text-blue-600">
                      <FileType size={48} />
                    </div>
                    <div className="text-center">
                      <p className="text-slate-800 font-black uppercase tracking-widest mb-2">Dokumen Google Drive</p>
                      <p className="text-slate-400 text-[10px] font-bold uppercase mb-6">Pratinjau langsung mungkin dibatasi oleh browser.</p>
                      <a 
                        href={pdfUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-900 transition-all flex items-center gap-2"
                      >
                        <OpenIcon size={18} /> BUKA DI TAB BARU
                      </a>
                    </div>
                    <iframe src={pdfUrl.replace('/view', '/preview')} className="hidden lg:block w-full max-w-4xl h-96 mt-10 rounded-2xl border-4 border-white shadow-2xl" />
                  </div>
                ) : (
                  <iframe src={`${pdfUrl}#toolbar=1`} className="w-full h-full" />
                )
              ) : (
                <p className="text-slate-400 text-xs">Gagal memuat berkas.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setDeleteConfirm(null)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[2rem] p-8 text-center animate-in zoom-in-95 shadow-2xl">
             <h3 className="text-lg font-black text-slate-800 mb-2">Hapus Berkas?</h3>
             <p className="text-slate-500 text-[10px] mb-8 font-medium italic">{deleteConfirm.docLabel}</p>
             <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 bg-slate-100 text-slate-400 rounded-xl font-black text-[10px] uppercase">Batal</button>
                <button onClick={handleDeleteDocument} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase shadow-lg">Hapus</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MiniDoc = ({ label, status, onOpen, onUpload, isUploading }: { label: string, status: boolean, onOpen: () => void, onUpload: (file: File) => void, isUploading: boolean }) => (
  <div className="relative">
    <button 
      onClick={status ? onOpen : undefined}
      className={`w-full p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${status ? 'bg-emerald-50 border-emerald-100 text-emerald-600 active:scale-95' : 'bg-slate-50 border-slate-100 text-slate-300'}`}
    >
       {status ? <FileCheck size={14} /> : <FileX size={14} />}
       <span className="text-[7px] font-black uppercase tracking-widest">{label}</span>
    </button>
    {!status && (
      <label className="absolute inset-0 cursor-pointer opacity-0">
        <input type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
      </label>
    )}
    {isUploading && (
      <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-xl">
        <Loader2 size={12} className="animate-spin text-blue-600" />
      </div>
    )}
  </div>
);

const DocItem = ({ label, status, icon: Icon, onOpen, onDelete, onUpload, isUploading }: { label: string, status: boolean, icon: any, onOpen: () => void, onDelete: () => void, onUpload: (file: File) => void, isUploading: boolean }) => (
  <div className={`p-6 rounded-[2rem] border-2 transition-all group/item hover:border-blue-200 hover:bg-white ${status ? 'border-emerald-50 bg-emerald-50/20' : 'border-slate-50 bg-slate-50/30'}`}>
    <div className="flex items-center justify-between mb-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${status ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-200 text-slate-400'}`}><Icon size={24} /></div>
      {status ? (
        <div className="flex gap-1">
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all"><Trash2 size={16} /></button>
          <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg"><FileCheck size={16} /></div>
        </div>
      ) : (
        <div className="p-1.5 bg-slate-100 text-slate-300 rounded-lg"><FileX size={16} /></div>
      )}
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <div className="flex items-center justify-between mt-2">
       <p className={`text-xs font-black ${status ? 'text-emerald-700' : 'text-slate-400'}`}>{status ? 'OK' : '-'}</p>
       {status ? (
         <button onClick={(e) => { e.stopPropagation(); onOpen(); }} className="p-2 bg-blue-600 text-white rounded-xl hover:bg-slate-900 transition-all flex items-center gap-1.5 active:scale-90">
           <Maximize2 size={12} /><span className="text-[9px] font-black uppercase">Buka</span>
         </button>
       ) : (
         <label className="cursor-pointer p-2 bg-slate-900 text-white rounded-xl hover:bg-blue-600 transition-all flex items-center gap-1.5 active:scale-90">
            {isUploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
            <span className="text-[9px] font-black uppercase">{isUploading ? 'Proses' : 'Upload'}</span>
            <input type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
         </label>
       )}
    </div>
  </div>
);

export default AdministrasiPage;
