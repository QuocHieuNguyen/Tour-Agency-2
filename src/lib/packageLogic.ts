import type { HotelTemplate, ItineraryTemplate } from "../data/library";
import { cloneTerms } from "../data/terms";
import type { AccOption, ItineraryDay, NightStay, RoomLine, TourPackage } from "../types";

const uid = () => crypto.randomUUID();

export function dayFromTemplate(t: ItineraryTemplate): ItineraryDay {
  return { ...t, id: uid(), inclusions: [...t.inclusions] };
}

/** Quy tắc điền phòng nhanh: 5 khách = 2 phòng + 1 extra bed */
export function autoRooms(adults: number) {
  const rooms = Math.max(1, Math.floor(adults / 2));
  const extra = adults >= 2 ? adults % 2 : 0;
  return { rooms, extra };
}

const isExtra = (name: string) => /extra/i.test(name);
/** "EXTRA BED" tính theo giường, còn lại tính theo phòng */
export const unitOf = (roomName: string) => (/bed/i.test(roomName) ? "Bed(s)" : "Room(s)");

export function stayFromHotel(h: HotelTemplate, destination: string, adults: number, id = uid()): NightStay {
  const { rooms, extra } = autoRooms(adults);
  const main = h.rooms.find((r) => !isExtra(r.name));
  const lines: RoomLine[] = h.rooms
    .map((r) => ({ id: uid(), name: r.name, price: r.price, qty: isExtra(r.name) ? extra : r === main ? rooms : 0, note: "" }))
    .filter((r) => r.qty > 0);
  return { id, hotelId: h.id, hotelName: h.name, stars: h.stars, address: h.address, destination, rooms: lines };
}

export const emptyStay = (destination: string): NightStay => ({
  id: uid(), hotelId: "", hotelName: "", stars: 0, address: "", destination, rooms: [],
});

/** Số đêm = số ngày - 1; giữ khách sạn đã chọn theo thứ tự đêm */
export function syncNights(days: ItineraryDay[], nights: NightStay[]): NightStay[] {
  return Array.from({ length: Math.max(0, days.length - 1) }, (_, i) => {
    const dest = days[i].overnight;
    const prev = nights[i];
    return prev ? { ...prev, destination: dest || prev.destination } : emptyStay(dest);
  });
}

export const syncOptions = (days: ItineraryDay[], options: AccOption[]): AccOption[] =>
  options.map((o) => ({ ...o, nights: syncNights(days, o.nights) }));

export const newOption = (label: string, stars: number, days: ItineraryDay[] = []): AccOption => ({
  id: uid(), label, stars, nights: syncNights(days, []),
});

export function routeOf(days: ItineraryDay[]) {
  const seen: string[] = [];
  days.forEach((d) => d.overnight && !seen.includes(d.overnight) && seen.push(d.overnight));
  return seen.join(" - ");
}

export const durationOf = (days: number) => (days > 0 ? `${days}D${Math.max(0, days - 1)}N` : "");

/** "L" → "Lunch", "B L D" → "Breakfast, Lunch, Dinner" */
export function mealsText(meals: string) {
  const map: Record<string, string> = { B: "Breakfast", L: "Lunch", D: "Dinner" };
  return meals.toUpperCase().replace(/[^BLD]/g, "").split("").map((c) => map[c]).join(", ");
}

/* ---------- ngày tháng ---------- */
const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function addDays(iso: string, n: number): Date | null {
  if (!iso) return null;
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d;
}
export const dateShort = (d: Date | null) => (d ? `${WD[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]}` : "");
export const dateLong = (d: Date | null) => (d ? `${WD[d.getDay()]}, ${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}` : "");

