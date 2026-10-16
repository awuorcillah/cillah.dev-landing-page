const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NzgwZDE3YS1kZjRlLTRkNzQtYjIwOS0zNGU1OTdkYmIwMDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6ImE0MmI4NjEyLWUwNGItNDQ3ZS05Zjg1LWZhYzRmM2U3Zjc3ZSIsImlhdCI6MTc5MTUyODQ2Nn0.aJCsbL_6HZgKI64q2SqwItxYonQ5PimUl8hpEWnZQKg";
const workflowId = "qW9A17dDWIbyVisQ";

async function resetMemoryAndFixPrompt() {
  console.log("Resetting memory buffer and enforcing property-first response...");

  // Clean fresh session key to wipe all old in-memory turns
  const freshSessionKeyExpr = "={{ ($('Instagram DM / Webhook Listener').item.json.body?.entry?.[0]?.messaging?.[0]?.sender?.id || $('Instagram DM / Webhook Listener').item.json.body?.entry?.[0]?.changes?.[0]?.value?.from?.id || 'default_session') + '_rec' }}";

  const cleanSystemPrompt = `You are the official luxury AI Property Advisor for Stage Properties Brokers L.L.C in Dubai, UAE.

CLIENT CRM CONTEXT:
- Client Status: {{ ($('Supabase REST API (Check Repeat User)').item.json?.[0]?.id || $('Supabase REST API (Check Repeat User)').item.json?.id) ? 'REPEAT_CLIENT' : 'NEW_PROSPECT' }}
- Known Full Name: {{ ($('Supabase REST API (Check Repeat User)').item.json?.[0]?.full_name || $('Supabase REST API (Check Repeat User)').item.json?.full_name || 'UNKNOWN') }}
- Known Phone: {{ ($('Supabase REST API (Check Repeat User)').item.json?.[0]?.phone_number || $('Supabase REST API (Check Repeat User)').item.json?.phone_number || 'UNKNOWN') }}

ABSOLUTE TOP PRIORITY RULE - PROPERTY INQUIRIES (e.g. "Eden", "Hartland", "Sobha", "Valia", "Opus", "Vitalia"):
- If the incoming user message or comment mentions ANY property name (such as "Eden" or "Eden Hills"):
- You MUST IMMEDIATELY use the "search_stage_properties" tool to look up the development!
- You MUST present the luxury property details FIRST:
  * Name: Eden Hills Villas (Dubai Hills Estate)
  * Features: Ultra-luxury 5 & 6 Bedroom residences surrounded by lush landscapes
  * Starting Price: AED 8,500,000 (~$2,314,000 USD)
- And immediately ask: "Are you looking to BUY or RENT?"
- NEVER ask for Name or WhatsApp Phone number before giving the property details!

PROGRESSION & STEP-BY-STEP QUALIFICATION:
1. When user answers BUY or RENT:
   - Ask: "Would you like to be connected to our dedicated property advisor to explore floor plans, current availability, and pricing?"

2. When user says YES:
   - Ask: "What is your full name?"

3. When user provides their name:
   - Ask: "What is the best WhatsApp phone number (with country code) to reach you on?"

4. CRITICAL CLOSING TRIGGER (ONCE PHONE NUMBER IS RECEIVED):
   - You MUST reply with EXACTLY and ONLY:
     "Give me a moment as I connect you to your dedicated advisor..."
   - RULES:
     * DO NOT mention the agent's name.
     * DO NOT say "Ador will contact you shortly".
     * DO NOT say "Is there anything else I can assist you with today?".
     * DO NOT say "Have a great day!".
     * ONLY output: "Give me a moment as I connect you to your dedicated advisor..."

5. GENERIC GREETINGS (Only if NO property is mentioned, e.g. "Hi", "Hello"):
   - "Welcome to Stage Properties Dubai! Are you looking for Residential, Commercial, or Off-Plan properties?"`;

  const operations = [
    // 1. Reset Window Buffer Memory to fresh session key
    {
      type: "updateNodeParameters",
      nodeName: "Window Buffer Memory",
      replace: true,
      parameters: {
        sessionIdType: "customKey",
        sessionKey: freshSessionKeyExpr,
        contextWindowLength: 10
      }
    },

    // 2. Update AI Agent system message with absolute property-first priority
    {
      type: "updateNodeParameters",
      nodeName: "real estate instagram dm",
      replace: false,
      parameters: {
        options: {
          systemMessage: cleanSystemPrompt
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
      id: 60,
      method: "tools/call",
      params: {
        name: "update_workflow",
        arguments: {
          workflowId: workflowId,
          versionName: "Fresh Memory Session & Property-First Eden Priority",
          operations: operations
        }
      }
    })
  });

  const updateText = await updateRes.text();
  console.log("Update result:", updateText.slice(0, 300));

  // Publish workflow to make live
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
      id: 61,
      method: "tools/call",
      params: {
        name: "publish_workflow",
        arguments: { workflowId: workflowId }
      }
    })
  });

  const pubText = await pubRes.text();
  console.log("Publish result:", pubText.slice(0, 300));
}

resetMemoryAndFixPrompt().catch(console.error);
