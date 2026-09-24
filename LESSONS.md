# LESSONS — Bài học lỗi sai

**Quy tắc:** TRƯỚC khi làm bất kỳ việc gì trong dự án này, đọc file này. Khi có lỗi sai, thêm 1 mục mới ở cuối (ngắn gọn).

Mẫu:

```
## [YYYY-MM-DD] Tên lỗi ngắn
- Lỗi: hiện tượng gặp
- Nguyên nhân gốc: vì sao xảy ra
- Cách xử lý / phòng tránh: làm gì để không lặp lại
```

---

## [2026-09-21] Khởi động lại app thật nhưng thừa hưởng biến môi trường của bản thử
- Lỗi: sau khi thử nghiệm xong, chạy lại app thật thì cổng 4400 không lên (app chạy ở cổng 4455 với dữ liệu thử và địa chỉ YouTube giả).
- Nguyên nhân gốc: biến môi trường của bản thử (PORT, QLK_DATA_DIR, QLK_GOOGLE_*) được đặt trong cùng lệnh PowerShell nên file .bat khởi động app thật kế thừa chúng.
- Cách xử lý / phòng tránh: khởi động lại app thật trong một lệnh PowerShell RIÊNG (môi trường sạch), sau đó kiểm tra cổng 4400 và danh sách kênh thật; không bao giờ đặt biến thử nghiệm và chạy .bat trong cùng một lệnh.
## [2026-09-21] Trang trắng vì gọi hàm khai báo bằng `const` trước khi nó được tạo
- Lỗi: mở app không hiện gì, console báo "Cannot access 'pageTrendsSwitch' before initialization".
- Nguyên nhân gốc: khai báo `const fn = () => …` ở phía dưới nhưng bảng `TREND_PAGES` ở phía trên đã tham chiếu tới nó lúc khởi tạo (vùng chết tạm thời của const).
- Cách xử lý / phòng tránh: hàm được tham chiếu sớm thì khai báo dạng `function tên() {}` (được nâng lên đầu); sau mỗi lần sửa file lớn phải mở trang và đọc console, không chỉ `node --check`.

## [2026-09-21] File JSON có BOM làm server đọc như file rỗng
- Lỗi: khi thử nghiệm, server báo "Chưa cài khoá API" dù đã ghi khoá vào settings.json.
- Nguyên nhân gốc: PowerShell 5.1 `Set-Content -Encoding UTF8` ghi thêm BOM ở đầu file; `JSON.parse` của Node lỗi nên code coi file là rỗng.
- Cách xử lý / phòng tránh: khi tạo file JSON cho app bằng PowerShell dùng `[IO.File]::WriteAllText(path, text, (New-Object Text.UTF8Encoding($false)))`. (Chỉ file .md do em ghi mới dùng BOM được.)
## [2026-09-21] 9router báo "AI không trả nội dung" dù đang chạy
- Lỗi: đèn API 9Router đỏ, thông báo "AI không trả nội dung".
- Nguyên nhân gốc: 9router trả về luồng SSE (text/event-stream) dù không xin stream; code chỉ đọc JSON. Em cũng chỉ thử bằng máy chủ giả trả JSON thường nên không phát hiện. Thêm nữa test dùng max_tokens=8 quá thấp cho model "thinking".
- Cách xử lý / phòng tránh: đọc phản hồi dạng text, tự ghép SSE khi cần; gửi stream:false; test max_tokens ≥1024; báo lỗi kèm loại phản hồi/finish_reason. Khi tích hợp dịch vụ ngoài phải thử với dịch vụ thật (hoặc mô phỏng đúng định dạng thật), không chỉ máy chủ giả.

## [2026-09-21] Dán nhầm loại khoá vào ô "Khoá API" YouTube
- Lỗi: Google báo "API key not valid"; khoá dán vào dài 35 ký tự, không bắt đầu bằng AIza.
- Nguyên nhân gốc: app chỉ kiểm tra khoá "20–80 ký tự chữ số", nên khoá của dịch vụ khác vẫn được nhận và mãi đến lúc gọi Google mới lỗi.
- Cách xử lý / phòng tránh: kiểm tra định dạng chặt (AIza + 35 ký tự), nhận biết Client Secret (GOCSPX-) / Client ID và báo dán vào đúng ô.

## [2026-09-19] Giờ hiển thị ra số âm ("-8:-30")
- Lỗi: cột "Giờ đối thủ" hiện giờ âm.
- Nguyên nhân gốc: dùng toán tử dịch bit `>>` trên số hash 32-bit không dấu; JS ép về số có dấu nên ra số âm.
- Cách xử lý / phòng tránh: với hash không dấu dùng `>>>`; luôn chạy thử đọc nội dung hiển thị sau khi thêm hàm sinh số.

## [2026-09-19] Đặt sai vị trí cột
- Lỗi: anh nói "ở vị trí cột 5, đẩy Tương tác lùi về sau"; em đưa cột xu hướng lên cột 5 (trước Tổng lượt xem) trong khi anh muốn nó sau Tổng lượt xem, trước Tương tác.
- Nguyên nhân gốc: em hiểu theo số thứ tự cột, không đối chiếu với vị trí đang có; lời anh mơ hồ mà em không hỏi lại.
- Cách xử lý / phòng tránh: khi yêu cầu vị trí dùng số cột mơ hồ, diễn đạt lại bằng "sau cột X, trước cột Y" để xác nhận trước khi sửa; hoặc làm rồi nói rõ thứ tự kết quả để anh sửa ngay.



