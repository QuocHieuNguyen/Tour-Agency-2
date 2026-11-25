import { useMemo, useSyncExternalStore } from "react";
import type { TourPackage } from "../types";
import { seedPackages } from "../data/seedPackages";
import { newPackage, nextPackageCode, type LeadBrief } from "./packageLogic";

/**
 * Store tour package (sessionStorage). Cùng vai trò leadRepository: sau này thay bằng Supabase
 * (bảng tour_packages, cột days/nights dạng JSONB) mà không đổi UI.
 */
const KEY = "tms.packages.v1";
let cache: TourPackage[] | null = null;
const listeners = new Set<() => void>();

function load(): TourPackage[] {
  if (cache) return cache;
  try {
    const raw = sessionStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as TourPackage[]) : seedPackages();
  } catch {
    cache = seedPackages();
  }
  return cache;
}

function commit(next: TourPackage[]) {
  cache = next;
  try { sessionStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ảnh bìa quá lớn hoặc storage bị chặn */ }
  listeners.forEach((l) => l());
}

export const packageStore = {
  getAll: load,
  subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; },
  create(lead: LeadBrief): TourPackage {
    const all = load();
    const pkg = newPackage(lead, nextPackageCode(lead.code, all.filter((p) => p.leadId === lead.id)));
    commit([...all, pkg]);
    return pkg;
  },
  update(pkg: TourPackage): TourPackage {
    const saved = { ...pkg, updatedAt: new Date().toISOString() };
    commit(load().map((p) => (p.id === pkg.id ? saved : p)));
    return saved;
  },
  remove(id: string) { commit(load().filter((p) => p.id !== id)); },
};

/** leadId = undefined → tất cả package; leadId = "" → không có package nào (lead chưa lưu) */
export function usePackages(leadId?: string) {
  const all = useSyncExternalStore(packageStore.subscribe, packageStore.getAll);
  return useMemo(() => (leadId === undefined ? all : all.filter((p) => p.leadId === leadId)), [all, leadId]);
}
