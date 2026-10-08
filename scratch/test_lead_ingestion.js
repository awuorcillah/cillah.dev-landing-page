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

async function testIngest() {
    console.log('Testing Lead Ingestion...');

    // 1. Direct Assignment to Atulah
    const { data: atulahLead, error: err1 } = await supabase
        .from('sales_leads')
        .insert({
            full_name: 'John Tech Solutions',
            email: 'john@techcorp.com',
            phone_number: '+254711223344',
            company_name: 'Tech Corp Kenya',
            source: 'email_campaign',
            stage: 'new_lead',
            assigned_agent_email: 'atulah@cillah.dev',
            estimated_value: 1500
        })
        .select('*')
        .single();

    if (err1) {
        console.error('Error inserting direct lead to Atulah:', err1);
    } else {
        console.log('Successfully assigned lead to Atulah:', atulahLead.full_name, '->', atulahLead.assigned_agent_email);
    }

    // 2. Initial Note for John
    if (atulahLead) {
        await supabase.from('lead_notes').insert({
            lead_id: atulahLead.id,
            author_email: 'atulah@cillah.dev',
            author_name: 'Atulah (Sales Admin)',
            source: 'email_reply',
            note_text: 'Replied to campaign email asking for AI automation pricing demo.'
        });
        console.log('Added initial interaction note for lead:', atulahLead.id);
    }

    // 3. Round Robin Assignment Test
    // Fetch staff sorted by last_assigned_at
    const { data: agents } = await supabase
        .from('staff_members')
        .select('*')
        .eq('is_active', true)
        .eq('role', 'sales')
        .order('last_assigned_at', { ascending: true });

    const selectedAgent = agents[0];
    console.log('Round robin selected agent:', selectedAgent.email);

    const { data: rrLead } = await supabase
        .from('sales_leads')
        .insert({
            full_name: 'Sarah Real Estate Agency',
            email: 'sarah@properties.co.ke',
            phone_number: '+254722998877',
            source: 'instagram_dm',
            stage: 'hot_lead',
            assigned_agent_email: selectedAgent.email,
            assigned_agent_id: selectedAgent.id,
            estimated_value: 3000
        })
        .select('*')
        .single();

    console.log('Round-robin lead assigned to:', rrLead.assigned_agent_email);
}

testIngest();
