import { HOTEL_LIBRARY, ITINERARY_LIBRARY } from "./library";
import type { TourPackage } from "../types";
import { dayFromTemplate, stayFromHotel, routeOf } from "../lib/packageLogic";

/** Tour package mẫu "DISCOVERY DA NANG" cho lead ITE-TA-471 (theo ảnh TMS) */
export function seedPackages(): TourPackage[] {
  const ids = ["it-hn-arrival", "it-ninhbinh", "it-halong", "it-hn-da-flight", "it-banahills", "it-hoian", "it-dn-departure"];
  const days = ids.map((id) => dayFromTemplate(ITINERARY_LIBRARY.find((t) => t.id === id)!));
  const champton = HOTEL_LIBRARY.find((h) => h.id === "ht-champton")!;
  const santa = HOTEL_LIBRARY.find((h) => h.id === "ht-santa")!;
  const nights = days.slice(0, -1).map((d, i) => stayFromHotel(i < 3 ? champton : santa, d.overnight, 5));
  return [{
    id: "pkg-471-2", leadId: "lead-471", code: "ITE-TA-471/2", title: "DISCOVERY DA NANG", subtitle: routeOf(days),
    coverImage: "", tourType: "GROUP TOUR (SIC)", status: "Unverified", validDate: "2026-07-02", note: "",
    guestName: "", nationality: "", contact: "", numGuests: 5, travelDate: "2026-02-20",
    days, nights, markupPct: 0, createdBy: "Andrew",
    createdAt: "2026-01-31T11:40:00+07:00", updatedAt: "2026-01-31T11:46:00+07:00",
  }];
}
