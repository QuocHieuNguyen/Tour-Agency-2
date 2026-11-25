import { useMemo, useSyncExternalStore } from "react";
import type { TourPackage } from "../types";
import { seedPackages } from "../data/seedPackages";
import { createCollection } from "./collection";
import { makePersistence } from "./persistence";
import { newPackage, nextPackageCode, normalizePackage, type LeadBrief } from "./packageLogic";

/** Store tour package. API đồng bộ cho UI; dữ liệu nằm ở session hoặc bảng `tour_packages` (Supabase). */
const col = createCollection(
  makePersistence<TourPackage>({
    table: "tour_packages", key: "tms.packages.v1", seed: seedPackages, newItem: "end",
    orderBy: { column: "created_at", ascending: true },
    extra: (p) => ({ lead_id: p.leadId, code: p.code }),
    normalize: normalizePackage,
  }),
);

export const packageStore = {
  getAll: col.getAll,
  subscribe: col.subscribe,
  init: col.init,
  reset: col.reset,
  create(lead: LeadBrief): TourPackage {
    const pkg = newPackage(lead, nextPackageCode(lead.code, col.getAll().filter((p) => p.leadId === lead.id)));
    col.upsert(pkg);
    return pkg;
  },
  update(pkg: TourPackage): TourPackage {
    const saved = { ...pkg, updatedAt: new Date().toISOString() };
    col.upsert(saved);
    return saved;
  },
  remove: col.remove,
};

/** leadId = undefined → tất cả package; leadId = "" → không có package nào (lead chưa lưu) */
export function usePackages(leadId?: string) {
  const all = useSyncExternalStore(packageStore.subscribe, packageStore.getAll);
  return useMemo(() => (leadId === undefined ? all : all.filter((p) => p.leadId === leadId)), [all, leadId]);
}
