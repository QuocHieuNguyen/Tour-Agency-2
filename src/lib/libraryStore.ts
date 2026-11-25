import { HOTEL_LIBRARY, ITINERARY_LIBRARY, type HotelTemplate, type ItineraryTemplate } from "../data/library";
import { createCollection } from "./collection";

export const itineraryStore = createCollection<ItineraryTemplate>("tms.itineraries.v1", () => ITINERARY_LIBRARY);
export const hotelStore = createCollection<HotelTemplate>("tms.hotels.v1", () => HOTEL_LIBRARY);
