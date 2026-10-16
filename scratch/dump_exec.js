const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NzgwZDE3YS1kZjRlLTRkNzQtYjIwOS0zNGU1OTdkYmIwMDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6ImE0MmI4NjEyLWUwNGItNDQ3ZS05Zjg1LWZhYzRmM2U3Zjc3ZSIsImlhdCI6MTc5MTUyODQ2Nn0.aJCsbL_6HZgKI64q2SqwItxYonQ5PimUl8hpEWnZQKg";

async function dumpExec(id) {
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
        arguments: { workflowId: "qW9A17dDWIbyVisQ", executionId: id }
      }
    })
  });

  const text = await res.text();
  console.log("Raw output length:", text.length);
  // find the text payload
  const lines = text.split('\n');
  for (const l of lines) {
    if (l.startsWith('data: ')) {
      const data = JSON.parse(l.slice(6));
      console.log("Data:", JSON.stringify(data).slice(0, 500));
    }
  }
}

dumpExec("831").catch(console.error);
