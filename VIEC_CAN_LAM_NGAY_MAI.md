# CẬP NHẬT 21/09/2026: YouTube API và 9Router đã XANH. Đang làm OAuth theo file `Huong dan lay OAuth.txt` (đã có Data Access + Test users; cần tạo Client mới sau khi xoá secret cũ, dán vào Cài đặt, rồi kết nối từng kênh). Nút Publish app trên Google Cloud đang mờ — thử lại sau; trong lúc chờ dùng Testing (kết nối lại mỗi ~7 ngày).

# VIỆC ANH CẦN LÀM NGÀY MAI (ghi tối 19/09/2026)

App: mở bằng shortcut **"Quan Ly Kenh"** ngoài Desktop (hoặc `CHAY QUAN LY KENH.bat`) → http://localhost:4400
Toàn bộ yêu cầu và quyết định: xem `PHONG_VAN.md`. Lỗi đã gặp: `LESSONS.md`.

## A. Sáng mai — xem app có tự cập nhật đúng 08:30 không
- [ ] Mở app → **Cài đặt → "Lịch cập nhật tự động"**: lần chạy gần nhất phải ghi **"theo lịch 08:30"** (nếu ghi "chạy bù" nghĩa là app/máy tắt lúc 08:30, không sao).
- [ ] Nếu không thấy chạy: báo em, em sửa.

## B. Gắn API (làm theo thứ tự, mỗi bước xong đèn góc phải sẽ đổi màu)
### B1. YouTube Data API v3 → đèn "YouTube Data API v3" sáng xanh
1. Vào console.cloud.google.com, đăng nhập bằng **mail đang quản lý 5 kênh**, tạo project mới.
2. APIs & Services → Library: bật **YouTube Data API v3** và **YouTube Analytics API** (chỉ 2 API này, không bật gì khác).
3. Credentials → Create credentials → **API key** → vào phần giới hạn khoá, chọn chỉ cho phép YouTube Data API v3.
4. Mở app → **Cài đặt → "YouTube Data API Key"** → dán khoá → **Enter** (hoặc "Lưu & kiểm tra"). Đèn xanh = xong.
### B2. Google OAuth (để đọc số liệu 5 kênh) → đèn "Google OAuth"
1. OAuth consent screen: chọn External, điền tên app, chuyển sang **In production** (nếu để Testing thì hết hạn sau 7 ngày).
2. Credentials → OAuth client ID → loại **Web application** → Redirect URI: `http://localhost:4400/oauth/callback`.
3. Dán **Client ID** và **Client Secret** vào **Cài đặt → Google OAuth** → Lưu.
4. Chỉ cần **MỘT** bộ OAuth cho tất cả kênh. Mỗi kênh sẽ bấm "Kết nối" và cấp quyền riêng (5 lần) — phần nút này em làm ở bước nối dữ liệu thật.
### B3. API 9Router (AI viết bài cộng đồng) → đèn "API 9Router"
1. **Bật 9router trên máy** (địa chỉ mặc định `http://127.0.0.1:20128/v1`, model `ag/gemini-3.8-flash`).
2. **Cài đặt → "AI viết bài — 9router"** → dán khoá 9router → "Lưu & kiểm tra".

## C. Thử cách hoạt động của hệ thống
- [ ] **Quản lý Kênh:** bảng 6 cột + xu hướng + Tình trạng, thẻ "Tóm tắt sáng nay", tìm/ghim/xuất CSV.
- [ ] **Trạm đăng bài:** bấm từng kênh bên trái → xem video hôm nay, lịch 7 ngày, bài cộng đồng.
  - Thử **"💡 Gợi ý hôm nay"** (mỗi ngày 1 bài ngẫu nhiên, không lặp), nút **"Dùng bài này"**, **"Đổi bài khác"**.
  - Bài loại **Câu hỏi / Hình ảnh** có khung **prompt ảnh 1:1** → thử "Copy prompt ảnh".
  - Điền **🧬 Hồ sơ kênh** cho 1 kênh (khán giả, giọng điệu, series, điều cấm kỵ, bài mẫu) rồi bấm **"✨ AI viết bài"** (cần B3).
  - Thử **"✕ Xoá cảnh báo"** và **"↩ Khôi phục"**; bấm ô lịch sử 14 ngày để ghi bù.
  - Bấm **"🔔 Bật nhắc giờ trên trình duyệt"** (dùng Chrome) để có thông báo Windows khi đến giờ.
- [ ] **Tracker:** thêm đối thủ ("+ Nạp đối thủ": dán link + niche), 4 tab bắt trend (Title Trends, Tìm Niche, Quét chủ đề, Quét kênh).
- [ ] **Lịch đăng:** sửa lịch một kênh (giờ đăng, tần suất, số bài cộng đồng/ngày — tối thiểu 1).

## D. Sau khi gắn API, nhắn cho em để em làm tiếp (theo thứ tự)
1. Nối số liệu **đối thủ thật** (dùng khoá API) cho Tracker, 4 tab bắt trend, Quét kênh.
2. Làm nút **"Kết nối kênh"** (OAuth từng kênh) và lấy số liệu **5 kênh thật** (sub, view, bình luận, "+ mới theo ngày").
3. Lưu **ảnh chụp số liệu theo giờ** vào file (tính tăng trưởng, cảnh báo thật).
4. Chuyển dữ liệu anh nhập (đối thủ thêm, ghim, ghi chú, nháp, lịch, đánh dấu đã đăng) từ trình duyệt sang **file trên máy** để không mất khi xoá dữ liệu trình duyệt.
5. (Tuỳ chọn) Tạo tác vụ Windows tự bật server khi mở máy để lịch 08:30 luôn chạy — em chỉ làm khi anh đồng ý.

## E. Hiện đang là DỮ LIỆU MẪU (đừng dựa vào để ra quyết định)
Bảng kênh, đối thủ, Title Trends, Tìm Niche, Quét chủ đề/kênh, tóm tắt sáng nay, cảnh báo tình trạng: đều là số mẫu cho đến khi làm mục D.
Chưa thử với dịch vụ thật: nút "✨ AI viết bài" (mới thử bằng máy chủ giả), đèn xanh của YouTube API (mới thử trạng thái chưa cài và lỗi).

## F. Điều cần biết
- App chỉ tự cập nhật khi **server đang chạy** (đã mở bằng shortcut). Mở muộn thì tự chạy bù.
- **Không có API** cho: bài đăng cộng đồng (nên phải bấm tay "Đánh dấu đã đăng"), chuông thông báo Studio, view 48h/60p realtime (đã quyết định bỏ).
- Khoá API/OAuth/9router lưu trong `app/data/settings.json` trên máy anh; **không gửi file này cho ai**. Khi copy sao lưu thư mục dự án, cẩn thận với file này.
- Nội dung AI viết cần anh đọc lại trước khi đăng.
- Hạn mức YouTube miễn phí 10.000 đơn vị/ngày, em ước tính dùng 1.000–4.000/ngày; "Quét chủ đề" tốn 100 đơn vị mỗi lần.
