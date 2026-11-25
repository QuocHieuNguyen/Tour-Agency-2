import { useSyncExternalStore } from "react";

/**
 * Kho dữ liệu dạng danh sách lưu sessionStorage (dùng cho thư viện Itinerary / Hotel).
 * Sau này thay bằng bảng Supabase mà giữ nguyên API.
 */
export function createCollection<T extends { id: string }>(key: string, seed: () => T[]) {
  let cache: T[] | null = null;
  const listeners = new Set<() => void>();

  const getAll = (): T[] => {
    if (cache) return cache;
    try {
      const raw = sessionStorage.getItem(key);
      cache = raw ? (JSON.parse(raw) as T[]) : seed();
    } catch {
      cache = seed();
    }
    return cache;
  };
  const commit = (next: T[]) => {
    cache = next;
    try { sessionStorage.setItem(key, JSON.stringify(next)); } catch { /* storage bị chặn */ }
    listeners.forEach((l) => l());
  };
  const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };

  return {
    getAll,
    subscribe,
    /** có id trùng → cập nhật; chưa có → thêm vào đầu danh sách */
    upsert(item: T) {
      const all = getAll();
      commit(all.some((x) => x.id === item.id) ? all.map((x) => (x.id === item.id ? item : x)) : [item, ...all]);
    },
    remove(id: string) { commit(getAll().filter((x) => x.id !== id)); },
    useAll: () => useSyncExternalStore(subscribe, getAll),
  };
}
