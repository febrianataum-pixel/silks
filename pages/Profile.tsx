
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
  cloudConfig: {apiKey: string, projectId: string} | null;
  setCloudConfig: (config: {apiKey: string, projectId: string} | null) => void;
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
  setCloudConfig
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'admin' | 'system' | 'data'>('data');
  
  // Profile Update States
  const [editNama, setEditNama] = useState(currentUser.nama);
  const [newPassword, setNewPassword] = useState('');
  
  // Firebase Sync States
  const [firebaseApiKey, setFirebaseApiKey] = useState(cloudConfig?.apiKey || '');
  const [firebaseProjectId, setFirebaseProjectId] = useState(cloudConfig?.projectId || '');
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
      const updatedUser: UserAccount = { ...currentUser, nama: editNama };
      if (newPassword && newPassword.trim() !== '') updatedUser.password = newPassword;
      setAllUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
      onUpdateCurrentUser(updatedUser);
      setNewPassword('');
      setIsSyncing(false);
      alert('Profil berhasil disimpan.');
    }, 800);
  };

  const handleActivateCloudSync = () => {
    if (!firebaseApiKey || !firebaseProjectId) return alert('Lengkapi konfigurasi.');
    setIsSyncing(true);
    setTimeout(() => {
      setCloudConfig({ apiKey: firebaseApiKey, projectId: firebaseProjectId });
      setIsSyncing(false);
      alert('Sistem Cloud Global Aktif! Seluruh perangkat dengan config ini akan sinkron.');
    }, 1500);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
    alert('Identitas sistem diperbarui.');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setAppLogo(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleExportData = () => {
    const database = {
      lks: localStorage.getItem('si-lks-lksdata'),
      pm: localStorage.getItem('si-lks-pmdata'),
      letters: localStorage.getItem('si-lks-lettersdata'),
      users: JSON.stringify(allUsers),
      appName,
      appLogo,
      exportDate: new Date().toISOString()
    };
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(JSON.stringify(database));
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', `BACKUP_SILKS_BLORA_${Date.now()}.json`);
    link.click();
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) return alert('Lengkapi data.');
    const userToAdd: UserAccount = {
      id: Math.random().toString(36).substr(2, 9),
      ...newUser,
      createdAt: new Date().toISOString()
    };
    setAllUsers([...allUsers, userToAdd]);
    setNewUser({ username: '', password: '', nama: '', role: 'User' });
    alert('User baru ditambahkan.');
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
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl max-w-4xl">
           <div className="flex flex-col md:flex-row items-center gap-8 mb-10">
              <div className="relative group cursor-pointer">
                 <div className="w-32 h-32 bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-white overflow-hidden ring-8 ring-slate-50">
                   {currentUser.avatar ? <img src={currentUser.avatar} className="w-full h-full object-cover" /> : <img src={`https://ui-avatars.com/api/?name=${currentUser.nama}&background=random&color=fff&size=256`} />}
                   <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="text-white" size={32} /><input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} /></label>
                 </div>
              </div>
              <div className="text-center md:text-left">
                 <h2 className="text-3xl font-black text-slate-800">{currentUser.nama}</h2>
                 <p className="text-blue-600 font-bold uppercase text-[10px] tracking-widest mt-1">{currentUser.role}</p>
              </div>
           </div>
           <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Lengkap</label><input type="text" value={editNama} onChange={e => setEditNama(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold" /></div>
              <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ganti Password</label><input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Biarkan kosong jika tidak ganti" className="w-full px-5 py-4 bg-slate-50 border rounded-2xl" /></div>
              <button type="submit" className="md:col-span-2 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Simpan Profil</button>
           </form>
        </div>
      )}

      {activeTab === 'data' && (
        <div className="space-y-10">
           <div className="bg-[#0f172a] p-10 md:p-14 rounded-[3.5rem] shadow-2xl relative overflow-hidden group border border-white/10">
              <div className="flex flex-col md:flex-row items-center gap-8 mb-12 relative z-10">
                 <div className="w-20 h-20 bg-blue-600 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-500/20"><Cloud size={36} fill="white" /></div>
                 <div className="text-center md:text-left">
                    <h2 className="text-3xl font-black text-white tracking-tighter uppercase">HUBUNGAN <span className="text-blue-500">CLOUD REALTIME</span></h2>
                    <p className="text-slate-400 text-sm font-bold mt-1">Gunakan API Key yang sama di Laptop & HP Anda.</p>
                 </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                 <div className="space-y-3"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">FIREBASE API KEY</label><input type="password" value={firebaseApiKey} onChange={e => setFirebaseApiKey(e.target.value)} className="w-full px-8 py-6 bg-white/5 border border-white/10 rounded-[1.8rem] outline-none font-bold text-white text-lg focus:border-blue-500/50 transition-all" /></div>
                 <div className="space-y-3"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">PROJECT ID</label><input type="text" value={firebaseProjectId} onChange={e => setFirebaseProjectId(e.target.value)} className="w-full px-8 py-6 bg-white/5 border border-white/10 rounded-[1.8rem] outline-none font-bold text-white text-lg focus:border-blue-500/50 transition-all" /></div>
              </div>
              <div className="mt-12 flex justify-center md:justify-end relative z-10">
                 <button onClick={handleActivateCloudSync} disabled={isSyncing} className="bg-blue-600 hover:bg-blue-500 text-white px-12 py-5 rounded-[1.8rem] font-black text-sm uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center gap-4">
                    {isSyncing ? <RefreshCw size={22} className="animate-spin" /> : <ShieldCheck size={22} />} {isSyncing ? 'MENGHUBUNGKAN...' : 'AKTIFKAN SINKRONISASI'}
                 </button>
              </div>
              {cloudConfig?.apiKey && <div className="mt-8 pt-8 border-t border-white/5 flex items-center gap-3 text-emerald-500"><CheckCircle2 size={16} /><span className="text-[10px] font-black uppercase tracking-widest">Tersambung ke Cloud Global</span></div>}
           </div>

           <div className="bg-white p-10 rounded-[3rem] border shadow-sm">
              <h3 className="text-2xl font-black text-slate-800 mb-8">Backup Data Lokal (Manual)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="p-8 bg-slate-50 rounded-[2.5rem] border space-y-4 hover:shadow-lg transition-all">
                    <Download className="text-blue-600" />
                    <h4 className="font-black text-slate-800">Export ke JSON</h4>
                    <button onClick={handleExportData} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg">Download Backup</button>
                 </div>
                 <div className="p-8 bg-slate-50 rounded-[2.5rem] border space-y-4 hover:shadow-lg transition-all">
                    <Upload className="text-emerald-600" />
                    <h4 className="font-black text-slate-800">Import dari JSON</h4>
                    <label className="block w-full py-4 bg-emerald-600 text-white text-center rounded-2xl font-black text-xs uppercase tracking-widest cursor-pointer shadow-lg">Pilih File Backup<input type="file" accept=".json" className="hidden" /></label>
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'admin' && (
        <div className="space-y-8 animate-in fade-in">
           <div className="bg-white p-10 rounded-[3rem] border shadow-sm">
              <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-3"><UserPlus size={20} className="text-blue-600" /> Tambah Akun Baru</h3>
              <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                 <div className="space-y-1"><label className="text-[10px] font-black text-slate-400">Username</label><input type="text" value={newUser.username} onChange={e=>setNewUser({...newUser, username: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold text-sm" /></div>
                 <div className="space-y-1"><label className="text-[10px] font-black text-slate-400">Password</label><input type="password" value={newUser.password} onChange={e=>setNewUser({...newUser, password: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold text-sm" /></div>
                 <div className="space-y-1"><label className="text-[10px] font-black text-slate-400">Nama Lengkap</label><input type="text" value={newUser.nama} onChange={e=>setNewUser({...newUser, nama: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold text-sm" /></div>
                 <div className="space-y-1"><label className="text-[10px] font-black text-slate-400">Peran</label><select value={newUser.role} onChange={e=>setNewUser({...newUser, role: e.target.value as any})} className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold text-sm"><option value="User">User</option><option value="Admin">Admin</option></select></div>
                 <button type="submit" className="bg-blue-600 text-white px-6 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg">Tambah User</button>
              </form>
           </div>
           <div className="bg-white rounded-[3rem] border shadow-sm overflow-hidden">
              <table className="w-full text-left">
                 <thead className="bg-slate-50 border-b"><tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><th className="px-8 py-5">Nama / Username</th><th className="px-8 py-5">Peran</th><th className="px-8 py-5 text-right">Aksi</th></tr></thead>
                 <tbody className="divide-y">
                    {allUsers.map(u => (
                       <tr key={u.id} className="hover:bg-slate-50"><td className="px-8 py-5"><p className="text-sm font-black text-slate-800">{u.nama}</p><p className="text-[10px] text-slate-400 font-bold uppercase">{u.username}</p></td><td className="px-8 py-5"><span className="px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black uppercase tracking-widest">{u.role}</span></td><td className="px-8 py-5 text-right"><button onClick={() => { if(confirm('Hapus user?')) setAllUsers(prev=>prev.filter(x=>x.id!==u.id)) }} className="text-slate-300 hover:text-red-600"><Trash2 size={18} /></button></td></tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {activeTab === 'system' && (
        <div className="bg-white p-10 rounded-[3rem] border shadow-sm">
           <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-3"><Settings size={20} className="text-indigo-600" /> Nama & Logo Aplikasi</h3>
           <form onSubmit={handleSaveSystemSettings} className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                 <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Aplikasi</label><input type="text" value={tempAppName} onChange={e => setTempAppName(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-black uppercase" /></div>
                 <button type="submit" className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg">Update Nama</button>
              </div>
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-[3rem] text-center gap-4 bg-slate-50">
                 <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center overflow-hidden">{appLogo ? <img src={appLogo} className="w-full h-full object-contain" /> : <ImageIcon size={40} className="text-slate-200" />}</div>
                 <label className="cursor-pointer px-6 py-2.5 bg-white border rounded-xl text-[10px] font-black uppercase hover:bg-slate-900 hover:text-white transition-all">Ganti Logo<input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} /></label>
              </div>
           </form>
        </div>
      )}
    </div>
  );
};

export default Profile;
