const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NzgwZDE3YS1kZjRlLTRkNzQtYjIwOS0zNGU1OTdkYmIwMDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6ImE0MmI4NjEyLWUwNGItNDQ3ZS05Zjg1LWZhYzRmM2U3Zjc3ZSIsImlhdCI6MTc5MTUyODQ2Nn0.aJCsbL_6HZgKI64q2SqwItxYonQ5PimUl8hpEWnZQKg";

const workflowId = "qW9A17dDWIbyVisQ";

async function addInstagramDmReplyNode() {
    console.log(`Adding Instagram Direct Message Reply node to workflow ${workflowId}...`);

    const operations = [
        {
            type: "addNode",
            node: {
                name: "Send Instagram Direct Message",
                type: "n8n-nodes-base.httpRequest",
                typeVersion: 4.3,
                position: [760, 180],
                credentials: {
                    facebookGraphApi: {
                        id: "FEfOoHyUA6pzcT3p",
                        name: "Facebook Graph (cillah.ai Page token)"
                    }
                },
                parameters: {
                    method: "POST",
                    url: "https://graph.facebook.com/v18.0/me/messages",
                    authentication: "predefinedCredentialType",
                    nodeCredentialType: "facebookGraphApi",
                    sendBody: true,
                    specifyBody: "json",
                    jsonBody: "={\n  \"recipient\": {\n    \"id\": \"{{ $('Instagram DM / Webhook Listener').item.json.body?.entry?.[0]?.changes?.[0]?.value?.from?.id }}\"\n  },\n  \"message\": {\n    \"text\": \"{{ $json.output }}\"\n  }\n}",
                    options: {}
                }
            }
        },
        {
            type: "addConnection",
            source: "real estate instagram dm",
            target: "Send Instagram Direct Message",
            connectionType: "main",
            sourceIndex: 0,
            targetIndex: 0
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
                    versionName: "Add Send Instagram Direct Message node to send AI responses back to user DMs",
                    operations
                }
            }
        })
    });

    const textOutput = await res.text();
    console.log("Update output:", textOutput);
}

addInstagramDmReplyNode().catch(console.error);
