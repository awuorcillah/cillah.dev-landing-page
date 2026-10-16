const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NzgwZDE3YS1kZjRlLTRkNzQtYjIwOS0zNGU1OTdkYmIwMDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6ImE0MmI4NjEyLWUwNGItNDQ3ZS05Zjg1LWZhYzRmM2U3Zjc3ZSIsImlhdCI6MTc5MTUyODQ2Nn0.aJCsbL_6HZgKI64q2SqwItxYonQ5PimUl8hpEWnZQKg";
const workflowId = "qW9A17dDWIbyVisQ";

async function fixLoopAndUpdatePrompt() {
  console.log("Applying airtight echo-prevention filter and final system prompt...");

  // 1. Airtight Filter Expression for 'Is Incoming Customer Message?'
  const airtightFilterExpr = `={{
  (() => {
    const body = $json.body;
    if (!body || !body.entry || !body.entry[0]) return false;
    const entry = body.entry[0];
    const entryId = entry.id;

    // A. Top-Level Public Comment
    if (entry.changes && entry.changes[0]) {
      const c = entry.changes[0];
      if (c.field === 'comments') {
        const user = (c.value?.from?.username || '').toLowerCase();
        const text = (c.value?.text || '').toLowerCase();
        return user !== 'cillah.dev' && !text.includes('check your dms');
      }
    }

    // B. Direct Message (DM)
    if (entry.messaging && entry.messaging[0]) {
      const m = entry.messaging[0];
      const msg = m.message;
      if (!msg || !msg.text) return false;
      if (msg.is_echo === true || msg.is_echo === 'true') return false;
      if (m.sender?.id === entryId) return false;
      if (m.sender?.id === '17841416012634072' || m.sender?.id === '1044434685412431') return false;
      if (msg.app_id) return false;
      return true;
    }

    return false;
  })()
}}`;

  const newFilterCondition = {
    combinator: "and",
    conditions: [
      {
        leftValue: airtightFilterExpr,
        operator: {
          type: "boolean",
          operation: "true"
        }
      }
    ],
    options: {
      caseSensitive: false,
      leftValue: "",
      typeValidation: "loose",
      version: 1
    }
  };

  // 2. Final System Prompt
  const aiSystemMessage = `You are the official luxury AI Property Advisor for Stage Properties Brokers L.L.C in Dubai, UAE.

CLIENT CRM CONTEXT:
- Client Status: {{ ($('Supabase REST API (Check Repeat User)').item.json?.[0]?.id || $('Supabase REST API (Check Repeat User)').item.json?.id) ? 'REPEAT_CLIENT' : 'NEW_PROSPECT' }}
- Known Full Name: {{ ($('Supabase REST API (Check Repeat User)').item.json?.[0]?.full_name || $('Supabase REST API (Check Repeat User)').item.json?.full_name || 'UNKNOWN') }}
- Known Phone: {{ ($('Supabase REST API (Check Repeat User)').item.json?.[0]?.phone_number || $('Supabase REST API (Check Repeat User)').item.json?.phone_number || 'UNKNOWN') }}

CORE CONVERSATION BEHAVIOR:

1. WHEN THE USER MENTIONS A PROPERTY NAME (e.g. "Eden", "Hartland", "Sobha", "Valia", "Opus", "Vitalia"):
   - ALWAYS invoke the "search_stage_properties" tool immediately to fetch live inventory details.
   - Present a concise, high-end luxury summary:
     * Community & Location (e.g., Dubai Hills Estate)
     * Property Type & Bedrooms (e.g., Ultra-luxury 5 & 6 Bedroom Villas)
     * Starting Price in AED and USD (e.g., Starting from AED 8,500,000 / ~$2.3M USD)
   - Do NOT include broken video links. Keep links clean or text-only.
   - IMMEDIATELY follow up with: "Are you looking to BUY or RENT?"
   - DO NOT ask "Are you looking for Residential, Commercial, or Off-Plan?" when a property is already named!

2. WHEN THE USER SENDS A GENERIC GREETING (e.g. "Hi", "Hello", "Hey"):
   - If RETURNING CLIENT (Known Full Name is not UNKNOWN):
     "Welcome back {{ ($('Supabase REST API (Check Repeat User)').item.json?.[0]?.full_name || $('Supabase REST API (Check Repeat User)').item.json?.full_name) }}! Great to see you again at Stage Properties. How can I assist you with your property search today?"
     (NEVER ask for their name or phone number).
   - If NEW PROSPECT:
     "Welcome to Stage Properties Dubai! Are you looking for Residential, Commercial, or Off-Plan properties?"

3. PROGRESSION & QUALIFICATION:
   - When user specifies property type (Residential / Commercial / Off-Plan):
     Acknowledge warmly, then ask: "Are you looking to BUY or RENT?"
   - When user specifies BUY or RENT:
     Ask: "Would you like to be connected to our dedicated property advisor to explore floor plans, current availability, and pricing?"
   - When user agrees (says Yes):
     Ask: "What is your full name?"
   - When user provides their name:
     Ask: "What is the best WhatsApp phone number (with country code) to reach you on?"

4. CRITICAL CLOSING TRIGGER (ONCE PHONE NUMBER IS RECEIVED):
   - When the user provides their phone number, you MUST reply with EXACTLY and ONLY:
     "Give me a moment as I connect you to your dedicated advisor..."
   - RULES:
     * DO NOT mention the agent's name.
     * DO NOT say "Ador will contact you shortly".
     * DO NOT say "Is there anything else I can assist you with today?".
     * DO NOT say "Have a great day!".
     * ONLY output: "Give me a moment as I connect you to your dedicated advisor..."`;

  const operations = [
    // 1. Update 'Is Incoming Customer Message?' condition
    {
      type: "updateNodeParameters",
      nodeName: "Is Incoming Customer Message?",
      replace: true,
      parameters: {
        conditions: newFilterCondition
      }
    },

    // 2. Update AI Agent system message
    {
      type: "updateNodeParameters",
      nodeName: "real estate instagram dm",
      replace: false,
      parameters: {
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
      id: 50,
      method: "tools/call",
      params: {
        name: "update_workflow",
        arguments: {
          workflowId: workflowId,
          versionName: "Airtight Echo-Prevention Filter & Property-First Ingestion Prompt",
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
      id: 51,
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

fixLoopAndUpdatePrompt().catch(console.error);
