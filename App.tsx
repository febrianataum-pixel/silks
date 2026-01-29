
import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, Building2, Users, Menu, X, ChevronRight, LogOut, Bell, FileText, ClipboardList, UserCircle, ChevronLeft, Trash2, Clock, CheckCircle2 } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import LKSList from './pages/LKSList';
import AdministrasiPage from './pages/Administrasi';
import PenerimaManfaatPage from './pages/PenerimaManfaat';
import RekomendasiPage from './pages/Rekomendasi';
import ProfilePage from './pages/Profile';
import LoginPage from './pages/Login';
import { MOCK_LKS, MOCK_PM, MOCK_USERS } from './constants';
import { LKS, PenerimaManfaat as PMType, UserAccount } from './types';

type Page = 'dashboard' | 'lks' | 'administrasi' | 'pm' | 'rekomendasi' | 'profile';

interface Notification {
  id: string;
  user: string;
  action: string;
  target: string;
  time: Date;
  isRead: boolean;
}

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // App Identity State
  const [appName, setAppName] = useState('SI-LKS BLORA');
  const [appLogo, setAppLogo] = useState<string | null>(null);

  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [allUsers, setAllUsers] = useState<UserAccount[]>(MOCK_USERS);

  // App Data
  const [lksData, setLksData] = useState<LKS[]>(MOCK_LKS);
  const [pmData, setPmData] = useState<PMType[]>(MOCK_PM);

  // Notifications State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const addNotification = (action: string, target: string) => {
    if (!currentUser) return;
    const newNotif: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      user: currentUser.nama,
      action,
      target,
      time: new Date(),
      isRead: false
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 20));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
        setIsSidebarCollapsed(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogin = (user: UserAccount) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    setActivePage('dashboard');
    addNotification('Login', 'Aplikasi SI-LKS');
  };

  const handleLogout = () => {
    addNotification('Logout', 'Sesi Berakhir');
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} allUsers={allUsers} setAllUsers={setAllUsers} appName={appName} appLogo={appLogo} />;
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'lks', label: 'Data LKS', icon: <Building2 size={20} /> },
    { id: 'administrasi', label: 'Administrasi', icon: <ClipboardList size={20} /> },
    { id: 'pm', label: 'Penerima Manfaat', icon: <Users size={20} /> },
    { id: 'rekomendasi', label: 'Rekomendasi', icon: <FileText size={20} /> },
    { id: 'profile', label: 'Profil Saya', icon: <UserCircle size={20} /> },
  ];

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden font-inter">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 bg-slate-900 text-white transform transition-all duration-300 ease-in-out lg:relative lg:translate-x-0 no-print ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isSidebarCollapsed ? 'w-20' : 'w-72'}`}
      >
        <div className="h-full flex flex-col relative">
          {/* Collapse Toggle Desktop */}
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-blue-600 rounded-full items-center justify-center text-white border-4 border-slate-50 z-50 hover:scale-110 transition-transform shadow-lg"
          >
            {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          <div className={`p-6 flex items-center gap-3 transition-all duration-300 ${isSidebarCollapsed ? 'px-4' : 'px-6'}`}>
            <div className="shrink-0">
              {appLogo ? (
                <img src={appLogo} alt="Logo" className="w-10 h-10 object-contain rounded-lg" />
              ) : (
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-900/40">
                  {appName.charAt(0)}
                </div>
              )}
            </div>
            {!isSidebarCollapsed && (
              <div className="animate-in fade-in duration-300">
                <h1 className="font-black text-sm leading-tight tracking-tight uppercase whitespace-nowrap">{appName}</h1>
                <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Kab. Blora</p>
              </div>
            )}
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto no-scrollbar">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id as Page)}
                className={`w-full flex items-center transition-all group rounded-2xl relative ${
                  isSidebarCollapsed ? 'justify-center py-4 px-0' : 'px-4 py-3.5 gap-3'
                } ${
                  activePage === item.id 
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/20' 
                    : 'text-slate-500 hover:bg-slate-800 hover:text-white'
                }`}
                title={isSidebarCollapsed ? item.label : ''}
              >
                <div className={`${activePage === item.id ? 'scale-110' : 'group-hover:scale-110'} transition-transform duration-300`}>
                  {item.icon}
                </div>
                {!isSidebarCollapsed && (
                  <span className="font-bold text-sm tracking-tight">{item.label}</span>
                )}
                {!isSidebarCollapsed && activePage === item.id && (
                  <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                )}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-800 bg-slate-900/50">
             <div className={`mb-4 flex items-center transition-all ${isSidebarCollapsed ? 'justify-center' : 'px-2 gap-3'}`}>
                <div className="w-9 h-9 bg-slate-800 rounded-2xl flex items-center justify-center text-[10px] font-black uppercase overflow-hidden ring-2 ring-slate-800 shrink-0">
                   {currentUser?.avatar ? (
                      <img src={currentUser.avatar} alt="Av" className="w-full h-full object-cover" />
                   ) : (
                      <img src={`https://ui-avatars.com/api/?name=${currentUser?.nama}&background=random&color=fff`} alt="Av" />
                   )}
                </div>
                {!isSidebarCollapsed && (
                  <div className="truncate animate-in slide-in-from-left-2 duration-300">
                     <p className="text-xs font-black text-white truncate">{currentUser?.nama}</p>
                     <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{currentUser?.role}</p>
                  </div>
                )}
             </div>
            <button 
              onClick={handleLogout}
              className={`flex items-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all rounded-2xl ${
                isSidebarCollapsed ? 'justify-center w-full py-4' : 'px-4 py-3 gap-3 w-full'
              }`}
            >
              <LogOut size={20} />
              {!isSidebarCollapsed && <span className="font-bold text-sm">Keluar Sesi</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-40 no-print">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-600 transition-colors"
            >
              <Menu size={24} />
            </button>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                {menuItems.find(i => i.id === activePage)?.label}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sistem Aktif</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-5">
            {/* NOTIFICATION CENTER */}
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => {
                  setShowNotifDropdown(!showNotifDropdown);
                  if(!showNotifDropdown) {
                    setNotifications(prev => prev.map(n => ({...n, isRead: true})));
                  }
                }}
                className={`relative p-3 rounded-2xl transition-all ${showNotifDropdown ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
              >
                <Bell size={22} />
                {unreadCount > 0 && (
                  <span className="absolute top-2.5 right-2.5 w-5 h-5 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifDropdown && (
                <div className="absolute right-0 mt-4 w-96 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden z-[100] animate-in slide-in-from-top-4 duration-300">
                  <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                    <div>
                      <h4 className="font-black text-sm uppercase tracking-tight">Log Aktivitas</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Data Real-time</p>
                    </div>
                    <button onClick={() => setNotifications([])} className="text-[9px] font-black uppercase text-slate-400 hover:text-white transition-colors">Hapus Semua</button>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                    {notifications.length > 0 ? (
                      notifications.map(n => (
                        <div key={n.id} className="p-5 border-b last:border-0 hover:bg-slate-50 transition-colors flex gap-4">
                          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                            <CheckCircle2 size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-800">
                              <span className="text-blue-600 font-black">{n.user}</span> {n.action.toLowerCase()} <span className="font-black">{n.target}</span>
                            </p>
                            <div className="flex items-center gap-3 mt-1.5">
                              <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1 uppercase">
                                <Clock size={10} /> {new Intl.RelativeTimeFormat('id', { numeric: 'auto' }).format(Math.ceil((n.time.getTime() - new Date().getTime()) / 60000), 'minute')}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-20 text-center flex flex-col items-center">
                        <Bell size={48} className="text-slate-100 mb-4" />
                        <p className="text-xs font-black text-slate-300 uppercase tracking-widest">Belum ada aktivitas</p>
                      </div>
                    )}
                  </div>
                  <div className="p-4 bg-slate-50 text-center border-t">
                    <button onClick={() => setShowNotifDropdown(false)} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600">Tutup Panel</button>
                  </div>
                </div>
              )}
            </div>

            <div className="h-10 w-px bg-slate-200"></div>
            
            <button onClick={() => setActivePage('profile')} className="flex items-center gap-3 hover:bg-slate-50 p-1.5 pr-4 rounded-[1.5rem] transition-all border border-transparent hover:border-slate-100 group">
              <div className="w-10 h-10 rounded-2xl ring-2 ring-slate-100 overflow-hidden shadow-sm group-hover:scale-110 transition-transform">
                 {currentUser?.avatar ? (
                    <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                 ) : (
                    <img src={`https://ui-avatars.com/api/?name=${currentUser?.nama}&background=2563eb&color=fff`} alt="Avatar" />
                 )}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-[13px] font-black text-slate-900 leading-none mb-1">{currentUser?.nama}</p>
                <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{currentUser?.role}</p>
              </div>
            </button>
          </div>
        </header>

        {/* Page Container */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 no-scrollbar">
          <div className="max-w-7xl mx-auto pb-20">
            {activePage === 'dashboard' && <Dashboard lks={lksData} pm={pmData} />}
            {activePage === 'lks' && (
              <LKSList 
                data={lksData} 
                setData={setLksData} 
                onNotify={(action, target) => addNotification(action, target)}
              />
            )}
            {activePage === 'administrasi' && <AdministrasiPage data={lksData} />}
            {activePage === 'pm' && (
              <PenerimaManfaatPage 
                lksData={lksData} 
                pmData={pmData} 
                setPmData={setPmData} 
                onNotify={(action, target) => addNotification(action, target)}
              />
            )}
            {activePage === 'rekomendasi' && (
              <RekomendasiPage 
                lksData={lksData} 
                onNotify={(action, target) => addNotification(action, target)}
              />
            )}
            {activePage === 'profile' && currentUser && (
              <ProfilePage 
                currentUser={currentUser} 
                allUsers={allUsers} 
                setAllUsers={setAllUsers} 
                onUpdateCurrentUser={setCurrentUser}
                appName={appName}
                setAppName={setAppName}
                appLogo={appLogo}
                setAppLogo={setAppLogo}
              />
            )}
          </div>
        </div>
      </main>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 lg:hidden z-40 backdrop-blur-md no-print animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default App;
