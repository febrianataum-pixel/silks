
import React, { useState } from 'react';
import { User, Shield, Trash2, UserPlus, Settings, Save, Image as ImageIcon, Camera, AlertTriangle, RefreshCw, Download, Upload, Share2, Cloud, ShieldCheck, CheckCircle2, Info } from 'lucide-react';
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
}

const Profile: React.FC<ProfileProps> = ({ 
  currentUser, 
  allUsers, 
  setAllUsers, 
  onUpdateCurrentUser,
  appName,
  setAppName,
  appLogo,
  setAppLogo
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'admin' | 'system' | 'data'>('data');
  
  // Profile Update States
  const [editNama, setEditNama] = useState(currentUser.nama);
  const [newPassword, setNewPassword] = useState('');
  
  // Firebase Sync States
  const [firebaseApiKey, setFirebaseApiKey] = useState(currentUser.firebaseApiKey || '');
  const [firebaseProjectId, setFirebaseProjectId] = useState(currentUser.firebaseProjectId || '');
  const [isSyncing, setIsSyncing] = useState(false);
  
  // App Settings States
  const [tempAppName, setTempAppName] = useState(appName);

  // Management User States
  const [newUser, setNewUser] = useState({ username: '', password: '', nama: '', role: 'User' as any });
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncing(true);
    
    setTimeout(() => {
      const updatedUser: UserAccount = { 
        ...currentUser, 
        nama: editNama
      };
      
      if (newPassword && newPassword.trim() !== '') {
        updatedUser.password = newPassword;
      }
      
      setAllUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
      onUpdateCurrentUser(updatedUser);
      setNewPassword('');
      setIsSyncing(false);
      alert('Profil berhasil disimpan.');
    }, 800);
  };

  const handleActivateCloudSync = () => {
    if (!firebaseApiKey || !firebaseProjectId) {
      alert('Harap isi Firebase API Key dan Project ID terlebih dahulu.');
      return;
    }
    
    setIsSyncing(true);
    setTimeout(() => {
      const updatedUser: UserAccount = { 
        ...currentUser, 
        firebaseApiKey,
        firebaseProjectId
      };
      
      setAllUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
      onUpdateCurrentUser(updatedUser);
      setIsSyncing(false);
      alert('Konfigurasi Cloud Sync Disimpan! Jika Project ID benar, data akan otomatis sinkron.');
    }, 1500);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) return alert('File terlalu besar. Maksimal 1MB.');
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        const updatedUser = { ...currentUser, avatar: base64 };
        setAllUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
        onUpdateCurrentUser(updatedUser);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSystemSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setAppName(tempAppName);
    alert('Nama aplikasi berhasil diperbarui.');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return alert('File logo terlalu besar. Maksimal 2MB.');
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setAppLogo(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExportData = () => {
    const database = {
      lks: localStorage.getItem('si-lks-lksdata'),
      pm: localStorage.getItem('si-lks-pmdata'),
      letters: localStorage.getItem('si-lks-lettersdata'),
      users: localStorage.getItem('si-lks-allusers'),
      settings: {
        name: localStorage.getItem('si-lks-appname'),
        logo: localStorage.getItem('si-lks-applogo')
      },
      exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(database);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `BACKUP_SILKS_BLORA_${new Date().getTime()}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (confirm('Import data akan menimpa data yang ada di HP ini. Lanjutkan?')) {
          if (imported.lks) localStorage.setItem('si-lks-lksdata', imported.lks);
          if (imported.pm) localStorage.setItem('si-lks-pmdata', imported.pm);
          if (imported.letters) localStorage.setItem('si-lks-lettersdata', imported.letters);
          if (imported.users) localStorage.setItem('si-lks-allusers', imported.users);
          if (imported.settings?.name) localStorage.setItem('si-lks-appname', imported.settings.name);
          if (imported.settings?.logo) localStorage.setItem('si-lks-applogo', imported.settings.logo);
          
          alert('Data berhasil diimport! Halaman akan dimuat ulang.');
          window.location.reload();
        }
      } catch (err) {
        alert('File tidak valid.');
      }
    };
    reader.readAsText(file);
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password || !newUser.nama) return alert('Lengkapi data user.');
    const userToAdd: UserAccount = {
      id: Math.random().toString(36).substr(2, 9),
      ...newUser,
      createdAt: new Date().toISOString()
    };
    setAllUsers([...allUsers, userToAdd]);
    setNewUser({ username: '', password: '', nama: '', role: 'User' });
    alert('User baru berhasil didaftarkan.');
  };

  const executeDeleteUser = () => {
    if (deleteTargetId) {
      if (deleteTargetId === currentUser.id) alert('Tidak bisa hapus diri sendiri.');
      else setAllUsers(prev => prev.filter(u => u.id !== deleteTargetId));
      setDeleteTargetId(null);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
      <div className="flex bg-white p-2 rounded-[2rem] border border-slate-100 shadow-sm w-fit overflow-x-auto no-scrollbar">
        <button onClick={() => setActiveTab('profile')} className={`px-8 py-3 rounded-2xl text-xs font-black uppercase transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'profile' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}><User size={16} /> Profil Saya</button>
        <button onClick={() => setActiveTab('data')} className={`px-8 py-3 rounded-2xl text-xs font-black uppercase transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'data' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}><Cloud size={16} /> Cloud Sync</button>
        {currentUser.role === 'Admin' && (
          <>
            <button onClick={() => setActiveTab('admin')} className={`px-8 py-3 rounded-2xl text-xs font-black uppercase transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'admin' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}><Shield size={16} /> Manajemen User</button>
            <button onClick={() => setActiveTab('system')} className={`px-8 py-3 rounded-2xl text-xs font-black uppercase transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'system' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}><Settings size={16} /> Sistem</button>
          </>
        )}
      </div>

      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl relative overflow-hidden">
               <div className="relative z-10">
                 <div className="flex flex-col md:flex-row items-center gap-8 mb-10">
                    <div className="relative group">
                       <div className="w-32 h-32 bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-white text-4xl font-black overflow-hidden ring-8 ring-slate-50 group-hover:ring-blue-100 transition-all duration-500">
                         {currentUser.avatar ? <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" /> : <img src={`https://ui-avatars.com/api/?name=${currentUser.nama}&background=random&color=fff&size=256`} alt="Avatar" />}
                         <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"><Camera className="text-white" size={32} /><input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} /></label>
                       </div>
                    </div>
                    <div className="text-center md:text-left">
                       <h2 className="text-3xl font-black text-slate-800 tracking-tight">{currentUser.nama}</h2>
                       <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${currentUser.role === 'Admin' ? 'bg-blue-600 text-white' : 'bg-emerald-100 text-emerald-600'}`}>{currentUser.role}</span>
                       </div>
                    </div>
                 </div>
                 <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nama Lengkap</label>
                          <input type="text" value={editNama} onChange={e => setEditNama(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Password Baru (Opsional)</label>
                          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Kosongkan jika tetap" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-medium" />
                       </div>
                    </div>
                    <button type="submit" disabled={isSyncing} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 shadow-xl active:scale-95 transition-all flex items-center gap-2">
                      {isSyncing ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />} {isSyncing ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                 </form>
               </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'data' && (
        <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
           <div className="bg-[#0a0a0a] p-10 md:p-14 rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full -mr-48 -mt-48 transition-all group-hover:bg-blue-600/20"></div>
              <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 mb-12 relative z-10">
                 <div className="w-20 h-20 bg-[#f97316] text-white rounded-[2rem] flex items-center justify-center shadow-[0_0_30px_rgba(249,115,22,0.3)] shrink-0">
                    <Cloud size={36} fill="white" />
                 </div>
                 <div className="text-center md:text-left">
                    <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase">REALTIME <span className="text-blue-500">CLOUD SYNC</span></h2>
                    <p className="text-[#f97316] text-sm md:text-base font-bold italic mt-1">Sinkronisasi data antar perangkat secara otomatis.</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                 <div className="space-y-3">
                    <label className="text-[11px] font-black text-[#475569] uppercase tracking-widest ml-1">FIREBASE API KEY</label>
                    <input type="password" value={firebaseApiKey} onChange={e => setFirebaseApiKey(e.target.value)} placeholder="••••••••••••••••••••" className="w-full px-8 py-6 bg-[#0f0f0f] border border-white/10 rounded-[1.8rem] outline-none font-bold text-white text-lg focus:border-blue-500/50 transition-all placeholder:text-white/10" />
                 </div>
                 <div className="space-y-3">
                    <label className="text-[11px] font-black text-[#475569] uppercase tracking-widest ml-1">FIREBASE PROJECT ID</label>
                    <input type="text" value={firebaseProjectId} onChange={e => setFirebaseProjectId(e.target.value)} placeholder="sitampan-93c2a" className="w-full px-8 py-6 bg-[#0f0f0f] border border-white/10 rounded-[1.8rem] outline-none font-bold text-white text-lg focus:border-blue-500/50 transition-all placeholder:text-white/10" />
                 </div>
              </div>

              <div className="mt-8 p-6 bg-blue-900/10 border border-blue-500/20 rounded-3xl flex gap-4 text-left">
                 <div className="p-3 bg-blue-500/20 rounded-2xl h-fit"><Info size={20} className="text-blue-400" /></div>
                 <div>
                    <h4 className="text-white font-black text-xs uppercase tracking-widest mb-1">Penting: Izin Firestore</h4>
                    <p className="text-blue-300/60 text-[11px] leading-relaxed">Agar HP bisa ikut membaca data dari Laptop, pastikan Anda sudah mengatur <b>Firestore Rules</b> di Firebase Console menjadi: <code className="bg-black/40 px-2 py-1 rounded text-blue-400">allow read, write: if true;</code> (hanya untuk pengujian).</p>
                 </div>
              </div>

              <div className="mt-12 flex justify-center md:justify-end relative z-10">
                 <button onClick={handleActivateCloudSync} disabled={isSyncing} className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-12 py-5 rounded-[1.8rem] font-black text-sm uppercase tracking-widest shadow-[0_20px_40px_rgba(37,99,235,0.25)] active:scale-95 transition-all flex items-center gap-4 disabled:opacity-50">
                    {isSyncing ? <><RefreshCw size={22} className="animate-spin" /> MENGHUBUNGKAN...</> : <><ShieldCheck size={22} /> AKTIFKAN CLOUD SYNC</>}
                 </button>
              </div>

              {currentUser.firebaseApiKey && (
                <div className="mt-8 pt-8 border-t border-white/5 flex items-center gap-3 text-emerald-500 animate-in fade-in slide-in-from-top-2">
                   <CheckCircle2 size={16} />
                   <span className="text-[11px] font-black uppercase tracking-[0.2em]">Sistem Cloud Aktif & Terpantau</span>
                </div>
              )}
           </div>

           <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl">
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner"><Share2 size={28} /></div>
                 <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Migrasi Data Manual (Backup)</h3>
                    <p className="text-sm text-slate-400 font-medium">Cadangkan data secara manual dalam format file JSON.</p>
                 </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-6 group hover:bg-white hover:shadow-lg transition-all">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all"><Download size={24} /></div>
                    <h4 className="text-lg font-black text-slate-800">Export Database</h4>
                    <button onClick={handleExportData} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-lg">Download File JSON</button>
                 </div>
                 <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-6 group hover:bg-white hover:shadow-lg transition-all">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-all"><Upload size={24} /></div>
                    <h4 className="text-lg font-black text-slate-800">Import Database</h4>
                    <label className="block w-full py-4 bg-emerald-600 text-white text-center rounded-2xl font-black text-[10px] uppercase tracking-widest cursor-pointer hover:bg-emerald-700 transition-all shadow-lg">
                       Unggah File Backup
                       <input type="file" accept=".json" className="hidden" onChange={handleImportData} />
                    </label>
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'admin' && (
        <div className="space-y-8 animate-in fade-in zoom-in-95">
           <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl">
              <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-3"><UserPlus size={20} className="text-blue-600" /> Registrasi User Baru</h3>
              <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                 <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Username</label><input type="text" value={newUser.username} onChange={e=>setNewUser({...newUser, username: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sm" /></div>
                 <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Password</label><input type="password" value={newUser.password} onChange={e=>setNewUser({...newUser, password: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sm" /></div>
                 <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Nama Lengkap</label><input type="text" value={newUser.nama} onChange={e=>setNewUser({...newUser, nama: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sm" /></div>
                 <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Role</label><select value={newUser.role} onChange={e=>setNewUser({...newUser, role: e.target.value as any})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sm"><option value="User">User</option><option value="Admin">Admin</option></select></div>
                 <button type="submit" className="bg-blue-600 text-white px-6 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all">Tambah User</button>
              </form>
           </div>
           <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
              <table className="w-full text-left">
                 <thead><tr className="bg-slate-50/50 border-b border-slate-100"><th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama / Username</th><th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Peran</th><th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th></tr></thead>
                 <tbody className="divide-y divide-slate-50">
                    {allUsers.map(u => (
                       <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-8 py-5"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">{u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : <img src={`https://ui-avatars.com/api/?name=${u.nama}&background=random&color=fff`} />}</div><div><p className="text-sm font-black text-slate-800">{u.nama}</p><p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-widest">{u.username}</p></div></div></td>
                          <td className="px-8 py-5"><span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${u.role === 'Admin' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>{u.role}</span></td>
                          <td className="px-8 py-5 text-right"><button onClick={() => setDeleteTargetId(u.id)} disabled={u.id === currentUser.id} className={`p-2 rounded-xl transition-all ${u.id === currentUser.id ? 'text-slate-200 cursor-not-allowed' : 'text-slate-300 hover:text-red-600 hover:bg-red-50'}`}><Trash2 size={18} /></button></td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {activeTab === 'system' && (
        <div className="space-y-8 animate-in fade-in zoom-in-95">
           <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden relative">
              <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-3 relative z-10"><Settings size={20} className="text-indigo-600" /> Identitas Visual Aplikasi</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
                 <div className="space-y-6">
                    <form onSubmit={handleSaveSystemSettings} className="space-y-4">
                       <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Aplikasi Utama</label><input type="text" value={tempAppName} onChange={e => setEditNama(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-slate-800 uppercase" /></div>
                       <button type="submit" className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-indigo-200">Update Identitas</button>
                    </form>
                 </div>
                 <div className="space-y-6">
                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 bg-slate-50 rounded-[3rem] text-center gap-4">
                       <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center overflow-hidden border border-slate-100">{appLogo ? <img src={appLogo} alt="Preview" className="w-full h-full object-contain" /> : <ImageIcon size={40} className="text-slate-200" />}</div>
                       <label className="cursor-pointer px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase hover:bg-slate-900 hover:text-white transition-all">Ganti Logo<input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} /></label>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {deleteTargetId && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={() => setDeleteTargetId(null)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 flex flex-col items-center text-center animate-in zoom-in-95">
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mb-6 shadow-inner"><AlertTriangle size={40} /></div>
            <h3 className="text-2xl font-black text-slate-800 leading-tight mb-3">Hapus Pengguna?</h3>
            <div className="flex w-full gap-4"><button onClick={() => setDeleteTargetId(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest">Batal</button><button onClick={executeDeleteUser} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-600/20 active:scale-95 transition-all">Hapus</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
