# 🎤 KỊCH BẢN TRÌNH BÀY DIAGRAM — SmartParking V2

> **Lưu ý**: Đây là tài liệu hỗ trợ trình bày 2 sơ đồ (Conceptual Diagram & Context Diagram).
> Không cần đọc nguyên văn — chỉ cần nắm ý chính, nói tự nhiên theo hiểu biết của mình.

---

## PHẦN 1: CONCEPTUAL DIAGRAM (Sơ đồ Khái niệm Thực thể)

### 1.1. Mở đầu

> *"Dạ thưa cô, đây là Conceptual Diagram thể hiện 12 thực thể chính trong hệ thống SmartParking và mối quan hệ giữa chúng. Em sẽ giải thích theo từng cụm nghiệp vụ."*

---

### 1.2. Cụm 1 — Hạ tầng bãi đỗ xe (Building → Floor → Zone → Gate)

> *"Trung tâm hệ thống bắt đầu từ **BUILDING** (Tòa nhà). Mỗi tòa nhà có nhiều **FLOOR** (Tầng), mỗi tầng chia thành nhiều **ZONE** (Khu vực đỗ xe)."*
>
> *"Mỗi Zone chỉ phục vụ 1 loại phương tiện cụ thể thông qua **VEHICLE_TYPE** — ví dụ Zone A chỉ cho xe máy, Zone B chỉ cho ô tô."*
>
> *"Tòa nhà cũng có các **GATE** (Cổng ra/vào), gồm 2 loại: cổng chính (MAIN) và cổng tầng/khu (ZONE). Mỗi cổng có thể là cổng vào, cổng ra, hoặc cổng 2 chiều."*

**Quan hệ cụ thể trong code:**
- `Building` → 1:N → `Floor` (FK: `building_id`)
- `Building` → 1:N → `Gate` (FK: `building_id`)
- `Floor` → 1:N → `Zone` (FK: `floor_id`)
- `Zone` → N:1 → `VehicleType` (FK: `vehicle_type_id`)
- `Floor` → N:1 → `VehicleType` (FK: `vehicle_type_id`)

---

### 1.3. Cụm 2 — Vận hành đỗ xe (ParkingSession + Payment)

> *"Khi xe vào bãi, hệ thống tạo 1 **PARKING_SESSION** ghi nhận:*
> - *Biển số xe (`licensePlate`)*
> - *Zone được hệ thống tự động phân bổ*
> - *4 cổng đi qua: cổng chính vào, cổng tầng vào, cổng tầng ra, cổng chính ra*
> - *Nhân viên xử lý vào/ra (`staffEntry`, `staffExit` → liên kết tới `USER`)*
> - *Thời gian vào/ra và tổng phí"*
>
> *"Khi check-out, hệ thống tính phí dựa trên **PRICING_RULE** (bảng giá theo loại xe + tòa nhà), rồi tạo bản ghi **Payment**."*

**Điểm đặc biệt về Payment:**

> *"**Payment** sử dụng thiết kế **Polymorphic Reference** — nghĩa là 1 bảng Payment duy nhất có thể tham chiếu tới nhiều loại giao dịch khác nhau thông qua 2 trường:*
> - *`referenceType`: cho biết đây là thanh toán gì (SESSION, MONTHLY_PASS, RESERVATION)*
> - *`referenceId`: trỏ tới ID của bản ghi tương ứng"*
>
> *"Thiết kế này tránh phải tạo 3 bảng payment riêng biệt, tiết kiệm và dễ mở rộng."*

**Quan hệ cụ thể trong code:**
- `ParkingSession` → N:1 → `Zone` (FK: `zone_id`)
- `ParkingSession` → N:1 → `VehicleType` (FK: `vehicle_type_id`)
- `ParkingSession` → N:1 → `Gate` (4 FK: `entry_main_gate_id`, `entry_zone_gate_id`, `exit_zone_gate_id`, `exit_main_gate_id`)
- `ParkingSession` → N:1 → `User` (2 FK: `staff_entry_id`, `staff_exit_id`)
- `Payment` → polymorphic → `ParkingSession` / `Reservation` / `ParkingPass`
- `PricingRule` → N:1 → `Building` + `VehicleType`

