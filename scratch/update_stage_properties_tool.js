const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NzgwZDE3YS1kZjRlLTRkNzQtYjIwOS0zNGU1OTdkYmIwMDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6ImE0MmI4NjEyLWUwNGItNDQ3ZS05Zjg1LWZhYzRmM2U3Zjc3ZSIsImlhdCI6MTc5MTUyODQ2Nn0.aJCsbL_6HZgKI64q2SqwItxYonQ5PimUl8hpEWnZQKg";

const workflowId = "qW9A17dDWIbyVisQ";

async function useHttpRequestTool() {
    console.log(`Setting typeVersion 4.5 for httpRequest tool on workflow ${workflowId}...`);

    const operations = [
        {
            type: "removeNode",
            nodeName: "search_stage_properties"
        },
        {
            type: "addNode",
            node: {
                name: "search_stage_properties",
                type: "n8n-nodes-base.httpRequestTool",
                typeVersion: 4.5,
                position: [680, 520],
                parameters: {
                    name: "search_stage_properties",
                    description: "Look up Stage Properties inventory table in Supabase by keyword (e.g. hartland, valia, eden, vitalia, sapphire, opus), category (Residential, Commercial, Off-Plan), price, description, and property video link.",
                    method: "GET",
                    url: "https://hastygfosgyxrxzrzrur.supabase.co/rest/v1/search_stage_properties",
                    sendQuery: true,
                    specifyQuery: "json",
                    jsonQuery: "={\n  \"select\": \"*\"\n}"
                }
            }
        },
        {
            type: "addConnection",
            source: "search_stage_properties",
            target: "real estate instagram dm",
            connectionType: "ai_tool",
            sourceIndex: 0,
            targetIndex: 0
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
                    versionName: "Set typeVersion 4.5 for search_stage_properties httpRequestTool",
                    operations
                }
            }
        })
    });

    const textOutput = await res.text();
    console.log("Update output:", textOutput);
}

useHttpRequestTool().catch(console.error);
