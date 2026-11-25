export const FOLLOW_LEVELS = ["Request", "Quote", "Revise", "Deal giá", "Booked", "Close"] as const;
export type FollowLevel = (typeof FOLLOW_LEVELS)[number];

export interface Reminder {
  id: string;
  text: string;
  done: boolean;
  createdAt: string; // ISO
}

export interface Lead {
  id: string;
  code: string; // ITE-TA-471
  // Customer
  customer: string;
  phone: string;
  email: string;
  // Trip
  paxs: number;
  travelDate: string; // YYYY-MM-DD or ""
  duration: string;
  destinations: string;
  // Source
  source: string;
  campaign: string;
  // Request
  details: string;
  note: string;
  attachments: string[]; // chỉ lưu tên file trong session
  // Follow-up
  followLevel: FollowLevel;
  status: string;
  cskhRealDemand: string;
  saleRealDemand: string;
  leadVerifyStatus: string;
  // Assignments
  sales: string;
  customerCare: string;
  // Reminders & flags
  reminders: Reminder[];
  postpone: boolean;
  called: boolean;
  fullyCustomizedPrices: boolean;
  // Meta
  tourPackages: number;
  createdBy: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export type LeadInput = Omit<Lead, "id" | "code" | "createdAt" | "updatedAt">;
