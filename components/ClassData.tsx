
import React from 'react';
import { Building2, Pencil, Trash2, User, Plus, GraduationCap } from 'lucide-react';
import Swal from 'sweetalert2';
import { supabase } from '../supabase';
import { useData } from '../DataContext';

const ClassData: React.FC = () => {
  const { classes, loading, refreshData } = useData(); // Ambil refreshData

  const showClassModal = async (existingClass?: any) => {
    const isEdit = !!existingClass;
    
    await Swal.fire({
      title: `<span class="font-black text-slate-800 text-xl">${isEdit ? 'Edit Data Kelas' : 'Buat Kelas Baru'}</span>`,
      html: `
        <div class="flex flex-col gap-4 text-left mt-4">
          
          <!-- Nama Kelas -->
          <div class="relative group">
            <label for="swal-class-name" class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Nama Kelas / Rombel</label>
            <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="16" x="4" y="4" rx="2" /><rect width="6" height="6" x="9" y="9" rx="1" /></svg>
                </div>
                <input id="swal-class-name" class="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-[#38BDF8] focus:bg-white text-sm font-bold text-slate-700 transition-all placeholder:text-slate-300" placeholder="Contoh: TK B - Bintang" value="${existingClass?.name || ''}">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
             <!-- Guru -->
             <div class="relative group">
                <label for="swal-teacher-name" class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Wali Kelas</label>
                <input id="swal-teacher-name" class="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-[#38BDF8] focus:bg-white text-xs font-bold text-slate-700 transition-all placeholder:text-slate-300" placeholder="Nama Guru" value="${existingClass?.teacher_name || ''}">
             </div>
             <!-- NIP Guru -->
             <div class="relative group">
                <label for="swal-teacher-nip" class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">NIP Wali Kelas</label>
                <input id="swal-teacher-nip" class="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-[#38BDF8] focus:bg-white text-xs font-bold text-slate-700 transition-all placeholder:text-slate-300" placeholder="NIP (Opsional)" value="${existingClass?.teacher_nip || ''}">
             </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
             <!-- Kepsek -->
             <div class="relative group">
                <label for="swal-headmaster-name" class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Kepala Sekolah</label>
                <input id="swal-headmaster-name" class="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-[#38BDF8] focus:bg-white text-xs font-bold text-slate-700 transition-all placeholder:text-slate-300" placeholder="Nama Kepsek" value="${existingClass?.headmaster_name || ''}">
             </div>
             <!-- NIP Kepsek -->
             <div class="relative group">
                <label for="swal-headmaster-nip" class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">NIP Kepsek</label>
                <input id="swal-headmaster-nip" class="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-[#38BDF8] focus:bg-white text-xs font-bold text-slate-700 transition-all placeholder:text-slate-300" placeholder="NIP (Opsional)" value="${existingClass?.headmaster_nip || ''}">
             </div>
          </div>

        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Simpan Kelas',
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
        const name = (document.getElementById('swal-class-name') as HTMLInputElement).value;
        const teacher_name = (document.getElementById('swal-teacher-name') as HTMLInputElement).value;
        const teacher_nip = (document.getElementById('swal-teacher-nip') as HTMLInputElement).value;
        const headmaster_name = (document.getElementById('swal-headmaster-name') as HTMLInputElement).value;
        const headmaster_nip = (document.getElementById('swal-headmaster-nip') as HTMLInputElement).value;

        // Validasi: Nama Kelas Wajib
        if (!name) {
            Swal.showValidationMessage('Nama Kelas tidak boleh kosong');
            return false;
        }

        const payload = {
            name,
            teacher_name: teacher_name || null,
            teacher_nip: teacher_nip || null,
            headmaster_name: headmaster_name || null,
            headmaster_nip: headmaster_nip || null,
        };

        try {
            if (isEdit) {
                const { error } = await supabase.from('classes').update(payload).eq('id', existingClass.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('classes').insert([payload]);
                if (error) throw error;
            }
            return true;
        } catch (error: any) {
            Swal.showValidationMessage(`Gagal menyimpan: ${error.message}`);
            return false;
        }
      }
    }).then(async (result) => {
        if (result.isConfirmed) {
            // INSTANT UPDATE
            await refreshData();
            Swal.fire({
                title: 'Tersimpan!',
                text: 'Data kelas berhasil diperbarui.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
        }
    });
  };

  const handleDelete = async (id: string, name: string) => {
    const res = await Swal.fire({
      title: 'Hapus Kelas?',
      html: `Kelas <span class="font-bold text-slate-800">${name}</span> beserta data siswanya mungkin akan terpengaruh.`,
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
      const { error } = await supabase.from('classes').delete().eq('id', id);
      if (error) {
        Swal.fire('Gagal', 'Gagal menghapus data kelas.', 'error');
      } else {
        await refreshData(); // INSTANT UPDATE
        Swal.fire({
            title: 'Terhapus!',
            text: 'Kelas telah dihapus.',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
        });
      }
    }
  };

  if (loading && classes.length === 0) return <div className="p-10 text-center text-slate-400 font-bold animate-pulse">Memuat data kelas...</div>;

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Data Kelas</h2>
          <p className="text-slate-400 font-medium">Kelola rombongan belajar.</p>
        </div>
        <button onClick={() => showClassModal()} className="flex items-center gap-2 px-8 py-4 bg-[#38BDF8] hover:bg-[#0EA5E9] text-white rounded-2xl font-black text-sm shadow-xl shadow-sky-100 active:scale-95 transition-all group">
          <Plus size={18} className="group-hover:rotate-90 transition-transform" /> Tambah Kelas
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {classes.map((c) => (
          <div key={c.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm transition-all hover:shadow-lg group">
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-sky-50 text-[#0284C7] rounded-2xl flex items-center justify-center border border-sky-100 shadow-inner">
                        <Building2 size={28} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight leading-tight">{c.name}</h3>
                        <div className="flex items-center gap-1.5 mt-1">
                            <GraduationCap size={14} className="text-slate-400" />
                            <p className="text-xs font-bold text-slate-400">Rombel Aktif</p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => showClassModal(c)} className="p-2.5 text-sky-400 hover:bg-sky-50 rounded-xl transition-colors"><Pencil size={18} /></button>
                    <button onClick={() => handleDelete(c.id, c.name)} className="p-2.5 text-rose-400 hover:bg-rose-50 rounded-xl transition-colors"><Trash2 size={18} /></button>
                </div>
            </div>
            
            <div className="bg-[#F8FAFC] p-5 rounded-[24px] border border-slate-100 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-full border border-slate-100">
                    <User size={14} className="text-sky-500" />
                </div>
                <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">WALI KELAS</p>
                    <p className="text-sm font-bold text-slate-700">{c.teacher_name || 'Belum diisi'}</p>
                    {c.teacher_nip && <p className="text-[10px] text-slate-400 font-medium">NIP. {c.teacher_nip}</p>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {classes.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Building2 size={32} className="text-slate-300" />
            </div>
            <h4 className="font-bold text-slate-600">Belum ada data kelas</h4>
            <p className="text-xs text-slate-400 mt-1">Silakan tambahkan kelas baru.</p>
          </div>
        )}
    </div>
  );
};

export default ClassData;
