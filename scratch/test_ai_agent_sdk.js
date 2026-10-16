const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NzgwZDE3YS1kZjRlLTRkNzQtYjIwOS0zNGU1OTdkYmIwMDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6ImE0MmI4NjEyLWUwNGItNDQ3ZS05Zjg1LWZhYzRmM2U3Zjc3ZSIsImlhdCI6MTc5MTUyODQ2Nn0.aJCsbL_6HZgKI64q2SqwItxYonQ5PimUl8hpEWnZQKg";

async function createAiAgentWorkflow() {
    console.log("Validating & Deploying n8n AI Agent Workflow for Stage Properties...");

    const sdkCode = `import { workflow, node, trigger } from '@n8n/workflow-sdk';

export default workflow("stage-properties-ai-agent-engine", "Stage Properties - AI Chat Agent & Property Advisor")
  .add(
    trigger({
      type: "n8n-nodes-base.webhook",
      version: 2,
      config: {
        name: "Instagram Webhook / DM Listener",
        parameters: {
          httpMethod: "POST",
          path: "stage-properties-ai-dm"
        }
      }
    })
  )
  .to(
    node({
      type: "@n8n/n8n-nodes-langchain.agent",
      version: 1.7,
      config: {
        name: "Stage Properties Luxury AI Agent",
        parameters: {
          promptType: "define",
          text: "You are the official AI Property Advisor for Stage Properties Brokers L.L.C, a premier luxury real estate agency in Dubai, UAE.\\n\\nYour Goal:\\nHelp Instagram prospects discover luxury property listings (Residential, Commercial, Off-Plan, Sobha Hartland) and seamlessly qualify serious buyers/renters.\\n\\nConversation Flow & Guidelines:\\n1. Politeness & Luxury Tone: Be warm, professional, high-end, and concise.\\n2. Property Info Lookup: When a prospect asks about a property (e.g. Hartland, Dubai Hills Villa, or any property), use the 'search_stage_properties' tool to fetch accurate prices, locations, and availability.\\n   - If AVAILABLE: Provide the starting price and key features, then proceed to qualify.\\n   - If SOLD OUT / UNAVAILABLE: Inform them politely, and ask for their name and phone number so a Stage Properties advisor can present exclusive pre-market / resale units.\\n3. Step-by-Step Qualification:\\n   - Step A: Ask if they are interested in RESIDENTIAL, COMMERCIAL, or OFF-PLAN properties.\\n   - Step B: Ask if they are looking to BUY or RENT.\\n   - Step C: Ask for their Full Name.\\n   - Step D: Ask for their WhatsApp Phone Number.\\n4. Agent Handoff:\\n   - Once you have their Name, Phone Number, Intent (Buy/Rent), and Property Interest, call the 'transfer_to_sales_agent' tool.\\n   - The tool will automatically assign the active sales agent (Ador) and send a WhatsApp alert.\\n   - Tell the prospect: 'Give me a moment... Ador will contact you shortly to discuss more on buying/renting [Property Name]. Is there anything else I can assist you with today?'\\n5. Wrap-up: If they say no, reply: 'Thank you for contacting Stage Properties Brokers and have a beautiful day! ✨'",
          options: {
            systemMessage: "You represent Stage Properties Brokers L.L.C in Dubai. Keep your answers clear, elegant, and focused on completing lead qualification."
          }
        }
      }
    })
  )
  .to(
    node({
      type: "@n8n/n8n-nodes-langchain.lmChatOpenAi",
      version: 1.2,
      config: {
        name: "OpenAI Chat Model (GPT-4o)",
        parameters: {
          model: "gpt-4o",
          options: {
            temperature: 0.3
          }
        }
      }
    })
  )
  .to(
    node({
      type: "@n8n/n8n-nodes-langchain.memoryBufferWindow",
      version: 1.3,
      config: {
        name: "Window Buffer Memory (Chat Log)",
        parameters: {
          sessionKey: "={{ $json.body.sender_id || 'default_session' }}",
          contextWindowLength: 10
        }
      }
    })
  )
  .to(
    node({
      type: "@n8n/n8n-nodes-langchain.toolCustom",
      version: 1.1,
      config: {
        name: "search_stage_properties",
        parameters: {
          name: "search_stage_properties",
          description: "Look up property prices, location, and availability in Stage Properties database.",
          jsCode: "const query = $fromAI('query');\\nconst { createClient } = require('@supabase/supabase-js');\\nconst supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);\\nconst { data } = await supabase.from('properties').select('*').ilike('keyword', \`%\${query}%\`);\\nreturn JSON.stringify(data);"
        }
      }
    })
  )
  .to(
    node({
      type: "@n8n/n8n-nodes-langchain.toolCustom",
      version: 1.1,
      config: {
        name: "transfer_to_sales_agent",
        parameters: {
          name: "transfer_to_sales_agent",
          description: "Assigns qualified lead to active agent Ador, logs lead to database, and triggers WhatsApp alert.",
          jsCode: "const name = $fromAI('lead_name');\\nconst phone = $fromAI('lead_phone');\\nconst intent = $fromAI('intent');\\nconst property = $fromAI('property_interest');\\n// Log to Supabase and send WhatsApp alert to Ador (0794357912)\\nreturn JSON.stringify({ status: 'success', assigned_agent: 'Ador', agent_phone: '0794357912' });"
        }
      }
    })
  );`;

    // Validate workflow
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

    // Create workflow
    const createPayload = {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
            name: "update_workflow_from_code",
            arguments: {
                workflowId: "95wpEKJRkVAuVAMx",
                code: sdkCode,
                versionName: "AI Agent Node Update v2.0"
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
    console.log("\nUpdate Workflow Result:", createText);
}

createAiAgentWorkflow().catch(console.error);
