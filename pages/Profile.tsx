
import React, { useState, useRef, useEffect } from 'react';
import { User, Shield, Trash2, UserPlus, Settings, Save, Image as ImageIcon, Camera, AlertTriangle, RefreshCw, Download, Upload, Share2, Cloud, ShieldCheck, CheckCircle2, Info, Loader2, UploadCloud, Globe } from 'lucide-react';
import { UserAccount } from '../types';

interface ProfileProps {
  currentUser: UserAccount;
  allUsers: UserAccount[];
  setAllUsers: React.Dispatch<React.SetStateAction<UserAccount[]>>;
  onUpdateCurrentUser: (user: UserAccount) => void;
  appName: string;
  setAppName: (name: string) => void;
  appLogo: string | null;
  setAppLogo: (logo: string | null) => void;
  cloudConfig: {apiKey: string, projectId: string} | null;
  setCloudConfig: (config: {apiKey: string, projectId: string} | null) => void;
  forcePush?: () => void;
  isGoogleConnected: boolean;
}

const Profile: React.FC<ProfileProps> = ({ 
  currentUser, 
  allUsers, 
  setAllUsers, 
  onUpdateCurrentUser,
  appName,
  setAppName,
  appLogo,
  setAppLogo,
  cloudConfig,
  setCloudConfig,
  forcePush,
  isGoogleConnected
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'admin' | 'system' | 'data'>('profile');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  
  const [editNama, setEditNama] = useState(currentUser.nama);
  const [newPassword, setNewPassword] = useState('');
  
  const [firebaseApiKey, setFirebaseApiKey] = useState(cloudConfig?.apiKey || '');
  const [firebaseProjectId, setFirebaseProjectId] = useState(cloudConfig?.projectId || '');
  
  const [tempAppName, setTempAppName] = useState(appName);
  const [newUser, setNewUser] = useState({ username: '', password: '', nama: '', role: 'User' as any });

  const compressImage = (file: File, maxSize: number): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > height) { if (width > maxSize) { height *= maxSize / width; width = maxSize; } }
          else { if (height > maxSize) { width *= maxSize / height; height = maxSize; } }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.5));
        };
      };
    });
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    const updatedUser = { ...currentUser, nama: editNama };
    if (newPassword) updatedUser.password = newPassword;
    setAllUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    onUpdateCurrentUser(updatedUser);
    setNewPassword('');
    setTimeout(() => { setIsProcessing(false); alert('Profil diperbarui.'); }, 800);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessingImage(true);
      const base64 = await compressImage(file, 128);
      const updatedUser = { ...currentUser, avatar: base64 };
      setAllUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
      onUpdateCurrentUser(updatedUser);
      setIsProcessingImage(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessingImage(true);
      const base64 = await compressImage(file, 300);
      setAppLogo(base64);
      setIsProcessingImage(false);
    }
  };

  const handleActivateCloudSync = () => {
    if (!firebaseApiKey || !firebaseProjectId) return alert('Lengkapi konfigurasi.');
    setCloudConfig({ apiKey: firebaseApiKey, projectId: firebaseProjectId });
    alert('Sinkronisasi Cloud Aktif!');
  };

  const handleConnectGoogle = async () => {
    try {
      const response = await fetch('/api/auth/google/url');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Gagal mengambil URL autentikasi Google.");
      }
      
      window.open(data.url, 'google_auth', 'width=600,height=700');
    } catch (error: any) {
      alert(error.message || "Gagal mengambil URL autentikasi Google.");
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <div className="flex bg-white p-2 rounded-[2rem] border border-slate-100 shadow-sm w-fit overflow-x-auto no-scrollbar">
        <button onClick={() => setActiveTab('profile')} className={`px-8 py-3 rounded-2xl text-xs font-black uppercase transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'profile' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}><User size={16} /> Profil Saya</button>
        <button onClick={() => setActiveTab('data')} className={`px-8 py-3 rounded-2xl text-xs font-black uppercase transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'data' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}><Cloud size={16} /> Cloud Sync</button>
        {currentUser.role === 'Admin' && (
          <button onClick={() => setActiveTab('admin')} className={`px-8 py-3 rounded-2xl text-xs font-black uppercase transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'admin' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}><Shield size={16} /> Manajemen User</button>
        )}
      </div>

      {activeTab === 'profile' && (
        <div className="bg-white p-10 rounded-[3rem] border shadow-xl max-w-4xl">
           <div className="flex flex-col md:flex-row items-center gap-8 mb-10">
              <div className="relative group cursor-pointer">
                 <div className="w-32 h-32 bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-white overflow-hidden ring-8 ring-slate-50 relative">
                   {currentUser.avatar ? <img src={currentUser.avatar} className="w-full h-full object-cover" /> : <img src={`https://ui-avatars.com/api/?name=${currentUser.nama}&background=random&color=fff&size=256`} />}
                   <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera className="text-white" size={32} />
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                   </label>
                 </div>
              </div>
              <div className="text-center md:text-left">
                 <h2 className="text-3xl font-black text-slate-800">{currentUser.nama}</h2>
                 <p className="text-blue-600 font-bold uppercase text-[10px] tracking-widest mt-1">{currentUser.role}</p>
              </div>
           </div>
           <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Lengkap</label><input type="text" value={editNama} onChange={e => setEditNama(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold" /></div>
              <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ganti Password</label><input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Biarkan kosong" className="w-full px-5 py-4 bg-slate-50 border rounded-2xl" /></div>
              <div className="md:col-span-2 flex justify-end gap-3">
                <button type="submit" disabled={isProcessing} className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-3 active:scale-95 transition-all">
                   {isProcessing ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />} SIMPAN PERUBAHAN
                </button>
              </div>
           </form>
        </div>
      )}

      {activeTab === 'data' && (
        <div className="space-y-6">
          <div className="bg-[#0f172a] p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden border border-white/10">
            <div className="flex flex-col md:flex-row items-center gap-8 mb-12 relative z-10">
                <div className="w-20 h-20 bg-blue-600 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-500/20"><Cloud size={36} /></div>
                <div className="text-center md:text-left">
                  <h2 className="text-3xl font-black text-white tracking-tighter uppercase">HUBUNGAN <span className="text-blue-500">CLOUD REALTIME</span></h2>
                  <p className="text-slate-400 text-sm font-bold mt-1">Sinkronisasi data antar perangkat secara otomatis.</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                <div className="space-y-3"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">FIREBASE API KEY</label><input type="password" value={firebaseApiKey} onChange={e => setFirebaseApiKey(e.target.value)} className="w-full px-8 py-6 bg-white/5 border border-white/10 rounded-[1.8rem] outline-none font-bold text-white text-lg focus:border-blue-500/50 transition-all" /></div>
                <div className="space-y-3"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">PROJECT ID</label><input type="text" value={firebaseProjectId} onChange={e => setFirebaseProjectId(e.target.value)} className="w-full px-8 py-6 bg-white/5 border border-white/10 rounded-[1.8rem] outline-none font-bold text-white text-lg focus:border-blue-500/50 transition-all" /></div>
            </div>
            <div className="mt-12 flex flex-col md:flex-row justify-center md:justify-end gap-4 relative z-10">
                <button onClick={handleActivateCloudSync} className="bg-blue-600 hover:bg-blue-500 text-white px-12 py-5 rounded-[1.8rem] font-black text-sm uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center gap-4">
                  <ShieldCheck size={22} /> SIMPAN KONFIGURASI
                </button>
            </div>
          </div>
          
          {cloudConfig?.apiKey && (
            <div className="bg-white p-10 rounded-[3.5rem] border-2 border-dashed border-blue-100 flex flex-col md:flex-row items-center justify-between gap-6">
               <div className="flex items-center gap-6">
                 <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center shadow-inner"><UploadCloud size={32} /></div>
                 <div>
                   <h3 className="font-black text-slate-800 text-lg">Pukul Sinkronisasi Manual?</h3>
                   <p className="text-xs text-slate-400 font-medium">Klik tombol ini jika data di laptop lain belum terupdate.</p>
                 </div>
               </div>
               <button onClick={forcePush} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all flex items-center gap-3">
                 <RefreshCw size={18} /> FORCE PUSH TO CLOUD
               </button>
            </div>
          )}

          <div className="bg-white p-10 rounded-[3.5rem] border shadow-xl max-w-4xl mt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-inner ${isGoogleConnected ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-300'}`}>
                  <Globe size={32} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Google Drive Storage</h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {isGoogleConnected ? 'Terhubung. Berkas akan disimpan di Google Drive Anda.' : 'Belum Terhubung. Hubungkan untuk menyimpan PDF di Google Drive.'}
                  </p>
                </div>
              </div>
              <button 
                onClick={handleConnectGoogle} 
                className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all flex items-center gap-3 ${isGoogleConnected ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white hover:bg-slate-900'}`}
              >
                {isGoogleConnected ? <CheckCircle2 size={18} /> : <Share2 size={18} />}
                {isGoogleConnected ? 'TERHUBUNG' : 'HUBUNGKAN DRIVE'}
              </button>
            </div>
            {!isGoogleConnected && (
              <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
                <AlertTriangle className="text-amber-600 shrink-0" size={18} />
                <p className="text-[10px] text-amber-700 font-bold uppercase leading-relaxed">
                  PENTING: Anda perlu mengatur GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET di pengaturan aplikasi untuk mengaktifkan fitur ini.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'admin' && (
        <div className="space-y-8">
           <div className="bg-white p-10 rounded-[3rem] border shadow-sm">
              <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-3"><UserPlus size={20} className="text-blue-600" /> Tambah Akun Pengguna</h3>
              <form onSubmit={e => {
                e.preventDefault();
                const user = { ...newUser, id: Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString() };
                setAllUsers(prev => [...prev, user]);
                setNewUser({ username: '', password: '', nama: '', role: 'User' });
                alert('User ditambahkan.');
              }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                 <div className="space-y-1"><label className="text-[10px] font-black text-slate-400">Username</label><input type="text" value={newUser.username} onChange={e=>setNewUser({...newUser, username: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold text-sm" /></div>
                 <div className="space-y-1"><label className="text-[10px] font-black text-slate-400">Password</label><input type="password" value={newUser.password} onChange={e=>setNewUser({...newUser, password: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold text-sm" /></div>
                 <div className="space-y-1"><label className="text-[10px] font-black text-slate-400">Nama</label><input type="text" value={newUser.nama} onChange={e=>setNewUser({...newUser, nama: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold text-sm" /></div>
                 <div className="space-y-1"><label className="text-[10px] font-black text-slate-400">Peran</label><select value={newUser.role} onChange={e=>setNewUser({...newUser, role: e.target.value as any})} className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold text-sm"><option value="User">User</option><option value="Admin">Admin</option></select></div>
                 <button type="submit" className="bg-blue-600 text-white px-6 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg">Tambah</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
