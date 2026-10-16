const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NzgwZDE3YS1kZjRlLTRkNzQtYjIwOS0zNGU1OTdkYmIwMDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6ImE0MmI4NjEyLWUwNGItNDQ3ZS05Zjg1LWZhYzRmM2U3Zjc3ZSIsImlhdCI6MTc5MTUyODQ2Nn0.aJCsbL_6HZgKI64q2SqwItxYonQ5PimUl8hpEWnZQKg";

async function cleanupDrafts() {
    const idsToArchive = ["s2ExZm67n4lhQmt0"];
    for (const id of idsToArchive) {
        const payload = {
            jsonrpc: "2.0",
            id: 1,
            method: "tools/call",
            params: {
                name: "archive_workflow",
                arguments: { workflowId: id }
            }
        };

        const res = await fetch("https://n8n.cillah.dev/mcp-server/http", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                "Accept": "application/json, text/event-stream"
            },
            body: JSON.stringify(payload)
        });
        console.log(`Archived ${id}:`, await res.text());
    }
}

cleanupDrafts();
