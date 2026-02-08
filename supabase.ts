
import { createClient } from '@supabase/supabase-js';

// KONFIGURASI FINAL:
// Menggunakan import.meta.env untuk Vite.
// Fallback key disediakan agar aplikasi LANGSUNG JALAN setelah deploy tanpa perlu setting Environment Variables manual di Netlify dashboard.
// Menggunakan optional chaining (?.) untuk mencegah crash jika import.meta.env undefined di beberapa environment preview.

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://geopyyjvmrutlqbwysgs.supabase.co';
const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdlb3B5eWp2bXJ1dGxxYnd5c2dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NjQzMjAsImV4cCI6MjA4NjA0MDMyMH0.bEYNPEXL7wxPUIJaTcGZSKFrCLyxmuaU9pBstqXtFbA';

export const supabase = createClient(supabaseUrl, supabaseKey);
