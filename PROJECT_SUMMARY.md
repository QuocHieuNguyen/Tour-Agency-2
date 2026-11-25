# PROJECT_SUMMARY – TMS CRM (Indochina Travel Expert)

> Gửi file này cho Claude ở đầu mỗi phiên làm việc mới để khôi phục ngữ cảnh.
> Cuối mỗi phiên, yêu cầu Claude cập nhật mục **6. Tiến độ** và **7. Quyết định**.

## 1. Mục tiêu
Hệ thống quản lý du lịch kiểu TMS ("The Smart Way to Run Your Travel Business"): quản lý lead, báo giá tour (B2B rate quoting), booking… Build từng module một. Giao diện bám theo ảnh chụp TMS gốc của người dùng.

## 2. Tech stack
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4 (`@tailwindcss/vite`, cấu hình trong `src/index.css` bằng `@theme`), Lucide Icons, Motion (`motion/react`), Recharts, `docx` (xuất Word).
- **Backend (chưa build):** Node.js, Express (`server.ts` / Serverless API), Google Drive API v3, WooCommerce REST API.
- **Database & Auth (chưa nối):** Supabase (PostgreSQL, Auth, RLS, Realtime, Storage) **hoặc** 1 file backup duy nhất trên Google Drive.
- **Hiện tại:** chưa có DB → dùng **session data** (`sessionStorage`): leads `tms.leads.v1`, tour packages `tms.packages.v1`, thư viện itinerary `tms.itineraries.v1`, thư viện khách sạn `tms.hotels.v1`. Đóng tab là mất dữ liệu; dữ liệu mẫu được seed lại.

## 3. Cấu trúc thư mục
```
src/
  main.tsx, App.tsx            # Sidebar + Header + 3 trang (leads / itinerary / accommodation) + LeadEditModal
  index.css                    # Tailwind v4, theme, .field/.label, style trang "Word" (.doc-*), CSS in PDF
  types.ts                     # Lead, TourPackage, ItineraryDay, AccOption, NightStay, RoomLine, Terms
  data/
    seed.ts, emptyLead.ts      # lead mẫu / lead trống khi bấm NEW LEAD
    options.ts                 # dropdown của lead
    library.ts                 # DỮ LIỆU MẪU ban đầu cho thư viện itinerary + khách sạn, DESTINATIONS
    terms.ts                   # điều khoản mặc định (Inclusions, Exclusions, Rates, Payment, Cancellation)
    seedPackages.ts            # package mẫu DISCOVERY DA NANG cho lead ITE-TA-471
  lib/
    leadRepository.ts          # LeadRepository + SessionLeadRepository       ← điểm thay DB (leads)
    packageStore.ts            # store tour package + usePackages(leadId?)     ← điểm thay DB (packages)
    collection.ts              # createCollection<T>(): store list generic + hook useAll()
    libraryStore.ts            # itineraryStore, hotelStore (CRUD)             ← điểm thay DB (thư viện)
    packageLogic.ts            # syncNights/syncOptions, autoRooms, computePrices, groupStays, normalizePackage…
    exportDocx.ts              # xuất .docx thật theo template (thư viện docx, import động)
    image.ts, useLeads.ts, format.ts
  components/
    Sidebar, Header
    LeadsPage, LeadEditModal   # danh sách lead / popup lead
    TourPackagesTab            # danh sách package của 1 lead
    TourPackageEditor          # màn hình toàn trang (portal): trang Word + thanh dưới + drawer + export
    PackageDocument            # "trang Word" theo Tour_Itinerary_Template.docx; cũng là phần in PDF (#package-doc)
    PackageBuilder             # drawer 3 phần: Itineraries / Accommodations (nhiều option) / Prices
    ItineraryManagement        # trang CRUD thư viện itinerary (sidebar)
    AccommodationManagement    # trang CRUD thư viện khách sạn (sidebar)
    FormModal                  # popup form dùng chung
```

## 4. Mô hình dữ liệu
**Lead:** customer/phone/email; paxs, travelDate, duration, destinations; code (ITE-TA-N, tự sinh), source (**bắt buộc**), campaign; details, note, attachments (chỉ tên file); followLevel, status, cskhRealDemand, saleRealDemand, leadVerifyStatus; sales, customerCare; reminders[], postpone/called/fullyCustomizedPrices; createdBy/At, updatedAt. (`tourPackages` trong Lead là field cũ, không còn dùng — số package lấy từ packageStore.)

