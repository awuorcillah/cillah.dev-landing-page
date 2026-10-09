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

if (!supabaseUrl || !serviceKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function setupDatabase() {
    console.log('--- Setting up Stage Properties & Multi-Tenant Database ---');

    // 1. Create or Seed Organizations
    const stageOrgId = 'a1b2c3d4-e5f6-7890-abcd-111111111111';
    const cillahOrgId = 'a1b2c3d4-e5f6-7890-abcd-222222222222';

    const { data: upsertOrgs, error: upsertErr } = await supabase
        .from('organizations')
        .upsert([
            { id: stageOrgId, name: 'Stage Properties Brokers L.L.C', slug: 'stage-properties' },
            { id: cillahOrgId, name: 'cillah.dev', slug: 'cillah-dev' }
        ], { onConflict: 'slug' })
        .select();

    if (upsertErr) {
        console.log('Organizations upsert info:', upsertErr.message);
    } else {
        console.log('✅ Organizations initialized:', upsertOrgs);
    }

    // 2. Seed Staff Members for Stage Properties & cillah.dev
    const staffToSeed = [
        {
            crm_id: 'STAGE-AGT-001',
            email: 'ador.ai815@gmail.com',
            full_name: 'Ador',
            phone_number: '0794357912',
            role: 'sales',
            status: 'user',
            is_active: true,
            org_id: stageOrgId
        },
        {
            crm_id: 'STAGE-ADM-000',
            email: 'awuorcillah@gmail.com',
            full_name: 'Cillah Awuor (CEO & Super Admin)',
            phone_number: '+254794357912',
            role: 'ceo',
            status: 'admin',
            is_active: true,
            org_id: cillahOrgId
        }
    ];

    const { data: staffData, error: staffErr } = await supabase
        .from('staff_members')
        .upsert(staffToSeed, { onConflict: 'email' })
        .select();

    if (staffErr) {
        console.log('Staff members upsert info:', staffErr.message);
    } else {
        console.log('✅ Staff Members initialized for Stage Properties & cillah.dev:', staffData);
    }

    // 3. Seed Stage Properties Listings in `properties` table
    const propertiesToSeed = [
        {
            keyword: 'hartland',
            title: 'Sobha Hartland / Hartland Waterfront Estates',
            location: 'Sobha Hartland, Mohammed Bin Rashid City, Dubai',
            property_type: 'offplan',
            starting_price: 'AED 1,500,000 (~$408,000 USD)',
            availability_status: 'available',
            description: 'Luxury 1, 2 & 3 Bedroom Waterfront Apartments & Canal Villas in Dubai Hills / MBR City. Handover Q4 2026. Flexible 60/40 payment plan.',
            url: 'https://stageproperties.com/offplan'
        },
        {
            keyword: 'dubai_hills_villa',
            title: 'Dubai Hills Estate Luxury Villa',
            location: 'Dubai Hills Estate, Dubai',
            property_type: 'residential',
            starting_price: 'AED 8,900,000 (~$2,420,000 USD)',
            availability_status: 'available',
            description: 'Exclusive 5-Bedroom Golf Course Villa with private pool and skyline view.',
            url: 'https://stageproperties.com/buy/residential/properties-for-sale'
        },
        {
            keyword: 'binghatti_penthouse',
            title: 'Binghatti Skyrise Penthouse',
            location: 'Business Bay, Dubai',
            property_type: 'offplan',
            starting_price: 'AED 4,200,000 (~$1,143,000 USD)',
            availability_status: 'sold_out',
            description: 'Ultra-luxury penthouse with private jacuzzi overlooking Burj Khalifa. (Currently Sold Out - Inquire for resale units).',
            url: 'https://stageproperties.com/offplan'
        }
    ];

    const { data: propData, error: propErr } = await supabase
        .from('properties')
        .upsert(propertiesToSeed, { onConflict: 'keyword' })
        .select();

    if (propErr) {
        console.log('Properties table info:', propErr.message);
    } else {
        console.log('✅ Stage Properties inventory seeded:', propData);
    }
}

setupDatabase().catch(console.error);
