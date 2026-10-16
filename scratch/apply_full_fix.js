const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NzgwZDE3YS1kZjRlLTRkNzQtYjIwOS0zNGU1OTdkYmIwMDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6ImE0MmI4NjEyLWUwNGItNDQ3ZS05Zjg1LWZhYzRmM2U3Zjc3ZSIsImlhdCI6MTc5MTUyODQ2Nn0.aJCsbL_6HZgKI64q2SqwItxYonQ5PimUl8hpEWnZQKg";
const workflowId = "qW9A17dDWIbyVisQ";

async function applyFix() {
    console.log("Applying comprehensive fix to workflow qW9A17dDWIbyVisQ...");

    const operations = [
        // 1. Update Is Incoming Customer Message?
        {
            type: "updateNodeParameters",
            nodeName: "Is Incoming Customer Message?",
            parameters: {
                conditions: {
                    options: { caseSensitive: false, typeValidation: "loose", version: 1 },
                    conditions: [
                        {
                            leftValue: "={{ $json.body?.entry?.[0]?.changes?.[0]?.value?.from?.username || '' }}",
                            operator: { type: "string", operation: "notEquals" },
                            rightValue: "cillah.dev"
                        },
                        {
                            leftValue: "={{ $json.body?.entry?.[0]?.changes?.[0]?.value?.text || '' }}",
                            operator: { type: "string", operation: "notContains" },
                            rightValue: "Check your DMs"
                        },
                        {
                            leftValue: "={{ $json.body?.entry?.[0]?.messaging?.[0]?.message?.is_echo || false }}",
                            operator: { type: "boolean", operation: "false" }
                        },
                        {
                            leftValue: "={{ $json.body?.entry?.[0]?.messaging?.[0]?.sender?.id || '' }}",
                            operator: { type: "string", operation: "notEquals" },
                            rightValue: "17841416012634072"
                        }
                    ],
                    combinator: "and"
                }
            }
        },

        // 2. Update Is Customer Top-Level Comment?
        {
            type: "updateNodeParameters",
            nodeName: "Is Customer Top-Level Comment?",
            parameters: {
                conditions: {
                    options: { caseSensitive: true, typeValidation: "loose", version: 1 },
                    conditions: [
                        {
                            leftValue: "={{ $json.body?.entry?.[0]?.changes?.[0]?.field || '' }}",
                            operator: { type: "string", operation: "equals" },
                            rightValue: "comments"
                        },
                        {
                            leftValue: "={{ $json.body?.entry?.[0]?.changes?.[0]?.value?.from?.username || '' }}",
                            operator: { type: "string", operation: "notEquals" },
                            rightValue: "cillah.dev"
                        },
                        {
                            leftValue: "={{ $json.body?.entry?.[0]?.changes?.[0]?.value?.parent_id }}",
                            operator: { type: "string", operation: "empty", singleValue: true }
                        },
                        {
                            leftValue: "={{ $json.body?.entry?.[0]?.changes?.[0]?.value?.id }}",
                            operator: { type: "string", operation: "exists", singleValue: true }
                        }
                    ],
                    combinator: "and"
                }
            }
        },

        // 3. Update AI Agent prompt text
        {
            type: "updateNodeParameters",
            nodeName: "real estate instagram dm",
            parameters: {
                promptType: "define",
                text: "={{ $json.body?.entry?.[0]?.messaging?.[0]?.message?.text || $json.body?.entry?.[0]?.changes?.[0]?.value?.text || $json.chatInput || '' }}",
                options: {
                    systemMessage: "You are the official AI Property Advisor for Stage Properties Brokers L.L.C in Dubai, UAE.\n\nYour Goal:\nHelp prospects discover luxury real estate (Residential, Commercial, Off-Plan, Sobha Hartland, Valia, Eden Hills) and qualify serious buyers/renters.\n\nStep-by-Step Conversation Flow:\n\n1. PROPERTY RETRIEVAL & FIRST RESPONSE:\n   - When a user mentions a property name (e.g. Hartland, Valia, Eden, Vitalia, Sapphire, Opus), use the \"search_stage_properties\" tool to query details from the database.\n   - Summarize the property details briefly (location, starting price, type).\n   - Immediately follow up: \"Are you looking to BUY or RENT?\"\n\n2. INTENT CHECK:\n   - Once they specify BUY or RENT, ask: \"Would you like to be connected to one of our property advisors to explore more options on buying/renting in Dubai?\"\n\n3. INFORMATION COLLECTION:\n   - If they want to connect, ask step-by-step:\n     a) \"What is your full name?\"\n     b) \"What is the best phone number (with country code) to reach you on?\"\n\n4. EXIT & HANDOFF:\n   - Once Full Name and Phone Number are provided, output:\n     \"Give me a moment as I connect you to your dedicated advisor... Is there anything else I can assist you with today?\"\n     Also output JSON: { \"lead_name\": \"<Full Name>\", \"lead_phone\": \"<Phone Number>\", \"intent\": \"<BUY/RENT>\", \"property_interest\": \"<Property Name>\" }\n\n5. REPEAT USERS:\n   - Greet returning users warmly: \"Welcome back! How can I assist you with your property search today?\""
                }
            }
        },

        // 4. Update Window Buffer Memory sessionKey
        {
            type: "updateNodeParameters",
            nodeName: "Window Buffer Memory",
            parameters: {
                sessionIdType: "customKey",
                sessionKey: "={{ $json.body?.entry?.[0]?.messaging?.[0]?.sender?.id || $json.body?.entry?.[0]?.changes?.[0]?.value?.from?.id || 'default_session' }}",
                contextWindowLength: 10
            }
        },

        // 5. Update Send Instagram Direct Message recipient
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
                jsonBody: "={\n  \"recipient\": \"{{ $json.body?.entry?.[0]?.messaging?.[0]?.sender?.id ? { id: $json.body.entry[0].messaging[0].sender.id } : ($json.body?.entry?.[0]?.changes?.[0]?.value?.id ? { comment_id: $json.body.entry[0].changes[0].value.id } : { id: ($json.body?.entry?.[0]?.changes?.[0]?.value?.from?.id || 'me') }) }}\",\n  \"message\": {\n    \"text\": \"{{ $json.output }}\"\n  }\n}",
                options: {}
            }
        },

        // 6. Update Send Agent Handoff Confirmation DM recipient
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
                jsonBody: "={\n  \"recipient\": \"{{ $('Instagram DM / Webhook Listener').item.json.body?.entry?.[0]?.messaging?.[0]?.sender?.id ? { id: $('Instagram DM / Webhook Listener').item.json.body.entry[0].messaging[0].sender.id } : ($('Instagram DM / Webhook Listener').item.json.body?.entry?.[0]?.changes?.[0]?.value?.id ? { comment_id: $('Instagram DM / Webhook Listener').item.json.body.entry[0].changes[0].value.id } : { id: ($('Instagram DM / Webhook Listener').item.json.body?.entry?.[0]?.changes?.[0]?.value?.from?.id || 'me') }) }}\",\n  \"message\": {\n    \"text\": \"{{ $json.assigned_agent_name || $json[0]?.assigned_agent_name || 'Ador' }} will contact you shortly to discuss more on {{ ($json.intent || $json[0]?.intent) == 'BUY' ? 'buying' : 'renting' }} your {{ $json.property_interest || $json[0]?.property_interest || 'property interest' }}.\"\n  }\n}",
                options: {}
            }
        },

        // 7. Update Supabase REST API (Check Repeat User) URL
        {
            type: "updateNodeParameters",
            nodeName: "Supabase REST API (Check Repeat User)",
            parameters: {
                url: "=https://hastygfosgyxrxzrzrur.supabase.co/rest/v1/stage_leads?ig_user_id=eq.{{ $json.body?.entry?.[0]?.messaging?.[0]?.sender?.id || $json.body?.entry?.[0]?.changes?.[0]?.value?.from?.id || '' }}",
                sendHeaders: true,
                specifyHeaders: "json",
                jsonHeaders: "={\n  \"apikey\": \"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhhc3R5Z2Zvc2d5eHJ4enJ6cnVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2NTA4ODEsImV4cCI6MjEwNjIyNjg4MX0.EVdnsyzWPuDJPJ_-ttg8DrA2Nl14Z04saG9Xj-rPjvg\",\n  \"Authorization\": \"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhhc3R5Z2Zvc2d5eHJ4enJ6cnVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2NTA4ODEsImV4cCI6MjEwNjIyNjg4MX0.EVdnsyzWPuDJPJ_-ttg8DrA2Nl14Z04saG9Xj-rPjvg\"\n}",
                options: {}
            }
        },

        // 8. Update Supabase REST API (Insert Lead) body
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
                jsonBody: "={\n  \"full_name\": \"{{ $json.lead_name }}\",\n  \"phone_number\": \"{{ $json.lead_phone }}\",\n  \"intent\": \"{{ $json.intent }}\",\n  \"property_interest\": \"{{ $json.property_interest }}\",\n  \"assigned_agent_name\": \"Ador\",\n  \"status\": \"new_inquiry\",\n  \"ig_user_id\": \"{{ $('Instagram DM / Webhook Listener').item.json.body?.entry?.[0]?.messaging?.[0]?.sender?.id || $('Instagram DM / Webhook Listener').item.json.body?.entry?.[0]?.changes?.[0]?.value?.from?.id || '' }}\"\n}",
                options: {}
            }
        },

        // 9. Update Notify Existing Agent on WhatsApp (Repeat User) body
        {
            type: "updateNodeParameters",
            nodeName: "Notify Existing Agent on WhatsApp (Repeat User)",
            parameters: {
                method: "POST",
                url: "https://cillah.dev/api/whatsapp/send-notification",
                sendBody: true,
                specifyBody: "json",
                jsonBody: "={\n  \"to\": \"0794357912\",\n  \"message\": \"🔄 REPEAT INQUIRY ALERT - STAGE PROPERTIES\\n\\nSales Agent: Ador\\nStatus: Moved to 'Repeat Inquiries' Pipeline Stage\\nUser ID: {{ $('Instagram DM / Webhook Listener').item.json.body?.entry?.[0]?.messaging?.[0]?.sender?.id || $('Instagram DM / Webhook Listener').item.json.body?.entry?.[0]?.changes?.[0]?.value?.from?.id }}\\nNote: Customer returned with a repeat property inquiry. Logged in CRM pipeline.\"\n}",
                options: {}
            }
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
                    versionName: "Fix DM vs Public Comment Routing & Prevent Loop v8.0",
                    operations
                }
            }
        })
    });

    const textOutput = await res.text();
    console.log("Update Workflow Result:", textOutput);
}

applyFix().catch(console.error);
