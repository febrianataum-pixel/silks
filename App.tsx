
import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, Building2, Users, Menu, X, ChevronRight, LogOut, Bell, FileText, ClipboardList, UserCircle, ChevronLeft, Trash2, Clock, CheckCircle2, Cloud, CloudOff, RefreshCw, AlertCircle, CheckCircle, SearchCode, Filter } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import LKSList from './pages/LKSList';
import AdministrasiPage from './pages/Administrasi';
import PenerimaManfaatPage from './pages/PenerimaManfaat';
import AdvancedSearchPage from './pages/AdvancedSearch';
import RekomendasiPage from './pages/Rekomendasi';
import ProfilePage from './pages/Profile';
import LoginPage from './pages/Login';
import { MOCK_LKS, MOCK_PM, MOCK_USERS } from './constants';
import { LKS, PenerimaManfaat as PMType, UserAccount, LetterRecord } from './types';

// Firebase Imports
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc, getDoc, collection, writeBatch, query, where, getDocs } from 'firebase/firestore';

type Page = 'dashboard' | 'lks' | 'administrasi' | 'pm' | 'pencarian' | 'rekomendasi' | 'profile';

interface Notification {
  id: string;
  user: string;
  action: string;
  target: string;
  time: Date;
  isRead: boolean;
}