## [2026-09-21] Kết luận sai vì chưa tra nguồn: nút Publish bị mờ
- Lỗi: em nói nút "Publish app" mờ là "lỗi phía Google", trong khi thật ra thiếu Homepage + Privacy policy + Authorized domains.
- Nguyên nhân gốc: em kết luận từ giao diện, không đọc tooltip của nút và không tra tài liệu.
- Cách xử lý / phòng tránh: khi một nút bị mờ, đọc tooltip/thông báo và tra tài liệu chính thức TRƯỚC khi kết luận; nói rõ "chưa chắc" nếu chưa kiểm chứng.

## [2026-09-21] Đọc bình luận bằng OAuth đòi quyền quản lý kênh
- Lỗi: gọi commentThreads bằng token OAuth chỉ đọc -> "insufficient authentication scopes" (cần youtube.force-ssl, quyền sửa/xoá).
- Nguyên nhân gốc: em giả định quyền chỉ đọc đủ để đọc bình luận.
- Cách xử lý / phòng tránh: đọc bình luận CÔNG KHAI bằng khoá API (không cần OAuth). Trước khi hứa một tính năng, thử gọi API thật và kiểm tra quyền tối thiểu; không xin quyền rộng hơn cần thiết.

## [2026-09-21] "Video bứt phá" dùng trung vị -> ×1502 sai bản chất
- Lỗi: video cũ cao đều bị xếp "bứt phá ×1502" vì so với trung vị của kênh.
- Nguyên nhân gốc: chỉ so mức cao, không xét xu hướng tăng.
- Cách xử lý / phòng tránh: tiêu chí = tăng >= +50% so với tuần trước (hoặc video mới vượt mức thường). Luôn thử tiêu chí trên dữ liệu thật rồi mới giao.

## [2026-09-21] Hiểu nhầm tên cột "Thời lượng xem"
- Lỗi: em làm thành tổng giờ xem, anh muốn thời lượng xem TRUNG BÌNH (như Studio).
- Nguyên nhân gốc: từ ngữ mơ hồ, không đối chiếu với YouTube Studio.
- Cách xử lý / phòng tránh: với tên chỉ số mơ hồ, đối chiếu tên đúng trong Studio hoặc hỏi lại trước khi làm.

## [2026-09-21] Hứa chỉ số API không hỗ trợ (hiển thị thumbnail, CTR, người xem riêng biệt)
- Lỗi: thiết kế trang video có các chỉ số Google API không trả (Analytics báo "query not supported").
- Nguyên nhân gốc: thử bằng máy chủ giả (mock) nên không phát hiện.
- Cách xử lý / phòng tránh: chỉ số mới phải thử với API/kênh THẬT trước khi hứa; bỏ phần không lấy được, không chiếm chỗ.

## [2026-09-21] Tệp PDF đang mở nên không ghi đè được
- Lỗi: tạo lại PDF hướng dẫn bị "file đang được dùng".
- Cách xử lý / phòng tránh: xuất ra tên mới ("(ban 2)") rồi báo anh đóng bản cũ.

## [2026-09-22] Ô chọn/ô nhập mất giá trị khi trang vẽ lại
- Lỗi: các ô chọn (thị trường, số ngày...) chỉ đọc lúc bấm Chạy, nên bị đặt lại khi app vẽ lại trang (đồng bộ nền, bấm chip).
- Nguyên nhân gốc: chỉ lưu chữ ở ô text, quên ô chọn; agent rà code phát hiện.
- Cách xử lý / phòng tránh: mọi ô nhập/chọn của trang khám phá phải có listener input/change ghi vào state; thêm chặn bấm chạy khi đang chạy (tránh quét chồng tốn hạn mức).

## [2026-09-22] Đối chiếu trạng thái khi đổi ngữ cảnh giữa chừng (popup bình luận)
- Lỗi: mở popup kênh A, đổi sang kênh B trong lúc chờ -> kết quả của A hiện ở B.
- Cách xử lý / phòng tránh: mọi hàm async giữ mã ngữ cảnh (my = cid) và bỏ kết quả nếu ngữ cảnh đã đổi; AI trả thiếu mục thì để "đang chờ", không coi là spam.

## [2026-09-22] Công thức tiêu đề (Quét kênh) ra 0 với kênh tiếng Tây Ban Nha
- Lỗi: bảng "công thức tiêu đề" hầu như toàn 0 khi quét kênh không phải tiếng Anh.
- Nguyên nhân gốc: dùng regex viết cho tiếng Anh (Why/How/What...) để phân loại tiêu đề; tool YT DNA của anh dùng AI bóc tách từng tiêu đề nên không phụ thuộc ngôn ngữ.
- Cách xử lý / phòng tránh: phân loại văn bản đa ngôn ngữ phải dùng AI (hoặc bộ từ theo từng ngôn ngữ), không dùng regex một ngôn ngữ; trước khi làm tính năng tương tự, xem tool cũ của anh trong D:\SONSAY MEDIA\TOOL đã giải quyết thế nào.

## [2026-09-22] Nghi lỗi mã hoá giả do PowerShell console, không phải lỗi app
- Hiện tượng: in dữ liệu qua PowerShell (Invoke-WebRequest/ConvertFrom-Json rồi echo ra) thấy chữ có dấu/emoji bị loằng ngoằng kiểu "tÃ² mÃ²", tưởng app lưu sai UTF-8.
- Nguyên nhân gốc: PowerShell 5.1 console không xuất UTF-8 mặc định; dữ liệu trong file/app vẫn đúng, chỉ hiển thị sai trên terminal của mình.
- Cách xử lý / phòng tránh: khi nghi lỗi mã hoá, đọc trực tiếp bằng công cụ Read (không qua PowerShell echo), hoặc ghi ra file rồi Read, trước khi kết luận và đi sửa code. Đã tốn công tra ngược 9router/YouTube API oan.
