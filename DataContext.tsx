
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from './supabase';
import { Student, AttendanceRecord } from './types';

// Tipe data untuk Context
interface ClassType {
  id: string;
  name: string;
  teacher_name?: string;
  teacher_nip?: string;
  headmaster_name?: string;
  headmaster_nip?: string;
}

interface DataContextType {
  students: Student[];
  classes: ClassType[];
  attendance: AttendanceRecord[];
  loading: boolean;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Fungsi fetch data awal
  const fetchData = async () => {
    try {
      // Fetch paralel agar lebih cepat
      const [studentsRes, classesRes, attendanceRes] = await Promise.all([
        supabase.from('students').select('*').order('name'),
        supabase.from('classes').select('*').order('name'),
        supabase.from('attendance').select('*, students(name, class_name, nis)')
      ]);

      if (studentsRes.data) setStudents(studentsRes.data);
      if (classesRes.data) setClasses(classesRes.data);
      if (attendanceRes.data) setAttendance(attendanceRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // SETUP REALTIME SUBSCRIPTION GLOBAL
    // Satu channel untuk memantau semua tabel penting
    const channel = supabase.channel('global-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, (payload) => {
        handleRealtimeUpdate('students', payload);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, (payload) => {
        handleRealtimeUpdate('classes', payload);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, (payload) => {
        handleRealtimeUpdate('attendance', payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Helper untuk update state lokal saat ada notifikasi realtime
  const handleRealtimeUpdate = (table: string, payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    const updateState = (setter: any, currentData: any[]) => {
      if (eventType === 'INSERT') {
        setter((prev: any[]) => [...prev, newRecord]);
      } else if (eventType === 'UPDATE') {
        setter((prev: any[]) => prev.map((item) => (item.id === newRecord.id ? newRecord : item)));
      } else if (eventType === 'DELETE') {
        setter((prev: any[]) => prev.filter((item) => item.id !== oldRecord.id));
      }
    };

    if (table === 'students') updateState(setStudents, students);
    if (table === 'classes') updateState(setClasses, classes);
    // Khusus attendance perlu reload jika relasi (student name) dibutuhkan, 
    // tapi untuk performa kita update raw dulu atau fetch ulang partial.
    // Untuk kesederhanaan aplikasi ini, kita fetch ulang data attendance jika ada perubahan
    // agar relasi students(name) tetap valid tanpa logic kompleks di client.
    if (table === 'attendance') {
        // Optimasi: Jika aplikasi makin besar, ganti ini dengan update state manual
        supabase.from('attendance').select('*, students(name, class_name, nis)')
            .eq('id', newRecord?.id || oldRecord?.id)
            .single()
            .then(({ data }) => {
                if (eventType === 'INSERT' && data) {
                    setAttendance(prev => [...prev, data]);
                } else if (eventType === 'UPDATE' && data) {
                    setAttendance(prev => prev.map(a => a.id === data.id ? data : a));
                } else if (eventType === 'DELETE') {
                    setAttendance(prev => prev.filter(a => a.id !== oldRecord.id));
                }
            });
    }
  };

  return (
    <DataContext.Provider value={{ students, classes, attendance, loading, refreshData: fetchData }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
