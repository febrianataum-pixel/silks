
import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, Building2, Users, Menu, X, ChevronRight, LogOut, Bell, FileText, ClipboardList, UserCircle, ChevronLeft, Trash2, Clock, CheckCircle2, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import LKSList from './pages/LKSList';
import AdministrasiPage from './pages/Administrasi';
import PenerimaManfaatPage from './pages/PenerimaManfaat';
import RekomendasiPage from './pages/Rekomendasi';
import ProfilePage from './pages/Profile';
import LoginPage from './pages/Login';
import { MOCK_LKS, MOCK_PM, MOCK_USERS } from './constants';
import { LKS, PenerimaManfaat as PMType, UserAccount, LetterRecord } from './types';

// Firebase Imports
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc } from 'firebase/firestore';

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
  const [navContext, setNavContext] = useState<{ id: string; type: 'LKS' | 'PM' } | null>(null);

  const [appName, setAppName] = useState(() => localStorage.getItem('si-lks-appname') || 'SI-LKS BLORA');
  const [appLogo, setAppLogo] = useState<string | null>(() => localStorage.getItem('si-lks-applogo'));
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('si-lks-islogged') === 'true');
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('si-lks-currentuser');
    return saved ? JSON.parse(saved) : null;
  });
  
  // Konfigurasi Cloud Global (API KEY disimpan di level aplikasi agar perangkat baru bisa lsg konek)
  const [cloudConfig, setCloudConfig] = useState<{apiKey: string, projectId: string} | null>(() => {
    const saved = localStorage.getItem('si-lks-cloud-config');
    return saved ? JSON.parse(saved) : null;
  });

  const [allUsers, setAllUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('si-lks-allusers');
    return saved ? JSON.parse(saved) : MOCK_USERS;
  });

  const [lksData, setLksData] = useState<LKS[]>(() => {
    const saved = localStorage.getItem('si-lks-lksdata');
    return saved ? JSON.parse(saved) : MOCK_LKS;
  });
  const [pmData, setPmData] = useState<PMType[]>(() => {
    const saved = localStorage.getItem('si-lks-pmdata');
    return saved ? JSON.parse(saved) : MOCK_PM;
  });
  const [lettersData, setLettersData] = useState<LetterRecord[]>(() => {
    const saved = localStorage.getItem('si-lks-lettersdata');
    return saved ? JSON.parse(saved) : [];
  });

  // Cloud Sync State
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const isIncomingUpdate = useRef(false);

  // Persistence to LocalStorage
  useEffect(() => {
    localStorage.setItem('si-lks-appname', appName);
    if (appLogo) localStorage.setItem('si-lks-applogo', appLogo);
    localStorage.setItem('si-lks-allusers', JSON.stringify(allUsers));
    localStorage.setItem('si-lks-lksdata', JSON.stringify(lksData));
    localStorage.setItem('si-lks-pmdata', JSON.stringify(pmData));
    localStorage.setItem('si-lks-lettersdata', JSON.stringify(lettersData));
    localStorage.setItem('si-lks-islogged', isLoggedIn.toString());
    if (currentUser) localStorage.setItem('si-lks-currentuser', JSON.stringify(currentUser));
    if (cloudConfig) localStorage.setItem('si-lks-cloud-config', JSON.stringify(cloudConfig));
  }, [appName, appLogo, allUsers, lksData, pmData, lettersData, isLoggedIn, currentUser, cloudConfig]);

  // --- FIREBASE REALTIME CLOUD SYNC LOGIC ---
  useEffect(() => {
    if (!cloudConfig?.apiKey || !cloudConfig?.projectId) return;

    const firebaseConfig = {
      apiKey: cloudConfig.apiKey,
      projectId: cloudConfig.projectId,
      appId: "si-lks-blora-sync"
    };

    try {
      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      const db = getFirestore(app);
      const dataDocRef = doc(db, 'si-lks-v1', 'global_data');

      const unsubscribe = onSnapshot(dataDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const remoteData = docSnap.data();
          isIncomingUpdate.current = true;
          
          if (remoteData.lks) setLksData(remoteData.lks);
          if (remoteData.pm) setPmData(remoteData.pm);
          if (remoteData.letters) setLettersData(remoteData.letters);
          if (remoteData.appName) setAppName(remoteData.appName);
          if (remoteData.allUsers) setAllUsers(remoteData.allUsers);
          if (remoteData.appLogo) setAppLogo(remoteData.appLogo);
          
          setSyncStatus('idle');
        }
      }, (error) => {
        console.error("Firebase Sync Error:", error);
        setSyncStatus('error');
      });

      return () => unsubscribe();
    } catch (err) {
      console.error("Firebase Init Error:", err);
      setSyncStatus('error');
    }
  }, [cloudConfig]);

  // Push local changes to Cloud
  useEffect(() => {
    if (!cloudConfig?.apiKey || !cloudConfig?.projectId) return;
    if (isIncomingUpdate.current) {
      isIncomingUpdate.current = false;
      return;
    }

    const timer = setTimeout(async () => {
      setSyncStatus('syncing');
      try {
        const app = getApp();
        const db = getFirestore(app);
        const dataDocRef = doc(db, 'si-lks-v1', 'global_data');

        await setDoc(dataDocRef, {
          lks: lksData,
          pm: pmData,
          letters: lettersData,
          allUsers: allUsers,
          appName: appName,
          appLogo: appLogo,
          lastUpdated: new Date().toISOString(),
          updatedBy: currentUser?.nama || 'System'
        }, { merge: true });

        setSyncStatus('idle');
      } catch (err) {
        console.error("Cloud Push Error:", err);
        setSyncStatus('error');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [lksData, pmData, lettersData, appName, allUsers, appLogo]);

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

  const handleNavigateToDetail = (id: string, type: 'LKS' | 'PM') => {
    setNavContext({ id, type });
    setActivePage(type === 'LKS' ? 'lks' : 'pm');
  };

  if (!isLoggedIn) {
    return (
      <LoginPage 
        onLogin={handleLogin} 
        allUsers={allUsers} 
        setAllUsers={setAllUsers} 
        appName={appName} 
        appLogo={appLogo}
        cloudConfig={cloudConfig}
        setCloudConfig={setCloudConfig}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden font-inter">
      <aside className={`fixed inset-y-0 left-0 z-50 bg-slate-900 text-white transform transition-all duration-300 ease-in-out lg:relative lg:translate-x-0 no-print ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${isSidebarCollapsed ? 'w-20' : 'w-72'}`}>
        <div className="h-full flex flex-col relative">
          <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-blue-600 rounded-full items-center justify-center text-white border-4 border-slate-50 z-50 hover:scale-110 transition-transform shadow-lg">
            {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
          <div className={`p-6 flex items-center gap-3 transition-all duration-300 ${isSidebarCollapsed ? 'px-4' : 'px-6'}`}>
            <div className="shrink-0">
              {appLogo ? <img src={appLogo} alt="Logo" className="w-10 h-10 object-contain rounded-lg" /> : <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-900/40">{appName.charAt(0)}</div>}
            </div>
            {!isSidebarCollapsed && (
              <div className="animate-in fade-in duration-300">
                <h1 className="font-black text-sm leading-tight tracking-tight uppercase whitespace-nowrap">{appName}</h1>
                <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Kab. Blora</p>
              </div>
            )}
          </div>
          <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto no-scrollbar">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
              { id: 'lks', label: 'Data LKS', icon: <Building2 size={20} /> },
              { id: 'administrasi', label: 'Administrasi', icon: <ClipboardList size={20} /> },
              { id: 'pm', label: 'Penerima Manfaat', icon: <Users size={20} /> },
              { id: 'rekomendasi', label: 'Rekomendasi', icon: <FileText size={20} /> },
              { id: 'profile', label: 'Profil Saya', icon: <UserCircle size={20} /> },
            ].map((item) => (
              <button key={item.id} onClick={() => { setActivePage(item.id as Page); setNavContext(null); }} className={`w-full flex items-center transition-all group rounded-2xl relative ${isSidebarCollapsed ? 'justify-center py-4 px-0' : 'px-4 py-3.5 gap-3'} ${activePage === item.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/20' : 'text-slate-500 hover:bg-slate-800 hover:text-white'}`}>
                <div className={`${activePage === item.id ? 'scale-110' : 'group-hover:scale-110'} transition-transform duration-300`}>{item.icon}</div>
                {!isSidebarCollapsed && <span className="font-bold text-sm tracking-tight">{item.label}</span>}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-slate-800 bg-slate-900/50">
             <div className={`mb-4 flex items-center transition-all ${isSidebarCollapsed ? 'justify-center' : 'px-2 gap-3'}`}>
                <div className="w-9 h-9 bg-slate-800 rounded-2xl flex items-center justify-center text-[10px] font-black uppercase overflow-hidden ring-2 ring-slate-800 shrink-0">
                   {currentUser?.avatar ? <img src={currentUser.avatar} alt="Av" className="w-full h-full object-cover" /> : <img src={`https://ui-avatars.com/api/?name=${currentUser?.nama}&background=random&color=fff`} alt="Av" />}
                </div>
                {!isSidebarCollapsed && (
                  <div className="truncate animate-in slide-in-from-left-2 duration-300">
                     <p className="text-xs font-black text-white truncate">{currentUser?.nama}</p>
                     <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{currentUser?.role}</p>
                  </div>
                )}
             </div>
            <button onClick={handleLogout} className={`flex items-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all rounded-2xl ${isSidebarCollapsed ? 'justify-center w-full py-4' : 'px-4 py-3 gap-3 w-full'}`}><LogOut size={20} />{!isSidebarCollapsed && <span className="font-bold text-sm">Keluar Sesi</span>}</button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-0 overflow-hidden relative">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-40 no-print">
          <div className="flex items-center gap-6">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-600 transition-colors"><Menu size={24} /></button>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none">{activePage.toUpperCase()}</h2>
              <div className="flex items-center gap-4 mt-1">
                <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div><p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Sistem Aktif</p></div>
                <div className="w-px h-3 bg-slate-200"></div>
                <div className="flex items-center gap-1.5">
                  {cloudConfig?.apiKey ? (
                    syncStatus === 'syncing' ? (
                      <><RefreshCw size={10} className="text-blue-500 animate-spin" /><p className="text-[9px] text-blue-500 font-bold uppercase tracking-widest">Sinkronisasi Cloud...</p></>
                    ) : syncStatus === 'error' ? (
                      <><CloudOff size={10} className="text-red-500" /><p className="text-[9px] text-red-500 font-bold uppercase tracking-widest">Gagal Sinkron</p></>
                    ) : (
                      <><Cloud size={10} className="text-blue-500" /><p className="text-[9px] text-blue-500 font-bold uppercase tracking-widest">Cloud Aktif: Realtime</p></>
                    )
                  ) : (
                    <><CloudOff size={10} className="text-slate-300" /><p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">Mode Lokal</p></>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-5">
             {/* Notif & User profile... */}
             <button onClick={() => { setActivePage('profile'); setNavContext(null); }} className="flex items-center gap-3 hover:bg-slate-50 p-1.5 pr-4 rounded-[1.5rem] transition-all border border-transparent hover:border-slate-100 group"><div className="w-10 h-10 rounded-2xl ring-2 ring-slate-100 overflow-hidden shadow-sm group-hover:scale-110 transition-transform">{currentUser?.avatar ? <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" /> : <img src={`https://ui-avatars.com/api/?name=${currentUser?.nama}&background=2563eb&color=fff`} alt="Avatar" />}</div><div className="hidden md:block text-left"><p className="text-[13px] font-black text-slate-900 leading-none mb-1">{currentUser?.nama}</p><p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{currentUser?.role}</p></div></button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-10 no-scrollbar">
          <div className="max-w-7xl mx-auto pb-20">
            {activePage === 'dashboard' && <Dashboard lks={lksData} pm={pmData} onNavigateToItem={handleNavigateToDetail} />}
            {activePage === 'lks' && <LKSList data={lksData} setData={setLksData} initialSelectedId={navContext?.type === 'LKS' ? navContext.id : undefined} onNotify={(action, target) => addNotification(action, target)} />}
            {activePage === 'administrasi' && <AdministrasiPage data={lksData} />}
            {activePage === 'pm' && <PenerimaManfaatPage lksData={lksData} pmData={pmData} setPmData={setPmData} initialSelectedPmId={navContext?.type === 'PM' ? navContext.id : undefined} onNotify={(action, target) => addNotification(action, target)} />}
            {activePage === 'rekomendasi' && <RekomendasiPage lksData={lksData} letters={lettersData} setLetters={setLettersData} onNotify={(action, target) => addNotification(action, target)} />}
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
                cloudConfig={cloudConfig}
                setCloudConfig={setCloudConfig}
              />
            )}
          </div>
        </div>
      </main>
      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/60 lg:hidden z-40 backdrop-blur-md no-print animate-in fade-in duration-300" onClick={() => setIsSidebarOpen(false)}></div>}
    </div>
  );
};

export default App;
