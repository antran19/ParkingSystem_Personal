# Assessment 01 — Week 4 Checkpoint
# Hệ thống Quản lý Bãi đỗ xe Thông minh (Smart Parking System)

---

## Checkpoint 2: Technologies

| Layer | Technology | Version |
|---|---|---|
| **Backend** | Java, Spring Boot, Spring Security, Spring Data JPA | Java 17, Spring Boot 3.x |
| **Frontend** | React, Vite, React Router DOM | React 18, Vite 5 |
| **3D Visualization** | Three.js, @react-three/fiber, @react-three/drei | Latest |
| **Animation** | GSAP (GreenSock) | 3.x |
| **Database** | PostgreSQL (production), H2 (development) | PostgreSQL 15+ |
| **Authentication** | JWT (JSON Web Token), BCrypt | jjwt 0.12.x |
| **AI/OCR** | Tesseract.js (nhận diện biển số xe bằng camera, chạy trên trình duyệt) | v4, CDN |
| **Cache/Pub-Sub** | Redis (Pub/Sub broadcast SOS, cache danh sách đen biển số) | Redis 7 (Docker) |
| **Realtime** | WebSocket + Redis Pub/Sub (đồng bộ message giữa các server) | Spring WebSocket |
| **Build Tool** | Maven (Backend), npm (Frontend) | Maven 3.9+, npm 9+ |
| **API Style** | RESTful JSON | Namespace: `/api/v1/` |

---

## Checkpoint 3: Actors & Features

### Actors (5 vai trò)

| # | Actor | Mô tả |
|---|---|---|
| 1 | **Admin** | Quản trị viên hệ thống — quản lý users, zones, gates, pricing, settings |
| 2 | **Manager** | Quản lý vận hành — giám sát realtime, báo cáo, hậu kiểm sự cố |
| 3 | **Staff** | Nhân viên bãi xe — check-in/check-out xe, tra cứu phiên gửi |
| 4 | **Driver** | Tài xế — xem phiên gửi, đặt chỗ, đăng ký gói, quản lý biển số |
| 5 | **Security** | Bảo vệ — giám sát cổng, mở barrier khẩn cấp, lập biên bản sự cố |

### Features theo Actor

#### Admin
- F01: Quản lý tài khoản người dùng (CRUD users, phân quyền, khóa/mở)
- F02: Quản lý khu vực đỗ xe (CRUD zones, cập nhật sức chứa)
- F03: Quản lý cổng ra/vào (CRUD gates, bật/tắt cổng)
- F04: Quản lý bảng giá (CRUD pricing rules: hourly/daily/monthly)
- F05: Quản lý vé gửi xe theo gói (CRUD parking passes, gia hạn)
- F06: Cấu hình hệ thống (system settings)
- F07: Xem mô phỏng 3D Digital Twin

#### Manager
- F08: Dashboard giám sát realtime (tổng xe, doanh thu, tỷ lệ lấp đầy)
- F09: Xem mô phỏng 3D Digital Twin (click zone xem chi tiết)
- F10: Xem báo cáo doanh thu theo ngày/tuần
- F11: Hậu kiểm sự cố an ninh từ Security

#### Staff
- F12: Check-in xe vào bãi (3 cách nhập biển số: gõ thủ công / quét QR / AI OCR camera Tesseract.js, chọn zone, xuất QR)
- F13: Check-out xe ra bãi (nhập biển số, tính phí tự động)
- F14: Tra cứu phiên gửi xe đang hoạt động
- F15: Xem lịch sử toàn bộ phiên gửi
- F16: Xem bản đồ bãi xe 2D
- F17: Xem mô phỏng 3D Digital Twin

#### Driver
- F18: Xem phiên gửi xe đang hoạt động (theo biển số)
- F19: Xem lịch sử gửi xe cá nhân
- F20: Đặt chỗ trước (reservation)
- F21: Hủy đặt chỗ
- F22: Đăng ký gói dịch vụ đỗ xe (tháng/quý/năm)
- F23: Xem vé đã mua và trạng thái
- F24: Quản lý biển số xe (thêm/xóa)
- F25: Xem bản đồ bãi xe 2D
- F26: Xem mô phỏng 3D Digital Twin

