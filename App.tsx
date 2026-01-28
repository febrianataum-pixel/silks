
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Building2, Users, Menu, X, ChevronRight, LogOut, Bell, FileText, ClipboardList, UserCircle } from 'lucide-react';
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

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // App Identity State (Global Settings)
  const [appName, setAppName] = useState('SI-LKS BLORA');
  const [appLogo, setAppLogo] = useState<string | null>(null);

  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [allUsers, setAllUsers] = useState<UserAccount[]>(MOCK_USERS);

  // App Data
  const [lksData, setLksData] = useState<LKS[]>(MOCK_LKS);
  const [pmData, setPmData] = useState<PMType[]>(MOCK_PM);

  // Responsive sidebar handling
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogin = (user: UserAccount) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    setActivePage('dashboard');
  };

  const handleLogout = () => {
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

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 no-print ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center gap-3">
            {appLogo ? (
              <img src={appLogo} alt="Logo" className="w-10 h-10 object-contain rounded-lg" />
            ) : (
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl">
                {appName.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="font-bold text-sm leading-tight tracking-tight uppercase">{appName}</h1>
              <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Kabupaten Blora</p>
            </div>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id as Page)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activePage === item.id 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {item.icon}
                <span className="font-medium text-sm">{item.label}</span>
                {activePage === item.id && <ChevronRight size={16} className="ml-auto" />}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-800">
             <div className="mb-4 px-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-[10px] font-black uppercase overflow-hidden ring-2 ring-slate-800">
                   {currentUser?.avatar ? (
                      <img src={currentUser.avatar} alt="Av" className="w-full h-full object-cover" />
                   ) : (
                      <img src={`https://ui-avatars.com/api/?name=${currentUser?.nama}&background=random&color=fff`} alt="Av" />
                   )}
                </div>
                <div className="truncate">
                   <p className="text-xs font-bold text-white truncate">{currentUser?.nama}</p>
                   <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{currentUser?.role}</p>
                </div>
             </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
            >
              <LogOut size={20} />
              <span className="font-medium text-sm">Logout Sesi</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40 no-print">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-600"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">
              {menuItems.find(i => i.id === activePage)?.label}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-slate-200"></div>
            <button onClick={() => setActivePage('profile')} className="flex items-center gap-3 hover:bg-slate-50 p-1 pr-3 rounded-full transition-all">
              <div className="w-9 h-9 rounded-full ring-2 ring-slate-100 overflow-hidden">
                 {currentUser?.avatar ? (
                    <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                 ) : (
                    <img src={`https://ui-avatars.com/api/?name=${currentUser?.nama}&background=2563eb&color=fff`} alt="Avatar" />
                 )}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-black text-slate-800 leading-none mb-0.5">{currentUser?.nama}</p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{currentUser?.role}</p>
              </div>
            </button>
          </div>
        </header>

        {/* Page Container */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {activePage === 'dashboard' && <Dashboard lks={lksData} pm={pmData} />}
            {activePage === 'lks' && <LKSList data={lksData} setData={setLksData} />}
            {activePage === 'administrasi' && <AdministrasiPage data={lksData} />}
            {activePage === 'pm' && <PenerimaManfaatPage lksData={lksData} pmData={pmData} setPmData={setPmData} />}
            {activePage === 'rekomendasi' && <RekomendasiPage lksData={lksData} />}
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
          className="fixed inset-0 bg-black/50 lg:hidden z-40 backdrop-blur-sm no-print"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default App;
