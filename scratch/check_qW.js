const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NzgwZDE3YS1kZjRlLTRkNzQtYjIwOS0zNGU1OTdkYmIwMDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6ImE0MmI4NjEyLWUwNGItNDQ3ZS05Zjg1LWZhYzRmM2U3Zjc3ZSIsImlhdCI6MTc5MTUyODQ2Nn0.aJCsbL_6HZgKI64q2SqwItxYonQ5PimUl8hpEWnZQKg';

async function run() {
  const res = await fetch('https://n8n.cillah.dev/mcp-server/http', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream' },
    body: JSON.stringify({
      jsonrpc: '2.0', id: 1, method: 'tools/call',
      params: { name: 'get_workflow_details', arguments: { workflowId: 'qW9A17dDWIbyVisQ' } }
    })
  });
  const text = await res.text();
  for (const line of text.split('\n')) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      const wf = JSON.parse(data.result.content[0].text).workflow;
      console.log('Workflow Name:', wf.name);
      console.log('Nodes count:', wf.nodes.length);
      const parseNode = wf.nodes.find(n => n.name === 'Parse Qualified Lead Data');
      console.log('Parse Qualified Lead Data code:\n', parseNode?.parameters?.jsCode);

      const memNode = wf.nodes.find(n => n.name === 'Window Buffer Memory');
      console.log('Memory sessionKey:', memNode?.parameters?.sessionKey);
    }
  }
}

run().catch(console.error);
