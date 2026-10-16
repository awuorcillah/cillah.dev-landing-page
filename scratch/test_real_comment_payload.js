async function testRealComment() {
    console.log("Sending real comment payload to webhook...");

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
                            id: "18094292654554634",
                            text: "Hartland",
                            from: {
                                id: "1829945294851322",
                                username: "cheryl_cilla"
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

    console.log("Status:", res.status);
}

testRealComment().catch(console.error);
