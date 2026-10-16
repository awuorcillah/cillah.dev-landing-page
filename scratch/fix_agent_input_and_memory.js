const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NzgwZDE3YS1kZjRlLTRkNzQtYjIwOS0zNGU1OTdkYmIwMDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6ImE0MmI4NjEyLWUwNGItNDQ3ZS05Zjg1LWZhYzRmM2U3Zjc3ZSIsImlhdCI6MTc5MTUyODQ2Nn0.aJCsbL_6HZgKI64q2SqwItxYonQ5PimUl8hpEWnZQKg";
const workflowId = "qW9A17dDWIbyVisQ";

async function fixAgentInputAndMemory() {
  console.log("Fixing Agent input text, sessionKey, and conversational logic...");

  const webhookBodyExpr = "={{ $('Instagram DM / Webhook Listener').item.json.body?.entry?.[0]?.messaging?.[0]?.message?.text || $('Instagram DM / Webhook Listener').item.json.body?.entry?.[0]?.changes?.[0]?.value?.text || $json.chatInput || '' }}";
  
  const webhookSessionKeyExpr = "={{ $('Instagram DM / Webhook Listener').item.json.body?.entry?.[0]?.messaging?.[0]?.sender?.id || $('Instagram DM / Webhook Listener').item.json.body?.entry?.[0]?.changes?.[0]?.value?.from?.id || 'default_session' }}";

  const aiSystemMessage = `You are the official luxury AI Property Advisor for Stage Properties Brokers L.L.C in Dubai, UAE.

CLIENT CRM STATE:
- Client Status: {{ ($('Supabase REST API (Check Repeat User)').item.json?.[0]?.id || $('Supabase REST API (Check Repeat User)').item.json?.id) ? 'REPEAT_CLIENT' : 'NEW_PROSPECT' }}
- Known Full Name: {{ ($('Supabase REST API (Check Repeat User)').item.json?.[0]?.full_name || $('Supabase REST API (Check Repeat User)').item.json?.full_name || 'UNKNOWN') }}
- Known Phone: {{ ($('Supabase REST API (Check Repeat User)').item.json?.[0]?.phone_number || $('Supabase REST API (Check Repeat User)').item.json?.phone_number || 'UNKNOWN') }}
- Assigned Property Advisor: {{ ($('Supabase REST API (Check Repeat User)').item.json?.[0]?.assigned_agent_name || $('Supabase REST API (Check Repeat User)').item.json?.assigned_agent_name || 'Ador') }}

NATURAL CONVERSATION FLOW (REMEMBER PRIOR TURNS):

1. RETURNING CLIENTS (When Known Full Name is NOT 'UNKNOWN' and NOT 'Valued Lead' and NOT 'Valued Customer'):
   - Warmly greet them: "Welcome back {{ ($('Supabase REST API (Check Repeat User)').item.json?.[0]?.full_name || $('Supabase REST API (Check Repeat User)').item.json?.full_name) }}! Great to see you again at Stage Properties. How can I assist you with your property search today?"
   - NEVER ask for their name or phone number. They are already in our CRM.

2. NEW PROSPECTS (When Known Full Name is 'UNKNOWN'):
   - Initial Question: If they have not stated what they want, ask:
     "Welcome to Stage Properties Dubai! Are you looking for Residential, Commercial, or Off-Plan properties?"

   - When the user answers their interest (e.g. "Residential", "Commercial", "Off-Plan"):
     * Acknowledge immediately: "Wonderful! We have exceptional luxury residential developments across Dubai, including Sobha Hartland and Eden Hills."
     * IMMEDIATELY ask the next qualification question: "Are you looking to BUY or RENT?"
     * CRITICAL: DO NOT repeat the "Residential, Commercial, or Off-Plan" question again!

   - When the user specifies BUY or RENT:
     * Acknowledge and ask: "Would you like to be connected to our dedicated property advisor to explore floor plans, current availability, and pricing?"

   - When the user agrees:
     * Step A: Ask: "What is your full name?"
     * Step B: Once they share their name, ask: "What is the best WhatsApp phone number (with country code) to reach you on?"

3. DETERMINISTIC HANDOFF (Only after collecting Full Name & Phone Number):
   - Output the exact handoff block:
CONNECT_ADVISOR_START
{
  "full_name": "<lead's full name>",
  "phone_number": "<lead's phone number>",
  "category": "<Residential/Commercial/Off-Plan>",
  "intent": "<BUY or RENT>",
  "property_interest": "<property name or Sobha Hartland>",
  "conversation_summary": "<concise 2-sentence summary of what was discussed, budget, and specific preferences for the sales advisor>"
}
CONNECT_ADVISOR_END
   - And tell the customer:
   "Give me a moment as I connect you to your dedicated advisor... Ador will contact you shortly to discuss more on your property requirements. Is there anything else I can assist you with today?"`;

  const operations = [
    // 1. Fix Window Buffer Memory sessionKey
    {
      type: "updateNodeParameters",
      nodeName: "Window Buffer Memory",
      replace: true,
      parameters: {
        sessionIdType: "customKey",
        sessionKey: webhookSessionKeyExpr,
        contextWindowLength: 10
      }
    },

    // 2. Fix AI Agent text parameter & system prompt
    {
      type: "updateNodeParameters",
      nodeName: "real estate instagram dm",
      replace: false,
      parameters: {
        promptType: "define",
        text: webhookBodyExpr,
        options: {
          systemMessage: aiSystemMessage
        }
      }
    }
  ];

  console.log("Applying updates to n8n...");
  const updateRes = await fetch("https://n8n.cillah.dev/mcp-server/http", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream"
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 30,
      method: "tools/call",
      params: {
        name: "update_workflow",
        arguments: {
          workflowId: workflowId,
          versionName: "Fix Agent Input Expression and Webhook Memory Session Key",
          versionDescription: "References webhook listener directly so input text and memory sessionKey are never lost when querying Supabase.",
          operations: operations
        }
      }
    })
  });

  const updateText = await updateRes.text();
  console.log("Update result:", updateText.slice(0, 300));

  // Publish workflow
  console.log("Publishing workflow...");
  const pubRes = await fetch("https://n8n.cillah.dev/mcp-server/http", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream"
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 31,
      method: "tools/call",
      params: {
        name: "publish_workflow",
        arguments: { workflowId: workflowId }
      }
    })
  });

  console.log("Publish result:", (await pubRes.text()).slice(0, 300));
}

fixAgentInputAndMemory().catch(console.error);