---

### 1.4. Cụm 3 — Tính năng nâng cao (Reservation, ParkingPass, ExceptionLog)

> *"**USER** (Tài xế) có thể:*
> - *Đặt chỗ trước qua **RESERVATION** — liên kết tới Zone và VehicleType*
> - *Mua vé tháng/quý/năm qua **PARKING_PASS** — liên kết tới Building và VehicleType"*
>
> *"Khi có sự cố (mất thẻ QR, AI đọc lệch biển số, xe chết máy...), Bảo vệ ghi nhận vào **EXCEPTION_LOG** — liên kết tới phiên đỗ xe (ParkingSession) và nhân viên xử lý (User)."*

**Quan hệ cụ thể trong code:**
- `Reservation` → N:1 → `User` (FK: `user_id`)
- `Reservation` → N:1 → `Zone` (FK: `zone_id`)
- `Reservation` → N:1 → `VehicleType` (FK: `vehicle_type_id`)
- `ParkingPass` → N:1 → `User` (FK: `user_id`)
- `ParkingPass` → N:1 → `Building` (FK: `building_id`)
- `ParkingPass` → N:1 → `VehicleType` (FK: `vehicle_type_id`)
- `ExceptionLog` → N:1 → `ParkingSession` (FK: `session_id`)
- `ExceptionLog` → N:1 → `User` (FK: `handled_by`)

---

### 1.5. Lưu ý bổ sung (nếu cô hỏi)

Trong codebase thực tế còn có 1 entity phụ trợ chưa thể hiện trên diagram:

- **`USER_LICENSE_PLATE`** — Bảng liên kết lưu danh sách biển số xe mà Driver đăng ký online.
  Quan hệ: `User` → 1:N → `UserLicensePlate` (FK: `user_id`).

> *"Dạ em có bảng `user_license_plates` trong database để lưu biển số xe Driver đăng ký online, giúp Driver không phải nhập lại biển số mỗi lần đăng nhập. Em sẽ bổ sung vào diagram cho đầy đủ ạ."*

---
---

## PHẦN 2: CONTEXT DIAGRAM (Sơ đồ Ngữ cảnh)

### 2.1. Mở đầu

> *"Còn đây là Context Diagram thể hiện 5 actor bên ngoài tương tác với hệ thống SmartParking. Mỗi actor có các luồng dữ liệu vào (gửi yêu cầu) và ra (nhận phản hồi) riêng biệt."*

---

### 2.2. Actor 1 — System Admin (Quản trị viên hệ thống)

| Luồng | Mô tả | Mapping trong code |
|-------|-------|--------------------|
| 1.1 Yêu cầu quản lý tài khoản | CRUD tài khoản người dùng | `AuthController` (register, login) |
| 1.2 Cấu hình phân quyền | Gán 5 role: ADMIN, MANAGER, STAFF, DRIVER, SECURITY | `User.role` enum + `@PreAuthorize` |
| 1.3 Trạng thái xử lý / Nhật ký | Xem health check, system logs | `HealthController` + Spring Actuator |

> *"Admin là người quản trị cấp cao nhất. Admin quản lý tài khoản người dùng, phân quyền 5 vai trò, và theo dõi trạng thái hoạt động của hệ thống qua Actuator endpoint."*

---

### 2.3. Actor 2 — Parking Manager (Quản lý bãi xe)

| Luồng | Mô tả | Mapping trong code |
|-------|-------|--------------------|
| 2.1 Cấu hình hạ tầng Building/Floor/Zone | Tạo/sửa tòa nhà, tầng, khu vực đỗ | `ParkingConfigController` |
| 2.2 Thiết lập bảng giá PricingRule | Đặt giá theo giờ/ngày/tháng cho từng loại xe | `PricingRule` entity + `PricingService` |
| 2.3 Báo cáo doanh thu tài chính | Xem tổng thu, lịch sử thanh toán | `PaymentController` |
| 2.4 Real-time Zone Capacity Dashboard | Theo dõi sức chứa zone trực tiếp | WebSocket STOMP broadcast |

