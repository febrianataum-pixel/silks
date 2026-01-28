
import React, { useState } from 'react';
import { User, Lock, ShieldCheck, UserPlus, LogIn, Eye, EyeOff } from 'lucide-react';
import { UserAccount } from '../types';

interface LoginProps {
  onLogin: (user: UserAccount) => void;
  allUsers: UserAccount[];
  setAllUsers: React.Dispatch<React.SetStateAction<UserAccount[]>>;
  appName: string;
  appLogo: string | null;
}

const Login: React.FC<LoginProps> = ({ onLogin, allUsers, setAllUsers, appName, appLogo }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nama, setNama] = useState('');
  const [error, setError] = useState('');

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

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-blue-600/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-indigo-600/20 blur-[120px] rounded-full"></div>

      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/10 p-10 rounded-[3rem] shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-blue-600/40 mb-6 overflow-hidden">
            {appLogo ? (
              <img src={appLogo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <ShieldCheck size={40} className="text-white" />
            )}
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight leading-tight uppercase">{appName}</h1>
          <p className="text-slate-400 font-medium mt-2">Dinas Sosial Kabupaten Blora</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          {!isLoginMode && (
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text" 
                  value={nama} 
                  onChange={e => setNama(e.target.value)}
                  placeholder="Nama Lengkap Anda"
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-white transition-all"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" 
                value={username} 
                onChange={e => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-white transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-white transition-all"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && <p className="text-red-400 text-xs font-bold text-center bg-red-400/10 py-3 rounded-xl">{error}</p>}

          <button 
            type="submit" 
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {isLoginMode ? (
              <>LOGIN KE SISTEM <LogIn size={18} /></>
            ) : (
              <>DAFTAR SEKARANG <UserPlus size={18} /></>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              setError('');
            }}
            className="text-slate-400 text-xs font-bold hover:text-white transition-colors uppercase tracking-widest"
          >
            {isLoginMode ? "Belum punya akun? Signup" : "Sudah punya akun? Login"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
