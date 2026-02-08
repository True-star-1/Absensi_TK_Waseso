
export enum AttendanceStatus {
  PRESENT = 'Hadir',
  SICK = 'Sakit',
  PERMISSION = 'Izin',
  ABSENT = 'Alfa'
}

export interface Student {
  id: string;
  name: string;
  nis: string;
  class_name: string;
  status: boolean;
  created_at?: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  student_name: string;
  nis?: string;
  class_name: string;
  status: AttendanceStatus;
  note?: string;
  date: string;
  created_at: string;
}

export interface SummaryData {
  total: number;
  present: number;
  sick: number;
  permission: number;
  absent: number;
}