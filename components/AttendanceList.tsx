
import React, { useState, useEffect, useMemo } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useData } from '../DataContext';

const AttendanceList: React.FC = () => {
  const { students: allStudents, attendance: allAttendance, classes, loading } = useData();
  const [reportType, setReportType] = useState<'daily' | 'monthly'>('monthly');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Set default class saat data tersedia
  useEffect(() => {
    if (!selectedClass && classes.length > 0) {
      setSelectedClass(classes[0].name);
    }
  }, [classes, selectedClass]);

  // Filter Data Siswa berdasarkan kelas (Instan dari Memory)
  const students = useMemo(() => {
    if (!selectedClass) return [];
    return allStudents.filter(s => s.class_name === selectedClass).sort((a, b) => a.name.localeCompare(b.name));
  }, [allStudents, selectedClass]);

  // Filter Data Absensi berdasarkan periode (Instan dari Memory)
  const attendance = useMemo(() => {
    if (!selectedClass) return [];
    
    // Filter by date range
    return allAttendance.filter(a => {
        // Cek apakah data ini milik siswa di kelas yang dipilih?
        // Kita perlu cek student_id nya ada di list students kelas ini
        const isStudentInClass = students.some(s => s.id === a.student_id);
        if (!isStudentInClass) return false;

        if (reportType === 'monthly') {
            const d = new Date(a.date);
            return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
        } else {
            return a.date === selectedDate;
        }
    });
  }, [allAttendance, students, reportType, selectedDate, selectedMonth, selectedYear, selectedClass]);

  // Info Guru/Kepsek dari kelas terpilih
  const classInfo = useMemo(() => {
    return classes.find(c => c.name === selectedClass) || null;
  }, [classes, selectedClass]);

  const daysInMonth = useMemo(() => {
    const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
    return Array.from({ length: lastDay }, (_, i) => i + 1);
  }, [selectedMonth, selectedYear]);

  // Transform Data untuk Tabel
  const pivotedData = useMemo(() => {
    return students.map(student => {
      const studentAtt = attendance.filter(a => a.student_id === student.id);
      const dayMap: Record<number, string> = {};
      let rekap = { H: 0, S: 0, I: 0, A: 0 };
      let todayStatus = '-';
      let todayNote = '';

      studentAtt.forEach(a => {
        if (reportType === 'monthly') {
          const day = new Date(a.date).getDate();
          if (a.status === 'Hadir') { dayMap[day] = 'H'; rekap.H++; }
          else if (a.status === 'Sakit') { dayMap[day] = 'S'; rekap.S++; }
          else if (a.status === 'Izin') { dayMap[day] = 'I'; rekap.I++; }
          else if (a.status === 'Alfa') { dayMap[day] = 'A'; rekap.A++; }
        } else {
          todayStatus = a.status;
          todayNote = a.note || '-';
        }
      });

      return { ...student, dayMap, rekap, todayStatus, todayNote };
    });
  }, [students, attendance, reportType]);

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const years = [2024, 2025, 2026, 2027, 2028, 2029, 2030];
  
  const handleDownloadPdf = () => {
    const doc = new jsPDF({
      orientation: reportType === 'monthly' ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    doc.setFont('times', 'normal');

    // Header
    doc.setFontSize(16);
    doc.setFont('times', 'bold');
    doc.text('LAPORAN ABSENSI DIGITAL', doc.internal.pageSize.getWidth() / 2, 12, { align: 'center' });
    doc.text('TK TUGU WASESO', doc.internal.pageSize.getWidth() / 2, 19, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('times', 'normal');
    const periodeText = reportType === 'daily' 
      ? `Tanggal: ${new Date(selectedDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}` 
      : `Periode: ${monthNames[selectedMonth-1]} ${selectedYear}`;
    doc.text(`KELAS: ${selectedClass || '-'} • ${periodeText}`, doc.internal.pageSize.getWidth() / 2, 26, { align: 'center' });

    // Table
    const tableStyles = { font: 'times', lineColor: '#000000', lineWidth: 0.1 };
    const headStyles = { fillColor: '#87CEEB', textColor: '#FFFFFF', fontStyle: 'bold', lineColor: '#87CEEB', fontSize: 8 };

    if (reportType === 'monthly') {
      const head = [['NO', 'NAMA SISWA', ...daysInMonth.map(d => d.toString()), 'H', 'S', 'I', 'A']];
      const body = pivotedData.map((student, idx) => [
        idx + 1,
        student.name.toUpperCase(),
        ...daysInMonth.map(d => student.dayMap[d] || ''),
        student.rekap.H || '',
        student.rekap.S || '',
        student.rekap.I || '',
        student.rekap.A || '',
      ]);

      autoTable(doc, {
        head: head,
        body: body,
        startY: 34,
        theme: 'grid',
        styles: { ...tableStyles, fontSize: 6, cellPadding: 1.5, halign: 'center', valign: 'middle' },
        headStyles: headStyles,
        columnStyles: { 1: { halign: 'left', cellWidth: 40 } },
      });
    } else { // Daily report
      const head = [['NO', 'NAMA SISWA', 'STATUS', 'KETERANGAN']];
      const body = pivotedData.map((student, idx) => [
        idx + 1,
        student.name.toUpperCase(),
        student.todayStatus,
        student.todayNote
      ]);

      autoTable(doc, {
        head: head,
        body: body,
        startY: 34,
        theme: 'grid',
        styles: { ...tableStyles, fontSize: 10, valign: 'middle' },
        headStyles: headStyles,
        columnStyles: { 0: { halign: 'center', cellWidth: 10 }, 1: { halign: 'left' }, 2: { halign: 'center', cellWidth: 25 }, 3: { halign: 'left' } },
      });
    }
    
    // Signatures part
    const finalY = (doc as any).lastAutoTable.finalY || 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    const signatureY = finalY + 20;

    if (signatureY < doc.internal.pageSize.getHeight() - 50) {
      doc.setFontSize(11);
      doc.setFont('times', 'normal');
      doc.setTextColor('#000000');
      
      const leftX = pageWidth / 4;
      const rightX = (pageWidth / 4) * 3;

      doc.text('Mengetahui,', leftX, signatureY, { align: 'center' });
      doc.text(`Magetan, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, rightX, signatureY, { align: 'center' });
      doc.text('Kepala Sekolah TK', leftX, signatureY + 5, { align: 'center' });
      doc.text(`Guru Kelas ${selectedClass}`, rightX, signatureY + 5, { align: 'center' });
      
      doc.text(classInfo?.headmaster_name?.toUpperCase() || '_________________', leftX, signatureY + 30, { align: 'center' });
      doc.text(classInfo?.teacher_name?.toUpperCase() || '_________________', rightX, signatureY + 30, { align: 'center' });
      doc.text(`NIP. ${classInfo?.headmaster_nip || '-'}`, leftX, signatureY + 35, { align: 'center' });
      doc.text(`NIP. ${classInfo?.teacher_nip || '-'}`, rightX, signatureY + 35, { align: 'center' });
    }

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for(var i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor('#000000');
      doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 10, doc.internal.pageSize.getHeight() - 10);
      doc.text('Halaman ' + String(i) + ' dari ' + String(pageCount), doc.internal.pageSize.getWidth() - 10, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
    }

    doc.save(`Laporan Absensi ${selectedClass} - ${reportType === 'daily' ? selectedDate : `${selectedYear}-${selectedMonth}`}.pdf`);
  };

  if (loading && classes.length === 0) return <div className="p-10 text-center text-slate-400 font-bold animate-pulse">Menyiapkan Laporan...</div>;

  return (
    <div className="animate-in pb-10">
      <style>{`
        .font-report { font-family: 'Times New Roman', Times, serif !important; }
        @media print {
          @page { size: ${reportType === 'monthly' ? 'landscape' : 'portrait'}; margin: 1cm; }
          body { background: white; font-family: 'Times New Roman', Times, serif !important; }
          .no-print { display: none !important; }
          table { font-size: 9px !important; }
          .card { border: none !important; box-shadow: none !important; padding: 0 !important; }
        }
      `}</style>

      <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Laporan Absensi</h2>
          <p className="text-slate-400 text-xs font-medium">Tinjau dan unduh riwayat kehadiran siswa.</p>
        </div>
        <button onClick={handleDownloadPdf} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold active:scale-95 transition-all shadow-md shadow-sky-100">
          <FileSpreadsheet size={14} /> Download PDF
        </button>
      </header>

      <div className="bg-white p-5 md:p-6 rounded-[24px] border border-slate-50 shadow-sm mb-6 no-print">
        <div className="flex bg-slate-50 p-1 rounded-xl mb-6">
          <button 
            onClick={() => setReportType('daily')}
            className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${reportType === 'daily' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400'}`}
          >
            Harian
          </button>
          <button 
            onClick={() => setReportType('monthly')}
            className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${reportType === 'monthly' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400'}`}
          >
            Bulanan
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-300 uppercase tracking-widest pl-1">KELAS</label>
            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-full py-2.5 px-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 outline-none">
              <option value="">-- Pilih Kelas --</option>
              {classes.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          
          {reportType === 'daily' ? (
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-300 uppercase tracking-widest pl-1">TANGGAL</label>
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full py-2.5 px-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 outline-none" />
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-300 uppercase tracking-widest pl-1">BULAN</label>
                <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="w-full py-2.5 px-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 outline-none">
                  {monthNames.map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-300 uppercase tracking-widest pl-1">TAHUN</label>
                <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="w-full py-2.5 px-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 outline-none">
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Kontainer Laporan dengan Font Times New Roman */}
      <div className={`bg-white p-4 md:p-8 rounded-[32px] border border-slate-50 shadow-sm flex flex-col items-center card font-report ${reportType === 'monthly' ? 'w-full' : 'max-w-4xl mx-auto'}`}>
        <div className="text-center w-full mb-6">
          <h3 className="text-lg font-bold text-slate-800 tracking-wider uppercase">LAPORAN ABSENSI DIGITAL</h3>
          <p className="text-base font-bold text-slate-700 mt-1 uppercase tracking-widest">TK TUGU WASESO</p>
          <p className="text-sm font-medium text-slate-500 mt-2">
            KELAS: {selectedClass || '-'} • 
            {reportType === 'daily' ? ` Tanggal: ${new Date(selectedDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}` : ` Periode: ${monthNames[selectedMonth-1]} ${selectedYear}`}
          </p>
        </div>

        <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
          <table className="w-full text-[11px] border-collapse border border-slate-300 font-report">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-bold uppercase tracking-tight">
                <th className="border border-slate-300 p-2 text-center w-8">NO</th>
                <th className="border border-slate-300 p-2 text-left min-w-[150px]">NAMA SISWA</th>
                {reportType === 'monthly' ? (
                  <>
                    {daysInMonth.map(d => (
                      <th key={d} className="border border-slate-300 p-1 text-center w-6 font-medium text-[9px]">{d}</th>
                    ))}
                    <th className="border border-slate-300 p-1 text-center w-7 text-emerald-700 bg-emerald-50">H</th>
                    <th className="border border-slate-300 p-1 text-center w-7 text-sky-700 bg-sky-50">S</th>
                    <th className="border border-slate-300 p-1 text-center w-7 text-amber-700 bg-amber-50">I</th>
                    <th className="border border-slate-300 p-1 text-center w-7 text-rose-700 bg-rose-50">A</th>
                  </>
                ) : (
                  <>
                    <th className="border border-slate-300 p-2 text-center w-24">STATUS</th>
                    <th className="border border-slate-300 p-2 text-left">KETERANGAN</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {loading && students.length === 0 ? (
                <tr><td colSpan={reportType === 'monthly' ? daysInMonth.length + 6 : 4} className="p-10 text-center text-slate-300 italic font-bold">Memuat data...</td></tr>
              ) : pivotedData.map((student, idx) => (
                <tr key={student.id} className="text-slate-800 hover:bg-slate-50/50">
                  <td className="border border-slate-300 p-2 text-center text-slate-500 font-medium">{idx + 1}</td>
                  <td className="border border-slate-300 p-2 font-bold uppercase truncate">{student.name}</td>
                  {reportType === 'monthly' ? (
                    <>
                      {daysInMonth.map(d => (
                        <td key={d} className="border border-slate-300 p-1 text-center text-slate-800 font-bold text-[9px]">
                          {student.dayMap[d] || ''}
                        </td>
                      ))}
                      <td className="border border-slate-300 p-1 text-center font-bold text-emerald-700 bg-emerald-50/20">{student.rekap.H || ''}</td>
                      <td className="border border-slate-300 p-1 text-center font-bold text-sky-700 bg-sky-50/20">{student.rekap.S || ''}</td>
                      <td className="border border-slate-300 p-1 text-center font-bold text-amber-700 bg-amber-50/20">{student.rekap.I || ''}</td>
                      <td className="border border-slate-300 p-1 text-center font-bold text-rose-700 bg-rose-50/20">{student.rekap.A || ''}</td>
                    </>
                  ) : (
                    <>
                      <td className="border border-slate-300 p-2 text-center">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${
                          student.todayStatus === 'Hadir' ? 'text-emerald-700' :
                          student.todayStatus === 'Sakit' ? 'text-sky-700' :
                          student.todayStatus === 'Izin' ? 'text-amber-700' :
                          student.todayStatus === 'Alfa' ? 'text-rose-700' : 'text-slate-300'
                        }`}>
                          {student.todayStatus || '-'}
                        </span>
                      </td>
                      <td className="border border-slate-300 p-2 text-slate-500 italic text-[10px] truncate">{student.todayNote}</td>
                    </>
                  )}
                </tr>
              ))}
              {pivotedData.length === 0 && !loading && (
                <tr><td colSpan={reportType === 'monthly' ? daysInMonth.length + 6 : 4} className="p-10 text-center text-slate-300 italic font-bold">Tidak ada data.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-12 w-full grid grid-cols-2 gap-10 px-4 md:px-20 text-[11px] font-bold font-report">
          <div className="text-center">
            <p className="text-slate-600">Mengetahui,</p>
            <p className="text-slate-900 uppercase mt-1">Kepala Sekolah TK</p>
            <div className="h-16"></div>
            <p className="text-slate-900 underline uppercase">{classInfo?.headmaster_name || '-'}</p>
            <p className="text-[10px] text-slate-500 mt-1">NIP. {classInfo?.headmaster_nip || '-'}</p>
          </div>
          <div className="text-center">
            <p className="text-slate-600">Magetan, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="text-slate-900 uppercase mt-1">Guru Kelas {selectedClass}</p>
            <div className="h-16"></div>
            <p className="text-slate-900 underline uppercase">{classInfo?.teacher_name || '-'}</p>
            <p className="text-[10px] text-slate-500 mt-1">NIP. {classInfo?.teacher_nip || '-'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceList;
