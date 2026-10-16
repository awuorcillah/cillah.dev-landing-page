const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NzgwZDE3YS1kZjRlLTRkNzQtYjIwOS0zNGU1OTdkYmIwMDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6ImE0MmI4NjEyLWUwNGItNDQ3ZS05Zjg1LWZhYzRmM2U3Zjc3ZSIsImlhdCI6MTc5MTUyODQ2Nn0.aJCsbL_6HZgKI64q2SqwItxYonQ5PimUl8hpEWnZQKg';

async function run() {
  const res = await fetch('https://n8n.cillah.dev/mcp-server/http', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream' },
    body: JSON.stringify({
      jsonrpc: '2.0', id: 1, method: 'tools/call',
      params: { name: 'search_workflow_executions', arguments: { workflowId: 'qW9A17dDWIbyVisQ', limit: 10 } }
    })
  });
  const text = await res.text();
  for (const line of text.split('\n')) {
    if (line.startsWith('data: ')) {
      const parsed = JSON.parse(line.slice(6));
      const list = JSON.parse(parsed.result.content[0].text);
      console.log('Executions:', list.data.map(e => ({ id: e.id, status: e.status, startedAt: e.startedAt })));
    }
  }
}

run().catch(console.error);
