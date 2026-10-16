const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NzgwZDE3YS1kZjRlLTRkNzQtYjIwOS0zNGU1OTdkYmIwMDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6ImE0MmI4NjEyLWUwNGItNDQ3ZS05Zjg1LWZhYzRmM2U3Zjc3ZSIsImlhdCI6MTc5MTUyODQ2Nn0.aJCsbL_6HZgKI64q2SqwItxYonQ5PimUl8hpEWnZQKg";

async function searchSubnodes() {
    const payload = {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
            name: "get_workflow_sdk_reference",
            arguments: {}
        }
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
    // Search text for languageModel or subnodes
    const lines = text.split('\n');
    lines.forEach((l, i) => {
        if (l.includes('languageModel') || l.includes('subnodes') || l.includes('memory(')) {
            console.log(`Line ${i}:`, l);
            console.log(lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 10)).join('\n'));
            console.log("-----------------------------------------");
        }
    });
}

searchSubnodes();
