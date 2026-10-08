const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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
const supabase = createClient(supabaseUrl, serviceKey);

async function applyFollowupPatch() {
    console.log('Testing follow-up patch columns...');
    
    // Check if columns exist by trying to select or update
    const { data, error } = await supabase
        .from('sales_leads')
        .select('id, followup_status, next_followup_at')
        .limit(1);

    if (error) {
        console.log('Follow-up columns not yet added to SQL schema. Please run supabase/update_followup_schema.sql in Supabase SQL Editor.');
    } else {
        console.log('Follow-up columns active:', data);
    }
}

applyFollowupPatch();