/* ---------- giá ---------- */
export const usd = (n: number) => `${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;

export const isOptionComplete = (o: AccOption) => o.nights.every((n) => n.hotelId);

/** Giá của 1 phương án khách sạn (opt). Không truyền opt → chỉ tính land tour. */
export function computePrices(pkg: TourPackage, opt?: AccOption) {
  const adults = Math.max(0, pkg.numGuests);
  const landPerPax = pkg.days.reduce((s, d) => s + (Number(d.adultPrice) || 0), 0);
  const accTotal = opt ? opt.nights.reduce((s, n) => s + n.rooms.reduce((a, r) => a + (Number(r.price) || 0) * (Number(r.qty) || 0), 0), 0) : 0;
  const accPerPax = adults > 0 ? accTotal / adults : 0;
  const subtotal = landPerPax + accPerPax;
  const markup = (subtotal * (Number(pkg.markupPct) || 0)) / 100;
  const totalPerPax = subtotal + markup;
  const vat = (totalPerPax * (Number(pkg.vatPct) || 0)) / 100;
  return { adults, landPerPax, accTotal, accPerPax, subtotal, markup, totalPerPax, vat, groupTotal: totalPerPax * adults };
}

/** Gộp các đêm liên tiếp cùng khách sạn + cùng phòng thành 1 dòng ("HANOI (3 Nights) …") */
export interface StayGroup { destination: string; nights: number; hotelName: string; stars: number; address: string; rooms: RoomLine[] }
export function groupStays(opt: AccOption): StayGroup[] {
  const groups: (StayGroup & { key: string })[] = [];
  for (const n of opt.nights) {
    if (!n.hotelId) continue;
    const key = `${n.hotelId}|${n.destination}|${n.rooms.map((r) => `${r.name}:${r.qty}`).join(",")}`;
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.nights += 1;
    else groups.push({ key, destination: n.destination, nights: 1, hotelName: n.hotelName, stars: n.stars, address: n.address, rooms: n.rooms });
  }
  return groups;
}

/* ---------- tạo mới / chuẩn hoá ---------- */
export interface LeadBrief { id: string; code: string; customer: string; phone: string; email: string; paxs: number; travelDate: string; sales: string }

export function nextPackageCode(leadCode: string, existing: TourPackage[]) {
  const max = Math.max(0, ...existing.map((p) => Number(p.code.split("/")[1]) || 0));
  return `${leadCode}/${max + 1}`;
}

export function newPackage(lead: LeadBrief, code: string): TourPackage {
  const now = new Date().toISOString();
  return {
    id: uid(), leadId: lead.id, code, title: "NEW TOUR PACKAGE", subtitle: "", coverImage: "",
    tourType: "GROUP TOUR (SIC)", status: "Unverified",
    validDate: new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10), note: "",
    guestName: lead.customer, nationality: "", contact: lead.phone || lead.email,
    numGuests: lead.paxs || 1, numChildren: 0, travelDate: lead.travelDate, days: [],
    options: [newOption("STANDARD (3★)", 3), newOption("DELUXE (4★)", 4)],
    markupPct: 0, vatPct: 0, terms: cloneTerms(),
    createdBy: lead.sales || "Andrew", createdAt: now, updatedAt: now,
  };
}

/** Đưa dữ liệu cũ (bản trước chỉ có `nights`, chưa có terms/options…) về cấu trúc hiện tại */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizePackage(raw: Record<string, any>): TourPackage {
  const { nights: legacyNights, ...rest } = raw;
  const days: ItineraryDay[] = (raw.days ?? []).map((d: Partial<ItineraryDay>) => ({ pickup: "", ends: "", description: "", suggestion: "", ...d }));
  let options: AccOption[] = raw.options;
  if (!Array.isArray(options)) {
    const stays: NightStay[] = legacyNights ?? [];
    const stars = Math.max(0, ...stays.map((n) => n.stars)) || 4;
    options = [{ id: uid(), label: stars <= 3 ? "STANDARD (3★)" : "DELUXE (4★)", stars, nights: stays }];
  }
  return { numChildren: 0, vatPct: 0, markupPct: 0, ...rest, days, options, terms: { ...cloneTerms(), ...(raw.terms ?? {}) } } as TourPackage;
}
