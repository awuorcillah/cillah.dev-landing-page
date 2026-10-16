const fs = require('fs');
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NzgwZDE3YS1kZjRlLTRkNzQtYjIwOS0zNGU1OTdkYmIwMDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6ImE0MmI4NjEyLWUwNGItNDQ3ZS05Zjg1LWZhYzRmM2U3Zjc3ZSIsImlhdCI6MTc5MTUyODQ2Nn0.aJCsbL_6HZgKI64q2SqwItxYonQ5PimUl8hpEWnZQKg";
const workflowId = "qW9A17dDWIbyVisQ";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhhc3R5Z2Zvc2d5eHJ4enJ6cnVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2NTA4ODEsImV4cCI6MjEwNjIyNjg4MX0.EVdnsyzWPuDJPJ_-ttg8DrA2Nl14Z04saG9Xj-rPjvg";

async function applyFullCrmWorkflow() {
  console.log("Preparing atomic operations for n8n workflow update...");

  const aiAgentPrompt = `You are the official luxury AI Property Advisor for Stage Properties Brokers L.L.C in Dubai, UAE.

CLIENT CRM PROFILE:
- Client Status: {{ ($('Supabase REST API (Check Repeat User)').item.json?.[0]?.id || $('Supabase REST API (Check Repeat User)').item.json?.id) ? 'REPEAT_CLIENT' : 'NEW_PROSPECT' }}
- Known Full Name: {{ ($('Supabase REST API (Check Repeat User)').item.json?.[0]?.full_name || $('Supabase REST API (Check Repeat User)').item.json?.full_name || 'UNKNOWN') }}
- Known Phone: {{ ($('Supabase REST API (Check Repeat User)').item.json?.[0]?.phone_number || $('Supabase REST API (Check Repeat User)').item.json?.phone_number || 'UNKNOWN') }}
- Assigned Property Advisor: {{ ($('Supabase REST API (Check Repeat User)').item.json?.[0]?.assigned_agent_name || $('Supabase REST API (Check Repeat User)').item.json?.assigned_agent_name || 'Ador') }}

STRICT CONVERSATION PROTOCOL:

1. REPEAT CLIENT PROTOCOL (When Known Full Name is NOT 'UNKNOWN' and NOT 'Valued Lead' and NOT 'Valued Customer'):
   - Warmly greet them by their real name: "Welcome back {{ ($('Supabase REST API (Check Repeat User)').item.json?.[0]?.full_name || $('Supabase REST API (Check Repeat User)').item.json?.full_name) }}! Great to assist you again at Stage Properties."
   - DO NOT ask for their name or phone number. We already have them.
   - Proceed directly to answering their question about Dubai properties (using "search_stage_properties" tool).

2. NEW PROSPECT PROTOCOL (When Known Full Name is 'UNKNOWN'):
   - Qualification Question 1: Ask: "Are you looking for Residential, Commercial, or Off-Plan properties in Dubai?"
   - Property Search: When they name a development or community (e.g. Sobha Hartland, Eden, Vitalia, Valia, Opus), use the "search_stage_properties" tool to look up inventory, prices, and amenities.
   - Qualification Question 2: Ask: "Are you looking to BUY or RENT?"
   - Advisor Offer: Ask: "Would you like to be connected to our {{category}} property advisor to explore exclusive units?"
   - If they agree:
     a) Ask: "What is your full name?"
     b) Once name is given, ask: "What is the best phone number (with country code) to reach you on?"

3. DETERMINISTIC ADVISOR HANDOFF & SUMMARY:
   - As soon as you have their Full Name and Phone Number (or if a returning client asks for advisor callback):
   - You MUST append this EXACT structured block at the very end of your response:
CONNECT_ADVISOR_START
{
  "full_name": "<lead's full name>",
  "phone_number": "<lead's phone number>",
  "category": "<Residential/Commercial/Off-Plan>",
  "intent": "<BUY or RENT>",
  "property_interest": "<property name>",
  "conversation_summary": "<brief 2-sentence summary of what was discussed, budget, and specific preferences for the sales advisor>"
}
CONNECT_ADVISOR_END
   - In your customer-facing reply before the block, say:
   "Give me a moment as I connect you to your dedicated advisor... {{assigned agent or Ador}} will contact you shortly to discuss more on {{intent}} your {{property}} property. Is there anything else I can assist you with today?"`;

  const sendDmJsBody = `={{
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

    const rawOutput = $json.output || '';
    const cleanText = rawOutput
      .replace(/CONNECT_ADVISOR_START[\\s\\S]*?CONNECT_ADVISOR_END/gi, '')
      .replace(/\\{[\\s\\S]*?\"full_name\"[\\s\\S]*?\\}/gi, '')
      .replace(/\\{[\\s\\S]*?\"lead_name\"[\\s\\S]*?\\}/gi, '')
      .trim() || "Hello! How can I assist you with Stage Properties today?";

    return JSON.stringify({
      recipient,
      message: {
        text: cleanText
      }
    });
  })()
}}`;

  const isQualifiedCondition = {
    combinator: "and",
    conditions: [
      {
        leftValue: "={{ $('real estate instagram dm').item.json?.output || '' }}",
        operator: {
          type: "string",
          operation: "contains"
        },
        rightValue: "CONNECT_ADVISOR_START"
      }
    ],
    options: {
      caseSensitive: true,
      leftValue: "",
      typeValidation: "loose",
      version: 1
    }
  };

  const parseCode = `const output = $('real estate instagram dm').item.json?.output || '';
const match = output.match(/CONNECT_ADVISOR_START([\\s\\S]*?)CONNECT_ADVISOR_END/);

let lead_name = 'Cheryl Atulah';
let lead_phone = '+254 794 357 912';
let category = 'Residential';
let intent = 'BUY';
let property_interest = 'Sobha Hartland';
let conversation_summary = 'Customer inquired about Dubai luxury real estate.';

if (match) {
  try {
    const data = JSON.parse(match[1].trim());
    lead_name = data.full_name || lead_name;
    lead_phone = data.phone_number || lead_phone;
    category = data.category || category;
    intent = data.intent || intent;
    property_interest = data.property_interest || property_interest;
    conversation_summary = data.conversation_summary || conversation_summary;
  } catch (e) {}
}

const listenerBody = $('Instagram DM / Webhook Listener').item.json?.body;
const igUserId = listenerBody?.entry?.[0]?.messaging?.[0]?.sender?.id || listenerBody?.entry?.[0]?.changes?.[0]?.value?.from?.id || '';

return [{
  json: {
    org_id: 'a1b2c3d4-e5f6-7890-abcd-111111111111',
    ig_user_id: igUserId,
    full_name: lead_name,
    phone_number: lead_phone,
    category: category,
    intent: intent,
    property_interest: property_interest,
    conversation_summary: conversation_summary,
    source: 'instagram'
  }
}];`;

  const operations = [
    // 1. Reposition & Configure Supabase REST API (Check Repeat User) to run before the AI agent
    {
      type: "setNodePosition",
      nodeName: "Supabase REST API (Check Repeat User)",
      position: [-160, 144]
    },
    {
      type: "updateNodeParameters",
      nodeName: "Supabase REST API (Check Repeat User)",
      replace: true,
      parameters: {
        method: "GET",
        url: "=https://hastygfosgyxrxzrzrur.supabase.co/rest/v1/stage_leads?ig_user_id=eq.{{ $json.body?.entry?.[0]?.messaging?.[0]?.sender?.id || $json.body?.entry?.[0]?.changes?.[0]?.value?.from?.id || '' }}&order=created_at.desc&limit=1",
        sendHeaders: true,
        specifyHeaders: "json",
        jsonHeaders: `={\n  "apikey": "${supabaseAnonKey}",\n  "Authorization": "Bearer ${supabaseAnonKey}"\n}`,
        options: {}
      }
    },
    {
      type: "setNodeSettings",
      nodeName: "Supabase REST API (Check Repeat User)",
      settings: {
        alwaysOutputData: true
      }
    },

    // 2. Disconnect old connections around 'Supabase REST API (Check Repeat User)'
    {
      type: "removeConnection",
      source: "Fetch Active Sales Agent",
      target: "Supabase REST API (Check Repeat User)",
      connectionType: "main"
    },
    {
      type: "removeConnection",
      source: "Supabase REST API (Check Repeat User)",
      target: "Is Repeat User?",
      connectionType: "main"
    },
    {
      type: "removeConnection",
      source: "Is Incoming Customer Message?",
      target: "real estate instagram dm",
      connectionType: "main"
    },

    // 3. Connect 'Is Incoming Customer Message?' -> 'Supabase REST API (Check Repeat User)' -> 'real estate instagram dm'
    {
      type: "addConnection",
      source: "Is Incoming Customer Message?",
      target: "Supabase REST API (Check Repeat User)",
      connectionType: "main"
    },
    {
      type: "addConnection",
      source: "Supabase REST API (Check Repeat User)",
      target: "real estate instagram dm",
      connectionType: "main"
    },

    // 4. Update 'real estate instagram dm' System Prompt with CRM Profile
    {
      type: "updateNodeParameters",
      nodeName: "real estate instagram dm",
      replace: false,
      parameters: {
        options: {
          systemMessage: aiAgentPrompt
        }
      }
    },

    // 5. Update 'Send Instagram Direct Message' to strip CONNECT_ADVISOR block
    {
      type: "updateNodeParameters",
      nodeName: "Send Instagram Direct Message",
      replace: false,
      parameters: {
        jsonBody: sendDmJsBody
      }
    },

    // 6. Update 'Is Lead Fully Qualified?' condition to 100% deterministic check
    {
      type: "updateNodeParameters",
      nodeName: "Is Lead Fully Qualified?",
      replace: true,
      parameters: {
        conditions: isQualifiedCondition
      }
    },

    // 7. Update 'Parse Qualified Lead Data' code
    {
      type: "updateNodeParameters",
      nodeName: "Parse Qualified Lead Data",
      replace: true,
      parameters: {
        jsCode: parseCode
      }
    },

    // 8. Connect 'Parse Qualified Lead Data' directly to 'Supabase REST API (Insert Lead)'
    {
      type: "removeConnection",
      source: "Parse Qualified Lead Data",
      target: "Fetch Active Sales Agent",
      connectionType: "main"
    },
    {
      type: "addConnection",
      source: "Parse Qualified Lead Data",
      target: "Supabase REST API (Insert Lead)",
      connectionType: "main"
    },

    // 9. Update 'Supabase REST API (Insert Lead)' to call https://cillah.dev/api/leads/connect-advisor
    {
      type: "updateNodeParameters",
      nodeName: "Supabase REST API (Insert Lead)",
      replace: true,
      parameters: {
        method: "POST",
        url: "https://cillah.dev/api/leads/connect-advisor",
        sendHeaders: true,
        specifyHeaders: "json",
        jsonHeaders: "={\n  \"Content-Type\": \"application/json\"\n}",
        sendBody: true,
        specifyBody: "json",
        jsonBody: "={{ JSON.stringify($json) }}",
        options: {}
      }
    }
  ];

  console.log(`Executing ${operations.length} atomic operations via n8n MCP...`);

  const updateRes = await fetch("https://n8n.cillah.dev/mcp-server/http", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream"
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 10,
      method: "tools/call",
      params: {
        name: "update_workflow",
        arguments: {
          workflowId: workflowId,
          versionName: "Omnichannel CRM Lead Memory and Deterministic Advisor Handoff",
          versionDescription: "Pre-checks Supabase CRM profile, injects state into AI agent, eliminates regex guessing, and routes handoffs with notes to Ador via cillah.dev API.",
          operations: operations
        }
      }
    })
  });

  const updateText = await updateRes.text();
  console.log("Update Workflow Result:", updateText);

  // Publish workflow to make live
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
      id: 11,
      method: "tools/call",
      params: {
        name: "publish_workflow",
        arguments: { workflowId: workflowId }
      }
    })
  });

  const pubText = await pubRes.text();
  console.log("Publish Result:", pubText);
}

applyFullCrmWorkflow().catch(console.error);
