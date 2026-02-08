
import React, { useState, useMemo } from 'react';
import { Search, UserPlus, Pencil, Trash2, Filter, Users } from 'lucide-react';
import Swal from 'sweetalert2';
import { supabase } from '../supabase';
import { useData } from '../DataContext';

const StudentData: React.FC = () => {
  const { students, classes, loading } = useData();
  const [filter, setFilter] = useState('SEMUA');
  const [search, setSearch] = useState('');

  const getInitial = (name: string) => {
    if (!name) return '?';
    return name.trim().charAt(0).toUpperCase();
  };

  const showStudentModal = async (existingStudent?: any) => {
    const isEdit = !!existingStudent;
    const { value: formValues } = await Swal.fire({
      title: `
        <div class="flex items-center gap-3 justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-[#0284C7]"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
          <h3 class="font-black text-slate-800">${isEdit ? 'Edit Siswa' : 'Tambah Siswa'}</h3>
        </div>`,
      html: `
        <div class="space-y-4 text-left text-xs font-bold text-slate-400 mt-6">
          <div>
            <label for="swal-nis" class="uppercase tracking-widest">NOMOR INDUK (NIS/NISN)</label>
            <input id="swal-nis" class="mt-1 w-full p-4 bg-sky-50 border border-[#E0F2FE] rounded-2xl outline-none focus:border-[#38BDF8] text-sm font-bold text-slate-700" placeholder="Contoh: 2024001" value="${existingStudent?.nis || ''}">
          </div>
          <div>
            <label for="swal-name" class="uppercase tracking-widest">NAMA LENGKAP SISWA</label>
            <input id="swal-name" class="mt-1 w-full p-4 bg-sky-50 border border-[#E0F2FE] rounded-2xl outline-none focus:border-[#38BDF8] text-sm font-bold text-slate-700" placeholder="Nama Lengkap Anak" value="${existingStudent?.name || ''}">
          </div>
          <div>
            <label for="swal-class" class="uppercase tracking-widest">KELOMPOK BELAJAR / KELAS</label>
            <select id="swal-class" class="mt-1 w-full p-4 bg-sky-50 border border-[#E0F2FE] rounded-2xl outline-none focus:border-[#38BDF8] text-sm font-bold text-slate-700 appearance-none">
              <option value="">-- Pilih Kelas --</option>
              ${classes.map(c => `<option value="${c.name}" ${existingStudent?.class_name === c.name ? 'selected' : ''}>${c.name}</option>`).join('')}
            </select>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Simpan Data',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#0EA5E9',
      customClass: { 
        popup: 'rounded-[32px] p-8',
        confirmButton: 'rounded-2xl font-black text-sm px-8 py-4',
        cancelButton: 'rounded-2xl font-black text-sm px-8 py-4 bg-slate-50 !text-slate-400'
      },
      preConfirm: () => ({
        nis: (document.getElementById('swal-nis') as HTMLInputElement).value,
        name: (document.getElementById('swal-name') as HTMLInputElement).value,
        class_name: (document.getElementById('swal-class') as HTMLSelectElement).value,
      })
    });

    if (formValues && formValues.name && formValues.class_name && formValues.nis) {
      const payload = { nis: formValues.nis, name: formValues.name, class_name: formValues.class_name };
      let error;
      if (isEdit) {
        ({ error } = await supabase.from('students').update(payload).eq('id', existingStudent.id));
      } else {
        ({ error } = await supabase.from('students').insert([payload]));
      }

      if (error) {
        Swal.fire('Gagal', 'NIS mungkin sudah terdaftar atau tidak valid.', 'error');
      }
      // DataContext akan otomatis menangkap perubahan lewat realtime subscription
    } else if (formValues) {
      Swal.fire('Gagal', 'Semua kolom wajib diisi.', 'error');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const res = await Swal.fire({
      title: 'Hapus?',
      text: `Siswa bernama ${name} akan dihapus.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal'
    });
    if (res.isConfirmed) {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) {
        Swal.fire('Gagal', 'Gagal menghapus data siswa.', 'error');
      }
      // DataContext menangani update UI
    }
  };

  const filteredStudents = useMemo(() => students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) && (filter === 'SEMUA' || s.class_name === filter)), [students, search, filter]);

  if (loading && students.length === 0) return <div className="p-10 text-center text-slate-400 font-bold animate-pulse">Memuat data siswa...</div>;

  return (
    <div className="animate-in fade-in duration-500">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Anak Didik</h2>
          <p className="text-slate-400 font-medium text-sm">Manajemen daftar murid TK.</p>
        </div>
        <button onClick={() => showStudentModal()} className="flex items-center gap-2 px-6 py-4 bg-[#38BDF8] hover:bg-[#0EA5E9] text-white rounded-2xl font-bold shadow-lg shadow-sky-100 transition-all active:scale-95">
          <UserPlus size={18} /> Tambah Murid
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="md:col-span-3 relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-sky-300" size={18} />
          <input type="text" placeholder="Cari nama siswa..." className="w-full pl-12 pr-6 py-4 bg-white border border-[#E0F2FE] rounded-2xl outline-none font-bold text-slate-600 text-sm focus:border-[#38BDF8] shadow-sm transition-all" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="relative">
          <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-sky-300 pointer-events-none" size={18} />
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-full pl-12 pr-6 py-4 bg-white border border-[#E0F2FE] rounded-2xl outline-none font-bold text-slate-600 text-sm appearance-none shadow-sm cursor-pointer">
            <option value="SEMUA">Semua Kelas</option>
            {classes.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-[#E0F2FE] shadow-sm">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-sky-50/50">
              <tr className="text-left border-b border-[#E0F2FE]">
                <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Inisial</th>
                <th className="py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Informasi Murid</th>
                <th className="py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kelas</th>
                <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0F2FE]">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="group hover:bg-sky-50/50 transition-colors">
                  <td className="py-4 px-8"><div className="w-10 h-10 bg-sky-100 text-[#0284C7] rounded-xl flex items-center justify-center font-bold">{getInitial(student.name)}</div></td>
                  <td className="py-4 px-4"><span className="font-bold text-slate-700 block tracking-tight uppercase">{student.name}</span><span className="text-[10px] text-emerald-500 font-black uppercase tracking-wider">Aktif</span></td>
                  <td className="py-4 px-4"><span className="px-3 py-1 bg-sky-100 text-[#0284C7] rounded-lg text-[9px] font-black uppercase tracking-widest">{student.class_name}</span></td>
                  <td className="py-4 px-8">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => showStudentModal(student)} className="p-2 text-[#0EA5E9] hover:bg-sky-100 rounded-xl"><Pencil size={16} /></button>
                      <button onClick={() => handleDelete(student.id, student.name)} className="p-2 text-[#EF4444] hover:bg-red-50 rounded-xl"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="block md:hidden">
            <div className="divide-y divide-[#E0F2FE]">
            {filteredStudents.map((student) => (
                <div key={student.id} className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-sky-100 text-[#0284C7] rounded-xl flex items-center justify-center font-bold flex-shrink-0">{getInitial(student.name)}</div>
                        <div className="flex-1">
                            <p className="font-bold text-slate-700 block tracking-tight text-sm leading-tight uppercase">{student.name}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-[9px] text-emerald-500 font-black uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-md">Aktif</span>
                                <span className="px-2 py-0.5 bg-sky-100 text-[#0284C7] rounded-md text-[8px] font-black uppercase tracking-widest">{student.class_name}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-0">
                        <button onClick={() => showStudentModal(student)} className="p-2 text-[#0EA5E9]"><Pencil size={16} /></button>
                        <button onClick={() => handleDelete(student.id, student.name)} className="p-2 text-[#EF4444]"><Trash2 size={16} /></button>
                    </div>
                </div>
            ))}
            </div>
        </div>

        {filteredStudents.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <Users size={40} className="mx-auto mb-4" />
            <h4 className="font-bold">Data tidak ditemukan</h4>
            <p className="text-xs">Coba ubah filter atau kata kunci pencarian Anda.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentData;
