import { X } from "lucide-react";
import { dismiss, useToasts } from "../lib/notify";

export default function Toasts() {
  const toasts = useToasts();
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-[12px] text-red-800 shadow-lg">
          <p className="flex-1">{t.message}</p>
          <button onClick={() => dismiss(t.id)} aria-label="Đóng thông báo"><X size={14} /></button>
        </div>
      ))}
    </div>
  );
}
