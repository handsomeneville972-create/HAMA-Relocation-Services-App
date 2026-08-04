/**
 * HAMA Supabase Admin Client
 *
 * Server-side only. Uses the service role key to write subscription
 * records on payment success. NEVER expose these credentials to the app.
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let admin = null;

if (supabaseUrl && serviceRoleKey) {
  admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
} else {
  console.warn('[Supabase] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — subscription storage disabled');
}

module.exports = { supabase: admin };
