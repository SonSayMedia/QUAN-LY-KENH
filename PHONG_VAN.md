# PHỎNG VẤN YÊU CẦU — App Quản lý kênh YouTube (localhost)

Thư mục dự án: `D:\SONSAY MEDIA\TOOL\QUAN LY KENH`
Mọi thông tin từ luồng chat này được lưu tại đây. Cập nhật sau mỗi câu trả lời.

## Quy tắc làm việc đã thống nhất
- Chỉ phỏng vấn, chưa triển khai gì cho đến khi anh chốt.
- Hỏi từng câu một, câu hỏi mở, đến khi không còn ngầm định nào.
- Vai trò: chuyên gia code 15 năm kinh nghiệm, cùng các agent.
- Lỗi sai ghi vào `LESSONS.md`; đọc file đó trước khi làm việc.

## Yêu cầu gốc (nguyên văn tóm tắt)
Tạo app chạy trên localhost để quản lý các kênh YouTube của anh và theo dõi đối thủ, giống như trong ảnh tham khảo (`anh-tham-khao/`).

## Quan sát từ ảnh tham khảo (app mẫu "Tao Le Media", localhost:4321)
Thanh điều hướng: Điều hành · Xưởng sản xuất · Xưởng Studio · Quản lý Kênh · Quản lý Giờ đăng · YouTube Channel Tracker · Ghép hàng loạt · Cài đặt.

- **Quản lý Kênh** (`/channels`): danh sách ~20 kênh; cột: tên kênh (sub/view/số video), chủ đề, tổng video, đã đăng, đã lên lịch, trong kho, đang làm, ý tưởng, lượt xem, giờ đăng, giờ đối thủ, kết nối, sắp xếp. Nút Thao tác, Thêm kênh.
- **Quản lý Giờ đăng** (`/schedule`): 3 tab (Lịch đăng khung giờ / Trạm đăng bài / Đăng hôm nay); bảng lịch từng kênh (chủ đề, quốc gia, giờ đăng, tần suất "mỗi 3 ngày", giờ đối thủ); lịch tháng; Trạm đăng bài lọc theo kênh/ngày, danh sách video chờ đăng.
- **YouTube Channel Tracker** (`/tracker`): tab Kênh đối thủ (99) / Kênh của mình (13) / Title Trends / Tìm Niche / Quét chủ đề / Quét kênh; lọc 7/28/90 ngày; thẻ tổng subscriber/view/video; top tăng subscriber, top tăng view; nhóm theo Nhóm/Chủ đề; bảng kênh có sparkline xu hướng; nút Nạp đối thủ từ ngách, Title đối thủ hot, Cập nhật ngay, Thêm kênh.
- **Chi tiết kênh**: subscriber, lượt xem, số video; biểu đồ theo thời gian; bảng video (lượt xem, like, bình luận, ngày đăng, badge tăng/mới); Copy tiêu đề; sắp View cao nhất / Mới nhất; Mở trên YouTube.

## Nhật ký hỏi đáp
### Câu 1
**Hỏi:** Nỗi đau/quy trình hằng ngày hiện tại của anh với các kênh là gì? Điều gì mất thời gian nhất?
**Trả lời:** Anh có rất nhiều kênh YouTube. Hằng ngày phải vào từng kênh kiểm tra thông tin → tốn thời gian, không quản lý hết được. Ảnh là hệ thống quản lý kênh của một người anh chia sẻ, anh chụp lại làm mẫu.
**Phạm vi chốt:** CHỈ quan tâm phần quản lý kênh + theo dõi đối thủ. BỎ QUA: Xưởng sản xuất, Xưởng Studio, Ghép hàng loạt, Điều hành (và các luồng sản xuất video khác).
**Ngầm định còn cần xác minh:** phần Quản lý Giờ đăng có nằm trong phạm vi không (chưa rõ).

### Câu 2
**Hỏi:** Khi vào từng kênh, anh xem thông tin nào và để quyết định gì?
**Trả lời:** Mục đích: theo dõi nhiều kênh cùng lúc. Mỗi kênh chỉ cần xem:
1. Tăng trưởng view theo các mốc 48h, 7 ngày, 28 ngày.
2. Bình luận có trong kênh.
3. Video đã up mới chưa / có bài đăng mới chưa (theo dõi video trong kênh).
4. Thêm tab Đối thủ để biết tăng trưởng của đối thủ.
**Ghi chú của em:** chưa rõ "bài đăng" là Community Post hay video; "48h/7d/28d" là view của video mới hay của cả kênh; chưa rõ hành động sau khi xem.

### Câu 3
**Hỏi:** Các kênh nằm ở đâu: bao nhiêu kênh, bao nhiêu tài khoản Google, anh có toàn quyền đăng nhập không?
**Trả lời:** Hiện có 5 kênh, sẽ tăng theo thời gian. Tất cả do 1 mail (1 tài khoản Google) quản lý; anh đăng nhập được YouTube Studio và xem được số liệu chi tiết.
**Hệ quả kỹ thuật (em ghi nhận, chưa chốt):** có quyền chủ sở hữu → có thể dùng OAuth/Analytics API cho kênh của mình; kênh đối thủ chỉ lấy được số liệu công khai.

### Câu 4
**Hỏi:** Định nghĩa chính xác "tăng trưởng view 48h / 7 ngày / 28 ngày", dạng hiển thị, ví dụ sử dụng.
**Trả lời:** Hiển thị giống ảnh mẫu. Mỗi kênh có: tổng view, sub, số giờ xem, bình luận, like — và mức tăng trưởng theo ngày. Bấm vào kênh thì trang chi tiết cũng có các số liệu đó. Anh xem xong làm gì thì KHÔNG cần quan tâm; chỉ cần app quản lý như ảnh.
**Quyết định:** Không hỏi thêm về mục đích sử dụng. Bộ số liệu mỗi kênh = view, sub, giờ xem, bình luận, like + tăng trưởng theo ngày; bộ lọc thời gian (48h/7d/28d, ảnh mẫu có 7/28/90) cần chốt sau.

### Câu 5
**Hỏi:** Số liệu được cập nhật bằng cách nào và khi nào (tự động/bấm tay, tần suất, app có phải mở liên tục không, có lưu lịch sử không).
**Trả lời (nguyên văn, chưa rõ):** "anh muốn app cập nhật số liệu cho anh vào 8h-30p sáng hàng tuần trên app, và thêm cả view 60p nữa, phần trên anh nói thiếu, nếu"
**Chưa rõ:** (a) "8h30 sáng hàng tuần" hay hàng ngày? (b) "view 60p" = view 60 phút gần nhất (như Realtime của YouTube Studio, vốn có 60 phút + 48 giờ)? (c) câu cuối bị cụt ("phần trên anh nói thiếu, nếu...").
**Chưa được trả lời:** có lưu lịch sử số liệu không; máy có bật lúc 8h30 không; có nút cập nhật tay không.

### Câu 6
**Hỏi:** Làm rõ (a)(b)(c) ở trên.
**Trả lời:**
- (a) Cập nhật **8h30 sáng HÀNG NGÀY** (anh xin lỗi vì viết nhầm "hàng tuần").
- (c) Anh không nói thêm về câu cụt; thay bằng yêu cầu bảng cột bên dưới.
- (b) "view 60p": **CHƯA được trả lời** (vẫn treo).
- **Bảng Quản lý Kênh (dựa ảnh 8, đổi giao diện một chút), cột theo thứ tự:**
  1. Tên kênh
  2. Chủ đề
  3. Tổng video
  4. Tổng SUB trên kênh (+ mới theo ngày)
  5. Tổng lượt xem trên kênh (+ mới theo ngày)
  6. Tương tác (gồm các thành phần nhỏ bên trong có biểu tượng: like, bình luận; câu bị cụt sau "bình luận,")

### Câu 7
**Hỏi:** Cột "Tương tác" gồm chính xác những số nào và tính trên phạm vi nào; "+ mới theo ngày" so với mốc nào.
**Trả lời:**
1. Cột Tương tác **chỉ hiển thị BÌNH LUẬN trên kênh**. BỎ like và share.
2. "+ mới theo ngày" (SUB, Lượt xem): anh chép lại nguyên câu hỏi của em ("24 giờ gần nhất, hay theo ngày dương lịch 0h–24h như Studio") → **chưa rõ chọn phương án nào**.
**Chưa được trả lời:** phạm vi số bình luận (tổng mọi video / video gần đây / bình luận mới chưa đọc?); "view 60p" (từ câu 6).

### Câu 8
**Hỏi:** Chốt cách tính "+ mới theo ngày".
**Trả lời:**
1. **Phương án B**: "+ mới" = mức tăng trong ngày dương lịch (0h–24h) như YouTube Studio.
2. Số bình luận = **của toàn kênh**.
3. Sau cột 3 (Tổng video) thêm 2 cột: **View 48h** và **View 60p** của kênh, "theo như trong Studio" (tức mục Realtime của Studio).

**Cấu trúc bảng hiện tại (chưa chốt cuối):** Tên kênh · Chủ đề · Tổng video · View 48h · View 60p · Tổng SUB (+ngày) · Tổng lượt xem (+ngày) · Bình luận (toàn kênh).

**Rủi ro kỹ thuật em ghi nhận:** view 48h/60p là số realtime, YouTube Analytics API chính thức không cung cấp; có thể phải lấy từ chính Studio (phiên đăng nhập của anh). Số này đổi liên tục nên xung đột với "cập nhật 8h30 hàng ngày" nếu chỉ chụp 1 lần.

### Câu 9
**Hỏi:** View 48h/60p hiển thị số lúc 8h30 hay số hiện tại; có cần lịch sử không.
**Trả lời:**
1. App **tự lấy lại số liệu sau mỗi 1 giờ, liên tục** (không phải chỉ 8h30).
2. Bảng **chỉ hiển thị số liệu hiện tại**, không cần xem lịch sử ở bảng.
3. Mục đích: chỉ kiểm tra mức độ tăng trưởng kênh; quyết định tính sau.
4. **Yêu cầu mới:** trong cột Tương tác thêm **thông báo**: khi kênh có thông báo thì hiện **biểu tượng chuông có chấm đỏ như YouTube**; **rê chuột (chỉ vào) chuông thì xem được kênh có những thông báo nào**.
**Ghi nhận:** 8h30 hàng ngày có thể chỉ còn vai trò chốt mốc để tính "+ mới theo ngày" (chưa xác nhận). Nội dung lịch sử vẫn phải được lưu ngầm để tính tăng trưởng theo ngày.

