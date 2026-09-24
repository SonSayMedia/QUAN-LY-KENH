# HƯỚNG DẪN LẤY OAUTH VÀ KẾT NỐI TỪNG KÊNH

Chỉ cần **một bộ OAuth** (Client ID + Client Secret) cho tất cả kênh. Mỗi kênh chỉ cần **cấp quyền một lần**.
Làm trong **cùng project Google Cloud** đã tạo khoá API YouTube.

## PHẦN 1 — Tạo OAuth Client trên Google Cloud

**Bước 1. Vào đúng project**
- Mở https://console.cloud.google.com, đăng nhập bằng mail đã tạo project.
- Góc trên trái, bấm ô chọn project → chọn project đang dùng cho app.

**Bước 2. Bật YouTube Analytics API**
- Menu ☰ → **APIs & Services → Library**.
- Tìm **YouTube Analytics API** → bấm **Enable**. (YouTube Data API v3 đã bật từ trước.)

**Bước 3. Màn hình đồng ý OAuth** (menu ☰ → APIs & Services → **OAuth consent screen**, bản mới tên **Google Auth Platform**)
- Bấm **Get started**.
- *App information:* Tên app: `Quan ly kenh` — Email hỗ trợ: chọn email của anh → Next.
- *Audience:* chọn **External** → Next.
- *Contact information:* nhập email → Next.
- Tick đồng ý chính sách → **Continue → Create**.

**Bước 4. Thêm 2 quyền chỉ đọc** (mục **Data Access**)
- Bấm **Add or remove scopes**, dán từng dòng vào ô lọc/“Manually add scopes”:
  - `https://www.googleapis.com/auth/youtube.readonly`
  - `https://www.googleapis.com/auth/yt-analytics.readonly`
- **Update → Save**. (Không thêm quyền nào khác. Đây đều là quyền CHỈ ĐỌC, app không đăng/xoá/sửa gì.)

**Bước 5. Chuyển sang “In production”** (mục **Audience**)
- Ở **Publishing status**, bấm **Publish app** → Confirm → trạng thái thành **In production**.
- QUAN TRỌNG: nếu để **Testing**, kết nối tự hết hạn sau **7 ngày** và phải thêm email từng tài khoản làm Test user.

**Bước 6. Tạo Client** (mục **Clients**)
- **Create client** → *Application type*: **Web application** → *Name*: `Quan ly kenh`.
- Ở **Authorized redirect URIs** → **Add URI** → nhập ĐÚNG:
  `http://localhost:4400/oauth/callback`
  (chữ `http`, không phải https; `localhost`, không phải 127.0.0.1; đúng cổng 4400; không có dấu `/` ở cuối)
- Bấm **Create**.
- Hộp thoại hiện **Client ID** (đuôi `.apps.googleusercontent.com`) và **Client secret** (bắt đầu `GOCSPX-`).
  **Copy ngay cả hai, hoặc bấm Download JSON.** Google có thể không hiện lại secret sau này; nếu mất, vào Client đó bấm **Add secret** để tạo secret mới.

## PHẦN 2 — Dán vào app
- Mở app (shortcut Desktop) → **Cài đặt → “Google OAuth — kênh của anh”**.
- Dán **Client ID** và **Client Secret** → bấm **Lưu**. Đèn “Google OAuth” chuyển **vàng**.

## PHẦN 3 — Kết nối từng kênh (mỗi kênh làm một lần)
Yêu cầu: app đang chạy (cổng 4400), và tài khoản Google trong hồ sơ GPM phải là **chủ sở hữu hoặc quản lý** của kênh.

Với **mỗi kênh**:
1. Trong app: **Cài đặt → Kênh đã kết nối → “Sao chép link kết nối”** (link là `http://localhost:4400/oauth/start`).
2. Mở **đúng hồ sơ GPM** đang đăng nhập kênh đó → dán link vào thanh địa chỉ → Enter.
3. Chọn **tài khoản Google**. Nếu kênh là Brand Account sẽ có màn thứ hai liệt kê các kênh → chọn **đúng kênh** cần kết nối.
4. Thấy “**Google hasn't verified this app**” → bấm **Advanced (Nâng cao)** → **Go to Quan ly kenh (unsafe)**. (Bình thường vì app do anh tự tạo, chỉ mình anh dùng.)
5. Tick cho phép **cả 2 quyền** (xem tài khoản YouTube, xem báo cáo YouTube Analytics) → **Continue**.
6. Thấy trang “**✓ Đã kết nối kênh …**” là xong → đóng tab.
7. Quay lại app: kênh xuất hiện trong danh sách “Kênh đã kết nối”. Gõ **ngách** và **quốc gia** cho kênh đó.

Sau khi kết nối hết các kênh: đèn “Google OAuth · N kênh” xanh, dữ liệu mẫu của các kênh anh được thay bằng dữ liệu thật.

## Xử lý lỗi thường gặp
| Thấy gì | Nguyên nhân / cách xử lý |
|---|---|
| `redirect_uri_mismatch` | URI ở Bước 6 sai. Sửa cho đúng chữ từng ký tự: `http://localhost:4400/oauth/callback` |
| “Access blocked / app not verified / chưa cấp quyền” | App đang ở **Testing**. Làm lại Bước 5 (Publish app) |
| Kết nối được nhưng chọn nhầm kênh | Ngắt kết nối kênh sai trong app, làm lại và chọn đúng kênh ở màn chọn tài khoản |
| “Google không trả mã làm mới” | Vào https://myaccount.google.com/permissions, gỡ quyền của “Quan ly kenh”, rồi kết nối lại |
| Không mở được `localhost:4400` trong hồ sơ GPM | App chưa chạy, hoặc hồ sơ dùng proxy: cho phép `localhost` đi thẳng, không qua proxy |
| Kênh mới, biểu đồ trống | Kênh quá mới hoặc Google chưa có số liệu (thường trễ 1–2 ngày) |
| “Cần kết nối lại” hiện ở kênh | Quyền đã bị thu hồi/hết hạn: bấm kết nối lại kênh đó |

## Lưu ý an toàn
- Client Secret và mã làm mới lưu trong `app/data/` trên máy anh. **Không gửi thư mục `app/data` cho ai.**
- App chỉ có quyền **đọc**. Anh có thể thu hồi bất cứ lúc nào ở https://myaccount.google.com/permissions hoặc bấm “Ngắt kết nối” trong app.
- Các kênh dùng chung một project Google Cloud và cùng địa chỉ mạng khi lấy số liệu.
