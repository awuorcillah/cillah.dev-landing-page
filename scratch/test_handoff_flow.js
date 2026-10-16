async function testHandoff() {
    console.log("Sending qualified lead message to webhook...");

    const payload = {
        object: "instagram",
        entry: [
            {
                id: "17841416012634072",
                time: Math.floor(Date.now() / 1000),
                messaging: [
                    {
                        sender: {
                            id: "1829945294851322"
                        },
                        recipient: {
                            id: "17841416012634072"
                        },
                        timestamp: Math.floor(Date.now() / 1000),
                        message: {
                            mid: "m_test_handoff_999",
                            text: "+254794357912 Cheryl Atulah"
                        }
                    }
                ]
            }
        ]
    };

    const res = await fetch("https://n8n.cillah.dev/webhook/stage-properties-ai-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    console.log("Webhook Response Status:", res.status);
}

testHandoff().catch(console.error);
