import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env file.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanDatabase() {
  console.log("Starting database cleanup...");

  // 1. Delete all Ventas
  const { error: errorVentas } = await supabase.from('ventas').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (errorVentas) console.error("Error deleting ventas:", errorVentas.message);
  else console.log("✅ All test ventas deleted.");

  // 2. Delete all Gastos
  const { error: errorGastos } = await supabase.from('gastos').delete().neq('id', 0);
  if (errorGastos) console.error("Error deleting gastos:", errorGastos.message);
  else console.log("✅ All test gastos deleted.");

  // 3. Delete all Audit Logs
  const { error: errorAudit } = await supabase.from('audit_log').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (errorAudit) console.error("Error deleting audit logs:", errorAudit.message);
  else console.log("✅ All test audit logs deleted.");

  // 4. Delete all Admin Requests
  const { error: errorRequests } = await supabase.from('admin_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (errorRequests) console.error("Error deleting admin requests:", errorRequests.message);
  else console.log("✅ All test admin requests deleted.");

  console.log("\\n🎉 Database cleanup complete! The web is now clean and ready to invoice.");
}

cleanDatabase();
