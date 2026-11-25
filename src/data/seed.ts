import type { Lead } from "../types";

const base = {
  customer: "", phone: "", email: "", duration: "", destinations: "", source: "", campaign: "",
  attachments: [], followLevel: "Request" as const, status: "",
  cskhRealDemand: "Không có nhu cầu thật", saleRealDemand: "", leadVerifyStatus: "",
  sales: "Andrew", customerCare: "", reminders: [], postpone: false, called: false,
  fullyCustomizedPrices: false, tourPackages: 1, createdBy: "Andrew", note: "",
};

export const SEED_LEADS: Lead[] = [
  {
    ...base,
    id: "lead-471", code: "ITE-TA-471", paxs: 5, travelDate: "2026-02-20",
    details: "5 adults\n6N 7D\n20th feb",
    createdAt: "2026-01-31T11:37:00+07:00", updatedAt: "2026-01-31T11:46:00+07:00",
  },
  {
    ...base,
    id: "lead-470", code: "ITE-TA-470", paxs: 5, travelDate: "2026-03-19",
    details: "5 adults\n6N 7D\n19th Mar",
    createdAt: "2026-01-22T10:51:00+07:00", updatedAt: "2026-01-22T10:51:00+07:00",
  },
];
