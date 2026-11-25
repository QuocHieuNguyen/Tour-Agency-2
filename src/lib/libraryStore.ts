import { HOTEL_LIBRARY, ITINERARY_LIBRARY, type HotelTemplate, type ItineraryTemplate } from "../data/library";
import { createCollection } from "./collection";
import { makePersistence } from "./persistence";

export const itineraryStore = createCollection(
  makePersistence<ItineraryTemplate>({
    table: "itineraries", key: "tms.itineraries.v1", seed: () => ITINERARY_LIBRARY,
    newItem: "start", orderBy: { column: "created_at", ascending: false },
  }),
);

export const hotelStore = createCollection(
  makePersistence<HotelTemplate>({
    table: "hotels", key: "tms.hotels.v1", seed: () => HOTEL_LIBRARY,
    newItem: "start", orderBy: { column: "created_at", ascending: false },
  }),
);
