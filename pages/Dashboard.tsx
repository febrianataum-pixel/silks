
import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
// Fix: Added ChevronRight to the lucide-react import list
import { 
  Building2, Users, X, MapPin, ArrowRight, UserCheck, Home, Globe, AlertCircle, Clock, Calendar, ExternalLink, ChevronRight
} from 'lucide-react';
import { LKS, PenerimaManfaat } from '../types';

interface DashboardProps {
  lks: LKS[];
  pm: PenerimaManfaat[];
  onNavigateToItem?: (id: string, type: 'LKS' | 'PM') => void;
}

const Dashboard: React.FC<DashboardProps> = ({ lks, pm, onNavigateToItem }) => {
  const [selectedDetail, setSelectedDetail] = useState<{ title: string; items: LKS[] | PenerimaManfaat[]; type: 'LKS' | 'PM' } | null>(null);

  const pmDalam = pm.filter(p => p.kategori === 'Dalam');
  const pmLuar = pm.filter(p => p.kategori === 'Luar');
  
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
    { label: 'Total LKS', shortLabel: 'LKS', value: lks.length, icon: <Building2 className="text-blue-600" size={20} />, color: 'bg-blue-50', items: lks, title: 'Daftar Semua Lembaga (LKS)', type: 'LKS' },
    { label: 'Total PM', shortLabel: 'PM', value: pm.length, icon: <Users className="text-indigo-600" size={20} />, color: 'bg-indigo-50', items: pm, title: 'Daftar Semua Penerima Manfaat', type: 'PM' },
    { label: 'PM Dalam', shortLabel: 'Dalam', value: pmDalam.length, icon: <Home className="text-emerald-600" size={20} />, color: 'bg-emerald-50', items: pmDalam, title: 'Penerima Manfaat (Residensial)', type: 'PM' },
    { label: 'PM Luar', shortLabel: 'Luar', value: pmLuar.length, icon: <Globe className="text-amber-600" size={20} />, color: 'bg-amber-50', items: pmLuar, title: 'Penerima Manfaat (Non-Residensial)', type: 'PM' },
  ];

  const genderData = [
    { name: 'Dalam', L: pmDalam.filter(p => p.jenisKelamin === 'L').length, P: pmDalam.filter(p => p.jenisKelamin === 'P').length },
    { name: 'Luar', L: pmLuar.filter(p => p.jenisKelamin === 'L').length, P: pmLuar.filter(p => p.jenisKelamin === 'P').length }
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
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 lg:space-y-8 pb-10">
      {/* Stats Grid - 2 columns on mobile, 4 on large */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        {stats.map((stat, idx) => (
          <button 
            key={idx} 
            onClick={() => setSelectedDetail({ title: stat.title, items: stat.items as any, type: stat.type as any })}
            className="bg-white p-4 lg:p-6 rounded-[2rem] lg:rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group text-left outline-none"
          >
            <div className={`w-10 h-10 lg:w-14 lg:h-14 ${stat.color} rounded-xl lg:rounded-2xl flex items-center justify-center mb-3 lg:mb-5 group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
              {stat.icon}
            </div>
            <p className="text-slate-400 text-[8px] lg:text-[10px] font-black uppercase tracking-widest truncate">{stat.label}</p>
            <div className="flex items-end justify-between mt-0.5">
              <h3 className="text-xl lg:text-3xl font-black text-slate-800 tracking-tighter">{stat.value}</h3>
              <ArrowRight size={14} className="text-blue-600 opacity-0 lg:group-hover:opacity-100 transition-all hidden lg:block" />
            </div>
          </button>
        ))}
      </div>

      {/* Alerts - Vertical on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className={`p-5 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] border ${lksExpired.length > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100'} flex items-start gap-4 lg:gap-6`}>
          <div className={`w-10 h-10 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl flex items-center justify-center shrink-0 ${lksExpired.length > 0 ? 'bg-red-500 text-white shadow-lg animate-pulse' : 'bg-slate-50 text-slate-300'}`}>
            <AlertCircle size={20} className="lg:hidden" />
            <AlertCircle size={28} className="hidden lg:block" />
          </div>
          <div className="min-w-0">
            <h4 className={`font-black uppercase text-[8px] lg:text-[10px] tracking-widest ${lksExpired.length > 0 ? 'text-red-600' : 'text-slate-400'}`}>Tanda Daftar Habis</h4>
            <p className="text-lg lg:text-2xl font-black text-slate-800 tracking-tighter mt-0.5">{lksExpired.length} Lembaga</p>
          </div>
        </div>

        <div className={`p-5 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] border ${lksExpiringSoon.length > 0 ? 'bg-amber-50 border-amber-100' : 'bg-white border-slate-100'} flex items-start gap-4 lg:gap-6`}>
          <div className={`w-10 h-10 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl flex items-center justify-center shrink-0 ${lksExpiringSoon.length > 0 ? 'bg-amber-500 text-white shadow-lg' : 'bg-slate-50 text-slate-300'}`}>
            <Clock size={20} className="lg:hidden" />
            <Clock size={28} className="hidden lg:block" />
          </div>
          <div className="min-w-0">
            <h4 className={`font-black uppercase text-[8px] lg:text-[10px] tracking-widest ${lksExpiringSoon.length > 0 ? 'text-amber-600' : 'text-slate-400'}`}>Segera Habis</h4>
            <p className="text-lg lg:text-2xl font-black text-slate-800 tracking-tighter mt-0.5">{lksExpiringSoon.length} Lembaga</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <div className="bg-white p-6 lg:p-8 rounded-[2.5rem] lg:rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
          <div className="mb-6 lg:mb-10">
            <h3 className="text-sm lg:text-lg font-black text-slate-800 tracking-tight">Data Gender PM</h3>
            <p className="text-[8px] lg:text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Residensial vs Non-Residensial</p>
          </div>
          <div className="h-56 lg:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={genderData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: '800' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '10px' }} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px', fontSize: '9px', fontWeight: 'bold' }} />
                <Bar dataKey="L" name="L" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={16} />
                <Bar dataKey="P" name="P" fill="#fb7185" radius={[4, 4, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 lg:p-8 rounded-[2.5rem] lg:rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
          <div className="mb-6 lg:mb-10">
            <h3 className="text-sm lg:text-lg font-black text-slate-800 tracking-tight">Sebaran Wilayah</h3>
            <p className="text-[8px] lg:text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Lembaga per Kecamatan</p>
          </div>
          <div className="h-56 lg:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="kec" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#94a3b8', fontWeight: '700' }} />
                <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="total" name="LKS" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {selectedDetail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setSelectedDetail(null)}></div>
          <div className="relative bg-white w-full max-w-3xl max-h-[80vh] rounded-[2.5rem] lg:rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-6 lg:p-10 border-b flex items-center justify-between">
              <h3 className="text-lg lg:text-2xl font-black text-slate-800 tracking-tight">{selectedDetail.title}</h3>
              <button onClick={() => setSelectedDetail(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-all"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-3">
              {selectedDetail.items.map((item: any) => (
                <button 
                  key={item.id} 
                  onClick={() => { onNavigateToItem?.(item.id, selectedDetail.type); setSelectedDetail(null); }}
                  className="w-full flex items-center justify-between p-4 border border-slate-50 rounded-2xl hover:bg-slate-50 transition-all text-left"
                >
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-800 text-sm truncate uppercase">{item.nama}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1 mt-0.5"><MapPin size={10} /> {item.kecamatan}</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
