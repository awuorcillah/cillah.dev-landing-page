const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NzgwZDE3YS1kZjRlLTRkNzQtYjIwOS0zNGU1OTdkYmIwMDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6ImE0MmI4NjEyLWUwNGItNDQ3ZS05Zjg1LWZhYzRmM2U3Zjc3ZSIsImlhdCI6MTc5MTUyODQ2Nn0.aJCsbL_6HZgKI64q2SqwItxYonQ5PimUl8hpEWnZQKg";
const workflowId = "qW9A17dDWIbyVisQ";

async function checkRecentExecutions() {
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
                name: "search_workflow_executions",
                arguments: { workflowId, limit: 20 }
            }
        })
    });

    const textOutput = await res.text();
    const dataLine = textOutput.split("\n").find(line => line.startsWith("data:"));
    const jsonRpcData = JSON.parse(dataLine.replace("data:", "").trim());
    let execs = jsonRpcData.result?.structuredContent?.data || JSON.parse(jsonRpcData.result?.content?.[0]?.text || "{}").data;

    for (const exec of execs) {
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
                    arguments: { workflowId, executionId: exec.id, includeData: true }
                }
            })
        });

        const detailText = await detailRes.text();
        const dLine = detailText.split("\n").find(line => line.startsWith("data:"));
        const dJson = JSON.parse(dLine.replace("data:", "").trim());
        let raw = dJson.result?.structuredContent || JSON.parse(dJson.result?.content?.[0]?.text || "{}");
        const runData = raw.data?.resultData?.runData;

        let listenerBody = runData?.["Instagram DM / Webhook Listener"]?.[0]?.data?.main?.[1]?.[0]?.json?.body;
        let changeVal = listenerBody?.entry?.[0]?.changes?.[0]?.value || listenerBody?.entry?.[0]?.messaging?.[0];
        let field = listenerBody?.entry?.[0]?.changes?.[0]?.field || (listenerBody?.entry?.[0]?.messaging ? "messaging" : "unknown");
        let fromUser = changeVal?.from?.username || changeVal?.sender?.id;
        let text = changeVal?.text || changeVal?.message?.text;
        
        let repliedNode = !!runData?.["Public Comment Reply (Check your DMs)"];
        let dmNode = !!runData?.["Send Instagram Direct Message"];

        console.log(`Exec #${exec.id} [${exec.status}] Field: ${field} | From: ${fromUser} | Text: "${text}" | RepliedComment: ${repliedNode} | SentDM: ${dmNode}`);
    }
}

checkRecentExecutions().catch(console.error);
