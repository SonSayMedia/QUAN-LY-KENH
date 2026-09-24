# Quản lý Kênh

App nội bộ theo dõi kênh YouTube của mình + đối thủ (số liệu hàng ngày, quét trend/từ khoá/niche, gợi ý trả lời bình luận bằng AI...). Chạy bằng Node.js thuần (không cần cài thư viện ngoài), lưu dữ liệu ra file JSON tại `app/data/`.

## ⚠️ Trước khi làm bất cứ điều gì: KHÔNG commit thư mục `app/data/`

Thư mục này chứa dữ liệu THẬT: API key YouTube Data v3, OAuth Client Secret, refresh token của từng kênh đã kết nối. `.gitignore` đã loại trừ sẵn cả thư mục — mỗi máy tự có `app/data/` riêng, không đồng bộ qua Git. Nếu vô tình thấy các file này nằm trong `git status` trước khi commit, DỪNG LẠI và báo ngay.

## Cài đặt lần đầu (cho từng người trong team)

1. Cài Node.js (bản LTS) từ https://nodejs.org nếu máy chưa có.
2. Clone repo này về máy.
3. Chạy `CHAY QUAN LY KENH.bat` (Windows) — script tự bật server tại `http://localhost:4400` và mở trình duyệt. Hoặc chạy tay:
   ```bash
   node app/server.js
   ```
4. Lần đầu chạy, thư mục `app/data/` sẽ tự được tạo rỗng — vào mục **Cài đặt** trong app để bắt đầu cấu hình:
   - Thêm ít nhất 1 **API key YouTube Data v3** của riêng bạn (dùng cho quét đối thủ, quét trend...).
   - Thêm **bộ OAuth** của riêng bạn để kết nối các kênh (xem hướng dẫn bên dưới).

## Nhận bản cập nhật mới

Khi có bản mới trên GitHub, mỗi người chỉ cần chạy **`CAP NHAT.bat`** — script tự `git pull` bản mới, khởi động lại server, rồi mở lại app. Dữ liệu riêng trong `app/data/` (API key, OAuth, kênh đã kết nối...) không bị ảnh hưởng vì không nằm trong Git.

Lưu ý: `CAP NHAT.bat` chỉ chạy được khi thư mục này được tải về bằng `git clone` (không phải tải file `.zip` từ GitHub rồi giải nén) — vì nó cần Git để biết bản mới nhất là gì.

## Kết nối kênh + cài OAuth cho từng người

Làm theo đúng file **`HUONG DAN CHO NGUOI KHAC KET NOI KENH.txt`** ở thư mục gốc — hướng dẫn chi tiết từng bước: tạo Google Cloud project riêng, cấu hình màn hình đồng ý OAuth (dùng chung tên miền đã xác minh của SonSay Media qua cơ chế "Add owner" trong Search Console — không cần quyền quản trị tên miền/hosting), tạo OAuth Client, rồi gửi Client ID/Secret để được thêm vào hệ thống và bắt đầu kết nối kênh.

Mỗi người tự có **API key** và **bộ OAuth** riêng trong phần Cài đặt của máy mình — không ai cần biết secret của người khác, và không ai cần đăng nhập Gmail của kênh trực tiếp vào trình duyệt máy tính (app xin quyền qua OAuth, không cần mật khẩu kênh).

## Cấu trúc thư mục

- `app/` — toàn bộ mã nguồn server + giao diện (server.js, core.js, google.js, rivals.js, scan.js, explore.js, public/).
- `app/data/` — dữ liệu thật, **không commit** (xem `.gitignore`).
- `CHAY QUAN LY KENH.bat` — chạy nhanh trên Windows.
- `CAP NHAT.bat` — tải bản mới nhất từ GitHub + khởi động lại server.
- `HUONG DAN CHO NGUOI KHAC KET NOI KENH.txt` — hướng dẫn OAuth chi tiết cho từng người trong team.
