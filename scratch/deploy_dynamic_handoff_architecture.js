const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NzgwZDE3YS1kZjRlLTRkNzQtYjIwOS0zNGU1OTdkYmIwMDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6ImE0MmI4NjEyLWUwNGItNDQ3ZS05Zjg1LWZhYzRmM2U3Zjc3ZSIsImlhdCI6MTc5MTUyODQ2Nn0.aJCsbL_6HZgKI64q2SqwItxYonQ5PimUl8hpEWnZQKg";
const workflowId = "qW9A17dDWIbyVisQ";

async function deployDynamicHandoff() {
    console.log("Configuring Dynamic Agent Round-Robin & Single Handoff Message in n8n...");

    const insertLeadJsonBody = `={{
  (() => {
    const activeAgent = $('Fetch Active Sales Agent').item.json?.[0] || $('Fetch Active Sales Agent').item.json || {};
    const leadData = $('Parse Qualified Lead Data').item.json || {};
    const listenerBody = $('Instagram DM / Webhook Listener').item.json?.body;
    const igUserId = listenerBody?.entry?.[0]?.messaging?.[0]?.sender?.id || listenerBody?.entry?.[0]?.changes?.[0]?.value?.from?.id || '';

    return JSON.stringify({
      full_name: leadData.lead_name || "Valued Lead",
      phone_number: leadData.lead_phone || "N/A",
      intent: leadData.intent || "BUY",
      property_interest: leadData.property_interest || "Sobha Hartland",
      assigned_agent_name: activeAgent.full_name || "Ador",
      assigned_agent_id: activeAgent.id || null,
      status: "new_enquiry",
      ig_user_id: igUserId
    });
  })()
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

    const activeAgent = $('Fetch Active Sales Agent').item.json?.[0] || $('Fetch Active Sales Agent').item.json || {};
    const leadData = $('Parse Qualified Lead Data').item.json || {};
    const agentName = $json.assigned_agent_name || activeAgent.full_name || 'Ador';
    const intentStr = (leadData.intent || $json.intent) == 'RENT' ? 'renting' : 'buying';
    const propStr = leadData.property_interest || $json.property_interest || 'property interest';

    return JSON.stringify({
      recipient,
      message: {
        text: agentName + " will contact you shortly to discuss more on " + intentStr + " your " + propStr + " property."
      }
    });
  })()
}}`;

    const operations = [
        // 1. Add Node: Fetch Active Sales Agent (Dynamic Round-Robin)
        {
            type: "addNode",
            node: {
                name: "Fetch Active Sales Agent",
                type: "n8n-nodes-base.httpRequest",
                typeVersion: 4.3,
                position: [1120, 112],
                parameters: {
                    url: "https://hastygfosgyxrxzrzrur.supabase.co/rest/v1/staff_members?role=eq.sales&is_active=eq.true&order=last_assigned_at.asc.nullsfirst&limit=1",
                    sendHeaders: true,
                    specifyHeaders: "json",
                    jsonHeaders: "={\n  \"apikey\": \"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhhc3R5Z2Zvc2d5eHJ4enJ6cnVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2NTA4ODEsImV4cCI6MjEwNjIyNjg4MX0.EVdnsyzWPuDJPJ_-ttg8DrA2Nl14Z04saG9Xj-rPjvg\",\n  \"Authorization\": \"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhhc3R5Z2Zvc2d5eHJ4enJ6cnVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2NTA4ODEsImV4cCI6MjEwNjIyNjg4MX0.EVdnsyzWPuDJPJ_-ttg8DrA2Nl14Z04saG9Xj-rPjvg\"\n}",
                    options: {}
                }
            }
        },

        // 2. Update Supabase REST API (Insert Lead) jsonBody with dynamic agent
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

        // 3. Update Send Agent Handoff Confirmation DM jsonBody with dynamic agent
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

        // 4. Disconnect real estate instagram dm -> Send Instagram Direct Message
        {
            type: "removeConnection",
            source: "real estate instagram dm",
            target: "Send Instagram Direct Message",
            connectionType: "main",
            sourceIndex: 0,
            targetIndex: 0
        },

        // 5. Connect real estate instagram dm -> Is Lead Fully Qualified?
        {
            type: "addConnection",
            source: "real estate instagram dm",
            target: "Is Lead Fully Qualified?",
            connectionType: "main",
            sourceIndex: 0,
            targetIndex: 0
        },

        // 6. Connect Is Lead Fully Qualified? (Branch 1 FALSE - uncommitted / in chat) -> Send Instagram Direct Message
        {
            type: "addConnection",
            source: "Is Lead Fully Qualified?",
            target: "Send Instagram Direct Message",
            connectionType: "main",
            sourceIndex: 1,
            targetIndex: 0
        },

        // 7. Rewire Parse Qualified Lead Data -> Fetch Active Sales Agent
        {
            type: "removeConnection",
            source: "Parse Qualified Lead Data",
            target: "Supabase REST API (Check Repeat User)",
            connectionType: "main",
            sourceIndex: 0,
            targetIndex: 0
        },
        {
            type: "addConnection",
            source: "Parse Qualified Lead Data",
            target: "Fetch Active Sales Agent",
            connectionType: "main",
            sourceIndex: 0,
            targetIndex: 0
        },
        {
            type: "addConnection",
            source: "Fetch Active Sales Agent",
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
                    versionName: "Dynamic Agent Round Robin & Clean Single Handoff v15.0",
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

deployDynamicHandoff().catch(console.error);
