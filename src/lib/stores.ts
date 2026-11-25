import { hotelStore, itineraryStore } from "./libraryStore";
import { packageStore } from "./packageStore";

/** Gọi sau khi đăng nhập (hoặc ngay khi mở app ở chế độ session) */
export const initStores = () => Promise.all([packageStore.init(), itineraryStore.init(), hotelStore.init()]).then(() => undefined);
/** Gọi khi đăng xuất: xoá dữ liệu khỏi bộ nhớ */
export function resetStores() { packageStore.reset(); itineraryStore.reset(); hotelStore.reset(); }
