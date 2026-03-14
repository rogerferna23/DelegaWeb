import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Env loaded, URL:', SUPABASE_URL ? 'OK' : 'MISSING');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkTable() {
  const { data, error } = await supabase.from('postulantes').select('*').limit(1);
  if (error) {
    console.error('Error checking table postulantes:', error.message);
    if (error.message.includes('relation "public.postulantes" does not exist')) {
      console.log('CRITICAL: Table "postulantes" DOES NOT EXIST in Supabase.');
    }
  } else {
    console.log('Table "postulantes" exists. Current rows:', data ? data.length : 0);
  }
}

checkTable();
