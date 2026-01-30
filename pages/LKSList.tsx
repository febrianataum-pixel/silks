
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
        marker.on('dragend', (e: any) => { const pos = e.target.getLatLng(); handleChange('koordinat.lat', pos.lat); handleChange('koordinat.lng', pos.lng); });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isEditing, selectedLks?.id]);

  const filteredData = useMemo(() => {
    return data.filter(item => item.nama.toLowerCase().includes(searchTerm.toLowerCase()) || item.kecamatan.toLowerCase().includes(searchTerm.toLowerCase()) || item.desa.toLowerCase().includes(searchTerm.toLowerCase()));
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

  const handleSave = () => {
    if (selectedLks) {
      const isNew = !data.some(i => i.id === selectedLks.id);
      setData(prev => {
        const index = prev.findIndex(i => i.id === selectedLks.id);
        if (index > -1) { const updated = [...prev]; updated[index] = selectedLks; return updated; }
        return [selectedLks, ...prev];
      });
      if (onNotify) onNotify(isNew ? 'Menambah LKS' : 'Mengupdate LKS', selectedLks.nama);
      setIsEditing(false); setSelectedLks(null);
      alert('Data LKS berhasil diperbarui.');
    }
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmId) {
      const targetName = data.find(i => i.id === deleteConfirmId)?.nama || 'Data LKS';
      setData(prev => prev.filter(item => item.id !== deleteConfirmId));
      if (onNotify) onNotify('Menghapus LKS', targetName);
      setDeleteConfirmId(null);
    }
  };

  // Fix: Added handleNavigate to resolve "Cannot find name 'handleNavigate'" error
  const handleNavigate = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  const handleExportExcel = () => {
    const headers = ['Nama LKS', 'Alamat', 'Desa', 'Kecamatan', 'No Telp Ketua', 'Status Akreditasi', 'Status Aktif'];
    const rows = data.map(item => [item.nama, item.alamat, item.desa, item.kecamatan, item.telpKetua, item.statusAkreditasi, item.statusAktif]);
    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const link = document.createElement("a"); link.setAttribute("href", encodeURI(csvContent)); link.setAttribute("download", `Data_LKS_Blora.csv`); link.click();
  };

  const handleExportTablePDF = async () => {
    const element = document.getElementById('printable-table-area');
    if (!element) return;
    setIsGenerating(true);
    const options = { margin: 10, filename: `Database_LKS_Blora.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' } };
    try { await html2pdf().set(options).from(element).save(); } catch (err) { alert('Gagal.'); } finally { setIsGenerating(false); }
  };

  const handleDownloadRaportPDF = async () => {
    const element = document.getElementById('printable-raport');
    if (!element || !reportLks) return;
    setIsGenerating(true);
    const options = { margin: 10, filename: `Raport_LKS_${reportLks.nama.replace(/\s+/g, '_')}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
    try { await html2pdf().set(options).from(element).save(); } catch (err) { alert('Gagal.'); } finally { setIsGenerating(false); }
  };

  const formatDate = (dateStr: string) => { if (!dateStr) return '-'; return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }); };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 no-print">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Cari nama, desa, atau kecamatan..." className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 shadow-sm font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportExcel} className="flex items-center gap-2 bg-emerald-50 text-emerald-600 border border-emerald-100 px-5 py-3.5 rounded-2xl font-black text-xs hover:bg-emerald-600 hover:text-white transition-all shadow-sm"><FileSpreadsheet size={18} /> EXCEL</button>
          <button onClick={handleExportTablePDF} disabled={isGenerating} className="flex items-center gap-2 bg-indigo-50 text-indigo-600 border border-indigo-100 px-5 py-3.5 rounded-2xl font-black text-xs hover:bg-indigo-600 hover:text-white transition-all shadow-sm">{isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Printer size={18} />} PDF</button>
          <button onClick={() => {
            const newId = Math.random().toString(36).substr(2, 9);
            setSelectedLks({
              id: newId, nama: '', alamat: '', desa: '', kecamatan: KECAMATAN_BLORA[0], telpKetua: '', tempatPendirian: '', tanggalPendirian: '',
              pengurus: { ketua: { nama: '', telp: '' }, sekretaris: { nama: '', telp: '' }, bendahara: { nama: '', telp: '' } },
              akteNotaris: { nomor: '', tanggal: '' }, namaKemenkumham: '', nomorSKKemenkumham: '', nomorTandaDaftar: '', masaBerlakuTandaDaftar: '', nomorIjinOperasional: '', masaBerlakuIjinOperasional: '',
              posisiLKS: 'Pusat', lingkupKerja: 'Kabupaten', npwp: '', statusAkreditasi: 'Belum', tahunAkreditasi: '', statusAktif: 'Aktif',
              jenisBantuan: JENIS_BANTUAN_LIST[0], riwayatBantuan: [], jumlahPM: 0, koordinat: { lat: -6.968, lng: 111.417 }, dokumen: {}, kegiatanSosial: ''
            }); setIsEditing(true);
          }} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3.5 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all"><Plus size={18} /> TAMBAH LKS</button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden" id="printable-table-area">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400">No</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400">Lembaga & Wilayah</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400">Kontak Ketua</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 text-center">Akreditasi</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 text-center">Status</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 text-right no-print">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((item, idx) => (
                <tr key={item.id} className="hover:bg-blue-50/40 transition-colors cursor-pointer group" onClick={() => { setSelectedLks(item); setIsEditing(true); }}>
                  <td className="px-8 py-6 text-sm font-black text-slate-300">{idx + 1}</td>
                  <td className="px-8 py-6">
                    <p className="text-base font-black text-slate-800">{item.nama}</p>
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase"><MapPin size={12} className="text-rose-500" /> {item.desa}, {item.kecamatan}</span>
                  </td>
                  <td className="px-8 py-6"><p className="text-sm font-bold text-slate-700">{item.pengurus.ketua.nama}</p><p className="text-[10px] text-slate-400 font-bold flex items-center gap-1 mt-1"><Phone size={10} className="text-emerald-500" /> {item.telpKetua}</p></td>
                  <td className="px-8 py-6 text-center">
                    <div className="inline-flex flex-col items-center justify-center min-w-[50px] min-h-[50px] p-2 rounded-xl font-black text-sm border-2 bg-slate-50">
                      <span>{item.statusAkreditasi === 'Belum' ? '-' : item.statusAkreditasi}</span>
                      {item.tahunAkreditasi && <span className="text-[8px] opacity-70 mt-0.5">{item.tahunAkreditasi}</span>}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center"><span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${item.statusAktif === 'Aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{item.statusAktif}</span></td>
                  <td className="px-8 py-6 text-right no-print" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleNavigate(item.koordinat.lat, item.koordinat.lng)} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Compass size={18} /></button>
                      <button onClick={() => setReportLks(item)} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><FileBarChart size={20} /></button>
                      <button onClick={() => setDeleteConfirmId(item.id)} className="p-2.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={20} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isEditing && selectedLks && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={() => { setIsEditing(false); setSelectedLks(null); }}></div>
          <div className="relative bg-white w-full max-w-6xl h-[95vh] rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="px-10 py-8 border-b flex items-center justify-between bg-white sticky top-0 z-20">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><Building2 size={28}/></div>
                <div><h3 className="text-2xl font-black text-slate-800 uppercase truncate max-w-[500px]">{selectedLks.nama || 'LKS Baru'}</h3><p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Kelola data lembaga</p></div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleSave} className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase shadow-xl active:scale-95 transition-all"><Save size={18} /> Simpan</button>
                <button onClick={() => { setIsEditing(false); setSelectedLks(null); }} className="p-3 hover:bg-slate-100 rounded-2xl transition-all"><X size={24} className="text-slate-400" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-12 space-y-20 pb-24 no-scrollbar">
              <div className="space-y-8"><h4 className="text-sm font-black text-blue-600 uppercase flex items-center gap-2 border-b-2 border-blue-100 pb-2"><Info size={16} /> I. Identitas & Domisili</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="lg:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase">Nama LKS</label><input type="text" value={selectedLks.nama} onChange={e => handleChange('nama', e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 border rounded-2xl font-bold" /></div>
                  <div><label className="text-[10px] font-black text-slate-400 uppercase">Kecamatan</label><select value={selectedLks.kecamatan} onChange={e => handleChange('kecamatan', e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 border rounded-2xl font-bold">{KECAMATAN_BLORA.map(k => <option key={k} value={k}>{k}</option>)}</select></div>
                  <div><label className="text-[10px] font-black text-slate-400 uppercase">Desa/Kelurahan</label><input type="text" value={selectedLks.desa} onChange={e => handleChange('desa', e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 border rounded-2xl font-bold" /></div>
                  <div className="lg:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase">Alamat</label><input type="text" value={selectedLks.alamat} onChange={e => handleChange('alamat', e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 border rounded-2xl" /></div>
                  <div><label className="text-[10px] font-black text-slate-400 uppercase">Telp Ketua</label><input type="text" value={selectedLks.telpKetua} onChange={e => handleChange('telpKetua', e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 border rounded-2xl font-bold" /></div>
                </div>
              </div>
              {/* V. Riwayat Bantuan */}
              <div className="space-y-8"><div className="flex items-center justify-between border-b-2 border-slate-100 pb-2"><h4 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2"><DollarSign size={16} className="text-emerald-600" /> V. Riwayat Bantuan</h4><button onClick={() => handleChange('riwayatBantuan', [...selectedLks.riwayatBantuan, { id: Math.random().toString(36).substr(2, 9), tahun: '2025', jenis: '', sumber: '', nominal: 0, keterangan: '' }])} className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-5 py-2.5 rounded-xl flex items-center gap-2">+ Baris Baru</button></div>
                <div className="border rounded-[2.5rem] overflow-hidden"><table className="w-full text-left text-sm"><thead className="bg-slate-900 text-white"><tr><th className="px-6 py-4">Tahun</th><th className="px-6 py-4">Program</th><th className="px-6 py-4">Nominal</th><th className="px-6 py-4 text-center">Aksi</th></tr></thead><tbody className="divide-y">{selectedLks.riwayatBantuan.map((b, idx) => (<tr key={b.id}>
                  <td className="px-6 py-3"><input type="text" value={b.tahun} onChange={e => { const n = [...selectedLks.riwayatBantuan]; n[idx].tahun = e.target.value; handleChange('riwayatBantuan', n); }} className="w-20 p-2.5 bg-slate-50 border rounded-lg text-xs font-bold" /></td>
                  <td className="px-6 py-3"><input type="text" value={b.jenis} onChange={e => { const n = [...selectedLks.riwayatBantuan]; n[idx].jenis = e.target.value; handleChange('riwayatBantuan', n); }} className="w-full p-2.5 bg-slate-50 border rounded-lg text-xs" /></td>
                  <td className="px-6 py-3"><input type="number" value={b.nominal} onChange={e => { const n = [...selectedLks.riwayatBantuan]; n[idx].nominal = Number(e.target.value); handleChange('riwayatBantuan', n); }} className="w-full p-2.5 bg-slate-50 border rounded-lg text-xs font-black" /></td>
                  <td className="px-6 py-3 text-center"><button onClick={() => handleChange('riwayatBantuan', selectedLks.riwayatBantuan.filter(item => item.id !== b.id))} className="text-red-400 hover:text-red-600"><Trash2 size={18}/></button></td>
                </tr>))}</tbody></table></div>
              </div>
              <div className="space-y-8 bg-slate-900 p-10 rounded-[3.5rem] text-white"><h4 className="text-sm font-black uppercase flex items-center gap-3"><MapIcon size={20} className="text-blue-400" /> VII. Koordinat Peta</h4><div className="relative h-[450px] rounded-[2.5rem] overflow-hidden"><div ref={mapContainerRef} className="w-full h-full z-10"></div></div></div>
            </div>
          </div>
        </div>
      )}

      {reportLks && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setReportLks(null)}></div>
          <div className="relative bg-white w-full max-w-5xl h-[95vh] rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
             <div className="p-8 border-b flex items-center justify-between bg-white no-print">
                <div className="flex items-center gap-4"><div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><FileBarChart size={24}/></div><div><h3 className="font-black text-xl text-slate-800">Pratinjau Raport LKS</h3><p className="text-[10px] text-slate-400 font-bold uppercase">Verifikasi Indikator</p></div></div>
                <div className="flex gap-3"><button onClick={handleDownloadRaportPDF} disabled={isGenerating} className="flex items-center gap-2 bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase shadow-xl">{isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Printer size={18} />} UNDUH PDF</button><button onClick={() => setReportLks(null)} className="p-3 bg-white border rounded-2xl hover:bg-slate-100 transition-all"><X size={24} className="text-slate-400"/></button></div>
             </div>
             <div id="printable-raport" className="flex-1 overflow-y-auto p-12 md:p-16 arial-force bg-white text-black">
                <div className="text-center border-b-4 border-double border-black pb-8 mb-10 flex items-center gap-8 arial-force">
                   <img src={usedLogo} alt="Logo" className="h-24 max-w-[120px] object-contain" />
                   <div className="flex-1 text-center arial-force">
                      <h1 className="text-xl font-bold uppercase arial-force">PEMERINTAH KABUPATEN BLORA</h1>
                      <h2 className="text-2xl font-black uppercase arial-force leading-tight">DINAS SOSIAL PEMBERDAYAAN PEREMPUAN DAN PERLINDUNGAN ANAK</h2>
                      <p className="text-[10pt] mt-1 arial-force">Jl. Pemuda No.16 A Blora 58215, Telp: (0296) 5298541</p>
                   </div>
                </div>
                <div className="space-y-10 arial-force">
                   <div className="text-center space-y-2 arial-force"><h3 className="text-2xl font-black uppercase underline arial-force">PROFIL LENGKAP LEMBAGA KESEJAHTERAAN SOSIAL</h3><p className="text-[11pt] font-bold arial-force">STATUS: {reportLks.statusAktif.toUpperCase()}</p></div>
                   <div className="space-y-4 arial-force"><p className="font-bold border-l-4 border-black pl-3 uppercase text-sm arial-force bg-slate-100 py-1">I. IDENTITAS UMUM & DOMISILI</p>
                      <table className="w-full text-[11pt] arial-force"><tbody><tr className="arial-force"><td className="w-48 font-bold arial-force">Nama Lembaga</td><td className="w-4 arial-force">:</td><td className="arial-force font-bold">{reportLks.nama}</td></tr><tr className="arial-force"><td className="font-bold arial-force">Alamat Lengkap</td><td className="arial-force">:</td><td className="arial-force">{reportLks.alamat}</td></tr></tbody></table>
                   </div>
                   <div className="space-y-4 arial-force"><p className="font-bold border-l-4 border-black pl-3 uppercase text-sm arial-force bg-slate-100 py-1">II. STRUKTUR PENGURUS</p>
                      <table className="w-full text-[10pt] border border-black arial-force"><thead><tr className="bg-slate-200 arial-force"><th className="border border-black p-2 arial-force">Jabatan</th><th className="border border-black p-2 arial-force">Nama Lengkap</th></tr></thead><tbody><tr className="arial-force"><td className="border border-black p-2 font-bold arial-force text-center">Ketua</td><td className="border border-black p-2 arial-force">{reportLks.pengurus.ketua.nama}</td></tr></tbody></table>
                   </div>
                </div>
                <div className="mt-16 flex justify-between arial-force">
                      <div className="text-center w-64 arial-force"><p className="text-[10pt] arial-force">Mengetahui,</p><p className="font-bold text-[10pt] arial-force mt-1">Ketua {reportLks.nama}</p><div className="h-24"></div><p className="font-bold underline text-[10pt] arial-force">{reportLks.pengurus.ketua.nama}</p></div>
                      <div className="text-center w-64 arial-force"><p className="text-[10pt] arial-force">Blora, {new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p><p className="font-bold text-[10pt] arial-force mt-1">Petugas Verifikator Dinsos,</p><div className="h-24"></div><p className="font-bold underline text-[10pt] arial-force">( ........................................ )</p></div>
                </div>
             </div>
          </div>
        </div>
      )}
      <style>{`.arial-force { font-family: Arial, sans-serif !important; }`}</style>
    </div>
  );
};

export default LKSList;