#### Security
- F27: Giám sát cổng ra/vào
- F28: Mở barrier khẩn cấp (có ghi log)
- F29: Lập biên bản sự cố (LOST_TICKET, WRONG_PLATE, OVERTIME, WRONG_ZONE, UNPAID)
- F30: Xem mô phỏng 3D Digital Twin
- F31: Tuần tra kỹ thuật số & Quét biển số đối soát (Patrol Audit) — Quét QR phân khu check-in ca tuần tra, dùng camera quét biển số xe nghi vấn, hệ thống tự đối chiếu Active Sessions phát hiện xe đỗ sai khu (WRONG_ZONE) hoặc đỗ lậu
- F32: Duyệt mở Barrier từ xa qua WebSocket — Nhận yêu cầu cứu trợ khẩn cấp từ Staff realtime, phê duyệt/từ chối mở barrier chốt Staff từ xa trên di động
- F33: Kích hoạt Lối thoát hiểm khẩn cấp (Emergency SOS Mode) — Nhấn giữ nút SOS 3s, mở toàn bộ barrier, broadcast cảnh báo đỏ rực tới tất cả Dashboard (Staff, Manager, Driver)
- F34: Quản lý Danh sách đen biển số (Blacklist Plates) — Thêm/xóa biển số xe trộm cắp/gây rối vào blacklist, khi AI cổng vào quét thấy biển số đen sẽ kích hoạt chuông báo động + vị trí chính xác

---

## Checkpoint 4: Scope — Context Diagram

```
                        ┌─────────────────────────────────────────┐
                        │                                         │
    ┌────────┐          │        SMART PARKING SYSTEM             │          ┌──────────┐
    │ Admin  │─────────▶│                                         │◀─────────│ Database │
    │        │◀─────────│  • User Management                     │─────────▶│(PostgreSQL)│
    └────────┘          │  • Zone/Gate/Pricing Management         │          └──────────┘
                        │  • Parking Session Processing           │
    ┌────────┐          │  • Reservation Management               │
    │Manager │─────────▶│  • Parking Pass Subscription            │
    │        │◀─────────│  • Payment Processing                   │
    └────────┘          │  • Exception/Incident Logging           │
                        │  • 3D Digital Twin Visualization        │
    ┌────────┐          │  • Real-time Dashboard & Reports        │
    │ Staff  │─────────▶│                                         │
    │        │◀─────────│                                         │
    └────────┘          │                                         │
                        │                                         │
    ┌────────┐          │                                         │
    │ Driver │─────────▶│                                         │
    │        │◀─────────│                                         │
    └────────┘          │                                         │
                        │                                         │
    ┌────────┐          │                                         │
    │Security│─────────▶│                                         │
    │        │◀─────────│                                         │
    └────────┘          └─────────────────────────────────────────┘
```

### Data Flow tóm tắt

| Actor | Input → System | System → Output |
|---|---|---|
| Admin | CRUD users, zones, gates, pricing | Confirmation, updated data |
| Manager | View requests | Dashboard stats, reports, 3D map |
| Staff | License plate, zone selection | Session code, QR, fee calculation |
| Driver | Plate, reservation info, pass registration | Booking confirmation, pass card, history |
| Security | Incident report, barrier command, SOS trigger, patrol check-in, blacklist management | Log confirmation, barrier action, SOS broadcast, plate verification result, blacklist alert |

---

## Checkpoint 5a: Main-flows — Swimlane Diagrams

### Flow 1: Check-in / Check-out xe (Staff)

```
│    Driver (Xe)     │       Staff        │       System       │     Database       │
│────────────────────│────────────────────│────────────────────│────────────────────│
│                    │                    │                    │                    │
│  Xe đến cổng ──────▶                   │                    │                    │
│                    │  Chọn Zone,        │                    │                    │
│                    │  VehicleType,      │                    │                    │
│                    │  nhập biển số ─────▶                    │                    │
│                    │                    │  Validate dữ liệu │                    │
│                    │                    │  Kiểm tra zone     │                    │
│                    │                    │  còn chỗ ──────────▶ SELECT zone       │
│                    │                    │                    │  WHERE id = ?      │
│                    │                    │  ◀──────────────────  capacity, count   │
│                    │                    │  Tạo session ──────▶ INSERT session     │
│                    │                    │  Tăng currentCount─▶ UPDATE zone +1    │
│                    │  ◀──── SessionCode │                    │                    │
│                    │        + QR Code   │                    │                    │
│                    │  Mở barrier ───────▶  Barrier OPEN      │                    │
│  Xe vào bãi ◀──────                    │                    │                    │
│                    │                    │                    │                    │
│       ...          │    (Đỗ xe)         │       ...          │       ...          │
│                    │                    │                    │                    │
│  Xe ra cổng ───────▶                   │                    │                    │
│                    │  Nhập biển số ─────▶                    │                    │
│                    │                    │  Tìm session ──────▶ SELECT session     │
│                    │                    │   ACTIVE by plate  │  WHERE plate=?     │
│                    │                    │  ◀──────────────────  session data      │
│                    │                    │  Tính phí theo     │                    │
│                    │                    │  pricing_rules     │                    │
│                    │                    │  duration × rate   │                    │
│                    │                    │  - freeMinutes     │                    │
│                    │                    │  Cập nhật session──▶ UPDATE session     │
│                    │                    │  Giảm currentCount─▶ UPDATE zone -1    │
│                    │  ◀──── Hóa đơn    │                    │                    │
│  Thanh toán ───────▶                   │                    │                    │
│                    │  Mở barrier ───────▶  Barrier OPEN      │                    │
│  Xe rời bãi ◀──────                    │                    │                    │
```

