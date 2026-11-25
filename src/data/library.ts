import type { DayTourType } from "../types";

/**
 * DỮ LIỆU MẪU để điền nhanh vào tour package (lấy theo ảnh TMS; giá chỉ là ví dụ).
 * Sau này thay bằng bảng Itinerary Management / Accommodation Management trong DB.
 */
export interface ItineraryTemplate {
  id: string; title: string; tourType: DayTourType; overnight: string;
  meals: string; inclusions: string[]; adultPrice: number;
}
export interface HotelTemplate {
  id: string; name: string; stars: number; address: string; destination: string;
  rooms: { name: string; price: number }[]; // [0] = phòng chính, [1] = extra bed
}

export const DESTINATIONS = ["Hanoi", "Ninh Binh", "Ha Long", "Da Nang", "Hoi An", "Hue", "Ho Chi Minh"];

export const ITINERARY_LIBRARY: ItineraryTemplate[] = [
  { id: "it-hn-arrival", title: "HANOI ARRIVAL - PRIVATE TRANSFER", tourType: "Private Transfer", overnight: "Hanoi", meals: "", inclusions: ["Private transfer (no guide)"], adultPrice: 6 },
  { id: "it-hn-halfday-sic", title: "HANOI ARRIVAL - HALF DAY CITY TOUR IN THE AFTERNOON - SIC", tourType: "Group Tour (SIC)", overnight: "Hanoi", meals: "", inclusions: ["Shuttle bus", "Local guide", "Entrance fees"], adultPrice: 28 },
  { id: "it-hn-halfday-pvt", title: "HANOI ARRIVAL - HALF DAY CITY TOUR - PRIVATE TOUR", tourType: "Private Tour (PVT)", overnight: "Hanoi", meals: "", inclusions: ["Private car", "Local guide", "Entrance fees"], adultPrice: 45 },
  { id: "it-ninhbinh", title: "HANOI - NINH BINH - HOA LU - TRANG AN - HANOI (L) - SIC (22 Pax)", tourType: "Group Tour (SIC)", overnight: "Hanoi", meals: "L", inclusions: ["Limousine shuttle bus", "Local guide", "Entrance fees", "Boat"], adultPrice: 32.5 },
  { id: "it-halong", title: "HALONG BAY DAY TRIP (6 HOURS) (L) - SIC", tourType: "Group Tour (SIC)", overnight: "Hanoi", meals: "L", inclusions: ["Shuttle bus (Max 22 pax)", "Local guide", "Entrance fees", "Kayaking", "Sharing cruise"], adultPrice: 51 },
  { id: "it-incense", title: "HANOI ARRIVAL - INCENSE VILLAGE", tourType: "Private Transfer", overnight: "Hanoi", meals: "", inclusions: ["Private car"], adultPrice: 30 },
  { id: "it-hn-da-flight", title: "HANOI - FLIGHT TO DA NANG - PRIVATE TRANSFER", tourType: "Private Transfer", overnight: "Da Nang", meals: "", inclusions: ["Private airport transfer"], adultPrice: 10 },
  { id: "it-banahills", title: "DA NANG - BANA HILLS - GOLDEN BRIDGE - FANTASY PARK - DA NANG (L) - SIC (25 Pax)", tourType: "Group Tour (SIC)", overnight: "Da Nang", meals: "L", inclusions: ["Shuttle bus", "Local guide", "Entrance fees", "cable car round way."], adultPrice: 63 },
  { id: "it-hoian", title: "DA NANG - BASKET BOAT AT COCONUT FOREST - HOI AN ANCIENT TOWN - DA NANG (D) - SIC", tourType: "Group Tour (SIC)", overnight: "Da Nang", meals: "D", inclusions: ["Shuttle bus", "Local guide", "Entrance fees", "Basket boat"], adultPrice: 33 },
  { id: "it-dn-departure", title: "DA NANG - DEPARTURE - PRIVATE TRANSFER", tourType: "Private Transfer", overnight: "", meals: "", inclusions: ["Private airport transfer"], adultPrice: 4.5 },
];

export const HOTEL_LIBRARY: HotelTemplate[] = [
  { id: "ht-champton", name: "CHAMPTON HANOI HOTEL", stars: 4, address: "130 P. Hàng Bông, Hàng Bông, Hoàn Kiếm, Hà Nội", destination: "Hanoi", rooms: [{ name: "Deluxe", price: 74.5 }, { name: "EXTRA BED", price: 29 }] },
  { id: "ht-thanglong", name: "Thang Long Opera Hotel", stars: 4, address: "1c Tong Dan Street, Hoan Kiem District, Hanoi", destination: "Hanoi", rooms: [{ name: "Deluxe", price: 54.5 }, { name: "EXTRA BED", price: 25 }] },
  { id: "ht-rey", name: "Rey Hotel Hanoi", stars: 4, address: "14 Ly Nam De, Hoan Kiem, Hanoi", destination: "Hanoi", rooms: [{ name: "Deluxe", price: 70 }, { name: "EXTRA BED", price: 27 }] },
  { id: "ht-eliana", name: "Eliana Signature Hotel & Spa", stars: 4, address: "38 Lo Su Street, Hoan Kiem district, Hanoi", destination: "Hanoi", rooms: [{ name: "Deluxe", price: 65.5 }, { name: "EXTRA BED", price: 26 }] },
  { id: "ht-santa", name: "SANTA LUXURY HOTEL", stars: 4, address: "09 Do Ba, Bac My An, Ngu Hanh Son, Da Nang", destination: "Da Nang", rooms: [{ name: "Deluxe", price: 60 }, { name: "EXTRA BED", price: 25 }] },
];
