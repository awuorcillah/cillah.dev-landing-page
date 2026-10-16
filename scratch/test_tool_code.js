const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NzgwZDE3YS1kZjRlLTRkNzQtYjIwOS0zNGU1OTdkYmIwMDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6ImE0MmI4NjEyLWUwNGItNDQ3ZS05Zjg1LWZhYzRmM2U3Zjc3ZSIsImlhdCI6MTc5MTUyODQ2Nn0.aJCsbL_6HZgKI64q2SqwItxYonQ5PimUl8hpEWnZQKg";

async function inspectToolCode() {
  const payload = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "validate_node_config",
      arguments: {
        nodeType: "@n8n/n8n-nodes-langchain.toolCode",
        config: {
          name: "connect_to_property_advisor",
          parameters: {
            description: "Connect customer to their dedicated property advisor when full name and phone number are gathered.",
            language: "javaScript",
            specifyInputSchema: true,
            schemaType: "manual",
            inputSchema: JSON.stringify({
              type: "object",
              properties: {
                full_name: { type: "string" },
                phone_number: { type: "string" },
                category: { type: "string" },
                intent: { type: "string" },
                conversation_summary: { type: "string" }
              },
              required: ["full_name", "phone_number"]
            }),
            jsCode: "return JSON.stringify({ success: true });"
          }
        }
      }
    }
  };

  const getRes = await fetch("https://n8n.cillah.dev/mcp-server/http", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream"
    },
    body: JSON.stringify(payload)
  });

  console.log("Validation result:", await getRes.text());
}

inspectToolCode();