### Flow 2: Đăng ký gói dịch vụ (Driver)

```
│      Driver        │       System       │     Database       │
│────────────────────│────────────────────│────────────────────│
│                    │                    │                    │
│  Mở tab "Hồ sơ    │                    │                    │
│  & hội viên" ──────▶                    │                    │
│                    │  GET pricing-plans─▶ SELECT pricing     │
│                    │                    │  WHERE type=MONTHLY│
│                    │  ◀─────────────────  List rules        │
│                    │  GET my passes ────▶ SELECT passes      │
│                    │                    │  WHERE user_id=?   │
│                    │  ◀─────────────────  List passes       │
│  ◀──── Hiển thị   │                    │                    │
│  danh sách gói    │                    │                    │
│  + vé đang có     │                    │                    │
│                    │                    │                    │
│  Chọn gói (VD:    │                    │                    │
│  Ô tô - Quý)     │                    │                    │
│  Nhập biển số     │                    │                    │
│  "Xác nhận" ──────▶                    │                    │
│                    │  Validate input    │                    │
│                    │  Tìm pricing rule──▶ SELECT pricing     │
│                    │                    │  WHERE building &  │
│                    │                    │  vehicleType       │
│                    │  ◀─────────────────  monthlyPrice      │
│                    │  Tính phí:         │                    │
│                    │  QUÝ = price × 3   │                    │
│                    │  Tạo pass ─────────▶ INSERT parking_pass│
│                    │                    │  status=ACTIVE     │
│                    │                    │  endDate=now+3mo   │
│  ◀──── "Đăng ký   │                    │                    │
│  thành công!" +   │                    │                    │
│  hiện vé mới      │                    │                    │
```

### Flow 3: Xử lý sự cố (Security)

```
│     Security       │       System       │     Database       │     Manager        │
│────────────────────│────────────────────│────────────────────│────────────────────│
│                    │                    │                    │                    │
│  Phát hiện sự cố  │                    │                    │                    │
│  (VD: mất vé)     │                    │                    │                    │
│                    │                    │                    │                    │
│  Chọn loại sự cố  │                    │                    │                    │
│  Nhập mô tả       │                    │                    │                    │
│  Nhập biển số     │                    │                    │                    │
│  "Ghi nhận" ──────▶                    │                    │                    │
│                    │  Tạo exception ────▶ INSERT exception   │                    │
│                    │  log               │  type=LOST_TICKET  │                    │
│                    │  ◀─────────────────  Saved             │                    │
│  ◀──── "Đã ghi    │                    │                    │                    │
│  nhận sự cố"      │                    │                    │                    │
│                    │                    │                    │                    │
│  Mở barrier       │                    │                    │                    │
│  khẩn cấp ────────▶  BARRIER OPEN      │                    │                    │
│                    │  Auto-close 8s     │                    │                    │
│                    │                    │                    │                    │
│                    │                    │                    │  Vào Dashboard     │
│                    │                    │                    │  Xem exception_logs│
│                    │                    │  ◀─────────────────── GET exceptions    │
│                    │                    │  ──────────────────▶  List logs         │
│                    │                    │                    │  Hậu kiểm,        │
│                    │                    │                    │  đánh giá xử lý   │
```

---

## Checkpoint 5b: Business Rules

