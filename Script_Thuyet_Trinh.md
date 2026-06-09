# 🎤 Script Thuyết Trình — Assessment 01 Checkpoint (Week 4)
## Smart Parking System | Leader Script | 20-25 phút

---

## SLIDE 1-2: Mở đầu (~1 phút)

> Xin chào thầy và các bạn. Hôm nay nhóm mình sẽ trình bày Assessment 01 — Checkpoint tuần 4 cho dự án **Smart Parking System**.
>
> Mình sẽ đi qua lần lượt 6 checkpoint: từ giới thiệu đề tài, công nghệ, actors, phạm vi hệ thống, các luồng nghiệp vụ chính, business rules, và cuối cùng là data modeling.

---

## SLIDE 3: Checkpoint 1 — Group & Assignment Topic (~2 phút)

> **Vấn đề thực tế** mà nhóm mình nhắm tới là: việc quản lý bãi đỗ xe đa tầng hiện nay vẫn còn rất thủ công — soát vé giấy, ghi sổ tay, không kiểm soát được sức chứa realtime, và xử lý sự cố thì chậm trễ.
>
> **Giải pháp** của nhóm là xây dựng một nền tảng web **Smart Parking System** — số hóa toàn bộ quy trình: từ check-in, check-out, đặt chỗ trước, đăng ký vé tháng, cho đến giám sát an ninh và mô phỏng 3D bãi đỗ xe.
>
> Hệ thống phục vụ **5 nhóm người dùng**: Admin, Manager, Staff, Driver và Security — mỗi role có Dashboard riêng, phân quyền rõ ràng.
>
> Giá trị cốt lõi là: **vận hành nhanh hơn, tính phí chính xác, giám sát realtime, và kiểm soát an ninh tốt hơn**.

---

## SLIDE 4: Checkpoint 2 — Technologies (~2 phút)

> Về công nghệ, nhóm chọn stack khá sát với thực tế doanh nghiệp. Mời thầy xem bảng trên slide, em sẽ đi qua từng layer.
>
> **Backend** — Java 17 với Spring Boot 3, kết hợp Spring Security và Spring Data JPA. Đây là stack phổ biến nhất để xây REST API trong doanh nghiệp.
>
> **Frontend** — React 18 với Vite cho tốc độ build nhanh. React Router điều hướng giữa 5 Dashboard theo role.
>
> **Database** — PostgreSQL cho production, H2 cho development để team dev nhanh không cần cài DB.
>
> **Cache / Pub-Sub** — **Redis 7** dùng cho 2 việc: Pub/Sub broadcast cảnh báo SOS khẩn cấp tới tất cả Dashboard realtime, và cache danh sách đen biển số để tra cứu dưới 1 mili-giây khi xe vào cổng.
>
> **Auth** — JWT token kết hợp BCrypt hash password, đảm bảo xác thực và phân quyền theo role.
>
> **AI / OCR** — **Tesseract.js v4** chạy trực tiếp trên trình duyệt qua CDN. Staff chụp camera nhận diện biển số xe tự động, không cần gõ tay — đây là điểm nhấn AI của nhóm.
>
> **Realtime** — **WebSocket** kết hợp **Redis Pub/Sub** để đồng bộ cảnh báo SOS, duyệt barrier, và thông báo blacklist giữa tất cả các server instance.
>
> **DevOps** — **Docker** để container hóa môi trường PostgreSQL + Redis, đảm bảo mọi thành viên chạy giống nhau. **GitHub** để quản lý source code và phối hợp nhóm.
>
> **3D / UI** — **Three.js** cho Digital Twin mô phỏng 3D bãi đỗ xe, và **GSAP** cho animation mượt mà.
>
> Tổng thể là kiến trúc **Monolithic REST API + React SPA** với Redis cho real-time messaging và Tesseract.js cho AI OCR — phù hợp quy mô đồ án nhưng vẫn đúng chuẩn software architecture thực tế.

---

## SLIDE 5: Checkpoint 3 — Actors & Features (~3 phút)

