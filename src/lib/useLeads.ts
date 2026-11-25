import { useCallback, useEffect, useState } from "react";
import type { Lead } from "../types";
import { leadRepo } from "./leadRepository";

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setLeads(await leadRepo.list());
    setLoading(false);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

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