> *"Manager cấu hình toàn bộ hạ tầng bãi xe: tòa nhà nào, mấy tầng, chia thành bao nhiêu zone, mỗi zone chứa bao nhiêu xe. Manager cũng thiết lập bảng giá và xem báo cáo doanh thu. Đặc biệt, Dashboard của Manager nhận cập nhật sức chứa zone theo thời gian thực qua WebSocket."*

---

### 2.4. Actor 3 — Parking Staff (Nhân viên trực bãi)

| Luồng | Mô tả | Mapping trong code |
|-------|-------|--------------------|
| 3.1 Nhập biển số xe (3 cách) | Gõ thủ công / Quét QR / AI OCR camera | `html5-qrcode` + Tesseract.js |
| 3.2 Xác nhận loại xe & Check-in/out | Chọn loại xe, cổng, bấm xác nhận | `SessionController.checkIn()` / `checkOut()` |
| 3.3 Gợi ý Zone trống | Hệ thống tự tìm zone tối ưu | `ZoneSuggestionService.suggestZone()` |
| 3.4 Hiển thị số tiền Payment | Tính phí và hiển thị khi check-out | `PricingService.calculateFee()` |

> *"Staff là người trực tiếp vận hành tại cổng. Staff nhập biển số xe bằng 3 cách: gõ thủ công, quét mã QR bằng camera, hoặc dùng AI OCR (Tesseract.js) nhận diện biển số từ ảnh chụp. Khi check-in, hệ thống tự động gợi ý zone tối ưu nhất — ưu tiên zone ít xe nhất và gần cổng nhất. Khi check-out, hệ thống tự động tính phí dựa trên thời gian gửi và bảng giá."*

---

### 2.5. Actor 4 — Parking Driver (Tài xế)

| Luồng | Mô tả | Mapping trong code |
|-------|-------|--------------------|
| 4.1 Đăng ký/Gia hạn vé tháng | Mua ParkingPass (tháng/quý/năm) | `ParkingPass` entity |
| 4.2 Đặt chỗ trước Reservation | Đặt chỗ online, chọn zone + thời gian | `Reservation` entity |
| 4.3 Quét mã QR tại cổng/khu/tầng | Quét QR vé để qua cổng | `ParkingSession.qrCode` |
| 4.4 Cấp mã Ticket_QR | Hệ thống sinh mã QR cho vé | `ParkingSession.qrCode` sinh tự động |
| 4.5 Phản hồi trạng thái đặt chỗ | Hiển thị PENDING → CONFIRMED | `Reservation.status` enum |

> *"Tài xế có thể đăng ký biển số xe online, đặt chỗ trước, mua vé tháng, và quét QR tại cổng. Hệ thống phản hồi trạng thái đặt chỗ và cấp mã Ticket QR cho tài xế."*

---

### 2.6. Actor 5 — Security / Bảo vệ

| Luồng | Mô tả | Mapping trong code |
|-------|-------|--------------------|
| 5.1 Yêu cầu xử lý ngoại lệ | Báo cáo: mất QR, sai biển số, xe chặn làn | `SecurityController.logException()` |
| 5.2 Lệnh cưỡng bức mở barrier thủ công | Mở barrier khi hệ thống không nhận QR | Ghi nhận trong `ExceptionLog` |
| 5.3 Dữ liệu tra cứu lịch sử ParkingSession | Tra cứu phiên đỗ xe theo biển số | `SessionController` query |
| 5.4 Xác nhận ghi log sự cố ExceptionLog | Lưu sự cố vào database | `SecurityExceptionService` |

