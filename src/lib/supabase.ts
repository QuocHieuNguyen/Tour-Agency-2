import { createClient } from "@supabase/supabase-js";

/**
 * Frontend CHỈ dùng Publishable key (sb_publishable_...). Quyền truy cập do đăng nhập + RLS quyết định.
 * Secret key (sb_secret_...) bỏ qua RLS nên không bao giờ được nằm trong code chạy ở trình duyệt:
 * nó chỉ dùng trong scripts/seed.ts (chạy trên máy bạn) hoặc backend Express sau này.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

function looksLikeSecret(k: string) {
  if (k.startsWith("sb_secret_")) return true;
  try { // key kiểu cũ (JWT): role = service_role
    const payload = JSON.parse(atob(k.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.role === "service_role";
  } catch { return false; }
}

export const supabaseConfigError: string | null =
  key && looksLikeSecret(key)
    ? "VITE_SUPABASE_PUBLISHABLE_KEY đang chứa SECRET key. Hãy dùng Publishable key (sb_publishable_...) và xoay (rotate) secret key trong Supabase Dashboard vì nó đã bị nhúng vào code trình duyệt."
    : null;

export const supabase = url && key && !supabaseConfigError ? createClient(url, key) : null;
/** true = dùng Supabase (có đăng nhập); false = session data như trước */
export const isSupabaseMode = supabase !== null;
