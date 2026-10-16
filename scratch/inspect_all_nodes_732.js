const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NzgwZDE3YS1kZjRlLTRkNzQtYjIwOS0zNGU1OTdkYmIwMDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6ImE0MmI4NjEyLWUwNGItNDQ3ZS05Zjg1LWZhYzRmM2U3Zjc3ZSIsImlhdCI6MTc5MTUyODQ2Nn0.aJCsbL_6HZgKI64q2SqwItxYonQ5PimUl8hpEWnZQKg";
const workflowId = "qW9A17dDWIbyVisQ";

async function inspectAll732() {
    const listRes = await fetch("https://n8n.cillah.dev/mcp-server/http", {
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
                name: "search_workflow_executions",
                arguments: { workflowId, limit: 1 }
            }
        })
    });

    const lText = await listRes.text();
    const lLine = lText.split("\n").find(line => line.startsWith("data:"));
    const lJson = JSON.parse(lLine.replace("data:", "").trim());
    let execs = lJson.result?.structuredContent?.data || JSON.parse(lJson.result?.content?.[0]?.text || "{}").data;
    const latestId = "737";
    console.log("Checking Execution ID:", latestId);

    const detailRes = await fetch("https://n8n.cillah.dev/mcp-server/http", {
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
                name: "get_workflow_execution",
                arguments: { workflowId, executionId: latestId, includeData: true }
            }
        })
    });

    const detailText = await detailRes.text();
    const dLine = detailText.split("\n").find(line => line.startsWith("data:"));
    const dJson = JSON.parse(dLine.replace("data:", "").trim());
    let raw = dJson.result?.structuredContent || JSON.parse(dJson.result?.content?.[0]?.text || "{}");
    const runData = raw.data?.resultData?.runData;

    console.log("=== ALL NODES RUN IN #732 ===");
    if (runData) {
        for (const [nodeName, runs] of Object.entries(runData)) {
            console.log(`Node "${nodeName}":`, runs.map(r => r.executionStatus));
            for (const r of runs) {
                if (r.error) console.log(`  ERROR in Node "${nodeName}":`, r.error.message);
            }
        }
    }
}

inspectAll732().catch(console.error);
