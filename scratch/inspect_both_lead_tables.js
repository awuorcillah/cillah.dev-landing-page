const supabaseUrl = "https://hastygfosgyxrxzrzrur.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhhc3R5Z2Zvc2d5eHJ4enJ6cnVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDY1MDg4MSwiZXhwIjoyMTA2MjI2ODgxfQ.r6Zc60Fu_gDVlUSLrMKCT8XPwEkKG8ltYuccQwJfbNw";

async function inspectBothTables() {
    console.log("Checking sales_leads vs stage_leads in Supabase...");

    const stageRes = await fetch(`${supabaseUrl}/rest/v1/stage_leads?select=*&order=created_at.desc&limit=5`, {
        headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` }
    });
    const stageLeads = await stageRes.json();
    console.log("=== STAGE_LEADS (Latest 5) ===");
    console.log(JSON.stringify(stageLeads, null, 2));

    const salesRes = await fetch(`${supabaseUrl}/rest/v1/sales_leads?select=*&order=created_at.desc&limit=5`, {
        headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` }
    });
    const salesLeads = await salesRes.json();
    console.log("\n=== SALES_LEADS (Latest 5) ===");
    console.log(JSON.stringify(salesLeads, null, 2));
}

inspectBothTables().catch(console.error);
