const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NzgwZDE3YS1kZjRlLTRkNzQtYjIwOS0zNGU1OTdkYmIwMDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6ImE0MmI4NjEyLWUwNGItNDQ3ZS05Zjg1LWZhYzRmM2U3Zjc3ZSIsImlhdCI6MTc5MTUyODQ2Nn0.aJCsbL_6HZgKI64q2SqwItxYonQ5PimUl8hpEWnZQKg";

const workflowId = "qW9A17dDWIbyVisQ";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhhc3R5Z2Zvc2d5eHJ4enJ6cnVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2NTA4ODEsImV4cCI6MjEwNjIyNjg4MX0.EVdnsyzWPuDJPJ_-ttg8DrA2Nl14Z04saG9Xj-rPjvg";

async function fixBothN8nErrors() {
    console.log(`Fixing Window Buffer Memory and search_stage_properties tool on workflow ${workflowId}...`);

    const operations = [
        // 1. Fix Window Buffer Memory key to use $json directly (avoids paired item error)
        {
            type: "updateNodeParameters",
            nodeName: "Window Buffer Memory",
            replace: true,
            parameters: {
                sessionIdType: "customKey",
                sessionKey: "={{ $json.body?.entry?.[0]?.changes?.[0]?.value?.from?.id || 'default_session' }}",
                contextWindowLength: 10
            }
        },

        // 2. Fix search_stage_properties HTTP Tool to send Supabase Headers (apikey & Authorization)
        {
            type: "updateNodeParameters",
            nodeName: "search_stage_properties",
            replace: true,
            parameters: {
                name: "search_stage_properties",
                description: "Look up Stage Properties inventory table in Supabase by keyword (e.g. hartland, valia, eden, vitalia, sapphire, opus), category (Residential, Commercial, Off-Plan), price, description, and property video link.",
                method: "GET",
                url: "https://hastygfosgyxrxzrzrur.supabase.co/rest/v1/search_stage_properties",
                sendHeaders: true,
                specifyHeaders: "json",
                jsonHeaders: `={\n  "apikey": "${supabaseAnonKey}",\n  "Authorization": "Bearer ${supabaseAnonKey}"\n}`,
                sendQuery: true,
                specifyQuery: "json",
                jsonQuery: "={\n  \"select\": \"*\"\n}"
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
                    versionName: "Fix Memory sessionKey and add Supabase API headers",
                    operations
                }
            }
        })
    });

    const textOutput = await res.text();
    console.log("Update output:", textOutput);
}

fixBothN8nErrors().catch(console.error);
