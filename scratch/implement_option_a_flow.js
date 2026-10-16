const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NzgwZDE3YS1kZjRlLTRkNzQtYjIwOS0zNGU1OTdkYmIwMDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6ImE0MmI4NjEyLWUwNGItNDQ3ZS05Zjg1LWZhYzRmM2U3Zjc3ZSIsImlhdCI6MTc5MTUyODQ2Nn0.aJCsbL_6HZgKI64q2SqwItxYonQ5PimUl8hpEWnZQKg";

const workflowId = "qW9A17dDWIbyVisQ";

async function fixIfNodeParameters() {
    console.log("Fixing Is Lead Fully Qualified? IF node parameters...");

    const operations = [
        {
            type: "updateNodeParameters",
            nodeName: "Is Lead Fully Qualified?",
            replace: true,
            parameters: {
                conditions: {
                    options: { caseSensitive: false, typeValidation: "loose" },
                    conditions: [
                        {
                            leftValue: "={{ $('real estate instagram dm').item.json.output }}",
                            operator: { type: "string", operation: "contains" },
                            rightValue: "Ador"
                        }
                    ],
                    combinator: "or"
                }
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
                    versionName: "Fix rightValue parameter on Is Lead Fully Qualified? IF node",
                    operations
                }
            }
        })
    });

    const textOutput = await res.text();
    console.log("Update output:", textOutput);
}

fixIfNodeParameters().catch(console.error);
