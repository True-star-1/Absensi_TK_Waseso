
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
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

  // Fungsi fetch data yang stabil
  const fetchData = useCallback(async () => {
    try {
      // Mengambil data secara paralel
      const [studentsRes, classesRes, attendanceRes] = await Promise.all([
        supabase.from('students').select('*').order('name', { ascending: true }),
        supabase.from('classes').select('*').order('name', { ascending: true }),
        // Limit attendance history untuk performa, atau ambil bulan ini saja
        supabase.from('attendance').select('*, students!inner(name, class_name, nis)')
      ]);

      if (studentsRes.error) console.error('Students Error:', studentsRes.error);
      if (classesRes.error) console.error('Classes Error:', classesRes.error);
      
      if (studentsRes.data) setStudents(studentsRes.data);
      if (classesRes.data) setClasses(classesRes.data);
      if (attendanceRes.data) setAttendance(attendanceRes.data);
      
    } catch (error) {
      console.error('CRITICAL: Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // REALTIME SUBSCRIPTION
    // Ini berfungsi sebagai backup jika user lain menginput data
    const channel = supabase.channel('public:db_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

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
