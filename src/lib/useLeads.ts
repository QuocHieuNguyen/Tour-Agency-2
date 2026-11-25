import { useCallback, useEffect, useState } from "react";
import type { Lead } from "../types";
import { leadRepo } from "./leadRepository";
import { errMsg, notify } from "./notify";

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try { setLeads(await leadRepo.list()); }
    catch (e) { notify(`Không tải được danh sách lead: ${errMsg(e)}`); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  // realtime: người khác sửa lead → danh sách tự cập nhật (chỉ chế độ Supabase)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const off = leadRepo.subscribe?.(() => { clearTimeout(timer); timer = setTimeout(() => void refresh(), 300); });
    return () => { clearTimeout(timer); off?.(); };
  }, [refresh]);

  const save = useCallback(async (lead: Lead) => {
    const saved = await leadRepo.update(lead.id, lead);
    setLeads((prev) => [saved, ...prev.filter((l) => l.id !== saved.id)]);
    return saved;
  }, []);

  const create = useCallback(async (lead: Lead) => {
    const created = await leadRepo.create(lead);
    setLeads((prev) => [created, ...prev]);
    return created;
  }, []);

  return { leads, loading, refresh, save, create };
}
