const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NzgwZDE3YS1kZjRlLTRkNzQtYjIwOS0zNGU1OTdkYmIwMDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6ImE0MmI4NjEyLWUwNGItNDQ3ZS05Zjg1LWZhYzRmM2U3Zjc3ZSIsImlhdCI6MTc5MTUyODQ2Nn0.aJCsbL_6HZgKI64q2SqwItxYonQ5PimUl8hpEWnZQKg";

async function inspectUpdateTool() {
    const payload = {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list",
        params: {}
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
    const lines = text.split('\n');
    for (const l of lines) {
        if (l.startsWith('data: ')) {
            const data = JSON.parse(l.substring(6));
            if (data.result && data.result.tools) {
                const tool = data.result.tools.find(t => t.name === 'update_workflow');
                console.log("update_workflow tool schema:", JSON.stringify(tool, null, 2));
            }
        }
    }
}

inspectUpdateTool();
