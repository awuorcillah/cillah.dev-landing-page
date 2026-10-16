const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NzgwZDE3YS1kZjRlLTRkNzQtYjIwOS0zNGU1OTdkYmIwMDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6ImE0MmI4NjEyLWUwNGItNDQ3ZS05Zjg1LWZhYzRmM2U3Zjc3ZSIsImlhdCI6MTc5MTUyODQ2Nn0.aJCsbL_6HZgKI64q2SqwItxYonQ5PimUl8hpEWnZQKg";

async function deployFinalAiAgent() {
    console.log("Deploying updated Stage Properties AI Agent with exact Instagram Webhook path expressions...");

    const sdkCode = `import { workflow, node, trigger, languageModel, memory, tool, newCredential, expr, nodeJson } from '@n8n/workflow-sdk';

const openAiModel = languageModel({
  type: '@n8n/n8n-nodes-langchain.lmChatOpenAi',
  version: 1.3,
  config: {
    name: 'OpenAI Model (GPT-4o)',
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
    name: 'Instagram DM / Webhook Listener',
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
      sessionKey: nodeJson(webhookTrigger, 'body.entry[0].changes[0].value.from.id'),
      contextWindowLength: 10
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
      text: expr('={{ $json.body?.entry?.[0]?.changes?.[0]?.value?.text || $json.chatInput || "Hartland" }}'),
      options: {
        systemMessage: expr('={{"You are the official AI Property Advisor for Stage Properties Brokers L.L.C in Dubai, UAE.\\n\\nYour Goal:\\nEngage Instagram prospects with luxury elegance, answer property inquiries, and qualify leads step-by-step.\\n\\nExtracting & Remembering User Context:\\n- IG User ID: " + $("Instagram DM / Webhook Listener").item.json.body?.entry?.[0]?.changes?.[0]?.value?.from?.id + "\\n- IG Username: @" + $("Instagram DM / Webhook Listener").item.json.body?.entry?.[0]?.changes?.[0]?.value?.from?.username + "\\n\\nStep-by-Step Flow:\\n1. Politeness & Luxury Tone: Be warm, high-end, and conversational like two humans speaking.\\n2. If returning client: Greet them by their name if already known in memory.\\n3. Step-by-Step Qualification:\\n   - Step 1: Ask if they are interested in RESIDENTIAL, COMMERCIAL, or OFF-PLAN properties.\\n   - Step 2: Ask if they are looking to BUY or RENT.\\n   - Step 3: Ask for their Full Name.\\n   - Step 4: Ask for their WhatsApp Phone Number.\\n4. Agent Handoff: Once Name, Phone, Intent, and Property Category are gathered, assign sales agent Ador and tell them: \\"Give me a moment as I transfer you to our next available property advisor... Ador will contact you shortly to discuss more on buying/renting your property interest. Is there anything else I can assist you with today?\\"\\n5. Wrap-up: If no: \\"Thank you for contacting Stage Properties Brokers and have a beautiful day! ✨\\""}}')
      }
    },
    subnodes: {
      model: openAiModel,
      memory: chatMemory
    }
  }
});

export default workflow('stage-properties-ai-chat-agent', 'Stage Properties - AI Chat Agent & Property Advisor')
  .add(webhookTrigger)
  .to(aiAgentNode);`;

    const createRes = await fetch("https://n8n.cillah.dev/mcp-server/http", {
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
                name: "create_workflow_from_code",
                arguments: {
                    name: "Stage Properties - AI Chat Agent & Property Advisor (Webhook Fixed)",
                    code: sdkCode,
                    versionName: "Instagram Webhook Path Fixed v3.2"
                }
            }
        })
    });
    const createText = await createRes.text();
    console.log("Create Workflow Result:", createText);
}

deployFinalAiAgent().catch(console.error);
