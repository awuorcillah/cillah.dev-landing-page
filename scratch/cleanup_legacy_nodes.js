const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NzgwZDE3YS1kZjRlLTRkNzQtYjIwOS0zNGU1OTdkYmIwMDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6ImE0MmI4NjEyLWUwNGItNDQ3ZS05Zjg1LWZhYzRmM2U3Zjc3ZSIsImlhdCI6MTc5MTUyODQ2Nn0.aJCsbL_6HZgKI64q2SqwItxYonQ5PimUl8hpEWnZQKg";
const workflowId = "qW9A17dDWIbyVisQ";

async function cleanupLegacyNodes() {
  const operations = [
    { type: "removeNode", nodeName: "Is Repeat User?" },
    { type: "removeNode", nodeName: "Fetch Active Sales Agent" },
    { type: "removeNode", nodeName: "Notify Existing Agent on WhatsApp (Repeat User)" },
    { type: "removeNode", nodeName: "Supabase REST API (Update Repeat Lead in Stage Leads)" },
    { type: "removeNode", nodeName: "Supabase REST API (Update Repeat Lead in Sales Leads)" }
  ];

  console.log("Removing legacy disconnected nodes...");
  const updateRes = await fetch("https://n8n.cillah.dev/mcp-server/http", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream"
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 20,
      method: "tools/call",
      params: {
        name: "update_workflow",
        arguments: {
          workflowId: workflowId,
          versionName: "Prune legacy nodes - Streamlined CRM Architecture",
          operations: operations
        }
      }
    })
  });

  console.log("Cleanup result:", (await updateRes.text()).slice(0, 300));

  const pubRes = await fetch("https://n8n.cillah.dev/mcp-server/http", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream"
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 21,
      method: "tools/call",
      params: {
        name: "publish_workflow",
        arguments: { workflowId: workflowId }
      }
    })
  });

  console.log("Published clean version:", (await pubRes.text()).slice(0, 300));
}

cleanupLegacyNodes().catch(console.error);
