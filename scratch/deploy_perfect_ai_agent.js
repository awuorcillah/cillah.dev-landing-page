const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NzgwZDE3YS1kZjRlLTRkNzQtYjIwOS0zNGU1OTdkYmIwMDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6ImE0MmI4NjEyLWUwNGItNDQ3ZS05Zjg1LWZhYzRmM2U3Zjc3ZSIsImlhdCI6MTc5MTUyODQ2Nn0.aJCsbL_6HZgKI64q2SqwItxYonQ5PimUl8hpEWnZQKg";

async function deployPerfectAiAgent() {
    console.log("Updating Stage Properties AI Agent Workflow (ID: m452zXJpQY99dPJe) ...");

    const sdkCode = `import { workflow, node, trigger, languageModel, memory, tool, newCredential, expr, nodeJson } from '@n8n/workflow-sdk';

const openAiModel = languageModel({
  type: '@n8n/n8n-nodes-langchain.lmChatOpenAi',
  version: 1.3,
  config: {
    name: 'OpenAI Chat Model (GPT-4o)',
    parameters: {
      model: expr('={{"gpt-4o"}}')
    },
    credentials: { openAiApi: newCredential('OpenAI account') }
  }
});

const webhookTrigger = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2,
  config: {
    name: 'Instagram DM & Webhook Listener',
    parameters: {
      httpMethod: 'POST',
      path: 'stage-properties-ai-agent'
    }
  }
});

const chatMemory = memory({
  type: '@n8n/n8n-nodes-langchain.memoryBufferWindow',
  version: 1.3,
  config: {
    name: 'Window Buffer Memory',
    parameters: {
      sessionIdType: 'customKey',
      sessionKey: nodeJson(webhookTrigger, 'body.sender_id'),
      contextWindowLength: 10
    }
  }
});

const searchPropertiesTool = tool({
  type: 'n8n-nodes-base.postgresTool',
  version: 1,
  config: {
    name: 'search_stage_properties',
    description: 'Look up Stage Properties inventory for prices, location, and availability in Dubai.',
    parameters: {
      operation: 'executeQuery',
      query: 'SELECT * FROM properties WHERE keyword ILIKE %hartland% OR title ILIKE %hartland% LIMIT 5;'
    }
  }
});

const assignAgentTool = tool({
  type: 'n8n-nodes-base.httpRequestTool',
  version: 1,
  config: {
    name: 'transfer_to_sales_agent',
    description: 'Assigns qualified lead to active agent Ador, logs lead to database, and triggers WhatsApp alert.',
    parameters: {
      method: 'POST',
      url: 'https://cillah.dev/api/whatsapp/send-notification'
    }
  }
});

const aiAgentNode = node({
  type: '@n8n/n8n-nodes-langchain.agent',
  version: 3.1,
  config: {
    name: 'Stage Properties Luxury AI Agent',
    parameters: {
      promptType: 'define',
      text: expr('={{ $json.body.message || $json.body.comment || $json.chatInput }}'),
      options: {
        systemMessage: 'You are the official AI Property Advisor for Stage Properties Brokers L.L.C, Dubai.\\n\\nYour Goal:\\nHelp prospects discover luxury real estate (Residential, Commercial, Off-Plan, Sobha Hartland) and qualify serious buyers/renters.\\n\\nStep-by-Step Flow:\\n1. Politeness & Luxury Tone: Conversational, warm, elegant like two human colleagues speaking.\\n2. Property Lookup: Use "search_stage_properties" tool to check live availability and prices.\\n3. Step-by-Step Qualification:\\n   - Step 1: Ask if they are interested in RESIDENTIAL, COMMERCIAL, or OFF-PLAN properties.\\n   - Step 2: Ask if they are looking to BUY or RENT.\\n   - Step 3: Ask for their Full Name.\\n   - Step 4: Ask for their WhatsApp Phone Number.\\n4. Agent Handoff: Once Name, Phone, Intent (Buy/Rent), and Property Interest are provided, call "transfer_to_sales_agent". Tell them: "Give me a moment as I transfer you to our next available advisor... Ador will contact you shortly to discuss more on buying/renting your property interest. Is there anything else I can assist you with today?"\\n5. Wrap-up: If no: "Thank you for contacting Stage Properties Brokers and have a beautiful day! ✨"'
      }
    },
    subnodes: {
      model: openAiModel,
      memory: chatMemory,
      tools: [searchPropertiesTool, assignAgentTool]
    }
  }
});

export default workflow('stage-properties-ai-chat-agent', 'Stage Properties - AI Chat Agent & Property Advisor')
  .add(webhookTrigger)
  .to(aiAgentNode);`;

    // 1. Validate
    const valRes = await fetch("https://n8n.cillah.dev/mcp-server/http", {
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
                name: "validate_workflow",
                arguments: { code: sdkCode }
            }
        })
    });
    console.log("Validation output:", await valRes.text());

    // 2. Update workflow
    const updateRes = await fetch("https://n8n.cillah.dev/mcp-server/http", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream"
        },
        body: JSON.stringify({
            jsonrpc: "2.0",
            id: 2,
            method: "tools/call",
            params: {
                name: "update_workflow_from_code",
                arguments: {
                    workflowId: "m452zXJpQY99dPJe",
                    code: sdkCode,
                    versionName: "Refined AI Agent with Model, Memory, and Tools"
                }
            }
        })
    });
    console.log("\nUpdate result:", await updateRes.text());
}

deployPerfectAiAgent().catch(console.error);
