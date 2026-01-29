
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, Plus, X, Trash2, UserCheck, ShieldCheck, FileText, 
  Building2, MapPin, Printer, FileSpreadsheet, ChevronRight, 
  Award, Users, Save, Edit3, Info, UploadCloud, Download, 
  Navigation, FileCheck, AlertTriangle, PlusCircle, FileBarChart,
  Map as MapIcon, Landmark, Briefcase, Calendar, Phone, CheckCircle2,
  HelpCircle, Loader2, DollarSign, FileType, Activity, Compass, ExternalLink
} from 'lucide-react';
import { LKS, LKSDocuments, BantuanLKS } from '../types';
import { KECAMATAN_BLORA, JENIS_BANTUAN_LIST } from '../constants';

// Global Leaflet & html2pdf
declare const L: any;
declare const html2pdf: any;

interface LKSListProps {
  data: LKS[];
  setData: React.Dispatch<React.SetStateAction<LKS[]>>;
  initialSelectedId?: string;
  onNotify?: (action: string, target: string) => void;
}

const LKSList: React.FC<LKSListProps> = ({ data, setData, initialSelectedId, onNotify }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLks, setSelectedLks] = useState<LKS | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [reportLks, setReportLks] = useState<LKS | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  // Shortcut Handler: Auto-open LKS from Dashboard
  useEffect(() => {
    if (initialSelectedId) {
      const target = data.find(l => l.id === initialSelectedId);
      if (target) {
        setSelectedLks(target);
        setIsEditing(true);
      }
    }
  }, [initialSelectedId, data]);

  // Initialize Map at bottom of form
  useEffect(() => {
    if (isEditing && selectedLks && mapContainerRef.current) {
      const timer = setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.remove();
        }
        const { lat, lng } = selectedLks.koordinat;
        mapRef.current = L.map(mapContainerRef.current).setView([lat, lng], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap'
        }).addTo(mapRef.current);

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
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newData;
    });
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
      
      if (onNotify) {
        onNotify(isNew ? 'Menambah LKS' : 'Mengupdate LKS', selectedLks.nama);
      }
      
      setIsEditing(false);
      setSelectedLks(null);
      alert('Data LKS berhasil diperbarui.');
    }
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmId) {
      const targetName = data.find(i => i.id === deleteConfirmId)?.nama || 'Data LKS';
      setData(prev => prev.filter(item => item.id !== deleteConfirmId));
      if (onNotify) {
        onNotify('Menghapus LKS', targetName);
      }
      setDeleteConfirmId(null);
    }
  };

  const handleNavigate = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  const handleExportExcel = () => {
    const headers = [
      'Nama LKS', 'Alamat', 'Desa', 'Kecamatan', 'No Telp Ketua', 'Tempat Pendirian', 'Tanggal Pendirian',
      'Ketua', 'Telp Ketua', 'Sekretaris', 'Telp Sekretaris', 'Bendahara', 'Telp Bendahara',
      'Nomor Akte', 'Tanggal Akte', 'Nama Kemenkumham', 'Nomor SK Kemenkumham', 'Nomor Tanda Daftar', 
      'Masa Berlaku TD', 'Nomor Ijin Op', 'Masa Berlaku IO', 'Posisi LKS', 'Lingkup Kerja', 'NPWP', 
      'Status Akreditasi', 'Tahun Akreditasi', 'Status Aktif', 'Layanan Utama', 'Latitude', 'Longitude'
    ];

    const rows = data.map(item => [
      item.nama, item.alamat, item.desa, item.kecamatan, item.telpKetua, item.tempatPendirian, item.tanggalPendirian,
      item.pengurus.ketua.nama, item.pengurus.ketua.tel, item.pengurus.sekretaris.nama, item.pengurus.sekretaris.tel, item.pengurus.bendahara.nama, item.pengurus.bendahara.tel,
      item.akteNotaris.nomor, item.akteNotaris.tanggal, item.namaKemenkumham, item.nomorSKKemenkumham, item.nomorTandaDaftar,
      item.masaBerlakuTandaDaftar, item.nomorIjinOperasional, item.masaBerlakuIjinOperasional, item.posisiLKS, item.lingkupKerja, item.npwp,
      item.statusAkreditasi, item.tahunAkreditasi || '-', item.statusAktif, item.jenisBantuan, item.koordinat.lat, item.koordinat.lng
    ]);

    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Data_Indikator_LKS_Blora_${new Date().toISOString().split('T')[0]}.csv`);
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
      filename: `Database_LKS_Blora.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };
    try { await html2pdf().set(options).from(element).save(); } catch (err) { alert('Gagal download.'); } finally { setIsGenerating(false); }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      {/* Search & Actions Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 no-print">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" placeholder="Cari nama, desa, atau kecamatan..." 
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 shadow-sm font-medium"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportExcel} className="flex items-center gap-2 bg-emerald-50 text-emerald-600 border border-emerald-100 px-5 py-3.5 rounded-2xl font-black text-xs hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
            <FileSpreadsheet size={18} /> EXCEL
          </button>
          <button onClick={handleExportTablePDF} disabled={isGenerating} className="flex items-center gap-2 bg-indigo-50 text-indigo-600 border border-indigo-100 px-5 py-3.5 rounded-2xl font-black text-xs hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
            {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Printer size={18} />} PDF
          </button>
          <button onClick={() => {
            const newId = Math.random().toString(36).substr(2, 9);
            setSelectedLks({
              id: newId, nama: '', alamat: '', desa: '', kecamatan: KECAMATAN_BLORA[0],
              telpKetua: '', tempatPendirian: '', tanggalPendirian: '',
              pengurus: { ketua: { nama: '', telp: '' }, sekretaris: { nama: '', telp: '' }, bendahara: { nama: '', telp: '' } },
              akteNotaris: { nomor: '', tanggal: '' }, namaKemenkumham: '', nomorSKKemenkumham: '',
              nomorTandaDaftar: '', masaBerlakuTandaDaftar: '', nomorIjinOperasional: '', masaBerlakuIjinOperasional: '',
              posisiLKS: 'Pusat', lingkupKerja: 'Kabupaten', npwp: '', statusAkreditasi: 'Belum', tahunAkreditasi: '', statusAktif: 'Aktif',
              jenisBantuan: JENIS_BANTUAN_LIST[0], riwayatBantuan: [], jumlahPM: 0, 
              koordinat: { lat: -6.968, lng: 111.417 }, dokumen: {}, kegiatanSosial: ''
            });
            setIsEditing(true);
          }} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3.5 rounded-2xl font-black text-sm shadow-xl shadow-blue-600/20 active:scale-95 transition-all">
            <Plus size={18} /> TAMBAH LKS
          </button>
        </div>
      </div>

      {/* Modern Data Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden" id="printable-table-area">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 border-r border-white/5">No</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Lembaga & Wilayah</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Kontak Ketua</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Akreditasi</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right no-print">Aksi & Navigasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((item, idx) => (
                <tr 
                  key={item.id} 
                  className={`hover:bg-blue-50/40 transition-colors cursor-pointer group ${initialSelectedId === item.id ? 'bg-blue-50 ring-2 ring-inset ring-blue-500' : ''}`}
                  onClick={() => { setSelectedLks(item); setIsEditing(true); }}
                >
                  <td className="px-8 py-6 text-sm font-black text-slate-300 border-r border-slate-50">{idx + 1}</td>
                  <td className="px-8 py-6">
                    <p className="text-base font-black text-slate-800 group-hover:text-blue-600 transition-colors">{item.nama || 'Tanpa Nama'}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                       <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-tight">
                         <MapPin size={12} className="text-rose-500" /> {item.desa}, {item.kecamatan}
                       </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-bold text-slate-700">{item.pengurus.ketua.nama || '-'}</p>
                    <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1 mt-1">
                      <Phone size={10} className="text-emerald-500" /> {item.telpKetua || '-'}
                    </p>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className={`inline-flex flex-col items-center justify-center min-w-[50px] min-h-[50px] p-2 rounded-xl font-black text-sm border-2 ${
                      item.statusAkreditasi === 'A' ? 'bg-blue-50 border-blue-200 text-blue-600' : 
                      item.statusAkreditasi === 'B' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
                      item.statusAkreditasi === 'C' ? 'bg-amber-50 border-amber-200 text-amber-600' :
                      'bg-slate-50 border-slate-200 text-slate-400'
                    }`}>
                      <span>{item.statusAkreditasi === 'Belum' ? '-' : item.statusAkreditasi}</span>
                      {item.tahunAkreditasi && <span className="text-[8px] opacity-70 mt-0.5">{item.tahunAkreditasi}</span>}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      item.statusAktif === 'Aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {item.statusAktif}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right no-print" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        title="Petunjuk Arah (Maps)"
                        onClick={() => handleNavigate(item.koordinat.lat, item.koordinat.lng)}
                        className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center gap-2"
                      >
                        <Compass size={18} />
                        <span className="text-[10px] font-black uppercase tracking-tight hidden lg:inline">Ke Lokasi</span>
                      </button>
                      <button title="Cetak Raport" onClick={() => setReportLks(item)} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                        <FileBarChart size={20} />
                      </button>
                      <button title="Hapus" onClick={() => setDeleteConfirmId(item.id)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-32 text-center text-slate-300 italic font-medium">
                    <Search size={48} className="mx-auto mb-4 opacity-10" />
                    Data LKS tidak ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT MODAL LENGKAP */}
      {isEditing && selectedLks && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={() => { setIsEditing(false); setSelectedLks(null); }}></div>
          <div className="relative bg-white w-full max-w-6xl h-[95vh] rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="px-10 py-8 border-b flex items-center justify-between bg-white sticky top-0 z-20">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><Building2 size={28}/></div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-tight truncate max-w-[500px]">{selectedLks.nama || 'LKS Baru'}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Lengkapi seluruh indikator data lembaga</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleSave} className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 flex items-center gap-2 active:scale-95 transition-all">
                  <Save size={18} /> Simpan Data
                </button>
                <button onClick={() => { setIsEditing(false); setSelectedLks(null); }} className="p-3 hover:bg-slate-100 rounded-2xl transition-all"><X size={24} className="text-slate-400" /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-12 space-y-20 pb-24 no-scrollbar">
              {/* I. Identitas Dasar */}
              <div className="space-y-8">
                <h4 className="text-sm font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 border-b-2 border-blue-100 pb-2">
                  <Info size={16} /> I. Identitas Dasar & Domisili
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="lg:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nama LKS (Sesuai Plang)</label>
                    <input type="text" value={selectedLks.nama} onChange={e => handleChange('nama', e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all" />
                  </div>
                  <div><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Kecamatan</label>
                    <select value={selectedLks.kecamatan} onChange={e => handleChange('kecamatan', e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold">
                      {KECAMATAN_BLORA.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                  <div><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Desa/Kelurahan</label>
                    <input type="text" value={selectedLks.desa} onChange={e => handleChange('desa', e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold" />
                  </div>
                  <div className="lg:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Alamat Lengkap</label>
                    <input type="text" value={selectedLks.alamat} onChange={e => handleChange('alamat', e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-medium" />
                  </div>
                  <div><label className="text-[10px] font-black text-slate-400 uppercase ml-1">No. Telp Ketua</label>
                    <input type="text" value={selectedLks.telpKetua} onChange={e => handleChange('telpKetua', e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-[10px] font-black text-slate-400 uppercase">Tpt Berdiri</label>
                      <input type="text" value={selectedLks.tempatPendirian} onChange={e => handleChange('tempatPendirian', e.target.value)} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-xs" />
                    </div>
                    <div><label className="text-[10px] font-black text-slate-400 uppercase">Tgl Berdiri</label>
                      <input type="date" value={selectedLks.tanggalPendirian} onChange={e => handleChange('tanggalPendirian', e.target.value)} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-xs" />
                    </div>
                  </div>
                </div>
              </div>

              {/* II. Pengurus */}
              <div className="space-y-8">
                <h4 className="text-sm font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 border-b-2 border-indigo-100 pb-2">
                  <Users size={16} /> II. Struktur Pengurus Inti
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {['ketua', 'sekretaris', 'bendahara'].map(role => (
                    <div key={role} className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-5 shadow-inner">
                      <div className="flex items-center gap-3 border-b border-indigo-100 pb-3">
                         <div className="p-2 bg-indigo-600 text-white rounded-xl"><UserCheck size={18}/></div>
                         <p className="text-xs font-black text-indigo-600 uppercase tracking-widest">{role}</p>
                      </div>
                      <div className="space-y-3">
                        <input type="text" placeholder={`Nama Lengkap ${role}`} value={(selectedLks.pengurus as any)[role].nama} onChange={e => handleChange(`pengurus.${role}.nama`, e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold shadow-sm" />
                        <input type="text" placeholder={`No. WhatsApp ${role}`} value={(selectedLks.pengurus as any)[role].tel} onChange={e => handleChange(`pengurus.${role}.tel`, e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm shadow-sm" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* III. Legalitas */}
              <div className="space-y-8">
                <h4 className="text-sm font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2 border-b-2 border-emerald-100 pb-2">
                  <ShieldCheck size={16} /> III. Legalitas & Perizinan
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="space-y-4 bg-emerald-50/40 p-8 rounded-[2.5rem] border border-emerald-100">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2"><Landmark size={14}/> Akte Notaris</p>
                    <input type="text" placeholder="Nomor Akte" value={selectedLks.akteNotaris.nomor} onChange={e => handleChange('akteNotaris.nomor', e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl text-sm font-bold" />
                    <input type="date" value={selectedLks.akteNotaris.tanggal} onChange={e => handleChange('akteNotaris.tanggal', e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl text-sm" />
                  </div>
                  <div className="lg:col-span-2 space-y-4 bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-200">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Briefcase size={14}/> Pengesahan Kemenkumham</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input type="text" placeholder="Nama Lembaga di SK" value={selectedLks.namaKemenkumham} onChange={e => handleChange('namaKemenkumham', e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl text-sm font-bold" />
                      <input type="text" placeholder="Nomor SK Pengesahan" value={selectedLks.nomorSKKemenkumham} onChange={e => handleChange('nomorSKKemenkumham', e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl text-sm" />
                    </div>
                  </div>
                  <div className="space-y-4 bg-blue-50/40 p-8 rounded-[2.5rem] border border-blue-100">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2"><FileCheck size={14}/> Surat Tanda Daftar (TD)</p>
                    <input type="text" placeholder="Nomor Tanda Daftar" value={selectedLks.nomorTandaDaftar} onChange={e => handleChange('nomorTandaDaftar', e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl text-sm font-bold" />
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-blue-400 uppercase">Masa Berlaku TD</label>
                      <input type="date" value={selectedLks.masaBerlakuTandaDaftar} onChange={e => handleChange('masaBerlakuTandaDaftar', e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl text-sm" />
                    </div>
                  </div>
                  <div className="space-y-4 bg-amber-50/40 p-8 rounded-[2.5rem] border border-amber-100">
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2"><Activity size={14}/> Ijin Operasional (IO)</p>
                    <input type="text" placeholder="Nomor Ijin Operasional" value={selectedLks.nomorIjinOperasional} onChange={e => handleChange('nomorIjinOperasional', e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl text-sm font-bold" />
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-amber-400 uppercase">Masa Berlaku IO</label>
                      <input type="date" value={selectedLks.masaBerlakuIjinOperasional} onChange={e => handleChange('masaBerlakuIjinOperasional', e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl text-sm" />
                    </div>
                  </div>
                  <div className="space-y-4 p-8 bg-slate-50 border rounded-[2.5rem]">
                    <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2"><Landmark size={14}/> Nomor NPWP Lembaga</label>
                    <input type="text" placeholder="00.000.000.0-000.000" value={selectedLks.npwp} onChange={e => handleChange('npwp', e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none font-bold" />
                  </div>
                </div>
              </div>

              {/* IV. Klasifikasi */}
              <div className="space-y-8">
                <h4 className="text-sm font-black text-rose-600 uppercase tracking-widest flex items-center gap-2 border-b-2 border-rose-100 pb-2">
                  <Award size={16} /> IV. Klasifikasi & Status Akreditasi
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  <div><label className="text-[10px] font-black text-slate-400 uppercase">Posisi LKS</label>
                    <select value={selectedLks.posisiLKS} onChange={e => handleChange('posisiLKS', e.target.value)} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold">
                      <option value="Pusat">Pusat</option><option value="Cabang">Cabang</option>
                    </select>
                  </div>
                  <div><label className="text-[10px] font-black text-slate-400 uppercase">Lingkup Kerja</label>
                    <select value={selectedLks.lingkupKerja} onChange={e => handleChange('lingkupKerja', e.target.value)} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold">
                      <option value="Kabupaten">Kabupaten</option><option value="Provinsi">Provinsi</option><option value="Nasional">Nasional</option>
                    </select>
                  </div>
                  <div><label className="text-[10px] font-black text-slate-400 uppercase">Status Akreditasi</label>
                    <select value={selectedLks.statusAkreditasi} onChange={e => handleChange('statusAkreditasi', e.target.value)} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-blue-600">
                      <option value="Belum">Belum Terakreditasi</option><option value="A">Grade A (Sangat Baik)</option><option value="B">Grade B (Baik)</option><option value="C">Grade C (Cukup)</option>
                    </select>
                  </div>
                  <div><label className="text-[10px] font-black text-slate-400 uppercase">Tahun Akreditasi</label>
                    <input type="text" placeholder="Contoh: 2023" value={selectedLks.tahunAkreditasi || ''} onChange={e => handleChange('tahunAkreditasi', e.target.value)} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
                  </div>
                  <div><label className="text-[10px] font-black text-slate-400 uppercase">Status Aktif</label>
                    <select value={selectedLks.statusAktif} onChange={e => handleChange('statusAktif', e.target.value)} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-emerald-600">
                      <option value="Aktif">Aktif</option><option value="Tidak Aktif">Tidak Aktif / Vakum</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* V. Riwayat Bantuan */}
              <div className="space-y-8">
                <div className="flex items-center justify-between border-b-2 border-slate-100 pb-2">
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <DollarSign size={16} className="text-emerald-600" /> V. Riwayat Penerimaan Bantuan
                  </h4>
                  <button onClick={() => {
                     const newBantuan: BantuanLKS = {
                        id: Math.random().toString(36).substr(2, 9),
                        tahun: new Date().getFullYear().toString(),
                        jenis: 'Bantuan Sosial',
                        sumber: 'APBD',
                        nominal: 0,
                        keterangan: ''
                      };
                      handleChange('riwayatBantuan', [...selectedLks.riwayatBantuan, newBantuan]);
                  }} className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                    <PlusCircle size={16}/> Tambah Baris Baru
                  </button>
                </div>
                <div className="overflow-hidden border border-slate-100 rounded-[2.5rem] bg-slate-50/50">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white">
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Tahun</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Jenis Bantuan / Program</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Nominal (Rp)</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {selectedLks.riwayatBantuan.map((b, idx) => (
                        <tr key={b.id} className="bg-white hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-3"><input type="text" value={b.tahun} onChange={e => {
                            const newBantuan = [...selectedLks.riwayatBantuan];
                            newBantuan[idx].tahun = e.target.value;
                            handleChange('riwayatBantuan', newBantuan);
                          }} className="w-20 p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold" /></td>
                          <td className="px-6 py-3"><input type="text" value={b.jenis} onChange={e => {
                            const newBantuan = [...selectedLks.riwayatBantuan];
                            newBantuan[idx].jenis = e.target.value;
                            handleChange('riwayatBantuan', newBantuan);
                          }} className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs" /></td>
                          <td className="px-6 py-3"><input type="number" value={b.nominal} onChange={e => {
                            const newBantuan = [...selectedLks.riwayatBantuan];
                            newBantuan[idx].nominal = Number(e.target.value);
                            handleChange('riwayatBantuan', newBantuan);
                          }} className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-black text-blue-600" /></td>
                          <td className="px-6 py-3 text-center"><button onClick={() => {
                            handleChange('riwayatBantuan', selectedLks.riwayatBantuan.filter(item => item.id !== b.id));
                          }} className="p-2 text-slate-300 hover:text-red-600 transition-all"><Trash2 size={18}/></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* VI. Berkas Digital */}
              <div className="space-y-8">
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 border-b-2 border-slate-100 pb-2">
                  <FileType size={16} /> VI. Narasi & Unggah Berkas PDF
                </h4>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Deskripsi Kegiatan Sosial (Narasi Laporan)</label>
                  <textarea value={selectedLks.kegiatanSosial} onChange={e => handleChange('kegiatanSosial', e.target.value)} className="w-full h-40 p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] outline-none text-sm leading-relaxed text-slate-600 italic focus:ring-2 focus:ring-blue-100 transition-all" placeholder="Tuliskan ringkasan kegiatan rutin..." />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { key: 'ktpKetua', label: 'PDF KTP Ketua' },
                    { key: 'skKemenkumham', label: 'PDF SK Kemenkumham' },
                    { key: 'tandaDaftar', label: 'PDF Tanda Daftar' },
                    { key: 'sertifikatAkreditasi', label: 'PDF Akreditasi' }
                  ].map(doc => (
                    <div key={doc.key} className="p-8 border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50 text-center space-y-4 group/doc hover:border-blue-400 hover:bg-white transition-all">
                       <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center transition-all ${selectedLks.dokumen[doc.key as keyof LKSDocuments] ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-slate-300 border'}`}>
                          {selectedLks.dokumen[doc.key as keyof LKSDocuments] ? <FileCheck size={28}/> : <UploadCloud size={28}/>}
                       </div>
                       <p className="text-[10px] font-black text-slate-800 uppercase tracking-tighter">{doc.label}</p>
                       <label className="inline-block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase cursor-pointer hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                          {selectedLks.dokumen[doc.key as keyof LKSDocuments] ? 'Ganti Berkas' : 'Unggah PDF'}
                          <input type="file" accept="application/pdf" className="hidden" onChange={(e) => {
                             const file = e.target.files?.[0];
                             if (file) {
                               const reader = new FileReader();
                               reader.onload = (event) => handleChange(`dokumen.${doc.key}`, event.target?.result as string);
                               reader.readAsDataURL(file);
                             }
                          }} />
                       </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* VII. Titik Koordinat Peta (Paling Bawah) */}
              <div className="space-y-8 bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                    <MapIcon size={20} className="text-blue-400" /> VII. Penentuan Titik Koordinat Lokasi LKS
                  </h4>
                  <div className="flex gap-4">
                    <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/5"><p className="text-[8px] font-black uppercase text-blue-400 tracking-widest">Lat</p><p className="font-bold text-xs">{selectedLks.koordinat.lat}</p></div>
                    <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/5"><p className="text-[8px] font-black uppercase text-blue-400 tracking-widest">Lng</p><p className="font-bold text-xs">{selectedLks.koordinat.lng}</p></div>
                  </div>
                </div>
                <div className="relative h-[450px] rounded-[2.5rem] border-4 border-white/10 overflow-hidden bg-slate-800 shadow-inner">
                   <div ref={mapContainerRef} className="w-full h-full z-10"></div>
                   <div className="absolute top-4 right-4 z-20 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 pointer-events-none">
                      <p className="text-[10px] font-black uppercase flex items-center gap-2"><Info size={14}/> Geser Pin Merah ke Lokasi LKS</p>
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
          <div className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-12 text-center animate-in zoom-in-95">
            <div className="w-24 h-24 mx-auto bg-red-50 text-red-600 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner"><AlertTriangle size={48}/></div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">Hapus Lembaga?</h3>
            <p className="text-slate-500 text-sm mb-10 leading-relaxed font-medium">Tindakan ini permanen. Seluruh data lembaga akan hilang dari sistem.</p>
            <div className="flex gap-4">
              <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-4.5 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">Batal</button>
              <button onClick={handleConfirmDelete} className="flex-1 py-4.5 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-600/20 active:scale-95 transition-all">Hapus Permanen</button>
            </div>
          </div>
        </div>
      )}

      {/* RAPORT PREVIEW MODAL */}
      {reportLks && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setReportLks(null)}></div>
          <div className="relative bg-white w-full max-w-4xl h-[92vh] rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
             <div className="p-8 border-b flex items-center justify-between bg-slate-50/50 no-print">
                <h3 className="font-black text-xl text-slate-800">Pratinjau Raport LKS</h3>
                <button onClick={() => setReportLks(null)} className="p-3 bg-white border rounded-xl hover:bg-slate-100 transition-all shadow-sm"><X/></button>
             </div>
             <div id="printable-raport" className="flex-1 overflow-y-auto p-16 arial-force bg-white text-black">
                <div className="text-center border-b-4 border-double border-black pb-8 mb-10 arial-force">
                   <h1 className="text-xl font-bold uppercase arial-force">PEMERINTAH KABUPATEN BLORA</h1>
                   <h2 className="text-2xl font-black uppercase arial-force">DINAS SOSIAL PEMBERDAYAAN PEREMPUAN DAN PERLINDUNGAN ANAK</h2>
                   <p className="text-[10pt] mt-1 italic arial-force">Jl. Pemuda No.16 A Blora 58215, Telp: (0296) 5298541</p>
                </div>
                <div className="space-y-10 arial-force">
                   <div className="flex justify-between items-end border-b-2 border-black pb-4 arial-force">
                      <h4 className="text-3xl font-black uppercase arial-force leading-none">{reportLks.nama}</h4>
                      <p className="text-3xl font-black text-indigo-600 arial-force">GRADE {reportLks.statusAkreditasi}</p>
                   </div>
                   <div className="grid grid-cols-2 gap-12 arial-force">
                      <div className="space-y-4 arial-force">
                         <p className="font-bold border-l-4 border-black pl-3 uppercase text-sm arial-force">I. Administrasi & Lokasi</p>
                         <div className="space-y-2 text-[11pt] arial-force">
                           <p className="arial-force"><span className="font-bold w-32 inline-block arial-force">Alamat</span> : {reportLks.alamat}</p>
                           <p className="arial-force"><span className="font-bold w-32 inline-block arial-force">Wilayah</span> : {reportLks.desa}, {reportLks.kecamatan}</p>
                           <p className="arial-force"><span className="font-bold w-32 inline-block arial-force">Status LKS</span> : {reportLks.statusAktif}</p>
                           {reportLks.tahunAkreditasi && (
                             <p className="arial-force"><span className="font-bold w-32 inline-block arial-force">Thn Akreditasi</span> : {reportLks.tahunAkreditasi}</p>
                           )}
                         </div>
                      </div>
                      <div className="space-y-4 arial-force">
                         <p className="font-bold border-l-4 border-black pl-3 uppercase text-sm arial-force">II. Legalitas Hukum</p>
                         <div className="space-y-2 text-[11pt] arial-force">
                           <p className="arial-force"><span className="font-bold w-32 inline-block arial-force">Notaris</span> : No. {reportLks.akteNotaris.nomor}</p>
                           <p className="arial-force"><span className="font-bold w-32 inline-block arial-force">Tanda Daftar</span> : {reportLks.nomorTandaDaftar}</p>
                           <p className="arial-force"><span className="font-bold w-32 inline-block arial-force">NPWP</span> : {reportLks.npwp}</p>
                         </div>
                      </div>
                   </div>
                   <div className="arial-force space-y-4">
                      <p className="font-bold border-l-4 border-black pl-3 uppercase text-sm arial-force">III. Deskripsi Pelayanan</p>
                      <div className="p-8 border border-black rounded-3xl italic text-[11pt] leading-relaxed text-justify arial-force">
                        {reportLks.kegiatanSosial || 'Lembaga ini aktif dalam pelayanan kesejahteraan sosial sesuai lingkup kerjanya.'}
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      <style>{`
        .arial-force { font-family: Arial, sans-serif !important; }
        #printable-table-area table { border-collapse: separate; border-spacing: 0; }
        #printable-table-area tr:first-child th:first-child { border-top-left-radius: 2.5rem; }
        #printable-table-area tr:first-child th:last-child { border-top-right-radius: 2.5rem; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default LKSList;
