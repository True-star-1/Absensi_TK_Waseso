
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Layers, 
  Users, 
  CalendarCheck, 
  ClipboardList, 
  RefreshCw,
  LogOut,
  ClipboardCheck as AppIcon,
  Menu,
  X,
  CloudCog
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import AttendanceForm from './components/AttendanceForm';
import AttendanceList from './components/AttendanceList';
import StudentData from './components/StudentData';
import ClassData from './components/ClassData';
import Swal from 'sweetalert2';
import { DataProvider, useData } from './DataContext'; // Import Provider

const SyncPage = () => {
  const { refreshData } = useData();
  const [isSyncing, setIsSyncing] = useState(false);
  
  const handleSync = async () => {
    setIsSyncing(true);
    // Tampilkan toast loading halus
    const toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
    });
    
    toast.fire({
        icon: 'info',
        title: 'Menyinkronkan data...'
    });

    try {
        await refreshData();
        
        // Sedikit delay buatan agar terasa prosesnya (opsional, untuk UX)
        await new Promise(resolve => setTimeout(resolve, 800));

        Swal.fire({
            title: 'Sinkronisasi Selesai!',
            text: 'Semua data telah diperbarui dari cloud.',
            icon: 'success',
            confirmButtonColor: '#0EA5E9',
            confirmButtonText: 'OKE SIAP',
            customClass: {
                popup: 'rounded-[32px] p-8',
                confirmButton: 'rounded-xl font-black text-xs uppercase tracking-widest px-8 py-3.5'
            }
        });
    } catch (e) {
        Swal.fire('Gagal', 'Terjadi kesalahan jaringan.', 'error');
    } finally {
        setIsSyncing(false);
    }
  };

  return (
    <div className="h-[75vh] flex flex-col items-center justify-center text-center animate-in p-6">
      
      <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-xl shadow-slate-100/50 max-w-sm w-full relative overflow-hidden group">
         {/* Decorative Background Elements */}
         <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#38BDF8] to-[#0284C7]"></div>
         <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-sky-50 rounded-full blur-3xl opacity-60"></div>

         <div className="relative z-10 flex flex-col items-center">
            <div className={`w-20 h-20 bg-sky-50 text-[#0EA5E9] rounded-[24px] flex items-center justify-center mb-6 shadow-sm border border-sky-100 transition-all duration-1000 ${isSyncing ? 'animate-spin' : 'group-hover:scale-110'}`}>
                <RefreshCw size={36} strokeWidth={2.5} />
            </div>
            
            <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Sinkronisasi Cloud</h2>
            
            <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8 max-w-[240px]">
                Data dicadangkan secara <span className="text-sky-500 font-bold">real-time</span> ke database.
            </p>
            
            <button 
                onClick={handleSync}
                disabled={isSyncing}
                className="w-full py-4 bg-[#38BDF8] hover:bg-[#0EA5E9] disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl font-black text-xs shadow-lg shadow-sky-200 hover:shadow-sky-300 transition-all active:scale-95 uppercase tracking-[0.15em]"
            >
                {isSyncing ? 'MEMPROSES...' : 'SINKRON MANUAL'}
            </button>
            
            <div className="mt-6 flex items-center gap-2 text-[10px] font-bold text-emerald-500 bg-emerald-50 px-3 py-1.5 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                SYSTEM ONLINE
            </div>
         </div>
      </div>

    </div>
  );
};

const AppContent: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const links = [
    { path: '/', icon: Home, label: 'Beranda' },
    { path: '/kelas', icon: Layers, label: 'Data Kelas' },
    { path: '/siswa', icon: Users, label: 'Data Siswa' },
    { path: '/absen', icon: CalendarCheck, label: 'Absensi' },
    { path: '/laporan', icon: ClipboardList, label: 'Laporan' },
    { path: '/sync', icon: RefreshCw, label: 'Sinkronisasi' },
  ];

  const bottomNavLinks = links.filter(link => link.label !== 'Sinkronisasi');

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-[#F0F9FF] flex flex-col md:flex-row font-medium">
      {/* MOBILE HEADER */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-[#E0F2FE] sticky top-0 z-[100] no-print">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#0284C7] rounded-lg flex items-center justify-center text-white shadow-md">
            <AppIcon size={18} />
          </div>
          <h1 className="text-sm font-black tracking-tight text-[#0284C7] uppercase">Absensi TK</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsSidebarOpen(true)} className="p-1.5 text-slate-500">
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 z-[110] w-60 bg-[#0284C7] border-r border-[#38BDF8] p-5 transform transition-transform duration-300 ease-in-out no-print
        md:translate-x-0 md:static md:flex md:flex-col
        ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between mb-8 px-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#0EA5E9] rounded-lg flex items-center justify-center text-white">
              <AppIcon size={18} />
            </div>
            <h1 className="text-sm font-black tracking-tight text-white uppercase">Absensi TK</h1>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-sky-200"><X size={18} /></button>
        </div>

        <nav className="space-y-1 flex-1">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all active:scale-95 ${
                isActive(link.path) 
                  ? 'bg-[#0369A1] text-white font-bold' 
                  : 'text-white/80 hover:bg-[#0EA5E9] hover:text-white'
              }`}
            >
              <link.icon size={16} className="text-white" />
              <span className="text-[13px]">{link.label}</span>
            </Link>
          ))}
        </nav>

        <div className="pt-4 border-t border-[#38BDF8]">
          <button className="flex items-center gap-3 w-full p-3 rounded-xl text-white/80 hover:bg-[#0EA5E9] transition-all text-[13px] font-bold">
            <LogOut size={16} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* MOBILE OVERLAY */}
      {isSidebarOpen && <div className="fixed inset-0 bg-sky-900/10 backdrop-blur-[2px] z-[105] md:hidden" onClick={() => setIsSidebarOpen(false)} />}

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-x-hidden">
        <div className="max-w-5xl mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/kelas" element={<ClassData />} />
            <Route path="/siswa" element={<StudentData />} />
            <Route path="/absen" element={<AttendanceForm />} />
            <Route path="/laporan" element={<AttendanceList />} />
            <Route path="/sync" element={<SyncPage />} />
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </div>
      </main>

      {/* BOTTOM NAV (MOBILE) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-[#E0F2FE] flex justify-around items-center px-2 py-2 pb-5 z-50 no-print shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
        {bottomNavLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`flex flex-col items-center gap-1 flex-1 transition-all active:scale-90 ${
              isActive(link.path) ? 'text-[#0284C7]' : 'text-slate-500'
            }`}
          >
            <div className={`p-1.5 rounded-lg ${isActive(link.path) ? 'bg-[#E0F2FE]' : ''}`}>
              <link.icon size={16} strokeWidth={isActive(link.path) ? 2.5 : 2} />
            </div>
            <span className={`text-[8px] font-black uppercase tracking-widest ${isActive(link.path) ? 'opacity-100' : 'opacity-60'}`}>
              {link.label.toUpperCase()}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

// Wrap App dengan DataProvider
const App: React.FC = () => {
  return (
    <DataProvider>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </DataProvider>
  );
};

export default App;
