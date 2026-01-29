
import React, { useState, useRef, useEffect } from 'react';
import { Plus, FileText, Printer, Save, Trash2, Calendar, Upload, ArrowLeft, Bold, Italic, AlignLeft, AlignCenter, Search, Mail, MapPin, User, Hash, X, ImageIcon, RefreshCw, HelpCircle, Loader2, List, Type, Underline } from 'lucide-react';
import { LKS, LetterRecord } from '../types';

declare const html2pdf: any;

interface RekomendasiPageProps {
  lksData: LKS[];
}

const RekomendasiPage: React.FC<RekomendasiPageProps> = ({ lksData }) => {
  const [letters, setLetters] = useState<LetterRecord[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const defaultLogo = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Coat_of_arms_of_Blora_Regency.svg/1200px-Coat_of_arms_of_Blora_Regency.svg.png";

  const [formData, setFormData] = useState({
    nomorSurat: '400.9/         /2025',
    tanggalSurat: new Date().toISOString().split('T')[0],
    lksId: '',
    perihal: 'Rekomendasi',
    lampiran: 'Proposal',
    recipientName: 'Kepala Dinas Sosial Provinsi Jawa Tengah',
    recipientLocation: 'Semarang',
    penandatanganJabatan: 'Kepala Dinas Sosial Pemberdayaan Perempuan dan Perlindungan Anak Kabupaten Blora',
    namaPenandatangan: 'LULUK KUSUMA AGUNG ARIADI, AP',
    pangkatPenandatangan: 'Pembina Utama Muda',
    nipPenandatangan: '19760817 199511 1 003',
    letterLogo: defaultLogo
  });
  
  const editorRef = useRef<HTMLDivElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData({ ...formData, letterLogo: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (formData.lksId && editorRef.current) {
      const selectedLks = lksData.find(l => l.id === formData.lksId);
      if (selectedLks) {
        // Redaksi sesuai screenshot dengan variabel fleksibel
        editorRef.current.innerHTML = `
          <div style="margin-bottom: 12px;">
            <p>Yth.: ${formData.recipientName}</p>
            <p>di</p>
            <p style="text-indent: 40px;"><u>${formData.recipientLocation}</u></p>
          </div>
          <br/>
          <p style="text-indent: 40px; text-align: justify;">Berdasarkan surat dari "${selectedLks.nama}" Nomor : [Nomor_Surat_LKS] tanggal [Tgl_Surat_LKS] perihal Permohonan Surat Rekomendasi Bantuan SOSH Tahun 2026 Dinas Sosial Provinsi Jawa Tengah, dengan ini kami sampaikan hal-hal sebagai berikut :</p>
          <ol style="margin-left: 40px; text-align: justify;">
            <li>Bahwa "${selectedLks.nama}" yang beralamat di ${selectedLks.alamat}, Desa ${selectedLks.desa}, Kec. ${selectedLks.kecamatan} merupakan organisasi sosial terdaftar sebagai Lembaga Kesejahteraan Sosial yang ada di Dinas Sosial Pemberdayaan Perempuan dan Perlindungan Anak Kabupaten Blora dengan status telah terakreditasi dan atau reakreditasi.</li>
            <li>Kegiatan sosial yang telah dilaksanakan adalah bergerak dalam bidang penanganan masalah sosial, yaitu ${selectedLks.jenisBantuan}.</li>
            <li>Dari hasil verifikasi dan validasi data oleh petugas bahwa benar keberadaannya dalam pelayanan sosial dan layak diusulkan untuk mendapatkan dukungan melalui bantuan sosial.</li>
          </ol>
          <p style="text-align: justify;">Sehubungan dengan pertimbangan diatas, maka kami <b>merekomendasikan "${selectedLks.nama}" tersebut untuk diusulkan mendapatkan bantuan SOSH dari Dinas Sosial Provinsi Jawa Tengah tahun 2026.</b></p>
          <p style="text-align: justify;">Demikian rekomendasi ini kami buat, atas perhatian dan terkabulnya disampaikan terima kasih.</p>
        `;
      }
    }
  }, [formData.lksId, lksData]);

  const handleSave = () => {
    if (!formData.lksId) return alert('Silakan pilih LKS dahulu');
    const newLetter: LetterRecord = { 
      id: Math.random().toString(36).substr(2, 9), 
      ...formData, 
      tanggal: new Date(formData.tanggalSurat).toISOString(), 
      konten: editorRef.current?.innerHTML || '' 
    } as any;
    setLetters([newLetter, ...letters]);
    setIsCreating(false);
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('print-letter-surface');
    if (!element) return;

    setIsGenerating(true);
    const options = {
      margin: 5,
      filename: `Rekomendasi_${formData.nomorSurat.replace(/\//g, '-')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      await html2pdf().set(options).from(element).save();
    } catch (err) {
      alert('Gagal mengunduh PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {!isCreating ? (
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 no-print">
            <div className="relative z-10">
              <h2 className="text-3xl font-black mb-3">Arsip Rekomendasi</h2>
              <p className="text-slate-400 max-w-xl text-lg font-medium">Manajemen pembuatan surat rekomendasi resmi Dinsos Blora.</p>
            </div>
            <button onClick={() => setIsCreating(true)} className="relative z-10 bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all flex items-center gap-2">
              <Plus size={20} /> BUAT SURAT BARU
            </button>
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 no-print">
            {letters.map(l => (
              <div key={l.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all"><FileText size={24} /></div>
                  <button onClick={() => setLetters(letters.filter(item => item.id !== l.id))} className="p-2 text-slate-200 hover:text-red-600 transition-all"><Trash2 size={20} /></button>
                </div>
                <h3 className="font-black text-slate-800 mb-2 truncate">{l.nomorSurat}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5 mb-4">
                  <Calendar size={14} className="text-blue-500" /> {formatDate(l.tanggalSurat)}
                </p>
                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                   <p className="text-[10px] font-black text-slate-600 uppercase tracking-tight truncate max-w-[150px]">LKS: {lksData.find(item => item.id === l.lksId)?.nama}</p>
                   <button className="text-[9px] font-black text-blue-600 uppercase hover:underline">Lihat Detail</button>
                </div>
              </div>
            ))}
            {letters.length === 0 && (
              <div className="col-span-full py-32 text-center text-slate-300 font-bold border-4 border-dashed rounded-[3rem] bg-white/50 flex flex-col items-center justify-center">
                 <Mail size={48} className="mb-4 opacity-20" />
                 <p className="uppercase tracking-[0.2em] text-xs">Belum ada arsip surat rekomendasi.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between no-print">
            <button onClick={() => setIsCreating(false)} className="flex items-center gap-3 px-5 py-2.5 bg-white border border-slate-200 rounded-2xl text-slate-500 font-black text-xs uppercase tracking-widest hover:text-blue-600 hover:bg-blue-50 transition-all">
              <ArrowLeft size={18} /> Kembali
            </button>
            <div className="flex gap-3">
              <button 
                onClick={handleDownloadPDF} 
                disabled={isGenerating}
                className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Printer size={18} />}
                {isGenerating ? 'MENYIAPKAN...' : 'UNDUH PDF A4'}
              </button>
              <button onClick={handleSave} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all">
                SIMPAN ARSIP
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* INPUT PANEL */}
            <div className="space-y-4 no-print h-fit sticky top-24">
               <div className="bg-white p-6 rounded-[2.5rem] border shadow-sm space-y-6 max-h-[75vh] overflow-y-auto no-scrollbar">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b pb-2">Data Lembaga & Surat</h4>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Lembaga (LKS)</label>
                      <select className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-xs" value={formData.lksId} onChange={e=>setFormData({...formData, lksId: e.target.value})}>
                         <option value="">-- Pilih Lembaga --</option>
                         {lksData.map(l => <option key={l.id} value={l.id}>{l.nama}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Nomor Surat</label>
                      <input type="text" className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-bold" value={formData.nomorSurat} onChange={e=>setFormData({...formData, nomorSurat: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Lampiran</label>
                      <input type="text" className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-bold" value={formData.lampiran} onChange={e=>setFormData({...formData, lampiran: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Tanggal Surat</label>
                      <input type="date" className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-bold" value={formData.tanggalSurat} onChange={e=>setFormData({...formData, tanggalSurat: e.target.value})} />
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest border-b pb-2">Penandatangan</h4>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Nama Pejabat</label>
                      <input type="text" className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-bold" value={formData.namaPenandatangan} onChange={e=>setFormData({...formData, namaPenandatangan: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Pangkat/Gol</label>
                      <input type="text" className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-bold" value={formData.pangkatPenandatangan} onChange={e=>setFormData({...formData, pangkatPenandatangan: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1">NIP</label>
                      <input type="text" className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-bold" value={formData.nipPenandatangan} onChange={e=>setFormData({...formData, nipPenandatangan: e.target.value})} />
                    </div>
                  </div>
               </div>
               
               <div className="bg-slate-900 p-4 rounded-3xl grid grid-cols-4 gap-2">
                  <button onClick={()=>handleCommand('bold')} className="text-white p-2 hover:bg-white/10 rounded-xl transition-all flex justify-center" title="Bold"><Bold size={18}/></button>
                  <button onClick={()=>handleCommand('italic')} className="text-white p-2 hover:bg-white/10 rounded-xl transition-all flex justify-center" title="Italic"><Italic size={18}/></button>
                  <button onClick={()=>handleCommand('underline')} className="text-white p-2 hover:bg-white/10 rounded-xl transition-all flex justify-center" title="Underline"><Underline size={18}/></button>
                  <button onClick={()=>handleCommand('justifyLeft')} className="text-white p-2 hover:bg-white/10 rounded-xl transition-all flex justify-center" title="Align Left"><AlignLeft size={18}/></button>
                  <button onClick={()=>handleCommand('justifyCenter')} className="text-white p-2 hover:bg-white/10 rounded-xl transition-all flex justify-center" title="Align Center"><AlignCenter size={18}/></button>
                  <button onClick={()=>handleCommand('insertUnorderedList')} className="text-white p-2 hover:bg-white/10 rounded-xl transition-all flex justify-center" title="List"><List size={18}/></button>
                  <button onClick={()=>handleCommand('fontSize', '4')} className="text-white p-2 hover:bg-white/10 rounded-xl transition-all flex justify-center" title="Big"><Type size={18}/></button>
               </div>
            </div>

            {/* A4 PORTRAIT SURFACE */}
            <div className="lg:col-span-3">
              <div id="print-letter-surface" className="bg-white min-h-[1100px] shadow-2xl p-[1cm_1.5cm] arial-force border border-slate-100 relative">
                 {/* Standard Kop Resmi Blora */}
                 <div className="flex items-center gap-8 border-b-4 border-double border-black pb-2 mb-4 text-center justify-center arial-force">
                    <div className="w-[1.8cm] flex items-center justify-center">
                      <img src={formData.letterLogo} className="max-h-24 max-w-full" alt="Logo" />
                    </div>
                    <div className="flex-1 arial-force text-black">
                      <h1 className="text-lg font-bold uppercase leading-tight arial-force">PEMERINTAH KABUPATEN BLORA</h1>
                      <h2 className="text-xl font-black uppercase leading-tight arial-force">DINAS SOSIAL PEMBERDAYAAN PEREMPUAN</h2>
                      <h2 className="text-xl font-black uppercase leading-tight arial-force">DAN PERLINDUNGAN ANAK</h2>
                      <p className="text-[8.5pt] font-medium mt-0.5 arial-force">Jl. Pemuda No.16 A Blora 58215, No. Tlp: (0296) 5298541</p>
                      <p className="text-[8.5pt] font-medium arial-force">Website : dinsos.blorakab.go.id / E-mail : dinsosp3a.bla.com</p>
                    </div>
                 </div>

                 <div className="text-[11.5pt] leading-tight text-black printable-content arial-force">
                    {/* Header Info & Date Block */}
                    <div className="flex justify-between items-start arial-force mb-4 relative">
                      <div className="space-y-0.5 arial-force">
                        <div className="grid grid-cols-[80px_10px_1fr] gap-x-1 arial-force">
                          <span className="arial-force">Nomor</span><span className="arial-force">:</span><span className="arial-force">{formData.nomorSurat}</span>
                          <span className="arial-force">Lampiran</span><span className="arial-force">:</span><span className="arial-force">{formData.lampiran}</span>
                          <span className="arial-force self-start">Hal</span><span className="arial-force self-start">:</span><span className="font-bold underline arial-force uppercase tracking-tight">{formData.perihal}</span>
                        </div>
                      </div>
                      <div className="text-right arial-force whitespace-nowrap absolute right-0 top-0">
                        <span className="arial-force">Blora, {formatDate(formData.tanggalSurat)}</span>
                      </div>
                    </div>

                    {/* FULLY EDITABLE FLEXIBLE CONTENT AREA */}
                    <div 
                      ref={editorRef} 
                      contentEditable 
                      className="min-h-[600px] outline-none text-justify whitespace-pre-wrap leading-relaxed letter-body arial-force p-0" 
                    />

                    {/* Signature Block */}
                    <div className="flex justify-end pt-4 arial-force">
                      <div className="text-left w-[350px] space-y-0 arial-force">
                        <p className="font-normal leading-tight arial-force">{formData.penandatanganJabatan}</p>
                        <div className="h-20"></div>
                        <p className="font-bold border-b border-black inline-block uppercase arial-force tracking-tighter">{formData.namaPenandatangan}</p>
                        <p className="text-[11pt] font-normal leading-tight arial-force">{formData.pangkatPenandatangan}</p>
                        <p className="text-[11pt] font-normal leading-tight arial-force">NIP. {formData.nipPenandatangan}</p>
                      </div>
                    </div>

                    {/* Tembusan Block */}
                    <div className="mt-8 text-[10pt] arial-force border-t pt-2 w-fit">
                      <p className="font-bold underline arial-force mb-1">Tembusan : <span className="font-normal no-underline">Kepada Yth.</span></p>
                      <ol className="list-decimal ml-4 arial-force">
                        <li className="arial-force">Bupati Blora ( sebagai laporan );</li>
                        <li className="arial-force">Arsip.</li>
                      </ol>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .arial-force { font-family: Arial, Helvetica, sans-serif !important; }
        .letter-body p { margin-bottom: 0.5rem; }
        .letter-body ol, .letter-body ul { margin-top: 0.5rem; margin-bottom: 0.5rem; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        
        /* Simulating the Paraf block at very bottom if needed */
        @media print {
          #print-letter-surface { border: none !important; box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
};

export default RekomendasiPage;