### Câu 10
**Hỏi:** "Thông báo của kênh" là loại nào, đọc xong xử lý ra sao.
**Trả lời:**
1. Là **thông báo trong chuông của YouTube Studio** (claim bản quyền, cảnh báo vi phạm chính sách, video xử lý xong, kênh đạt mốc sub...).
2. **Bấm vào chuông → popup** liệt kê các dòng thông báo trạng thái; **xem hết thì mất dấu đỏ**. (Anh nói ban đầu "chỉ vào"; cuối cùng chốt là "nhấn vào" → popup.)
**Rủi ro kỹ thuật em ghi nhận:** thông báo Studio không có API chính thức → cần lấy từ chính Studio qua phiên đăng nhập. Cùng vấn đề với view 48h/60p. Sẽ phải chốt phương án đăng nhập ở giai đoạn thiết kế.

### Câu 11
**Hỏi:** Tab Đối thủ: chọn đối thủ thế nào, bao nhiêu, cần xem số liệu gì, có gắn nhóm không.
**Trả lời:**
- Đối thủ: anh **dán link kênh**.
- Kênh của anh: **kết nối qua Google OAuth**.
**Chưa trả lời:** số lượng đối thủ dự kiến; số liệu cần xem cho mỗi đối thủ; có nhóm/gắn với kênh của anh không.
**Cảnh báo cần giải quyết sau:** OAuth chính thức (YouTube Data/Analytics API) KHÔNG cấp view 48h/60p realtime và thông báo chuông Studio. Cần làm rõ với anh: chấp nhận xấp xỉ bằng API, hay chấp nhận phương án khác để lấy đúng số Studio.

### Câu 12
**Hỏi:** Số liệu mỗi đối thủ và cách nhóm đối thủ.
**Trả lời:**
- Sẽ thêm **nhiều đối thủ** (theo ảnh mẫu tracker: ~99 kênh).
- Thêm đối thủ: nút **"Nạp đối thủ"** → **popup** nhập **link kênh + niche (ngách/chủ đề)** của đối thủ.
- Số liệu mỗi đối thủ: **sub, tổng view, số video, mức tăng 7 ngày / 28 ngày, video mới đăng, video đang nổi nhất...**, hiển thị **như ảnh 9** (`anh-tham-khao/9-tracker-doi-thu.png`): thẻ tổng (số kênh, tổng sub, tổng view, tổng video, kèm mức tăng), 2 bảng "Tăng subscriber nhiều nhất" và "Tăng lượt xem nhiều nhất" (top 5), lọc 7/28/90 ngày, nhóm theo Nhóm/Chủ đề (bảng: kênh, subscriber, lượt xem, video).
- **QUYẾT ĐỊNH CHỐT:** Nếu không lấy được view 48h/60p realtime hay chuông thông báo Studio bằng cách chính thức → **BỎ QUA** các tính năng đó (không đi đường vòng). Cột View 48h, View 60p và chuông thông báo trở thành "tùy chọn, mặc định bỏ".
**Hệ quả:** cột bảng kênh của mình có thể chỉ còn: Tên kênh · Chủ đề · Tổng video · Tổng SUB (+ngày) · Tổng lượt xem (+ngày) · Bình luận toàn kênh.

### Câu 13
**Hỏi:** Danh sách các màn hình/tab trong app.
**Trả lời:**
- Quản lý Kênh (bảng ảnh 8 → bấm kênh ra trang chi tiết ảnh 5) và Tracker đối thủ (ảnh 9): **CÓ, làm ngay**.
- Quản lý Giờ đăng, Title Trends, Tìm Niche, Quét chủ đề, Quét kênh, tab "Kênh của mình" trong Tracker: **cứ dựng sẵn**, anh chưa dùng, khi nào cần sẽ gọi.
- **Lệnh mới:** thiết kế giao diện + tạo cổng localhost + tạo shortcut ngoài Desktop. Anh bận, lát vào kiểm tra. **Không hỏi thêm gì nữa** → kết thúc phỏng vấn, chuyển sang làm.

