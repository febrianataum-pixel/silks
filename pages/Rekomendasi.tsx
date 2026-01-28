
import React, { useState, useRef, useEffect } from 'react';
import { Plus, FileText, Printer, Save, Trash2, Calendar, Upload, ArrowLeft, Bold, Italic, AlignLeft, AlignCenter, Search, Mail, MapPin, User, Hash, X, ImageIcon, RefreshCw, HelpCircle } from 'lucide-react';
import { LKS, LetterRecord } from '../types';

interface RekomendasiPageProps {
  lksData: LKS[];
}

const RekomendasiPage: React.FC<RekomendasiPageProps> = ({ lksData }) => {
  const [letters, setLetters] = useState<LetterRecord[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  
  const defaultLogo = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Coat_of_arms_of_Blora_Regency.svg/1200px-Coat_of_arms_of_Blora_Regency.svg.png";

  const [formData, setFormData] = useState({
    nomorSurat: '460/         /VIII/2024',
    tanggalSurat: new Date().toISOString().split('T')[0],
    lksId: '',
    perihal: 'Rekomendasi Perpanjangan Tanda Daftar LKS',
    recipientName: 'Kepala Dinas Sosial Provinsi Jawa Tengah',
    recipientLocation: 'SEMARANG',
    penandatanganJabatan: 'Kepala Dinas Sosial Pemberdayaan Perempuan dan Perlindungan Anak',
    namaPenandatangan: 'Drs. H. NAMA KEPALA DINAS, M.Si',
    nipPenandatangan: '19700101 199001 1 001',
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
        editorRef.current.innerHTML = `
          <p>Dengan hormat,</p>
          <p><br></p>
          <p>Berdasarkan hasil verifikasi lapangan dan tinjauan administratif terhadap kelayakan operasional lembaga, maka dengan ini Dinas Sosial Pemberdayaan Perempuan dan Perlindungan Anak Kabupaten Blora memberikan rekomendasi kepada:</p>
          <p><br></p>
          <p style="margin-left: 40px;"><b>Nama Lembaga : ${selectedLks.nama}</b></p>
          <p style="margin-left: 40px;"><b>Alamat : ${selectedLks.alamat}, Desa ${selectedLks.desa}, Kec. ${selectedLks.kecamatan}</b></p>
          <p style="margin-left: 40px;"><b>Jenis Layanan : ${selectedLks.jenisBantuan}</b></p>
          <p><br></p>
          <p>Bahwa lembaga tersebut di atas telah melaksanakan berbagai kegiatan sosial nyata secara berkesinambungan, di antaranya: <i>${selectedLks.kegiatanSosial || 'Pemberian santunan dan pendampingan warga binaan secara rutin'}</i>.</p>
          <p><br></p>
          <p>Memperhatikan dedikasi dan kontribusi nyata dalam bidang kesejahteraan sosial tersebut, maka Dinas Sosial merekomendasikan yang bersangkutan untuk dapat melanjutkan kegiatan pelayanan kesejahteraan sosial sesuai dengan lingkup kerja yang telah ditetapkan.</p>
          <p><br></p>
          <p>Demikian surat rekomendasi ini dibuat untuk dapat dipergunakan sebagaimana mestinya.</p>
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
              <p className="text-slate-400 max-w-xl text-lg font-medium">Manajemen pembuatan surat rekomendasi resmi dengan format Arial A4.</p>
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
              <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/20 active:scale-95 transition-all flex items-center gap-2">
                <Printer size={18} /> Cetak PDF A4
              </button>
              <button onClick={handleSave} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all">
                SIMPAN ARSIP
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* INPUT PANEL */}
            <div className="space-y-4 no-print">
               <div className="bg-white p-6 rounded-[2.5rem] border shadow-sm space-y-6 max-h-[80vh] overflow-y-auto no-scrollbar">
                  
                  {/* LOGO UPLOAD SECTION */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest border-b pb-2">Logo Kop Surat</h4>
                    <div className="flex flex-col items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                       <div className="w-20 h-24 bg-white rounded-lg shadow-sm border p-2 flex items-center justify-center overflow-hidden">
                          <img src={formData.letterLogo} alt="Logo" className="max-h-full max-w-full object-contain" />
                       </div>
                       <div className="flex gap-2 w-full">
                          <button 
                            onClick={() => logoInputRef.current?.click()}
                            className="flex-1 py-2 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2"
                          >
                             <Upload size={14} /> Ganti Logo
                          </button>
                          <button 
                            onClick={() => setFormData({ ...formData, letterLogo: defaultLogo })}
                            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-red-500 transition-all"
                            title="Reset Logo"
                          >
                             <RefreshCw size={14} />
                          </button>
                       </div>
                       <input type="file" ref={logoInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b pb-2">Informasi Surat</h4>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Pilih Lembaga (LKS)</label>
                      <select className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-xs" value={formData.lksId} onChange={e=>setFormData({...formData, lksId: e.target.value})}>
                         <option value="">-- Pilih Lembaga --</option>
                         {lksData.map(l => <option key={l.id} value={l.id}>{l.nama}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Nomor Surat</label>
                      <input type="text" className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-bold" placeholder="Contoh: 460/123/VIII/2024" value={formData.nomorSurat} onChange={e=>setFormData({...formData, nomorSurat: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Tanggal Surat</label>
                      <input type="date" className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-bold" value={formData.tanggalSurat} onChange={e=>setFormData({...formData, tanggalSurat: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Perihal</label>
                      <textarea className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-bold h-20" value={formData.perihal} onChange={e=>setFormData({...formData, perihal: e.target.value})} />
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b pb-2">Alamat Tujuan (Yth)</h4>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Kepada Yth.</label>
                      <input type="text" className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-bold" value={formData.recipientName} onChange={e=>setFormData({...formData, recipientName: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Di (Kota/Tempat)</label>
                      <input type="text" className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-bold" value={formData.recipientLocation} onChange={e=>setFormData({...formData, recipientLocation: e.target.value})} />
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest border-b pb-2">Penandatangan</h4>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Nama Kadis</label>
                      <input type="text" className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-bold" value={formData.namaPenandatangan} onChange={e=>setFormData({...formData, namaPenandatangan: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1">NIP Kadis</label>
                      <input type="text" className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-bold" value={formData.nipPenandatangan} onChange={e=>setFormData({...formData, nipPenandatangan: e.target.value})} />
                    </div>
                  </div>
               </div>
               
               <div className="bg-slate-900 p-4 rounded-3xl flex justify-center gap-4">
                  <button onClick={()=>handleCommand('bold')} className="text-white p-2.5 hover:bg-white/10 rounded-xl transition-all"><Bold size={20}/></button>
                  <button onClick={()=>handleCommand('italic')} className="text-white p-2.5 hover:bg-white/10 rounded-xl transition-all"><Italic size={20}/></button>
                  <button onClick={()=>handleCommand('justifyCenter')} className="text-white p-2.5 hover:bg-white/10 rounded-xl transition-all"><AlignCenter size={20}/></button>
                  <button onClick={()=>handleCommand('justifyLeft')} className="text-white p-2.5 hover:bg-white/10 rounded-xl transition-all"><AlignLeft size={20}/></button>
               </div>

               <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3">
                  <HelpCircle className="text-blue-600 shrink-0 mt-0.5" size={16} />
                  <p className="text-[10px] text-blue-700 font-medium leading-relaxed">
                    <b>TIPS PDF:</b> Setelah klik tombol cetak, pilih tujuan <b>"Save as PDF"</b> di jendela yang muncul untuk menyimpan surat ke komputer Anda.
                  </p>
               </div>
            </div>

            {/* A4 PORTRAIT SURFACE */}
            <div className="lg:col-span-3">
              <div id="print-letter-surface" className="bg-white min-h-[1100px] shadow-2xl p-[2.5cm_2cm] no-print-shadow print:shadow-none print:p-0">
                 {/* Standard Kop Resmi Blora */}
                 <div className="flex items-center gap-8 border-b-4 border-double border-black pb-4 mb-10 text-center justify-center print:border-black">
                    <div className="w-[2cm] flex items-center justify-center">
                      <img src={formData.letterLogo} className="max-h-24 max-w-full print:block" alt="Logo Instansi" />
                    </div>
                    <div className="flex-1">
                      <h1 className="text-lg font-bold uppercase leading-tight text-black kop-font">PEMERINTAH KABUPATEN BLORA</h1>
                      <h2 className="text-xl font-black uppercase leading-tight text-black kop-font">DINAS SOSIAL PEMBERDAYAAN PEREMPUAN</h2>
                      <h2 className="text-xl font-black uppercase leading-tight text-black kop-font">DAN PERLINDUNGAN ANAK</h2>
                      <p className="text-[9px] font-medium mt-1 text-black kop-font">Jl. Pemuda No.16 A Blora 58215, No. Tlp: (0296) 5298541</p>
                      <p className="text-[9px] font-medium text-black kop-font">Website : dinsos.blorakab.go.id / E-mail : dinsosp3a.bla.com</p>
                    </div>
                 </div>

                 <div className="text-[12pt] space-y-6 leading-normal text-black printable-content">
                    {/* Header Info Block */}
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <div className="grid grid-cols-[80px_10px_1fr] gap-x-2">
                          <span>Nomor</span><span>:</span><span>{formData.nomorSurat}</span>
                          <span>Sifat</span><span>:</span><span>Penting</span>
                          <span>Lampiran</span><span>:</span><span>-</span>
                          <span>Hal</span><span>:</span><span className="font-bold underline uppercase">{formData.perihal}</span>
                        </div>
                      </div>
                      <div className="text-right">Blora, {formatDate(formData.tanggalSurat)}</div>
                    </div>

                    {/* Recipient Block */}
                    <div className="pt-4 space-y-1">
                      <p>Kepada Yth.</p>
                      <p className="font-bold">{formData.recipientName}</p>
                      <p>Di -</p>
                      <p className="ml-8 font-bold text-black uppercase">{formData.recipientLocation}</p>
                    </div>

                    {/* Body Block */}
                    <div ref={editorRef} contentEditable className="pt-6 min-h-[400px] outline-none text-justify whitespace-pre-wrap leading-relaxed letter-body print:min-h-0" />

                    {/* Signature Block */}
                    <div className="flex justify-end pt-12">
                      <div className="text-center w-[300px] space-y-1">
                        <p className="font-bold uppercase leading-tight text-black">{formData.penandatanganJabatan}</p>
                        <p className="font-bold uppercase leading-tight text-black">Kabupaten Blora,</p>
                        <div className="h-24 print:h-20"></div>
                        <p className="font-black border-b border-black inline-block uppercase text-black">{formData.namaPenandatangan}</p>
                        <p className="text-[11pt] font-medium mt-1 text-black">NIP. {formData.nipPenandatangan}</p>
                      </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .kop-font { font-family: 'Arial', sans-serif !important; }
        .printable-content { font-family: 'Arial', sans-serif !important; }
        .letter-body { font-family: 'Arial', sans-serif !important; }
        .letter-body p { margin-bottom: 0.5rem; }
        
        @media screen {
            #print-letter-surface { font-family: 'Arial', sans-serif; }
        }

        @media print {
          /* Matikan semua elemen visual selain surface */
          .no-print { display: none !important; }
          header, aside, main > header, nav, .lg\\:hidden, button { display: none !important; }
          
          body { 
            background: white !important; 
            margin: 0 !important; 
            padding: 0 !important; 
          }

          /* Hilangkan wrapper utama Tailwind */
          .flex-1.overflow-y-auto, .max-w-7xl, .space-y-6, .animate-in { 
             display: block !important; 
             padding: 0 !important; 
             margin: 0 !important; 
             overflow: visible !important;
          }

          .grid { display: block !important; }
          .lg\\:col-span-3 { width: 100% !important; margin: 0 !important; }

          /* Tampilkan Surface di paling atas */
          #print-letter-surface { 
            position: absolute !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 100% !important; 
            background: white !important; 
            display: block !important;
            padding: 2.5cm 2cm 2.5cm 3cm !important; 
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            font-family: 'Arial', sans-serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Hilangkan semua elemen no-print */
          .no-print, .print\\:hidden { display: none !important; }
          
          @page { size: A4 portrait; margin: 0; }
        }
      `}</style>
    </div>
  );
};

export default RekomendasiPage;
