const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NzgwZDE3YS1kZjRlLTRkNzQtYjIwOS0zNGU1OTdkYmIwMDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6ImE0MmI4NjEyLWUwNGItNDQ3ZS05Zjg1LWZhYzRmM2U3Zjc3ZSIsImlhdCI6MTc5MTUyODQ2Nn0.aJCsbL_6HZgKI64q2SqwItxYonQ5PimUl8hpEWnZQKg";
const fs = require('fs');
const path = require('path');

async function sendMcpRequest(method, params = {}, id = 1) {
    const payload = {
        jsonrpc: "2.0",
        id,
        method,
        params
    };

    const response = await fetch("https://n8n.cillah.dev/mcp-server/http", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream"
        },
        body: JSON.stringify(payload)
    });

    const text = await response.text();
    return text;
}

async function runMcpCreation() {
    console.log("1. Initializing MCP handshake...");
    await sendMcpRequest("initialize", {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "AntigravityClient", version: "1.0.0" }
    }, 1);

    console.log("2. Sending initialized notification...");
    await sendMcpRequest("notifications/initialized", {}, 2);

    console.log("3. Listing MCP available tools...");
    const toolsRes = await sendMcpRequest("tools/list", {}, 3);
    console.log("Available tools response snippet:");
    console.log(toolsRes.substring(0, 1500));

    // Now let's attempt calling `create_workflow_from_code` or similar tool if available
    const workflowPath = path.join(__dirname, 'stage_properties_n8n_workflow.json');
    const workflowJson = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

    const callRes = await sendMcpRequest("tools/call", {
        name: "create_workflow_from_code",
        arguments: {
            name: "Stage Properties - Luxury Instagram Hartland Lead Engine",
            nodes: workflowJson.nodes,
            connections: workflowJson.connections
        }
    }, 4);

    console.log("Tool call response snippet:");
    console.log(callRes.substring(0, 1500));
}

runMcpCreation().catch(console.error);
