
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, Plus, X, Trash2, UserCheck, ShieldCheck, FileText, 
  Building2, MapPin, Printer, FileSpreadsheet, ChevronRight, 
  Award, Users, Save, Edit3, Info, UploadCloud, Download, 
  Navigation, FileCheck, AlertTriangle, PlusCircle, FileBarChart,
  Map as MapIcon, Landmark, Briefcase, Calendar, Phone, CheckCircle2,
  HelpCircle, Loader2, DollarSign, FileType, Activity, Compass, ExternalLink,
  Upload
} from 'lucide-react';
import { LKS, LKSDocuments, BantuanLKS } from '../types';
import { KECAMATAN_BLORA, JENIS_BANTUAN_LIST } from '../constants';

declare const L: any;
declare const html2pdf: any;

interface LKSListProps {
  data: LKS[];
  setData: React.Dispatch<React.SetStateAction<LKS[]>>;
  initialSelectedId?: string;
  onNotify?: (action: string, target: string) => void;
  appLogo?: string | null;
}

const LKSList: React.FC<LKSListProps> = ({ data, setData, initialSelectedId, onNotify, appLogo }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLks, setSelectedLks] = useState<LKS | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [reportLks, setReportLks] = useState<LKS | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  const defaultLogoBlora = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Coat_of_arms_of_Blora_Regency.svg/1200px-Coat_of_arms_of_Blora_Regency.svg.png";
  const usedLogo = appLogo || defaultLogoBlora;

  useEffect(() => {
    if (initialSelectedId) {
      const target = data.find(l => l.id === initialSelectedId);
      if (target) { setSelectedLks(target); setIsEditing(true); }
    }
  }, [initialSelectedId, data]);

  useEffect(() => {
    if (isEditing && selectedLks && mapContainerRef.current) {
      const timer = setTimeout(() => {
        if (mapRef.current) { mapRef.current.remove(); }
        const { lat, lng } = selectedLks.koordinat;
        mapRef.current = L.map(mapContainerRef.current).setView([lat, lng], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapRef.current);
        
        const marker = L.marker([lat, lng], { draggable: true }).addTo(mapRef.current);
        marker.on('dragend', (e: any) => { 
          const pos = e.target.getLatLng(); 
          handleChange('koordinat.lat', pos.lat); 
          handleChange('koordinat.lng', pos.lng); 
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isEditing, selectedLks?.id]);

  const filteredData = useMemo(() => {
    return data.filter(item => 
      item.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.kecamatan.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.desa.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const handleChange = (field: string, value: any) => {
    if (!selectedLks) return;
    const keys = field.split('.');
    setSelectedLks(prev => {
      if (!prev) return null;
      let newData = JSON.parse(JSON.stringify(prev));
      let current: any = newData;
      for (let i = 0; i < keys.length - 1; i++) { current = current[keys[i]]; }
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: keyof LKSDocuments) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target?.result as string;
        handleChange(`dokumen.${field}`, base64String);
        alert(`Dokumen ${field} berhasil diunggah.`);
      };
      reader.readAsDataURL(file);
    } else {
      alert('Mohon unggah berkas dalam format PDF.');
    }
  };

  const handleSave = () => {
    if (selectedLks) {
      const isNew = !data.some(i => i.id === selectedLks.id);
      setData(prev => {
        const index = prev.findIndex(i => i.id === selectedLks.id);
        if (index > -1) { 
          const updated = [...prev]; 
          updated[index] = selectedLks; 
          return updated; 
        }
        return [selectedLks, ...prev];
      });
      if (onNotify) onNotify(isNew ? 'Menambah LKS' : 'Mengupdate LKS', selectedLks.nama);
      setIsEditing(false); setSelectedLks(null);
      alert('Data LKS berhasil diperbarui.');
    }
  };

  const handleNavigate = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  const handleExportExcel = () => {
    const headers = ['Nama LKS', 'Alamat', 'Desa', 'Kecamatan', 'No Telp Ketua', 'Status Akreditasi', 'Tahun Akreditasi', 'Status Aktif'];
    const rows = data.map(item => [
      item.nama, item.alamat, item.desa, item.kecamatan, item.telpKetua, 
      item.statusAkreditasi, item.tahunAkreditasi || '-', item.statusAktif
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Data_LKS_Kab_Blora_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportTablePDF = async () => {
    const element = document.getElementById('printable-table-area');
    if (!element) return;
    setIsGenerating(true);
    const options = {
      margin: 10,
      filename: `Database_LKS_Kab_Blora.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };
    try {
      await html2pdf().set(options).from(element).save();
    } catch (err) {
      alert('Gagal menghasilkan PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadRaportPDF = async () => {
    const element = document.getElementById('printable-raport');
    if (!element || !reportLks) return;
    setIsGenerating(true);
    const options = {
      margin: 10,
      filename: `Raport_LKS_${reportLks.nama.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    try {
      await html2pdf().set(options).from(element).save();
    } catch (err) {
      alert('Gagal mengunduh Raport.');
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-4 lg:space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 no-print">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari nama, desa, atau kecamatan..." 
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 shadow-sm font-medium text-sm lg:text-base" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={handleExportExcel} className="hidden lg:flex items-center gap-2 bg-emerald-50 text-emerald-600 border border-emerald-100 px-5 py-3.5 rounded-2xl font-black text-xs hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
            <FileSpreadsheet size={18} /> EXPORT EXCEL
          </button>
          <button onClick={handleExportTablePDF} disabled={isGenerating} className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-indigo-50 text-indigo-600 border border-indigo-100 px-4 lg:px-5 py-3 lg:py-3.5 rounded-2xl font-black text-[10px] lg:text-xs hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
            {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Printer size={16} />} PDF TABEL
          </button>
          <button onClick={() => {
            const newId = Math.random().toString(36).substr(2, 9);
            setSelectedLks({
              id: newId, nama: '', alamat: '', desa: '', kecamatan: KECAMATAN_BLORA[0], telpKetua: '', tempatPendirian: '', tanggalPendirian: '',
              pengurus: { ketua: { nama: '', telp: '' }, sekretaris: { nama: '', telp: '' }, bendahara: { nama: '', telp: '' } },
              akteNotaris: { nomor: '', tanggal: '' }, namaKemenkumham: '', nomorSKKemenkumham: '', nomorTandaDaftar: '', masaBerlakuTandaDaftar: '', nomorIjinOperasional: '', masaBerlakuIjinOperasional: '',
              posisiLKS: 'Pusat', lingkupKerja: 'Kabupaten', npwp: '', statusAkreditasi: 'Belum', tahunAkreditasi: '', statusAktif: 'Aktif',
              jenisBantuan: JENIS_BANTUAN_LIST[0], riwayatBantuan: [], jumlahPM: 0, koordinat: { lat: -6.968, lng: 111.417 }, dokumen: {}, kegiatanSosial: ''
            }); setIsEditing(true);
          }} className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-4 lg:px-6 py-3 lg:py-3.5 rounded-2xl font-black text-xs lg:text-sm shadow-xl active:scale-95 transition-all">
            <Plus size={16} /> TAMBAH LKS
          </button>
        </div>
      </div>

      {/* TAMPILAN MOBILE (KARTU) */}
      <div className="lg:hidden space-y-3 no-print">
        {filteredData.map((item) => (
          <div key={item.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm" onClick={() => { setSelectedLks(item); setIsEditing(true); }}>
            <div className="flex justify-between items-start mb-3">
               <div className="min-w-0">
                  <p className="text-sm font-black text-slate-800 uppercase truncate pr-4">{item.nama}</p>
                  <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase mt-1"><MapPin size={10} className="text-rose-500" /> {item.kecamatan}</p>
               </div>
               <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${item.statusAkreditasi === 'A' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
                 Grade {item.statusAkreditasi === 'Belum' ? '-' : item.statusAkreditasi}
               </div>
            </div>
            <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
               <div className="flex gap-1">
                 <button onClick={(e) => { e.stopPropagation(); handleNavigate(item.koordinat.lat, item.koordinat.lng); }} className="p-2.5 bg-slate-50 text-slate-400 rounded-xl"><Compass size={18} /></button>
                 <button onClick={(e) => { e.stopPropagation(); setReportLks(item); }} className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><FileBarChart size={18} /></button>
               </div>
               <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(item.id); }} className="p-2.5 bg-red-50 text-red-600 rounded-xl"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>

      {/* TAMPILAN LAPTOP (TABEL) */}
      <div className="hidden lg:block bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden" id="printable-table-area">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400">Lembaga & Wilayah</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400">Kontak Ketua</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 text-center">Akreditasi</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 text-center">Status Berkas</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 text-right no-print">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((item) => {
                const docCount = Object.keys(item.dokumen || {}).length;
                return (
                  <tr key={item.id} className="hover:bg-blue-50/40 transition-colors cursor-pointer group" onClick={() => { setSelectedLks(item); setIsEditing(true); }}>
                    <td className="px-8 py-6">
                      <p className="text-base font-black text-slate-800 uppercase">{item.nama}</p>
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase"><MapPin size={12} className="text-rose-500" /> {item.desa}, {item.kecamatan}</span>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-bold text-slate-700">{item.pengurus.ketua.nama}</p>
                      <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1 mt-1"><Phone size={10} className="text-emerald-500" /> {item.telpKetua}</p>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="inline-flex flex-col items-center justify-center min-w-[50px] min-h-[50px] p-2 rounded-xl font-black text-sm border-2 bg-slate-50">
                        <span>{item.statusAkreditasi === 'Belum' ? '-' : item.statusAkreditasi}</span>
                        {item.tahunAkreditasi && <span className="text-[8px] opacity-70 mt-0.5">{item.tahunAkreditasi}</span>}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                       <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${docCount === 4 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                         {docCount === 4 ? 'Lengkap' : `${docCount}/4 Berkas`}
                       </span>
                    </td>
                    <td className="px-8 py-6 text-right no-print" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleNavigate(item.koordinat.lat, item.koordinat.lng)} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm" title="Buka Lokasi">
                          <Compass size={18} />
                        </button>
                        <button onClick={() => setReportLks(item)} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Cetak Raport">
                          <FileBarChart size={20} />
                        </button>
                        <button onClick={() => setDeleteConfirmId(item.id)} className="p-2.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Hapus">
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL (VIEW & EDIT) */}
      {isEditing && selectedLks && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 lg:p-4">
          <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-md" onClick={() => { setIsEditing(false); setSelectedLks(null); }}></div>
          <div className="relative bg-white w-full max-w-6xl h-full lg:h-[95vh] lg:rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-6 lg:px-10 py-6 lg:py-8 border-b flex items-center justify-between bg-white sticky top-0 z-20">
              <div className="flex items-center gap-3 lg:gap-4">
                <div className="w-10 h-10 lg:w-14 lg:h-14 bg-blue-600 text-white rounded-xl lg:rounded-2xl flex items-center justify-center shadow-lg"><Building2 size={24}/></div>
                <div className="min-w-0"><h3 className="text-base lg:text-2xl font-black text-slate-800 uppercase truncate max-w-[200px] lg:max-w-[500px] leading-tight">{selectedLks.nama || 'LKS Baru'}</h3><p className="text-[8px] lg:text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5">Pengelolaan Profil</p></div>
              </div>
              <div className="flex items-center gap-2 lg:gap-3">
                <button onClick={handleSave} className="px-6 lg:px-10 py-2.5 lg:py-4 bg-blue-600 text-white rounded-xl lg:rounded-2xl font-black text-[10px] lg:text-xs uppercase tracking-widest shadow-xl flex items-center gap-2"><Save size={16} /> <span className="hidden lg:inline">Simpan</span></button>
                <button onClick={() => { setIsEditing(false); setSelectedLks(null); }} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"><X size={20} /></button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 lg:p-12 space-y-10 lg:space-y-16 pb-24 no-scrollbar">
              {/* Form sections stay mostly the same but with responsive grid spacing */}
              <section className="space-y-6">
                <h4 className="text-[10px] lg:text-sm font-black text-blue-600 uppercase flex items-center gap-2 border-b-2 border-blue-100 pb-2"><Info size={16} /> I. Identitas & Domisili</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                  <div className="lg:col-span-2 space-y-1"><label className="text-[8px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama LKS</label><input type="text" value={selectedLks.nama} onChange={e => handleChange('nama', e.target.value)} className="w-full px-4 lg:px-5 py-3 lg:py-4 bg-slate-50 border rounded-xl lg:rounded-2xl font-black text-slate-800 text-sm" /></div>
                  <div className="space-y-1"><label className="text-[8px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kecamatan</label><select value={selectedLks.kecamatan} onChange={e => handleChange('kecamatan', e.target.value)} className="w-full px-4 lg:px-5 py-3 lg:py-4 bg-slate-50 border rounded-xl lg:rounded-2xl font-bold text-sm">{KECAMATAN_BLORA.map(k => <option key={k} value={k}>{k}</option>)}</select></div>
                  <div className="space-y-1"><label className="text-[8px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Desa/Kelurahan</label><input type="text" value={selectedLks.desa} onChange={e => handleChange('desa', e.target.value)} className="w-full px-4 lg:px-5 py-3 lg:py-4 bg-slate-50 border rounded-xl lg:rounded-2xl font-bold text-sm" /></div>
                  <div className="lg:col-span-2 space-y-1"><label className="text-[8px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alamat Lengkap</label><input type="text" value={selectedLks.alamat} onChange={e => handleChange('alamat', e.target.value)} className="w-full px-4 lg:px-5 py-3 lg:py-4 bg-slate-50 border rounded-xl lg:rounded-2xl text-sm" /></div>
                  <div className="space-y-1"><label className="text-[8px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">No. Telp Ketua</label><input type="text" value={selectedLks.telpKetua} onChange={e => handleChange('telpKetua', e.target.value)} className="w-full px-4 lg:px-5 py-3 lg:py-4 bg-slate-50 border rounded-xl lg:rounded-2xl font-black text-blue-600 text-sm" /></div>
                </div>
              </section>

              {/* Sections: Pengurus, Legalitas, etc. same as original but with responsive class adaptations */}
              <section className="space-y-6">
                <h4 className="text-[10px] lg:text-sm font-black text-indigo-600 uppercase flex items-center gap-2 border-b-2 border-indigo-100 pb-2"><Users size={16} /> II. Pengurus</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-8">
                  {['ketua', 'sekretaris', 'bendahara'].map((role) => (
                    <div key={role} className="p-5 lg:p-8 bg-slate-50 rounded-2xl lg:rounded-[2.5rem] space-y-3 border border-slate-100 text-center">
                      <p className="text-[8px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2 mb-2">{role}</p>
                      <input type="text" placeholder={`Nama ${role}`} value={(selectedLks.pengurus as any)[role].nama} onChange={e => handleChange(`pengurus.${role}.nama`, e.target.value)} className="w-full p-2.5 bg-white border rounded-lg text-xs font-bold" />
                      <input type="text" placeholder="No. Telp" value={(selectedLks.pengurus as any)[role].telp} onChange={e => handleChange(`pengurus.${role}.telp`, e.target.value)} className="w-full p-2.5 bg-white border rounded-lg text-xs" />
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-6">
                <h4 className="text-[10px] lg:text-sm font-black text-emerald-600 uppercase flex items-center gap-2 border-b-2 border-emerald-100 pb-2"><ShieldCheck size={16} /> III. Legalitas</h4>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                  <div className="space-y-1"><label className="text-[8px] lg:text-[10px] font-black text-slate-400 uppercase ml-1">SK Kemenkumham</label><input type="text" value={selectedLks.nomorSKKemenkumham} onChange={e => handleChange('nomorSKKemenkumham', e.target.value)} className="w-full px-4 lg:px-5 py-3 lg:py-4 bg-slate-50 border rounded-xl lg:rounded-2xl text-xs font-bold" /></div>
                  <div className="space-y-1"><label className="text-[8px] lg:text-[10px] font-black text-slate-400 uppercase ml-1">Tanda Daftar</label><input type="text" value={selectedLks.nomorTandaDaftar} onChange={e => handleChange('nomorTandaDaftar', e.target.value)} className="w-full px-4 lg:px-5 py-3 lg:py-4 bg-slate-50 border rounded-xl lg:rounded-2xl text-xs font-bold" /></div>
                  <div className="space-y-1"><label className="text-[8px] lg:text-[10px] font-black text-slate-400 uppercase ml-1">Berlaku S/D</label><input type="date" value={selectedLks.masaBerlakuTandaDaftar} onChange={e => handleChange('masaBerlakuTandaDaftar', e.target.value)} className="w-full px-4 lg:px-5 py-3 lg:py-4 bg-slate-50 border rounded-xl lg:rounded-2xl text-xs font-bold text-red-600" /></div>
                </div>
              </section>

              <section className="space-y-6">
                 <h4 className="text-[10px] lg:text-sm font-black text-slate-800 uppercase flex items-center gap-2 border-b-2 border-slate-100 pb-2"><Upload size={16} /> IV. Dokumen Administrasi</h4>
                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
                    {[
                      { key: 'ktpKetua', label: 'KTP' },
                      { key: 'skKemenkumham', label: 'SK' },
                      { key: 'tandaDaftar', label: 'Daftar' },
                      { key: 'sertifikatAkreditasi', label: 'Akreditasi' }
                    ].map(doc => (
                      <div key={doc.key} className="p-4 lg:p-8 border-2 border-dashed rounded-2xl lg:rounded-[2.5rem] bg-slate-50/50 flex flex-col items-center text-center gap-3 relative group">
                         <div className={`w-10 h-10 lg:w-16 lg:h-16 rounded-xl lg:rounded-2xl flex items-center justify-center ${selectedLks.dokumen[doc.key as keyof LKSDocuments] ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-200 text-slate-400'}`}>
                            {selectedLks.dokumen[doc.key as keyof LKSDocuments] ? <FileCheck size={20}/> : <FileType size={20}/>}
                         </div>
                         <div><p className="text-[8px] lg:text-[11px] font-black uppercase text-slate-800">{doc.label}</p></div>
                         <label className="cursor-pointer px-4 lg:px-6 py-2 bg-white border rounded-lg lg:rounded-xl text-[8px] lg:text-[9px] font-black uppercase hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                            UPLOAD
                            <input type="file" accept="application/pdf" className="hidden" onChange={e => handleFileUpload(e, doc.key as keyof LKSDocuments)} />
                         </label>
                      </div>
                    ))}
                 </div>
              </section>

              <section className="space-y-6 bg-slate-900 p-6 lg:p-10 rounded-[2.5rem] lg:rounded-[3.5rem] text-white">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-600 rounded-xl shadow-lg"><MapIcon size={20} /></div>
                      <div>
                         <h4 className="text-[10px] lg:text-sm font-black uppercase tracking-widest">V. Titik Koordinat Lokasi</h4>
                      </div>
                   </div>
                   <div className="flex items-center gap-3 text-[8px] lg:text-[10px] font-black tracking-widest border border-slate-700 px-4 py-2.5 rounded-xl bg-slate-800">
                      <span className="text-blue-400">LAT: {selectedLks.koordinat.lat.toFixed(4)}</span>
                      <span className="text-emerald-400">LNG: {selectedLks.koordinat.lng.toFixed(4)}</span>
                   </div>
                </div>
                <div className="relative h-[300px] lg:h-[500px] rounded-2xl lg:rounded-[2.5rem] overflow-hidden mt-4 shadow-2xl border-2 lg:border-4 border-slate-800">
                  <div ref={mapContainerRef} className="w-full h-full z-10"></div>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* RAPORT & DELETE Confirmations stay mostly same */}
      {reportLks && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-0 lg:p-4">
          <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-md" onClick={() => setReportLks(null)}></div>
          <div className="relative bg-white w-full max-w-5xl h-full lg:h-[95vh] lg:rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
             <div className="p-6 lg:p-8 border-b flex items-center justify-between bg-white sticky top-0 z-20 no-print">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-indigo-600 text-white rounded-xl lg:rounded-2xl flex items-center justify-center shadow-lg"><FileBarChart size={20}/></div>
                  <div>
                    <h3 className="font-black text-sm lg:text-xl text-slate-800 leading-tight">Pratinjau Raport</h3>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleDownloadRaportPDF} disabled={isGenerating} className="flex items-center gap-2 bg-slate-900 text-white px-4 lg:px-8 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl font-black text-[9px] lg:text-xs uppercase tracking-widest">
                    {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Printer size={16} />} PDF
                  </button>
                  <button onClick={() => setReportLks(null)} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400"><X size={20}/></button>
                </div>
             </div>
             <div id="printable-raport" className="flex-1 overflow-y-auto p-6 lg:p-16 arial-force bg-white text-black">
                {/* PDF Content structure remains the same */}
                <div className="text-center border-b-4 border-double border-black pb-4 mb-8 flex items-center gap-4 lg:gap-8 arial-force">
                   <img src={usedLogo} alt="Logo" className="h-16 lg:h-24 max-w-[80px] lg:max-w-[120px] object-contain" />
                   <div className="flex-1 text-center arial-force">
                      <h1 className="text-sm lg:text-xl font-bold uppercase arial-force leading-tight">PEMERINTAH KABUPATEN BLORA</h1>
                      <h2 className="text-base lg:text-2xl font-black uppercase arial-force leading-tight">DINAS SOSIAL P3A</h2>
                      <p className="text-[7pt] lg:text-[10pt] font-medium mt-0.5 arial-force">Jl. Pemuda No.16 A Blora 58215</p>
                   </div>
                </div>
                <div className="space-y-6 lg:space-y-10 arial-force">
                   <div className="text-center space-y-1 arial-force">
                      <h3 className="text-lg lg:text-2xl font-black uppercase underline arial-force tracking-tight">RAPORT PROFIL LKS</h3>
                      <p className="text-[8pt] lg:text-[11pt] font-bold arial-force uppercase">Status: {reportLks.statusAktif}</p>
                   </div>
                   <div className="space-y-4 arial-force">
                      <p className="font-bold border-l-4 border-black pl-3 uppercase text-xs lg:text-sm arial-force bg-slate-100 py-1">IDENTITAS</p>
                      <table className="w-full text-[9pt] lg:text-[11pt] arial-force">
                         <tbody>
                            <tr className="arial-force"><td className="w-32 lg:w-48 font-bold arial-force py-1">Nama Lembaga</td><td className="w-4 arial-force">:</td><td className="arial-force font-black py-1">{reportLks.nama}</td></tr>
                            <tr className="arial-force"><td className="font-bold arial-force py-1">Alamat</td><td className="arial-force">:</td><td className="arial-force py-1">{reportLks.alamat}, {reportLks.desa}, Kec. {reportLks.kecamatan}</td></tr>
                         </tbody>
                      </table>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setDeleteConfirmId(null)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] lg:rounded-[3rem] p-8 lg:p-10 text-center animate-in zoom-in-95 shadow-2xl">
             <div className="w-16 h-16 lg:w-20 lg:h-20 mx-auto bg-red-50 text-red-600 rounded-2xl lg:rounded-[2.5rem] flex items-center justify-center mb-6 shadow-inner"><AlertTriangle size={32} /></div>
             <h3 className="text-xl lg:text-2xl font-black text-slate-800 mb-2">Hapus Data LKS?</h3>
             <p className="text-slate-500 text-xs lg:text-sm mb-8 lg:mb-10 leading-relaxed font-medium">Data ini akan dihapus secara permanen.</p>
             <div className="flex gap-3 lg:gap-4">
                <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-3.5 lg:py-4 bg-slate-100 text-slate-400 rounded-xl lg:rounded-2xl font-black text-[10px] lg:text-xs uppercase">Batal</button>
                <button onClick={() => {
                   const target = data.find(l => l.id === deleteConfirmId);
                   setData(prev => prev.filter(l => l.id !== deleteConfirmId));
                   if (onNotify) onNotify('Menghapus LKS', target?.nama || '');
                   setDeleteConfirmId(null);
                }} className="flex-1 py-3.5 lg:py-4 bg-red-600 text-white rounded-xl lg:rounded-2xl font-black text-[10px] lg:text-xs uppercase shadow-lg shadow-red-200">Hapus</button>
             </div>
          </div>
        </div>
      )}

      <style>{`
        .arial-force { font-family: Arial, Helvetica, sans-serif !important; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default LKSList;