const APP_VERSION = "v1.3.0-stable";

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [navContext, setNavContext] = useState<{ id: string; type: 'LKS' | 'PM' } | null>(null);
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  const [appName, setAppName] = useState(() => localStorage.getItem('si-lks-appname') || 'SI-LKS BLORA');
  const [appLogo, setAppLogo] = useState<string | null>(() => localStorage.getItem('si-lks-applogo') || null);
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('si-lks-islogged') === 'true');
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('si-lks-currentuser');
    return saved ? JSON.parse(saved) : null;
  });
  
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

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('si-lks-notifications');
    return saved ? JSON.parse(saved).map((n: any) => ({ ...n, time: new Date(n.time) })) : [];
  });

  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'connected'>('idle');
  const isRemoteUpdate = useRef<boolean>(false);
  const syncTimeoutRef = useRef<any>(null);
  const lastSyncedLks = useRef<string>('');
  const lastSyncedPm = useRef<string>('');

  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('si-lks-appname', appName);
      localStorage.setItem('si-lks-applogo', appLogo || '');
      localStorage.setItem('si-lks-allusers', JSON.stringify(allUsers));
      localStorage.setItem('si-lks-lksdata', JSON.stringify(lksData));
      localStorage.setItem('si-lks-pmdata', JSON.stringify(pmData));
      localStorage.setItem('si-lks-lettersdata', JSON.stringify(lettersData));
      localStorage.setItem('si-lks-islogged', isLoggedIn.toString());
      localStorage.setItem('si-lks-notifications', JSON.stringify(notifications));
      if (currentUser) localStorage.setItem('si-lks-currentuser', JSON.stringify(currentUser));
      if (cloudConfig) localStorage.setItem('si-lks-cloud-config', JSON.stringify(cloudConfig));
      setStorageError(null);
    } catch (err: any) {
      console.error("Storage Error:", err);
      if (err.name === 'QuotaExceededError' || err.code === 22) {
        setStorageError("Memori Penyimpanan Penuh! Hapus beberapa dokumen PDF untuk menambah data baru.");
      } else {
        setStorageError("Gagal menyimpan data ke memori lokal.");
      }
    }
  }, [appName, appLogo, allUsers, lksData, pmData, lettersData, isLoggedIn, currentUser, cloudConfig, notifications]);

  const [isGoogleConnected, setIsGoogleConnected] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        setIsGoogleConnected(true);
        addNotification('Koneksi', 'Google Drive Berhasil');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (!cloudConfig?.apiKey || !cloudConfig?.projectId) {
      setSyncStatus('idle');
      return;
    }

    try {
      const firebaseConfig = {
        apiKey: cloudConfig.apiKey,
        authDomain: `${cloudConfig.projectId}.firebaseapp.com`,
        projectId: cloudConfig.projectId,
      };

      const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      const db = getFirestore(firebaseApp);
      
      const projectRef = doc(db, 'projects', cloudConfig.projectId);
      const lksCol = collection(db, 'projects', cloudConfig.projectId, 'lks');
      const pmCol = collection(db, 'projects', cloudConfig.projectId, 'pm');

      // Listen to Config
      const unsubConfig = onSnapshot(projectRef, (snapshot) => {
        if (snapshot.exists()) {
          const cloud = snapshot.data();
          isRemoteUpdate.current = true;
          if (cloud.appName) setAppName(cloud.appName);
          if (cloud.appLogo) setAppLogo(cloud.appLogo);
          if (cloud.allUsers) setAllUsers(cloud.allUsers);
          if (cloud.lettersData) setLettersData(cloud.lettersData);
          if (cloud.notifications) setNotifications(cloud.notifications.map((n:any)=>({...n, time: new Date(n.time)})));
          setTimeout(() => { isRemoteUpdate.current = false; }, 1000);
        }
      });

      // Listen to LKS Collection
      const unsubLks = onSnapshot(lksCol, (snapshot) => {
        if (!snapshot.empty) {
          isRemoteUpdate.current = true;
          const data = snapshot.docs.map(d => d.data() as LKS);
          setLksData(data);
          setTimeout(() => { isRemoteUpdate.current = false; }, 1000);
        }
      });

      // Listen to PM Collection
      const unsubPm = onSnapshot(pmCol, (snapshot) => {
        if (!snapshot.empty) {
          isRemoteUpdate.current = true;
          const data = snapshot.docs.map(d => d.data() as PMType);
          setPmData(data);
          setTimeout(() => { isRemoteUpdate.current = false; }, 1000);
        }
      });

      setSyncStatus('connected');

      return () => {
        unsubConfig();
        unsubLks();
        unsubPm();
      };
    } catch (err) {
      console.error("Firebase Init Error:", err);
      setSyncStatus('error');
    }
  }, [cloudConfig]);

  // Optimized Partial Sync Logic
  useEffect(() => {
    if (syncStatus !== 'connected' || isRemoteUpdate.current || !cloudConfig) return;

    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(async () => {
      setSyncStatus('syncing');
      try {
        const db = getFirestore();
        const projectRef = doc(db, 'projects', cloudConfig.projectId);
        
        // 1. Sync Config & Small Data (Always merge)
        await setDoc(projectRef, {
          appName, appLogo, allUsers, lettersData,
          notifications: notifications.map(n => ({...n, time: n.time.toISOString()})),
          lastSync: new Date().toISOString()
        }, { merge: true });

        // 2. Partial Sync LKS
        const currentLksStr = JSON.stringify(lksData);
        if (currentLksStr !== lastSyncedLks.current) {
          const prevLks = lastSyncedLks.current ? JSON.parse(lastSyncedLks.current) as LKS[] : [];
          
          // Find changed or new
          const changedLks = lksData.filter(curr => {
            const prev = prevLks.find(p => p.id === curr.id);
            return !prev || JSON.stringify(prev) !== JSON.stringify(curr);
          });

          for (const lks of changedLks) {
            const lksDoc = doc(db, 'projects', cloudConfig.projectId, 'lks', lks.id);
            await setDoc(lksDoc, lks, { merge: true });
          }
          
          lastSyncedLks.current = currentLksStr;
        }

        // 3. Partial Sync PM
        const currentPmStr = JSON.stringify(pmData);
        if (currentPmStr !== lastSyncedPm.current) {
          const prevPm = lastSyncedPm.current ? JSON.parse(lastSyncedPm.current) as PMType[] : [];
          
          // Find changed or new
          const changedPm = pmData.filter(curr => {
            const prev = prevPm.find(p => p.id === curr.id);
            return !prev || JSON.stringify(prev) !== JSON.stringify(curr);
          });

          if (changedPm.length > 0) {
            const pmBatchSize = 50;
            for (let i = 0; i < changedPm.length; i += pmBatchSize) {
              const batch = writeBatch(db);
              const chunk = changedPm.slice(i, i + pmBatchSize);
              chunk.forEach(pm => {
                const pmDoc = doc(db, 'projects', cloudConfig.projectId, 'pm', pm.id);
                batch.set(pmDoc, pm, { merge: true });
              });
              await batch.commit();
            }
          }
          
          lastSyncedPm.current = currentPmStr;
        }

        setSyncStatus('connected');
      } catch (err: any) {
        console.error("Cloud Sync Error:", err);
        setSyncStatus('error');
        if (err.message && err.message.includes('too large')) {
          setStorageError("Gagal Sinkronisasi: Data terlalu besar. Hubungi pengembang.");
        }
      }
    }, 2000); // Reduced to 2 seconds for snappier feel

    return () => clearTimeout(syncTimeoutRef.current);
  }, [lksData, pmData, lettersData, allUsers, appName, appLogo, notifications, syncStatus, cloudConfig]);

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
    setNotifications(prev => [newNotif, ...prev].slice(0, 50));
  };

  const handleLogin = (user: UserAccount) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    setActivePage('dashboard');
    addNotification('Login', 'Aplikasi');
  };

  const handleLogout = () => {
    addNotification('Logout', 'Sesi');
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

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden font-inter relative">
      {/* SIDEBAR - Hanya untuk Desktop */}
      <aside className={`fixed inset-y-0 left-0 z-50 bg-slate-900 text-white transform transition-all duration-300 ease-in-out lg:relative lg:translate-x-0 hidden lg:flex flex-col no-print ${isSidebarCollapsed ? 'w-20' : 'w-72'}`}>
        <div className="h-full flex flex-col relative">
          <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="absolute -right-3 top-20 w-6 h-6 bg-blue-600 rounded-full items-center justify-center text-white border-4 border-slate-50 z-50 hover:scale-110 transition-transform shadow-lg">
            {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
          <div className={`p-6 flex items-center gap-3 transition-all duration-300 ${isSidebarCollapsed ? 'px-4' : 'px-6'}`}>
            <div className="shrink-0">
              {appLogo ? <img src={appLogo} alt="Logo" className="w-10 h-10 object-contain rounded-lg bg-white p-1" /> : <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-900/40">{appName.charAt(0)}</div>}
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
              { id: 'pencarian', label: 'Pencarian PM', icon: <Filter size={20} /> },
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
            <button onClick={handleLogout} className={`flex items-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all rounded-2xl mb-2 ${isSidebarCollapsed ? 'justify-center w-full py-4' : 'px-4 py-3 gap-3 w-full'}`}><LogOut size={20} />{!isSidebarCollapsed && <span className="font-bold text-sm">Keluar Sesi</span>}</button>
            <div className={`px-4 pt-2 flex ${isSidebarCollapsed ? 'justify-center' : 'justify-start'}`}>
               <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest leading-none select-none">{APP_VERSION}</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-0 overflow-hidden relative pb-20 lg:pb-0">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-40 no-print">
          <div className="flex items-center gap-6">
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none">{activePage.toUpperCase()}</h2>
              <div className="flex items-center gap-4 mt-1">
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'connected' ? 'bg-emerald-500' : syncStatus === 'syncing' ? 'bg-blue-500 animate-pulse' : syncStatus === 'error' ? 'bg-red-500' : 'bg-slate-300'}`}></div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                    {syncStatus === 'connected' ? 'Cloud Connected' : syncStatus === 'syncing' ? 'Syncing...' : syncStatus === 'error' ? 'Sync Error' : 'Local Mode'}
                  </p>
                </div>
                {storageError && (
                  <div className="flex items-center gap-1.5 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100 animate-pulse">
                    <AlertCircle size={10} className="text-rose-500" />
                    <p className="text-[8px] text-rose-600 font-black uppercase tracking-tighter">{storageError}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="relative">
                <button onClick={() => setShowNotifPanel(!showNotifPanel)} className="p-3 bg-slate-50 text-slate-500 rounded-2xl hover:bg-slate-100 transition-all relative group">
                  <Bell size={20} />
                  {unreadCount > 0 && <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white">{unreadCount}</span>}
                </button>
                {showNotifPanel && (
                  <div className="absolute top-16 right-0 w-80 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 z-[100] animate-in slide-in-from-top-4 duration-300 overflow-hidden">
                    <div className="p-6 border-b flex items-center justify-between bg-slate-50/50">
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-800">Pemberitahuan</h4>
                      <button onClick={() => { setNotifications(notifications.map(n => ({...n, isRead: true}))); setShowNotifPanel(false); }} className="text-[9px] font-black text-blue-600 uppercase hover:underline">Baca Semua</button>
                    </div>
                    <div className="max-h-96 overflow-y-auto no-scrollbar">
                      {notifications.length > 0 ? notifications.map(n => (
                        <div key={n.id} className={`p-4 border-b last:border-0 transition-colors ${n.isRead ? 'opacity-60' : 'bg-blue-50/30'}`}>
                          <div className="flex gap-3">
                             <div>
                               <p className="text-xs font-bold text-slate-800"><span className="text-blue-600">{n.user}</span> {n.action} <span className="text-slate-900 font-black">{n.target}</span></p>
                               <p className="text-[9px] text-slate-400 font-medium mt-1 uppercase">{n.time.toLocaleTimeString('id-ID')}</p>
                             </div>
                          </div>
                        </div>
                      )) : (
                        <div className="p-10 text-center text-slate-300 italic text-xs font-medium">Belum ada aktivitas baru.</div>
                      )}
                    </div>
                  </div>
                )}
             </div>
             <div className="p-3 bg-slate-50 text-slate-400 rounded-2xl hidden md:flex">
               {syncStatus === 'connected' ? <Cloud size={20} className="text-blue-500" /> : <CloudOff size={20} />}
             </div>
             <button onClick={() => setActivePage('profile')} className="flex items-center gap-3 hover:bg-slate-50 p-1.5 pr-4 rounded-[1.5rem] transition-all border border-transparent">
                <div className="w-10 h-10 rounded-2xl ring-2 ring-slate-100 overflow-hidden shadow-sm">
                   {currentUser?.avatar ? <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" /> : <img src={`https://ui-avatars.com/api/?name=${currentUser?.nama}&background=2563eb&color=fff`} alt="Avatar" />}
                </div>
                <div className="hidden md:block text-left">
                   <p className="text-[13px] font-black text-slate-900 leading-none mb-1">{currentUser?.nama}</p>
                   <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{currentUser?.role}</p>
                </div>
             </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-10 no-scrollbar">
          <div className="max-w-7xl mx-auto pb-20 lg:pb-10">
            {activePage === 'dashboard' && <Dashboard lks={lksData} pm={pmData} onNavigateToItem={handleNavigateToDetail} />}
            {activePage === 'lks' && <LKSList data={lksData} setData={setLksData} initialSelectedId={navContext?.type === 'LKS' ? navContext.id : undefined} onNotify={addNotification} appLogo={appLogo} />}
            {activePage === 'administrasi' && <AdministrasiPage data={lksData} setData={setLksData} onNotify={addNotification} />}
            {activePage === 'pm' && <PenerimaManfaatPage lksData={lksData} pmData={pmData} setPmData={setPmData} initialSelectedPmId={navContext?.type === 'PM' ? navContext.id : undefined} onNotify={addNotification} />}
            {activePage === 'pencarian' && <AdvancedSearchPage lksData={lksData} pmData={pmData} />}
            {activePage === 'rekomendasi' && <RekomendasiPage lksData={lksData} letters={lettersData} setLetters={setLettersData} onNotify={addNotification} appLogo={appLogo} />}
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
                isGoogleConnected={isGoogleConnected}
                forcePush={() => {
                  setSyncStatus('syncing');
                  // Trigger the sync effect
                  const db = getFirestore();
                  setDoc(doc(db, 'projects', cloudConfig!.projectId), { lastSync: new Date().toISOString() }, { merge: true });
                }}
              />
            )}
          </div>
        </div>

        {/* MOBILE BOTTOM NAVIGATION */}
        <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-xl border-t border-slate-100 flex items-center justify-around px-4 lg:hidden z-[100] no-print shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.1)] rounded-t-[2.5rem]">
          {[
            { id: 'dashboard', icon: <LayoutDashboard size={24} /> },
            { id: 'lks', icon: <Building2 size={24} /> },
            { id: 'pm', icon: <Users size={24} /> },
            { id: 'pencarian', icon: <Filter size={24} /> },
            { id: 'profile', icon: <UserCircle size={24} /> },
          ].map((item) => (
            <button 
              key={item.id} 
              onClick={() => { setActivePage(item.id as Page); setNavContext(null); }}
              className={`p-3 transition-all duration-300 relative rounded-2xl ${activePage === item.id ? 'text-blue-600 bg-blue-50/50' : 'text-slate-400'}`}
            >
              <div className={`${activePage === item.id ? 'scale-110' : ''} transition-transform`}>{item.icon}</div>
              {activePage === item.id && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"></span>}
            </button>
          ))}
        </nav>

      </main>
    </div>
  );
};

export default App;
