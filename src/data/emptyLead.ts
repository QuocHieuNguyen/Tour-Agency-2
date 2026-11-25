import type { Lead } from "../types";

export function newLeadDraft(createdBy = "Andrew"): Lead {
  const now = new Date().toISOString();
  return {
    id: "", code: "",
    customer: "", phone: "", email: "",
    paxs: 1, travelDate: "", duration: "", destinations: "",
    source: "", campaign: "", details: "", note: "", attachments: [],
    followLevel: "Request", status: "",
    cskhRealDemand: "", saleRealDemand: "", leadVerifyStatus: "",
    sales: createdBy, customerCare: "",
    reminders: [], postpone: false, called: false, fullyCustomizedPrices: false,
    tourPackages: 0, createdBy, createdAt: now, updatedAt: now,
  };
}
