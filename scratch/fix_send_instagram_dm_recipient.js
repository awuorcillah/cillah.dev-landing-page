const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NzgwZDE3YS1kZjRlLTRkNzQtYjIwOS0zNGU1OTdkYmIwMDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6ImE0MmI4NjEyLWUwNGItNDQ3ZS05Zjg1LWZhYzRmM2U3Zjc3ZSIsImlhdCI6MTc5MTUyODQ2Nn0.aJCsbL_6HZgKI64q2SqwItxYonQ5PimUl8hpEWnZQKg";

const workflowId = "qW9A17dDWIbyVisQ";

async function fixSendInstagramDmNode() {
    console.log("Fixing Send Instagram Direct Message recipient payload in n8n...");

    const operations = [
        {
            type: "updateNodeParameters",
            nodeName: "Send Instagram Direct Message",
            replace: true,
            parameters: {
                method: "POST",
                url: "https://graph.facebook.com/v18.0/me/messages",
                authentication: "predefinedCredentialType",
                nodeCredentialType: "facebookGraphApi",
                sendBody: true,
                specifyBody: "json",
                jsonBody: "={\n  \"recipient\": \"{{ $json.body?.entry?.[0]?.changes?.[0]?.value?.id ? { comment_id: $json.body.entry[0].changes[0].value.id } : { id: ($json.body?.entry?.[0]?.messaging?.[0]?.sender?.id || $json.body?.entry?.[0]?.changes?.[0]?.value?.from?.id) } }}\",\n  \"message\": {\n    \"text\": \"{{ $json.output }}\"\n  }\n}",
                options: {}
            }
        },
        {
            type: "updateNodeParameters",
            nodeName: "Send Agent Handoff Confirmation DM",
            replace: true,
            parameters: {
                method: "POST",
                url: "https://graph.facebook.com/v18.0/me/messages",
                authentication: "predefinedCredentialType",
                nodeCredentialType: "facebookGraphApi",
                sendBody: true,
                specifyBody: "json",
                jsonBody: "={\n  \"recipient\": \"{{ $('Instagram DM / Webhook Listener').item.json.body?.entry?.[0]?.changes?.[0]?.value?.id ? { comment_id: $('Instagram DM / Webhook Listener').item.json.body.entry[0].changes[0].value.id } : { id: ($('Instagram DM / Webhook Listener').item.json.body?.entry?.[0]?.messaging?.[0]?.sender?.id || $('Instagram DM / Webhook Listener').item.json.body?.entry?.[0]?.changes?.[0]?.value?.from?.id) } }}\",\n  \"message\": {\n    \"text\": \"{{ $json.assigned_agent_name || $json[0]?.assigned_agent_name || 'Ador' }} will contact you shortly to discuss more on {{ ($json.intent || $json[0]?.intent) == 'BUY' ? 'buying' : 'renting' }} your {{ $json.property_interest || $json[0]?.property_interest || 'property interest' }}.\"\n  }\n}",
                options: {}
            }
        }
    ];

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
                name: "update_workflow",
                arguments: {
                    workflowId,
                    versionName: "Fix Instagram DM recipient object for comment_id and IGSID",
                    operations
                }
            }
        })
    });

    const textOutput = await res.text();
    console.log("Update response:", textOutput);
}

fixSendInstagramDmNode().catch(console.error);
