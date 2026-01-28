
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, Plus, X, Trash2, UserCheck, ShieldCheck, FileText, 
  Building2, MapPin, Printer, FileSpreadsheet, ChevronRight, 
  Award, Users, Save, Edit3, Info, UploadCloud, Download, 
  Navigation, FileCheck, AlertTriangle, PlusCircle, FileBarChart,
  Map as MapIcon, Landmark, Briefcase, Calendar, Phone, CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { LKS, LKSDocuments, BantuanLKS } from '../types';
import { KECAMATAN_BLORA, JENIS_BANTUAN_LIST } from '../constants';

// Global Leaflet
declare const L: any;

interface LKSListProps {
  data: LKS[];
  setData: React.Dispatch<React.SetStateAction<LKS[]>>;
}

const LKSList: React.FC<LKSListProps> = ({ data, setData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLks, setSelectedLks] = useState<LKS | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [reportLks, setReportLks] = useState<LKS | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [exportModal, setExportModal] = useState<'excel' | 'pdf' | null>(null);
  const [confirmPrintRaportModal, setConfirmPrintRaportModal] = useState(false);
  const [isPrintingTable, setIsPrintingTable] = useState(false);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  // Initialize Map for editing coordinates
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
      }, 300);
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
      let newData = { ...prev };
      let current: any = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const handleSave = () => {
    if (selectedLks) {
      setData(prev => {
        const index = prev.findIndex(i => i.id === selectedLks.id);
        if (index > -1) {
          const updated = [...prev];
          updated[index] = selectedLks;
          return updated;
        }
        return [selectedLks, ...prev];
      });
      setIsEditing(false);
      setSelectedLks(null);
      alert('Data LKS berhasil diperbarui.');
    }
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (deleteConfirmId) {
      setData(prev => prev.filter(i => i.id !== deleteConfirmId));
      setDeleteConfirmId(null);
    }
  };

  const handleAddNew = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newLks: LKS = {
      id: newId, nama: '', alamat: '', desa: '', kecamatan: KECAMATAN_BLORA[0],
      telpKetua: '', tempatPendirian: '', tanggalPendirian: '',
      pengurus: { ketua: { nama: '', telp: '' }, sekretaris: { nama: '', telp: '' }, bendahara: { nama: '', telp: '' } },
      akteNotaris: { nomor: '', tanggal: '' }, namaKemenkumham: '', nomorSKKemenkumham: '',
      nomorTandaDaftar: '', masaBerlakuTandaDaftar: '', nomorIjinOperasional: '', masaBerlakuIjinOperasional: '',
      posisiLKS: 'Pusat', lingkupKerja: 'Kabupaten', npwp: '', statusAkreditasi: 'Belum', statusAktif: 'Aktif',
      jenisBantuan: JENIS_BANTUAN_LIST[0], riwayatBantuan: [], jumlahPM: 0, 
      koordinat: { lat: -6.968, lng: 111.417 }, dokumen: {}, kegiatanSosial: ''
    };
    setSelectedLks(newLks);
    setIsEditing(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSize) {
        alert('Gagal Unggah: Ukuran file PDF terlalu besar. Maksimal 2MB per file.');
        e.target.value = ''; 
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        // Simpan data as base64 string
        handleChange(`dokumen.${key}`, event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const exportToExcel = () => {
    const headers = ["Nama LKS", "Kecamatan", "Desa", "Ketua", "Status Akreditasi", "Masa Berakhir Tanda Daftar"];
    const csvContent = [
      headers.join(","),
      ...data.map(item => [
        `"${item.nama}"`,
        `"${item.kecamatan}"`,
        `"${item.desa}"`,
        `"${item.pengurus.ketua.nama}"`,
        `"${item.statusAkreditasi}"`,
        `"${item.masaBerlakuTandaDaftar}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `LKS_Blora_${new Date().toLocaleDateString('id-ID')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportModal(null);
  };

  const triggerPrintTable = () => {
    setExportModal(null);
    setIsPrintingTable(true);
    setTimeout(() => {
      window.print();
      setIsPrintingTable(false);
    }, 500);
  };

  const triggerPrintRaport = () => {
    setConfirmPrintRaportModal(false);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      {/* Search & Actions Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 print:hidden">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" placeholder="Cari LKS, Desa, atau Kecamatan..." 
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setExportModal('excel')} className="flex items-center gap-2 bg-emerald-50 text-emerald-600 border border-emerald-100 px-5 py-3.5 rounded-2xl font-black text-xs hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
            <FileSpreadsheet size={18} /> UNDUH EXCEL
          </button>
          <button onClick={() => setExportModal('pdf')} className="flex items-center gap-2 bg-indigo-50 text-indigo-600 border border-indigo-100 px-5 py-3.5 rounded-2xl font-black text-xs hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
            <Printer size={18} /> CETAK PDF TABEL
          </button>
          <button onClick={handleAddNew} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3.5 rounded-2xl font-black text-sm shadow-xl shadow-blue-600/20 active:scale-95 transition-all">
            <Plus size={18} /> TAMBAH LKS
          </button>
        </div>
      </div>

      {/* Main Table View */}
      <div className={`bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden ${isPrintingTable ? 'print:block' : 'print:hidden'}`} id="printable-table-area">
        {isPrintingTable && (
          <div className="p-10 text-center border-b-4 border-double border-black mb-6">
            <h1 className="text-xl font-bold uppercase">LAPORAN DATA LEMBAGA KESEJAHTERAAN SOSIAL (LKS)</h1>
            <h2 className="text-lg font-bold uppercase">KABUPATEN BLORA</h2>
            <p className="text-xs mt-1">Dicetak pada: {new Date().toLocaleString('id-ID')}</p>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 print:border-black">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest print:text-black">No</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest print:text-black">Nama Lembaga</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest print:text-black">Wilayah</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest print:text-black">Akreditasi</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right print:hidden">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 print:divide-black">
              {filteredData.map((item, idx) => (
                <tr 
                  key={item.id} 
                  className="hover:bg-slate-50/50 transition-colors cursor-pointer group print:hover:bg-transparent"
                  onClick={() => { setSelectedLks(item); setIsEditing(true); }}
                >
                  <td className="px-8 py-5 text-sm font-bold text-slate-300 print:text-black">{idx + 1}</td>
                  <td className="px-8 py-5">
                    <p className="text-sm font-black text-slate-800 group-hover:text-blue-600 transition-colors print:text-black">{item.nama}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 print:text-black">Ketua: {item.pengurus.ketua.nama}</p>
                  </td>
                  <td className="px-8 py-5 text-xs font-bold text-slate-600 print:text-black">
                    <div className="flex items-center gap-1"><MapPin size={14} className="text-blue-500 print:hidden" /> {item.desa}, {item.kecamatan}</div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`text-[9px] font-black px-3 py-1 rounded-full ${item.statusAkreditasi === 'A' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'} print:border print:border-black print:bg-transparent print:text-black`}>
                      GRADE {item.statusAkreditasi}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right print:hidden" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <button title="Lihat Lokasi" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${item.koordinat.lat},${item.koordinat.lng}`, '_blank')} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all">
                        <Navigation size={18} />
                      </button>
                      <button title="Cetak Raport LKS" onClick={() => setReportLks(item)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                        <FileBarChart size={18} />
                      </button>
                      <button title="Hapus" onClick={() => setDeleteConfirmId(item.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL & EDIT MODAL (PERTANKAN SELURUH INDIKATOR) */}
      {isEditing && selectedLks && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => { setIsEditing(false); setSelectedLks(null); }}></div>
          <div className="relative bg-white w-full max-w-6xl h-[95vh] rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="px-10 py-8 border-b flex items-center justify-between bg-white sticky top-0 z-20">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20"><Building2 size={28}/></div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-tight">{selectedLks.nama || 'Pendaftaran LKS Baru'}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Pengelolaan Indikator Kelayakan LKS Blora</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleSave} className="px-8 py-3.5 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-600/20 flex items-center gap-2 active:scale-95 transition-all">
                  <Save size={18} /> SIMPAN SEMUA DATA
                </button>
                <button onClick={() => { setIsEditing(false); setSelectedLks(null); }} className="p-3 hover:bg-slate-100 rounded-2xl transition-all"><X size={24} className="text-slate-400" /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-12 space-y-16 pb-24">
              {/* SECTION 1: DASAR (Identitas) */}
              <div className="space-y-8">
                <h4 className="text-sm font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 border-b-2 border-blue-100 pb-2">
                  <Info size={16} /> I. Identitas Dasar & Domisili
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="lg:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nama LKS</label>
                    <input type="text" value={selectedLks.nama} onChange={e => handleChange('nama', e.target.value)} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold" />
                  </div>
                  <div><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Kecamatan</label>
                    <select value={selectedLks.kecamatan} onChange={e => handleChange('kecamatan', e.target.value)} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold">
                      {KECAMATAN_BLORA.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                  <div><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Desa/Kelurahan</label>
                    <input type="text" value={selectedLks.desa} onChange={e => handleChange('desa', e.target.value)} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold" />
                  </div>
                  <div className="lg:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Alamat Lengkap</label>
                    <input type="text" value={selectedLks.alamat} onChange={e => handleChange('alamat', e.target.value)} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                  </div>
                  <div><label className="text-[10px] font-black text-slate-400 uppercase ml-1">No. Telp Ketua</label>
                    <input type="text" value={selectedLks.telpKetua} onChange={e => handleChange('telpKetua', e.target.value)} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                  </div>
                  <div><label className="text-[10px] font-black text-slate-400 uppercase ml-1">NPWP Lembaga</label>
                    <input type="text" value={selectedLks.npwp} onChange={e => handleChange('npwp', e.target.value)} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                  </div>
                  <div><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Tempat Pendirian</label>
                    <input type="text" value={selectedLks.tempatPendirian} onChange={e => handleChange('tempatPendirian', e.target.value)} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                  </div>
                  <div><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Tanggal Pendirian</label>
                    <input type="date" value={selectedLks.tanggalPendirian} onChange={e => handleChange('tanggalPendirian', e.target.value)} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                  </div>
                </div>
              </div>

              {/* SECTION 2: PENGURUS (Struktur) */}
              <div className="space-y-8">
                <h4 className="text-sm font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 border-b-2 border-indigo-100 pb-2">
                  <Users size={16} /> II. Struktur Pengurus Inti
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {['ketua', 'sekretaris', 'bendahara'].map(role => (
                    <div key={role} className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 space-y-4 shadow-inner">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest border-b border-indigo-50 pb-2">{role}</p>
                      <input type="text" placeholder={`Nama ${role}`} value={(selectedLks.pengurus as any)[role].nama} onChange={e => handleChange(`pengurus.${role}.nama`, e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold shadow-sm" />
                      <input type="text" placeholder={`No. Telp ${role}`} value={(selectedLks.pengurus as any)[role].telp} onChange={e => handleChange(`pengurus.${role}.telp`, e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm shadow-sm" />
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 3: LEGALITAS (Akte, Kemenkumham, Tanda Daftar) */}
              <div className="space-y-8">
                <h4 className="text-sm font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2 border-b-2 border-emerald-100 pb-2">
                  <ShieldCheck size={16} /> III. Legalitas LKS
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="space-y-4 bg-emerald-50/30 p-6 rounded-3xl border border-emerald-100">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Akte Notaris</p>
                    <input type="text" placeholder="Nomor Akte" value={selectedLks.akteNotaris.nomor} onChange={e => handleChange('akteNotaris.nomor', e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm" />
                    <input type="date" value={selectedLks.akteNotaris.tanggal} onChange={e => handleChange('akteNotaris.tanggal', e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm" />
                  </div>
                  <div className="space-y-4 bg-emerald-50/30 p-6 rounded-3xl border border-emerald-100">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Kemenkumham</p>
                    <input type="text" placeholder="Nama sesuai SK" value={selectedLks.namaKemenkumham} onChange={e => handleChange('namaKemenkumham', e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold" />
                    <input type="text" placeholder="Nomor SK" value={selectedLks.nomorSKKemenkumham} onChange={e => handleChange('nomorSKKemenkumham', e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm" />
                  </div>
                  <div className="space-y-4 bg-emerald-50/30 p-6 rounded-3xl border border-emerald-100">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Tanda Daftar LKS</p>
                    <input type="text" placeholder="Nomor Tanda Daftar" value={selectedLks.nomorTandaDaftar} onChange={e => handleChange('nomorTandaDaftar', e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm" />
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-rose-600 uppercase ml-1">Masa Berakhir Tanda Daftar</label>
                      <input type="date" value={selectedLks.masaBerlakuTandaDaftar} onChange={e => handleChange('masaBerlakuTandaDaftar', e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm" />
                    </div>
                  </div>
                  <div><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Posisi & Lingkup Kerja</label>
                    <div className="flex gap-2">
                      <select value={selectedLks.posisiLKS} onChange={e => handleChange('posisiLKS', e.target.value)} className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold">
                        <option value="Pusat">Pusat</option><option value="Cabang">Cabang</option>
                      </select>
                      <select value={selectedLks.lingkupKerja} onChange={e => handleChange('lingkupKerja', e.target.value)} className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold">
                        <option value="Kabupaten">Kabupaten</option><option value="Provinsi">Provinsi</option>
                      </select>
                    </div>
                  </div>
                  <div><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Status Akreditasi</label>
                    <select value={selectedLks.statusAkreditasi} onChange={e => handleChange('statusAkreditasi', e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-blue-600">
                      <option value="Belum">Belum Terakreditasi</option><option value="A">Grade A (Sangat Baik)</option><option value="B">Grade B (Baik)</option><option value="C">Grade C (Cukup)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 4: BANTUAN (Layanan) */}
              <div className="space-y-8">
                <div className="flex items-center justify-between border-b-2 border-rose-100 pb-2">
                  <h4 className="text-sm font-black text-rose-600 uppercase tracking-widest flex items-center gap-2">
                    <Landmark size={16} /> IV. Jenis & Riwayat Bantuan
                  </h4>
                  <button onClick={() => {
                    const newB: BantuanLKS = { id: Math.random().toString(36).substr(2, 5), tahun: '2024', jenis: JENIS_BANTUAN_LIST[0], sumber: '', nominal: 0, keterangan: '' };
                    handleChange('riwayatBantuan', [...selectedLks.riwayatBantuan, newB]);
                  }} className="text-[10px] font-black text-rose-600 bg-rose-50 px-4 py-1.5 rounded-xl border border-rose-100 flex items-center gap-1.5 hover:bg-rose-600 hover:text-white transition-all">
                    <PlusCircle size={14} /> TAMBAH RIWAYAT
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Jenis Layanan Utama</label>
                    <select value={selectedLks.jenisBantuan} onChange={e => handleChange('jenisBantuan', e.target.value)} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold">
                      {JENIS_BANTUAN_LIST.map(j => <option key={j} value={j}>{j}</option>)}
                    </select>
                  </div>
                  <div><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Jumlah Penerima Manfaat (PM)</label>
                    <input type="number" value={selectedLks.jumlahPM} onChange={e => handleChange('jumlahPM', parseInt(e.target.value))} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-blue-600" />
                  </div>
                </div>
                <div className="bg-slate-50 rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-inner">
                  <table className="w-full text-xs">
                    <thead><tr className="bg-slate-100/50"><th className="p-4 text-left">Jenis Bantuan</th><th className="p-4 text-center">Tahun</th><th className="p-4 text-right">Nominal (Rp)</th><th className="p-4 text-left">Sumber</th><th className="p-4 text-right">Aksi</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedLks.riwayatBantuan.map((b, i) => (
                        <tr key={b.id}>
                          <td className="p-3">
                            <select value={b.jenis} onChange={e => {
                              const updated = [...selectedLks.riwayatBantuan];
                              updated[i].jenis = e.target.value;
                              handleChange('riwayatBantuan', updated);
                            }} className="w-full bg-white border border-slate-200 rounded-lg p-1.5 font-bold outline-none">
                              {JENIS_BANTUAN_LIST.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          </td>
                          <td className="p-3">
                            <input type="text" value={b.tahun} onChange={e => {
                              const updated = [...selectedLks.riwayatBantuan];
                              updated[i].tahun = e.target.value;
                              handleChange('riwayatBantuan', updated);
                            }} className="w-20 mx-auto text-center bg-white border border-slate-200 rounded-lg p-1.5 font-bold outline-none" />
                          </td>
                          <td className="p-3">
                            <input type="number" value={b.nominal} onChange={e => {
                              const updated = [...selectedLks.riwayatBantuan];
                              updated[i].nominal = parseFloat(e.target.value);
                              handleChange('riwayatBantuan', updated);
                            }} className="w-32 ml-auto text-right bg-white border border-slate-200 rounded-lg p-1.5 font-black text-emerald-600 outline-none" />
                          </td>
                          <td className="p-3">
                            <input type="text" placeholder="Sumber Dana" value={b.sumber} onChange={e => {
                              const updated = [...selectedLks.riwayatBantuan];
                              updated[i].sumber = e.target.value;
                              handleChange('riwayatBantuan', updated);
                            }} className="w-full bg-white border border-slate-200 rounded-lg p-1.5 outline-none" />
                          </td>
                          <td className="p-3 text-right">
                            <button onClick={() => {
                              const updated = selectedLks.riwayatBantuan.filter((_, idx) => idx !== i);
                              handleChange('riwayatBantuan', updated);
                            }} className="p-2 text-slate-300 hover:text-red-600 transition-all"><Trash2 size={16}/></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 5: PETA & KEGIATAN (Geolokasi & Sosial) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <h4 className="text-sm font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 border-b-2 border-blue-100 pb-2">
                    <MapIcon size={16} /> V. Geolokasi & Titik Koordinat
                  </h4>
                  <div className="bg-slate-100 rounded-[2.5rem] h-72 border-2 border-slate-200 overflow-hidden relative shadow-inner" ref={mapContainerRef}></div>
                  <div className="flex gap-4">
                    <div className="flex-1"><label className="text-[10px] font-bold text-slate-400">LATITUDE</label><input type="number" value={selectedLks.koordinat.lat} onChange={e => handleChange('koordinat.lat', parseFloat(e.target.value))} className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold" /></div>
                    <div className="flex-1"><label className="text-[10px] font-bold text-slate-400">LONGITUDE</label><input type="number" value={selectedLks.koordinat.lng} onChange={e => handleChange('koordinat.lng', parseFloat(e.target.value))} className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold" /></div>
                  </div>
                </div>
                <div className="space-y-6">
                  <h4 className="text-sm font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 border-b-2 border-blue-100 pb-2">
                    <Briefcase size={16} /> VI. Deskripsi Kegiatan Sosial
                  </h4>
                  <textarea value={selectedLks.kegiatanSosial} onChange={e => handleChange('kegiatanSosial', e.target.value)} placeholder="Tuliskan ringkasan kegiatan sosial..." className="w-full h-72 p-6 bg-slate-50 border border-slate-200 rounded-[2.5rem] text-sm leading-relaxed outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none shadow-inner" />
                </div>
              </div>

              {/* SECTION 6: DOKUMEN UPLOAD (Max 2MB) */}
              <div className="space-y-8">
                <div className="border-b-2 border-slate-200 pb-2 flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <UploadCloud size={16} /> VII. Form Unggah Dokumen (PDF, Max 2MB)
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {[
                    { label: 'KTP Ketua', key: 'ktpKetua' },
                    { label: 'SK Kemenkumham', key: 'skKemenkumham' },
                    { label: 'Tanda Daftar', key: 'tandaDaftar' },
                    { label: 'Sertifikat Akreditasi', key: 'sertifikatAkreditasi' }
                  ].map(doc => {
                    const isUploaded = (selectedLks.dokumen as any)[doc.key];
                    return (
                      <div key={doc.key} className={`p-6 border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center text-center gap-3 transition-all shadow-sm ${isUploaded ? 'border-emerald-400 bg-emerald-50/50' : 'border-slate-200 bg-slate-50/30'}`}>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isUploaded ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-slate-200 text-slate-400'}`}>
                          {isUploaded ? <FileCheck size={24}/> : <FileText size={24}/>}
                        </div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-tight">{doc.label}</p>
                        <label className="cursor-pointer bg-white border border-slate-200 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                          {isUploaded ? 'GANTI PDF' : 'PILIH FILE'}
                          <input type="file" accept="application/pdf" className="hidden" onChange={e => handleFileUpload(e, doc.key)} />
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RAPORT LKS MODAL (PRINT VIEW) */}
      {reportLks && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setReportLks(null)}></div>
          <div className="relative bg-white w-full max-w-4xl h-[95vh] rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="px-10 py-6 border-b flex items-center justify-between bg-slate-50 print:hidden">
               <div className="flex items-center gap-3">
                  <FileBarChart className="text-indigo-600" size={24} />
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Pratinjau Raport LKS</h3>
               </div>
               <div className="flex items-center gap-3">
                  <button onClick={() => setConfirmPrintRaportModal(true)} className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl shadow-indigo-600/20 active:scale-95 transition-all">
                    <Download size={18} /> UNDUH PDF RAPORT
                  </button>
                  <button onClick={() => setReportLks(null)} className="p-3 hover:bg-slate-200 rounded-2xl transition-all"><X size={24}/></button>
               </div>
            </div>
            
            <div className="flex-1 overflow-auto p-12 bg-white text-black" id="printable-raport">
               {/* Kop Surat Resmi */}
               <div className="text-center mb-10 border-b-4 border-double border-black pb-8">
                  <h1 className="text-lg font-bold uppercase leading-tight text-black">PEMERINTAH KABUPATEN BLORA</h1>
                  <h2 className="text-2xl font-black uppercase leading-tight text-black">DINAS SOSIAL PEMBERDAYAAN PEREMPUAN DAN PERLINDUNGAN ANAK</h2>
                  <p className="text-[10pt] font-medium mt-1 text-black">Jl. Pemuda No.16 A Blora 58215, No. Tlp: (0296) 5298541</p>
               </div>

               <div className="space-y-8 text-[11pt] text-black">
                  <div className="flex justify-between items-end border-b-2 border-black pb-4">
                    <h4 className="text-2xl font-black text-black uppercase tracking-tighter">{reportLks.nama}</h4>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-600">STATUS AKREDITASI</p>
                      <p className="text-2xl font-black text-blue-600">GRADE {reportLks.statusAkreditasi}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-12">
                    <div className="space-y-4">
                      <p className="font-bold border-l-4 border-black pl-2 uppercase text-black">I. Identitas & Lokasi</p>
                      <table className="w-full text-sm">
                        <tbody>
                          <tr className="border-b border-slate-200"><td className="font-bold py-1.5 w-32">Alamat</td><td>: {reportLks.alamat}</td></tr>
                          <tr className="border-b border-slate-200"><td className="font-bold py-1.5">Desa/Kel</td><td>: {reportLks.desa}</td></tr>
                          <tr className="border-b border-slate-200"><td className="font-bold py-1.5">Kecamatan</td><td>: {reportLks.kecamatan}</td></tr>
                          <tr className="border-b border-slate-200"><td className="font-bold py-1.5">NPWP</td><td>: {reportLks.npwp}</td></tr>
                          <tr className="border-b border-slate-200"><td className="font-bold py-1.5">Koordinat</td><td>: {reportLks.koordinat.lat}, {reportLks.koordinat.lng}</td></tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="space-y-4">
                      <p className="font-bold border-l-4 border-black pl-2 uppercase text-black">II. Legalitas Lembaga</p>
                      <table className="w-full text-sm text-black">
                        <tbody>
                          <tr className="border-b border-slate-200"><td className="font-bold py-1.5 w-32 text-black">Akte Notaris</td><td>: {reportLks.akteNotaris.nomor}</td></tr>
                          <tr className="border-b border-slate-200"><td className="font-bold py-1.5 text-black">SK Kemenkumham</td><td>: {reportLks.nomorSKKemenkumham}</td></tr>
                          <tr className="border-b border-slate-200"><td className="font-bold py-1.5 text-black">Tanda Daftar</td><td>: {reportLks.nomorTandaDaftar}</td></tr>
                          <tr className="border-b border-slate-200"><td className="font-bold py-1.5 text-black">Masa Berlaku</td><td>: s/d {reportLks.masaBerlakuTandaDaftar}</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="font-bold border-l-4 border-black pl-2 uppercase text-black">III. Struktur Kepengurusan Inti</p>
                    <div className="grid grid-cols-3 gap-6">
                      <div className="p-4 border border-black rounded-xl"><p className="text-[8pt] font-black text-slate-500 uppercase tracking-widest">KETUA</p><p className="font-bold text-black">{reportLks.pengurus.ketua.nama}</p><p className="text-[8pt] text-black">{reportLks.pengurus.ketua.telp}</p></div>
                      <div className="p-4 border border-black rounded-xl"><p className="text-[8pt] font-black text-slate-500 uppercase tracking-widest">SEKRETARIS</p><p className="font-bold text-black">{reportLks.pengurus.sekretaris.nama}</p><p className="text-[8pt] text-black">{reportLks.pengurus.sekretaris.telp}</p></div>
                      <div className="p-4 border border-black rounded-xl"><p className="text-[8pt] font-black text-slate-500 uppercase tracking-widest">BENDAHARA</p><p className="font-bold text-black">{reportLks.pengurus.bendahara.nama}</p><p className="text-[8pt] text-black">{reportLks.pengurus.bendahara.telp}</p></div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="font-bold border-l-4 border-black pl-2 uppercase text-black">IV. Layanan & Riwayat Bantuan</p>
                    <div className="border border-black rounded-xl p-6 bg-slate-50/50">
                      <div className="grid grid-cols-2 gap-4 mb-4 text-black">
                        <p>Total Warga Binaan (PM): <b className="text-black">{reportLks.jumlahPM} Orang</b></p>
                        <p>Fokus Layanan Utama: <b className="text-black">{reportLks.jenisBantuan}</b></p>
                      </div>
                      <table className="w-full border-collapse border border-black text-[9pt] bg-white text-black">
                        <thead><tr className="bg-slate-100 font-bold"><th className="border border-black p-2 text-black">JENIS BANTUAN</th><th className="border border-black p-2 text-black">TAHUN</th><th className="border border-black p-2 text-black">NOMINAL</th><th className="border border-black p-2 text-left text-black">SUMBER</th></tr></thead>
                        <tbody>
                          {reportLks.riwayatBantuan.map(b => (
                            <tr key={b.id} className="text-black"><td className="border border-black p-2 text-black">{b.jenis}</td><td className="border border-black p-2 text-center text-black">{b.tahun}</td><td className="border border-black p-2 font-bold text-black">{formatCurrency(b.nominal)}</td><td className="border border-black p-2 text-black">{b.sumber}</td></tr>
                          ))}
                          {reportLks.riwayatBantuan.length === 0 && (<tr className="text-black"><td colSpan={4} className="border border-black p-4 text-center italic text-slate-400">Belum ada riwayat bantuan terdata.</td></tr>)}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="font-bold border-l-4 border-black pl-2 uppercase text-black">V. Ringkasan Kegiatan Sosial</p>
                    <div className="p-6 border border-black rounded-xl italic text-[10pt] leading-relaxed text-justify text-black">
                      "{reportLks.kegiatanSosial || 'Lembaga ini aktif memberikan kontribusi nyata dalam penanganan masalah kesejahteraan sosial di wilayah Kabupaten Blora.'}"
                    </div>
                  </div>

                  <div className="mt-16 flex justify-end text-black">
                    <div className="text-center w-80 text-black">
                      <p className="text-black">Blora, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      <p className="font-bold uppercase mt-1 leading-tight text-black">Kepala Dinas Sosial P3A<br/>Kabupaten Blora</p>
                      <div className="h-28"></div>
                      <p className="font-bold underline uppercase text-black">( __________________________ )</p>
                      <p className="text-[9pt] mt-1 font-medium italic text-black">NIP. 19XXXXXXXXXXXXX</p>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* EXPORT MODAL (Excel / PDF Tabel) */}
      {exportModal && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setExportModal(null)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 text-center animate-in zoom-in-95 duration-300">
            <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center mb-6 shadow-inner ${exportModal === 'excel' ? 'bg-emerald-50 text-emerald-600 shadow-emerald-100' : 'bg-indigo-50 text-indigo-600 shadow-indigo-100'}`}>
              {exportModal === 'excel' ? <FileSpreadsheet size={40}/> : <Printer size={40}/>}
            </div>
            <h3 className="text-2xl font-black text-slate-800 leading-tight mb-2">Konfirmasi Ekspor Data</h3>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
              Sistem akan menyiapkan file laporan dalam format <span className="font-black text-slate-800 uppercase underline">{exportModal === 'excel' ? 'Excel (.csv)' : 'PDF (.pdf)'}</span>.
            </p>
            
            {exportModal === 'pdf' && (
              <div className="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3 text-left">
                <HelpCircle className="text-blue-600 shrink-0 mt-0.5" size={18} />
                <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
                  <b>CARA MENDAPATKAN FILE PDF:</b><br/>
                  Setelah Anda klik tombol di bawah, dialog cetak browser akan muncul. Pilih tujuan/printer <b>"Save as PDF"</b> atau <b>"Simpan sebagai PDF"</b> untuk mengunduh filenya.
                </p>
              </div>
            )}

            <div className="flex gap-4">
              <button onClick={() => setExportModal(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">Batal</button>
              <button 
                onClick={exportModal === 'excel' ? exportToExcel : triggerPrintTable} 
                className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-lg active:scale-95 transition-all ${exportModal === 'excel' ? 'bg-emerald-600 shadow-emerald-600/20' : 'bg-indigo-600 shadow-indigo-600/20'}`}
              >
                {exportModal === 'excel' ? 'UNDUH SEKARANG' : 'BUKA CETAK PDF'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM PRINT RAPORT MODAL */}
      {confirmPrintRaportModal && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setConfirmPrintRaportModal(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 mx-auto bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
              <Printer size={40}/>
            </div>
            <h3 className="text-2xl font-black text-slate-800 leading-tight mb-2">Unduh Raport LKS (PDF)</h3>
            
            <div className="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3 text-left">
              <HelpCircle className="text-blue-600 shrink-0 mt-0.5" size={18} />
              <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
                <b>PETUNJUK UNDUH:</b><br/>
                Pada jendela cetak yang akan muncul, pastikan Anda memilih <b>"Save as PDF"</b> pada kolom Tujuan/Printer agar file raport tersimpan di perangkat Anda.
              </p>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setConfirmPrintRaportModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200">Batal</button>
              <button 
                onClick={triggerPrintRaport} 
                className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
              >
                LANJUTKAN CETAK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 flex flex-col items-center text-center animate-in zoom-in-95">
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mb-6 shadow-inner animate-bounce"><AlertTriangle size={40} /></div>
            <h3 className="text-2xl font-black text-slate-800 leading-tight mb-3">Hapus Data Lembaga?</h3>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">Data <span className="font-bold text-slate-900 underline">"{data.find(i => i.id === deleteConfirmId)?.nama}"</span> akan dihapus permanen dari sistem.</p>
            <div className="flex w-full gap-4">
              <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest transition-all">Batal</button>
              <button onClick={handleConfirmDelete} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-600/20 transition-all">Hapus Sekarang</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          /* Matikan semua elemen visual UI utama */
          body * { visibility: hidden !important; }
          
          /* Hanya tampilkan kontainer target cetak */
          #printable-raport, #printable-raport * { visibility: visible !important; color: black !important; }
          #printable-table-area, #printable-table-area * { visibility: visible !important; color: black !important; }
          
          /* Reset layout kontainer target agar menutupi satu halaman penuh A4 */
          #printable-raport, #printable-table-area { 
            position: absolute !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 100% !important; 
            background: white !important; 
            display: block !important;
            padding: 1cm !important;
            box-shadow: none !important;
            border: none !important;
          }

          /* Hilangkan elemen yang memiliki class print:hidden di dalam kontainer cetak */
          .print\\:hidden { display: none !important; visibility: hidden !important; }

          @page { size: A4 portrait; margin: 0; }
        }
      `}</style>
    </div>
  );
};

export default LKSList;
