const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NzgwZDE3YS1kZjRlLTRkNzQtYjIwOS0zNGU1OTdkYmIwMDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6ImE0MmI4NjEyLWUwNGItNDQ3ZS05Zjg1LWZhYzRmM2U3Zjc3ZSIsImlhdCI6MTc5MTUyODQ2Nn0.aJCsbL_6HZgKI64q2SqwItxYonQ5PimUl8hpEWnZQKg";

async function testN8nMcpRpc() {
    console.log("Testing n8n MCP JSON-RPC endpoint at https://n8n.cillah.dev/mcp-server/http ...");

    const payload = {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
            protocolVersion: "2024-11-05",
            capabilities: {},
            clientInfo: {
                name: "AntigravityClient",
                version: "1.0.0"
            }
        }
    };

    try {
        const response = await fetch("https://n8n.cillah.dev/mcp-server/http", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                "Accept": "application/json, text/event-stream"
            },
            body: JSON.stringify(payload)
        });

        console.log("MCP Response Status:", response.status, response.statusText);
        const text = await response.text();
        console.log("MCP Output:", text.substring(0, 1000));
    } catch (err) {
        console.error("MCP Error:", err.message);
    }
}

testN8nMcpRpc();
