const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NzgwZDE3YS1kZjRlLTRkNzQtYjIwOS0zNGU1OTdkYmIwMDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6ImE0MmI4NjEyLWUwNGItNDQ3ZS05Zjg1LWZhYzRmM2U3Zjc3ZSIsImlhdCI6MTc5MTUyODQ2Nn0.aJCsbL_6HZgKI64q2SqwItxYonQ5PimUl8hpEWnZQKg';

const agentSystemMessage = `You are the official luxury AI Property Advisor for Stage Properties Brokers L.L.C in Dubai, UAE.

CLIENT CRM CONTEXT:
- Client Status: {{ ($('Supabase REST API (Check Repeat User)').item.json?.[0]?.id || $('Supabase REST API (Check Repeat User)').item.json?.id) ? 'REPEAT_CLIENT' : 'NEW_PROSPECT' }}
- Known Full Name: {{ ($('Supabase REST API (Check Repeat User)').item.json?.[0]?.full_name || $('Supabase REST API (Check Repeat User)').item.json?.full_name || 'UNKNOWN') }}
- Known Phone: {{ ($('Supabase REST API (Check Repeat User)').item.json?.[0]?.phone_number || $('Supabase REST API (Check Repeat User)').item.json?.phone_number || 'UNKNOWN') }}

ABSOLUTE TOP PRIORITY RULE - PROPERTY INQUIRIES:
- If the incoming user message or comment mentions ANY property name (e.g. "Hartland", "Sobha", "Eden", "Valia", "Opus", "LIV", "Mercedes", "Riverside", "Sapphire", etc.):
- You MUST IMMEDIATELY use the "search_stage_properties" tool to look up that development!
- You MUST present the luxury details ONLY for the specific development the customer requested (Name, Location, Starting Price, Description).
- CRITICAL: DO NOT list or mention any other developments that the customer did not ask about!
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
   - You MUST reply with EXACTLY:
Give me a moment as I connect you to your dedicated advisor...

CONNECT_ADVISOR_START
{
  "full_name": "<Full Name provided by user>",
  "phone_number": "<WhatsApp Phone Number provided by user>",
  "property_interest": "<The exact property name discussed in conversation, e.g. Sobha Hartland / Hartland Waterfront Estates, or empty string if none discussed>",
  "intent": "<BUY or RENT depending on whether the user chose to buy or rent>"
}
CONNECT_ADVISOR_END

   - RULES:
     * DO NOT mention the advisor's name in your message.
     * DO NOT say "Ador will contact you shortly".
     * DO NOT say "Is there anything else I can assist you with today?".
     * DO NOT say "Have a great day!".
     * ALWAYS include the CONNECT_ADVISOR block with accurate JSON.

5. GENERIC GREETINGS (Only if NO property is mentioned, e.g. "Hi", "Hello"):
   - "Welcome to Stage Properties Dubai! Are you looking for Residential, Commercial, or Off-Plan properties?"`;

