const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NzgwZDE3YS1kZjRlLTRkNzQtYjIwOS0zNGU1OTdkYmIwMDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6ImE0MmI4NjEyLWUwNGItNDQ3ZS05Zjg1LWZhYzRmM2U3Zjc3ZSIsImlhdCI6MTc5MTUyODQ2Nn0.aJCsbL_6HZgKI64q2SqwItxYonQ5PimUl8hpEWnZQKg";
const fs = require('fs');

const workflowId = "qW9A17dDWIbyVisQ";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhhc3R5Z2Zvc2d5eHJ4enJ6cnVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2NTA4ODEsImV4cCI6MjEwNjIyNjg4MX0.EVdnsyzWPuDJPJ_-ttg8DrA2Nl14Z04saG9Xj-rPjvg";

async function deployArchitecture() {
  console.log("Loading current workflow...");
  const rawWf = JSON.parse(fs.readFileSync('scratch/full_wf.json', 'utf8'));

  // 1. Add 'Fetch Customer CRM Profile' Node
  const fetchCrmProfileNode = {
    id: "fetch-customer-crm-profile-001",
    name: "Fetch Customer CRM Profile",
    type: "n8n-nodes-base.httpRequest",
    typeVersion: 4.3,
    position: [-160, 144],
    parameters: {
      url: "=https://hastygfosgyxrxzrzrur.supabase.co/rest/v1/stage_leads?ig_user_id=eq.{{ $json.body?.entry?.[0]?.messaging?.[0]?.sender?.id || $json.body?.entry?.[0]?.changes?.[0]?.value?.from?.id || '' }}&order=created_at.desc&limit=1",
      sendHeaders: true,
      specifyHeaders: "json",
      jsonHeaders: `={\n  "apikey": "${supabaseAnonKey}",\n  "Authorization": "Bearer ${supabaseAnonKey}"\n}`,
      options: {}
    },
    alwaysOutputData: true
  };

  // 2. Update AI Agent Prompt with Real-Time CRM Profile
  const aiAgentPrompt = `You are the official luxury AI Property Advisor for Stage Properties Brokers L.L.C in Dubai, UAE.

CLIENT CRM PROFILE:
- Client Status: {{ ($('Fetch Customer CRM Profile').item.json?.[0]?.id || $('Fetch Customer CRM Profile').item.json?.id) ? 'REPEAT_CLIENT' : 'NEW_PROSPECT' }}
- Known Full Name: {{ ($('Fetch Customer CRM Profile').item.json?.[0]?.full_name || $('Fetch Customer CRM Profile').item.json?.full_name || 'UNKNOWN') }}
- Known Phone: {{ ($('Fetch Customer CRM Profile').item.json?.[0]?.phone_number || $('Fetch Customer CRM Profile').item.json?.phone_number || 'UNKNOWN') }}
- Assigned Property Advisor: {{ ($('Fetch Customer CRM Profile').item.json?.[0]?.assigned_agent_name || $('Fetch Customer CRM Profile').item.json?.assigned_agent_name || 'Ador') }}

STRICT CONVERSATION PROTOCOL:

1. REPEAT CLIENT PROTOCOL (When Known Full Name is NOT 'UNKNOWN' and NOT 'Valued Lead' and NOT 'Valued Customer'):
   - Warmly greet them by their real name: "Welcome back {{ ($('Fetch Customer CRM Profile').item.json?.[0]?.full_name || $('Fetch Customer CRM Profile').item.json?.full_name) }}! Great to assist you again at Stage Properties."
   - DO NOT ask for their name or phone number. We already have them.
   - Proceed directly to answering their question about Dubai properties (using "search_stage_properties" tool).

2. NEW PROSPECT PROTOCOL (When Known Full Name is 'UNKNOWN'):
   - Qualification Question 1: Ask: "Are you looking for Residential, Commercial, or Off-Plan properties in Dubai?"
   - Property Search: When they name a development or community (e.g. Sobha Hartland, Eden, Vitalia, Valia, Opus), use the "search_stage_properties" tool to look up inventory, prices, and amenities.
   - Qualification Question 2: Ask: "Are you looking to BUY or RENT?"
   - Advisor Offer: Ask: "Would you like to be connected to our {{category}} property advisor to explore more options and pricing?"
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

  // 3. Update Send Instagram Direct Message (strip CONNECT_ADVISOR block)
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

  // 4. Update 'Is Lead Fully Qualified?' Condition (100% deterministic check on CONNECT_ADVISOR_START)
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

  // 5. Update 'Parse Qualified Lead Data' Code
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

  // 6. Update 'Handoff to Sales Advisor' Node (calls https://cillah.dev/api/leads/connect-advisor)
  const handoffApiNode = {
    id: "4c551a43-e877-4788-8886-43bb6a37da2e",
    name: "Supabase REST API (Insert Lead)",
    type: "n8n-nodes-base.httpRequest",
    typeVersion: 4.3,
    position: [1920, 160],
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
    },
    onError: "continueRegularOutput"
  };

  // Modify nodes array
  let nodes = rawWf.nodes.filter(n => n.name !== "Fetch Customer CRM Profile");
  nodes.push(fetchCrmProfileNode);

  nodes = nodes.map(n => {
    if (n.name === "real estate instagram dm") {
      n.position = [160, 144];
      n.parameters.options.systemMessage = aiAgentPrompt;
    }
    if (n.name === "Send Instagram Direct Message") {
      n.parameters.jsonBody = sendDmJsBody;
    }
    if (n.name === "Is Lead Fully Qualified?") {
      n.parameters.conditions = isQualifiedCondition;
    }
    if (n.name === "Parse Qualified Lead Data") {
      n.parameters.jsCode = parseCode;
    }
    if (n.name === "Supabase REST API (Insert Lead)") {
      return handoffApiNode;
    }
    return n;
  });

  // Modify connections
  let connections = { ...rawWf.connections };

  // 'Is Incoming Customer Message?' -> [ 'Is Customer Top-Level Comment?', 'Fetch Customer CRM Profile' ]
  connections["Is Incoming Customer Message?"] = {
    main: [
      [
        { node: "Is Customer Top-Level Comment?", type: "main", index: 0 },
        { node: "Fetch Customer CRM Profile", type: "main", index: 0 }
      ]
    ]
  };

  // 'Fetch Customer CRM Profile' -> 'real estate instagram dm'
  connections["Fetch Customer CRM Profile"] = {
    main: [
      [
        { node: "real estate instagram dm", type: "main", index: 0 }
      ]
    ]
  };

  // Parse Qualified Lead Data -> Supabase REST API (Insert Lead) directly!
  connections["Parse Qualified Lead Data"] = {
    main: [
      [
        { node: "Supabase REST API (Insert Lead)", type: "main", index: 0 }
      ]
    ]
  };

  const updatedWf = {
    name: rawWf.name,
    nodes: nodes,
    connections: connections,
    settings: rawWf.settings
  };

  console.log("Saving updated workflow to n8n via MCP...");
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
        name: "update_workflow",
        arguments: {
          workflowId: workflowId,
          workflow: updatedWf
        }
      }
    })
  });

  const resText = await updateRes.text();
  console.log("Update response:", resText.slice(0, 300));

  // Publish workflow to activate
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
      id: 3,
      method: "tools/call",
      params: {
        name: "publish_workflow",
        arguments: { workflowId: workflowId }
      }
    })
  });

  console.log("Publish response:", (await pubRes.text()).slice(0, 300));
}

deployArchitecture().catch(console.error);
