import type { HotelTemplate, ItineraryTemplate } from "../data/library";
import type { ItineraryDay, NightStay, TourPackage } from "../types";

const uid = () => crypto.randomUUID();

export function dayFromTemplate(t: ItineraryTemplate): ItineraryDay {
  return { id: uid(), title: t.title, tourType: t.tourType, overnight: t.overnight, meals: t.meals, inclusions: [...t.inclusions], adultPrice: t.adultPrice };
}

/** Quy tắc điền phòng nhanh: 5 khách = 2 phòng + 1 extra bed */
export function autoRooms(adults: number) {
  const rooms = Math.max(1, Math.floor(adults / 2));
  const extra = adults >= 2 ? adults % 2 : 0;
  return { rooms, extra };
}

export function stayFromHotel(h: HotelTemplate, destination: string, adults: number, id = uid()): NightStay {
  const { rooms, extra } = autoRooms(adults);
  const lines = h.rooms
    .map((r, i) => ({ id: uid(), name: r.name, price: r.price, qty: i === 0 ? rooms : extra, note: "" }))
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

export function routeOf(days: ItineraryDay[]) {
  const seen: string[] = [];
  days.forEach((d) => d.overnight && !seen.includes(d.overnight) && seen.push(d.overnight));
  return seen.join(" - ");
}

export const durationOf = (days: number) => (days > 0 ? `${days}D${Math.max(0, days - 1)}N` : "");

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

export function computePrices(pkg: TourPackage) {
  const adults = Math.max(0, pkg.numGuests);
  const landPerPax = pkg.days.reduce((s, d) => s + (Number(d.adultPrice) || 0), 0);
  const accTotal = pkg.nights.reduce((s, n) => s + n.rooms.reduce((a, r) => a + (Number(r.price) || 0) * (Number(r.qty) || 0), 0), 0);
  const accPerPax = adults > 0 ? accTotal / adults : 0;
  const subtotal = landPerPax + accPerPax;
  const markup = (subtotal * (Number(pkg.markupPct) || 0)) / 100;
  const totalPerPax = subtotal + markup;
  return { adults, landPerPax, accTotal, accPerPax, subtotal, markup, totalPerPax, groupTotal: totalPerPax * adults };
}

/* ---------- tạo mới ---------- */
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
    numGuests: lead.paxs || 1, travelDate: lead.travelDate, days: [], nights: [], markupPct: 0,
    createdBy: lead.sales || "Andrew", createdAt: now, updatedAt: now,
  };
}
