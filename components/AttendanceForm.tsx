
import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Building2, UserCheck } from 'lucide-react';
import Swal from 'sweetalert2';
import { supabase } from '../supabase';
import { useData } from '../DataContext';

const AttendanceForm: React.FC = () => {
  const { students: allStudents, classes, attendance: allAttendance, loading, refreshData } = useData();
  const [selectedClass, setSelectedClass] = useState('');
  
  // Gunakan local timezone untuk default value
  const getLocalDate = () => {
    const d = new Date();
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().slice(0, 10);
  };
  
  const [selectedDate, setSelectedDate] = useState(getLocalDate());
  const [submitting, setSubmitting] = useState(false);

  // Filter siswa berdasarkan kelas yang dipilih (Instan dari context)
  const students = useMemo(() => {
    return allStudents.filter(s => s.class_name === selectedClass && s.status === true);
  }, [allStudents, selectedClass]);

  // Siapkan map status absensi hari ini (Instan dari context)
  const attendanceMap = useMemo(() => {
    const map: Record<string, { status: string, note: string }> = {};
    
    // Inisialisasi kosong
    students.forEach(s => {
      map[s.id] = { status: '', note: '' };
    });

    // Isi dengan data yang ada di context (jika ada)
    const records = allAttendance.filter(a => a.date === selectedDate);
    records.forEach(r => {
      if (map.hasOwnProperty(r.student_id)) {
        map[r.student_id] = { status: r.status, note: r.note || '' };
      }
    });

    return map;
  }, [allAttendance, students, selectedDate]);

  // Local state untuk perubahan yang belum disimpan (optimistic UI)
  const [localAttendance, setLocalAttendance] = useState<Record<string, { status: string, note: string }>>({});

  // Sync local state dengan data dari context saat pindah tanggal/kelas
  useEffect(() => {
    setLocalAttendance(attendanceMap);
  }, [attendanceMap]);

  const getInitial = (name: string) => {
    if (!name) return '?';
    return name.trim().charAt(0).toUpperCase();
  };

  const askForNote = async (studentId: string, studentName: string, status: string) => {
    const { value: note } = await Swal.fire({
      title: `<span class="font-black text-slate-800">Keterangan ${status}</span>`,
      html: `<p class="text-xs font-bold text-slate-400 mb-4 uppercase tracking-widest">Murid: ${studentName}</p>`,
      input: 'text',
      inputPlaceholder: `Kenapa si kecil ${status.toLowerCase()} hari ini?`,
      inputValue: localAttendance[studentId]?.note || '',
      showCancelButton: true,
      confirmButtonText: 'Simpan',
      cancelButtonText: 'Lewati',
      confirmButtonColor: '#0EA5E9',
      cancelButtonColor: '#F0F9FF',
      customClass: {
        popup: 'rounded-[32px] p-8',
        input: 'rounded-2xl border-sky-100 font-bold text-sm p-4 h-14 focus:border-[#38BDF8] shadow-none',
        confirmButton: 'rounded-xl font-black text-xs uppercase tracking-widest px-8 py-4',
        cancelButton: 'rounded-xl font-black text-xs uppercase tracking-widest px-8 py-4 !text-slate-400'
      }
    });

    handleStatusChange(studentId, status, note || '');
  };

  const handleStatusChange = (studentId: string, status: string, note: string = '') => {
    setLocalAttendance(prev => ({
      ...prev,
      [studentId]: { status, note: note || prev[studentId]?.note || '' }
    }));
  };

  const handleStatusClick = (studentId: string, studentName: string, status: string) => {
    if (status === 'Sakit' || status === 'Izin') {
      askForNote(studentId, studentName, status);
    } else {
      handleStatusChange(studentId, status, '');
    }
  };

  const handleSave = async () => {
    if (students.length === 0) return;
    const unfinished = students.some(s => !localAttendance[s.id]?.status);
    if (unfinished) {
      Swal.fire({ title: 'Belum Lengkap!', text: 'Pastikan semua siswa telah diberi status kehadiran.', icon: 'warning', confirmButtonColor: '#0EA5E9' });
      return;
    }

    setSubmitting(true);
    try {
      const upserts = Object.keys(localAttendance).map(studentId => {
        const data = localAttendance[studentId];
        return {
          student_id: studentId,
          status: data.status,
          note: data.note,
          date: selectedDate
        };
      });
      
      const { error } = await supabase.from('attendance').upsert(upserts, { onConflict: 'student_id, date' });

      if (error) throw error;
      
      // INSTANT UPDATE
      await refreshData();

      Swal.fire({ title: 'Berhasil!', text: 'Data absensi telah disimpan.', icon: 'success', confirmButtonColor: '#0EA5E9' });
    } catch (error: any) {
      Swal.fire('Ups!', error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && classes.length === 0) return <div className="p-10 text-center text-slate-400 font-bold animate-pulse">Menyiapkan form...</div>;

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      <header className="mb-6">
        <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Input Absensi</h2>
        <p className="text-slate-400 text-sm font-medium">Rekam kehadiran anak didik hari ini.</p>
      </header>

      <div className="bg-white p-4 md:p-6 rounded-[32px] border border-[#E0F2FE] shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-[#38BDF8] pointer-events-none" size={18} />
            <select className="w-full pl-12 pr-10 py-4 bg-sky-50 border border-sky-100 rounded-2xl outline-none font-bold text-slate-700 text-sm appearance-none focus:border-[#38BDF8] transition-all cursor-pointer" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
              <option value="">Pilih Kelas...</option>
              {classes.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[#38BDF8] pointer-events-none" size={18} />
            <input type="date" className="w-full pl-12 pr-4 py-4 bg-sky-50 border border-sky-100 rounded-2xl outline-none font-bold text-slate-700 text-sm focus:border-[#38BDF8] transition-all cursor-pointer" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          </div>
        </div>
      </div>

      {!selectedClass ? (
        <div className="bg-white py-24 px-6 rounded-[40px] border-2 border-dashed border-sky-100 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-sky-50 text-sky-200 rounded-[32px] flex items-center justify-center mb-6">
            <UserCheck size={40} />
          </div>
          <h3 className="text-lg font-bold text-slate-400 tracking-tight">Pilih kelas terlebih dahulu.</h3>
        </div>
      ) : (
        <div className={`space-y-4`}>
          {students.map((student) => {
            const currentStatus = localAttendance[student.id]?.status;
            return (
              <div key={student.id} className={`bg-white rounded-[32px] border transition-all ${currentStatus ? 'border-sky-200 shadow-md' : 'border-[#E0F2FE]'}`}>
                <div className="p-4 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center font-black text-xl border ${currentStatus ? 'bg-[#38BDF8] text-white border-[#38BDF8]' : 'bg-sky-50 text-sky-400 border-sky-100'}`}>
                      {getInitial(student.name)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-700 text-sm md:text-base">{student.name}</h4>
                      {localAttendance[student.id]?.note && <p className="text-[10px] text-[#0284C7] italic">"{localAttendance[student.id]?.note}"</p>}
                    </div>
                  </div>
                  <div className="flex gap-1.5 bg-sky-50 p-1.5 rounded-[20px]">
                    {['Hadir', 'Sakit', 'Izin', 'Alfa'].map((st) => (
                      <button key={st} onClick={() => handleStatusClick(student.id, student.name, st)} className={`flex-1 sm:flex-none px-4 py-3 rounded-xl text-[9px] font-black tracking-widest transition-all ${currentStatus === st ? 'bg-[#0EA5E9] text-white' : 'bg-white text-slate-400 border border-sky-50'}`}>{st.toUpperCase()}</button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
          {students.length === 0 && (
             <div className="py-10 text-center text-slate-400 font-medium">Belum ada siswa di kelas ini.</div>
          )}
          {students.length > 0 && (
            <div className="pt-8">
                <button onClick={handleSave} disabled={submitting} className="w-full py-6 bg-slate-900 text-white rounded-[32px] font-black text-xs uppercase tracking-widest active:scale-95 transition-all">
                {submitting ? 'MENYIMPAN...' : 'SIMPAN ABSENSI'}
                </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AttendanceForm;
