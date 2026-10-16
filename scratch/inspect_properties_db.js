const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhhc3R5Z2Zvc2d5eHJ4enJ6cnVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2NTA4ODEsImV4cCI6MjEwNjIyNjg4MX0.EVdnsyzWPuDJPJ_-ttg8DrA2Nl14Z04saG9Xj-rPjvg";

async function checkPropertiesDb() {
    const res = await fetch("https://hastygfosgyxrxzrzrur.supabase.co/rest/v1/properties?select=*", {
        headers: {
            "apikey": supabaseAnonKey,
            "Authorization": `Bearer ${supabaseAnonKey}`
        }
    });

    const data = await res.json();
    console.log(`Total properties in Supabase DB: ${data.length}`);
    console.log(JSON.stringify(data, null, 2));
}

checkPropertiesDb().catch(console.error);
