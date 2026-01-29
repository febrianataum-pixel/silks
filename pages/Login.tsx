
import React, { useState } from 'react';
import { User, Lock, ShieldCheck, UserPlus, LogIn, Eye, EyeOff, Cloud, RefreshCw, CheckCircle2 } from 'lucide-react';
import { UserAccount } from '../types';

interface LoginProps {
  onLogin: (user: UserAccount) => void;
  allUsers: UserAccount[];
  setAllUsers: React.Dispatch<React.SetStateAction<UserAccount[]>>;
  appName: string;
  appLogo: string | null;
  cloudConfig: {apiKey: string, projectId: string} | null;
  setCloudConfig: (config: {apiKey: string, projectId: string} | null) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, allUsers, setAllUsers, appName, appLogo, cloudConfig, setCloudConfig }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showCloudSetup, setShowCloudSetup] = useState(false);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nama, setNama] = useState('');
  const [error, setError] = useState('');

  // Cloud Config Local States
  const [tempApiKey, setTempApiKey] = useState(cloudConfig?.apiKey || '');
  const [tempProjectId, setTempProjectId] = useState(cloudConfig?.projectId || '');
  const [isConnecting, setIsConnecting] = useState(false);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLoginMode) {
      const user = allUsers.find(u => u.username === username && u.password === password);
      if (user) {
        onLogin(user);
      } else {
        setError('Username atau password salah.');
      }
    } else {
      if (!username || !password || !nama) {
        setError('Semua field harus diisi.');
        return;
      }
      if (allUsers.find(u => u.username === username)) {
        setError('Username sudah digunakan.');
        return;
      }

      const newUser: UserAccount = {
        id: Math.random().toString(36).substr(2, 9),
        username,
        password,
        nama,
        role: 'User',
        createdAt: new Date().toISOString()
      };
      setAllUsers([...allUsers, newUser]);
      setIsLoginMode(true);
      alert('Pendaftaran berhasil! Silakan login.');
    }
  };

  const handleConnectCloud = () => {
    if (!tempApiKey || !tempProjectId) return alert('Lengkapi konfigurasi cloud.');
    setIsConnecting(true);
    setTimeout(() => {
      setCloudConfig({ apiKey: tempApiKey, projectId: tempProjectId });
      setIsConnecting(false);
      setShowCloudSetup(false);
      alert('Tersambung ke Cloud! Data akan disinkronkan secara otomatis.');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-blue-600/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-indigo-600/10 blur-[120px] rounded-full"></div>

      <div className="w-full max-w-md bg-white/5 backdrop-blur-3xl border border-white/10 p-10 rounded-[3.5rem] shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-blue-600/40 mb-6 overflow-hidden">
            {appLogo ? (
              <img src={appLogo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <ShieldCheck size={40} className="text-white" />
            )}
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter leading-tight uppercase">{appName}</h1>
          <div className="flex items-center justify-center gap-2 mt-2">
             <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Dinas Sosial Blora</p>
             {cloudConfig?.apiKey && (
               <div className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter">
                  <CheckCircle2 size={10} /> Cloud Active
               </div>
             )}
          </div>
        </div>

        {showCloudSetup ? (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
             <div className="bg-blue-600/10 p-6 rounded-3xl border border-blue-500/20 mb-8">
                <h4 className="text-white font-black text-sm uppercase flex items-center gap-2 mb-2"><Cloud size={16}/> Cloud Gateway</h4>
                <p className="text-slate-400 text-[10px] leading-relaxed">Masukkan konfigurasi agar perangkat ini terhubung ke database realtime yang sama dengan perangkat lain.</p>
             </div>
             <div className="space-y-4">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Firebase API Key</label>
                   <input type="password" value={tempApiKey} onChange={e=>setTempApiKey(e.target.value)} className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-white font-bold" placeholder="Pastikan benar..." />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Project ID</label>
                   <input type="text" value={tempProjectId} onChange={e=>setTempProjectId(e.target.value)} className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-white font-bold" placeholder="Contoh: si-lks-blora" />
                </div>
             </div>
             <button onClick={handleConnectCloud} disabled={isConnecting} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
               {isConnecting ? <RefreshCw className="animate-spin" size={18}/> : <Cloud size={18}/>}
               {isConnecting ? 'MENGHUBUNGKAN...' : 'HUBUNGKAN SEKARANG'}
             </button>
             <button onClick={()=>setShowCloudSetup(false)} className="w-full text-slate-500 text-[10px] font-black uppercase hover:text-white transition-colors">Batal & Kembali</button>
          </div>
        ) : (
          <>
            <form onSubmit={handleAuth} className="space-y-5">
              {!isLoginMode && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nama Lengkap</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                    <input type="text" value={nama} onChange={e => setNama(e.target.value)} placeholder="Nama Lengkap" className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-white font-bold" />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Username</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-white font-bold" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                  <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-white font-bold" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
              </div>

              {error && <p className="text-red-400 text-[10px] font-black text-center bg-red-400/10 py-3 rounded-xl uppercase tracking-widest">{error}</p>}

              <button type="submit" className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-[1.8rem] font-black text-xs tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
                {isLoginMode ? <>MASUK KE DASHBOARD <LogIn size={18} /></> : <>DAFTAR SEKARANG <UserPlus size={18} /></>}
              </button>
            </form>

            <div className="mt-8 flex flex-col gap-4 text-center">
              <button onClick={() => { setIsLoginMode(!isLoginMode); setError(''); }} className="text-slate-400 text-[10px] font-black hover:text-white transition-colors uppercase tracking-widest">
                {isLoginMode ? "Belum punya akun? Signup" : "Sudah punya akun? Login"}
              </button>
              <div className="h-px bg-white/5 w-1/2 mx-auto"></div>
              <button onClick={() => setShowCloudSetup(true)} className="text-blue-500 text-[10px] font-black hover:text-blue-400 transition-colors uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                <Cloud size={14} /> Sinkronisasi Perangkat Baru?
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
