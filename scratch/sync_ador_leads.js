const supabaseUrl = "https://hastygfosgyxrxzrzrur.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhhc3R5Z2Zvc2d5eHJ4enJ6cnVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDY1MDg4MSwiZXhwIjoyMTA2MjI2ODgxfQ.r6Zc60Fu_gDVlUSLrMKCT8XPwEkKG8ltYuccQwJfbNw";

async function syncLeadsForAdor() {
    console.log("Syncing leads for Ador in both stage_leads and sales_leads...");

    // 1. Update stage_leads to ensure assigned_agent_email is set
    const updateRes = await fetch(`${supabaseUrl}/rest/v1/stage_leads?assigned_agent_name=eq.Ador`, {
        method: "PATCH",
        headers: {
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        },
        body: JSON.stringify({
            assigned_agent_email: "ador.ai815@gmail.com",
            assigned_agent_id: "12965bb8-61a8-44ea-a6e1-13605250722c"
        })
    });
    const updatedStage = await updateRes.json();
    console.log("Updated stage_leads:", updatedStage.length);

    // 2. Fetch all stage_leads for Ador
    const stageRes = await fetch(`${supabaseUrl}/rest/v1/stage_leads?assigned_agent_email=eq.ador.ai815@gmail.com`, {
        headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` }
    });
    const stageLeads = await stageRes.json();

    // 3. Insert each into sales_leads table so Ador's /user/dashboard sees them
    for (const lead of stageLeads) {
        const salesLeadData = {
            full_name: lead.full_name || "Cheryl Atulah",
            email: "cheryl@cillah.dev",
            phone_number: lead.phone_number || "+254794357912",
            company_name: lead.property_interest || "Sobha Hartland",
            source: "instagram_dm",
            stage: "new_lead",
            assigned_agent_email: "ador.ai815@gmail.com",
            assigned_agent_id: "12965bb8-61a8-44ea-a6e1-13605250722c",
            is_qualified: true,
            estimated_value: 1500000,
            last_interaction_at: lead.created_at,
            initial_note: `Instagram DM Lead for Stage Properties: Interested in ${lead.property_interest} (${lead.intent}). Handled by AI Advisor and assigned to Ador.`
        };

        const insertRes = await fetch(`${supabaseUrl}/rest/v1/sales_leads`, {
            method: "POST",
            headers: {
                "apikey": supabaseKey,
                "Authorization": `Bearer ${supabaseKey}`,
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            },
            body: JSON.stringify(salesLeadData)
        });
        const inserted = await insertRes.json();
        console.log("Inserted into sales_leads:", inserted?.[0]?.id || inserted);
    }
}

syncLeadsForAdor().catch(console.error);
