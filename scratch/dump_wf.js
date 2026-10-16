const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NzgwZDE3YS1kZjRlLTRkNzQtYjIwOS0zNGU1OTdkYmIwMDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6ImE0MmI4NjEyLWUwNGItNDQ3ZS05Zjg1LWZhYzRmM2U3Zjc3ZSIsImlhdCI6MTc5MTUyODQ2Nn0.aJCsbL_6HZgKI64q2SqwItxYonQ5PimUl8hpEWnZQKg";
const fs = require('fs');

async function dump() {
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
        arguments: { workflowId: "qW9A17dDWIbyVisQ" }
      }
    })
  });

  const text = await res.text();
  // Parse SSE or JSON
  const lines = text.split('\n');
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const parsed = JSON.parse(line.slice(6));
      if (parsed.result?.content?.[0]?.text) {
        const wfObj = JSON.parse(parsed.result.content[0].text);
        fs.writeFileSync('scratch/full_wf.json', JSON.stringify(wfObj.workflow, null, 2));
        console.log("Successfully dumped workflow! Nodes:", wfObj.workflow.nodes.length);
        return;
      }
    }
  }
}

dump();
