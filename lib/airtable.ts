export interface ConsultationRecord {
  id: string;
  name: string;
  email: string;
  company: string;
  paymentStatus: 'Pending Payment' | 'Paid';
  phone?: string;
  mpesaReceipt?: string;
  appointmentDate?: string;
  createdAt: string;
}

// In-memory cache for development fallback (survives hot reloads)
const globalCache = globalThis as unknown as {
  consultationsCache: Map<string, ConsultationRecord>;
};

if (!globalCache.consultationsCache) {
  globalCache.consultationsCache = new Map();
}

const getCache = () => globalCache.consultationsCache;

// Resolves Airtable credentials, handling the salescrm prefix from Vercel
function getAirtableConfig() {
  const token = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || process.env.salescrmAIRTABLE_PERSONAL_ACCESS_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID || process.env.salescrmAIRTABLE_BASE_ID;
  const tableName = process.env.AIRTABLE_TABLE_NAME || process.env.salescrmAIRTABLE_TABLE_NAME || "Leads";
  
  console.log(`[Airtable Config Resolved] BaseID: ${baseId ? "Found" : "Missing"}, TableName: ${tableName}, TokenLength: ${token ? token.length : 0}`);
  
  return { token, baseId, tableName };
}

export async function createConsultationRecord(data: {
  name: string;
  email: string;
  company: string;
}): Promise<string> {
  const { token, baseId, tableName } = getAirtableConfig();

  const fields = {
    "A. Lead Name": data.name,
    "Email": data.email,
    "A. Company": data.company,
    "A. Payment Status": "Pending Payment",
    "A. Platform": "website",
  };

  if (token && baseId) {
    try {
      const response = await fetch(`https://api.airtable.com/v0/${baseId}/${tableName}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          records: [{ fields }]
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Airtable API Error:", errText);
        throw new Error(`Airtable error: ${response.statusText}`);
      }

      const resData = await response.json();
      return resData.records[0].id;
    } catch (e) {
      console.warn("Airtable insertion failed, falling back to local memory storage:", e);
    }
  }

  // Fallback to local memory cache
  const recordId = "rec" + Math.random().toString(36).substring(2, 11);
  getCache().set(recordId, {
    id: recordId,
    name: data.name,
    email: data.email,
    company: data.company,
    paymentStatus: "Pending Payment",
    createdAt: new Date().toISOString(),
  });
  console.log(`[Dev Cache] Created record: ${recordId}`, getCache().get(recordId));
  return recordId;
}

export async function getConsultationRecord(recordId: string): Promise<ConsultationRecord | null> {
  const { token, baseId, tableName } = getAirtableConfig();

  if (token && baseId) {
    try {
      const response = await fetch(`https://api.airtable.com/v0/${baseId}/${tableName}/${recordId}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errText = await response.text();
        if (response.status !== 404) {
          throw new Error(`Airtable API error (${response.status}): ${errText}`);
        }
      } else {
        const resData = await response.json();
        const f = resData.fields;
        return {
          id: resData.id,
          name: f["A. Lead Name"] || f["Lead Name"] || "",
          email: f.Email || "",
          company: f["A. Company"] || f.Company || "",
          paymentStatus: f["A. Payment Status"] || f["Payment Status"] || "Pending Payment",
          phone: f.Phone || "",
          mpesaReceipt: f["A. Mpesa Receipt Number"] || f["Mpesa Receipt Number"] || "",
          appointmentDate: f["A. Appointment Date"] || f["Appointment Date"] || "",
          createdAt: resData.createdTime,
        };
      }
    } catch (e: any) {
      if (e.message?.includes("Airtable API error")) throw e;
      console.warn("Airtable read failed, checking local memory storage:", e);
    }
  }

  const localRec = getCache().get(recordId);
  return localRec || null;
}

export async function updateConsultationRecord(
  recordId: string,
  updates: Partial<{
    paymentStatus: 'Pending Payment' | 'Paid';
    phone: string;
    mpesaReceipt: string;
    appointmentDate: string;
  }>
): Promise<boolean> {
  const { token, baseId, tableName } = getAirtableConfig();

  // Map updates to Airtable field names
  const fields: Record<string, any> = {};
  if (updates.paymentStatus !== undefined) fields["A. Payment Status"] = updates.paymentStatus;
  if (updates.phone !== undefined) fields["Phone"] = updates.phone;
  if (updates.mpesaReceipt !== undefined) fields["A. Mpesa Receipt Number"] = updates.mpesaReceipt;
  if (updates.appointmentDate !== undefined) fields["A. Appointment Date"] = updates.appointmentDate;

  if (token && baseId) {
    try {
      const response = await fetch(`https://api.airtable.com/v0/${baseId}/${tableName}/${recordId}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fields }),
      });

      if (response.ok) {
        return true;
      }
      const errText = await response.text();
      console.error("Airtable update failed:", errText);
    } catch (e) {
      console.warn("Airtable update failed, falling back to local memory storage:", e);
    }
  }

  // Fallback update
  const localRec = getCache().get(recordId);
  if (localRec) {
    const updated = {
      ...localRec,
      paymentStatus: updates.paymentStatus ?? localRec.paymentStatus,
      phone: updates.phone ?? localRec.phone,
      mpesaReceipt: updates.mpesaReceipt ?? localRec.mpesaReceipt,
      appointmentDate: updates.appointmentDate ?? localRec.appointmentDate,
    };
    getCache().set(recordId, updated);
    console.log(`[Dev Cache] Updated record: ${recordId}`, updated);
    return true;
  }

  return false;
}

export async function findConsultationRecordByEmail(email: string): Promise<ConsultationRecord | null> {
  const { token, baseId, tableName } = getAirtableConfig();

  if (token && baseId) {
    try {
      const encodedFormula = encodeURIComponent(`{Email}='${email.trim()}'`);
      const response = await fetch(
        `https://api.airtable.com/v0/${baseId}/${tableName}?filterByFormula=${encodedFormula}`,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Airtable API error (${response.status}): ${errText}`);
      } else {
        const resData = await response.json();
        if (resData.records && resData.records.length > 0) {
          // Sort by newest created time to get the absolute latest registration record
          const sorted = resData.records.sort(
            (a: any, b: any) => new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime()
          );
          const newestRecord = sorted[0];
          const f = newestRecord.fields;
          
          return {
            id: newestRecord.id,
            name: f["A. Lead Name"] || f["Lead Name"] || "",
            email: f.Email || "",
            company: f["A. Company"] || f.Company || "",
            paymentStatus: f["A. Payment Status"] || f["Payment Status"] || "Pending Payment",
            phone: f.Phone || "",
            mpesaReceipt: f["A. Mpesa Receipt Number"] || f["Mpesa Receipt Number"] || "",
            appointmentDate: f["A. Appointment Date"] || f["Appointment Date"] || "",
            createdAt: newestRecord.createdTime,
          };
        }
      }
    } catch (e: any) {
      if (e.message?.includes("Airtable API error")) throw e;
      console.warn("Airtable search by email failed:", e);
    }
  }

  // Fallback to searching in memory cache
  for (const [id, rec] of getCache().entries()) {
    if (rec.email.toLowerCase() === email.toLowerCase()) {
      return rec;
    }
  }
  
  return null;
}