> *"Bảo vệ xử lý các tình huống ngoại lệ mà hệ thống tự động không giải quyết được. Ví dụ: tài xế mất thẻ QR, AI đọc lệch biển số, xe chết máy chặn làn. Bảo vệ ghi log sự cố vào ExceptionLog (gồm 5 loại: LOST_TICKET, WRONG_PLATE, OVERTIME, WRONG_ZONE, UNPAID), tra cứu lịch sử phiên đỗ xe, và có quyền ra lệnh mở barrier thủ công."*

---
---

## PHẦN 3: CÂU HỎI CÔ CÓ THỂ HỎI & CÁCH TRẢ LỜI

### Q1: "Sao Payment không có FK cứng tới ParkingSession?"

> *"Dạ em dùng Polymorphic Reference (referenceType + referenceId) để 1 bảng Payment phục vụ được cả 3 loại giao dịch: thanh toán phiên đỗ xe (SESSION), thanh toán vé tháng (MONTHLY_PASS), và thanh toán đặt chỗ (RESERVATION) — mà không cần tạo 3 bảng payment khác nhau ạ."*

### Q2: "Tại sao không quản lý từng slot xe cố định?"

> *"Dạ trong thực tế, bãi đỗ xe tòa nhà không có vạch kẻ slot cố định cho từng xe. Em quản lý theo zone capacity — đếm số xe hiện tại so với sức chứa tối đa — vừa sát thực tế vừa đơn giản hóa logic backend ạ."*

### Q3: "WebSocket dùng ở đâu?"

> *"Dạ khi Staff check-in hoặc check-out, backend sẽ broadcast sự kiện thay đổi sức chứa zone qua WebSocket (STOMP protocol). Tất cả dashboard đang mở — Manager, Staff, Driver — sẽ nhận được cập nhật realtime mà không cần refresh trang ạ."*

### Q4: "5 role phân quyền thế nào trong code?"

> *"Dạ Backend dùng Spring Security với annotation `@PreAuthorize`. Ví dụ:*
> - *Endpoint check-in (`/staff/sessions/checkin`): chỉ cho phép STAFF, MANAGER, ADMIN*
> - *Endpoint báo sự cố (`/security/exceptions`): chỉ cho phép SECURITY, MANAGER, ADMIN*
> - *Endpoint quản lý biển số (`/driver/plates`): chỉ cho phép DRIVER, MANAGER, ADMIN*
>
> *Mỗi request gửi lên đều kèm JWT token, backend tự động giải mã token lấy role rồi kiểm tra quyền trước khi cho vào Controller."*

### Q5: "Hệ thống gợi ý zone tối ưu bằng thuật toán gì?"

> *"Dạ `ZoneSuggestionService` lọc các zone ACTIVE cùng loại xe, rồi sắp xếp theo 2 tiêu chí ưu tiên:*
> 1. *Zone ít xe nhất (nhiều chỗ trống nhất)*
> 2. *Zone gần cổng nhất (distanceToGate thấp nhất)*
>
> *Trả về zone đầu tiên trong danh sách đã sắp. Nếu không còn zone nào trống thì từ chối check-in."*

### Q6: "AI OCR nhận diện biển số hoạt động thế nào?"

> *"Dạ em dùng thư viện Tesseract.js chạy trực tiếp trên trình duyệt (không cần server AI riêng). Camera thiết bị chụp ảnh biển số → tiền xử lý ảnh (binarization, tăng contrast) → Tesseract nhận diện ký tự → hậu xử lý sửa lỗi OCR phổ biến (ví dụ chữ O sửa thành số 0) → tự động điền vào form."*

### Q7: "Thiếu entity USER_LICENSE_PLATE trong Conceptual Diagram?"

> *"Dạ đúng ạ. Trong database em có bảng `user_license_plates` lưu danh sách biển số xe mà Driver đăng ký online — giúp Driver không phải nhập lại biển số mỗi lần đăng nhập. Quan hệ là User 1:N UserLicensePlate. Em sẽ bổ sung vào diagram cho đầy đủ ạ."*
>
> *(Thành thật nhận thiếu sót → cô đánh giá cao hơn là bao biện)*

