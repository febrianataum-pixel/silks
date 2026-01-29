
import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { 
  Building2, Users, X, MapPin, ArrowRight, UserCheck, Home, Globe, AlertCircle, Clock, Calendar, ExternalLink
} from 'lucide-react';
import { LKS, PenerimaManfaat } from '../types';

interface DashboardProps {
  lks: LKS[];
  pm: PenerimaManfaat[];
  onNavigateToItem?: (id: string, type: 'LKS' | 'PM') => void;
}

const Dashboard: React.FC<DashboardProps> = ({ lks, pm, onNavigateToItem }) => {
  const [selectedDetail, setSelectedDetail] = useState<{ title: string; items: LKS[] | PenerimaManfaat[]; type: 'LKS' | 'PM' } | null>(null);

  // Statistics Calculation
  const pmDalam = pm.filter(p => p.kategori === 'Dalam');
  const pmLuar = pm.filter(p => p.kategori === 'Luar');
  
  // Expiry Logic
  const today = new Date();
  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(today.getMonth() + 6);

  const lksExpired = lks.filter(i => {
    const expiryDate = new Date(i.masaBerlakuTandaDaftar);
    return expiryDate < today;
  });

  const lksExpiringSoon = lks.filter(i => {
    const expiryDate = new Date(i.masaBerlakuTandaDaftar);
    return expiryDate >= today && expiryDate <= sixMonthsFromNow;
  });

  const stats = [
    { label: 'Total LKS Terdaftar', value: lks.length, icon: <Building2 className="text-blue-600" />, color: 'bg-blue-50', items: lks, title: 'Daftar Semua Lembaga (LKS)', type: 'LKS' },
    { label: 'Total Penerima Manfaat', value: pm.length, icon: <Users className="text-indigo-600" />, color: 'bg-indigo-50', items: pm, title: 'Daftar Semua Penerima Manfaat', type: 'PM' },
    { label: 'PM Dalam Panti', value: pmDalam.length, icon: <Home className="text-emerald-600" />, color: 'bg-emerald-50', items: pmDalam, title: 'Penerima Manfaat (Residensial)', type: 'PM' },
    { label: 'PM Luar Panti', value: pmLuar.length, icon: <Globe className="text-amber-600" />, color: 'bg-amber-50', items: pmLuar, title: 'Penerima Manfaat (Non-Residensial)', type: 'PM' },
  ];

  // Gender Distribution Data
  const genderData = [
    {
      name: 'Dalam Panti',
      L: pmDalam.filter(p => p.jenisKelamin === 'L').length,
      P: pmDalam.filter(p => p.jenisKelamin === 'P').length,
    },
    {
      name: 'Luar Panti',
      L: pmLuar.filter(p => p.jenisKelamin === 'L').length,
      P: pmLuar.filter(p => p.jenisKelamin === 'P').length,
    }
  ];

  const pieData = [
    { name: 'Grade A', value: lks.filter(i => i.statusAkreditasi === 'A').length, color: '#2563eb' },
    { name: 'Grade B', value: lks.filter(i => i.statusAkreditasi === 'B').length, color: '#10b981' },
    { name: 'Grade C', value: lks.filter(i => i.statusAkreditasi === 'C').length, color: '#f59e0b' },
    { name: 'Belum', value: lks.filter(i => i.statusAkreditasi === 'Belum').length, color: '#94a3b8' },
  ];

  const barData = lks.reduce((acc: any[], curr) => {
    const existing = acc.find(i => i.kec === curr.kecamatan);
    if (existing) existing.total += 1;
    else acc.push({ kec: curr.kecamatan, total: 1 });
    return acc;
  }, []).sort((a, b) => b.total - a.total).slice(0, 8);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8 pb-10">
      {/* Stats Indicators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <button 
            key={idx} 
            onClick={() => setSelectedDetail({ title: stat.title, items: stat.items as any, type: stat.type as any })}
            className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group text-left outline-none"
          >
            <div className={`w-14 h-14 ${stat.color} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
              {stat.icon}
            </div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.1em]">{stat.label}</p>
            <div className="flex items-end justify-between mt-1">
              <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{stat.value}</h3>
              <div className="p-2 bg-slate-50 rounded-full opacity-0 group-hover:opacity-100 transition-all">
                <ArrowRight size={16} className="text-blue-600" />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Expiry Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expired Alerts */}
        <div className={`p-8 rounded-[2.5rem] border ${lksExpired.length > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100'} shadow-sm flex items-start gap-6`}>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${lksExpired.length > 0 ? 'bg-red-500 text-white shadow-lg shadow-red-200 animate-pulse' : 'bg-slate-50 text-slate-300'}`}>
            <AlertCircle size={28} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className={`font-black uppercase text-[10px] tracking-widest ${lksExpired.length > 0 ? 'text-red-600' : 'text-slate-400'}`}>Tanda Daftar Habis Masa</h4>
            <div className="mt-2">
              {lksExpired.length > 0 ? (
                <div className="space-y-1">
                  <p className="text-2xl font-black text-slate-800 tracking-tighter">{lksExpired.length} Lembaga</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {lksExpired.slice(0, 3).map(l => (
                      <span key={l.id} className="px-2 py-1 bg-white border border-red-200 rounded-lg text-[10px] font-bold text-red-600 truncate max-w-[150px]">{l.nama}</span>
                    ))}
                    {lksExpired.length > 3 && <button onClick={() => setSelectedDetail({ title: 'Tanda Daftar Habis Masa', items: lksExpired, type: 'LKS' })} className="px-2 py-1 bg-red-600 text-white rounded-lg text-[10px] font-bold">+{lksExpired.length - 3} lainnya</button>}
                  </div>
                </div>
              ) : (
                <p className="text-sm font-medium text-slate-400 italic">Semua tanda daftar valid.</p>
              )}
            </div>
          </div>
        </div>

        {/* Expiring Soon Alerts */}
        <div className={`p-8 rounded-[2.5rem] border ${lksExpiringSoon.length > 0 ? 'bg-amber-50 border-amber-100' : 'bg-white border-slate-100'} shadow-sm flex items-start gap-6`}>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${lksExpiringSoon.length > 0 ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' : 'bg-slate-50 text-slate-300'}`}>
            <Clock size={28} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className={`font-black uppercase text-[10px] tracking-widest ${lksExpiringSoon.length > 0 ? 'text-amber-600' : 'text-slate-400'}`}>Perlu Perpanjangan (6 Bln)</h4>
            <div className="mt-2">
              {lksExpiringSoon.length > 0 ? (
                <div className="space-y-1">
                  <p className="text-2xl font-black text-slate-800 tracking-tighter">{lksExpiringSoon.length} Lembaga</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {lksExpiringSoon.slice(0, 3).map(l => (
                      <span key={l.id} className="px-2 py-1 bg-white border border-amber-200 rounded-lg text-[10px] font-bold text-amber-700 truncate max-w-[150px]">{l.nama}</span>
                    ))}
                    {lksExpiringSoon.length > 3 && <button onClick={() => setSelectedDetail({ title: 'Akan Habis Masa (6 Bulan)', items: lksExpiringSoon, type: 'LKS' })} className="px-2 py-1 bg-amber-600 text-white rounded-lg text-[10px] font-bold">+{lksExpiringSoon.length - 3} lainnya</button>}
                  </div>
                </div>
              ) : (
                <p className="text-sm font-medium text-slate-400 italic">Belum ada perpanjangan mendesak.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* PM Gender Distribution Grouped Chart */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Distribusi PM Berdasarkan Gender</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Komparasi Layanan Residensial & Non-Residensial</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={genderData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: '800' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip 
                   cursor={{fill: '#f8fafc'}} 
                   contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '15px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold' }} />
                <Bar dataKey="L" name="Laki-laki" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={24} />
                <Bar dataKey="P" name="Perempuan" fill="#fb7185" radius={[6, 6, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* LKS Distribution by Sub-district */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Sebaran Lembaga</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Wilayah Kecamatan (Top 8)</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="kec" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: '700' }} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="total" name="LKS" fill="#6366f1" radius={[12, 12, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Accreditation Pie Section */}
      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl">
        <div className="flex flex-col md:flex-row gap-12 items-center">
          <div className="w-full md:w-1/3">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Status Akreditasi LKS</h3>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">Persentase kualitas layanan lembaga kesejahteraan sosial di Kabupaten Blora berdasarkan penilaian formal.</p>
            <div className="mt-8 space-y-3">
              {pieData.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{backgroundColor: item.color}}></div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.name}</span>
                  </div>
                  <span className="text-xs font-black text-slate-800">{Math.round((item.value / lks.length) * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="w-full md:w-2/3 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={80} outerRadius={110} paddingAngle={8} dataKey="value" stroke="none">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '15px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedDetail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setSelectedDetail(null)}></div>
          <div className="relative bg-white w-full max-w-3xl max-h-[80vh] rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 text-white rounded-2xl flex items-center justify-center shadow-lg ${selectedDetail.title.includes('Habis') ? 'bg-red-600 shadow-red-200' : 'bg-blue-600 shadow-blue-200'}`}>
                  {selectedDetail.type === 'LKS' ? <Building2 size={28} /> : <UserCheck size={28} />}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">{selectedDetail.title}</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2">{selectedDetail.items.length} Entitas ditemukan</p>
                </div>
              </div>
              <button onClick={() => setSelectedDetail(null)} className="p-3 hover:bg-white rounded-2xl transition-all shadow-sm"><X size={24} className="text-slate-400" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-10">
              <div className="grid grid-cols-1 gap-4">
                {selectedDetail.items.map((item: any) => (
                  <button 
                    key={item.id} 
                    onClick={() => {
                      if(onNavigateToItem) {
                        onNavigateToItem(item.id, selectedDetail.type);
                        setSelectedDetail(null);
                      }
                    }}
                    className="w-full flex items-center justify-between p-6 border border-slate-50 rounded-3xl hover:bg-slate-50 hover:border-blue-100 transition-all group text-left"
                  >
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition-colors">{item.nama}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs text-slate-400 flex items-center gap-1 font-medium"><MapPin size={12} /> {item.kecamatan || item.alamat}</p>
                        {item.statusAkreditasi && (
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${item.statusAkreditasi === 'A' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>Grade {item.statusAkreditasi}</span>
                        )}
                        {item.masaBerlakuTandaDaftar && (
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase flex items-center gap-1 ${new Date(item.masaBerlakuTandaDaftar) < today ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                            <Calendar size={10} /> Berlaku S/D: {new Date(item.masaBerlakuTandaDaftar).toLocaleDateString('id-ID')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all text-blue-600">
                      <span className="text-[10px] font-black uppercase tracking-widest">Buka Detail</span>
                      <ExternalLink size={18} className="group-hover:translate-x-1 transition-all" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
