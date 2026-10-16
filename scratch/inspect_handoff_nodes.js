const fs = require("fs");
const wf = JSON.parse(fs.readFileSync("scratch/full_wf.json", "utf8"));

const targetNodes = [
    "Is Lead Fully Qualified?",
    "Supabase REST API (Check Repeat User)",
    "Is Repeat User?",
    "Supabase REST API (Insert Lead)",
    "Notify New Agent Ador on WhatsApp",
    "Send Agent Handoff Confirmation DM",
    "Notify Existing Agent on WhatsApp (Repeat User)"
];

for (const name of targetNodes) {
    const node = wf.nodes.find(n => n.name === name);
    console.log(`\n=================== NODE: ${name} ===================`);
    console.log(JSON.stringify(node, null, 2));
}

console.log("\n=================== CONNECTIONS AROUND HANDOFF ===================");
for (const [src, conns] of Object.entries(wf.connections)) {
    if (targetNodes.includes(src) || src === "Send Instagram Direct Message") {
        console.log(`${src} ->`, JSON.stringify(conns, null, 2));
    }
}
