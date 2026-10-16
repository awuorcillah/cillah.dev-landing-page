const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NzgwZDE3YS1kZjRlLTRkNzQtYjIwOS0zNGU1OTdkYmIwMDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6ImE0MmI4NjEyLWUwNGItNDQ3ZS05Zjg1LWZhYzRmM2U3Zjc3ZSIsImlhdCI6MTc5MTUyODQ2Nn0.aJCsbL_6HZgKI64q2SqwItxYonQ5PimUl8hpEWnZQKg";

async function deployAiAgentWorkflow() {
    console.log("Validating & Deploying true AI Agent Workflow for Stage Properties via n8n MCP...");

    const sdkCode = `import { workflow, node, trigger, languageModel, memory, tool, newCredential, expr } from '@n8n/workflow-sdk';

const openAiModel = languageModel({
  type: '@n8n/n8n-nodes-langchain.lmChatOpenAi',
  version: 1.3,
  config: {
    name: 'OpenAI Model (GPT-4o)',
    parameters: {
      model: 'gpt-4o'
    },
    credentials: { openAiApi: newCredential('OpenAI Account') }
  }
});

const chatMemory = memory({
  type: '@n8n/n8n-nodes-langchain.memoryBufferWindow',
  version: 1.3,
  config: {
    name: 'Window Buffer Memory',
    parameters: {
      sessionKey: expr('{{ $json.body.sender_id || "default_session" }}'),
      contextWindowLength: 10
    }
  }
});

const calculatorTool = tool({
  type: '@n8n/n8n-nodes-langchain.toolCalculator',
  version: 1,
  config: {
    name: 'Calculator',
    parameters: {}
  }
});

const webhookTrigger = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2,
  config: {
    name: 'Instagram DM / Webhook Listener',
    parameters: {
      httpMethod: 'POST',
      path: 'stage-properties-ai-agent'
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
      text: 'You are the official AI Property Advisor for Stage Properties Brokers L.L.C in Dubai, UAE.\\n\\nYour Goal:\\nHelp Instagram prospects discover luxury property listings (Residential, Commercial, Off-Plan, Sobha Hartland) and seamlessly qualify serious buyers/renters.\\n\\nConversation Flow & Guidelines:\\n1. Politeness & Luxury Tone: Be warm, professional, high-end, and conversational like two humans speaking.\\n2. Step-by-Step Qualification:\\n   - Step A: Ask if they are looking for RESIDENTIAL, COMMERCIAL, or OFF-PLAN properties.\\n   - Step B: Ask if they are looking to BUY or RENT.\\n   - Step C: Ask for their Full Name.\\n   - Step D: Ask for their WhatsApp Phone Number.\\n3. Agent Handoff:\\n   - Once you have their Name, Phone Number, Intent (Buy/Rent), and Property Interest, assign sales agent Ador.\\n   - Tell the prospect: "Give me a moment as I transfer you to our next available property advisor... Ador will contact you shortly to discuss more on buying/renting your property interest. Is there anything else I can assist you with today?"\\n4. Wrap-up: If they say no, reply: "Thank you for contacting Stage Properties Brokers and have a beautiful day! ✨"'
    },
    subnodes: {
      model: openAiModel,
      memory: chatMemory,
      tools: [calculatorTool]
    }
  }
});

export default workflow('stage-properties-ai-chat-agent', 'Stage Properties - AI Chat Agent & Property Advisor')
  .add(webhookTrigger)
  .to(aiAgentNode);`;

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
                name: "Stage Properties - AI Chat Agent & Property Advisor",
                code: sdkCode,
                versionName: "LangChain AI Agent v3.0"
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

deployAiAgentWorkflow().catch(console.error);
