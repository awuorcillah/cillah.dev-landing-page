const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables from .env
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2 && !line.startsWith('#')) {
        env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const serviceKey = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !serviceKey) {
    console.error('Missing Supabase URL or Service Role Key in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function runSetup() {
    console.log('Connecting to Supabase project:', supabaseUrl);
    
    // Check if staff_members table exists or test insert
    const { data: staff, error: staffError } = await supabase
        .from('staff_members')
        .select('*');

    if (staffError) {
        console.log('Staff members table check message:', staffError.message);
        console.log('\n--- ATTENTION REQUIRED ---');
        console.log('Please execute the SQL migration script in your Supabase SQL Editor:');
        console.log('File location: supabase/phase1_crm_schema.sql');
    } else {
        console.log('Staff Members found in database:', staff);
    }
}

runSetup();
