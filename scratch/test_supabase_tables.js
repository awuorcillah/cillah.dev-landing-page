const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhhc3R5Z2Zvc2d5eHJ4enJ6cnVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2NTA4ODEsImV4cCI6MjEwNjIyNjg4MX0.EVdnsyzWPuDJPJ_-ttg8DrA2Nl14Z04saG9Xj-rPjvg";
const baseUrl = "https://hastygfosgyxrxzrzrur.supabase.co/rest/v1";

async function testTable(tableName) {
    const res = await fetch(`${baseUrl}/${tableName}?select=*&limit=1`, {
        headers: {
            "apikey": supabaseAnonKey,
            "Authorization": `Bearer ${supabaseAnonKey}`
        }
    });

    const status = res.status;
    const bodyText = await res.text();
    console.log(`Table '${tableName}': HTTP ${status} -> ${bodyText.slice(0, 150)}`);
}

async function run() {
    console.log("Testing Supabase tables...");
    await testTable("properties");
    await testTable("stage_properties");
    await testTable("search_stage_properties");
    await testTable("stage_leads");
    await testTable("leads");
}

run();
