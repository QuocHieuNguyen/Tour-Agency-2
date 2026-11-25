import type { Lead, LeadInput } from "../types";
import { SEED_LEADS } from "../data/seed";
import { isSupabaseMode, supabase } from "./supabase";

/**
 * Lớp truy cập dữ liệu lead. UI chỉ gọi interface này.
 * - Không cấu hình Supabase → SessionLeadRepository (sessionStorage)
 * - Có VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY → SupabaseLeadRepository (bảng `leads`)
 */
export interface LeadRepository {
  list(): Promise<Lead[]>;
  get(id: string): Promise<Lead | null>;
  create(input: LeadInput): Promise<Lead>;
  update(id: string, patch: Partial<Lead>): Promise<Lead>;
  subscribe?(onChange: () => void): () => void; // realtime (chỉ Supabase)
}

const nextCodeFrom = (codes: string[]) => `ITE-TA-${Math.max(0, ...codes.map((c) => Number(c.split("-").pop()) || 0)) + 1}`;
const requireSource = (input: LeadInput) => { if (!input.source.trim()) throw new Error("Source là bắt buộc"); };

/* ---------- Session ---------- */
const KEY = "tms.leads.v1";

function read(): Lead[] {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Lead[];
  } catch { /* bỏ qua, dùng seed */ }
  try { sessionStorage.setItem(KEY, JSON.stringify(SEED_LEADS)); } catch { /* ignore */ }
  return SEED_LEADS;
}
function write(leads: Lead[]) {
  try { sessionStorage.setItem(KEY, JSON.stringify(leads)); } catch { /* storage đầy/bị chặn */ }
}

class SessionLeadRepository implements LeadRepository {
  async list() { return [...read()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)); }
  async get(id: string) { return read().find((l) => l.id === id) ?? null; }
  async create(input: LeadInput) {
    requireSource(input);
    const leads = read();
    const now = new Date().toISOString();
    const lead: Lead = { ...input, id: crypto.randomUUID(), code: nextCodeFrom(leads.map((l) => l.code)), createdAt: now, updatedAt: now };
    write([lead, ...leads]);
    return lead;
  }
  async update(id: string, patch: Partial<Lead>) {
    const leads = read();
    const i = leads.findIndex((l) => l.id === id);
    if (i < 0) throw new Error(`Lead ${id} không tồn tại`);
    const next = { ...leads[i], ...patch, id, updatedAt: new Date().toISOString() };
    leads[i] = next;
    write(leads);
    return next;
  }
}

/* ---------- Supabase ---------- */
class SupabaseLeadRepository implements LeadRepository {
  private sb = supabase!;

  async list() {
    const { data, error } = await this.sb.from("leads").select("data").order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r) => r.data as Lead);
  }
  async get(id: string) {
    const { data, error } = await this.sb.from("leads").select("data").eq("id", id).maybeSingle();
    if (error) throw error;
    return (data?.data as Lead | undefined) ?? null;
  }
  async create(input: LeadInput) {
    requireSource(input);
    // mã ITE-TA-N = lớn nhất + 1; nếu 2 người tạo cùng lúc bị trùng (unique) thì thử lại
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data: rows, error: e1 } = await this.sb.from("leads").select("code");
      if (e1) throw e1;
      const now = new Date().toISOString();
      const lead: Lead = { ...input, id: crypto.randomUUID(), code: nextCodeFrom((rows ?? []).map((r) => r.code as string)), createdAt: now, updatedAt: now };
      const { error } = await this.sb.from("leads").insert({ id: lead.id, code: lead.code, data: lead, created_at: now, updated_at: now });
      if (!error) return lead;
      if (error.code !== "23505") throw error;
    }
    throw new Error("Không sinh được mã lead, vui lòng thử lại");
  }
  async update(id: string, patch: Partial<Lead>) {
    const current = await this.get(id);
    if (!current) throw new Error(`Lead ${id} không tồn tại`);
    const next: Lead = { ...current, ...patch, id, updatedAt: new Date().toISOString() };
    const { error } = await this.sb.from("leads").update({ data: next, updated_at: next.updatedAt }).eq("id", id);
    if (error) throw error;
    return next;
  }
  subscribe(onChange: () => void) {
    const channel = this.sb.channel(`rt-leads-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => onChange())
      .subscribe();
    return () => { void this.sb.removeChannel(channel); };
  }
}

export const leadRepo: LeadRepository = isSupabaseMode ? new SupabaseLeadRepository() : new SessionLeadRepository();
