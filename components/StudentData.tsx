
import React, { useState, useMemo } from 'react';
import { Search, UserPlus, Pencil, Trash2, Filter, Users, School } from 'lucide-react';
import Swal from 'sweetalert2';
import { supabase } from '../supabase';
import { useData } from '../DataContext';

const StudentData: React.FC = () => {
  const { students, classes, loading, refreshData } = useData(); // Ambil refreshData
  const [filter, setFilter] = useState('SEMUA');
  const [search, setSearch] = useState('');

  const getInitial = (name: string) => {
    if (!name) return '?';
    return name.trim().charAt(0).toUpperCase();
  };

  const showStudentModal = async (existingStudent?: any) => {
    const isEdit = !!existingStudent;
    
    await Swal.fire({
      title: `<span class="font-black text-slate-800 text-xl">${isEdit ? 'Ubah Data Siswa' : 'Tambah Siswa Baru'}</span>`,
      html: `
        <div class="flex flex-col gap-4 text-left mt-2">
          
          <!-- Input NIS -->
          <div class="relative group">
            <label for="swal-nis" class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Nomor Induk (NIS/NISN)</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <span class="text-slate-400 text-xs font-bold">#</span>
              </div>
              <input id="swal-nis" type="number" class="w-full pl-9 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-[#38BDF8] focus:bg-white text-sm font-bold text-slate-700 transition-all placeholder:text-slate-300" placeholder="0000" value="${existingStudent?.nis || ''}">
            </div>
          </div>

          <!-- Input Nama -->
          <div class="relative group">
            <label for="swal-name" class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Nama Lengkap</label>
            <input id="swal-name" class="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-[#38BDF8] focus:bg-white text-sm font-bold text-slate-700 transition-all placeholder:text-slate-300" placeholder="Contoh: Ananda Pratama" value="${existingStudent?.name || ''}">
          </div>

          <!-- Input Kelas -->
          <div class="relative group">
            <label for="swal-class" class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Kelas / Rombel</label>
            <div class="relative">
               <select id="swal-class" class="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-[#38BDF8] focus:bg-white text-sm font-bold text-slate-700 transition-all appearance-none cursor-pointer">
                <option value="" disabled ${!existingStudent ? 'selected' : ''}>-- Pilih Kelas --</option>
                ${classes.map(c => `<option value="${c.name}" ${existingStudent?.class_name === c.name ? 'selected' : ''}>${c.name}</option>`).join('')}
              </select>
              <div class="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
          </div>

        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Simpan Data',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#0EA5E9',
      cancelButtonColor: '#fff',
      focusConfirm: false,
      customClass: { 
        popup: 'rounded-[32px] p-8 shadow-2xl border border-slate-100',
        confirmButton: 'rounded-xl font-black text-xs uppercase tracking-widest px-8 py-3.5 shadow-lg shadow-sky-200',
        cancelButton: 'rounded-xl font-black text-xs uppercase tracking-widest px-8 py-3.5 text-slate-400 hover:bg-slate-50 border border-slate-100'
      },
      preConfirm: async () => {
        const nis = (document.getElementById('swal-nis') as HTMLInputElement).value;
        const name = (document.getElementById('swal-name') as HTMLInputElement).value;
        const class_name = (document.getElementById('swal-class') as HTMLSelectElement).value;

        if (!nis || !name || !class_name) {
          Swal.showValidationMessage('Mohon lengkapi semua kolom bertanda!');
          return false;
        }

        const payload = { nis, name, class_name };
        
        try {
          let error;
          if (isEdit) {
            ({ error } = await supabase.from('students').update(payload).eq('id', existingStudent.id));
          } else {
            ({ error } = await supabase.from('students').insert([payload]));
          }

          if (error) {
             if (error.code === '23505') {
                 Swal.showValidationMessage('NIS sudah terdaftar.');
             } else {
                 Swal.showValidationMessage(`Error: ${error.message}`);
             }
             return false;
          }
          return true;
        } catch (err: any) {
           Swal.showValidationMessage(err.message);
           return false;
        }
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        // INSTANT UPDATE: Panggil refreshData segera setelah sukses
        await refreshData();
        
        Swal.fire({
          title: 'Berhasil!',
          text: isEdit ? 'Data siswa diperbarui.' : 'Siswa baru ditambahkan.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  };

  const handleDelete = async (id: string, name: string) => {
    const res = await Swal.fire({
      title: 'Hapus Siswa?',
      html: `Data siswa <span class="font-bold text-slate-800">${name}</span> akan dihapus permanen.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#fff',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      customClass: {
        popup: 'rounded-[32px] p-8',
        confirmButton: 'rounded-xl font-black text-xs uppercase tracking-widest px-6 py-3',
        cancelButton: 'rounded-xl font-black text-xs uppercase tracking-widest px-6 py-3 text-slate-400 hover:bg-slate-50 border border-slate-100'
      }
    });

    if (res.isConfirmed) {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) {
        Swal.fire('Gagal', 'Terjadi kesalahan saat menghapus.', 'error');
      } else {
        await refreshData(); // INSTANT UPDATE
        Swal.fire({
             title: 'Terhapus!',
             text: 'Data siswa telah dihapus.',
             icon: 'success',
             timer: 1500,
             showConfirmButton: false
        });
      }
    }
  };

  const filteredStudents = useMemo(() => students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) && (filter === 'SEMUA' || s.class_name === filter)), [students, search, filter]);

  if (loading && students.length === 0) return <div className="p-10 text-center text-slate-400 font-bold animate-pulse">Memuat data siswa...</div>;

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Anak Didik</h2>
          <p className="text-slate-400 font-medium text-sm">Manajemen daftar murid TK.</p>
        </div>
        <button onClick={() => showStudentModal()} className="flex items-center gap-2 px-6 py-4 bg-[#38BDF8] hover:bg-[#0EA5E9] text-white rounded-2xl font-bold shadow-lg shadow-sky-100 transition-all active:scale-95 group">
          <UserPlus size={18} className="group-hover:scale-110 transition-transform" /> Tambah Murid
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="md:col-span-3 relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#38BDF8] transition-colors" size={20} />
          <input type="text" placeholder="Cari nama siswa atau NIS..." className="w-full pl-14 pr-6 py-4 bg-white border-2 border-slate-50 rounded-2xl outline-none font-bold text-slate-600 text-sm focus:border-[#38BDF8] shadow-sm transition-all placeholder:font-medium placeholder:text-slate-300" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="relative group">
          <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-focus-within:text-[#38BDF8] transition-colors" size={18} />
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-full pl-12 pr-10 py-4 bg-white border-2 border-slate-50 rounded-2xl outline-none font-bold text-slate-600 text-sm appearance-none shadow-sm cursor-pointer focus:border-[#38BDF8] transition-all">
            <option value="SEMUA">Semua Kelas</option>
            {classes.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
           <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none text-slate-300">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-slate-50/80">
              <tr className="text-left border-b border-slate-100">
                <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Profil</th>
                <th className="py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identitas</th>
                <th className="py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kelas</th>
                <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="group hover:bg-sky-50/30 transition-colors">
                  <td className="py-4 px-8">
                      <div className="w-12 h-12 bg-sky-100 text-[#0284C7] rounded-2xl flex items-center justify-center font-black text-lg shadow-sm border border-sky-200">
                        {getInitial(student.name)}
                      </div>
                  </td>
                  <td className="py-4 px-4">
                      <span className="font-bold text-slate-700 block text-base tracking-tight">{student.name}</span>
                      <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                         <span className="tracking-wider">NIS: {student.nis || '-'}</span>
                         <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                         <span className="text-emerald-500 uppercase tracking-wider text-[9px]">Aktif</span>
                      </span>
                  </td>
                  <td className="py-4 px-4">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg border border-slate-200">
                        <School size={12} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{student.class_name}</span>
                      </div>
                  </td>
                  <td className="py-4 px-8">
                    <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-all">
                      <button onClick={() => showStudentModal(student)} className="p-2.5 text-[#0EA5E9] bg-sky-50 hover:bg-sky-100 rounded-xl transition-colors" title="Edit"><Pencil size={16} /></button>
                      <button onClick={() => handleDelete(student.id, student.name)} className="p-2.5 text-[#EF4444] bg-red-50 hover:bg-red-100 rounded-xl transition-colors" title="Hapus"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="block md:hidden">
            <div className="divide-y divide-slate-100">
            {filteredStudents.map((student) => (
                <div key={student.id} className="p-5 flex items-center justify-between gap-3 active:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-sky-100 text-[#0284C7] rounded-2xl flex items-center justify-center font-black text-lg shadow-sm border border-sky-200 flex-shrink-0">{getInitial(student.name)}</div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-800 text-sm truncate">{student.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-0.5">NIS: {student.nis || '-'}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="px-2 py-0.5 bg-sky-50 text-[#0284C7] border border-sky-100 rounded-md text-[9px] font-black uppercase tracking-widest">{student.class_name}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <button onClick={() => showStudentModal(student)} className="p-2.5 text-[#0EA5E9] bg-slate-50 rounded-xl"><Pencil size={18} /></button>
                        <button onClick={() => handleDelete(student.id, student.name)} className="p-2.5 text-[#EF4444] bg-slate-50 rounded-xl"><Trash2 size={18} /></button>
                    </div>
                </div>
            ))}
            </div>
        </div>

        {filteredStudents.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Users size={32} className="text-slate-300" />
            </div>
            <h4 className="font-bold text-slate-600">Data tidak ditemukan</h4>
            <p className="text-xs text-slate-400 mt-1">Coba kata kunci lain atau tambahkan siswa baru.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentData;
