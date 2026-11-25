import type { Lead, LeadInput } from "../types";
import { SEED_LEADS } from "../data/seed";

/**
 * Lớp truy cập dữ liệu. UI chỉ gọi interface này.
 * Hiện tại: SessionLeadRepository (sessionStorage).
 * Sau này: viết SupabaseLeadRepository cùng interface rồi đổi dòng `export const leadRepo`.
 */
export interface LeadRepository {
  list(): Promise<Lead[]>;
  get(id: string): Promise<Lead | null>;
  create(input: LeadInput): Promise<Lead>;
  update(id: string, patch: Partial<Lead>): Promise<Lead>;
}

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
  async list() {
    return [...read()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  async get(id: string) {
    return read().find((l) => l.id === id) ?? null;
  }
  async create(input: LeadInput) {
    if (!input.source.trim()) throw new Error("Source là bắt buộc");
    const leads = read();
    const max = Math.max(0, ...leads.map((l) => Number(l.code.split("-").pop()) || 0));
    const now = new Date().toISOString();
    const lead: Lead = { ...input, id: crypto.randomUUID(), code: `ITE-TA-${max + 1}`, createdAt: now, updatedAt: now };
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

export const leadRepo: LeadRepository = new SessionLeadRepository();
