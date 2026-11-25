import { useSyncExternalStore } from "react";
import type { Persistence } from "./persistence";
import { errMsg, notify } from "./notify";

/**
 * Kho danh sách trong bộ nhớ (UI đọc đồng bộ) + ghi xuống Persistence ở nền.
 * - Cập nhật "lạc quan": UI đổi ngay; nếu ghi thất bại → báo lỗi và tải lại từ nguồn thật.
 * - init() tải dữ liệu (gọi sau khi đăng nhập), reset() xoá cache khi đăng xuất.
 */
export function createCollection<T extends { id: string }>(p: Persistence<T>) {
  const fresh = () => (p.loadSync ? p.loadSync() : []);
  let cache: T[] = fresh();
  const listeners = new Set<() => void>();
  let initPromise: Promise<void> | null = null;
  let unsubscribe: (() => void) | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const set = (next: T[]) => { cache = next; listeners.forEach((l) => l()); };
  const reload = async () => {
    try { set(await p.load()); } catch (e) { notify(`Không tải được dữ liệu: ${errMsg(e)}`); }
  };
  const guard = (task: Promise<void>) => task.catch((e) => { notify(`Lưu thất bại: ${errMsg(e)}`); void reload(); });
  const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
  const getAll = () => cache;

  return {
    getAll,
    subscribe,
    init(): Promise<void> {
      initPromise ??= (async () => {
        await reload();
        unsubscribe = p.subscribe?.(() => { clearTimeout(timer); timer = setTimeout(() => void reload(), 300); }) ?? null;
      })();
      return initPromise;
    },
    reset() {
      unsubscribe?.(); unsubscribe = null; clearTimeout(timer); initPromise = null;
      set(fresh());
    },
    upsert(item: T) {
      const exists = cache.some((x) => x.id === item.id);
      set(exists ? cache.map((x) => (x.id === item.id ? item : x)) : p.newItem === "end" ? [...cache, item] : [item, ...cache]);
      void guard(p.upsert(item));
    },
    remove(id: string) {
      set(cache.filter((x) => x.id !== id));
      void guard(p.remove(id));
    },
    useAll: () => useSyncExternalStore(subscribe, getAll),
  };
}