> Hệ thống có **5 actors** với trách nhiệm tách biệt rõ ràng:
>
> **Admin** — quản trị toàn bộ: users, zones, cổng, bảng giá, cấu hình hệ thống. Là người duy nhất có quyền CRUD mọi thứ.
>
> **Manager** — giám sát vận hành: xem dashboard realtime, báo cáo doanh thu, và đặc biệt là **hậu kiểm** các sự cố mà Security đã xử lý.
>
> **Staff** — nhân viên tại chỗ: thực hiện check-in, check-out xe, tra cứu phiên gửi. Đây là role tương tác trực tiếp nhất với khách hàng.
>
> **Driver** — tài xế, khách hàng: xem phiên gửi xe, đặt chỗ trước, đăng ký vé tháng/quý/năm, và quản lý biển số xe cá nhân.
>
> **Security** — bảo vệ: đây là role mà nhóm đầu tư nhiều tính năng đột phá nhất. Ngoài giám sát cổng và lập biên bản cơ bản, Security còn có 4 tính năng nâng cao:
> - Tuần tra kỹ thuật số — quét QR phân khu và quét biển số đối soát
> - Duyệt mở barrier từ xa qua WebSocket khi Staff gặp sự cố
> - Kích hoạt SOS khẩn cấp — mở toàn bộ barrier khi cháy nổ
> - Quản lý danh sách đen biển số xe
>
> Tổng cộng hệ thống có **34 features** phân bổ đều cho 5 roles.

---

## SLIDE 6: Checkpoint 4 — Scope & Context Diagram (~2 phút)

> Nhìn vào Context Diagram, hệ thống Smart Parking nằm ở trung tâm, tương tác với 5 actors bên ngoài và 1 database PostgreSQL.
>
> Mỗi actor gửi input khác nhau vào hệ thống: Staff gửi thông tin check-in, Driver gửi yêu cầu đặt chỗ, Security gửi báo cáo sự cố... Hệ thống xử lý và trả kết quả tương ứng.
>
> Điểm đáng chú ý là hệ thống có **real-time communication** qua WebSocket — ví dụ khi Security bấm SOS, cảnh báo sẽ broadcast tới tất cả Dashboard cùng lúc. Đây không chỉ là request-response đơn giản.

---

## SLIDE 7-8: Checkpoint 5 — Main Flows & Swimlane (~6 phút)

> Hệ thống có **3 luồng nghiệp vụ chính**:

### Flow 1: Check-in / Check-out (nói ~2 phút)

> Flow quan trọng nhất. Khi xe đến bãi:
>
> **Bước 1** — Staff nhập biển số bằng 1 trong 3 cách: gõ thủ công, quét mã QR, hoặc dùng **AI OCR Tesseract.js** chụp camera nhận diện biển số tự động. Sau đó chọn zone và loại xe.
> **Bước 2** — Hệ thống kiểm tra zone còn chỗ không, nếu còn thì tạo phiên gửi xe, tăng currentCount lên 1, và trả mã vé kèm QR code.
> **Bước 3** — Mở barrier cho xe vào.
>
> Khi xe ra:
> **Bước 4** — Staff nhập biển số, hệ thống tìm phiên đang hoạt động.
> **Bước 5** — Tính phí tự động dựa trên pricing rules: thời gian đỗ nhân giá theo giờ, trừ phút miễn phí đầu tiên.
> **Bước 6** — Cập nhật session thành COMPLETED, giảm currentCount, mở barrier cho xe ra.
>
> Toàn bộ tự động, Staff chỉ cần nhập biển số.

### Flow 2: Parking Pass (nói ~2 phút)

> Driver muốn đăng ký vé tháng/quý/năm:
>
> **Bước 1** — Vào tab "Hồ sơ & hội viên", hệ thống tải danh sách gói từ bảng pricing rules.
> **Bước 2** — Chọn loại xe và gói. Hệ thống tính phí: gói tháng là giá gốc, gói quý nhân 3, gói năm nhân 12 rồi giảm 10%.
> **Bước 3** — Nhập biển số, xác nhận. Hệ thống tạo vé với trạng thái ACTIVE và ngày hết hạn.
>
> Tất cả dữ liệu giá đều lấy từ database, không hardcode.

### Flow 3: Incident Handling (nói ~2 phút)

> Khi Security phát hiện sự cố — ví dụ khách mất vé:
>
> **Bước 1** — Security chọn loại sự cố: mất vé, sai biển số, quá giờ, đỗ sai khu, hoặc chưa thanh toán.
> **Bước 2** — Nhập mô tả chi tiết, hệ thống lưu vào bảng exception logs.
> **Bước 3** — Nếu cần, Security mở barrier khẩn cấp cho xe ra.
> **Bước 4** — Sau đó Manager sẽ hậu kiểm qua Dashboard để đánh giá cách xử lý.
>
> Security có quyền **tự quyết** tại chỗ, Manager chỉ review sau — đảm bảo xử lý nhanh.

