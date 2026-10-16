const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NzgwZDE3YS1kZjRlLTRkNzQtYjIwOS0zNGU1OTdkYmIwMDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6ImE0MmI4NjEyLWUwNGItNDQ3ZS05Zjg1LWZhYzRmM2U3Zjc3ZSIsImlhdCI6MTc5MTUyODQ2Nn0.aJCsbL_6HZgKI64q2SqwItxYonQ5PimUl8hpEWnZQKg';

const agentSystemMessage = `You are the official luxury AI Property Advisor for Stage Properties Brokers L.L.C in Dubai, UAE.

CLIENT CRM CONTEXT:
- Client Status: {{ ($('Supabase REST API (Check Repeat User)').item.json?.[0]?.id || $('Supabase REST API (Check Repeat User)').item.json?.id) ? 'REPEAT_CLIENT' : 'NEW_PROSPECT' }}
- Known Full Name: {{ ($('Supabase REST API (Check Repeat User)').item.json?.[0]?.full_name || $('Supabase REST API (Check Repeat User)').item.json?.full_name || 'UNKNOWN') }}
- Known Phone: {{ ($('Supabase REST API (Check Repeat User)').item.json?.[0]?.phone_number || $('Supabase REST API (Check Repeat User)').item.json?.phone_number || 'UNKNOWN') }}

MESSAGE FORMATTING RULES FOR INSTAGRAM DM (CRITICAL):
- NEVER use markdown asterisks (* or **), hashes (###), or formatting symbols. Instagram DMs show them as raw symbols which looks messy.
- Output clean, elegant plain text.
- Use clear line breaks between sections and paragraphs so each message is clean, organized, and easy to read on mobile.
- Example property format:
Sobha Hartland Waterfront Estates
Location: Sobha Hartland, MBR City, Dubai
Starting Price: AED 1,500,000
Luxury waterfront living featuring private villas and panoramic views.

Are you looking to BUY or RENT?

ABSOLUTE TOP PRIORITY RULE - PROPERTY INQUIRIES:
- If the incoming user message or comment mentions ANY property name (e.g. "Eden", "Hartland", "Sobha", "Valia", "Opus", "LIV", "Mercedes", "Riverside", "Sapphire", etc.):
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
  "property_interest": "<The exact property name discussed in conversation, e.g. Eden Hills Villas or Sobha Hartland, or empty string if none discussed>",
  "intent": "<BUY or RENT depending on whether the user chose to buy or rent>"
}
CONNECT_ADVISOR_END

   - RULES:
     * DO NOT mention the advisor's name in your message.
     * DO NOT say "Ador will contact you shortly".
     * DO NOT say "Is there anything else I can assist you with today?".
     * DO NOT say "Have a great day!".
     * ALWAYS include the CONNECT_ADVISOR block with accurate JSON matching the discussed property and intent.

5. GENERIC GREETINGS (Only if NO property is mentioned, e.g. "Hi", "Hello"):
   - "Welcome to Stage Properties Dubai!\n\nAre you looking for Residential, Commercial, or Off-Plan properties?"`;

const dmJsonBody = `={{
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
    let cleanText = rawOutput
      .replace(/CONNECT_ADVISOR_START[\\s\\S]*?CONNECT_ADVISOR_END/gi, '')
      .replace(/\\{[\\s\\S]*?"full_name"[\\s\\S]*?\\}/gi, '')
      .replace(/\\{[\\s\\S]*?"lead_name"[\\s\\S]*?\\}/gi, '')
      .replace(/#{1,6}\\s+/g, '')
      .replace(/\\*\\*(.*?)\\*\\*/g, '$1')
      .replace(/\\*(.*?)\\*/g, '$1')
      .replace(/^\\s*[\\*\\-]\\s+/gm, '')
      .replace(/\\n{3,}/g, '\\n\\n')
      .trim() || "Hello! How can I assist you with Stage Properties today?";

    return JSON.stringify({
      recipient,
      message: {
        text: cleanText
      }
    });
  })()
}}`;

async function updateWorkflow() {
  console.log("Updating workflow with clean formatting & line breaks...");

  const payload = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "update_workflow",
      arguments: {
        workflowId: "qW9A17dDWIbyVisQ",
        versionName: "Format DMs with clean line breaks and strip markdown asterisks",
        operations: [
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
            nodeName: "Send Instagram Direct Message",
            parameters: {
              jsonBody: dmJsonBody
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
  console.log("Update response:", text);

  // Publish
  const pubRes = await fetch("https://n8n.cillah.dev/mcp-server/http", {
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
      params: { name: "publish_workflow", arguments: { workflowId: "qW9A17dDWIbyVisQ" } }
    })
  });
  const pubText = await pubRes.text();
  console.log("Publish response:", pubText);
}

updateWorkflow().catch(console.error);
