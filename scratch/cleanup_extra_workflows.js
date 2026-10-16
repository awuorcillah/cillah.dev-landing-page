const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NzgwZDE3YS1kZjRlLTRkNzQtYjIwOS0zNGU1OTdkYmIwMDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6ImE0MmI4NjEyLWUwNGItNDQ3ZS05Zjg1LWZhYzRmM2U3Zjc3ZSIsImlhdCI6MTc5MTUyODQ2Nn0.aJCsbL_6HZgKI64q2SqwItxYonQ5PimUl8hpEWnZQKg";

async function archiveDuplicates() {
    const duplicateIds = [
        "Qb6Fa59EBJIM4KUo",
        "m452zXJpQY99dPJe",
        "95wpEKJRkVAuVAMx"
    ];

    console.log("Cleaning up duplicate Stage Properties workflows...");

    for (const id of duplicateIds) {
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

        const text = await res.text();
        console.log(`Archived ${id}:`, text);
    }
}

archiveDuplicates();
