import { useState } from "react";
import { AnimatePresence } from "motion/react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import LeadsPage from "./components/LeadsPage";
import LeadEditModal from "./components/LeadEditModal";
import ItineraryManagement from "./components/ItineraryManagement";
import AccommodationManagement from "./components/AccommodationManagement";
import { useLeads } from "./lib/useLeads";
import { newLeadDraft } from "./data/emptyLead";
import type { Lead } from "./types";

type Page = "leads" | "itinerary" | "accommodation";

export default function App() {
  const { leads, loading, refresh, save, create } = useLeads();
  const [page, setPage] = useState<Page>("leads");
  const [editing, setEditing] = useState<Lead | null>(null);

  // chưa có id = lead mới
  const handleSave = (lead: Lead) => (lead.id ? save(lead) : create(lead));

  return (
    <div className="flex h-full">
      <Sidebar active={page} onNavigate={(id) => setPage(id as Page)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="min-h-0 flex-1">
          {page === "leads" && (
            <LeadsPage leads={leads} loading={loading} onRefresh={refresh} onOpen={setEditing} onNew={() => setEditing(newLeadDraft())} />
          )}
          {page === "itinerary" && <ItineraryManagement />}
          {page === "accommodation" && <AccommodationManagement />}
        </main>
      </div>
      <AnimatePresence>
        {editing && (
          <LeadEditModal key={editing.id || "new"} lead={editing} onSave={handleSave} onClose={() => setEditing(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
