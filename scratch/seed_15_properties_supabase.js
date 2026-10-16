const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhhc3R5Z2Zvc2d5eHJ4enJ6cnVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2NTA4ODEsImV4cCI6MjEwNjIyNjg4MX0.EVdnsyzWPuDJPJ_-ttg8DrA2Nl14Z04saG9Xj-rPjvg";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhhc3R5Z2Zvc2d5eHJ4enJ6cnVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDY1MDg4MSwiZXhwIjoyMTA2MjI2ODgxfQ.r6Zc60Fu_gDVlUSLrMKCT8XPwEkKG8ltYuccQwJfbNw";
const baseUrl = "https://hastygfosgyxrxzrzrur.supabase.co/rest/v1/properties";

const orgId = "a1b2c3d4-e5f6-7890-abcd-111111111111";

const propertiesToSeed = [
  // 5 Residential
  {
    org_id: orgId,
    keyword: "hartland",
    title: "Sobha Hartland Residences",
    location: "MBR City, Dubai",
    property_type: "residential",
    starting_price: "AED 1,500,000 (~$408,000 USD)",
    availability_status: "available",
    description: "Sobha Hartland is an 8M sq. ft. luxury waterfront community in MBR City, Dubai featuring ready to move-in & off-plan residences with canal views.",
    url: "https://stageproperties.com/videos/sobha-hartland.mp4"
  },
  {
    org_id: orgId,
    keyword: "eden",
    title: "Eden Hills Villas",
    location: "Dubai Hills Estate, Dubai",
    property_type: "residential",
    starting_price: "AED 8,500,000 (~$2,314,000 USD)",
    availability_status: "available",
    description: "Exclusive master-planned villa community in Dubai Hills Estate featuring 5 & 6 bedroom ultra-luxury residences surrounded by lush green landscapes.",
    url: "https://stageproperties.com/videos/eden-hills.mp4"
  },
  {
    org_id: orgId,
    keyword: "valia",
    title: "Valia Residences",
    location: "Dubai Marina, Dubai",
    property_type: "residential",
    starting_price: "AED 2,100,000 (~$571,000 USD)",
    availability_status: "available",
    description: "Modern high-rise residential apartments in Dubai Marina offering direct harbor views, private balconies, and resort amenities.",
    url: "https://stageproperties.com/videos/valia-residences.mp4"
  },
  {
    org_id: orgId,
    keyword: "liv",
    title: "LIV Marina Luxury Apartments",
    location: "Dubai Marina, Dubai",
    property_type: "residential",
    starting_price: "AED 1,850,000 (~$503,000 USD)",
    availability_status: "available",
    description: "Waterfront living in the heart of Dubai Marina with floor-to-ceiling windows, Infinity pool, and luxury European finishes.",
    url: "https://stageproperties.com/videos/liv-marina.mp4"
  },
  {
    org_id: orgId,
    keyword: "zaabeel",
    title: "Eden House Za'abeel",
    location: "Za'abeel, Dubai",
    property_type: "residential",
    starting_price: "AED 4,200,000 (~$1,143,000 USD)",
    availability_status: "available",
    description: "Bespoke architectural masterpiece by H&H Development offering signature concierge services, private gardens, and skyline views.",
    url: "https://stageproperties.com/videos/eden-house.mp4"
  },

  // 5 Commercial
  {
    org_id: orgId,
    keyword: "sapphire",
    title: "Sobha Sapphire Commercial Tower",
    location: "Business Bay, Dubai",
    property_type: "commercial",
    starting_price: "AED 1,200,000 (~$326,000 USD)",
    availability_status: "available",
    description: "Prime Grade-A commercial office space in Business Bay with high-speed elevators, 24/7 security, and Dubai Canal views.",
    url: "https://stageproperties.com/videos/sobha-sapphire.mp4"
  },
  {
    org_id: orgId,
    keyword: "tides",
    title: "Seven Tides Commercial Plaza",
    location: "Jumeirah Lakes Towers (JLT), Dubai",
    property_type: "commercial",
    starting_price: "AED 2,500,000 (~$680,000 USD)",
    availability_status: "available",
    description: "Multi-use commercial retail and corporate headquarter office spaces in Jumeirah Lakes Towers (JLT).",
    url: "https://stageproperties.com/videos/seven-tides.mp4"
  },
  {
    org_id: orgId,
    keyword: "opus",
    title: "The Opus Commercial Suites",
    location: "Business Bay, Dubai",
    property_type: "commercial",
    starting_price: "AED 3,800,000 (~$1,034,000 USD)",
    availability_status: "available",
    description: "Iconic Zaha Hadid designed commercial hub in Business Bay featuring luxury executive offices and retail units.",
    url: "https://stageproperties.com/videos/the-opus.mp4"
  },
  {
    org_id: orgId,
    keyword: "downtown_comm",
    title: "Downtown Commercial Plaza",
    location: "Downtown Dubai, Dubai",
    property_type: "commercial",
    starting_price: "AED 5,000,000 (~$1,361,000 USD)",
    availability_status: "available",
    description: "High footfall retail storefronts and corporate spaces directly overlooking Burj Khalifa and Dubai Mall promenade.",
    url: "https://stageproperties.com/videos/downtown-commercial.mp4"
  },
  {
    org_id: orgId,
    keyword: "baysquare",
    title: "Bay Square Executive Offices",
    location: "Business Bay, Dubai",
    property_type: "commercial",
    starting_price: "AED 1,750,000 (~$476,000 USD)",
    availability_status: "available",
    description: "Pedestrian-only mixed-use commercial community with low-rise office buildings, restaurants, and retail spaces in Business Bay.",
    url: "https://stageproperties.com/videos/bay-square.mp4"
  },

  // 5 Off-Plan
  {
    org_id: orgId,
    keyword: "360riverside",
    title: "360 Riverside Crescent",
    location: "Sobha Hartland 2, Dubai",
    property_type: "offplan",
    starting_price: "AED 1,450,000 (~$394,000 USD)",
    availability_status: "available",
    description: "Off-plan luxury lagoon waterfront tower with crystal lagoons, beach access, and 80/20 payment plans. Handover Q4 2027.",
    url: "https://stageproperties.com/videos/360-riverside.mp4"
  },
  {
    org_id: orgId,
    keyword: "vitalia",
    title: "Vitalia Palm Jumeirah Residences",
    location: "Palm Jumeirah, Dubai",
    property_type: "offplan",
    starting_price: "AED 6,900,000 (~$1,878,000 USD)",
    availability_status: "available",
    description: "Boutique waterfront off-plan development on Palm Jumeirah offering private beach access, private pools, and Italian architecture.",
    url: "https://stageproperties.com/videos/vitalia-palm.mp4"
  },
  {
    org_id: orgId,
    keyword: "340riverside",
    title: "340 Riverside Crescent",
    location: "Sobha Hartland 2, Dubai",
    property_type: "offplan",
    starting_price: "AED 1,380,000 (~$375,000 USD)",
    availability_status: "available",
    description: "Premium off-plan 1-3 bedroom apartments overlooking Dubai skyline and wildlife sanctuary in Sobha Hartland 2.",
    url: "https://stageproperties.com/videos/340-riverside.mp4"
  },
  {
    org_id: orgId,
    keyword: "mageye",
    title: "MAG EYE Off-Plan Residences",
    location: "Meydan District 7, Dubai",
    property_type: "offplan",
    starting_price: "AED 980,000 (~$266,000 USD)",
    availability_status: "available",
    description: "Gated off-plan residential community in Meydan District 7 featuring modern townhouses and contemporary apartments.",
    url: "https://stageproperties.com/videos/mag-eye.mp4"
  },
  {
    org_id: orgId,
    keyword: "mercedes",
    title: "Binghatti Mercedes-Benz Places",
    location: "Downtown Dubai, Dubai",
    property_type: "offplan",
    starting_price: "AED 8,800,000 (~$2,395,000 USD)",
    availability_status: "available",
    description: "Iconic 65-storey ultra-luxury branded skyscraper in Downtown Dubai integrated with smart home tech and private infinity pools.",
    url: "https://stageproperties.com/videos/mercedes-benz-places.mp4"
  }
];

async function seedProperties() {
    console.log(`Seeding ${propertiesToSeed.length} Stage Properties into Supabase database...`);

    for (const prop of propertiesToSeed) {
        const res = await fetch(baseUrl, {
            method: "POST",
            headers: {
                "apikey": supabaseServiceKey,
                "Authorization": `Bearer ${supabaseServiceKey}`,
                "Content-Type": "application/json",
                "Prefer": "resolution=merge-duplicates"
            },
            body: JSON.stringify(prop)
        });

        console.log(`Property '${prop.keyword}' (${prop.title}): HTTP ${res.status}`);
    }

    console.log("Seeding completed!");
}

seedProperties().catch(console.error);
