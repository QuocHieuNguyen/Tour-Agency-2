import { useState } from "react";
import { AnimatePresence } from "motion/react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import LeadsPage from "./components/LeadsPage";
import LeadEditModal from "./components/LeadEditModal";
import { useLeads } from "./lib/useLeads";
import { newLeadDraft } from "./data/emptyLead";
import type { Lead } from "./types";

export default function App() {
  const { leads, loading, refresh, save, create } = useLeads();
  const [editing, setEditing] = useState<Lead | null>(null);

  // chưa có id = lead mới
  const handleSave = (lead: Lead) => (lead.id ? save(lead) : create(lead));

  return (
    <div className="flex h-full">
      <Sidebar active="leads" />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="min-h-0 flex-1">
          <LeadsPage
            leads={leads} loading={loading} onRefresh={refresh}
            onOpen={setEditing} onNew={() => setEditing(newLeadDraft())}
          />
        </main>
      </div>
      <AnimatePresence>
        {editing && (
          <LeadEditModal
            key={editing.id || "new"}
            lead={editing}
            onSave={handleSave}
            onClose={() => setEditing(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}