| # | Rule | Mô tả |
|---|---|---|
| BR-01 | **Sức chứa Zone** | `available = capacity - currentCount - reservedCount`. Không cho check-in khi available ≤ 0 |
| BR-02 | **Phí theo giờ** | `fee = max(0, duration - freeMinutes) × (pricePerUnit / 60)`. Xe đạp free 30 phút, còn lại 15 phút |
| BR-03 | **Vé gói tháng** | MONTHLY = giá gốc từ pricing_rules |
| BR-04 | **Vé gói quý** | QUARTERLY = giá tháng × 3 |
| BR-05 | **Vé gói năm** | YEARLY = giá tháng × 12 × 0.9 (giảm 10%) |
| BR-06 | **1 Vé = 1 Biển số** | Mỗi parking_pass gắn với đúng 1 license_plate cụ thể |
| BR-07 | **Cổng 4 lớp** | Luồng xe: Main Entry → Zone Entry → (Đỗ) → Zone Exit → Main Exit |
| BR-08 | **Phân quyền JWT** | Mỗi API endpoint kiểm tra role từ JWT token. Driver không truy cập API Admin |
| BR-09 | **Biển số unique/user** | 1 user không thể đăng ký trùng biển số đã có |
| BR-10 | **Security tự quyết** | Security xử lý sự cố tại chỗ, Manager chỉ hậu kiểm qua exception_logs |
| BR-11 | **Reservation giữ chỗ** | Đặt chỗ tăng reservedCount, hủy đặt chỗ giảm reservedCount |
| BR-12 | **Giờ hoạt động** | Bãi xe có operating_hours (06:00 - 22:00), cấu hình trong building |
| BR-13 | **Trạng thái Zone** | Zone có 4 trạng thái: ACTIVE, FULL, MAINTENANCE, LOCKED |
| BR-14 | **Loại tài xế** | Session phân loại: WALK_IN (vãng lai), PRE_BOOKED (đặt trước), SUBSCRIBER (vé tháng) |
| BR-15 | **Thanh toán đa kênh** | Hỗ trợ CASH, ONLINE, QR_CODE, BANK_TRANSFER |
| BR-16 | **Tuần tra kỹ thuật số** | Security quét QR phân khu check-in ca tuần tra, quét biển số xe đối soát Active Sessions |
| BR-17 | **Duyệt barrier từ xa** | Staff gửi yêu cầu cứu trợ → WebSocket push tới Security → phê duyệt/từ chối → barrier mở/giữ |
| BR-18 | **SOS khẩn cấp** | Nhấn giữ 3s kích hoạt → Redis Pub/Sub broadcast tới tất cả server → mở toàn bộ barrier + cảnh báo. Chỉ Manager/Admin tắt SOS |
| BR-19 | **Danh sách đen** | Biển số blacklist lưu Redis cache, tra cứu < 1ms khi check-in. Chặn + chuông báo động tới Security |

---

## Checkpoint 5c: Swimlane — 4 Tính năng đột phá Security

### Flow 4: Tuần tra kỹ thuật số & Quét biển số đối soát

```
│     Security       │       System       │     Database       │
│────────────────────│────────────────────│────────────────────│
│                    │                    │                    │
│  Đi tuần đến      │                    │                    │
│  Zone B1-A         │                    │                    │
│  Quét QR zone ────▶│                    │                    │
│                    │  Ghi nhận check-in─▶ INSERT patrol_log  │
│  ◀─ "Check-in     │  ca tuần tra       │ zone=B1-A, time=.. │
│   Zone B1-A ✓"    │                    │                    │
│                    │                    │                    │
│  Thấy xe nghi vấn │                    │                    │
│  Chụp biển số ────▶│                    │                    │
│                    │  OCR biển số       │                    │
│                    │  Đối chiếu ────────▶ SELECT session     │
│                    │                    │ WHERE plate=?      │
│                    │                    │ AND status=ACTIVE  │
│                    │  ◀────────────────── Kết quả           │
│                    │                    │                    │
│  ◀─ Kết quả:      │  So sánh zone hiện │                    │
│  [Hợp lệ] hoặc   │  tại vs zone trong │                    │
│  [WRONG_ZONE] hoặc│  session           │                    │
│  [Đỗ lậu!]        │                    │                    │
│                    │                    │                    │
│  Nếu vi phạm:     │                    │                    │
│  Bấm "Lập biên   │                    │                    │
│  bản" ────────────▶│                    │                    │
│                    │  Tạo exception ────▶ INSERT exception   │
│                    │                    │ type=WRONG_ZONE    │
│  ◀─ "Đã ghi nhận" │                    │                    │
```

