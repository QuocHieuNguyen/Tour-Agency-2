# PROJECT_SUMMARY – TMS CRM (Indochina Travel Expert)

> Gửi file này cho Claude ở đầu mỗi phiên làm việc mới để khôi phục ngữ cảnh.
> Cuối mỗi phiên, yêu cầu Claude cập nhật mục **6. Tiến độ** và **7. Quyết định**.

## 1. Mục tiêu
Hệ thống quản lý du lịch kiểu TMS ("The Smart Way to Run Your Travel Business"): quản lý lead, báo giá tour (B2B rate quoting), booking… Build từng module một. Giao diện bám theo ảnh chụp TMS gốc của người dùng.

## 2. Tech stack
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4 (`@tailwindcss/vite`, cấu hình trong `src/index.css` bằng `@theme`), Lucide Icons, Motion (`motion/react`), Recharts, `docx` (xuất Word).
- **Backend (chưa build):** Node.js, Express (`server.ts` / Serverless API), Google Drive API v3, WooCommerce REST API.
- **Database & Auth (chưa nối):** Supabase (PostgreSQL, Auth, RLS, Realtime, Storage) **hoặc** 1 file backup duy nhất trên Google Drive.
- **Hiện tại:** chưa có DB → dùng **session data** (`sessionStorage`): leads `tms.leads.v1`, tour packages `tms.packages.v1`. Đóng tab là mất dữ liệu; dữ liệu mẫu được seed lại.

## 3. Cấu trúc thư mục
```
src/
  main.tsx, App.tsx            # Sidebar + Header + LeadsPage + LeadEditModal
  index.css                    # Tailwind v4, theme, .field/.label, style trang "Word" (.doc-*), CSS in PDF
  types.ts                     # Lead, Reminder, TourPackage, ItineraryDay, NightStay, RoomLine
  data/
    seed.ts, emptyLead.ts      # lead mẫu / lead trống khi bấm NEW LEAD
    options.ts                 # dropdown của lead
    library.ts                 # DỮ LIỆU CÓ SẴN: ITINERARY_LIBRARY, HOTEL_LIBRARY, DESTINATIONS (giá là ví dụ)
    seedPackages.ts            # package mẫu DISCOVERY DA NANG cho lead ITE-TA-471
  lib/
    leadRepository.ts          # interface LeadRepository + SessionLeadRepository  ← điểm thay DB (leads)
    packageStore.ts            # store tour package + hook usePackages(leadId?)     ← điểm thay DB (packages)
    packageLogic.ts            # syncNights, autoRooms, computePrices, ngày tháng, newPackage, mã ITE-TA-xxx/n
    exportDocx.ts              # xuất .docx thật (thư viện docx, import động)
    image.ts                   # thu nhỏ ảnh bìa -> JPEG data URL
    useLeads.ts, format.ts
  components/
    Sidebar, Header, LeadsPage # danh sách lead (có NEW LEAD, đếm tour package theo lead)
    LeadEditModal              # popup lead; tab Tour Packages dùng TourPackagesTab
    TourPackagesTab            # danh sách package của 1 lead: tạo / mở / xoá
    TourPackageEditor          # màn hình toàn trang (portal): trang Word + thanh dưới + drawer + export
    PackageDocument            # "trang Word" A4: chỉnh sửa trực tiếp, cũng là phần được in ra PDF (#package-doc)
    PackageBuilder             # drawer 3 phần: Itineraries / Accommodations / Prices
```

## 4. Mô hình dữ liệu
**Lead:** customer/phone/email; paxs, travelDate, duration, destinations; code (ITE-TA-N, tự sinh), source (**bắt buộc**), campaign; details, note, attachments (chỉ tên file); followLevel, status, cskhRealDemand, saleRealDemand, leadVerifyStatus; sales, customerCare; reminders[], postpone/called/fullyCustomizedPrices; createdBy/At, updatedAt. (`tourPackages` trong Lead là field cũ, không còn dùng — số package lấy từ packageStore.)

