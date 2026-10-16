const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NzgwZDE3YS1kZjRlLTRkNzQtYjIwOS0zNGU1OTdkYmIwMDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6ImE0MmI4NjEyLWUwNGItNDQ3ZS05Zjg1LWZhYzRmM2U3Zjc3ZSIsImlhdCI6MTc5MTUyODQ2Nn0.aJCsbL_6HZgKI64q2SqwItxYonQ5PimUl8hpEWnZQKg";

async function updateInPlace() {
    console.log("Updating single workflow s2ExZm67n4lhQmt0 in place...");

    const payload = {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
            name: "update_workflow",
            arguments: {
                workflowId: "s2ExZm67n4lhQmt0",
                versionName: "Fix session key & expressions in place",
                operations: [
                    {
                        type: "updateNodeParameters",
                        nodeName: "Window Buffer Memory",
                        parameters: {
                            sessionIdType: "customKey",
                            sessionKey: "={{ $(\"Instagram DM / Webhook Listener\").item.json.body.entry[0].changes[0].value.from.id }}",
                            contextWindowLength: 10
                        }
                    },
                    {
                        type: "updateNodeParameters",
                        nodeName: "Stage Properties Luxury AI Agent",
                        parameters: {
                            promptType: "define",
                            text: "={{ $json.body?.entry?.[0]?.changes?.[0]?.value?.text || $json.chatInput }}",
                            options: {
                                systemMessage: "You are the official AI Property Advisor for Stage Properties Brokers L.L.C in Dubai, UAE.\\n\\nYour Goal:\\nHelp prospects discover luxury real estate (Residential, Commercial, Off-Plan, Sobha Hartland) and qualify serious buyers/renters.\\n\\nStep-by-Step Flow:\\n1. Politeness & Luxury Tone: Be warm, high-end, and conversational like two humans speaking.\\n2. Step-by-Step Qualification:\\n   - Step 1: Ask if they are interested in RESIDENTIAL, COMMERCIAL, or OFF-PLAN properties.\\n   - Step 2: Ask if they are looking to BUY or RENT.\\n   - Step 3: Ask for their Full Name.\\n   - Step 4: Ask for their WhatsApp Phone Number.\\n3. Agent Handoff: Once Name, Phone, Intent, and Category are gathered, assign sales agent Ador. Tell them: 'Give me a moment as I transfer you to our next available advisor... Ador will contact you shortly to discuss more on buying/renting your property interest. Is there anything else I can assist you with today?'\\n4. Wrap-up: If no: 'Thank you for contacting Stage Properties Brokers and have a beautiful day! ✨'"
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
    console.log("In-place update response:");
    console.log(text);
}

updateInPlace().catch(console.error);
