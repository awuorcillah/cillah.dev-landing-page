const rawOutput1 = `Give me a moment as I connect you to your dedicated advisor...

CONNECT_ADVISOR_START
{
  "full_name": "Cheryl Atulah",
  "phone_number": "+254794357912",
  "property_interest": "Sobha Hartland / Hartland Waterfront Estates",
  "intent": "RENT"
}
CONNECT_ADVISOR_END`;

const rawOutput2 = `Give me a moment as I connect you to your dedicated advisor...

CONNECT_ADVISOR_START
{
  "full_name": "Cheryl Atulah",
  "phone_number": "+254794357912",
  "property_interest": "",
  "intent": "RENT"
}
CONNECT_ADVISOR_END`;

function parse(rawOutput) {
  let leadData = null;
  const match = rawOutput.match(/CONNECT_ADVISOR_START\s*([\s\S]*?)\s*CONNECT_ADVISOR_END/i) ||
                rawOutput.match(/(\{[\s\S]*?"(?:full_name|property_interest|phone_number)"[\s\S]*?\})/i);

  if (match && match[1]) {
    try {
      leadData = JSON.parse(match[1].trim());
    } catch (e) {}
  }

  let phone = (leadData?.phone_number || '').trim();
  let fullName = (leadData?.full_name || '').trim();
  let intent = (leadData?.intent || '').toUpperCase().trim();
  let property = (leadData?.property_interest || '').trim();

  if (/^\+?\d+$/.test(property.replace(/\s+/g, ''))) {
    property = '';
  }

  const notes = property ? `Inquiry for ${property} - ${intent}` : `Inquiry - ${intent}`;
  return { fullName, phone, property, intent, notes };
}

console.log('Case 1 (Hartland + RENT):', parse(rawOutput1));
console.log('Case 2 (No property + RENT):', parse(rawOutput2));
