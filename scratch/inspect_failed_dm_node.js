const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NzgwZDE3YS1kZjRlLTRkNzQtYjIwOS0zNGU1OTdkYmIwMDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6ImE0MmI4NjEyLWUwNGItNDQ3ZS05Zjg1LWZhYzRmM2U3Zjc3ZSIsImlhdCI6MTc5MTUyODQ2Nn0.aJCsbL_6HZgKI64q2SqwItxYonQ5PimUl8hpEWnZQKg";
const workflowId = "qW9A17dDWIbyVisQ";

async function inspectFailedNodeDetails(id) {
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
                name: "get_workflow_execution",
                arguments: { workflowId, executionId: id, includeData: true }
            }
        })
    });

    const textOutput = await res.text();
    const dataLine = textOutput.split("\n").find(line => line.startsWith("data:"));
    const jsonRpcData = JSON.parse(dataLine.replace("data:", "").trim());
    let raw = jsonRpcData.result?.structuredContent || JSON.parse(jsonRpcData.result?.content?.[0]?.text || "{}");
    const runData = raw.data?.resultData?.runData;

    console.log(`=== DETAILED ERROR FOR EXECUTION #${id} ===`);
    const dmNode = runData?.["Send Instagram Direct Message"];
    if (dmNode) {
        console.log(JSON.stringify(dmNode, null, 2));
    } else {
        console.log("dmNode not found or not executed in runData:", Object.keys(runData || {}));
    }
}

inspectFailedNodeDetails("732").catch(console.error);
