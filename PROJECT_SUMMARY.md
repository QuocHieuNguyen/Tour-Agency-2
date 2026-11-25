# PROJECT_SUMMARY – TMS CRM (Indochina Travel Expert)

> Gửi file này cho Claude ở đầu mỗi phiên làm việc mới để khôi phục ngữ cảnh.
> Cuối mỗi phiên, yêu cầu Claude cập nhật mục **6. Tiến độ** và **7. Quyết định**.

## 1. Mục tiêu
Hệ thống quản lý du lịch kiểu TMS ("The Smart Way to Run Your Travel Business"): quản lý lead, báo giá tour, booking… Build từng module một. Giao diện bám theo ảnh chụp TMS gốc của người dùng (sidebar trái, header xanh navy, form edit dạng popup).

## 2. Tech stack
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4 (`@tailwindcss/vite`, cấu hình trong `src/index.css` bằng `@theme`), Lucide Icons, Motion (`motion/react`), Recharts.
- **Backend (chưa build):** Node.js, Express (`server.ts` / Serverless API), Google Drive API v3, WooCommerce REST API.
- **Database & Auth (chưa nối):** Supabase (PostgreSQL, Auth, RLS, Realtime, Storage) **hoặc** 1 file backup duy nhất trên Google Drive.
- **Hiện tại:** chưa có DB → dùng **session data** (`sessionStorage`, key `tms.leads.v1`). Đóng tab là mất dữ liệu, dữ liệu mẫu được seed lại.

## 3. Cấu trúc thư mục
```
src/
  main.tsx, App.tsx          # App: Sidebar + Header + LeadsPage + LeadEditModal
  index.css                  # Tailwind v4, theme màu, class .field/.label
  types.ts                   # Lead, Reminder, FOLLOW_LEVELS, LeadInput
  data/
    seed.ts                  # 2 lead mẫu (ITE-TA-471, ITE-TA-470)
    options.ts               # Dropdown: source, campaign, staff, real demand, verify…
  lib/
    leadRepository.ts        # Interface LeadRepository + SessionLeadRepository  ← điểm thay DB
    useLeads.ts              # Hook: leads, loading, refresh, save
    format.ts                # fmtDate (dd/mm/yyyy), fmtDateTime, daysFromToday, elapsed
  components/
    Sidebar.tsx              # Menu trái (chỉ "Leads management" bật)
    Header.tsx               # Thanh xanh navy
    LeadsPage.tsx            # Tab thời gian, Stats Summary (Recharts), pill follow level, tìm kiếm, bảng lead
    LeadEditModal.tsx        # Popup Edit Lead (click 1 dòng để mở)
```

## 4. Mô hình dữ liệu (`Lead`)
- Customer: `customer`, `phone`, `email`
- Trip: `paxs`, `travelDate` (YYYY-MM-DD), `duration`, `destinations`
- Source: `code` (tự sinh ITE-TA-N, read-only), `source` (bắt buộc), `campaign`
- Request: `details`, `note`, `attachments` (hiện chỉ lưu tên file)
- Follow-up: `followLevel` = Request | Quote | Revise | Deal giá | Booked | Close; `status`, `cskhRealDemand`, `saleRealDemand`, `leadVerifyStatus`
- Assignments: `sales`, `customerCare`
- `reminders[]` {id, text, done, createdAt}; flags: `postpone`, `called`, `fullyCustomizedPrices`
- Meta: `tourPackages` (số), `createdBy`, `createdAt`, `updatedAt`

## 5. Quy ước
- UI **không** gọi storage trực tiếp; chỉ qua `leadRepo` (`src/lib/leadRepository.ts`). Chuyển sang Supabase = viết `SupabaseLeadRepository` cùng interface rồi đổi 1 dòng export.
- Ngày hiển thị `dd/mm/yyyy`; lưu ISO.
- Nhãn UI giữ nguyên tiếng Anh/Việt như TMS gốc (Customer, Trip, Source, Request, Follow-up, Assignments, Reminders, Flags, Activity).
- Chạy: `npm install` → `npm run dev`.

## 6. Tiến độ
- [x] Trang Leads management: tab thời gian, thống kê Recharts, lọc follow level, tìm kiếm, bảng lead
- [x] Popup Edit Lead (tab Information): Customer, Trip, Source, Request (+ attachments), Follow-up, Assignments, Reminders, Flags, Activity; Save / Refresh / Close, cảnh báo thay đổi chưa lưu, phím Esc
- [ ] Tab Tour Packages / Invoices / Vouchers / Follow Logs (đang là placeholder)
- [ ] Tạo lead mới (repo đã có `create()`, chưa có nút)
- [ ] Khối "Working" (hoạt động 7 ngày/2 tuần/1 tháng/3 tháng) và nút Filter nâng cao
- [ ] Supabase: schema bảng `leads`, Auth, RLS, Realtime
- [ ] Backend Express + Google Drive (backup) + WooCommerce
- [ ] Các module khác trong sidebar (Booking, Tour Packages, Itinerary…)

## 7. Quyết định / ghi chú
- Chưa có DB nên dùng sessionStorage; seed 2 lead từ ảnh chụp.
- Attachments chưa upload thật (chưa có Storage).
- Ảnh gốc: danh sách lead (cột Lead code, Details, Phone/Email, Travel date, Tour packages, Follow level/Status) và popup Edit Lead (cột trái: Customer/Trip/Source/Request; cột phải: Follow-up/Assignments/Reminders/Flags/Activity).

## 8. Bước tiếp theo đề xuất
1. Nút "New Lead" + validate Source bắt buộc.
2. Schema Supabase cho `leads` và `SupabaseLeadRepository`.
3. Tab Tour Packages (liên quan dự án báo giá tour: Itineraries → Accommodations → Get Prices).
