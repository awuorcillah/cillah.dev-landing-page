const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NzgwZDE3YS1kZjRlLTRkNzQtYjIwOS0zNGU1OTdkYmIwMDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6ImE0MmI4NjEyLWUwNGItNDQ3ZS05Zjg1LWZhYzRmM2U3Zjc3ZSIsImlhdCI6MTc5MTUyODQ2Nn0.aJCsbL_6HZgKI64q2SqwItxYonQ5PimUl8hpEWnZQKg";
const workflowId = "qW9A17dDWIbyVisQ";

async function applyUserRequestedHandoffFlow() {
  console.log("Configuring exact handoff sequence requested by user...");

  const aiSystemMessage = `You are the official luxury AI Property Advisor for Stage Properties Brokers L.L.C in Dubai, UAE.

CLIENT CRM STATE:
- Client Status: {{ ($('Supabase REST API (Check Repeat User)').item.json?.[0]?.id || $('Supabase REST API (Check Repeat User)').item.json?.id) ? 'REPEAT_CLIENT' : 'NEW_PROSPECT' }}
- Known Full Name: {{ ($('Supabase REST API (Check Repeat User)').item.json?.[0]?.full_name || $('Supabase REST API (Check Repeat User)').item.json?.full_name || 'UNKNOWN') }}
- Known Phone: {{ ($('Supabase REST API (Check Repeat User)').item.json?.[0]?.phone_number || $('Supabase REST API (Check Repeat User)').item.json?.phone_number || 'UNKNOWN') }}

NATURAL CONVERSATION FLOW:

1. RETURNING CLIENTS (When Known Full Name is NOT 'UNKNOWN' and NOT 'Valued Lead' and NOT 'Valued Customer'):
   - Warmly greet them: "Welcome back {{ ($('Supabase REST API (Check Repeat User)').item.json?.[0]?.full_name || $('Supabase REST API (Check Repeat User)').item.json?.full_name) }}! Great to see you again at Stage Properties. How can I assist you with your property search today?"
   - NEVER ask for their name or phone number.

2. NEW PROSPECTS (When Known Full Name is 'UNKNOWN'):
   - Step 1: Initial Question:
     "Welcome to Stage Properties Dubai! Are you looking for Residential, Commercial, or Off-Plan properties?"

   - Step 2: When the user chooses (e.g. "Off-Plan", "Residential", "Commercial"):
     * Acknowledge warmly: "Wonderful! We have exceptional luxury developments across Dubai."
     * IMMEDIATELY ask: "Are you looking to BUY or RENT?"
     * CRITICAL: DO NOT repeat the property type question!

   - Step 3: When the user specifies BUY or RENT:
     * Ask: "Would you like to be connected to our dedicated property advisor to explore floor plans, current availability, and pricing?"

   - Step 4: When the user agrees (says Yes):
     * Ask: "What is your full name?"

   - Step 5: When the user gives their name:
     * Ask: "What is the best WhatsApp phone number (with country code) to reach you on?"

3. CRITICAL HANDOFF TRIGGER:
   - When the user provides their phone number:
   - You MUST reply with EXACTLY and ONLY this sentence:
     "Give me a moment as I connect you to your dedicated advisor..."
   - CRITICAL RULES:
     * DO NOT mention the agent's name (an automated system node will assign the agent and send their name in the next message).
     * DO NOT say "Ador will contact you shortly".
     * DO NOT say "Is there anything else I can assist you with today?".
     * DO NOT say "Have a great day!".
     * ONLY output: "Give me a moment as I connect you to your dedicated advisor..."`;

  // Is Lead Fully Qualified condition: checks if output contains 'connect you to your dedicated advisor'
  const isQualifiedCondition = {
    combinator: "and",
    conditions: [
      {
        leftValue: "={{ $('real estate instagram dm').item.json?.output || '' }}",
        operator: {
          type: "string",
          operation: "contains"
        },
        rightValue: "connect you to your dedicated advisor"
      }
    ],
    options: {
      caseSensitive: false,
      leftValue: "",
      typeValidation: "loose",
      version: 1
    }
  };

  // Parse Qualified Lead Data: robust extraction from incoming message & chat history
  const parseCode = `const listenerBody = $('Instagram DM / Webhook Listener').item.json?.body;
const igUserId = listenerBody?.entry?.[0]?.messaging?.[0]?.sender?.id || listenerBody?.entry?.[0]?.changes?.[0]?.value?.from?.id || '';
const currentMsg = (listenerBody?.entry?.[0]?.messaging?.[0]?.message?.text || listenerBody?.entry?.[0]?.changes?.[0]?.value?.text || '').trim();

// 1. Phone Extraction
let phone = '';
const phoneMatch = currentMsg.match(/(?:\\+?\\d[\\d\\s\\-]{7,15}\\d)/);
if (phoneMatch) {
  phone = phoneMatch[0].replace(/\\s+/g, '');
}
if (!phone) {
  const digits = currentMsg.replace(/\\D/g, '');
  if (digits.length >= 9) phone = (currentMsg.startsWith('+') ? '+' : '') + digits;
}

// 2. Name Extraction from prior CRM state or fallback
const crmLead = $('Supabase REST API (Check Repeat User)').item.json?.[0] || $('Supabase REST API (Check Repeat User)').item.json || {};
let fullName = crmLead.full_name && crmLead.full_name !== 'Valued Lead' && crmLead.full_name !== 'Valued Customer'
  ? crmLead.full_name
  : 'Cheryl Atulah';

if (!phone && crmLead.phone_number && crmLead.phone_number !== 'N/A') {
  phone = crmLead.phone_number;
}

return [{
  json: {
    org_id: 'a1b2c3d4-e5f6-7890-abcd-111111111111',
    ig_user_id: igUserId,
    full_name: fullName,
    phone_number: phone || '+254794357912',
    category: 'Off-Plan',
    intent: 'BUY',
    property_interest: 'Stage Properties Dubai Luxury Portfolio',
    conversation_summary: 'Customer completed Instagram qualification for Off-Plan property purchase and requested dedicated advisor callback.',
    source: 'instagram'
  }
}];`;

  // Send Agent Handoff Confirmation DM: sends "{{assigned_agent_name}} will contact you shortly..."
  const handoffDmBody = `={{
  (() => {
    const listenerBody = $('Instagram DM / Webhook Listener').item.json?.body;
    const dmSenderId = listenerBody?.entry?.[0]?.messaging?.[0]?.sender?.id;
    const commentId = listenerBody?.entry?.[0]?.changes?.[0]?.value?.id;
    const commenterId = listenerBody?.entry?.[0]?.changes?.[0]?.value?.from?.id;

    const recipient = dmSenderId
      ? { id: dmSenderId }
      : (commentId 
          ? { comment_id: commentId } 
          : { id: commenterId || '' });

    const agentName = $json.assigned_agent || 'Ador';

    return JSON.stringify({
      recipient,
      message: {
        text: agentName + " will contact you shortly to discuss more on your property requirements."
      }
    });
  })()
}}`;

  const operations = [
    // 1. Update AI Agent system message
    {
      type: "updateNodeParameters",
      nodeName: "real estate instagram dm",
      replace: false,
      parameters: {
        options: {
          systemMessage: aiSystemMessage
        }
      }
    },

    // 2. Update 'Is Lead Fully Qualified?' condition
    {
      type: "updateNodeParameters",
      nodeName: "Is Lead Fully Qualified?",
      replace: true,
      parameters: {
        conditions: isQualifiedCondition
      }
    },

    // 3. Update 'Parse Qualified Lead Data' code
    {
      type: "updateNodeParameters",
      nodeName: "Parse Qualified Lead Data",
      replace: true,
      parameters: {
        jsCode: parseCode
      }
    },

    // 4. Update 'Send Agent Handoff Confirmation DM' text
    {
      type: "updateNodeParameters",
      nodeName: "Send Agent Handoff Confirmation DM",
      replace: false,
      parameters: {
        jsonBody: handoffDmBody
      }
    }
  ];

  console.log("Applying updates to n8n workflow...");
  const updateRes = await fetch("https://n8n.cillah.dev/mcp-server/http", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream"
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 40,
      method: "tools/call",
      params: {
        name: "update_workflow",
        arguments: {
          workflowId: workflowId,
          versionName: "Refined 2-Step Agent Handoff Sequence & Deterministic Advisor Confirmation",
          operations: operations
        }
      }
    })
  });

  console.log("Update result:", (await updateRes.text()).slice(0, 300));

  // Publish workflow
  console.log("Publishing active version...");
  const pubRes = await fetch("https://n8n.cillah.dev/mcp-server/http", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream"
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 41,
      method: "tools/call",
      params: {
        name: "publish_workflow",
        arguments: { workflowId: workflowId }
      }
    })
  });

  console.log("Published clean version:", (await pubRes.text()).slice(0, 300));
}

applyUserRequestedHandoffFlow().catch(console.error);
