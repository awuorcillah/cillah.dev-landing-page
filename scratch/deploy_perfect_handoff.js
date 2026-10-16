const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NzgwZDE3YS1kZjRlLTRkNzQtYjIwOS0zNGU1OTdkYmIwMDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6ImE0MmI4NjEyLWUwNGItNDQ3ZS05Zjg1LWZhYzRmM2U3Zjc3ZSIsImlhdCI6MTc5MTUyODQ2Nn0.aJCsbL_6HZgKI64q2SqwItxYonQ5PimUl8hpEWnZQKg";
const workflowId = "qW9A17dDWIbyVisQ";

async function deployPerfectHandoff() {
    console.log("Deploying perfect handoff architecture for workflow qW9A17dDWIbyVisQ...");

    const parseCode = `const output = $('real estate instagram dm').item.json?.output || '';
const jsonMatch = output.match(/\\{[\\s\\S]*?"lead_name"[\\s\\S]*?\\}/);

let lead_name = "";
let lead_phone = "";
let intent = "BUY";
let property_interest = "Sobha Hartland";

if (jsonMatch) {
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    lead_name = parsed.lead_name || lead_name;
    lead_phone = parsed.lead_phone || lead_phone;
    intent = parsed.intent || intent;
    property_interest = parsed.property_interest || property_interest;
  } catch (e) {}
}

if (!lead_name) {
  const nameMatch = output.match(/name["\\s:]+([^"\\n,]+)/i);
  if (nameMatch) lead_name = nameMatch[1].trim();
}
if (!lead_phone) {
  const phoneMatch = output.match(/(?:\\+?\\d{8,15})/);
  if (phoneMatch) lead_phone = phoneMatch[0];
}

const isQualified = !!(jsonMatch || lead_name || lead_phone || output.toLowerCase().includes("dedicated advisor"));

return [{
  json: {
    isQualified,
    lead_name: lead_name || "Valued Customer",
    lead_phone: lead_phone || "N/A",
    intent: intent.toUpperCase().includes("RENT") ? "RENT" : "BUY",
    property_interest: property_interest || "Stage Properties Luxury Portfolio",
    assigned_agent_name: "Ador"
  }
}];`;

    const sendDmJsonBody = `={{
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
    const cleanText = rawOutput.replace(/\\{[\\s\\S]*?"lead_name"[\\s\\S]*?\\}/gi, '').trim() || "Hello! How can I assist you with Stage Properties today?";

    return JSON.stringify({
      recipient,
      message: {
        text: cleanText
      }
    });
  })()
}}`;

    const insertLeadJsonBody = `={{
  JSON.stringify({
    full_name: $json.lead_name || "Valued Lead",
    phone_number: $json.lead_phone || "N/A",
    intent: $json.intent || "BUY",
    property_interest: $json.property_interest || "Sobha Hartland",
    assigned_agent_name: "Ador",
    status: "new_inquiry",
    ig_user_id: $('Instagram DM / Webhook Listener').item.json.body?.entry?.[0]?.messaging?.[0]?.sender?.id || $('Instagram DM / Webhook Listener').item.json.body?.entry?.[0]?.changes?.[0]?.value?.from?.id || ''
  })
}}`;

    const handoffDmJsonBody = `={{
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

    const agentName = $json.assigned_agent_name || $('Parse Qualified Lead Data').item.json.assigned_agent_name || 'Ador';
    const intentStr = ($json.intent || $('Parse Qualified Lead Data').item.json.intent) == 'RENT' ? 'renting' : 'buying';
    const propStr = $json.property_interest || $('Parse Qualified Lead Data').item.json.property_interest || 'property interest';

    return JSON.stringify({
      recipient,
      message: {
        text: agentName + " will contact you shortly to discuss more on " + intentStr + " your " + propStr + " property."
      }
    });
  })()
}}`;

    const notifyWhatsappJsonBody = `={{
  JSON.stringify({
    to: "0794357912",
    message: "🏷️ NEW QUALIFIED LEAD - STAGE PROPERTIES\\n\\nName: " + ($json.full_name || $('Parse Qualified Lead Data').item.json.lead_name) + "\\nPhone: " + ($json.phone_number || $('Parse Qualified Lead Data').item.json.lead_phone) + "\\nProperty: " + ($json.property_interest || $('Parse Qualified Lead Data').item.json.property_interest) + "\\nAssigned Agent: Ador"
  })
}}`;

    const operations = [
        // 1. Add Code Node: Parse Qualified Lead Data
        {
            type: "addNode",
            node: {
                name: "Parse Qualified Lead Data",
                type: "n8n-nodes-base.code",
                typeVersion: 2,
                position: [960, 112],
                parameters: {
                    jsCode: parseCode
                }
            }
        },

        // 2. Set alwaysOutputData: true on Supabase REST API (Check Repeat User)
        {
            type: "setNodeSettings",
            nodeName: "Supabase REST API (Check Repeat User)",
            settings: {
                alwaysOutputData: true
            }
        },

        // 3. Update Is Lead Fully Qualified? parameters
        {
            type: "updateNodeParameters",
            nodeName: "Is Lead Fully Qualified?",
            parameters: {
                conditions: {
                    options: { caseSensitive: false, typeValidation: "loose", version: 1 },
                    conditions: [
                        {
                            leftValue: "={{ $json.output }}",
                            operator: { type: "string", operation: "contains" },
                            rightValue: "dedicated advisor"
                        },
                        {
                            leftValue: "={{ $json.output }}",
                            operator: { type: "string", operation: "contains" },
                            rightValue: "lead_name"
                        }
                    ],
                    combinator: "or"
                }
            }
        },

        // 4. Update Send Instagram Direct Message jsonBody (strips raw JSON block)
        {
            type: "updateNodeParameters",
            nodeName: "Send Instagram Direct Message",
            parameters: {
                method: "POST",
                url: "https://graph.facebook.com/v18.0/me/messages",
                authentication: "predefinedCredentialType",
                nodeCredentialType: "facebookGraphApi",
                sendBody: true,
                specifyBody: "json",
                jsonBody: sendDmJsonBody,
                options: {}
            }
        },

        // 5. Update Supabase REST API (Insert Lead) jsonBody
        {
            type: "updateNodeParameters",
            nodeName: "Supabase REST API (Insert Lead)",
            parameters: {
                method: "POST",
                url: "https://hastygfosgyxrxzrzrur.supabase.co/rest/v1/stage_leads",
                sendHeaders: true,
                specifyHeaders: "json",
                jsonHeaders: "={\n  \"apikey\": \"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhhc3R5Z2Zvc2d5eHJ4enJ6cnVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2NTA4ODEsImV4cCI6MjEwNjIyNjg4MX0.EVdnsyzWPuDJPJ_-ttg8DrA2Nl14Z04saG9Xj-rPjvg\",\n  \"Authorization\": \"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhhc3R5Z2Zvc2d5eHJ4enJ6cnVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2NTA4ODEsImV4cCI6MjEwNjIyNjg4MX0.EVdnsyzWPuDJPJ_-ttg8DrA2Nl14Z04saG9Xj-rPjvg\"\n}",
                sendBody: true,
                specifyBody: "json",
                jsonBody: insertLeadJsonBody,
                options: {}
            }
        },

        // 6. Update Send Agent Handoff Confirmation DM jsonBody
        {
            type: "updateNodeParameters",
            nodeName: "Send Agent Handoff Confirmation DM",
            parameters: {
                method: "POST",
                url: "https://graph.facebook.com/v18.0/me/messages",
                authentication: "predefinedCredentialType",
                nodeCredentialType: "facebookGraphApi",
                sendBody: true,
                specifyBody: "json",
                jsonBody: handoffDmJsonBody,
                options: {}
            }
        },

        // 7. Update Notify New Agent Ador on WhatsApp jsonBody
        {
            type: "updateNodeParameters",
            nodeName: "Notify New Agent Ador on WhatsApp",
            parameters: {
                method: "POST",
                url: "https://cillah.dev/api/whatsapp/send-notification",
                sendBody: true,
                specifyBody: "json",
                jsonBody: notifyWhatsappJsonBody,
                options: {}
            }
        },

        // 8. Re-wire connections:
        // Remove connection from Is Lead Fully Qualified? to Supabase Check Repeat User
        {
            type: "removeConnection",
            source: "Is Lead Fully Qualified?",
            target: "Supabase REST API (Check Repeat User)",
            connectionType: "main",
            sourceIndex: 0,
            targetIndex: 0
        },

        // Connect Is Lead Fully Qualified? (Branch 0 True) -> Parse Qualified Lead Data
        {
            type: "addConnection",
            source: "Is Lead Fully Qualified?",
            target: "Parse Qualified Lead Data",
            connectionType: "main",
            sourceIndex: 0,
            targetIndex: 0
        },

        // Connect Parse Qualified Lead Data -> Supabase REST API (Check Repeat User)
        {
            type: "addConnection",
            source: "Parse Qualified Lead Data",
            target: "Supabase REST API (Check Repeat User)",
            connectionType: "main",
            sourceIndex: 0,
            targetIndex: 0
        }
    ];

    const res = await fetch("https://n8n.cillah.dev/mcp-server/http", {
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
                name: "update_workflow",
                arguments: {
                    workflowId,
                    versionName: "Deploy Perfect Handoff & Agent Name Confirmation v12.0",
                    operations
                }
            }
        })
    });

    const textOutput = await res.text();
    console.log("Update Workflow Result:", textOutput);

    // Publish workflow
    const pubRes = await fetch("https://n8n.cillah.dev/mcp-server/http", {
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
                name: "publish_workflow",
                arguments: { workflowId }
            }
        })
    });

    const pubText = await pubRes.text();
    console.log("Publish Result:", pubText);
}

deployPerfectHandoff().catch(console.error);
