const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NzgwZDE3YS1kZjRlLTRkNzQtYjIwOS0zNGU1OTdkYmIwMDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6ImE0MmI4NjEyLWUwNGItNDQ3ZS05Zjg1LWZhYzRmM2U3Zjc3ZSIsImlhdCI6MTc5MTUyODQ2Nn0.aJCsbL_6HZgKI64q2SqwItxYonQ5PimUl8hpEWnZQKg";

const workflowId = "qW9A17dDWIbyVisQ";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhhc3R5Z2Zvc2d5eHJ4enJ6cnVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2NTA4ODEsImV4cCI6MjEwNjIyNjg4MX0.EVdnsyzWPuDJPJ_-ttg8DrA2Nl14Z04saG9Xj-rPjvg";

async function fixAllSupabaseNodes() {
    console.log(`Fixing all Supabase nodes on workflow ${workflowId}...`);

    const operations = [
        // 1. Fix search_stage_properties to query 'properties' table with API headers
        {
            type: "updateNodeParameters",
            nodeName: "search_stage_properties",
            replace: true,
            parameters: {
                name: "search_stage_properties",
                description: "Look up Stage Properties inventory table in Supabase by keyword (e.g. hartland, valia, eden, vitalia, sapphire, opus), category (Residential, Commercial, Off-Plan), price, description, and property video link.",
                method: "GET",
                url: "https://hastygfosgyxrxzrzrur.supabase.co/rest/v1/properties",
                sendHeaders: true,
                specifyHeaders: "json",
                jsonHeaders: `={\n  "apikey": "${supabaseAnonKey}",\n  "Authorization": "Bearer ${supabaseAnonKey}"\n}`,
                sendQuery: true,
                specifyQuery: "json",
                jsonQuery: "={\n  \"select\": \"*\"\n}"
            }
        },

        // 2. Fix Supabase REST API (Check Repeat User) URL & API headers
        {
            type: "updateNodeParameters",
            nodeName: "Supabase REST API (Check Repeat User)",
            replace: true,
            parameters: {
                method: "GET",
                url: "=https://hastygfosgyxrxzrzrur.supabase.co/rest/v1/stage_leads?ig_user_id=eq.{{ $json.body?.entry?.[0]?.changes?.[0]?.value?.from?.id || '' }}",
                sendHeaders: true,
                specifyHeaders: "json",
                jsonHeaders: `={\n  "apikey": "${supabaseAnonKey}",\n  "Authorization": "Bearer ${supabaseAnonKey}"\n}`,
                options: {}
            }
        },

        // 3. Fix Supabase REST API (Insert Lead) API headers
        {
            type: "updateNodeParameters",
            nodeName: "Supabase REST API (Insert Lead)",
            replace: true,
            parameters: {
                method: "POST",
                url: "https://hastygfosgyxrxzrzrur.supabase.co/rest/v1/stage_leads",
                sendHeaders: true,
                specifyHeaders: "json",
                jsonHeaders: `={\n  "apikey": "${supabaseAnonKey}",\n  "Authorization": "Bearer ${supabaseAnonKey}"\n}`,
                sendBody: true,
                specifyBody: "json",
                jsonBody: "={\n  \"full_name\": \"{{ $json.lead_name }}\",\n  \"phone_number\": \"{{ $json.lead_phone }}\",\n  \"intent\": \"{{ $json.intent }}\",\n  \"property_interest\": \"{{ $json.property_interest }}\",\n  \"assigned_agent_name\": \"Ador\",\n  \"status\": \"new_inquiry\",\n  \"ig_user_id\": \"{{ $('Instagram DM / Webhook Listener').item.json.body?.entry?.[0]?.changes?.[0]?.value?.from?.id }}\"\n}",
                options: {}
            }
        }
    ];

    const res = await fetch("https://n8n.cillah.dev/mcp-server/http", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream"
        },
        body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "tools/call",
            params: {
                name: "update_workflow",
                arguments: {
                    workflowId,
                    versionName: "Fix Supabase table URLs and add API headers to all 3 nodes",
                    operations
                }
            }
        })
    });

    const textOutput = await res.text();
    console.log("Update output:", textOutput);
}

fixAllSupabaseNodes().catch(console.error);