### Flow 5: Duyệt mở Barrier từ xa qua WebSocket

```
│  Staff (cabin)     │       System       │  Security (mobile) │
│────────────────────│────────────────────│────────────────────│
│                    │                    │                    │
│  Khách mất QR,     │                    │                    │
│  tranh chấp vé     │                    │                    │
│                    │                    │                    │
│  Bấm "Cứu trợ    │                    │                    │
│  khẩn cấp" ───────▶│                    │                    │
│                    │  WebSocket push ───▶│                    │
│                    │  (thông báo còi hú)│  Nhận cảnh báo:   │
│                    │                    │  Gate: MAIN-OUT    │
│                    │                    │  Plate: 30A-999.88 │
│                    │                    │  Lý do: Mất QR     │
│                    │                    │                    │
│                    │                    │  Bấm "Phê duyệt" │
│                    │  ◀── WebSocket ────│  mở barrier ──────▶│
│                    │                    │                    │
│  ◀── Barrier OPEN  │  Mở barrier Staff │                    │
│  Xe qua cổng      │  Ghi log exception │                    │
│                    │  handled_by=Sec.   │                    │
```

### Flow 6: Kích hoạt Emergency SOS Mode

```
│     Security       │       System       │  All Dashboards    │   Manager/Admin    │
│────────────────────│────────────────────│────────────────────│────────────────────│
│                    │                    │                    │                    │
│  Phát hiện cháy/  │                    │                    │                    │
│  ngập lụt         │                    │                    │                    │
│                    │                    │                    │                    │
│  NHẤN GIỮ nút SOS│                    │                    │                    │
│  3 giây ──────────▶│                    │                    │                    │
│                    │  Mở TOÀN BỘ       │                    │                    │
│                    │  barrier ──────────▶│                    │                    │
│                    │                    │                    │                    │
│                    │  WebSocket         │  Màn hình ĐỎ RỰC  │                    │
│                    │  broadcast ────────▶│  nhấp nháy         │                    │
│                    │  tới ALL clients   │  "KHẨN CẤP —       │                    │
│                    │                    │   SƠ TÁN NGAY"    │                    │
│                    │                    │  Khóa thao tác     │                    │
│                    │                    │  bình thường       │                    │
│                    │                    │                    │                    │
│                    │                    │                    │  Bấm "Tắt SOS"    │
│                    │  ◀────────────────────────────────────────  (chỉ Mgr/Admin) │
│                    │  Đóng barrier      │                    │                    │
│                    │  Tắt cảnh báo ────▶│  Trở lại bình     │                    │
│                    │  Ghi log: ai kích  │  thường            │                    │
│                    │  hoạt, ai tắt,     │                    │                    │
│                    │  thời gian         │                    │                    │
```

### Flow 7: Cảnh báo Danh sách đen (Blacklist)

```
│     Security       │       System       │   Staff (check-in) │
│────────────────────│────────────────────│────────────────────│
│                    │                    │                    │
│  ➊ THÊM BLACKLIST │                    │                    │
│  Nhập biển số     │                    │                    │
│  + lý do ─────────▶│                    │                    │
│                    │  Lưu blacklist ───▶ INSERT blacklist    │
│  ◀── "Đã thêm     │                    │ plate=29A-666.66   │
│  vào danh sách đen"│                    │ reason=Xe trộm    │
│                    │                    │                    │
│       ...          │       ...          │       ...          │
│                    │                    │                    │
│  ➋ XE ĐEN VÀO BÃI│                    │  Staff check-in    │
│                    │                    │  biển 29A-666.66 ─▶│
│                    │  Kiểm tra          │                    │
│                    │  blacklist ────────▶ SELECT blacklist   │
│                    │                    │ WHERE plate=?      │
│                    │  ◀──────────────── FOUND!              │
│                    │                    │                    │
│                    │  CHẶN check-in     │  ◀── "Biển số nằm │
│                    │                    │  trong blacklist!" │
│                    │                    │                    │
│  Nhận cảnh báo ◀──│  WebSocket alert   │                    │
│  🚨 CHUÔNG BÁO    │  tới Security      │                    │
│  Plate: 29A-666.66│                    │                    │
│  Vị trí: MAIN-IN  │                    │                    │
│  Lý do: Xe trộm   │                    │                    │
│                    │                    │                    │
│  Chạy đến can thiệp                    │                    │
```
