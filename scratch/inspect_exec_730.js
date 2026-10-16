const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NzgwZDE3YS1kZjRlLTRkNzQtYjIwOS0zNGU1OTdkYmIwMDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6ImE0MmI4NjEyLWUwNGItNDQ3ZS05Zjg1LWZhYzRmM2U3Zjc3ZSIsImlhdCI6MTc5MTUyODQ2Nn0.aJCsbL_6HZgKI64q2SqwItxYonQ5PimUl8hpEWnZQKg";
const workflowId = "qW9A17dDWIbyVisQ";

async function inspect730() {
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
                arguments: { workflowId, executionId: "730", includeData: true }
            }
        })
    });

    const detailText = await detailRes.text();
    const dLine = detailText.split("\n").find(line => line.startsWith("data:"));
    const dJson = JSON.parse(dLine.replace("data:", "").trim());
    let raw = dJson.result?.structuredContent || JSON.parse(dJson.result?.content?.[0]?.text || "{}");
    const runData = raw.data?.resultData?.runData;

    console.log("Execution #730 Executed Nodes:", Object.keys(runData || {}));
    if (runData?.["Parse Qualified Lead Data"]) {
        console.log("  Parse Lead Data:", JSON.stringify(runData["Parse Qualified Lead Data"]?.[0]?.data?.main));
    }
    if (runData?.["Supabase REST API (Check Repeat User)"]) {
        console.log("  Check Repeat User:", JSON.stringify(runData["Supabase REST API (Check Repeat User)"]?.[0]?.data?.main));
    }
    if (runData?.["Is Repeat User?"]) {
        console.log("  Is Repeat User?:", JSON.stringify(runData["Is Repeat User?"]?.[0]?.data?.main));
    }
    if (runData?.["Supabase REST API (Insert Lead)"]) {
        console.log("  Insert Lead:", JSON.stringify(runData["Supabase REST API (Insert Lead)"]?.[0]?.data?.main));
    }
    if (runData?.["Send Agent Handoff Confirmation DM"]) {
        console.log("  Send Agent Handoff DM:", JSON.stringify(runData["Send Agent Handoff Confirmation DM"]?.[0]?.data?.main));
    }
    if (runData?.["Notify New Agent Ador on WhatsApp"]) {
        console.log("  Notify Agent WhatsApp:", JSON.stringify(runData["Notify New Agent Ador on WhatsApp"]?.[0]?.data?.main));
    }
}

inspect730().catch(console.error);
