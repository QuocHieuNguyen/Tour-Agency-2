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

/** 1 ngày trong lịch trình. Cũng là cấu trúc của 1 mục trong thư viện Itinerary (CRUD). */
export interface ItineraryDay {
  id: string;
  title: string;
  tourType: DayTourType;
  overnight: string; // "" = ngày cuối / departure
  meals: string; // "L", "D", "B L D"...
  inclusions: string[];
  adultPrice: number; // USD / người lớn
  pickup: string; // "07:30"
  ends: string; // "17:30"
  description: string; // mô tả chi tiết (nhiều dòng) cho phần DETAILED ITINERARY
  suggestion: string; // gợi ý tự khám phá (thường ở ngày đến)
}

export interface RoomLine { id: string; name: string; price: number; qty: number; note: string }

/** 1 đêm nghỉ */
export interface NightStay {
  id: string;
  hotelId: string;
  hotelName: string;
  stars: number;
  address: string;
  destination: string;
  rooms: RoomLine[];
}

/** 1 phương án khách sạn, vd "STANDARD (3★)" hoặc "DELUXE (4★)" → mỗi phương án có giá riêng */
export interface AccOption {
  id: string;
  label: string;
  stars: number;
  nights: NightStay[]; // luôn = days.length - 1 (xem syncNights)
}

/** Các khối điều khoản cuối tài liệu; mỗi phần tử = 1 gạch đầu dòng */
export interface Terms {
  inclusions: string[];
  exclusions: string[];
  rates: string[];
  payment: string[];
  cancelFit: string[];
  cancelGit: string[];
  cancelNote: string;
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
  numGuests: number; // người lớn
  numChildren: number; // chỉ hiển thị, chưa tính giá
  travelDate: string; // ngày bắt đầu
  days: ItineraryDay[];
  options: AccOption[];
  markupPct: number; // phí dịch vụ %
  vatPct: number; // VAT % (0 = ẩn dòng VAT)
  terms: Terms;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
