import type { ItineraryDay } from "../types";

/**
 * DỮ LIỆU MẪU ban đầu cho thư viện Itinerary / Accommodation (trang CRUD ở sidebar sửa được).
 * Giá trong ảnh TMS là thật; mô tả, giờ đón và các khách sạn "(mẫu)" chỉ là ví dụ để bạn thay.
 */
export type ItineraryTemplate = ItineraryDay;

export interface HotelTemplate {
  id: string; name: string; stars: number; address: string; destination: string;
  rooms: { name: string; price: number }[]; // phòng chính + "EXTRA BED" (nhận diện theo chữ "extra")
}

export const DESTINATIONS = ["Hanoi", "Ninh Binh", "Ha Long", "Da Nang", "Hoi An", "Hue", "Ho Chi Minh"];

const ARRIVAL =
  "Welcome to Vietnam!\nUpon arrival, you are met at the airport and transferred to the hotel by our driver. Official check-in time is 14:00 (Early check-in will be surcharged).";

const base = { pickup: "", ends: "", suggestion: "" };

export const ITINERARY_LIBRARY: ItineraryTemplate[] = [
  { ...base, id: "it-hn-arrival", title: "HANOI ARRIVAL - PRIVATE TRANSFER", tourType: "Private Transfer", overnight: "Hanoi", meals: "", inclusions: ["Private transfer (no guide)"], adultPrice: 6,
    description: `${ARRIVAL} Free on your own.`, suggestion: "Stroll around the Old Quarter, try a bowl of pho and Vietnamese egg coffee." },
  { ...base, id: "it-hn-halfday-sic", title: "HANOI ARRIVAL - HALF DAY CITY TOUR IN THE AFTERNOON - SIC", tourType: "Group Tour (SIC)", overnight: "Hanoi", meals: "", inclusions: ["Shuttle bus", "Local guide", "Entrance fees"], adultPrice: 28,
    pickup: "13:30", ends: "17:30",
    description: `${ARRIVAL}\nIn the afternoon, join the group city tour: Tran Quoc Pagoda, Temple of Literature and Hoa Lo Prison.` },
  { ...base, id: "it-hn-halfday-pvt", title: "HANOI ARRIVAL - HALF DAY CITY TOUR - PRIVATE TOUR", tourType: "Private Tour (PVT)", overnight: "Hanoi", meals: "", inclusions: ["Private car", "Local guide", "Entrance fees"], adultPrice: 45,
    pickup: "13:30", ends: "17:30",
    description: `${ARRIVAL}\nIn the afternoon, your private guide takes you to the main sights of Hanoi at a relaxed pace.` },
  { ...base, id: "it-ninhbinh", title: "HANOI - NINH BINH - HOA LU - TRANG AN - HANOI (L) - SIC (22 Pax)", tourType: "Group Tour (SIC)", overnight: "Hanoi", meals: "L", inclusions: ["Limousine shuttle bus", "Local guide", "Entrance fees", "Boat"], adultPrice: 32.5,
    pickup: "07:30", ends: "17:30",
    description: "Breakfast at the hotel.\nTransfer by limousine shuttle bus to Ninh Binh. Visit Hoa Lu, the ancient capital of Vietnam, then enjoy lunch at a local restaurant. In the afternoon take a boat trip through the caves of the Trang An Scenic Landscape Complex before returning to Hanoi." },
  { ...base, id: "it-halong", title: "HALONG BAY DAY TRIP (6 HOURS) (L) - SIC", tourType: "Group Tour (SIC)", overnight: "Hanoi", meals: "L", inclusions: ["Shuttle bus (Max 22 pax)", "Local guide", "Entrance fees", "Kayaking", "Sharing cruise"], adultPrice: 51,
    pickup: "07:30", ends: "18:30",
    description: "Breakfast at the hotel.\nTransfer to Ha Long Bay and board a sharing cruise for a 6-hour trip among the limestone islands, with lunch on board, kayaking and a cave visit. Return to Hanoi in the evening." },
  { ...base, id: "it-incense", title: "HANOI ARRIVAL - INCENSE VILLAGE", tourType: "Private Transfer", overnight: "Hanoi", meals: "", inclusions: ["Private car"], adultPrice: 30,
    description: `${ARRIVAL}\nVisit the incense-making village on the outskirts of Hanoi.` },
  { ...base, id: "it-hn-da-flight", title: "HANOI - FLIGHT TO DA NANG - PRIVATE TRANSFER", tourType: "Private Transfer", overnight: "Da Nang", meals: "", inclusions: ["Private airport transfer"], adultPrice: 10,
    description: "Breakfast at the hotel.\nOur driver (no guide) takes you to Noi Bai airport for your flight to Da Nang (flight not included). On arrival you are met and transferred to the hotel. Free on your own." },
  { ...base, id: "it-banahills", title: "DA NANG - BANA HILLS - GOLDEN BRIDGE - FANTASY PARK - DA NANG (L) - SIC (25 Pax)", tourType: "Group Tour (SIC)", overnight: "Da Nang", meals: "L", inclusions: ["Shuttle bus", "Local guide", "Entrance fees", "cable car round way."], adultPrice: 63,
    pickup: "08:00", ends: "17:00",
    description: "Breakfast at the hotel.\nTransfer by shuttle bus to Ba Na Hills. Ride the cable car up to the resort and walk across the Golden Bridge held by giant stone hands. Lunch is included, followed by free time at Fantasy Park before returning to Da Nang." },
  { ...base, id: "it-hoian", title: "DA NANG - BASKET BOAT AT COCONUT FOREST - HOI AN ANCIENT TOWN - DA NANG (D) - SIC", tourType: "Group Tour (SIC)", overnight: "Da Nang", meals: "D", inclusions: ["Shuttle bus", "Local guide", "Entrance fees", "Basket boat"], adultPrice: 33,
    pickup: "13:00", ends: "21:00",
    description: "Breakfast at the hotel.\nIn the afternoon, drive to the Bay Mau Coconut Forest for a basket boat ride, then explore Hoi An Ancient Town. Dinner is served in Hoi An before you return to Da Nang." },
  { ...base, id: "it-dn-departure", title: "DA NANG - DEPARTURE - PRIVATE TRANSFER", tourType: "Private Transfer", overnight: "", meals: "", inclusions: ["Private airport transfer"], adultPrice: 4.5,
    description: "Check out the hotel before check-out time.\n2 hours before your flight, our driver (no guide) will pick you up and drop you at the airport.\nSincerely thank you for traveling with us!" },
];

