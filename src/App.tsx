import { useEffect, useState } from "react";
import { AnimatePresence } from "motion/react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import LeadsPage from "./components/LeadsPage";
import LeadEditModal from "./components/LeadEditModal";
import ItineraryManagement from "./components/ItineraryManagement";
import AccommodationManagement from "./components/AccommodationManagement";
import LoginPage from "./components/LoginPage";
import Toasts from "./components/Toasts";
import { useLeads } from "./lib/useLeads";
import { signOut, useAuth } from "./lib/auth";
import { initStores, resetStores } from "./lib/stores";
import { errMsg, notify } from "./lib/notify";
import { isSupabaseMode, supabaseConfigError } from "./lib/supabase";
import { newLeadDraft } from "./data/emptyLead";
import type { Lead } from "./types";

type Page = "leads" | "itinerary" | "accommodation";

export default function App() {
  const auth = useAuth();
  const userId = auth.session?.user.id;
  const [ready, setReady] = useState(!isSupabaseMode);

  // Đăng nhập xong mới tải dữ liệu (RLS yêu cầu đã đăng nhập); đăng xuất thì xoá cache
  useEffect(() => {
    if (!isSupabaseMode) { void initStores(); return; }
    if (!userId) { resetStores(); setReady(false); return; }
    let cancelled = false;
    setReady(false);
    initStores()
      .catch((e) => notify(`Không tải được dữ liệu: ${errMsg(e)}`))
      .finally(() => { if (!cancelled) setReady(true); });
    return () => { cancelled = true; };
  }, [userId]);

  let body;
  if (supabaseConfigError) body = <ConfigError message={supabaseConfigError} />;
  else if (isSupabaseMode && auth.loading) body = <Splash text="Đang kiểm tra đăng nhập…" />;
  else if (isSupabaseMode && !auth.session) body = <LoginPage />;
  else if (!ready) body = <Splash text="Đang tải dữ liệu…" />;
  else body = <Main key={userId ?? "local"} email={auth.session?.user.email} />;

  return <>{body}<Toasts /></>;
}

function Main({ email }: { email?: string }) {
  const { leads, loading, refresh, save, create } = useLeads();
  const [page, setPage] = useState<Page>("leads");
  const [editing, setEditing] = useState<Lead | null>(null);

  // chưa có id = lead mới
  const handleSave = (lead: Lead) => (lead.id ? save(lead) : create(lead));

  return (
    <div className="flex h-full">
      <Sidebar active={page} onNavigate={(id) => setPage(id as Page)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header userEmail={email} onSignOut={() => void signOut()} />
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

const Splash = ({ text }: { text: string }) => <div className="grid h-full place-items-center text-gray-500">{text}</div>;

function ConfigError({ message }: { message: string }) {
  return (
    <div className="grid h-full place-items-center p-6">
      <div role="alert" className="max-w-xl rounded-lg border border-red-300 bg-red-50 p-5 text-red-800">
        <h2 className="mb-2 text-base font-bold">Cấu hình Supabase không an toàn</h2>
        <p>{message}</p>
      </div>
    </div>
  );
}
