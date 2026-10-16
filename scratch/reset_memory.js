const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NzgwZDE3YS1kZjRlLTRkNzQtYjIwOS0zNGU1OTdkYmIwMDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6ImE0MmI4NjEyLWUwNGItNDQ3ZS05Zjg1LWZhYzRmM2U3Zjc3ZSIsImlhdCI6MTc5MTUyODQ2Nn0.aJCsbL_6HZgKI64q2SqwItxYonQ5PimUl8hpEWnZQKg';

async function resetMemory() {
  const updatePayload = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'update_workflow',
      arguments: {
        workflowId: 'qW9A17dDWIbyVisQ',
        versionName: 'Reset memory session to live6 for fresh lead recording',
        operations: [
          {
            type: 'updateNodeParameters',
            nodeName: 'Window Buffer Memory',
            parameters: {
              sessionIdType: 'customKey',
              sessionKey: "={{ ($('Instagram DM / Webhook Listener').item.json.body?.entry?.[0]?.messaging?.[0]?.sender?.id || $('Instagram DM / Webhook Listener').item.json.body?.entry?.[0]?.changes?.[0]?.value?.from?.id || 'default_session') + '_live6' }}",
              contextWindowLength: 10
            }
          }
        ]
      }
    }
  };

  const res = await fetch('https://n8n.cillah.dev/mcp-server/http', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream'
    },
    body: JSON.stringify(updatePayload)
  });
  const updateText = await res.text();
  console.log('Update res:', updateText);

  const pubRes = await fetch('https://n8n.cillah.dev/mcp-server/http', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream'
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: { name: 'publish_workflow', arguments: { workflowId: 'qW9A17dDWIbyVisQ' } }
    })
  });
  const pubText = await pubRes.text();
  console.log('Publish res:', pubText);
}

resetMemory().catch(console.error);
