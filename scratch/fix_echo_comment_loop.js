const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NzgwZDE3YS1kZjRlLTRkNzQtYjIwOS0zNGU1OTdkYmIwMDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6ImE0MmI4NjEyLWUwNGItNDQ3ZS05Zjg1LWZhYzRmM2U3Zjc3ZSIsImlhdCI6MTc5MTUyODQ2Nn0.aJCsbL_6HZgKI64q2SqwItxYonQ5PimUl8hpEWnZQKg";

const workflowId = "qW9A17dDWIbyVisQ";

async function fixEchoCommentLoop() {
    console.log("Adding Customer Message Filter to prevent bot comment echo loop in n8n...");

    const operations = [
        // 1. Add Filter Node: 'Is Incoming Customer Message?'
        {
            type: "addNode",
            node: {
                name: "Is Incoming Customer Message?",
                type: "n8n-nodes-base.if",
                typeVersion: 2.2,
                position: [240, 200],
                parameters: {
                    conditions: {
                        options: { caseSensitive: false, typeValidation: "loose" },
                        conditions: [
                            {
                                leftValue: "={{ $json.body?.entry?.[0]?.changes?.[0]?.value?.from?.username }}",
                                operator: { type: "string", operation: "notEquals" },
                                rightValue: "cillah.dev"
                            },
                            {
                                leftValue: "={{ $json.body?.entry?.[0]?.changes?.[0]?.value?.text }}",
                                operator: { type: "string", operation: "notContains" },
                                rightValue: "Check your DMs"
                            }
                        ],
                        combinator: "and"
                    }
                }
            }
        },

        // 2. Remove connection from Listener (index 1) to real estate instagram dm
        {
            type: "removeConnection",
            source: "Instagram DM / Webhook Listener",
            target: "real estate instagram dm",
            connectionType: "main",
            sourceIndex: 1,
            targetIndex: 0
        },

        // 3. Remove connection from Listener (index 1) to Is Customer Top-Level Comment?
        {
            type: "removeConnection",
            source: "Instagram DM / Webhook Listener",
            target: "Is Customer Top-Level Comment?",
            connectionType: "main",
            sourceIndex: 1,
            targetIndex: 0
        },

        // 4. Connect Listener (index 1) -> Is Incoming Customer Message?
        {
            type: "addConnection",
            source: "Instagram DM / Webhook Listener",
            target: "Is Incoming Customer Message?",
            connectionType: "main",
            sourceIndex: 1,
            targetIndex: 0
        },

        // 5. Connect Is Incoming Customer Message? (True Branch 0) -> Is Customer Top-Level Comment?
        {
            type: "addConnection",
            source: "Is Incoming Customer Message?",
            target: "Is Customer Top-Level Comment?",
            connectionType: "main",
            sourceIndex: 0,
            targetIndex: 0
        },

        // 6. Connect Is Incoming Customer Message? (True Branch 0) -> real estate instagram dm
        {
            type: "addConnection",
            source: "Is Incoming Customer Message?",
            target: "real estate instagram dm",
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
                    versionName: "Add Customer Message Filter to prevent bot echo comment loop",
                    operations
                }
            }
        })
    });

    const textOutput = await res.text();
    console.log("Update response:", textOutput);
}

fixEchoCommentLoop().catch(console.error);
