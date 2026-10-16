const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NzgwZDE3YS1kZjRlLTRkNzQtYjIwOS0zNGU1OTdkYmIwMDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6ImE0MmI4NjEyLWUwNGItNDQ3ZS05Zjg1LWZhYzRmM2U3Zjc3ZSIsImlhdCI6MTc5MTUyODQ2Nn0.aJCsbL_6HZgKI64q2SqwItxYonQ5PimUl8hpEWnZQKg";
const workflowId = "qW9A17dDWIbyVisQ";

async function setNodeErrorSettings() {
    console.log("Setting onError = continueRegularOutput on HTTP nodes to prevent Meta retry loops...");

    const operations = [
        {
            type: "setNodeSettings",
            nodeName: "Public Comment Reply (Check your DMs)",
            settings: {
                onError: "continueRegularOutput"
            }
        },
        {
            type: "setNodeSettings",
            nodeName: "Send Instagram Direct Message",
            settings: {
                onError: "continueRegularOutput"
            }
        },
        {
            type: "setNodeSettings",
            nodeName: "Send Agent Handoff Confirmation DM",
            settings: {
                onError: "continueRegularOutput"
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
                    versionName: "Add Node Error Safety (Prevent Meta Retry Loops) v9.0",
                    operations
                }
            }
        })
    });

    const textOutput = await res.text();
    console.log("Update Settings Result:", textOutput);

    // Now publish the workflow
    const pubRes = await fetch("https://n8n.cillah.dev/mcp-server/http", {
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
                name: "publish_workflow",
                arguments: { workflowId }
            }
        })
    });

    const pubText = await pubRes.text();
    console.log("Publish Result:", pubText);
}

setNodeErrorSettings().catch(console.error);
