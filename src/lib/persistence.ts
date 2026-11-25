import { isSupabaseMode, supabase } from "./supabase";

/** Nơi lưu dữ liệu thật: sessionStorage (chưa có DB) hoặc Supabase. UI không biết đang dùng cái nào. */
export interface Persistence<T> {
  newItem: "start" | "end"; // phần tử mới xếp đầu hay cuối danh sách
  loadSync?(): T[]; // chỉ chế độ session: có dữ liệu ngay, không cần chờ
  load(): Promise<T[]>;
  upsert(item: T): Promise<void>;
  remove(id: string): Promise<void>;
  subscribe?(onChange: () => void): () => void; // realtime
}

interface Options<T> {
  table: string; // tên bảng Supabase
  key: string; // khoá sessionStorage
  seed: () => T[]; // dữ liệu mẫu cho chế độ session
  newItem: "start" | "end";
  orderBy: { column: string; ascending: boolean };
  extra?: (item: T) => Record<string, unknown>; // cột phụ (lead_id, code…)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  normalize?: (raw: any) => T; // đưa dữ liệu cũ về cấu trúc hiện tại
}

export function makePersistence<T extends { id: string }>(o: Options<T>): Persistence<T> {
  return isSupabaseMode ? supabasePersistence(o) : sessionPersistence(o);
}

function sessionPersistence<T extends { id: string }>(o: Options<T>): Persistence<T> {
  const fix = (raw: unknown) => (o.normalize ? o.normalize(raw) : (raw as T));
  const read = (): T[] => {
    try {
      const raw = sessionStorage.getItem(o.key);
      if (raw) return (JSON.parse(raw) as unknown[]).map(fix);
    } catch { /* dùng seed */ }
    return o.seed();
  };
  const write = (items: T[]) => { try { sessionStorage.setItem(o.key, JSON.stringify(items)); } catch { /* storage đầy/bị chặn */ } };

  return {
    newItem: o.newItem,
    loadSync: read,
    load: async () => read(),
    upsert: async (item) => {
      const all = read();
      write(all.some((x) => x.id === item.id) ? all.map((x) => (x.id === item.id ? item : x)) : o.newItem === "end" ? [...all, item] : [item, ...all]);
    },
    remove: async (id) => write(read().filter((x) => x.id !== id)),
  };
}

function supabasePersistence<T extends { id: string }>(o: Options<T>): Persistence<T> {
  const sb = supabase!;
  return {
    newItem: o.newItem,
    async load() {
      const { data, error } = await sb.from(o.table).select("data").order(o.orderBy.column, { ascending: o.orderBy.ascending });
      if (error) throw error;
      return (data ?? []).map((r) => (o.normalize ? o.normalize(r.data) : (r.data as T)));
    },
    async upsert(item) {
      const { error } = await sb.from(o.table).upsert({ id: item.id, data: item, ...(o.extra?.(item) ?? {}), updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    async remove(id) {
      const { error } = await sb.from(o.table).delete().eq("id", id);
      if (error) throw error;
    },
    subscribe(onChange) {
      const channel = sb.channel(`rt-${o.table}-${Math.random().toString(36).slice(2)}`)
        .on("postgres_changes", { event: "*", schema: "public", table: o.table }, () => onChange())
        .subscribe();
      return () => { void sb.removeChannel(channel); };
    },
  };
}
