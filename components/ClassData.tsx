
import React from 'react';
import { Building2, Pencil, Trash2, User, Plus } from 'lucide-react';
import Swal from 'sweetalert2';
import { supabase } from '../supabase';
import { useData } from '../DataContext';

const ClassData: React.FC = () => {
  const { classes, loading } = useData();

  const showClassModal = async (existingClass?: any) => {
    const isEdit = !!existingClass;
    const { value: formValues } = await Swal.fire({
      title: `
        <div class="flex items-center gap-3 justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-[#0284C7]"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>
          <h3 class="font-black text-slate-800">${isEdit ? 'Edit Kelas' : 'Tambah Kelas Baru'}</h3>
        </div>`,
      html: `
        <div class="space-y-4 text-left text-xs font-bold text-slate-400 mt-6">
          <div>
            <label for="swal-class-name" class="uppercase tracking-widest">NAMA KELAS</label>
            <input id="swal-class-name" class="mt-1 w-full p-4 bg-sky-50 border border-[#E0F2FE] rounded-2xl outline-none focus:border-[#38BDF8] text-sm font-bold text-slate-700" placeholder="Contoh: TK B - Pelangi" value="${existingClass?.name || ''}">
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="swal-teacher-name" class="uppercase tracking-widest">GURU KELAS</label>
              <input id="swal-teacher-name" class="mt-1 w-full p-4 bg-sky-50 border border-[#E0F2FE] rounded-2xl outline-none focus:border-[#38BDF8] text-sm font-bold text-slate-700" placeholder="Nama Lengkap" value="${existingClass?.teacher_name || ''}">
            </div>
            <div>
              <label for="swal-teacher-nip" class="uppercase tracking-widest">NIP GURU</label>
              <input id="swal-teacher-nip" class="mt-1 w-full p-4 bg-sky-50 border border-[#E0F2FE] rounded-2xl outline-none focus:border-[#38BDF8] text-sm font-bold text-slate-700" placeholder="Kosongkan jika tidak ada" value="${existingClass?.teacher_nip || ''}">
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="swal-headmaster-name" class="uppercase tracking-widest">KEPALA SEKOLAH</label>
              <input id="swal-headmaster-name" class="mt-1 w-full p-4 bg-sky-50 border border-[#E0F2FE] rounded-2xl outline-none focus:border-[#38BDF8] text-sm font-bold text-slate-700" placeholder="Nama Lengkap" value="${existingClass?.headmaster_name || ''}">
            </div>
            <div>
              <label for="swal-headmaster-nip" class="uppercase tracking-widest">NIP KEPSEK</label>
              <input id="swal-headmaster-nip" class="mt-1 w-full p-4 bg-sky-50 border border-[#E0F2FE] rounded-2xl outline-none focus:border-[#38BDF8] text-sm font-bold text-slate-700" placeholder="Kosongkan jika tidak ada" value="${existingClass?.headmaster_nip || ''}">
            </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Simpan Kelas',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#0EA5E9',
      customClass: { 
        popup: 'rounded-[32px] p-8',
        confirmButton: 'rounded-2xl font-black text-sm px-8 py-4',
        cancelButton: 'rounded-2xl font-black text-sm px-8 py-4 bg-slate-50 !text-slate-400'
      },
      preConfirm: () => ({
        name: (document.getElementById('swal-class-name') as HTMLInputElement).value,
        teacher_name: (document.getElementById('swal-teacher-name') as HTMLInputElement).value,
        teacher_nip: (document.getElementById('swal-teacher-nip') as HTMLInputElement).value,
        headmaster_name: (document.getElementById('swal-headmaster-name') as HTMLInputElement).value,
        headmaster_nip: (document.getElementById('swal-headmaster-nip') as HTMLInputElement).value,
      })
    });

    if (formValues && formValues.name) {
      const payload = {
        name: formValues.name,
        teacher_name: formValues.teacher_name || null,
        teacher_nip: formValues.teacher_nip || null,
        headmaster_name: formValues.headmaster_name || null,
        headmaster_nip: formValues.headmaster_nip || null,
      };
      if (isEdit) {
        await supabase.from('classes').update(payload).eq('id', existingClass.id);
      } else {
        await supabase.from('classes').insert([payload]);
      }
      // DataContext menangani update UI
    } else if (formValues) {
        Swal.fire('Gagal', 'Nama Kelas wajib diisi.', 'error');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const res = await Swal.fire({
      title: 'Hapus?',
      text: `Kelas ${name} akan dihapus.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal'
    });
    if (res.isConfirmed) {
      const { error } = await supabase.from('classes').delete().eq('id', id);
      if (error) {
        Swal.fire('Gagal', 'Gagal menghapus data kelas.', 'error');
      }
    }
  };

  if (loading && classes.length === 0) return <div className="p-10 text-center text-slate-400 font-bold animate-pulse">Memuat data kelas...</div>;

  return (
    <div className="animate-in fade-in duration-500">
      <header className="mb-8">
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Data Kelas</h2>
        <p className="text-slate-400 font-medium">Kelola rombongan belajar.</p>
        <button onClick={() => showClassModal()} className="mt-6 flex items-center gap-2 px-8 py-4 bg-[#38BDF8] hover:bg-[#0EA5E9] text-white rounded-[20px] font-black text-sm shadow-xl shadow-sky-100 active:scale-95 transition-all">
          <Plus size={18} /> Tambah Kelas
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {classes.map((c) => (
          <div key={c.id} className="bg-white p-6 rounded-[32px] border border-[#E0F2FE] shadow-sm transition-all group">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-sky-50 text-[#0284C7] rounded-[20px] flex items-center justify-center border border-sky-100">
                <Building2 size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-black text-slate-800 tracking-tight">{c.name}</h3>
              </div>
              <div className="flex gap-2">
                <button onClick={() => showClassModal(c)} className="p-2 text-sky-400 hover:bg-sky-50 rounded-lg transition-colors"><Pencil size={18} /></button>
                <button onClick={() => handleDelete(c.id, c.name)} className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
              </div>
            </div>
            <div className="bg-[#F0F9FF] p-4 rounded-[24px] flex items-center gap-4 border border-[#E0F2FE]">
              <User size={18} className="text-[#64748B]" />
              <div>
                <p className="text-[8px] font-black text-[#64748B] uppercase tracking-widest">GURU KELAS</p>
                <p className="text-xs font-black text-slate-700">{c.teacher_name || '-'}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClassData;
