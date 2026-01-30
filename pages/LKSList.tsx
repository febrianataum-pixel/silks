
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

  // Leaflet Map Logic for Detail View/Edit
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
    <div className="animate-in fade-in duration-500 space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 no-print">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari nama, desa, atau kecamatan..." 
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 shadow-sm font-medium" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportExcel} className="flex items-center gap-2 bg-emerald-50 text-emerald-600 border border-emerald-100 px-5 py-3.5 rounded-2xl font-black text-xs hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
            <FileSpreadsheet size={18} /> EXPORT EXCEL
          </button>
          <button onClick={handleExportTablePDF} disabled={isGenerating} className="flex items-center gap-2 bg-indigo-50 text-indigo-600 border border-indigo-100 px-5 py-3.5 rounded-2xl font-black text-xs hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
            {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Printer size={18} />} PDF TABEL
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
          }} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3.5 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all">
            <Plus size={18} /> TAMBAH LKS
          </button>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden" id="printable-table-area">
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-md" onClick={() => { setIsEditing(false); setSelectedLks(null); }}></div>
          <div className="relative bg-white w-full max-w-6xl h-[95vh] rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-10 py-8 border-b flex items-center justify-between bg-white sticky top-0 z-20">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200"><Building2 size={28}/></div>
                <div><h3 className="text-2xl font-black text-slate-800 uppercase truncate max-w-[500px] leading-tight">{selectedLks.nama || 'LKS Baru'}</h3><p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Pengelolaan Profil & Legalitas Lembaga</p></div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleSave} className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200 active:scale-95 transition-all flex items-center gap-2"><Save size={18} /> Simpan Data</button>
                <button onClick={() => { setIsEditing(false); setSelectedLks(null); }} className="p-3 hover:bg-slate-100 rounded-2xl transition-all text-slate-400 hover:text-red-500"><X size={24} /></button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-12 space-y-16 pb-24 no-scrollbar">
              {/* I. Data Dasar */}
              <section className="space-y-8">
                <h4 className="text-sm font-black text-blue-600 uppercase flex items-center gap-2 border-b-2 border-blue-100 pb-2"><Info size={16} /> I. Identitas & Domisili</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="lg:col-span-2 space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama LKS (Utama)</label><input type="text" value={selectedLks.nama} onChange={e => handleChange('nama', e.target.value)} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-black text-slate-800" /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kecamatan</label><select value={selectedLks.kecamatan} onChange={e => handleChange('kecamatan', e.target.value)} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold">{KECAMATAN_BLORA.map(k => <option key={k} value={k}>{k}</option>)}</select></div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Desa/Kelurahan</label><input type="text" value={selectedLks.desa} onChange={e => handleChange('desa', e.target.value)} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold" /></div>
                  <div className="lg:col-span-2 space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alamat Lengkap</label><input type="text" value={selectedLks.alamat} onChange={e => handleChange('alamat', e.target.value)} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl" /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tempat Pendirian</label><input type="text" value={selectedLks.tempatPendirian} onChange={e => handleChange('tempatPendirian', e.target.value)} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl" /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal Pendirian</label><input type="date" value={selectedLks.tanggalPendirian} onChange={e => handleChange('tanggalPendirian', e.target.value)} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl" /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">No. Telp Ketua</label><input type="text" value={selectedLks.telpKetua} onChange={e => handleChange('telpKetua', e.target.value)} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-black text-blue-600" /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nomor NPWP</label><input type="text" value={selectedLks.npwp} onChange={e => handleChange('npwp', e.target.value)} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-mono" /></div>
                </div>
              </section>

              {/* II. Pengurus */}
              <section className="space-y-8">
                <h4 className="text-sm font-black text-indigo-600 uppercase flex items-center gap-2 border-b-2 border-indigo-100 pb-2"><Users size={16} /> II. Data Pengurus Terpilih</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="p-8 bg-slate-50 rounded-[2.5rem] space-y-4 border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center border-b pb-3">Profil Ketua</p>
                    <div className="space-y-3">
                      <input type="text" placeholder="Nama Lengkap Ketua" value={selectedLks.pengurus.ketua.nama} onChange={e => handleChange('pengurus.ketua.nama', e.target.value)} className="w-full p-3 bg-white border rounded-xl font-bold" />
                      <input type="text" placeholder="No. Telpon/WhatsApp" value={selectedLks.pengurus.ketua.telp} onChange={e => handleChange('pengurus.ketua.telp', e.target.value)} className="w-full p-3 bg-white border rounded-xl" />
                    </div>
                  </div>
                  <div className="p-8 bg-slate-50 rounded-[2.5rem] space-y-4 border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center border-b pb-3">Profil Sekretaris</p>
                    <div className="space-y-3">
                      <input type="text" placeholder="Nama Lengkap Sekretaris" value={selectedLks.pengurus.sekretaris.nama} onChange={e => handleChange('pengurus.sekretaris.nama', e.target.value)} className="w-full p-3 bg-white border rounded-xl font-bold" />
                      <input type="text" placeholder="No. Telpon/WhatsApp" value={selectedLks.pengurus.sekretaris.telp} onChange={e => handleChange('pengurus.sekretaris.telp', e.target.value)} className="w-full p-3 bg-white border rounded-xl" />
                    </div>
                  </div>
                  <div className="p-8 bg-slate-50 rounded-[2.5rem] space-y-4 border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center border-b pb-3">Profil Bendahara</p>
                    <div className="space-y-3">
                      <input type="text" placeholder="Nama Lengkap Bendahara" value={selectedLks.pengurus.bendahara.nama} onChange={e => handleChange('pengurus.bendahara.nama', e.target.value)} className="w-full p-3 bg-white border rounded-xl font-bold" />
                      <input type="text" placeholder="No. Telpon/WhatsApp" value={selectedLks.pengurus.bendahara.telp} onChange={e => handleChange('pengurus.bendahara.telp', e.target.value)} className="w-full p-3 bg-white border rounded-xl" />
                    </div>
                  </div>
                </div>
              </section>

              {/* III. Legalitas */}
              <section className="space-y-8">
                <h4 className="text-sm font-black text-emerald-600 uppercase flex items-center gap-2 border-b-2 border-emerald-100 pb-2"><ShieldCheck size={16} /> III. Legalitas & Izin Operasional</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nomor Akte Notaris</label><input type="text" value={selectedLks.akteNotaris.nomor} onChange={e => handleChange('akteNotaris.nomor', e.target.value)} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl" /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Tanggal Akte Notaris</label><input type="date" value={selectedLks.akteNotaris.tanggal} onChange={e => handleChange('akteNotaris.tanggal', e.target.value)} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl" /></div>
                  
                  <div className="lg:col-span-2 space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nama Lembaga (Sesuai SK Kemenkumham)</label><input type="text" value={selectedLks.namaKemenkumham} onChange={e => handleChange('namaKemenkumham', e.target.value)} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold" /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nomor SK Kemenkumham</label><input type="text" value={selectedLks.nomorSKKemenkumham} onChange={e => handleChange('nomorSKKemenkumham', e.target.value)} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl" /></div>

                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nomor Tanda Daftar LKS</label><input type="text" value={selectedLks.nomorTandaDaftar} onChange={e => handleChange('nomorTandaDaftar', e.target.value)} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl" /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Masa Berlaku S/D (Tanda Daftar)</label><input type="date" value={selectedLks.masaBerlakuTandaDaftar} onChange={e => handleChange('masaBerlakuTandaDaftar', e.target.value)} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl" /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Masa Berlaku S/D (Ijin Operasional)</label><input type="date" value={selectedLks.masaBerlakuIjinOperasional} onChange={e => handleChange('masaBerlakuIjinOperasional', e.target.value)} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-black text-red-600" /></div>
                </div>
              </section>

              {/* IV. Lingkup & Klasifikasi */}
              <section className="space-y-8">
                <h4 className="text-sm font-black text-rose-600 uppercase flex items-center gap-2 border-b-2 border-rose-100 pb-2"><Briefcase size={16} /> IV. Klasifikasi & Lingkup Kerja</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Posisi LKS</label><select value={selectedLks.posisiLKS} onChange={e => handleChange('posisiLKS', e.target.value)} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold"><option value="Pusat">Pusat</option><option value="Cabang">Cabang</option></select></div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Lingkup Kerja</label><select value={selectedLks.lingkupKerja} onChange={e => handleChange('lingkupKerja', e.target.value)} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold"><option value="Kabupaten">Kabupaten</option><option value="Provinsi">Provinsi</option><option value="Nasional">Nasional</option></select></div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Status Akreditasi</label><select value={selectedLks.statusAkreditasi} onChange={e => handleChange('statusAkreditasi', e.target.value)} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold"><option value="Belum">Belum Terakreditasi</option><option value="A">Grade A (Sangat Baik)</option><option value="B">Grade B (Baik)</option><option value="C">Grade C (Cukup)</option></select></div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Tahun Akreditasi</label><input type="text" value={selectedLks.tahunAkreditasi} onChange={e => handleChange('tahunAkreditasi', e.target.value)} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl" placeholder="Contoh: 2024" /></div>
                </div>
              </section>

              {/* V. Riwayat Bantuan */}
              <section className="space-y-8">
                <div className="flex items-center justify-between border-b-2 border-amber-100 pb-2">
                  <h4 className="text-sm font-black text-amber-600 uppercase flex items-center gap-2"><DollarSign size={16} /> V. Data & Riwayat Bantuan</h4>
                  <button onClick={() => handleChange('riwayatBantuan', [...selectedLks.riwayatBantuan, { id: Math.random().toString(36).substr(2, 9), tahun: '2025', jenis: '', sumber: '', nominal: 0, keterangan: '' }])} className="px-5 py-2.5 bg-amber-50 text-amber-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-600 hover:text-white transition-all">+ Baris Riwayat Baru</button>
                </div>
                <div className="border rounded-[2.5rem] overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-900 text-white">
                      <tr>
                        <th className="px-8 py-5">Tahun</th>
                        <th className="px-8 py-5">Jenis Bantuan</th>
                        <th className="px-8 py-5">Sumber Dana</th>
                        <th className="px-8 py-5">Nominal (Rp)</th>
                        <th className="px-8 py-5 text-right">Hapus</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedLks.riwayatBantuan.map((b, idx) => (
                        <tr key={b.id}>
                          <td className="px-8 py-3"><input type="text" value={b.tahun} onChange={e => { let n = [...selectedLks.riwayatBantuan]; n[idx].tahun = e.target.value; handleChange('riwayatBantuan', n); }} className="w-20 p-2.5 bg-slate-50 border rounded-lg text-xs font-bold" /></td>
                          <td className="px-8 py-3"><input type="text" value={b.jenis} onChange={e => { let n = [...selectedLks.riwayatBantuan]; n[idx].jenis = e.target.value; handleChange('riwayatBantuan', n); }} className="w-full p-2.5 bg-slate-50 border rounded-lg text-xs" /></td>
                          <td className="px-8 py-3"><input type="text" value={b.sumber} onChange={e => { let n = [...selectedLks.riwayatBantuan]; n[idx].sumber = e.target.value; handleChange('riwayatBantuan', n); }} className="w-full p-2.5 bg-slate-50 border rounded-lg text-xs" /></td>
                          <td className="px-8 py-3"><input type="number" value={b.nominal} onChange={e => { let n = [...selectedLks.riwayatBantuan]; n[idx].nominal = Number(e.target.value); handleChange('riwayatBantuan', n); }} className="w-full p-2.5 bg-slate-50 border rounded-lg text-xs font-black" /></td>
                          <td className="px-8 py-3 text-right"><button onClick={() => handleChange('riwayatBantuan', selectedLks.riwayatBantuan.filter(item => item.id !== b.id))} className="text-red-300 hover:text-red-600 transition-colors p-2"><Trash2 size={18}/></button></td>
                        </tr>
                      ))}
                      {selectedLks.riwayatBantuan.length === 0 && (
                        <tr><td colSpan={5} className="px-8 py-10 text-center text-slate-300 italic">Belum ada riwayat bantuan tercatat.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* VI. Deskripsi Kegiatan */}
              <section className="space-y-8">
                <h4 className="text-sm font-black text-blue-600 uppercase flex items-center gap-2 border-b-2 border-blue-100 pb-2"><Activity size={16} /> VI. Fokus Pelayanan & Kegiatan Sosial</h4>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Uraian Kegiatan Sosial Lembaga</label>
                   <textarea value={selectedLks.kegiatanSosial} onChange={e => handleChange('kegiatanSosial', e.target.value)} rows={5} className="w-full px-6 py-5 bg-slate-50 border rounded-[2rem] font-medium leading-relaxed outline-none focus:ring-2 focus:ring-blue-500" placeholder="Jelaskan jenis pelayanan, sasaran PM, serta program rutin yang dijalankan..." />
                </div>
              </section>

              {/* VII. Dokumen PDF Upload */}
              <section className="space-y-8">
                 <h4 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2 border-b-2 border-slate-100 pb-2"><Upload size={16} /> VII. Form Unggah Dokumen Administrasi (PDF)</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { key: 'ktpKetua', label: 'KTP Ketua' },
                      { key: 'skKemenkumham', label: 'SK Kemenkumham' },
                      { key: 'tandaDaftar', label: 'Surat Tanda Daftar' },
                      { key: 'sertifikatAkreditasi', label: 'Sertifikat Akreditasi' }
                    ].map(doc => (
                      <div key={doc.key} className="p-8 border-2 border-dashed rounded-[2.5rem] bg-slate-50/50 flex flex-col items-center text-center gap-4 relative hover:bg-white hover:border-blue-300 transition-all group">
                         <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${selectedLks.dokumen[doc.key as keyof LKSDocuments] ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-100' : 'bg-slate-200 text-slate-400'}`}>
                            {selectedLks.dokumen[doc.key as keyof LKSDocuments] ? <FileCheck size={32}/> : <FileType size={32}/>}
                         </div>
                         <div>
                            <p className="text-[11px] font-black uppercase text-slate-800 mb-1">{doc.label}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{selectedLks.dokumen[doc.key as keyof LKSDocuments] ? 'BERKAS TERSEDIA' : 'BELUM DIUNGGAH'}</p>
                         </div>
                         <label className="cursor-pointer px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                            UNGGAH BERKAS
                            <input type="file" accept="application/pdf" className="hidden" onChange={e => handleFileUpload(e, doc.key as keyof LKSDocuments)} />
                         </label>
                      </div>
                    ))}
                 </div>
              </section>

              {/* VIII. Maps Koordinat */}
              <section className="space-y-8 bg-slate-900 p-10 rounded-[3.5rem] text-white">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-600 rounded-2xl shadow-lg"><MapIcon size={24} /></div>
                      <div>
                         <h4 className="text-sm font-black uppercase tracking-widest">VIII. Titik Koordinat Lokasi LKS</h4>
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Gunakan Peta Untuk Presisi Lokasi</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-4 text-[10px] font-black tracking-widest border border-slate-700 px-6 py-3 rounded-2xl bg-slate-800">
                      <span className="text-blue-400">LAT: {selectedLks.koordinat.lat.toFixed(6)}</span>
                      <span className="text-emerald-400">LNG: {selectedLks.koordinat.lng.toFixed(6)}</span>
                   </div>
                </div>
                <div className="relative h-[500px] rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-slate-800">
                  <div ref={mapContainerRef} className="w-full h-full z-10"></div>
                  <div className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur-md p-3 rounded-2xl text-[10px] font-black text-slate-800 shadow-xl border border-white">
                     GESER PIN PETA UNTUK MENGATUR POSISI
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* REPORT PREVIEW MODAL (RAPORT LKS) */}
      {reportLks && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-md" onClick={() => setReportLks(null)}></div>
          <div className="relative bg-white w-full max-w-5xl h-[95vh] rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
             <div className="p-8 border-b flex items-center justify-between bg-white sticky top-0 z-20 no-print">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><FileBarChart size={24}/></div>
                  <div>
                    <h3 className="font-black text-xl text-slate-800 leading-tight">Pratinjau Dokumen Raport</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Verifikasi & Profil Lengkap Lembaga</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={handleDownloadRaportPDF} disabled={isGenerating} className="flex items-center gap-2 bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                    {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Printer size={18} />} UNDUH PDF
                  </button>
                  <button onClick={() => setReportLks(null)} className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-100 transition-all"><X size={24} className="text-slate-400"/></button>
                </div>
             </div>
             
             {/* Printable Report Surface */}
             <div id="printable-raport" className="flex-1 overflow-y-auto p-12 md:p-16 arial-force bg-white text-black">
                {/* Kop Surat */}
                <div className="text-center border-b-4 border-double border-black pb-8 mb-10 flex items-center gap-8 arial-force">
                   <img src={usedLogo} alt="Logo" className="h-24 max-w-[120px] object-contain" />
                   <div className="flex-1 text-center arial-force">
                      <h1 className="text-xl font-bold uppercase arial-force leading-tight">PEMERINTAH KABUPATEN BLORA</h1>
                      <h2 className="text-2xl font-black uppercase arial-force leading-tight">DINAS SOSIAL PEMBERDAYAAN PEREMPUAN DAN PERLINDUNGAN ANAK</h2>
                      <p className="text-[10pt] font-medium mt-1 arial-force">Jl. Pemuda No.16 A Blora 58215, No. Tlp: (0296) 5298541</p>
                      <p className="text-[10pt] font-bold arial-force">Laman: dinsosp3a.blorakab.go.id | Pos-el: dinsosp3a@blorakab.go.id</p>
                   </div>
                </div>

                <div className="space-y-10 arial-force">
                   <div className="text-center space-y-2 arial-force">
                      <h3 className="text-2xl font-black uppercase underline arial-force tracking-tight">PROFIL LENGKAP LEMBAGA KESEJAHTERAAN SOSIAL</h3>
                      <p className="text-[11pt] font-bold arial-force uppercase">Status Operasional: {reportLks.statusAktif}</p>
                   </div>

                   {/* Section 1 */}
                   <div className="space-y-4 arial-force">
                      <p className="font-bold border-l-4 border-black pl-3 uppercase text-sm arial-force bg-slate-100 py-1">I. IDENTITAS UMUM & DOMISILI</p>
                      <table className="w-full text-[11pt] arial-force">
                         <tbody>
                            <tr className="arial-force"><td className="w-48 font-bold arial-force py-1">Nama Lembaga</td><td className="w-4 arial-force">:</td><td className="arial-force font-black py-1">{reportLks.nama}</td></tr>
                            <tr className="arial-force"><td className="font-bold arial-force py-1">Alamat Lengkap</td><td className="arial-force">:</td><td className="arial-force py-1">{reportLks.alamat}, {reportLks.desa}, Kec. {reportLks.kecamatan}, Blora</td></tr>
                            <tr className="arial-force"><td className="font-bold arial-force py-1">Kontak Resmi</td><td className="arial-force">:</td><td className="arial-force py-1">{reportLks.telpKetua}</td></tr>
                            <tr className="arial-force"><td className="font-bold arial-force py-1">Fokus Pelayanan</td><td className="arial-force">:</td><td className="arial-force py-1">{reportLks.jenisBantuan}</td></tr>
                         </tbody>
                      </table>
                   </div>

                   {/* Section 2 */}
                   <div className="space-y-4 arial-force">
                      <p className="font-bold border-l-4 border-black pl-3 uppercase text-sm arial-force bg-slate-100 py-1">II. STRUKTUR PENGURUS TERDAFTAR</p>
                      <table className="w-full text-[10pt] border-collapse border border-black arial-force">
                         <thead>
                            <tr className="bg-slate-200 arial-force">
                               <th className="border border-black p-2 text-center arial-force">Jabatan</th>
                               <th className="border border-black p-2 text-left arial-force">Nama Lengkap</th>
                               <th className="border border-black p-2 text-center arial-force">Nomor Telpon</th>
                            </tr>
                         </thead>
                         <tbody>
                            <tr className="arial-force"><td className="border border-black p-2 font-bold arial-force text-center">Ketua</td><td className="border border-black p-2 arial-force">{reportLks.pengurus.ketua.nama}</td><td className="border border-black p-2 text-center arial-force">{reportLks.pengurus.ketua.telp}</td></tr>
                            <tr className="arial-force"><td className="border border-black p-2 font-bold arial-force text-center">Sekretaris</td><td className="border border-black p-2 arial-force">{reportLks.pengurus.sekretaris.nama}</td><td className="border border-black p-2 text-center arial-force">{reportLks.pengurus.sekretaris.telp}</td></tr>
                            <tr className="arial-force"><td className="border border-black p-2 font-bold arial-force text-center">Bendahara</td><td className="border border-black p-2 arial-force">{reportLks.pengurus.bendahara.nama}</td><td className="border border-black p-2 text-center arial-force">{reportLks.pengurus.bendahara.telp}</td></tr>
                         </tbody>
                      </table>
                   </div>

                   {/* Section 3 */}
                   <div className="space-y-4 arial-force">
                      <p className="font-bold border-l-4 border-black pl-3 uppercase text-sm arial-force bg-slate-100 py-1">III. LEGALITAS & KEPATUHAN ADMINISTRASI</p>
                      <div className="grid grid-cols-2 gap-x-12 gap-y-4 arial-force">
                         <div className="arial-force">
                            <p className="text-[10pt] font-bold arial-force">A. Akte & Kemenkumham</p>
                            <ul className="list-disc ml-5 text-[10pt] arial-force">
                               <li className="arial-force">No. Akte Notaris: {reportLks.akteNotaris.nomor}</li>
                               <li className="arial-force">No. SK Kemenkumham: {reportLks.nomorSKKemenkumham}</li>
                            </ul>
                         </div>
                         <div className="arial-force">
                            <p className="text-[10pt] font-bold arial-force">B. Izin & Akreditasi</p>
                            <ul className="list-disc ml-5 text-[10pt] arial-force">
                               <li className="arial-force">Status Akreditasi: {reportLks.statusAkreditasi === 'Belum' ? 'Belum Terakreditasi' : `Grade ${reportLks.statusAkreditasi}`}</li>
                               <li className="arial-force">Masa Izin Operasional: S/D {formatDate(reportLks.masaBerlakuIjinOperasional)}</li>
                            </ul>
                         </div>
                      </div>
                   </div>

                   {/* Footer Signature */}
                   <div className="mt-20 flex justify-between arial-force">
                      <div className="text-center w-64 arial-force">
                         <p className="text-[10pt] arial-force">Mengetahui,</p>
                         <p className="font-bold text-[10pt] arial-force mt-1">Ketua {reportLks.nama}</p>
                         <div className="h-24"></div>
                         <p className="font-bold underline text-[10pt] arial-force uppercase">{reportLks.pengurus.ketua.nama}</p>
                      </div>
                      <div className="text-center w-64 arial-force">
                         <p className="text-[10pt] arial-force">Blora, {new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
                         <p className="font-bold text-[10pt] arial-force mt-1">Petugas Verifikator Dinsos,</p>
                         <div className="h-24"></div>
                         <p className="font-bold underline text-[10pt] arial-force">( ........................................ )</p>
                         <p className="text-[9pt] arial-force mt-1">NIP. ........................................</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setDeleteConfirmId(null)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[3rem] p-10 text-center animate-in zoom-in-95 shadow-2xl">
             <div className="w-20 h-20 mx-auto bg-red-50 text-red-600 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-inner"><AlertTriangle size={36} /></div>
             <h3 className="text-2xl font-black text-slate-800 mb-2">Hapus Data LKS?</h3>
             <p className="text-slate-500 text-sm mb-10 leading-relaxed font-medium">Data lembaga beserta semua berkas administrasi dan riwayat bantuan akan dihapus secara permanen.</p>
             <div className="flex gap-4">
                <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest">Batal</button>
                <button onClick={() => {
                   const target = data.find(l => l.id === deleteConfirmId);
                   setData(prev => prev.filter(l => l.id !== deleteConfirmId));
                   if (onNotify) onNotify('Menghapus LKS', target?.nama || '');
                   setDeleteConfirmId(null);
                }} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-200 active:scale-95 transition-all">Hapus Permanen</button>
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
