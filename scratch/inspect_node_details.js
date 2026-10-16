const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NzgwZDE3YS1kZjRlLTRkNzQtYjIwOS0zNGU1OTdkYmIwMDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6ImE0MmI4NjEyLWUwNGItNDQ3ZS05Zjg1LWZhYzRmM2U3Zjc3ZSIsImlhdCI6MTc5MTUyODQ2Nn0.aJCsbL_6HZgKI64q2SqwItxYonQ5PimUl8hpEWnZQKg";
const workflowId = "qW9A17dDWIbyVisQ";

async function inspectNodes() {
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
                name: "get_workflow_details",
                arguments: { workflowId }
            }
        })
    });

    const textOutput = await res.text();
    const dataLine = textOutput.split("\n").find(line => line.startsWith("data:"));
    const jsonRpcData = JSON.parse(dataLine.replace("data:", "").trim());
    let wfData = jsonRpcData.result?.structuredContent || JSON.parse(jsonRpcData.result?.content?.[0]?.text || "{}");
    const wf = wfData.workflow || wfData;

    const n1 = wf.nodes.find(n => n.name === "Is Customer Top-Level Comment?");
    const n2 = wf.nodes.find(n => n.name === "Is Incoming Customer Message?");
    const n3 = wf.nodes.find(n => n.name === "Public Comment Reply (Check your DMs)");

    console.log("=== Is Customer Top-Level Comment? ===");
    console.log(JSON.stringify(n1, null, 2));

    console.log("\n=== Is Incoming Customer Message? ===");
    console.log(JSON.stringify(n2, null, 2));

    console.log("\n=== Public Comment Reply (Check your DMs) ===");
    console.log(JSON.stringify(n3, null, 2));
}

inspectNodes().catch(console.error);
