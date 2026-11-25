

-- 1. Cấp quyền truy cập schema public
grant usage on schema public to anon, authenticated, service_role;

-- 2. Cấp toàn quyền đọc/ghi trên 4 bảng cho nhân viên đã đăng nhập (authenticated) và admin (service_role)
-- Lưu ý: Role 'anon' không được cấp quyền để đảm bảo đúng thiết kế bảo mật của bạn
grant select, insert, update, delete on table 
  public.leads, 
  public.tour_packages, 
  public.itineraries, 
  public.hotels 
to authenticated, service_role;

-- 3. (Tùy chọn) Tự động cấp quyền cho các bảng tạo mới sau này
alter default privileges in schema public 
grant select, insert, update, delete on tables to authenticated, service_role;
