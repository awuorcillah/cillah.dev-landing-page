const supabaseUrl = "https://hastygfosgyxrxzrzrur.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhhc3R5Z2Zvc2d5eHJ4enJ6cnVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDY1MDg4MSwiZXhwIjoyMTA2MjI2ODgxfQ.r6Zc60Fu_gDVlUSLrMKCT8XPwEkKG8ltYuccQwJfbNw";

async function inspectTables() {
    console.log("Checking stage_leads and staff_members in Supabase...");

    const leadsRes = await fetch(`${supabaseUrl}/rest/v1/stage_leads?limit=5`, {
        headers: {
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`
        }
    });
    const leads = await leadsRes.json();
    console.log("=== STAGE_LEADS COLUMNS & SAMPLE ===");
    console.log(JSON.stringify(leads?.[0] || leads, null, 2));

    const staffRes = await fetch(`${supabaseUrl}/rest/v1/staff_members?limit=10`, {
        headers: {
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`
        }
    });
    const staff = await staffRes.json();
    console.log("\n=== STAFF_MEMBERS (Active Agents) ===");
    console.log(JSON.stringify(staff, null, 2));
}

inspectTables().catch(console.error);
