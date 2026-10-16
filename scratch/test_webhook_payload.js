async function testWebhook() {
    console.log("Sending test webhook payload to n8n listener...");

    const payload = {
        object: "instagram",
        entry: [
            {
                id: "17841416012634072",
                time: Math.floor(Date.now() / 1000),
                changes: [
                    {
                        field: "comments",
                        value: {
                            id: "test_comment_12345",
                            text: "Sobha Hartland",
                            from: {
                                id: "1829945294851322",
                                username: "test_user"
                            },
                            media: {
                                id: "17868588159643591",
                                media_product_type: "FEED"
                            }
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
    const text = await res.text();
    console.log("Webhook Response Text:", text);
}

testWebhook().catch(console.error);
