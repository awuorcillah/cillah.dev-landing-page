const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NzgwZDE3YS1kZjRlLTRkNzQtYjIwOS0zNGU1OTdkYmIwMDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6ImE0MmI4NjEyLWUwNGItNDQ3ZS05Zjg1LWZhYzRmM2U3Zjc3ZSIsImlhdCI6MTc5MTUyODQ2Nn0.aJCsbL_6HZgKI64q2SqwItxYonQ5PimUl8hpEWnZQKg";

async function deployFullUserFlow() {
    console.log("Updating single workflow s2ExZm67n4lhQmt0 with repeat user check & variable extraction...");

    const sdkCode = `import { workflow, node, trigger, languageModel, memory, tool, ifElse, newCredential, expr, nodeJson } from '@n8n/workflow-sdk';

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
      text: expr('={{ $json.body?.entry?.[0]?.changes?.[0]?.value?.text || $json.chatInput }}'),
      options: {
        systemMessage: expr('={{"You are the official AI Property Advisor for Stage Properties Brokers L.L.C in Dubai, UAE.\\n\\nYour Goal:\\nHelp prospects discover luxury real estate (Residential, Commercial, Off-Plan, Sobha Hartland) and qualify serious buyers/renters.\\n\\nStep-by-Step Conversation Flow:\\n1. FIRST RESPONSE (Property Info): When a user comments a property name like Hartland, retrieve info and reply first: \\"Sobha Hartland is a luxury waterfront development in MBR City, Dubai featuring ready to move-in and off-plan residences starting at AED 1,500,000 (~$408,000 USD).\\"\\n\\n2. INTENT CHECK: Send follow-up: \\"Are you looking to BUY or RENT?\\" (Buttons: BUY | RENT)\\n\\n3. ADVISOR CONNECT CHECK: \\"Would you like to be connected to one of our property advisors to explore more options on [buying/renting] in Dubai?\\" (Buttons: Connect to Sales | Just Exploring)\\n\\n4. INFORMATION COLLECTION: If they click Connect to Sales:\\n   - Ask: \\"What is your full name?\\"\\n   - Ask: \\"What is the best phone number (with country code) to reach you on?\\"\\n\\n5. EXIT & HANDOFF: Output JSON object containing: { lead_name, lead_phone, intent, property_interest, ig_user_id, ig_username } and tell them: \\"Give me a moment as I connect you to your dedicated advisor... Ador will contact you shortly to discuss more on buying/renting your property interest. Is there anything else I can assist you with today?\\"\\n\\n6. REPEAT USERS: If user is returning, greet them warmly: \\"Welcome back [Name]! How can I assist you with your property search today?\\""}}')
      }
    },
    subnodes: {
      model: openAiModel,
      memory: chatMemory
    }
  }
});

const checkExistingLeadNode = node({
  type: 'n8n-nodes-base.postgres',
  version: 1,
  config: {
    name: 'Supabase Lookup (Check Repeat User)',
    parameters: {
      operation: 'executeQuery',
      query: expr('SELECT * FROM stage_leads WHERE ig_user_id = \'{{ $("Instagram DM / Webhook Listener").item.json.body.entry[0].changes[0].value.from.id }}\' LIMIT 1;')
    }
  }
});

const checkRepeatUserIf = ifElse({
  version: 2.2,
  config: {
    name: 'Is Repeat User?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, typeValidation: 'loose' },
        conditions: [
          {
            leftValue: expr('{{ $json.id }}'),
            operator: { type: 'string', operation: 'exists' }
          }
        ],
        combinator: 'and'
      }
    }
  }
});

const notifyExistingAgentNode = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.3,
  config: {
    name: 'Notify Existing Agent on WhatsApp (Repeat User)',
    parameters: {
      method: 'POST',
      url: 'https://cillah.dev/api/whatsapp/send-notification',
      sendBody: true,
      specifyBody: 'json',
      jsonBody: expr('{\n  "to": "0794357912",\n  "message": "🔄 REPEAT INQUIRY - STAGE PROPERTIES\\n\\nClient: {{ $json.full_name }}\\nPhone: {{ $json.phone_number }}\\nAssigned Advisor: {{ $json.assigned_agent_name }} (Ador)\\nLatest Message: Repeat Chat Activity"\n}')
    }
  }
});

const selectNewAgentNode = node({
  type: 'n8n-nodes-base.postgres',
  version: 1,
  config: {
    name: 'Round-Robin Selector (New Agent)',
    parameters: {
      operation: 'executeQuery',
      query: 'SELECT * FROM staff_members WHERE is_active = true ORDER BY last_assigned_at ASC NULLS FIRST LIMIT 1;'
    }
  }
});

const createLeadInSupabaseNode = node({
  type: 'n8n-nodes-base.postgres',
  version: 1,
  config: {
    name: 'Insert New Lead in Supabase CRM',
    parameters: {
      operation: 'executeQuery',
      query: expr('INSERT INTO stage_leads (org_id, ig_username, ig_user_id, full_name, phone_number, property_interest, intent, assigned_agent_name, status) VALUES (\'a1b2c3d4-e5f6-7890-abcd-111111111111\', \'{{ $("Instagram DM / Webhook Listener").item.json.body.entry[0].changes[0].value.from.username }}\', \'{{ $("Instagram DM / Webhook Listener").item.json.body.entry[0].changes[0].value.from.id }}\', \'{{ $json.lead_name || "New Lead" }}\', \'{{ $json.lead_phone || "N/A" }}\', \'Hartland\', \'BUY\', \'Ador\', \'qualified\') RETURNING *;')
    }
  }
});

const notifyNewAgentNode = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.3,
  config: {
    name: 'Notify New Agent Ador on WhatsApp',
    parameters: {
      method: 'POST',
      url: 'https://cillah.dev/api/whatsapp/send-notification',
      sendBody: true,
      specifyBody: 'json',
      jsonBody: expr('{\n  "to": "0794357912",\n  "message": "🏷️ NEW QUALIFIED LEAD - STAGE PROPERTIES\\n\\nName: {{ $json.full_name }}\\nPhone: {{ $json.phone_number }}\\nProperty: Hartland\\nAssigned Agent: Ador"\n}')
    }
  }
});

export default workflow('stage-properties-ai-chat-agent', 'Stage Properties - AI Chat Agent & Property Advisor')
  .add(webhookTrigger)
  .to(aiAgentNode)
  .to(checkExistingLeadNode)
  .to(
    checkRepeatUserIf
      .onTrue(notifyExistingAgentNode)
      .onFalse(
        selectNewAgentNode
          .to(createLeadInSupabaseNode)
          .to(notifyNewAgentNode)
      )
  );`;

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

    // 2. Update single workflow s2ExZm67n4lhQmt0 in place
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
                    workflowId: "s2ExZm67n4lhQmt0",
                    code: sdkCode,
                    versionName: "Full User Flow + Repeat Lead Protection v4.0"
                }
            }
        })
    });
    console.log("\nUpdate result:", await updateRes.text());
}

deployFullUserFlow().catch(console.error);