## Bổ sung sau khi làm giao diện
- Bảng Quản lý Kênh thêm cột **Xu hướng 28 ngày** (đường sparkline lượt xem, giống Tracker), đặt **SAU cột Tổng lượt xem và TRƯỚC cột Tương tác** (anh đã chốt lại sau khi em hiểu sai vị trí). Thứ tự chuẩn: Tên kênh · Chủ đề · Tổng video · Tổng SUB · Tổng lượt xem · Xu hướng 28 ngày · Tương tác.
- Bảng Quản lý Kênh thêm cột **Tình trạng** (đặt cuối, sau Tương tác) + dải đếm đỏ/vàng/xanh + sắp xếp "cần chú ý lên đầu" (đề xuất tối ưu #1, anh đồng ý làm). Quy tắc: đỏ nếu view 7 ngày giảm >50% so 3 tuần trước hoặc ≥7 ngày chưa có video; vàng nếu giảm >20%, ≥4 ngày chưa có video hoặc SUB không tăng 7 ngày. Trang chi tiết kênh có thẻ liệt kê lý do. Ngưỡng nằm ở hằng số HEALTH trong app.js.
- **Đợt "thiết kế mọi thứ" (anh đồng ý làm hết các đề xuất giao diện):**
  - Quản lý Kênh: thẻ "Tóm tắt sáng nay", ô tìm kênh, lọc ngách, ghim kênh (★), biểu tượng ghi chú, Xuất CSV.
  - Chi tiết kênh: nhãn video NỔ (≥×2 trung vị của kênh) / THẤP (<×0.5), ô ghi chú riêng từng kênh (lưu trong trình duyệt).
  - Tracker đối thủ: thẻ "Video đối thủ đang nổ" (14 ngày), bảng so kênh mình với đối thủ cùng ngách, Xuất CSV.
  - Cài đặt: chỉnh ngưỡng cảnh báo kênh.
  - CHƯA làm (cần backend): lưu ảnh chụp số liệu theo giờ, lịch 8h30 thật, số liệu thật.
- **Trạm đăng bài (anh chốt lại chức năng):** phần **báo giờ đăng** + **bài đăng cộng đồng**. Nếu mỗi ngày mỗi kênh cần đăng 1 bài cộng đồng thì trạm hiển thị việc đó. Đã làm: thẻ theo từng kênh gồm video theo khung giờ (báo "Còn…/Đến giờ!/Quá giờ") và N bài cộng đồng/ngày (mặc định 1, chỉnh trong "+ Thêm / sửa lịch đăng", có giờ nhắc tuỳ chọn); nút "Đánh dấu đã đăng"; thanh tiến độ ngày; số đỏ trên menu và tab khi có việc đến/quá giờ; nhắc bằng toast + thông báo trình duyệt (cần bật). App KHÔNG tự đăng bài, chỉ nhắc và tick.
  - **Chi tiết kênh trong Trạm (anh KHÔNG có ảnh, bảo em tự hình dung):** đầu thẻ tên kênh + tiến độ; Video hôm nay; Lịch video 7 ngày tới; Bài đăng cộng đồng hôm nay (mỗi bài có chọn loại Văn bản/Bình chọn/Hình ảnh/Video-teaser/Câu hỏi, ô nháp nội dung lưu theo ngày, nút Copy nội dung, nút mở YouTube Studio, nút đánh dấu đã đăng); 7 ngày gần đây (ô xanh đủ việc / đỏ thiếu / xám chưa dùng app) + chuỗi ngày đăng đủ việc.
  - **Bố cục chốt (giống ảnh 2):** bên trái là danh sách các kênh (có trạng thái, giờ gần nhất, tiến độ x/y, lọc Tất cả/Còn việc/Đã xong); **bấm vào kênh** thì bên phải hiện chi tiết: giờ đăng video + các bài cộng đồng của kênh đó, kèm nút đánh dấu đã đăng.
- **Chuẩn bị gắn API (anh gắn vào ngày mai):** thêm thanh nhắc "Chưa gắn API" ở Quản lý Kênh và Tracker (bấm dẫn tới Cài đặt), thẻ "Các bước gắn API" tự tick ở đầu Cài đặt, Enter trong ô khóa = Lưu & kiểm tra, "Tóm tắt sáng nay" thu gọn được, bảng gọn hơn + cột đầu cố định khi cuộn ngang.
- **Bắt trend (anh yêu cầu em đề xuất + làm, học theo cách YouTube tìm xu hướng; ảnh 10 = Tracker tab Kênh của mình):** 4 tab dựng đầy đủ trên kho video mẫu (`app/public/trends.js`):
  - 🔥 **Title Trends:** từ khoá/cụm từ đang lên so với kỳ trước, công thức tiêu đề (con số, câu hỏi, đối lập, bí mật, hứa kết quả, thời lượng) kèm hiệu quả ×, video nổ bất thường (view/sub), copy tiêu đề.
  - 🧭 **Tìm Niche:** điểm cơ hội 0–100 = 40% tăng view ngách + 40% tỉ lệ "kênh nhỏ <20K sub mà view ≥10× sub" + 20% ít bị kênh lớn (>200K) chiếm; nhãn Nên vào/Cân nhắc/Đông; đánh dấu ngách anh đang làm.
  - 🔎 **Quét chủ đề:** nhập từ khoá → video nổ, kênh nhỏ đang thành công, mức quan tâm 12 tuần, từ khoá liên quan, lọc kênh nhỏ / 30 ngày.
  - 📡 **Quét kênh:** dán link → sub/view/nhịp đăng/giờ vàng, 5 video mạnh nhất, công thức tiêu đề hay dùng, nút "Nạp làm đối thủ".
  - Khi có API thật: thay corpus() bằng videos.list(chart=mostPopular, 1 đơn vị) + search.list (100 đơn vị/lần, hạn mức 10.000/ngày) + video của đối thủ đang theo dõi.
- **Kế hoạch API (đề xuất em, anh hỏi nên cài gì):** bật 2 API — YouTube Data API v3 (khoá API cho đối thủ/trend/video mới; OAuth cho kênh mình) và YouTube Analytics API (OAuth, số liệu theo ngày của 5 kênh). KHÔNG cần Reporting API, Content ID, Live Streaming. OAuth chỉ xin quyền đọc: youtube.readonly + yt-analytics.readonly. Tổng bình luận toàn kênh = cộng commentCount của các video (videos.list, không cần Analytics) — đính chính lại cách em nói trước đó. Không có API cho bài cộng đồng và chuông Studio → tick tay như đã làm. Ước tính hạn mức ~1.000–4.000/10.000 đơn vị mỗi ngày.
- **Gợi ý bài cộng đồng mỗi ngày (anh yêu cầu, ảnh 11 = Trạm đăng bài):** mỗi bài cộng đồng có khung "💡 Gợi ý hôm nay" đúng ngách và đúng ngôn ngữ kênh (Bible/English/Hidden Science → Anh, Phật Pháp → Tây Ban Nha, Stoic → Pháp) kèm ý chính tiếng Việt; nút "Dùng bài này" đưa vào ô nháp, "Đổi bài khác" xoay gợi ý. 8 bài/ngách xoay vòng, 8 ngày không lặp (file `suggest.js`). Bản viết bằng AI (Gemini/Claude) làm sau: cần khoá API của AI + "hồ sơ kênh" (đối tượng, giọng điệu, series, điều cấm).
- **Các ô vuông lịch sử (sửa theo ảnh 11):** giờ thể hiện RIÊNG bài cộng đồng, 14 ngày gần nhất, mỗi ô ghi ngày/thứ: ✓ xanh đăng đủ, ½ vàng đăng một phần, đỏ bỏ lỡ, xám chưa ghi nhận, viền vàng hôm nay; bấm ô để ghi bù/bỏ ghi; có dòng "đã đăng X/14 ngày · chuỗi liên tiếp N ngày".
- **AI viết bài + Hồ sơ kênh (anh dùng 9router/Gemini như các app khác; anh hỏi lưu hồ sơ ở đâu):**
  - Hồ sơ kênh lưu FILE trên máy: `app/data/profiles.json` (server), mỗi kênh 7 trường: ngôn ngữ, khán giả, giọng điệu, series trọng tâm, điều cấm kỵ, lời kêu gọi, bài mẫu. Sửa ở 2 chỗ cùng một dữ liệu: thẻ "🧬 Hồ sơ kênh" trong Trạm đăng bài (ngay trên các bài cộng đồng) và trong trang chi tiết kênh. Tự lưu khi bấm ra ngoài.
  - AI: Cài đặt → "AI viết bài — 9router": địa chỉ mặc định `http://127.0.0.1:20128/v1`, model `ag/gemini-3.8-flash`, khoá lưu trong `app/data/settings.json` (không trả ra giao diện). Đèn "AI" cạnh đèn API ở góc phải. Nút "✨ AI viết bài" trong mỗi bài cộng đồng: AI viết theo hồ sơ + tránh lặp 7 bài gần nhất, trả JSON (loại bài, nội dung, lựa chọn bình chọn, ý chính tiếng Việt). Đã test bằng máy chủ giả; CHƯA test với 9router thật (cần khoá của anh).
- **Quy tắc đèn trạng thái (anh yêu cầu):** mỗi đèn phải luôn có TÊN dịch vụ. Hiện 3 đèn ở góc trên bên phải: "YouTube Data API v3", "Google OAuth", "API 9Router". Màu = trạng thái (xanh sáng ổn, đỏ lỗi, vàng chưa kiểm tra, xám chưa cài); lỗi/chưa kiểm tra có thêm chữ nhỏ phía sau tên; rê chuột xem chi tiết. Đèn mới sau này (ví dụ Gemini trực tiếp) cũng phải theo quy tắc này.
- **Lịch tự cập nhật (anh chốt: 08:30 hằng ngày GIỜ VIỆT NAM):** đã làm ở server (`app/server.js`): kiểm tra mỗi 30 giây, từ 08:30 giờ VN (= 01:30 UTC, VN không đổi giờ mùa hè) nếu hôm nay chưa chạy thì chạy; nếu app/máy tắt lúc 08:30 thì tự CHẠY BÙ ngay khi mở. Nhật ký 30 lần chạy ở `app/data/update-log.json`. Hiển thị "cập nhật gần nhất / kế tiếp" ở Quản lý Kênh, các tab trend, và thẻ "Lịch cập nhật tự động" trong Cài đặt (có nút "Chạy cập nhật ngay" và danh sách từng bước). Hiện các bước lấy số liệu thật đang "–" (chờ OAuth/dữ liệu YouTube); bước kiểm tra API/9Router chạy thật. Điều kiện: server phải đang chạy (mở bằng shortcut).
- **Bài cộng đồng — yêu cầu bổ sung (ảnh 13):**
  - Loại "Câu hỏi" và "Hình ảnh" có thêm khung "🖼️ Prompt tạo ảnh · tỉ lệ 1:1" (tiếng Anh, đúng phong cách từng kênh, không chữ trong ảnh) + nút copy. Bản AI cũng trả kèm cảnh minh hoạ để ghép prompt.
  - **Xoay quanh hàng ngày + NGẪU NHIÊN:** mỗi kênh có "túi" 10 bài, xáo ngẫu nhiên theo từng vòng; mỗi ngày lấy 1 bài, không lặp trong cả vòng, không trùng bài cuối vòng trước.
  - **BẮT BUỘC mỗi ngày có ≥1 bài cộng đồng:** tối thiểu 1 bài/ngày/kênh (không cho đặt 0); nếu không đặt giờ nhắc thì hạn chót 20:00 — quá hạn thì hiện đỏ, tăng số trên menu và nhắc.
- **Xoá cảnh báo bằng tay (anh chốt: KHÔNG cần nút hoãn, chỉ cần nút xoá vì có ngày bận không đăng được):** mỗi việc chưa đăng có nút "✕ Xoá cảnh báo" (bấm lại = "↩ Khôi phục"); việc đó hết đỏ, không tính vào số đỏ trên menu và không nhắc. Lịch sử 14 ngày thêm trạng thái "–" xám (đã xoá cảnh báo, hôm đó bận); bấm ô lịch sử xoay vòng: chưa ghi/bỏ lỡ → đã đăng → xoá cảnh báo → trống. Ngày xoá cảnh báo KHÔNG tính là đã đăng (chuỗi liên tiếp dừng).
- **Kênh của anh: lấy thông tin CHÍNH XÁC qua OAuth (anh chốt 21/09; các kênh nằm trong các hồ sơ GPM khác nhau):**
  - Một bộ Client ID/Secret dùng chung; mỗi kênh cấp quyền riêng (mở link kết nối trong đúng hồ sơ GPM đã đăng nhập kênh đó). Code: `app/google.js`; đường dẫn `/oauth/start` → `/oauth/callback`; refresh token lưu `app/data/channels.json`; số liệu `app/data/snap-<kênh>.json`.
  - Lấy: tổng sub/view/video (Data API), 200 video mới nhất (view/like/bình luận), Analytics 90 ngày (view, giờ xem, sub tăng/giảm, bình luận, like theo ngày) → dựng chuỗi tăng trưởng 90 ngày ngay lập tức; tổng bình luận = cộng bình luận các video. Tự đồng bộ mỗi giờ + trong lịch 08:30. Khi kết nối, dữ liệu mẫu của 5 kênh được thay bằng dữ liệu thật (đối thủ/trend vẫn mẫu).
  - Cài đặt → "Kênh đã kết nối": kết nối, sao chép link cho GPM, đặt ngách/quốc gia, đồng bộ, ngắt kết nối (thu hồi quyền + xoá số liệu).
  - Lưu ý: Analytics trễ ~1–2 ngày; tất cả kênh dùng chung một project Google Cloud và cùng địa chỉ mạng khi gọi API (đã báo anh rủi ro liên kết kênh, anh chọn ưu tiên độ chính xác). ĐÃ test bằng Google giả (đủ luồng), CHƯA test với Google thật.
- Thêm mục Cài đặt API (khóa API, OAuth) + đèn trạng thái API góc trên phải.

## Quyết định thực thi (em tự chọn, ghi để anh biết)
- Đợt 1 = giao diện + dữ liệu MẪU (chưa nối Google OAuth thật, chưa lấy số liệu thật).
- Node.js thuần (không cần npm install), cổng **4400**, thư mục `app/`.
- Các phần "anh chưa dùng" dựng thành tab/khung có sẵn, ghi nhãn "Sắp có".
- Bỏ View 48h/60p và chuông thông báo (theo quyết định chốt ở câu 12).


## PHỎNG VẤN MỚI (21/09/2026): Thư viện ngách + Title Trends theo từ khoá
Yêu cầu gốc của anh (kèm ảnh 29, 30):
- Kênh đã kết nối (Mystery Vault) đã đặt ngách được ("Travel Documentary"). Anh muốn ngách đặt ở kênh cũng được **cập nhật vào "thư viện/bộ nhớ" ngách** ở YouTube Channel Tracker.
- Ở tab Title Trends, khi bấm quét cần **thêm ô "từ khoá để quét"**.
- Em đóng vai R&D chuyên tìm trend YouTube + am hiểu code, **phỏng vấn từng câu một** (câu hỏi mở) đến khi không còn giả định ngầm. CHƯA triển khai gì cho tới khi anh chốt.
Quan sát của em: tab Title Trends hiện chỉ có ô chọn ngách trong danh sách cố định (Stoic…), số liệu từ kho mẫu; ngách "Travel Documentary" của anh chưa có trong danh sách đó.

### Câu 1
**Hỏi:** Khi anh gõ một từ khoá rồi bấm quét Title Trends, cuối cùng anh muốn nhận được gì và dùng nó để làm gì?
**Trả lời:** Anh chọn mốc thời gian **từng ngày / 7 ngày / 28 ngày / 90 ngày** rồi bấm quét. Anh muốn nhận:
- **15 tiêu đề (title) trend có NHIỀU VIEW NHẤT** trong khoảng thời gian đã chọn. **Bấm vào title thì mở link video đó.**
- Đồng thời tìm ra nội dung cho 3 bảng: (1) **từ khoá và cụm từ đang lên**, (2) **công thức tiêu đề**, (3) **video nổ bất thường**.
**Ghi chú của em:** "từng ngày" có thể là mốc 1 ngày (chưa xác nhận); chưa rõ 15 title lấy từ phạm vi nào (toàn YouTube theo từ khoá / kênh đối thủ anh nạp / theo ngách).

### Câu 2
**Hỏi:** 15 title nhiều view nhất được lấy từ phạm vi nào (toàn YouTube / đối thủ đã nạp / thịnh hành / theo ngách)?
**Trả lời:**
- Phạm vi: **CẢ YOUTUBE**, quét **theo từ khoá là TÊN NGÁCH** của anh (ví dụ ngách "Travel Documentary" → quét từ khoá "Travel Documentary").
- Khi quét ra, **mỗi tiêu đề có nút "Thêm đối thủ"** bên cạnh → hệ thống đưa **kênh chứa video đó** vào danh sách kênh đối thủ và **xếp cùng ngách** đó.
- Mục đích của anh: theo dõi NHIỀU đối thủ trên thị trường + tìm title trend và công thức tiêu đề chiến thắng → có chiến lược **bắt trend, đi theo đám đông nhanh hơn, nhiều cơ hội hơn**.
**Ghi chú của em:** ô "từ khoá" anh yêu cầu ở đầu + "tên ngách làm từ khoá" cần làm rõ cách kết hợp; chưa rõ ngôn ngữ/thị trường (các kênh của anh nhắm US, Tây Ban Nha, Pháp).

### Câu 3
**Hỏi:** Thị trường/ngôn ngữ của video cần quét.
**Trả lời:** Kênh Mystery Vault chỉ là kênh **TEST** để thêm vào hệ thống; các **kênh chính sẽ thêm sau**. Các câu hỏi phía sau anh **chưa nghĩ tới** → anh nhờ em **đề xuất hướng** (em chuyển từ hỏi sang đề xuất mặc định, anh xác nhận/sửa).

### ĐỀ XUẤT CỦA EM (chờ anh xác nhận từng mục)
1. **Thị trường gắn với từng kênh:** mỗi kênh có "Thị trường" = quốc gia + ngôn ngữ (đặt cùng chỗ đặt ngách). Bấm quét thì mặc định dùng thị trường của kênh; có ô chọn để đổi/quét nhiều thị trường (mỗi thị trường tốn hạn mức riêng).
2. **Thư viện ngách:** ngách của các kênh tự vào thư viện; anh cũng thêm ngách tay (không cần có kênh). Mỗi ngách có **từ khoá theo từng thị trường** (mặc định = tên ngách, sửa được). Ô "từ khoá" ở Title Trends: để trống → dùng từ khoá của ngách; gõ vào → quét theo từ khoá đó.
3. **15 title:** video **đăng trong khoảng thời gian đã chọn** (1/7/28/90 ngày), xếp theo **lượt xem** (hiện thêm "view/ngày" để thấy video mới đang lên nhanh). Bấm title → mở video.
4. **3 bảng** tính từ nhóm ~50 video tìm được; "đang lên" so với khoảng liền trước (tốn thêm 1 lượt tìm). "Nổ bất thường" = view ÷ sub kênh.
5. **Nút "Thêm đối thủ":** lấy kênh của video, thêm vào Đối thủ cùng ngách đang quét, tránh trùng, đổi thành "Đã thêm"; danh sách đối thủ lưu vào FILE trên máy (không còn localStorage) và bắt đầu theo dõi số liệu thật bằng khoá API.
6. **Hạn mức:** mỗi lần quét ≈ 200 đơn vị (2 lượt tìm + tra view/sub). Có đếm hạn mức còn lại, lưu kết quả 6 giờ để bấm lại không tốn thêm.
7. **Tự quét hằng ngày (tuỳ chọn, mặc định TẮT):** 08:30 quét mỗi ngách khoảng 7 ngày, đưa vào "Tóm tắt sáng nay".
8. **Bỏ dữ liệu mẫu ở Title Trends** khi có dữ liệu thật (chưa quét thì hiện "Chưa quét"). Kho mẫu chỉ giữ khi chưa gắn API.





### Trả lời của anh về đề xuất (điểm 1 và điểm 6)
- **Thị trường của các kênh chính:** tiếng Anh, tiếng Tây Ban Nha, tiếng Bồ Đào Nha, tiếng Nhật, tiếng Hàn, tiếng Việt (6 thị trường).
- **Hạn mức:** anh nói YouTube Data API v3 "mỗi ngày được 1000 quota"; khi hết thì **thôi + hệ thống báo không quét được**; hỏi có **xoay vòng nhiều API** được không.
- **Em cần kiểm chứng / đính chính:** mặc định Google cấp **10.000 đơn vị/ngày/project** (anh nên xem ở Google Cloud → APIs & Services → YouTube Data API v3 → Quotas); hạn mức tính theo PROJECT, không theo từng khoá API → nhiều khoá cùng project không tăng hạn mức; dùng nhiều project để né hạn mức có nguy cơ vi phạm Chính sách YouTube API Services (bị khoá API) → KHÔNG khuyến nghị. Cách hợp lệ: giảm chi phí mỗi lần quét, lưu cache, hoặc xin tăng hạn mức chính thức. Hạn mức reset 00:00 giờ Thái Bình Dương (≈14:00 giờ VN mùa hè).
- **Quyết định thiết kế theo trả lời:** có bộ đếm hạn mức; hết hạn mức thì app dừng quét và báo rõ (kèm giờ reset); quét nhiều thị trường phải hiện ước tính chi phí trước khi chạy.

### Câu 4
**Hỏi:** Một ngách có dùng chung cho nhiều thị trường không (1 ngách nhiều thị trường hay ngách riêng cho từng thị trường)?
**Trả lời:** Anh đã kiểm tra: hạn mức mặc định đúng **10.000 đơn vị/ngày**; anh **đồng ý dùng cách hợp lệ của em** (giảm chi phí mỗi lần quét, cache, đếm hạn mức, không xoay vòng nhiều project). **Một ngách dùng cho NHIỀU thị trường** (1 ngách = nhiều thị trường).
**Hệ quả thiết kế:** thư viện ngách theo cấu trúc: Ngách → các thị trường (Anh, Tây Ban Nha, Bồ Đào Nha, Nhật, Hàn, Việt) → từ khoá riêng cho từng thị trường. Mỗi kênh thuộc 1 ngách + 1 thị trường (ngôn ngữ của kênh). Đối thủ thêm từ kết quả quét được xếp vào (ngách, thị trường) đang quét.

### Câu 5
**Hỏi:** Từ khoá theo từng thị trường do ai/nhập thế nào; mỗi thị trường mấy từ khoá.
**Trả lời:** Anh muốn em **tham khảo cơ chế quét theo từ khoá của YouTube: khi anh nhập từ khoá thì hiện GỢI Ý từ khoá như ô tìm kiếm của YouTube**, và **mỗi thị trường chỉ nhập 1 từ khoá**.
**Kiểm chứng của em (21/09):** thử gọi điểm gợi ý tìm kiếm của YouTube (`suggestqueries.google.com`, tham số client=youtube, hl=ngôn ngữ, gl=quốc gia) từ máy anh cho tiếng Anh/Tây Ban Nha/Nhật → đều trả gợi ý bình thường (HTTP 200). Lưu ý: đây là điểm KHÔNG chính thức (không thuộc YouTube Data API), không tốn hạn mức nhưng có thể đổi/giới hạn bất cứ lúc nào → app gọi từ server, có cache, và nếu lỗi thì lùi về gợi ý bằng AI (9router) hoặc tự gõ.
**Thiết kế theo trả lời:** mỗi (ngách, thị trường) có đúng 1 ô từ khoá; gõ tới đâu hiện danh sách gợi ý theo đúng ngôn ngữ/quốc gia của thị trường đó; chọn 1 gợi ý hoặc giữ chữ đã gõ.

### Câu 6
**Hỏi:** Quét video dài, Shorts, hay cả hai.
**Trả lời:** **Tách riêng từng loại**; anh chọn loại cần quét ở một **ô dropdown có 2 lựa chọn: "Video dài" và "Video Short"**. **Chủ yếu quét VIDEO DÀI** vì các kênh của anh chủ yếu làm video dài → **mặc định = Video dài**.
**Ghi chú kỹ thuật của em:** bộ lọc độ dài của YouTube chỉ có 3 nhóm (dưới 4 phút / 4–20 phút / trên 20 phút), không có nhóm "Shorts" riêng → cần định nghĩa "video dài" theo số phút thật của anh và lọc lại bằng độ dài chính xác của từng video (lấy từ dữ liệu video).

### Câu 7
**Hỏi:** Video dài của anh thường dài bao nhiêu phút; ngưỡng "dài" và "Short" định nghĩa thế nào.
**Trả lời:** **Dưới 3 phút = Short; còn lại (từ 3 phút trở lên) = video dài.**
**Vấn đề kỹ thuật em thấy:** bộ lọc YouTube cắt ở 4 phút và 20 phút, không cắt ở 3 phút. Muốn lấy ĐÚNG "từ 3 phút trở lên" phải quét thêm nhóm dưới 4 phút rồi lọc lại → thêm ~100 đơn vị mỗi lần quét. Nếu bỏ nhóm 3–4 phút: video dài = 4 phút trở lên (2 lượt tìm: 4–20 phút và trên 20 phút), mất một ít video 3–4 phút (hiếm với phim tài liệu).

### Câu 8
**Hỏi:** Chấp nhận bỏ sót video 3–4 phút để tiết kiệm ~100 đơn vị/lần quét, hay muốn lấy đủ.
**Trả lời:** Anh hỏi lại "Cách 2 là gì"; video của anh thường **trên 15 phút, có video lên tới 1 giờ**.
**CHỐT (theo dữ kiện của anh):** dùng **Cách 2**: "Video dài" khi quét = 2 nhóm của YouTube (**4–20 phút** và **trên 20 phút**), gộp lại, rồi lọc đúng ≥3 phút. Video của anh 15–60 phút nên không bị bỏ sót gì. "Video Short" = nhóm dưới 4 phút, lọc lại lấy dưới 3 phút.

### Câu 9
**Hỏi:** Tiêu đề tiếng nước ngoài: anh muốn xem/hiểu thế nào (dịch tiếng Việt? phân loại công thức bằng AI?).
**Trả lời:**
1. **Bản dịch tiêu đề bằng tiếng Việt, chữ nhỏ, đặt NGAY DƯỚI tiêu đề gốc** (luôn hiện).
2. **Công thức tiêu đề phân loại theo "giải phẫu tiêu đề" của anh** (3 thành phần; thiếu 1 trong 3 thì sức mạnh giảm ~50%):
   - **① Từ khoá (cho thuật toán/SEO):** cụm người xem có thể gõ lên thanh tìm kiếm; **vị trí vàng: nửa đầu tiêu đề**. Ví dụ: "Cách nhận biết người nói dối", "Thói quen độc hại", "Thao túng tâm lý".
   - **② Yếu tố tâm lý (nỗi đau/cảm xúc, cho con người):** "lưỡi câu" đánh vào 1 trong 4 tử huyệt: **Sợ hãi (nỗi đau), Tò mò (bí ẩn), Tham lam (kết quả dễ dàng), Cảnh giác**. Ví dụ: "…Chỉ Trong 1 Phút", "…Đang Âm Thầm Hủy Hoại Bạn", "…Mà Bạn Không Hề Biết".
   - **③ Bối cảnh / đóng gói (format/context):** giúp định hình thể loại/đối tượng/độ tin cậy; thường là **[ngoặc vuông], (ngoặc tròn) hoặc con số**. Ví dụ: "[Tâm lý học]", "(Mới 2026)", "5 Dấu hiệu", "Sự thật…".
   - **Công thức ghép tham khảo:** [Bối cảnh/Con số] + [Từ khoá] + [Yếu tố tâm lý].
3. **Chấp nhận chờ** thêm vài giây mỗi lần quét cho việc dịch và phân loại bằng AI.
**Hệ quả thiết kế:** bảng "Công thức tiêu đề" bỏ các mẫu tiếng Anh cũ, thay bằng phân loại theo 3 thành phần (mỗi tiêu đề có/không ①②③, loại tử huyệt của ②, loại đóng gói của ③); AI (9router) xử lý cả dịch và phân loại trong 1 lượt cho cả nhóm tiêu đề, lưu cache theo video.

### Câu 10
**Hỏi:** Thành phần ① "từ khoá" xác định thế nào (chứa từ khoá đang quét ở nửa đầu / AI tự nhận định / kết hợp).
**Trả lời:** **Hướng B: để AI tự nhận định** nửa đầu tiêu đề có phải là cụm người xem có thể gõ tìm kiếm không.
**Câu hỏi kèm theo của anh (ảnh 32):** bảng "Từ khoá & cụm từ đang lên" thì em **lấy gì để đánh giá**?
**Em đã giải thích:** hiện tính trên kho video MẪU: tách tiêu đề thành từ đơn/cụm 2 từ (bỏ từ vô nghĩa), đếm số video dùng nó ở khoảng gần đây so với khoảng liền trước; "▲100%" = số video dùng từ đó tăng gấp đôi; "Mới xuất hiện" = trước đó chưa có. Điểm yếu: mẫu nhỏ (2 video, 1 kênh vẫn lên bảng), chỉ đếm SỐ VIDEO chứ chưa xét view, cách tách từ chỉ hợp ngôn ngữ có dấu cách (không hợp Nhật/Hàn).

### Câu 11
**Hỏi:** "Đang lên" nghĩa là gì với anh; tối thiểu bao nhiêu video/kênh mới tính là trend.
**Trả lời:** **Chọn C = cả hai** (nhiều video hơn dùng cụm đó **VÀ** view của các video đó cao/tăng). **Tối thiểu 3 video của ít nhất 2 kênh khác nhau** mới tính là trend.
**Thiết kế theo trả lời:** cụm từ chỉ lên bảng khi (a) ≥3 video, (b) ≥2 kênh khác nhau, (c) số video tăng so với khoảng liền trước, (d) view trung bình của các video đó cao hơn mức chung của nhóm quét (hoặc tăng so với khoảng trước). Cụm từ do AI trích xuất từ tiêu đề (mọi ngôn ngữ), không tách máy móc.

### Câu 12
**Hỏi:** "Video nổ bất thường" là gì với anh (so với sub hay so với mức bình thường của kênh; ngưỡng).
**Trả lời:** Anh muốn em **tham khảo cách tính điểm nổ (Outlier Score) của VidIQ**; hỏi em có truy cập VidIQ tìm hiểu được không.
**Em đã tra (tài liệu công khai của VidIQ, KHÔNG đăng nhập tài khoản):**
- Outlier Score = **lượt xem của video ÷ mức view trung bình của CHÍNH kênh đó** (trong khoảng thời gian tương tự). Ví dụ kênh thường 1.000 view/video, video đạt 10.000 view → **10x**; kênh thường 10 triệu view, video 10 triệu → **1x**. Không phụ thuộc số sub.
- VidIQ không nói baseline là trung bình hay trung vị.
- Bậc màu: **<2x đen; 2–5x xanh dương; 5–10x tím; >10x đỏ**.
- Bộ lọc của VidIQ: điểm nổ, số view, số sub kênh, **view/giờ**, độ dài video, ngày đăng. Bài của VidIQ gợi ý lọc "3 tháng gần nhất + 10x".
**Áp dụng cho app (đề xuất):** Điểm nổ = view ÷ **trung vị** view của ~20 video dài gần nhất của kênh đó (loại trừ chính video đang xét, không tính Short). Cần lấy danh sách video của từng kênh: ~2 đơn vị/kênh (playlistItems 1 + videos.list 1), tổng ~80–100 đơn vị/lần quét (rẻ hơn em từng nói). Hiển thị 4 bậc màu như VidIQ + cột view/giờ.

### Câu 13
**Hỏi:** Ngưỡng đưa video vào bảng "Video nổ bất thường" và baseline trung vị hay trung bình.
**Trả lời:** Anh **đồng ý theo hướng em đề xuất**: **mặc định từ 5x trở lên** (bậc tím + đỏ), có thanh lọc nâng lên 10x; baseline = **TRUNG VỊ** view của ~20 video dài gần nhất của kênh đó (loại chính video đó, loại Short); 4 bậc màu như VidIQ + cột view/giờ.

### Câu 14
**Hỏi:** Bố cục thanh điều khiển Title Trends (thị trường 1 hay nhiều, nơi lưu từ khoá, mốc thời gian).
**Trả lời:**
1. **Quét TỰ ĐỘNG 1 lần/ngày, ưu tiên mốc 1 NGÀY**, "tính theo công thức tính của YouTube" (em CHƯA hiểu rõ cụm này — cần hỏi lại). **Yêu cầu mới: làm thêm bảng "DashBoard"** thể hiện **TẤT CẢ thông báo lên màn hình chính**; anh hỏi "có được không".
2. **Từ khoá mặc định = TÊN NGÁCH**; nếu anh sửa và tìm theo từ khoá anh điền thì **ƯU TIÊN từ khoá anh điền**.
3. Mốc thời gian **1 ngày / 7 ngày / 28 ngày / 90 ngày: ĐÚNG**.
**Em trả lời anh:** Dashboard làm được (gom dữ liệu đã có: cảnh báo kênh, việc đăng quá hạn, video nổ, trend, đối thủ, lỗi kết nối/hạn mức); riêng chuông thông báo của YouTube Studio vẫn không có API nên không đưa vào được.
**Ghi chú quota:** quét tự động 1 ngày × nhiều (ngách, thị trường) ≈ 300 đơn vị/cặp → nếu quét cả 6 thị trường cho mọi ngách sẽ tốn nhiều; đề xuất chỉ tự quét các cặp (ngách, thị trường) mà kênh của anh đang dùng.

### Câu 15
**Hỏi:** Dashboard: thông báo gì, là trang đầu hay tab, đã đọc thì sao.
**Trả lời:**
1. **Tạm thời dùng đúng 6 loại em đề xuất:** (1) kênh cần xử lý/theo dõi; (2) việc đăng quá hạn/sắp đến hạn (video, bài cộng đồng); (3) kết quả quét tự động sáng nay (trend mới, video nổ); (4) đối thủ đăng video mới/có video nổ; (5) sub/view tăng-giảm bất thường; (6) cảnh báo hệ thống (mất OAuth, hết hạn mức, API lỗi).
2. **Dashboard là TRANG ĐẦU TIÊN khi mở app.**
3. **Thông báo đã đọc thì ẨN ĐI** (như chuông đỏ mất khi xem hết).
**Còn cần hỏi (em ước tính ~4 câu):** (a) "công thức tính của YouTube" nghĩa là gì; (b) phạm vi + giờ + mốc của quét tự động; (c) thế nào là "đã đọc" và đối thủ nào/sự kiện nào được báo; (d) thứ tự làm (làm gì trước).

### Câu 16
**Hỏi:** "Công thức tính của YouTube" nghĩa là gì.
**Trả lời (kèm ảnh 33 = một dòng video trong VidIQ):** Anh chọn **cách B**: xếp theo **TỔNG LƯỢT XEM cao nhất** trong khoảng thời gian (như YouTube xếp tìm kiếm theo lượt xem). **Vẫn thêm điểm nổ ở cuối dòng tiêu đề** như ảnh (huy hiệu màu ">100x") và hỏi **có hiển thị thêm VPH (view/giờ) được không**.
**Em trả lời:** được. VPH hiển thị dạng huy hiệu ("52 VPH"), điểm nổ hiển thị huy hiệu màu theo bậc (thêm bậc ">100x"). Không hiển thị nút "Remix" (của VidIQ).
**Lưu ý trung thực về VPH:** API YouTube chỉ cho TỔNG view, không cho view theo giờ của video người khác → lần quét đầu VPH = view ÷ số giờ từ lúc đăng (trung bình cả đời). Ở ảnh VidIQ, video 5 tháng tuổi 2,1 triệu view mà chỉ 52 VPH → họ dùng VPH GẦN ĐÂY (theo dõi nhiều lần). App làm được VPH gần đây cho video đã thấy ≥2 lần (nhờ quét tự động hằng ngày), lần đầu thì ghi rõ "VPH TB từ lúc đăng". Với mốc 1 ngày (video đăng trong 24h) hai loại VPH gần bằng nhau.

### Câu 17
**Hỏi:** Quét tự động: những cặp (ngách, thị trường) nào, giờ nào, mốc nào.
**Trả lời:** "Những cái này thì **sau này sẽ tính**." Anh quan tâm nhất là **hằng ngày CÓ BÁO CÁO cho anh**. Anh **bình thường chỉ làm 2–3 ngách**, không làm nhiều.
**Quyết định tạm (theo đề xuất của em, anh có thể đổi sau):** tự quét mỗi ngày 08:30 giờ VN, mốc 1 ngày, video dài, cho các cặp (ngách, thị trường) mà kênh chính của anh đang dùng; vì chỉ 2–3 ngách nên hạn mức 10.000/ngày đủ dư dả (khoảng 300 đơn vị/cặp).

### Câu 18
**Hỏi:** Báo cáo hằng ngày: nhận ở đâu, dạng nào, gồm những gì.
**Trả lời:** **Đầu tiên chỉ báo trên DASHBOARD thôi** (chưa cần Windows/Telegram/email/file). Dashboard là trang đầu tiên, có "Báo cáo sáng nay".
**Chưa nói:** ngắn hay đầy đủ; thứ tự ưu tiên trong báo cáo (em sẽ đề xuất mặc định: việc cần làm hôm nay → kênh của anh → trend/video nổ → đối thủ → hệ thống).

### Câu 19
**Hỏi:** Thế nào là "đã đọc"; có cần lịch sử; đối thủ được báo sự kiện nào.
**Trả lời:** **Xoá (ẩn) thông báo khi anh NHẤP VÀO đường dẫn của thông báo đó**, không cần "đọc hết". **Cần LỊCH SỬ lưu giữ lại thông tin.**
**Chưa trả lời:** sự kiện đối thủ nào được báo → **mặc định em áp dụng (đổi được sau):** báo video nổ ≥5x của đối thủ; đối thủ đăng video mới chỉ gom thành 1 dòng tóm tắt/ngày để khỏi nhiều thông báo.
**Thiết kế:** mỗi thông báo có đường dẫn tới đúng chỗ (kênh/video/tab); nhấp vào → chuyển tới đó và tự chuyển vào "Lịch sử thông báo" (lưu file trên máy, xem lại được, có lọc theo loại/ngày); mở Dashboard không tự đánh dấu đã đọc.

### Câu 20
**Hỏi:** (đang hỏi) Thứ tự làm; các tab Tìm Niche/Quét chủ đề/Quét kênh có làm thật đợt này không.


















### Bổ sung của anh (trước khi trả lời Câu 20)
- **Đối thủ:** anh cũng muốn được báo **1. VIDEO MỚI** của đối thủ.
- **Dashboard có hiển thị riêng: "Kênh của mình" và "Kênh đối thủ".**
**Thiết kế em đề xuất (chờ anh xác nhận):**
- Dashboard chia khu: **① Kênh của mình** (kênh cần xử lý/theo dõi, việc đăng quá hạn/sắp đến hạn, sub/view tăng-giảm bất thường); **② Kênh đối thủ** (video mới của đối thủ, video nổ ≥5x); **③ Trend thị trường** (kết quả quét sáng: tiêu đề/từ khoá trend mới); **④ Hệ thống** (mất OAuth, hết hạn mức, API lỗi). Cuối trang: Lịch sử thông báo.
- Video mới của đối thủ: **mỗi video một thông báo, gộp theo kênh trong ngày** (ví dụ "Đối thủ X đăng 2 video mới" bấm mở danh sách/video). Nhấp vào video → mở video và thông báo chuyển vào lịch sử.
- Chi phí: kiểm tra video mới của mỗi đối thủ ≈ 1 đơn vị/lần (playlist "uploads") → 50 đối thủ kiểm tra mỗi vài giờ vẫn rất rẻ.

### Câu 20 (nhắc lại, chưa trả lời)
**Hỏi:** (đang hỏi) Thứ tự làm; các tab Tìm Niche/Quét chủ đề/Quét kênh có làm thật đợt này không.


## ĐÃ LÀM THEO PHỎNG VẤN (21/09/2026) — anh nói "làm luôn để anh test, sau đó sửa tiếp"
**Phạm vi đợt này:** nền móng + Dashboard + Title Trends thật + đối thủ thật + quét tự động. **CHƯA làm (bàn sau khi xong Title Trends):** Tìm Niche, Quét chủ đề, Quét kênh (vẫn dữ liệu mẫu).
1. **Lưu dữ liệu ra FILE trên máy** (`app/data/`): `userdata.json` (ghim, ghi chú, lịch đăng, nháp, đánh dấu đã đăng… — thay localStorage, tự chuyển 1 lần), `library.json` (ngách → thị trường → từ khoá), `rivals.json` + `rival-snap.json` (đối thủ + ảnh chụp số liệu hằng ngày), `scans.json` (kết quả quét, giữ 6 giờ), `notifications.json` (thông báo + lịch sử), `quota.json` (hạn mức), `seen.json` (để tính VPH gần đây), `ai-cache.json` (bản dịch/phân loại AI, 30 ngày), `baseline-cache.json`. Ghi an toàn (file tạm rồi đổi tên); sao lưu `userdata.json` mỗi ngày vào `app/data/backup/`, giữ 14 bản.
2. **Thị trường cho từng kênh** (6 thị trường: Anh-US, Tây Ban Nha-ES, Bồ Đào Nha-BR, Nhật-JP, Hàn-KR, Việt-VN) đặt ngay trong bảng Quản lý Kênh (cột Chủ đề: ô ngách + ô thị trường) và ở Cài đặt.
3. **Title Trends thật:** thanh Ngách · Thị trường · Loại video (dài ≥3 phút / Short <3 phút) · Từ khoá (gợi ý YouTube theo thị trường; để trống = tên ngách, gõ = ưu tiên từ khoá gõ) · mốc 1/7/28/90 ngày · Quét. Kết quả: 15 tiêu đề nhiều view nhất (bấm mở video, dịch tiếng Việt nhỏ dưới tiêu đề, huy hiệu điểm nổ kiểu VidIQ + VPH, nút "+ Thêm đối thủ"); bảng từ khoá đang lên (≥3 video, ≥2 kênh, tăng so kỳ trước, view cao hơn mức chung); bảng công thức tiêu đề theo 3 thành phần ①②③ do AI phân loại; bảng video nổ ≥5x (lọc 10x). Xếp theo tổng lượt xem (cách B). Video dài = quét 2 nhóm 4–20 phút + trên 20 phút (Cách 2).
4. **Hạn mức:** đếm mọi lệnh gọi YouTube, hiển thị ở Cài đặt/Dashboard/thanh Quét; hết thì dừng và báo giờ có lại (0h giờ Thái Bình Dương ≈14h VN). Kết quả giữ 6 giờ để bấm lại không tốn. Ước tính mỗi lần quét ~470 đơn vị (video dài) / ~270 (Short).
5. **Đối thủ thật:** thêm từ kết quả quét hoặc dán link (@handle, /channel/UC…); theo dõi số liệu hằng ngày; kiểm tra video mới + video nổ ≥5x mỗi 3 giờ và lúc 08:30; đối thủ mới chỉ có lịch sử từ ngày thêm.
6. **Dashboard = trang đầu tiên:** 4 khu (Kênh của mình · Kênh đối thủ · Trend thị trường · Hệ thống). Nhấp thông báo = mở đúng chỗ + đã đọc (ẩn) + vào Lịch sử thông báo (lọc theo loại). Mở Dashboard KHÔNG tự đánh dấu đã đọc. Video mới của đối thủ gộp theo kênh/ngày. Loại thông báo: sức khoẻ kênh, việc đăng quá hạn, tăng/giảm bất thường, video mới/nổ của đối thủ, trend sáng nay, lỗi API/OAuth/hạn mức.
7. **Quét tự động 08:30 (giờ VN):** cho mỗi cặp (ngách, thị trường) mà kênh của anh đang dùng: mốc 1 ngày, video dài; đưa vào Dashboard mục Trend thị trường. Kênh cần có NGÁCH + THỊ TRƯỜNG thì mới được tự quét.
**Đã kiểm thử bằng YouTube/9router GIẢ** (định dạng bám sát thật, có SSE, mã JSON trong ```); CHƯA thử với YouTube thật và 9router thật cho phần quét → lần đầu có thể lệch, anh gửi ảnh nếu lỗi.


### Bổ sung (21/09, anh nhắn khi em đang làm): "trong phần quét title thì ưu tiên quét theo ngôn ngữ thị trường chọn"
Nguyên nhân anh thấy tiêu đề Tamil/Hàn/Nga khi chọn Tiếng Anh: tham số relevanceLanguage của YouTube chỉ là GỢI Ý. **Đã sửa:** sau khi lấy video, app **nhận diện ngôn ngữ từng tiêu đề** (chữ viết: Hàn/Nhật/Nga/Tamil…; dấu tiếng Việt; từ dừng Anh/Tây Ban Nha/Bồ Đào Nha…; kèm ngôn ngữ người đăng khai báo) và CHỈ GIỮ video đúng ngôn ngữ của thị trường đã chọn, cả cho 15 tiêu đề lẫn 3 bảng phân tích. Dòng thông tin kết quả ghi "đã loại n video khác ngôn ngữ". Khoá bộ nhớ đệm đổi sang v2 nên kết quả cũ lẫn ngôn ngữ không bị dùng lại. Hạn chế: mỗi lần tìm chỉ lấy tối đa 50 video/nhóm nên lọc xong có thể còn ít — nếu cần em thêm trang kết quả thứ 2 (+100 đơn vị/nhóm).


### Kênh nằm trên VPS (21/09): thêm luồng 'dán địa chỉ callback' (Cài đặt -> Kênh đã kết nối -> Kênh nằm trên máy khác/VPS): Sao chép link Google -> mở trên VPS -> copy địa chỉ trang lỗi localhost -> dán vào app -> Hoàn tất. Đã kiểm thử bằng Google giả. Hướng dẫn chi tiết ở cuối file 'Huong dan lay OAuth.txt'.


## MỤC TIÊU LỚN ĐƯỢC LÀM RÕ (21/09/2026) — quy mô 100 đến 1000 kênh
Anh nói: 3 cách em đề xuất (theo dõi công khai / chạy app riêng trên VPS / proxy) **đều không đúng ý**. **Mục đích làm hệ thống: quản lý các kênh anh ĐANG VẬN HÀNH; sẽ có lúc lên tới 100 hoặc 1000 kênh; anh không thể theo dõi từng kênh, nên HỆ THỐNG phải quản lý giúp anh** (chủ động báo vấn đề, anh chỉ xem những gì cần xử lý).
**Hệ quả em ghi nhận (chờ anh xác nhận thông tin):**
- OAuth từng kênh KHÔNG mở rộng tới 100–1000 kênh nếu app còn Testing/chưa xác minh: giới hạn 100 "người dùng" (tài khoản Google) suốt vòng đời app + khoá hết hạn 7 ngày ở Testing; cần biết các kênh nằm dưới bao nhiêu tài khoản Google.
- Hạn mức YouTube 10.000/ngày không đủ nếu hỏi từng kênh mỗi giờ: cần lấy theo lô (50 kênh/lần), dùng RSS/WebSub (không tốn hạn mức) cho video mới, xin tăng hạn mức chính thức khi lên quy mô.
- Lưu trữ JSON và máy cá nhân không đủ: cần cơ sở dữ liệu (SQLite), chạy nền 24/7 trên máy chủ, có đăng nhập, danh sách có tìm kiếm/lọc/nhóm, cảnh báo theo ngoại lệ.
### Câu hỏi đang mở
Các kênh của anh nằm dưới bao nhiêu tài khoản Google (Gmail)? Vận hành thế nào (GPM/VPS/proxy)? "Quản lý giúp anh" cụ thể là báo những vấn đề gì?


### Trả lời của anh (21/09): cách tổ chức kênh
- **Mỗi Gmail chỉ có 1 kênh Brand** (không làm nhiều kênh trên 1 Gmail) → 1000 kênh ≈ 1000 tài khoản Google.
- **Dự án thất bại thì anh xoá kênh trong vòng 30 ngày theo dõi** → kênh ra vào liên tục; mỗi kênh có "cửa sổ theo dõi 30 ngày" rồi giữ hoặc bỏ.
**Hệ quả em ghi nhận:**
- OAuth từng kênh KHÔNG khả thi ở quy mô này: giới hạn 100 tài khoản Google tính **suốt vòng đời app (kể cả tài khoản đã xoá)** — ảnh Google Cloud của anh ghi rõ; mỗi kênh mới đã tiêu hao 1 suất; cần xác minh app mới vượt.
- Đề xuất kiến trúc 2 tầng: **Tầng 1 (mọi kênh): theo dõi công khai bằng khoá API + RSS** (không cần OAuth, không giới hạn 100, không khoá hết hạn, không gắn tài khoản với project); **Tầng 2 (OAuth): chỉ cho kênh đã qua 30 ngày và đáng giữ**, cần số liệu riêng tư (giờ xem…).
- Cần thêm khái niệm "DỰ ÁN/KÊNH có vòng đời 30 ngày": ngày bắt đầu, trạng thái (đang thử 30 ngày / giữ / bỏ), gợi ý giữ hay bỏ dựa trên chỉ số, nhập hàng loạt danh sách link, xoá = thu hồi quyền + xoá dữ liệu.
- YouTube API KHÔNG có: gậy cảnh cáo, claim bản quyền, trạng thái kiếm tiền, chuông Studio. CÓ (công khai): kênh bị xoá/khoá (tra cứu không thấy), video bị gỡ.
### Câu hỏi đang mở
Chỉ số nào quyết định một kênh "thành công hay thất bại" sau 30 ngày (sub, view, số video, giờ xem/điều kiện kiếm tiền…), và ngưỡng cụ thể?


### Nút XOÁ THEO DÕI (21/09, anh yêu cầu cho cả Kênh của mình và Kênh đối thủ)
Có ở: bảng Quản lý Kênh (cột cuối, biểu tượng thùng rác), trang chi tiết kênh (nút 'Xoá theo dõi'), bảng Kênh đối thủ (dấu ✕), Cài đặt -> Kênh đã kết nối. Luôn hỏi xác nhận. Kênh của mình: thu hồi quyền Google + xoá số liệu + xoá lịch đăng/ghi chú/ghim/nháp/hồ sơ kênh. Đối thủ: dừng theo dõi + xoá số liệu. Lịch sử thông báo cũ được giữ. Xoá kênh thật cuối cùng thì app quay về dữ liệu mẫu. Đã thử bằng Google giả.


### Nhiều bộ OAuth + thông tin vận hành kênh (21/09, anh yêu cầu dự phòng)
Mỗi bộ = 1 project Google Cloud; mỗi kênh nhớ bộ đã dùng (clientKey); bộ đếm 'đã dùng X/100 suất' tính cả kênh đã xoá; chọn bộ khi kết nối (mặc định bộ còn nhiều suất nhất); xoá bộ chỉ khi không còn kênh. Dữ liệu cũ (1 bộ) tự chuyển thành 'Bộ 1'. Thêm 2 ô cho từng kênh: Gmail và 'Nơi vận hành (VPS/proxy/GPM)', hiện dưới tên kênh + tìm được. Cảnh báo rủi ro chính sách khi dùng nhiều project đã nói với anh. Đã thử bằng Google giả.

## Kết nối kênh an toàn (không kéo Gmail về máy này)
- Quy định của anh: Gmail của kênh không được đổi nơi đăng nhập. Màn "chọn tài khoản" của Google chỉ liệt kê Gmail đã đăng nhập sẵn trong trình duyệt được mở ra; app không tự đăng nhập Gmail nào.
- Đã đổi: nút "+ Kết nối kênh" KHÔNG tự mở trình duyệt của máy này nữa; hiện hộp hướng dẫn với 2 nút copy (link cho hồ sơ GPM trên máy này / link Google cho VPS). "Mở trên máy này" chỉ nằm trong mục thu gọn, có hỏi xác nhận.
- Ô "Gmail dự kiến" (login_hint) để Google chọn sẵn đúng tài khoản.
- Chưa làm (đề xuất): xác minh Gmail thực tế bằng scope userinfo.email để từ chối kết nối nhầm tài khoản.

## Doanh thu (21/09/2026)
- Yêu cầu: hiện doanh thu trong bảng Quản lý Kênh và doanh thu theo từng video khi bấm vào kênh.
- Đã làm: xin thêm quyền yt-analytics-monetary.readonly; đồng bộ doanh thu ước tính (USD) theo ngày (90 ngày) và theo video (28 ngày + tổng từ 10/2015). Bảng kênh có cột "Doanh thu 28 ngày" (kèm 7 ngày); trang chi tiết có ô doanh thu và 2 cột theo video.
- Điều kiện: thêm quyền trong Google Cloud (Data Access) + kênh bật kiếm tiền (YPP) + MỖI KÊNH kết nối lại một lần để cấp quyền mới. Kênh chưa cấp quyền hiện "Cần kết nối lại"; kênh chưa YPP hiện "Chưa có".
- Số ước tính, trễ 1–2 ngày, có thể lệch YouTube Studio. Mới kiểm thử bằng Google giả, chưa thử với kênh có doanh thu thật.

## Bảng video + trang chi tiết video (21/09/2026)
- Bảng video (kênh thật): Video | Lượt xem | Bình luận | Thời lượng xem (tổng giờ xem từ trước tới nay) | Doanh thu tổng | Ngày đăng. Bấm dòng để mở trang video.
- Trang video (#/video/<kênh>/<video>, lấy khi mở, nhớ 10 phút): số tổng (lượt xem, thời gian xem, thời lượng TB, % xem TB, like, bình luận, chia sẻ, sub, doanh thu + RPM), biểu đồ theo ngày (lượt xem, thời gian xem, sub, doanh thu), giữ chân người xem, nguồn truy cập, từ khoá tìm kiếm, quốc gia, thiết bị, tuổi/giới tính. Khoảng: 28 ngày / 90 ngày / toàn thời gian.
- Mới thử bằng Google giả; chưa thử với dữ liệu Analytics thật (đặc biệt: từ khoá tìm kiếm, tuổi/giới tính, giữ chân có thể trống với video ít lượt xem).

## RPM và % xem TB (21/09/2026)
- Trang kênh: ô "Giờ xem (28 ngày)" đổi thành "RPM toàn kênh (28 ngày)" (kèm RPM 7 ngày). RPM = doanh thu ước tính / lượt xem x 1.000, cùng các ngày có doanh thu.
- Bảng video (kênh thật) thêm cột "% xem TB" và "RPM" (doanh thu tổng / lượt xem x 1.000). Thứ tự: Video | Lượt xem | Bình luận | Thời lượng xem | % xem TB | Doanh thu tổng | RPM | Ngày đăng.
- Đã kiểm tra với kênh thật Tribus Salvajes: doanh thu 28 ngày $19,26, RPM 28 ngày $0,22; % xem TB và thời lượng xem theo video đã có số.

## Trang video kiểu YouTube Studio (21/09/2026)
- Bố cục theo Studio: tab Tổng quan / Phạm vi tiếp cận / Mức độ tương tác / Đối tượng người xem / Doanh thu; chọn khoảng 28 ngày / 90 ngày / từ khi xuất bản. Giữ giao diện tối của app.
- Có: thẻ chỉ số bấm để đổi biểu đồ, cách người xem tìm thấy video (tab Tổng quan/Bên ngoài/Tìm kiếm/Video đề xuất/Danh sách phát), giữ chân người xem (trục thời gian thật), độ tuổi + giới tính, khu vực (Xem thêm), loại thiết bị (thanh chồng), doanh thu chi tiết (RPM, CPM, quảng cáo).
- KHÔNG lấy được qua API (đã thử với kênh thật): lượt hiển thị hình thu nhỏ, CTR, người xem riêng biệt, ngôn ngữ phụ đề (không có trong API), chi tiết từng danh sách phát. Xem trong YouTube Studio.
- Trong API, nguồn "SUBSCRIBER" = "Các tính năng duyệt xem" của Studio; "RELATED_VIDEO" = video đề xuất.

## Dashboard = Bản tin buổi sáng (21/09/2026)
- Thanh KPI: doanh thu 7 ngày (so tuần trước), RPM 28 ngày, lượt xem 7 ngày, sub 7 ngày, số kênh cần chú ý. Lọc theo ngách.
- Cần xử lý ngay (thông báo cũ + mới): doanh thu tụt mạnh (>=40%), video bị từ chối/lỗi tải, quyền kênh sắp hết hạn (đếm ngược 7 ngày khi dự án còn Testing; nút "Đánh dấu đã Publish" trong Cài đặt để tắt).
- Video của mình đang bứt phá: tăng >=+50% so tuần trước (>=100 view) hoặc video mới (<=14 ngày) vượt mức thường x2.
- Đối thủ đang nổ cùng từ khoá: ghép từ khoá trong tiêu đề video mạnh của mình với video đối thủ đang nổ 14 ngày.
- Xếp hạng kênh (sắp theo doanh thu/RPM/view/sub/tăng trưởng; >10 kênh thì hiện 5 tốt nhất + 5 kém nhất); Lịch hôm nay (việc Trạm đăng bài + video hẹn giờ 48h).
- Chưa làm: "Ý tưởng hôm nay" (AI gợi ý tiêu đề) và đẩy thông báo ra ngoài (Telegram) — chờ anh đồng ý.

## Bình luận chưa trả lời theo video (21/09/2026)
- Bảng video (kênh thật): bấm dòng = trang phân tích video; bấm số bình luận (💬) = danh sách bình luận CHƯA được chủ kênh trả lời (bỏ bình luận do chính kênh viết + bình luận đã có phản hồi của kênh). Có link mở đúng bình luận trên YouTube để trả lời.
- Đọc bằng KHOÁ API (công khai), KHÔNG dùng OAuth: đọc bình luận qua OAuth đòi quyền youtube.force-ssl (quyền quản lý kênh, rộng). Quét tối đa 300 bình luận gần nhất, tốn 1 đơn vị hạn mức mỗi lượt gọi.
- Giới hạn: bình luận đang chờ duyệt/bị ẩn (held for review) không hiện vì không công khai.

## Cột Tương tác = bình luận chưa trả lời của cả kênh (21/09/2026)
- Bảng Quản lý Kênh: cột "Tương tác" hiện lại, giá trị = số bình luận CHƯA trả lời của cả kênh (quét bằng khoá API, tối đa 300 bình luận gần nhất; tự quét khi đồng bộ, tối đa mỗi 20 giờ/kênh; nút "Quét lại" trong popup).
- Bấm vào số -> popup: mỗi bình luận có Bản gốc | Dịch tiếng Việt | Gợi ý trả lời (ngôn ngữ của kênh = Thị trường đã đặt) | Dịch câu trả lời sang tiếng Việt. Dịch/soạn bằng AI 9router (tối đa 10 bình luận/lần, 8 bình luận đầu tự dịch, nhớ kết quả trong app/data/comment-ai.json). Có nút Copy câu trả lời + link mở đúng bình luận trên YouTube.
- App KHÔNG đăng trả lời thay anh (quyền chỉ đọc; đăng cần quyền youtube.force-ssl rộng).
- Spam/link/quảng cáo: AI để trống câu trả lời và ghi "Bỏ qua".

## Bảo mật (21/09/2026) — đã lưu, CHƯA nâng cấp, chờ anh yêu cầu
- Hiện trạng: quyền OAuth chỉ đọc; server chỉ nghe 127.0.0.1; chìa khoá lưu chữ thường trong app/data/channels.json + settings.json (rủi ro chính).
- 4 nâng cấp chờ duyệt: (1) khoá quyền file chỉ cho tài khoản Windows của anh, (2) mã hoá chìa khoá bằng DPAPI, (3) chặn DNS rebinding (kiểm tra Host), (4) trang "Quyền đang cấp" + nút thu hồi.
- Chi tiết nằm trong bộ nhớ của Claude: quanly-kenh-security.

## Tên miền để Publish OAuth (21/09/2026)
- Anh có tên miền sonsaymedia.cloud (NS: hoian.vclouddns.com, danang.vclouddns.com; chưa có bản ghi/trang web lúc kiểm tra).
- Đã soạn website\index.html + website\privacy.html (tiếng Anh, đúng cách app hoạt động, có câu Limited Use) và file HUONG DAN TEN MIEN VA PUBLISH.txt (Cloudflare Pages -> www.sonsaymedia.cloud -> Search Console TXT -> điền Branding -> Publish).
- Việc còn lại của anh: thay REPLACE_WITH_CONTACT_EMAIL trong privacy.html, đưa trang lên, xác minh tên miền, điền Branding, bấm Publish; rồi bấm "Đánh dấu đã Publish" trong app và kết nối lại kênh.
- Đã sửa: Ngắt kết nối kênh giờ xoá luôn bản dịch/gợi ý trả lời bình luận đã nhớ (khớp chính sách quyền riêng tư).

## Tìm Niche / Quét chủ đề / Quét kênh THẬT + Trạm đăng bài (21-22/09/2026, làm qua đêm)
- Ba tab của YouTube Channel Tracker chạy bằng dữ liệu YouTube thật khi đã có khoá API (chưa có khoá thì vẫn hiện bản mẫu cũ).
  * Tìm Niche (app/explore.js nicheScan): nhập tối đa 6 từ khoá + thị trường + 7/28/90 ngày. Mỗi từ khoá ~204 đơn vị hạn mức, nhớ 24 giờ. Điểm cơ hội 0-100 = 50% tỉ lệ video "kênh nhỏ (<20K sub) mà view >= 10x sub" + 30% mức ít kênh lớn (>200K) chiếm chỗ + 20% view trung vị. Có nút "Quét chủ đề" và gợi ý từ khoá.
  * Quét chủ đề: dùng scan.js có sẵn (~470 đơn vị, Short ~270; nhớ 6 giờ): top video, video nổ so mức thường của kênh, tốc độ view, cụm từ khoá đang lên, dịch tiêu đề bằng AI, từ khoá liên quan.
  * Quét kênh (explore.js scanChannel): dán link kênh -> 100 video mới nhất (~6 đơn vị): nhịp đăng, view trung vị, top 5 video, công thức tiêu đề, giờ/ngày đăng hiệu quả (giờ VN, chỉ video >10 ngày, mỗi khung >=2 video), nút Nạp làm đối thủ.
- Trạm đăng bài: "Giờ đối thủ" (mẫu) -> "Giờ vàng (giờ VN)" tính từ video thật của kênh + đối thủ cùng ngách; việc "đăng video" tự đánh dấu "Đã đăng (tự phát hiện)" khi video dài mới xuất hiện trên YouTube (sau lần đồng bộ, tối đa ~1 giờ); hiện video đã hẹn giờ. Bài cộng đồng vẫn đánh dấu tay (YouTube không có API cho bài cộng đồng). App vẫn KHÔNG đăng thay.
- Kiểm tra: đã thử trên dữ liệu thật (quét kênh, chấm điểm ngách, quét chủ đề, giờ vàng); 2 agent độc lập (rà code + thử API) tìm ra ~25 điểm, đã sửa các điểm quan trọng (trạng thái popup bình luận khi đổi kênh, AI bỏ sót thì không coi là spam, giữ lựa chọn ở ô chọn, chặn quét chồng, tách Short khỏi tự phát hiện, khử từ khoá trùng, trả kết quả một phần khi hết hạn mức, lùi 3 giờ khi quét bình luận lỗi, sửa lỗi chữ có dấu của gợi ý từ khoá).
- Còn tồn (nhỏ): lỗi nhập liệu trả mã 502 thay vì 400; đọc bình luận chưa kiểm tra hạn mức trước khi gọi; công thức tiêu đề trong Quét kênh viết cho tiếng Anh nên kênh tiếng Tây Ban Nha hầu như ra 0.

## Học từ tool YT DNA (D:\SONSAY MEDIA\TOOL\TOOL TREND) — 22/09/2026
- Nguyên nhân "công thức tiêu đề ra 0" ở Quét kênh: dùng 6 mẫu regex viết cho TIẾNG ANH (Why/How/What...) nên tiêu đề tiếng Tây Ban Nha gần như không khớp. Tool YT DNA không dùng regex: nhờ AI bóc tách MỖI tiêu đề theo 3 thành phần (từ khoá/vấn đề — khoảng trống tò mò/tâm lý — bối cảnh/đóng gói) và rút "khuôn kênh" (Title DNA: từ huyệt chủ đạo, vị trí từ khoá, ký tự đặc biệt, kiểu viết hoa, giọng điệu, khung xương tiêu đề).
- Đã áp dụng: (1) Quét kênh dùng AI bóc tách 20 tiêu đề nhiều view nhất + dịch Việt + khuôn kênh (thay cho regex); (2) tự sửa chính tả từ khoá trước khi quét (Tìm Niche, Quét chủ đề) và báo "đã sửa"; (3) nút "Gợi ý thêm nhiều ý tưởng" kiểu alphabet-soup (a–z + từ hỏi), miễn phí, tới 60 gợi ý.
- Chưa áp dụng (đề xuất): tìm kiếm trộn relevance + viewCount (giống thanh tìm kiếm YouTube, thêm ~100 đơn vị/lượt); "Tái tạo tiêu đề theo khuôn kênh" từ tiêu đề đối thủ; lưu khuôn (Title DNA) theo kênh để dùng lại; chống trùng "đã dùng/đã quét" theo từ khoá; nhận diện Short chính xác bằng /shorts/<id>.

## Đo tiềm năng từ khoá 7/14/28 ngày (22/09/2026)
- Theo yêu cầu: KHÔNG viết lại tiêu đề theo khuôn; chỉ dùng bóc tách 3 thành phần để LỌC từ khoá rồi ĐO xem từ khoá đó có đang lên/xuống trong 7/14/28 ngày không.
- API mới /api/keyword/pulse (explore.js keywordPulse): 1 lượt gọi order=date lấy tối đa 100 video trong 56 ngày gần nhất (đúng ngôn ngữ thị trường), rồi tính cục bộ (không tốn thêm hạn mức) cho từng mốc 7/14/28 ngày: số video kỳ này vs kỳ liền trước (cùng độ dài) + view/ngày trung bình (chuẩn hoá theo tuổi video) kỳ này vs kỳ trước. Kết luận Đang lên/Ổn định/Đang giảm/Chưa đủ dữ liệu. Nhớ 24 giờ. ~201 đơn vị (Short ~101).
- Gắn nút "📈 Đo tiềm năng" vào 3 nơi đã có sẵn danh sách từ khoá: bảng "Cụm từ khoá đang lên" (Quét chủ đề), "Cụm từ khoá lặp lại" (Quét kênh, dùng đúng thị trường + loại video của kênh), và cột thao tác của Tìm Niche.
- Đã thử thật: "tribu hadzabe" ra "Đang lên" (video/ngày và view/ngày đều tăng mạnh cả 3 mốc).

## Nút "Ngừng đăng bài" cho kênh (22/09/2026)
- Kênh không còn đăng nhưng vẫn muốn theo dõi số liệu: nút ⏸/▶ ở cột thao tác bảng Quản lý Kênh, và nút trong trang chi tiết kênh + trang Trạm đăng bài (mục "Kênh đã ngừng đăng").
- Lưu server-side (connections[id].noPost, API /api/channels/nopost). Khi bật: tắt cảnh báo "X ngày chưa có video mới" trong Tình trạng kênh/Dashboard; loại khỏi Trạm đăng bài, "Hôm nay đăng", lịch tháng và Lịch từng kênh (vẫn hiện tên trong mục ngừng đăng để bật lại). KHÔNG tắt cảnh báo lượt xem giảm/SUB không tăng/doanh thu tụt (vẫn coi là số liệu đáng theo dõi).
- Đã thử thật trên kênh Tribus Salvajes: bật -> hết cảnh báo + biến mất khỏi lịch hôm nay/lịch tháng; bật lại -> trở về bình thường. Đã trả kênh về trạng thái ban đầu (noPost=false) sau khi thử.

## Thông báo: tắt "đối thủ đăng video mới", thêm "video Title Trends đang lên" (22/09/2026)
- rivals.js: bỏ thông báo "X đăng Y video mới" (notifUpsert key rivalnew:...). Vẫn giữ đếm video mới cho dòng log "Đã kiểm tra N đối thủ · M video mới" và vẫn kiểm tra video nổ (rivalhit) như cũ — không đổi ngưỡng ≥5x.
- server.js (bước quét Title Trends tự động 08:30): ngoài thông báo tóm tắt theo ngách/thị trường (trend:...) đã có, thêm thông báo RIÊNG cho từng video nổ ≥5x tìm được (trendhit:<videoId>, tối đa 5 video/lần quét/cặp ngách, mỗi video chỉ báo một lần), link thẳng tới video.
- Đã thử thật bằng /api/update/run 2 lần sau khi sửa: xác nhận không còn tạo rivalnew mới dù có video mới. Đường trendhit chạy không lỗi nhưng chưa có ca thật để xem (từ khoá "Hazzabe"/es và "tribu hadzabe"/es trong mốc 24 giờ đều ra 0 video — chưa đủ dữ liệu để thấy ví dụ thật, sẽ tự hiện khi có video nổ).
- Nhân tiện: đã đặt từ khoá quét cho ngách "Hazzabe" · Tiếng Tây Ban Nha thành "tribu hadzabe" (trước đó mặc định là chữ "Hazzabe" — không phải từ khoá tìm kiếm thật).

## Lịch đăng theo thứ trong tuần (22/09/2026)
- Thêm kiểu lặp lại thứ 2 bên cạnh "Mỗi N ngày": "Theo thứ trong tuần" — chọn nhiều thứ (T2..CN) bằng nút bấm, không cần ngày bắt đầu.
- sched[id] thêm field mode ('interval'|'weekday') và weekdays (mảng số theo Date.getDay(), 0=CN). Đổi tab trong form giữ nguyên giờ đăng/bài cộng đồng đã nhập (đọc lại form hiện tại rồi mở lại modal).
- postsOn(), bảng "Lịch từng kênh", Trạm đăng bài, lịch tháng đều đọc đúng theo mode.
- Đã thử thật: chọn T2,T4,T6,CN cho Carjung Code, đối chiếu từng ngày trong lịch tháng khớp đúng thứ. Lưu ý: đây là dữ liệu thử, Carjung Code hiện đang ở lịch "T2, T4, T6, CN, 18:00" do em test — anh mở "+ sửa lịch đăng" để đổi lại đúng ý nếu cần.
