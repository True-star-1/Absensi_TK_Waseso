-- ==========================================
-- SUPABASE DATABASE SCHEMA - ABSENSI TK CILIK
-- Dioptimalkan untuk efisiensi penyimpanan & performa 20 tahun.
-- ==========================================

-- 1. EXTENSIONS (Wajib untuk UUID)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM TYPES (Sangat hemat penyimpanan dibanding TEXT)
DO $$ BEGIN
    CREATE TYPE attendance_status AS ENUM ('Hadir', 'Sakit', 'Izin', 'Alfa');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABLES
-- Tabel Kelas
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE, -- Nama Kelas (e.g., 'TK A', 'TK B')
  teacher_name TEXT,
  teacher_nip VARCHAR(50),
  headmaster_name TEXT,
  headmaster_nip VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabel Siswa
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nis VARCHAR(20) UNIQUE, -- Nomor Induk Siswa
  name TEXT NOT NULL,
  class_name TEXT REFERENCES classes(name) ON UPDATE CASCADE ON DELETE SET NULL,
  status BOOLEAN DEFAULT true, -- Aktif/Tidak Aktif
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabel Absensi
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  status attendance_status NOT NULL,
  note TEXT, -- Catatan untuk Sakit/Izin
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  -- Mencegah duplikasi data absen siswa di hari yang sama
  UNIQUE(student_id, date)
);

-- 4. ROW LEVEL SECURITY (RLS)
-- Mengaktifkan keamanan tingkat baris
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- 5. POLICIES (Akses Publik via Anon Key)
-- Memberikan izin akses penuh karena aplikasi ini diakses secara internal
CREATE POLICY "Public Access Classes" ON classes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Students" ON students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Attendance" ON attendance FOR ALL USING (true) WITH CHECK (true);

-- 6. INDEXING (Penting untuk Laporan Cepat 10-20 Tahun)
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_students_class_name ON students(class_name);

-- 7. INITIAL DATA (Seed)
INSERT INTO classes (name, teacher_name, headmaster_name) 
VALUES 
('TK A', 'Siti Aminah, S.Pd', 'Budi Santoso, M.Pd'),
('TK B', 'Lilik Sumarni, S.Pd', 'Budi Santoso, M.Pd')
ON CONFLICT (name) DO NOTHING;

INSERT INTO students (nis, name, class_name) 
VALUES 
('2026001', 'Ananda Pratama', 'TK A'),
('2026002', 'Bunga Citra', 'TK A'),
('2026003', 'Cahyo Utomo', 'TK B')
ON CONFLICT (nis) DO NOTHING;

-- 8. TRIGGER UNTUK UPDATED_AT
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_classes_modtime BEFORE UPDATE ON classes FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_students_modtime BEFORE UPDATE ON students FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