### Q8: "Khi reset database thì frontend có bị lỗi không?"

> *"Dạ em đã xử lý rồi ạ. Khi database bị reset, frontend tự động quét song song toàn bộ biển số đã đăng ký lên backend để kiểm tra. Nếu không tìm thấy phiên đỗ xe nào đang hoạt động, hệ thống tự động dọn dẹp sạch dữ liệu cũ trong localStorage của trình duyệt — đảm bảo giao diện luôn đồng bộ chính xác với trạng thái thực tế của cơ sở dữ liệu."*

---

## PHẦN 4: BẢNG TÓM TẮT ENTITY ↔ DATABASE TABLE

| Entity (Java) | Database Table | Mô tả |
|---|---|---|
| `Building` | `buildings` | Tòa nhà |
| `Floor` | `floors` | Tầng (thuộc tòa nhà) |
| `Zone` | `zones` | Khu vực đỗ xe (thuộc tầng) |
| `Gate` | `gates` | Cổng ra/vào (thuộc tòa nhà) |
| `VehicleType` | `vehicle_types` | Loại phương tiện (Xe máy, Ô tô, Xe điện) |
| `PricingRule` | `pricing_rules` | Bảng giá (theo giờ/ngày/tháng) |
| `User` | `users` | Tài khoản người dùng (5 roles) |
| `UserLicensePlate` | `user_license_plates` | Biển số xe đăng ký của Driver |
| `ParkingSession` | `parking_sessions` | Phiên đỗ xe (check-in → check-out) |
| `Reservation` | `reservations` | Đặt chỗ trước |
| `ParkingPass` | `parking_passes` | Vé tháng/quý/năm |
| `Payment` | `payments` | Thanh toán (polymorphic) |
| `ExceptionLog` | `exception_logs` | Nhật ký sự cố bảo vệ |

---

## PHẦN 5: CÔNG NGHỆ SỬ DỤNG (nếu cô hỏi)

### Frontend
| Thư viện | Phiên bản | Vai trò |
|---|---|---|
| React | 19.2 | Framework UI chính |
| Vite | 8.0 | Build tool + Dev server |
| TailwindCSS | 4.0 | Styling framework |
| React Router DOM | 7.1 | Điều hướng SPA |
| Axios | 1.16 | HTTP client + JWT interceptor |
| GSAP | 3.15 | Hiệu ứng animation cao cấp |
| html5-qrcode | 2.3 | Quét mã QR bằng camera |
| Tesseract.js | CDN | AI OCR nhận diện biển số xe |
| @stomp/stompjs | 7.3 | WebSocket client (realtime) |
| sockjs-client | 1.6 | WebSocket fallback |
| @react-oauth/google | 0.13 | Đăng nhập Google |

### Backend
| Thư viện | Phiên bản | Vai trò |
|---|---|---|
| Java | 17 LTS | Ngôn ngữ chính |
| Spring Boot | 3.3.5 | Framework backend |
| Spring Security | (bundled) | Xác thực & phân quyền |
| Spring Data JPA | (bundled) | ORM (Hibernate) |
| PostgreSQL | (runtime) | Cơ sở dữ liệu chính |
| Redis | (starter) | Distributed Lock + Cache |
| jjwt | 0.12.6 | JWT token |
| WebSocket STOMP | (starter) | Realtime broadcast |
| Lombok | (optional) | Giảm boilerplate code |
| Spring Validation | (starter) | Validate dữ liệu đầu vào |
| Spring Actuator | (starter) | Health check monitoring |

---

> **💡 Mẹo trình bày**: Khi cô hỏi gì mà không chắc, cứ nói:
> *"Dạ để em mở code cho cô xem trực tiếp ạ"* rồi mở IDE lên chỉ vào file tương ứng.
> Cô sẽ đánh giá cao việc bạn hiểu code thực tế hơn là chỉ nói lý thuyết suông.