export const HOTEL_LIBRARY: HotelTemplate[] = [
  { id: "ht-champton", name: "CHAMPTON HANOI HOTEL", stars: 4, address: "130 P. Hàng Bông, Hàng Bông, Hoàn Kiếm, Hà Nội", destination: "Hanoi", rooms: [{ name: "Deluxe", price: 74.5 }, { name: "EXTRA BED", price: 29 }] },
  { id: "ht-thanglong", name: "Thang Long Opera Hotel", stars: 4, address: "1c Tong Dan Street, Hoan Kiem District, Hanoi", destination: "Hanoi", rooms: [{ name: "Deluxe", price: 54.5 }, { name: "EXTRA BED", price: 25 }] },
  { id: "ht-rey", name: "Rey Hotel Hanoi", stars: 4, address: "14 Ly Nam De, Hoan Kiem, Hanoi", destination: "Hanoi", rooms: [{ name: "Deluxe", price: 70 }, { name: "EXTRA BED", price: 27 }] },
  { id: "ht-eliana", name: "Eliana Signature Hotel & Spa", stars: 4, address: "38 Lo Su Street, Hoan Kiem district, Hanoi", destination: "Hanoi", rooms: [{ name: "Deluxe", price: 65.5 }, { name: "EXTRA BED", price: 26 }] },
  { id: "ht-santa", name: "SANTA LUXURY HOTEL", stars: 4, address: "09 Do Ba, Bac My An, Ngu Hanh Son, Da Nang", destination: "Da Nang", rooms: [{ name: "Deluxe", price: 60 }, { name: "EXTRA BED", price: 25 }] },
  { id: "ht-sample-hn3", name: "Hanoi 3★ Hotel (mẫu)", stars: 3, address: "Địa chỉ mẫu, Hoan Kiem, Hanoi", destination: "Hanoi", rooms: [{ name: "Deluxe", price: 40 }, { name: "EXTRA BED", price: 18 }] },
  { id: "ht-sample-dn3", name: "Da Nang 3★ Hotel (mẫu)", stars: 3, address: "Địa chỉ mẫu, Ngu Hanh Son, Da Nang", destination: "Da Nang", rooms: [{ name: "Deluxe", price: 35 }, { name: "EXTRA BED", price: 15 }] },
];