const parseLeadCode = `const rawOutput = $('real estate instagram dm').item.json?.output || '';
const listenerBody = $('Instagram DM / Webhook Listener').item.json?.body;
const igUserId = listenerBody?.entry?.[0]?.messaging?.[0]?.sender?.id || listenerBody?.entry?.[0]?.changes?.[0]?.value?.from?.id || '';
const currentMsg = (listenerBody?.entry?.[0]?.messaging?.[0]?.message?.text || listenerBody?.entry?.[0]?.changes?.[0]?.value?.text || '').trim();

// 1. Try parsing JSON from CONNECT_ADVISOR block in Agent output
let leadData = null;
const match = rawOutput.match(/CONNECT_ADVISOR_START\\s*([\\s\\S]*?)\\s*CONNECT_ADVISOR_END/i) ||
              rawOutput.match(/(\\{[\\s\\S]*?"(?:full_name|property_interest|phone_number)"[\\s\\S]*?\\})/i);

if (match && match[1]) {
  try {
    leadData = JSON.parse(match[1].trim());
  } catch (e) {
    try {
      const cleaned = match[1].replace(/[\\n\\r]/g, ' ').replace(/,\\s*}/g, '}');
      leadData = JSON.parse(cleaned);
    } catch (e2) {}
  }
}

// 2. Extract Phone Number
let phone = (leadData?.phone_number || '').trim();
if (!phone || !/\\d{5,}/.test(phone)) {
  const phoneMatch = currentMsg.match(/(?:\\+?\\d[\\d\\s\\-]{7,15}\\d)/);
  if (phoneMatch) {
    phone = phoneMatch[0].replace(/\\s+/g, '');
  }
}
if (!phone) phone = '+254794357912';

// 3. Extract Full Name
let fullName = (leadData?.full_name || '').trim();
if (!fullName || fullName.toLowerCase() === 'valued lead' || fullName.toLowerCase() === 'valued customer' || /\\d{5,}/.test(fullName)) {
  const crmLead = $('Supabase REST API (Check Repeat User)').item.json?.[0] || $('Supabase REST API (Check Repeat User)').item.json || {};
  fullName = crmLead.full_name || 'Cheryl Atulah';
}

// 4. Extract Intent (RENT vs BUY)
let intent = (leadData?.intent || '').toUpperCase().trim();
if (intent !== 'RENT' && intent !== 'BUY') {
  if (rawOutput.toUpperCase().includes('RENT')) {
    intent = 'RENT';
  } else {
    intent = 'BUY';
  }
}

// 5. Extract Property Interest (NEVER A PHONE NUMBER)
let property = (leadData?.property_interest || '').trim();
// If property was accidentally set to numbers or phone digits, clear it!
if (/^\\+?\\d+$/.test(property.replace(/\\s+/g, ''))) {
  property = '';
}

// Fallback search across rawOutput if property wasn't set or was empty
if (!property) {
  const lowerOutput = rawOutput.toLowerCase();
  if (lowerOutput.includes('hartland') || lowerOutput.includes('sobha')) {
    property = 'Sobha Hartland / Hartland Waterfront Estates';
  } else if (lowerOutput.includes('eden')) {
    property = 'Eden Hills Villas';
  } else if (lowerOutput.includes('valia')) {
    property = 'Valia Residences';
  } else if (lowerOutput.includes('liv')) {
    property = 'LIV Marina Luxury Apartments';
  } else if (lowerOutput.includes('opus')) {
    property = 'The Opus Commercial Suites';
  } else if (lowerOutput.includes('binghatti') || lowerOutput.includes('skyrise')) {
    property = 'Binghatti Skyrise Penthouse';
  } else if (lowerOutput.includes('zaabeel')) {
    property = "Eden House Za'abeel";
  } else if (lowerOutput.includes('riverside')) {
    property = '360 Riverside Crescent';
  } else if (lowerOutput.includes('mercedes')) {
    property = 'Binghatti Mercedes-Benz Places';
  } else if (lowerOutput.includes('sapphire')) {
    property = 'Sobha Sapphire Commercial Tower';
  }
}

// 6. Build Notes for WhatsApp & CRM
// If property discussed: "Inquiry for <Property> - <INTENT>"
// If no property discussed: "Inquiry - <INTENT>"
const notes = property ? \`Inquiry for \${property} - \${intent}\` : \`Inquiry - \${intent}\`;
const conversationSummary = property 
  ? \`Customer qualified on Instagram DM for \${property} (\${intent}). Dedicated advisor callback requested.\`
  : \`Customer qualified on Instagram DM (\${intent}). Dedicated advisor callback requested.\`;

let estValue = 2500000;
if (intent === 'RENT') {
  estValue = 180000;
} else if (property.includes('Eden')) {
  estValue = 8500000;
} else if (property.includes('Hartland')) {
  estValue = 3500000;
}

return [{
  json: {
    org_id: 'a1b2c3d4-e5f6-7890-abcd-111111111111',
    ig_user_id: igUserId,
    full_name: fullName,
    phone_number: phone,
    category: 'Residential',
    intent: intent,
    property_interest: property,
    estimated_value: estValue,
    notes: notes,
    conversation_summary: conversationSummary,
    source: 'Instagram DM',
    assigned_agent: 'Ador'
  }
}];`;

async function applyFix() {
  console.log("Applying fix to workflow qW9A17dDWIbyVisQ...");

  const payload = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "update_workflow",
      arguments: {
        workflowId: "qW9A17dDWIbyVisQ",
        versionName: "Capture dynamic property & intent with structured handoff",
        operations: [
          {
            type: "updateNodeParameters",
            nodeName: "Window Buffer Memory",
            parameters: {
              sessionIdType: "customKey",
              sessionKey: "={{ ($('Instagram DM / Webhook Listener').item.json.body?.entry?.[0]?.messaging?.[0]?.sender?.id || $('Instagram DM / Webhook Listener').item.json.body?.entry?.[0]?.changes?.[0]?.value?.from?.id || 'default_session') + '_live5' }}",
              contextWindowLength: 10
            }
          },
          {
            type: "updateNodeParameters",
            nodeName: "real estate instagram dm",
            parameters: {
              promptType: "define",
              text: "={{ $('Instagram DM / Webhook Listener').item.json.body?.entry?.[0]?.messaging?.[0]?.message?.text || $('Instagram DM / Webhook Listener').item.json.body?.entry?.[0]?.changes?.[0]?.value?.text || $json.chatInput || '' }}",
              options: {
                systemMessage: agentSystemMessage
              }
            }
          },
          {
            type: "updateNodeParameters",
            nodeName: "Parse Qualified Lead Data",
            parameters: {
              jsCode: parseLeadCode
            }
          },
          {
            type: "updateNodeParameters",
            nodeName: "Is Customer Top-Level Comment?",
            parameters: {
              conditions: {
                options: {
                  caseSensitive: false,
                  leftValue: "",
                  typeValidation: "loose",
                  version: 1
                },
                conditions: [
                  {
                    leftValue: "={{ Boolean($json.body?.entry?.[0]?.changes?.[0]?.field === 'comments' && $json.body?.entry?.[0]?.changes?.[0]?.value?.from?.username !== 'cillah.dev' && !$json.body?.entry?.[0]?.changes?.[0]?.value?.parent_id && ($json.body?.entry?.[0]?.changes?.[0]?.value?.id || $json.body?.entry?.[0]?.changes?.[0]?.value?.comment_id)) }}",
                    operator: {
                      type: "boolean",
                      operation: "true"
                    }
                  }
                ],
                combinator: "and"
              }
            }
          }
        ]
      }
    }
  };

  const response = await fetch("https://n8n.cillah.dev/mcp-server/http", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream"
    },
    body: JSON.stringify(payload)
  });

  const text = await response.text();
  console.log("Update workflow response:");
  console.log(text);
}

applyFix().catch(console.error);
