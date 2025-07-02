import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://lqytdmbpaknugrrjoylh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxeXRkbWJwYWtudWdycmpveWxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzODM3MTQsImV4cCI6MjA2Njk1OTcxNH0.B9AndZdM-_2_ojsbqSC-p7hboIN0XKsrs8TBEnDO3lY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

export { supabase };