const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NzgwZDE3YS1kZjRlLTRkNzQtYjIwOS0zNGU1OTdkYmIwMDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6ImE0MmI4NjEyLWUwNGItNDQ3ZS05Zjg1LWZhYzRmM2U3Zjc3ZSIsImlhdCI6MTc5MTUyODQ2Nn0.aJCsbL_6HZgKI64q2SqwItxYonQ5PimUl8hpEWnZQKg";

async function createSdkWorkflow() {
    console.log("Validating & Creating workflow via n8n MCP...");

    const sdkCode = `import { workflow, node, trigger } from '@n8n/workflow-sdk';

export default workflow("stage-properties-hartland-lead-engine", "Stage Properties - Luxury Instagram Hartland Lead Engine")
  .add(
    trigger({
      type: "n8n-nodes-base.webhook",
      version: 2,
      config: {
        name: "IG Comment Webhook (HARTLAND)",
        parameters: {
          httpMethod: "POST",
          path: "stage-properties-ig-webhook"
        }
      }
    })
  )
  .to(
    node({
      type: "n8n-nodes-base.postgres",
      version: 1,
      config: {
        name: "Supabase Property Lookup (Hartland)",
        parameters: {
          operation: "executeQuery",
          query: "SELECT * FROM properties WHERE keyword = 'hartland' LIMIT 1;"
        }
      }
    })
  )
  .to(
    node({
      type: "n8n-nodes-base.httpRequest",
      version: 3,
      config: {
        name: "Send IG DM + Buy/Rent Buttons",
        parameters: {
          method: "POST",
          url: "https://graph.facebook.com/v18.0/me/messages"
        }
      }
    })
  )
  .to(
    node({
      type: "n8n-nodes-base.postgres",
      version: 1,
      config: {
        name: "Round-Robin Agent Selector (Ador)",
        parameters: {
          operation: "executeQuery",
          query: "SELECT * FROM staff_members WHERE is_active = true ORDER BY last_assigned_at ASC NULLS FIRST LIMIT 1;"
        }
      }
    })
  )
  .to(
    node({
      type: "n8n-nodes-base.httpRequest",
      version: 3,
      config: {
        name: "Send WhatsApp Alert to Agent Ador",
        parameters: {
          method: "POST",
          url: "https://cillah.dev/api/whatsapp/send-notification"
        }
      }
    })
  )
  .to(
    node({
      type: "n8n-nodes-base.httpRequest",
      version: 3,
      config: {
        name: "Final Handoff IG DM",
        parameters: {
          method: "POST",
          url: "https://graph.facebook.com/v18.0/me/messages"
        }
      }
    })
  );`;

    // 1. Validate workflow
    const valPayload = {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
            name: "validate_workflow",
            arguments: { code: sdkCode }
        }
    };

    const valRes = await fetch("https://n8n.cillah.dev/mcp-server/http", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream"
        },
        body: JSON.stringify(valPayload)
    });
    const valText = await valRes.text();
    console.log("Validation Result:", valText);

    // 2. Create workflow
    const createPayload = {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
            name: "create_workflow_from_code",
            arguments: {
                name: "Stage Properties - Luxury Instagram Hartland Lead Engine",
                code: sdkCode,
                versionName: "Initial Release v1.0"
            }
        }
    };

    const createRes = await fetch("https://n8n.cillah.dev/mcp-server/http", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream"
        },
        body: JSON.stringify(createPayload)
    });
    const createText = await createRes.text();
    console.log("\nCreate Workflow Result:", createText);
}

createSdkWorkflow().catch(console.error);
