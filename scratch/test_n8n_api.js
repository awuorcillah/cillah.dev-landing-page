const fs = require('fs');
const path = require('path');

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NzgwZDE3YS1kZjRlLTRkNzQtYjIwOS0zNGU1OTdkYmIwMDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6ImE0MmI4NjEyLWUwNGItNDQ3ZS05Zjg1LWZhYzRmM2U3Zjc3ZSIsImlhdCI6MTc5MTUyODQ2Nn0.aJCsbL_6HZgKI64q2SqwItxYonQ5PimUl8hpEWnZQKg";

async function testN8nConnection() {
    console.log("Testing connection to n8n API at https://n8n.cillah.dev ...");
    
    // Read the workflow JSON file
    const workflowPath = path.join(__dirname, 'stage_properties_n8n_workflow.json');
    const workflowData = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

    try {
        const response = await fetch("https://n8n.cillah.dev/api/v1/workflows", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        console.log("n8n GET Workflows status:", response.status, response.statusText);
        const data = await response.text();
        console.log("n8n Response:", data.substring(0, 300));
        
        // Now try creating the workflow via n8n REST API
        const createRes = await fetch("https://n8n.cillah.dev/api/v1/workflows", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(workflowData)
        });

        console.log("n8n CREATE Workflow status:", createRes.status, createRes.statusText);
        const createData = await createRes.text();
        console.log("n8n Create Result:", createData.substring(0, 500));

    } catch (err) {
        console.error("n8n Connection error:", err.message);
    }
}

testN8nConnection();
