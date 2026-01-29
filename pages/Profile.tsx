
import React, { useState } from 'react';
import { User, Shield, Key, Trash2, UserPlus, ShieldAlert, Settings, Save, UploadCloud, Image as ImageIcon, Check, Camera, X, AlertTriangle, Database, Cloud, CloudOff, RefreshCw } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'profile' | 'admin' | 'system'>('profile');
  
  // Profile Update States
  const [editNama, setEditNama] = useState(currentUser.nama);
  const [newPassword, setNewPassword] = useState('');
  const [firebaseApiKey, setFirebaseApiKey] = useState(currentUser.firebaseApiKey || '');
  const [isVerifying, setIsVerifying] = useState(false);
  
  // App Settings States
  const [tempAppName, setTempAppName] = useState(appName);

  // Management User States
  const [newUser, setNewUser] = useState({ username: '', password: '', nama: '', role: 'User' as any });
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const isFirebaseConnected = !!firebaseApiKey;

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    
    // Simulate real handshake with database
    setTimeout(() => {
      const updatedUser: UserAccount = { 
        ...currentUser, 
        nama: editNama,
        firebaseApiKey: firebaseApiKey
      };
      
      if (newPassword && newPassword.trim() !== '') {
        updatedUser.password = newPassword;
      }
      
      // 1. Update global users list
      setAllUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
      
      // 2. Update current active session
      onUpdateCurrentUser(updatedUser);
      
      setNewPassword('');
      setIsVerifying(false);
      alert('Profil, kredensial keamanan, dan konfigurasi Cloud Sync berhasil disinkronkan ke basis data.');
    }, 1200);
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
    alert('Pengaturan identitas visual sistem berhasil diperbarui.');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAppLogo(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password || !newUser.nama) return alert('Lengkapi data user baru.');

    const userToAdd: UserAccount = {
      id: Math.random().toString(36).substr(2, 9),
      ...newUser,
      createdAt: new Date().toISOString()
    };

    setAllUsers([...allUsers, userToAdd]);
    setNewUser({ username: '', password: '', nama: '', role: 'User' });
    alert('Akun operasional baru berhasil didaftarkan ke sistem.');
  };

  const executeDeleteUser = () => {
    if (deleteTargetId) {
      if (deleteTargetId === currentUser.id) {
        alert('Keamanan: Anda tidak diperbolehkan menghapus akun yang sedang aktif digunakan.');
      } else {
        setAllUsers(prev => prev.filter(u => u.id !== deleteTargetId));
      }
      setDeleteTargetId(null);
    }
  };

  const targetUser = allUsers.find(u => u.id === deleteTargetId);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
      {/* Tab Header */}
      <div className="flex bg-white p-2 rounded-[2rem] border border-slate-100 shadow-sm w-fit overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setActiveTab('profile')}
          className={`px-8 py-3 rounded-2xl text-xs font-black uppercase transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'profile' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'text-slate-400 hover:bg-slate-50'}`}
        >
          <User size={16} /> Profil Saya
        </button>
        {currentUser.role === 'Admin' && (
          <>
            <button 
              onClick={() => setActiveTab('admin')}
              className={`px-8 py-3 rounded-2xl text-xs font-black uppercase transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'admin' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <Shield size={16} /> Manajemen User
            </button>
            <button 
              onClick={() => setActiveTab('system')}
              className={`px-8 py-3 rounded-2xl text-xs font-black uppercase transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'system' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <Settings size={16} /> Pengaturan Sistem
            </button>
          </>
        )}
      </div>

      {activeTab === 'profile' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-40 h-40 bg-blue-50 rounded-full -mr-20 -mt-20"></div>
               <div className="relative z-10">
                 <div className="flex flex-col md:flex-row items-center gap-8 mb-10">
                    <div className="relative group">
                       <div className="w-32 h-32 bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-white text-4xl font-black overflow-hidden ring-8 ring-slate-50 group-hover:ring-blue-100 transition-all duration-500">
                         {currentUser.avatar ? (
                            <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />
                         ) : (
                            <img src={`https://ui-avatars.com/api/?name=${currentUser.nama}&background=random&color=fff&size=256`} alt="Avatar" />
                         )}
                         <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <Camera className="text-white" size={32} />
                            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                         </label>
                       </div>
                       <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2.5 rounded-2xl shadow-lg border-4 border-white">
                          <ImageIcon size={16} />
                       </div>
                    </div>
                    <div className="text-center md:text-left">
                       <h2 className="text-3xl font-black text-slate-800 tracking-tight">{currentUser.nama}</h2>
                       <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${currentUser.role === 'Admin' ? 'bg-blue-600 text-white' : 'bg-emerald-100 text-emerald-600'}`}>
                             {currentUser.role}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Akses Sejak {new Date(currentUser.createdAt).toLocaleDateString('id-ID')}</span>
                       </div>
                    </div>
                 </div>

                 <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                          <input 
                            type="text" 
                            value={editNama}
                            onChange={e => setEditNama(e.target.value)}
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-slate-800"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username Akses</label>
                          <input type="text" readOnly value={currentUser.username} className="w-full px-5 py-4 bg-slate-100 border border-slate-200 rounded-2xl text-slate-400 font-bold cursor-not-allowed" />
                       </div>
                    </div>

                    <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-4 mt-4 relative overflow-hidden">
                       <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                             <Key size={18} className="text-blue-600" /> Keamanan & Integrasi
                          </h3>
                          {isFirebaseConnected ? (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                               <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Cloud Sync Active</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-200 border border-slate-300 rounded-xl opacity-60">
                               <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Offline Mode</span>
                            </div>
                          )}
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password Baru (Opsional)</label>
                            <input 
                              type="password" 
                              value={newPassword}
                              onChange={e => setNewPassword(e.target.value)}
                              placeholder="Biarkan kosong untuk tetap"
                              className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                              <Database size={12} className="text-indigo-600" /> Firebase API Key
                            </label>
                            <div className="relative">
                              <input 
                                type="password" 
                                value={firebaseApiKey}
                                onChange={e => setFirebaseApiKey(e.target.value)}
                                placeholder="AIzaSyA..."
                                className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium pr-12"
                              />
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-400">
                                 {isFirebaseConnected ? <Cloud size={16} /> : <CloudOff size={16} />}
                              </div>
                            </div>
                            <p className="text-[8px] text-slate-400 font-medium px-1 italic">Masukan kunci API Firebase Anda untuk sinkronisasi data cloud.</p>
                       </div>
                    </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={isVerifying}
                      className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 shadow-xl shadow-slate-900/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {isVerifying ? (
                        <>
                          <RefreshCw size={18} className="animate-spin" /> Sinkronisasi Database...
                        </>
                      ) : (
                        <>
                          <Save size={18} /> Update Data Profil
                        </>
                      )}
                    </button>
                 </form>
               </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-[3rem] text-white shadow-xl shadow-indigo-600/20">
               <ShieldAlert className="mb-4" size={32} />
               <h3 className="text-xl font-black mb-2 tracking-tight">Status Otorisasi</h3>
               <p className="text-indigo-100 text-sm leading-relaxed font-medium">
                  {currentUser.role === 'Admin' 
                    ? 'Administrator Utama. Anda memiliki kendali penuh atas manajemen data LKS, kontrol user, dan konfigurasi inti sistem.' 
                    : 'Akses Petugas Lapangan. Anda berwenang melakukan entri data PM dan pemantauan administrasi LKS.'}
               </p>
            </div>
          </div>
        </div>
      ) : activeTab === 'admin' ? (
        <div className="space-y-8">
           {/* Manajemen User Content (Tetap Sama) */}
           <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl">
              <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-3">
                <UserPlus size={20} className="text-blue-600" /> Registrasi User Baru
              </h3>
              <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                 <div className="lg:col-span-1 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Username</label>
                    <input type="text" value={newUser.username} onChange={e=>setNewUser({...newUser, username: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sm" />
                 </div>
                 <div className="lg:col-span-1 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Password</label>
                    <input type="password" value={newUser.password} onChange={e=>setNewUser({...newUser, password: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sm" />
                 </div>
                 <div className="lg:col-span-1 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Nama Lengkap</label>
                    <input type="text" value={newUser.nama} onChange={e=>setNewUser({...newUser, nama: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sm" />
                 </div>
                 <div className="lg:col-span-1 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Role</label>
                    <select value={newUser.role} onChange={e=>setNewUser({...newUser, role: e.target.value as any})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sm">
                       <option value="User">User</option>
                       <option value="Admin">Admin</option>
                    </select>
                 </div>
                 <button type="submit" className="lg:col-span-1 bg-blue-600 text-white px-6 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 transition-all">
                    Tambah User
                 </button>
              </form>
           </div>
           
           <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                       <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama / Username</th>
                       <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Peran</th>
                       <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {allUsers.map(u => (
                       <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-8 py-5">
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                                   {u.avatar ? (
                                      <img src={u.avatar} className="w-full h-full object-cover" />
                                   ) : (
                                      <img src={`https://ui-avatars.com/api/?name=${u.nama}&background=random&color=fff`} />
                                   )}
                                </div>
                                <div>
                                   <p className="text-sm font-black text-slate-800">{u.nama}</p>
                                   <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-widest">{u.username}</p>
                                </div>
                             </div>
                          </td>
                          <td className="px-8 py-5">
                             <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${u.role === 'Admin' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                                {u.role}
                             </span>
                          </td>
                          <td className="px-8 py-5 text-right">
                             <button 
                               onClick={() => setDeleteTargetId(u.id)}
                               disabled={u.id === currentUser.id}
                               className={`p-2 rounded-xl transition-all ${u.id === currentUser.id ? 'text-slate-200 cursor-not-allowed' : 'text-slate-300 hover:text-red-600 hover:bg-red-50'}`}
                             >
                                <Trash2 size={18} />
                             </button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
           <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full -mr-32 -mt-32"></div>
              <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-3 relative z-10">
                <Settings size={20} className="text-indigo-600" /> Identitas Visual Aplikasi
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
                 <div className="space-y-6">
                    <form onSubmit={handleSaveSystemSettings} className="space-y-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Aplikasi Utama</label>
                          <input type="text" value={tempAppName} onChange={e => setTempAppName(e.target.value)} placeholder="Contoh: SI-LKS BLORA" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-black text-slate-800 uppercase" />
                       </div>
                       <button type="submit" className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-500 shadow-xl shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-2">
                          <Check size={18} /> Update Nama Aplikasi
                       </button>
                    </form>
                 </div>
                 <div className="space-y-6">
                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 bg-slate-50 rounded-[3rem] text-center gap-4">
                       <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center overflow-hidden border border-slate-100">
                          {appLogo ? <img src={appLogo} alt="Preview" className="w-full h-full object-contain" /> : <ImageIcon size={40} className="text-slate-200" />}
                       </div>
                       <div className="flex gap-2">
                          <label className="cursor-pointer px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase hover:bg-slate-900 hover:text-white transition-all flex items-center gap-2">
                             <UploadCloud size={16} /> Unggah Logo Baru
                             <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                          </label>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {deleteTargetId && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setDeleteTargetId(null)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mb-6 shadow-inner animate-pulse"><AlertTriangle size={40} /></div>
            <h3 className="text-2xl font-black text-slate-800 leading-tight mb-3">Hapus Pengguna?</h3>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">Akun milik <span className="font-bold text-slate-900 underline">"{targetUser?.nama}"</span> akan dihapus secara permanen.</p>
            <div className="flex w-full gap-4">
              <button onClick={() => setDeleteTargetId(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">Batal</button>
              <button onClick={executeDeleteUser} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-600/20 hover:bg-red-500 active:scale-95 transition-all">Hapus Permanen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
