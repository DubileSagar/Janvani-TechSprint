import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jqthtdeqbxowxdbpenta.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxdGh0ZGVxYnhvd3hkYnBlbnRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MDg1OTksImV4cCI6MjA4MDA4NDU5OX0.2aKo3O4uCsrXGaXKcgcDCEogBIMoyyQR-zgT2lqEmc8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
