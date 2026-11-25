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

/* ---------- Tour package ---------- */
export type DayTourType = "Private Transfer" | "Private Tour (PVT)" | "Group Tour (SIC)";
export type PackageTourType = "GROUP TOUR (SIC)" | "PRIVATE TOUR (PVT)";
export type PackageStatus = "Unverified" | "Verified" | "Revised";

/** 1 ngày trong lịch trình (phần 1: Itineraries) */
export interface ItineraryDay {
  id: string;
  title: string;
  tourType: DayTourType;
  overnight: string; // "" = ngày cuối / departure
  meals: string; // "L", "D", "B L D"...
  inclusions: string[];
  adultPrice: number; // USD / người lớn
}

export interface RoomLine { id: string; name: string; price: number; qty: number; note: string }

/** 1 đêm nghỉ (phần 2: Accommodations) */
export interface NightStay {
  id: string;
  hotelId: string;
  hotelName: string;
  stars: number;
  address: string;
  destination: string;
  rooms: RoomLine[];
}

export interface TourPackage {
  id: string;
  leadId: string;
  code: string; // ITE-TA-471/2
  title: string;
  subtitle: string; // "Hanoi - Da Nang"
  coverImage: string; // data URL (JPEG) hoặc ""
  tourType: PackageTourType;
  status: PackageStatus;
  validDate: string; // YYYY-MM-DD
  note: string;
  guestName: string;
  nationality: string;
  contact: string;
  numGuests: number;
  travelDate: string; // ngày bắt đầu
  days: ItineraryDay[];
  nights: NightStay[]; // luôn = days.length - 1 (xem syncNights)
  markupPct: number; // phần 3: Get Price
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
