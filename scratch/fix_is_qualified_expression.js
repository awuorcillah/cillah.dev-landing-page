const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NzgwZDE3YS1kZjRlLTRkNzQtYjIwOS0zNGU1OTdkYmIwMDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6ImE0MmI4NjEyLWUwNGItNDQ3ZS05Zjg1LWZhYzRmM2U3Zjc3ZSIsImlhdCI6MTc5MTUyODQ2Nn0.aJCsbL_6HZgKI64q2SqwItxYonQ5PimUl8hpEWnZQKg";
const workflowId = "qW9A17dDWIbyVisQ";

async function fixIsQualifiedExpression() {
    console.log("Updating Is Lead Fully Qualified? leftValue to use $('real estate instagram dm').item.json.output...");

    const operations = [
        {
            type: "updateNodeParameters",
            nodeName: "Is Lead Fully Qualified?",
            parameters: {
                conditions: {
                    options: { caseSensitive: false, typeValidation: "loose", version: 1 },
                    conditions: [
                        {
                            leftValue: "={{ $('real estate instagram dm').item.json.output }}",
                            operator: { type: "string", operation: "contains" },
                            rightValue: "advisor"
                        },
                        {
                            leftValue: "={{ $('real estate instagram dm').item.json.output }}",
                            operator: { type: "string", operation: "contains" },
                            rightValue: "lead_name"
                        },
                        {
                            leftValue: "={{ $('real estate instagram dm').item.json.output }}",
                            operator: { type: "string", operation: "contains" },
                            rightValue: "all set"
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
                    versionName: "Fix Is Lead Fully Qualified node reference v13.0",
                    operations
                }
            }
        })
    });

    const textOutput = await res.text();
    console.log("Update Result:", textOutput);

    // Publish workflow
    const pubRes = await fetch("https://n8n.cillah.dev/mcp-server/http", {
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
                name: "publish_workflow",
                arguments: { workflowId }
            }
        })
    });

    const pubText = await pubRes.text();
    console.log("Publish Result:", pubText);
}

fixIsQualifiedExpression().catch(console.error);
