import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area,
  CartesianGrid
} from 'recharts';
import { 
  Users, 
  CheckCircle2, 
  HeartPulse, 
  HelpCircle, 
  UserMinus,
  Sparkles,
  Clock,
  LayoutDashboard,
  ArrowRight,
  TrendingUp,
  BarChart2,
  Check,
  CalendarDays,
  Calendar
} from 'lucide-react';
import { supabase } from '../supabase';
import Swal from 'sweetalert2';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    tkA: 0,
    tkB: 0,
    todayPresence: { hadir: 0, sakit: 0, izin: 0, alpha: 0 }
  });
  const [monthlyPercentage, setMonthlyPercentage] = useState(0);
  const [classAttendance, setClassAttendance] = useState<any[]>([]);
  const [attendanceDetails, setAttendanceDetails] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [monthlyTrendData, setMonthlyTrendData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSlice, setActiveSlice] = useState<any>(null);

  const fetchAllData = () => {
    fetchDashboardData();
    fetchTrendData();
    fetchMonthlyStats();
    fetchMonthlyTrendData();
  };

  useEffect(() => {
    fetchAllData();

    const channel = supabase.channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, fetchAllData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, fetchAllData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, fetchAllData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMonthlyStats = async () => {
    try {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const { data: monthlyAttendance } = await supabase
        .from('attendance')
        .select('status')
        .gte('date', firstDay)
        .lte('date', lastDay);

      if (monthlyAttendance && monthlyAttendance.length > 0) {
        const total = monthlyAttendance.length;
        const present = monthlyAttendance.filter(a => a.status === 'Hadir').length;
        setMonthlyPercentage(Math.round((present / total) * 100));
      } else {
        setMonthlyPercentage(0);
      }
    } catch (error) {
      console.error('Error monthly stats:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: students } = await supabase.from('students').select('*');
      const { data: attendanceToday } = await supabase
        .from('attendance')
        .select('*, students(name, class_name)')
        .eq('date', today);

      const presence = { hadir: 0, sakit: 0, izin: 0, alpha: 0 };
      const classMap: any = {};
      
      const { data: classes } = await supabase.from('classes').select('name');
      classes?.forEach(c => {
        classMap[c.name] = { name: c.name, hadir: 0, sakit: 0, izin: 0, alfa: 0, total: 0 };
      });
      
      students?.forEach(s => {
        if (classMap[s.class_name]) classMap[s.class_name].total++;
      });

      attendanceToday?.forEach(a => {
        const status = a.status.toLowerCase();
        const cName = a.students?.class_name;
        
        if (status === 'hadir') presence.hadir++;
        if (status === 'sakit') presence.sakit++;
        if (status === 'izin') presence.izin++;
        if (status === 'alfa') presence.alpha++;

        if (cName && classMap[cName]) {
          const key = status === 'alpha' ? 'alfa' : status;
          if (classMap[cName][key] !== undefined) {
            classMap[cName][key]++;
          }
        }
      });

      setAttendanceDetails(attendanceToday || []);
      setClassAttendance(Object.values(classMap));
      setStats({
        totalStudents: students?.length || 0,
        tkA: (students?.filter(s => s.class_name === 'TK A') || []).length,
        tkB: (students?.filter(s => s.class_name === 'TK B') || []).length,
        todayPresence: presence
      });
    } catch (error) {
      console.error('Error dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendData = async () => {
    try {
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 6);

      const { data: attendanceData, error } = await supabase
        .from('attendance')
        .select('date, status')
        .gte('date', sevenDaysAgo.toISOString().split('T')[0])
        .lte('date', today.toISOString().split('T')[0]);

      if (error) throw error;
      
      const trendMap = new Map();
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        const dayName = date.toLocaleDateString('id-ID', { weekday: 'short' });
        trendMap.set(dateString, { name: dayName, hadir: 0, absen: 0 });
      }

      attendanceData.forEach(record => {
        const dayData = trendMap.get(record.date);
        if (dayData) {
          if (record.status === 'Hadir') {
            dayData.hadir++;
          } else {
            dayData.absen++;
          }
        }
      });
      
      const sortedTrendData = Array.from(trendMap.values()).reverse();
      setTrendData(sortedTrendData);
      
    } catch (err) {
      console.error('Error fetching trend data:', err);
    }
  };

  const fetchMonthlyTrendData = async () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).toISOString().split('T')[0];
    const lastDayOfMonth = new Date(year, month + 1, 0).toISOString().split('T')[0];
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const { data: students, error: studentError } = await supabase.from('students').select('id');
    const totalStudents = students?.length || 0;
    if (totalStudents === 0) return;

    const { data, error } = await supabase
      .from('attendance')
      .select('date, status')
      .gte('date', firstDayOfMonth)
      .lte('date', lastDayOfMonth);
    
    if (error) {
      console.error('Error fetching monthly trend data:', error);
      return;
    }

    const dailyAttendance = new Map();
    data.forEach(att => {
      const day = new Date(att.date).getDate();
      if (!dailyAttendance.has(day)) {
        dailyAttendance.set(day, { hadir: 0 });
      }
      if (att.status === 'Hadir') {
        dailyAttendance.get(day).hadir++;
      }
    });

    const trend = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const attendanceForDay = dailyAttendance.get(day);
      const hadirCount = attendanceForDay ? attendanceForDay.hadir : 0;
      return {
        name: `Tgl ${day}`,
        persen: Math.round((hadirCount / totalStudents) * 100)
      };
    });
    setMonthlyTrendData(trend);
  };

  const attendancePercentage = useMemo(() => {
    if (stats.totalStudents === 0) return 0;
    return Math.round((stats.todayPresence.hadir / stats.totalStudents) * 100);
  }, [stats]);

  const showDetailModal = (status: string) => {
    const list = attendanceDetails.filter(a => a.status === status);
    const color = status === 'Hadir' ? 'text-[#22C55E]' : status === 'Sakit' ? 'text-[#0EA5E9]' : status === 'Izin' ? 'text-[#F59E0B]' : 'text-[#EF4444]';
    
    Swal.fire({
      title: `<span class="font-black text-slate-800">Detail Murid ${status}</span>`,
      html: `
        <div class="text-left mt-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
          ${list.length > 0 
            ? list.map((item, idx) => `
                <div class="flex items-center justify-between py-3 border-b border-sky-50 last:border-0">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center font-black text-sky-400 text-xs">${idx + 1}</div>
                    <div>
                      <p class="font-bold text-slate-700 text-sm">${item.students?.name}</p>
                    </div>
                  </div>
                  <span class="text-[9px] font-black ${color} uppercase tracking-widest">${status}</span>
                </div>
              `).join('')
            : `<div class="py-10 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">Tidak ada data.</div>`
          }
        </div>
      `,
      confirmButtonText: 'Tutup',
      confirmButtonColor: '#0EA5E9',
      customClass: {
        popup: 'rounded-[40px] p-10',
        confirmButton: 'rounded-2xl font-black text-xs uppercase tracking-[0.2em] px-10 py-4'
      }
    });
  };

  const pieData = useMemo(() => {
    const hasData = Object.values(stats.todayPresence).some(v => v > 0);
    if (!hasData) return [{ name: 'Data Kosong', value: 1, color: '#E0F2FE', percentage: 0 }];
    
    return [
      { name: 'Hadir', value: stats.todayPresence.hadir, color: '#22C55E', percentage: Math.round((stats.todayPresence.hadir / stats.totalStudents) * 100) },
      { name: 'Sakit', value: stats.todayPresence.sakit, color: '#0EA5E9', percentage: Math.round((stats.todayPresence.sakit / stats.totalStudents) * 100) },
      { name: 'Izin', value: stats.todayPresence.izin, color: '#F59E0B', percentage: Math.round((stats.todayPresence.izin / stats.totalStudents) * 100) },
      { name: 'Alfa', value: stats.todayPresence.alpha, color: '#EF4444', percentage: Math.round((stats.todayPresence.alpha / stats.totalStudents) * 100) },
    ].filter(d => d.value > 0);
  }, [stats]);

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-xl p-4 rounded-[24px] shadow-2xl border border-[#E0F2FE] animate-in zoom-in-95 duration-200 min-w-[140px]">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }}></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{data.name}</p>
          </div>
          <p className="text-2xl font-black text-slate-800 leading-none">{data.percentage}%</p>
          <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{data.value} SISWA</p>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-xl p-5 rounded-[28px] shadow-2xl border border-[#E0F2FE] animate-in zoom-in-95 duration-200 min-w-[180px]">
          <p className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em] mb-3 border-b border-[#E0F2FE] pb-2">{label}</p>
          <div className="space-y-2">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{entry.name}</span>
                </div>
                <span className="text-sm font-black text-slate-700">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomStudentCountTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-2xl shadow-lg border border-[#E0F2FE] min-w-[120px] text-center">
          <p className="font-bold text-slate-700 text-sm">{label}</p>
          <p className="text-xs text-[#0284C7] font-medium">Total Siswa: 
            <span className="font-bold"> {payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="animate-in fade-in duration-700 pb-20">
      
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight leading-tight">
            Ringkasan Absensi
          </h1>
          <p className="text-slate-400 font-medium text-sm mt-1">Pantau kehadiran harian dan bulanan dengan mudah.</p>
        </div>
        <div className="bg-white p-4 rounded-[24px] border border-[#E0F2FE] shadow-sm flex items-center gap-4">
          <div className="bg-sky-50 p-3 rounded-2xl text-sky-400"><Calendar size={20} /></div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">SESI HARI INI</p>
            <p className="text-sm font-bold text-slate-700">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
      </header>

      <div className="mb-8 relative overflow-hidden bg-[#0EA5E9] rounded-[28px] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between shadow-xl shadow-sky-900/10 transition-all">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
          <Check size={180} className="text-white -mr-10 -mt-10 rotate-12" />
        </div>
        <div className="relative z-10 text-center md:text-left mb-6 md:mb-0">
          <h2 className="text-white text-xl md:text-2xl font-black tracking-tight leading-tight">Persentase Kehadiran Bulanan</h2>
          <p className="text-sky-100/70 text-xs font-bold mt-1 uppercase tracking-widest">Pencapaian kehadiran terbaik bulan ini</p>
        </div>
        <div className="relative z-10 flex items-center gap-6">
          <div className="text-right">
            <span className="text-white text-5xl font-black tracking-tighter tabular-nums">{monthlyPercentage}%</span>
          </div>
          <div className="w-32 md:w-48 h-2 bg-sky-900/30 rounded-full overflow-hidden">
            <div className="h-full bg-sky-300 rounded-full transition-all duration-1000 ease-out" style={{ width: `${monthlyPercentage}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'HADIR', val: stats.todayPresence.hadir, icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-[#22C55E]' },
          { label: 'SAKIT', val: stats.todayPresence.sakit, icon: HeartPulse, bg: 'bg-sky-50', text: 'text-[#0EA5E9]' },
          { label: 'IZIN', val: stats.todayPresence.izin, icon: HelpCircle, bg: 'bg-amber-50', text: 'text-[#F59E0B]' },
          { label: 'ALFA', val: stats.todayPresence.alpha, icon: UserMinus, bg: 'bg-rose-50', text: 'text-[#EF4444]' },
        ].map((item, i) => (
          <button key={i} onClick={() => showDetailModal(item.label.charAt(0) + item.label.slice(1).toLowerCase())} className="bg-white p-6 rounded-[32px] border border-[#E0F2FE] shadow-sm hover:shadow-xl transition-all group text-left active:scale-95">
            <div className={`w-12 h-12 ${item.bg} ${item.text} rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:rotate-12`}>
              <item.icon size={24} />
            </div>
            <p className={`text-[10px] font-black ${item.text} tracking-[0.15em] mb-1`}>{item.label}</p>
            <div className="flex items-center justify-between">
              <h4 className="text-4xl font-black text-slate-800 tracking-tighter">{loading ? '...' : item.val}</h4>
              <ArrowRight size={16} className="text-sky-100 group-hover:text-[#38BDF8] transition-colors" />
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-[40px] border border-[#E0F2FE] shadow-sm flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sky-50 text-[#0284C7] rounded-xl flex items-center justify-center"><BarChart2 size={20} /></div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Siswa Per Kelas</h3>
            </div>
            <span className="text-[10px] font-black text-[#0284C7] uppercase tracking-[0.2em]">Total Anak Didik</span>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classAttendance} margin={{ top: 10, right: 30, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0F2FE" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 900}} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 900}} />
                <Tooltip cursor={{fill: '#F0F9FF', radius: 12}} content={<CustomStudentCountTooltip />} />
                <Bar name="Total Siswa" dataKey="total" fill="#38BDF8" radius={[12, 12, 0, 0]} barSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-[#E0F2FE] shadow-sm flex flex-col h-[400px] relative overflow-hidden">
          <div className="flex items-center justify-between mb-8 z-10">
            <h3 className="text-lg font-black text-slate-800 tracking-tight">Status Global Harian</h3>
            <LayoutDashboard size={18} className="text-sky-200" />
          </div>
          <div className="flex-1 relative flex items-center justify-center">
            <div className={`absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-all duration-300 ${activeSlice !== null ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}`}>
              <span className="text-5xl font-black text-slate-800 tracking-tighter">{loading ? '--' : attendancePercentage}%</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">HADIR</span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={8} dataKey="value" onMouseEnter={(_, index) => setActiveSlice(index)} onMouseLeave={() => setActiveSlice(null)} stroke="none">
                  {pieData.map((entry, index) => <Cell key={`c-${index}`} fill={entry.color} className="outline-none" />)}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-8 rounded-[40px] border border-[#E0F2FE] shadow-sm flex flex-col h-[480px] mb-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-50 text-[#0284C7] rounded-xl flex items-center justify-center"><Users size={20} /></div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight">Performa Kehadiran Hari Ini</h3>
          </div>
        </div>
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={classAttendance} margin={{ top: 10, right: 10, left: -25, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0F2FE" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 900}} dy={15} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 900}} />
              <Tooltip cursor={{fill: '#F0F9FF', radius: 12}} content={<CustomBarTooltip />} />
              <Bar name="Hadir" dataKey="hadir" stackId="a" fill="#22C55E" radius={[0, 0, 0, 0]} barSize={45} />
              <Bar name="Sakit" dataKey="sakit" stackId="a" fill="#0EA5E9" barSize={45} />
              <Bar name="Izin" dataKey="izin" stackId="a" fill="#F59E0B" barSize={45} />
              <Bar name="Alfa" dataKey="alfa" stackId="a" fill="#EF4444" radius={[12, 12, 0, 0]} barSize={45} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6 mt-2 border-t border-sky-50 pt-8 pb-2">
          {[ { label: 'HADIR', color: '#22C55E' }, { label: 'SAKIT', color: '#0EA5E9' }, { label: 'IZIN', color: '#F59E0B' }, { label: 'ALFA', color: '#EF4444' } ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></div><span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">{item.label}</span></div>
          ))}
        </div>
      </div>
      
      <div className="bg-white p-8 rounded-[40px] border border-[#E0F2FE] shadow-sm flex flex-col h-[450px] mb-6">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 bg-sky-50 text-[#0284C7] rounded-2xl flex items-center justify-center"><TrendingUp size={24} /></div>
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Tren Kehadiran Mingguan</h3>
            <p className="text-[10px] font-black text-[#0284C7] uppercase tracking-widest mt-0.5">7 Hari Terakhir</p>
          </div>
        </div>
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 20, left: -25, bottom: 0 }}>
              <defs><linearGradient id="colorHadir" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#38BDF8" stopOpacity={0.15}/><stop offset="95%" stopColor="#38BDF8" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0F2FE" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} dy={15} interval={0} padding={{ left: 10, right: 10 }} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
              <Tooltip content={({ active, payload, label }) => active && payload && payload.length ? (<div className="bg-white p-4 rounded-2xl shadow-lg border border-[#E0F2FE]"><p className="text-sm font-bold text-slate-700">{label}</p><div className="mt-2 space-y-1"><div className="flex justify-between gap-4 items-center"><span className="text-xs text-[#22C55E]">Hadir</span><span className="font-bold">{payload[0].value}</span></div><div className="flex justify-between gap-4 items-center"><span className="text-xs text-[#EF4444]">Absen</span><span className="font-bold">{payload[1].value}</span></div></div></div>) : null} />
              <Area type="monotone" dataKey="hadir" stroke="#38BDF8" strokeWidth={3} fillOpacity={1} fill="url(#colorHadir)" />
              <Area type="monotone" dataKey="absen" stroke="#EF4444" strokeWidth={2} fill="transparent" strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[40px] border border-[#E0F2FE] shadow-sm flex flex-col h-[450px]">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 bg-sky-50 text-[#0284C7] rounded-2xl flex items-center justify-center"><CalendarDays size={24} /></div>
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Grafik Kehadiran Bulanan</h3>
            <p className="text-[10px] font-black text-[#0284C7] uppercase tracking-widest mt-0.5">Persentase Harian Bulan Ini</p>
          </div>
        </div>
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyTrendData} margin={{ top: 10, right: 20, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0F2FE" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 9, fontWeight: 700}} dy={10} interval={1} angle={-45} textAnchor="end" />
              <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tickFormatter={(value) => `${value}%`} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
              <Tooltip content={({ active, payload, label }) => active && payload && payload.length ? (<div className="bg-white p-3 rounded-xl shadow-lg border border-[#E0F2FE]"><p className="text-xs font-bold text-slate-700">{label}</p><p className="text-lg font-black text-[#0EA5E9]">{payload[0].value}% Hadir</p></div>) : null} cursor={{fill: '#F0F9FF', radius: 4}} />
              <Bar dataKey="persen" fill="#87CEEB" radius={[4, 4, 0, 0]} barSize={10} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
