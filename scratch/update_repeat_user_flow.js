const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NzgwZDE3YS1kZjRlLTRkNzQtYjIwOS0zNGU1OTdkYmIwMDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6ImE0MmI4NjEyLWUwNGItNDQ3ZS05Zjg1LWZhYzRmM2U3Zjc3ZSIsImlhdCI6MTc5MTUyODQ2Nn0.aJCsbL_6HZgKI64q2SqwItxYonQ5PimUl8hpEWnZQKg";

const workflowId = "qW9A17dDWIbyVisQ";

async function updateRepeatUserFlow() {
    console.log("Updating Repeat User flow & note insertion in n8n...");

    const operations = [
        // Update Repeat User WhatsApp notification node to include timestamped note details
        {
            type: "updateNodeParameters",
            nodeName: "Notify Existing Agent on WhatsApp (Repeat User)",
            replace: true,
            parameters: {
                method: "POST",
                url: "https://cillah.dev/api/whatsapp/send-notification",
                sendBody: true,
                specifyBody: "json",
                jsonBody: "={\n  \"to\": \"0794357912\",\n  \"message\": \"🔄 REPEAT INQUIRY ALERT - STAGE PROPERTIES\\n\\nSales Agent: Ador\\nStatus: Moved to 'Repeat Inquiries' Pipeline Stage\\nUser ID: {{ $('Instagram DM / Webhook Listener').item.json.body?.entry?.[0]?.changes?.[0]?.value?.from?.id }}\\nNote: Customer returned with a repeat property inquiry. Logged in CRM pipeline.\"\n}"
            }
        },
        // Update New Lead insertion node to set initial status to 'new_inquiry'
        {
            type: "updateNodeParameters",
            nodeName: "Supabase REST API (Insert Lead)",
            replace: true,
            parameters: {
                method: "POST",
                url: "https://hastygfosgyxrxzrzrur.supabase.co/rest/v1/stage_leads",
                sendBody: true,
                specifyBody: "json",
                jsonBody: "={\n  \"full_name\": \"{{ $json.lead_name }}\",\n  \"phone_number\": \"{{ $json.lead_phone }}\",\n  \"intent\": \"{{ $json.intent }}\",\n  \"property_interest\": \"{{ $json.property_interest }}\",\n  \"assigned_agent_name\": \"Ador\",\n  \"status\": \"new_inquiry\",\n  \"ig_user_id\": \"{{ $('Instagram DM / Webhook Listener').item.json.body?.entry?.[0]?.changes?.[0]?.value?.from?.id }}\"\n}"
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
                    versionName: "Update Repeat User note insertion & pipeline stage routing",
                    operations
                }
            }
        })
    });

    const textOutput = await res.text();
    console.log("Update output:", textOutput);
}

updateRepeatUserFlow().catch(console.error);