**TourPackage** (nhiều package / 1 lead, `leadId`, mã `ITE-TA-471/2`): title, subtitle (tự lấy từ overnight), coverImage, tourType, status, validDate, note, guestName/nationality/contact, numGuests (người lớn), numChildren (chỉ hiển thị), travelDate, markupPct, vatPct (0 = ẩn dòng VAT), `terms` (bản sao điều khoản để sửa), và 3 phần:
1. **days: ItineraryDay[]** – title, tourType, overnight, meals, inclusions[], adultPrice (USD), pickup, ends, description (chi tiết), suggestion. ItineraryDay cũng chính là 1 mục trong thư viện Itinerary.
2. **options: AccOption[]** – mỗi phương án khách sạn (vd "STANDARD (3★)", "DELUXE (4★)") có `nights: NightStay[]` (luôn = days-1, `syncNights`), mỗi đêm có hotel + rooms[] {name, price, qty}.
3. **Get price** – `computePrices(pkg, option)`: land/pax + (tiền phòng ÷ khách) + phí dịch vụ % → giá / guest cho từng option; VAT/person nếu vatPct > 0.

**Thư viện** (CRUD ở sidebar): Itinerary (ItineraryDay) và Hotel (`HotelTemplate`: name, stars, address, destination, rooms[{name, price}]; phòng chứa chữ "extra" tính theo giường lẻ). Package luôn giữ BẢN SAO của dữ liệu thư viện nên sửa/xoá thư viện không làm đổi package cũ.

## 5. Quy ước
- UI không gọi storage trực tiếp; chỉ qua `leadRepo` và `packageStore`. Chuyển Supabase = thay phần ruột 2 file này.
- Ngày hiển thị `dd/mm/yyyy` (tài liệu dùng dạng "Fri, 20 Feb 2026"); lưu ISO. Tiền: USD.
- Điền phòng nhanh: khách ÷ 2 phòng + 1 extra bed nếu lẻ (5 khách = 2 phòng + 1 extra bed).
- Tài liệu bám file `Tour_Itinerary_Template.docx`: Tour Information → Brief Itinerary → Prices (theo option) → Accommodations → Detailed Itinerary → Inclusions/Exclusions/Rates/Payment/Cancellation.
- PDF = `window.print()` + CSS `@media print` (chọn "Save as PDF"); Word = `.docx` dựng bằng thư viện `docx` (không phải chụp lại HTML nên 2 bản có thể lệch nhau nhẹ về layout).
- Chạy: `npm install` → `npm run dev`.

## 6. Tiến độ
- [x] Trang Leads management + popup Edit Lead; tạo lead mới, bắt buộc Source
- [x] Tour packages trong lead: tạo nhiều package, mở/sửa/xoá, trạng thái, ngày hết hạn
- [x] Trang Word theo template: Nationality/Contact/Guest sửa được; số người lớn + trẻ em; Detailed Itinerary lấy từ thư viện (pickup/ends/mô tả/suggestion sửa được tại chỗ)
- [x] Nhiều option khách sạn (3★/4★…) mỗi option có giá riêng; VAT/person; điều khoản sửa được từng dòng
- [x] Drawer điền nhanh: Itineraries, Accommodations, Prices
- [x] Export Word (.docx) và PDF theo template
- [x] Trang CRUD Itinerary Management và Accommodation Management (sidebar) — thêm/sửa/xoá, tìm kiếm, lọc
- [ ] Giá trẻ em, twin/single supplement
- [ ] Chia sẻ link package cho khách, Revise / lịch sử phiên bản
- [ ] Tab Invoices / Vouchers / Follow Logs
- [ ] Khối "Working" + Filter nâng cao ở danh sách lead
- [ ] Supabase (leads, tour_packages JSONB, itineraries, hotels, Auth, RLS), upload ảnh thật vào Storage
- [ ] Backend Express + Google Drive backup + WooCommerce

## 7. Quyết định / ghi chú
- `library.ts` là dữ liệu mẫu theo ảnh TMS; mô tả chi tiết, giờ đón, khách sạn 3★ "(mẫu)" và các giá ngoài ảnh chỉ là ví dụ — hãy thay bằng dữ liệu thật qua trang CRUD.
- VAT mặc định 0% (dòng VAT PER PERSON ẩn); nhập % ở bước Prices để hiện.
- Dữ liệu package cũ trong session được `normalizePackage` tự chuyển sang cấu trúc mới (options, terms…).
- Ảnh bìa lưu dạng data URL JPEG (≤1000px) trong sessionStorage; ảnh nặng có thể làm đầy storage.
- Tour package chỉ tạo được khi lead đã lưu (cần `leadId`).
- Ảnh gốc tham chiếu: danh sách lead, Edit Lead, tab Tour Packages, 3 bước Itineraries → Accommodations → Get Prices, trang tài liệu "DISCOVERY DA NANG".

## 8. Bước tiếp theo đề xuất
1. Chạy thử, chỉnh layout trang Word/PDF cho khớp mẫu.
2. Supabase: schema + repository thật cho leads, tour_packages, itineraries, hotels.
3. Giá trẻ em và chia sẻ link báo giá.
