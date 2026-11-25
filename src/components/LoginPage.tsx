import { useState, type FormEvent } from "react";
import { LogIn } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) setError(error.message === "Invalid login credentials" ? "Sai email hoặc mật khẩu." : error.message);
    setBusy(false);
  };

  return (
    <div className="grid h-full place-items-center bg-panel p-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-5 text-center">
          <div className="text-2xl font-bold tracking-tight text-emerald-700">Indochina</div>
          <div className="text-[10px] font-semibold tracking-[0.25em] text-gray-600">TRAVEL EXPERT</div>
          <p className="mt-3 text-gray-500">Đăng nhập TMS</p>
        </div>
        <label className="mb-3 block"><span className="label">Email</span>
          <input type="email" required autoFocus autoComplete="username" className="field !border-gray-300" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="mb-4 block"><span className="label">Mật khẩu</span>
          <input type="password" required autoComplete="current-password" className="field !border-gray-300" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p role="alert" className="mb-3 text-[12px] font-medium text-red-600">{error}</p>}
        <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded bg-brand py-2.5 text-[12px] font-bold text-white hover:bg-brand-dark disabled:opacity-60">
          <LogIn size={15} /> {busy ? "ĐANG ĐĂNG NHẬP…" : "ĐĂNG NHẬP"}
        </button>
        <p className="mt-4 text-center text-[11px] text-gray-400">Tài khoản do quản trị viên tạo trong Supabase (Authentication → Users).</p>
      </form>
    </div>
  );
}
