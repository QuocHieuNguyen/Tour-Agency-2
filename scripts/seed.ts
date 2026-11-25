/**
 * Nạp dữ liệu mẫu vào Supabase bằng SECRET key. CHẠY TRÊN MÁY BẠN: `npm run seed`
 * - Secret key bỏ qua RLS → tuyệt đối không đưa vào code frontend, không đặt tên biến bắt đầu bằng VITE_.
 * - Chỉ thêm dòng chưa có (không ghi đè dữ liệu bạn đã sửa), nên chạy lại nhiều lần vẫn an toàn.
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { SEED_LEADS } from "../src/data/seed";
import { HOTEL_LIBRARY, ITINERARY_LIBRARY } from "../src/data/library";
import { seedPackages } from "../src/data/seedPackages";

config({ path: ".env.local" });
config();

const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) {
  console.error("Thiếu VITE_SUPABASE_URL hoặc SUPABASE_SECRET_KEY trong .env.local");
  process.exit(1);
}

const sb = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });

async function insertMissing(table: string, rows: Record<string, unknown>[]) {
  const { error } = await sb.from(table).upsert(rows, { onConflict: "id", ignoreDuplicates: true });
  if (error) throw new Error(`${table}: ${error.message}`);
  console.log(`✓ ${table}: đã kiểm tra ${rows.length} dòng mẫu`);
}

async function main() {
  await insertMissing("leads", SEED_LEADS.map((l) => ({ id: l.id, code: l.code, data: l, created_at: l.createdAt, updated_at: l.updatedAt })));
  await insertMissing("tour_packages", seedPackages().map((p) => ({ id: p.id, lead_id: p.leadId, code: p.code, data: p, created_at: p.createdAt, updated_at: p.updatedAt })));
  await insertMissing("itineraries", ITINERARY_LIBRARY.map((t) => ({ id: t.id, data: t })));
  await insertMissing("hotels", HOTEL_LIBRARY.map((h) => ({ id: h.id, data: h })));

  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (email && password) {
    const { error } = await sb.auth.admin.createUser({ email, password, email_confirm: true });
    if (error && !/already|registered|exists/i.test(error.message)) throw new Error(`auth: ${error.message}`);
    console.log(error ? `• user ${email} đã tồn tại` : `✓ đã tạo user ${email}`);
  }
}

main().catch((e) => { console.error("Seed thất bại:", e.message ?? e); process.exit(1); });