**TourPackage** (nhiều package / 1 lead, `leadId`, mã `ITE-TA-471/2`): title, subtitle (tự lấy từ overnight), coverImage, tourType, status (Unverified/Verified/Revised), validDate, note, guestName/nationality/contact, numGuests, travelDate, markupPct, createdBy/At, updatedAt, và 3 phần:
1. **days: ItineraryDay[]** – title, tourType, overnight, meals, inclusions[], adultPrice (USD)
2. **nights: NightStay[]** – luôn = days-1 (hàm `syncNights`); hotel + rooms[] {name, price, qty}
3. **Get price** – tính từ 1 + 2 bằng `computePrices`: land/pax + (tiền phòng ÷ khách) + phí dịch vụ %

## 5. Quy ước
- UI không gọi storage trực tiếp; chỉ qua `leadRepo` và `packageStore`. Chuyển Supabase = thay phần ruột 2 file này.
- Ngày hiển thị `dd/mm/yyyy` (tài liệu dùng dạng "Fri, 20 Feb 2026"); lưu ISO. Tiền: USD.
- Điền phòng nhanh: khách ÷ 2 phòng + 1 extra bed nếu lẻ (5 khách = 2 phòng + 1 extra bed).
- PDF = `window.print()` + CSS `@media print` (chọn "Save as PDF"); Word = `.docx` dựng bằng thư viện `docx` (không phải chụp lại HTML nên 2 bản có thể lệch nhau nhẹ về layout).
- Chạy: `npm install` → `npm run dev`.

## 6. Tiến độ
- [x] Trang Leads management + popup Edit Lead
- [x] Tạo lead mới (NEW LEAD), bắt buộc chọn Source
- [x] Tour packages trong lead: tạo nhiều package, mở/sửa/xoá, trạng thái, ngày hết hạn
- [x] Trang Word: sửa trực tiếp tên tour, thông tin khách, tên từng ngày, ghi chú, ảnh bìa
- [x] Drawer điền nhanh: Itineraries (thêm/xoá/đổi thứ tự/đổi giá), Accommodations (chọn khách sạn, phòng tự điền, áp cho mọi đêm cùng điểm đến), Prices (phí dịch vụ %, tổng kết)
- [x] Export Word (.docx) và PDF
- [ ] Giá trẻ em (hiện chỉ tính người lớn), twin/single supplement
- [ ] Chia sẻ link package cho khách, nút Revise / lịch sử phiên bản
- [ ] Tab Invoices / Vouchers / Follow Logs
- [ ] Khối "Working" + Filter nâng cao ở danh sách lead
- [ ] Supabase (schema leads, tour_packages JSONB, Auth, RLS), upload ảnh thật vào Storage
- [ ] Backend Express + Google Drive backup + WooCommerce
- [ ] Module quản lý thư viện Itinerary / Accommodation (hiện là file `library.ts`)

## 7. Quyết định / ghi chú
- `library.ts` là dữ liệu mẫu theo ảnh TMS; giá khách sạn/dịch vụ ngoài những giá thấy trong ảnh là số ví dụ.
- Ảnh bìa lưu dạng data URL JPEG (≤1000px) trong sessionStorage; ảnh nặng có thể làm đầy storage.
- Tour package chỉ tạo được khi lead đã lưu (cần `leadId`).
- Ảnh gốc tham chiếu: danh sách lead, Edit Lead, tab Tour Packages, 3 bước Itineraries → Accommodations → Get Prices, trang tài liệu "DISCOVERY DA NANG".

## 8. Bước tiếp theo đề xuất
1. Chạy thử và chỉnh layout trang Word cho giống mẫu TMS hơn.
2. Supabase: schema + repository thật cho leads và tour_packages.
3. Giá trẻ em và chia sẻ link báo giá.