---

## SLIDE 9: Business Rules (~2 phút)

> Một số business rules quan trọng mà nhóm đã định nghĩa:
>
> **Thứ nhất** — Sức chứa zone: chỗ trống bằng capacity trừ số xe đang đỗ trừ số chỗ đã đặt. Không cho check-in khi hết chỗ.
>
> **Thứ hai** — Tính phí có phút miễn phí đầu: xe máy và ô tô được 15 phút miễn phí, xe đạp 30 phút. Sau đó tính theo giờ.
>
> **Thứ ba** — Vé gửi xe: tháng là giá gốc, quý nhân 3, năm nhân 12 rồi giảm 10% — khuyến khích đăng ký dài hạn.
>
> **Thứ tư** — Phân quyền: JWT token chứa role, mỗi API endpoint kiểm tra quyền. Driver không thể truy cập API của Admin.
>
> **Thứ năm** — SOS phải nhấn giữ 3 giây để kích hoạt, tránh bấm nhầm. Và chỉ Manager hoặc Admin mới có quyền tắt SOS.

---

## SLIDE 10-11: Checkpoint 6 — Data Modeling (~4 phút)

### Conceptual Data Model (~2 phút)

> Ở mức khái niệm, hệ thống có **14 thực thể** chia thành 4 nhóm:
>
> **Nhóm hạ tầng**: Building chứa nhiều Floor, mỗi Floor chia thành nhiều Zone, mỗi Zone dành cho 1 loại xe. Building có nhiều Gate.
>
> **Nhóm nghiệp vụ**: Parking Session là bảng trung tâm — liên kết tới Zone, Gate, Vehicle Type, và User. Reservation và Parking Pass mở rộng thêm cho đặt chỗ và vé tháng.
>
> **Nhóm tài chính**: Pricing Rules định nghĩa giá theo giờ, ngày, tháng. Payments dùng polymorphic reference — một bảng phục vụ cho cả session lẫn vé tháng.
>
> **Nhóm hệ thống**: Users với 5 roles, License Plates, Exception Logs, và System Settings.

### Logical Data Model (~2 phút)

> Ở mức logic, nhóm sử dụng **UUID** cho tất cả primary key — đảm bảo tính unique và bảo mật.
>
> Một design decision quan trọng là nhóm chọn **zone-based** thay vì slot-based. Tức là quản lý theo khu vực với capacity và count, thay vì từng ô đỗ riêng lẻ. Điều này giảm đáng kể độ phức tạp mà vẫn đảm bảo kiểm soát sức chứa chính xác.
>
> Bảng parking sessions có **4 foreign key tới gates** — tương ứng với 4 điểm quét: cổng chính vào, cổng tầng vào, cổng tầng ra, cổng chính ra. Đây là mô hình cổng 4 lớp.
>
> Driver type trong session phân biệt rõ 3 loại: walk-in vãng lai, pre-booked đặt trước, và subscriber có vé tháng.

---

## SLIDE cuối: Tổng kết (~1 phút)

> Tóm lại, Smart Parking System là hệ thống quản lý bãi đỗ xe đa tầng hoàn chỉnh với 5 roles, 34 features, 14 bảng dữ liệu, và 3 luồng nghiệp vụ chính.
>
> Điểm khác biệt của nhóm là: **mô phỏng 3D Digital Twin**, **4 tính năng Security đột phá** với WebSocket realtime, và kiến trúc **zone-based** hiện đại thay vì quản lý từng ô đỗ truyền thống.
>
> Cảm ơn thầy và các bạn đã lắng nghe. Nhóm mình sẵn sàng trả lời câu hỏi ạ.

---

## 💡 Tips khi thuyết trình

1. **Nói chậm** ở các con số quan trọng: "14 bảng", "5 roles", "34 features"
2. **Chỉ tay vào slide** khi nói swimlane — đọc theo hướng từ trên xuống
3. **Nhấn mạnh** điểm khác biệt: 3D Digital Twin, Security features, zone-based design
4. **Nếu thầy hỏi về Guest**: "Khách vãng lai không cần tài khoản, Staff check-in thay, phân biệt qua driver_type = WALK_IN"
5. **Nếu thầy hỏi thanh toán**: "Hiện tại giả lập thanh toán thành công, giai đoạn sau sẽ tích hợp VNPay/Momo"
