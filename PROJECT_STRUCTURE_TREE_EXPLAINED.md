# Cấu trúc dự án ParkingSystem — giải thích theo cây thư mục

> File này dùng để nhìn nhanh toàn bộ cấu trúc dự án và hiểu từng folder/file đang làm nhiệm vụ gì.

---

## 1. Cây cấu trúc tổng quát

```text
ParkingSystem/
├── backend/                              ← Spring Boot Backend (port 8080): xử lý API, database, JWT, logic gửi xe
│   ├── pom.xml                           ← Khai báo thư viện Maven: Spring Boot, JPA, Security, JWT, PostgreSQL, Redis...
│   ├── docker-compose.yml                ← Chạy PostgreSQL + Redis bằng Docker
│   ├── README.md                         ← Hướng dẫn riêng cho backend
│   ├── docs/                             ← Tài liệu riêng của backend
│   │   ├── API_SPEC.md                   ← Mô tả danh sách API backend cho frontend gọi
│   │   ├── CODE_WALKTHROUGH.md           ← Giải thích luồng code backend
│   │   └── ONBOARDING.md                 ← Hướng dẫn thành viên mới chạy backend
│   │
│   └── src/main/
│       ├── resources/
│       │   └── application.yml           ← Cấu hình backend: port, database, Redis, JWT secret
│       │
│       └── java/com/smartparking/backend/
│           ├── SmartParkingApplication.java      ← File main để chạy backend Spring Boot
│           │
│           ├── config/                           ← Cấu hình hệ thống backend
│           │   ├── CorsConfig.java               ✅ Cho phép frontend gọi API backend khác port
│           │   ├── DataInitializer.java          ✅ Tạo dữ liệu mẫu: user, building, floor, slot, gate, pricing
│           │   ├── SecurityConfig.java           ✅ Cấu hình Spring Security, JWT, phân quyền API
│           │   └── WebSocketConfig.java          ✅ Cấu hình WebSocket để cập nhật slot real-time
│           │
│           ├── controller/                       ← Nơi nhận request API từ frontend
│           │   ├── AuthController.java           ✅ API login + register
│           │   ├── HealthController.java         ✅ API kiểm tra backend còn chạy không
│           │   ├── SessionController.java        ✅ API check-in/check-out xe
│           │   └── SlotController.java           ✅ API xem sơ đồ bãi xe/slot map
│           │
│           ├── dto/                              ← Object trung gian giữa frontend và backend
│           │   ├── request/                      ← Dữ liệu frontend gửi lên backend
│           │   │   ├── LoginRequest.java         ✅ Body request đăng nhập
│           │   │   ├── RegisterRequest.java      ✅ Body request đăng ký tài khoản
│           │   │   ├── CheckInRequest.java       ✅ Body request check-in xe vào bãi
│           │   │   └── CheckOutRequest.java      ✅ Body request check-out xe ra bãi
│           │   │
│           │   └── response/                     ← Dữ liệu backend trả về frontend
│           │       ├── ApiResponse.java          ✅ Format response chung toàn hệ thống
│           │       ├── LoginResponse.java        ✅ Response sau login: token + thông tin user
│           │       ├── SessionResponse.java      ✅ Response sau check-in/check-out
│           │       └── SlotMapResponse.java      ✅ Response dữ liệu sơ đồ slot
│           │
│           ├── entity/                           ← Các bảng database PostgreSQL
│           │   ├── User.java                     ✅ Bảng users: tài khoản + role
│           │   ├── Building.java                 ✅ Bảng buildings: thông tin tòa nhà/bãi xe
│           │   ├── Floor.java                    ✅ Bảng floors: tầng B1, B2, T1...
│           │   ├── Zone.java                     ✅ Bảng zones: khu vực trong tầng
│           │   ├── Slot.java                     ✅ Bảng slots: từng ô đỗ xe
│           │   ├── VehicleType.java              ✅ Bảng vehicle_types: xe máy, ô tô, xe điện
│           │   ├── Gate.java                     ✅ Bảng gates: cổng vào/ra
│           │   ├── ParkingSession.java           ✅ Bảng parking_sessions: một lượt gửi xe
│           │   ├── PricingRule.java              ✅ Bảng pricing_rules: bảng giá gửi xe
│           │   ├── Payment.java                  ✅ Bảng payments: thanh toán
│           │   ├── Reservation.java              ✅ Bảng reservations: đặt chỗ trước
│           │   ├── MonthlyPass.java              ✅ Bảng monthly_passes: vé tháng
│           │   └── ExceptionLog.java             ✅ Bảng exception_logs: lưu sự cố/mất vé/sai biển số
│           │
│           ├── repository/                       ← Tầng truy vấn database
│           │   ├── UserRepository.java           ✅ Query bảng users, dùng cho login/JWT
│           │   ├── BuildingRepository.java       ✅ Query bảng buildings
│           │   ├── FloorRepository.java          ✅ Query bảng floors
│           │   ├── SlotRepository.java           ✅ Query slot trống, slot theo loại xe
│           │   ├── VehicleTypeRepository.java    ✅ Query loại xe
│           │   ├── GateRepository.java           ✅ Query cổng vào/ra
│           │   ├── ParkingSessionRepository.java ✅ Query phiên gửi xe active/completed
│           │   ├── PricingRuleRepository.java    ✅ Query bảng giá để tính phí
│           │   └── PaymentRepository.java        ✅ Query/lưu thanh toán
│           │
│           ├── service/                          ← Xử lý nghiệp vụ chính
│           │   ├── AuthService.java              ✅ Logic login + register + tạo JWT
│           │   ├── ParkingSessionService.java    ✅ Logic check-in/check-out xe
│           │   ├── SlotAssignmentService.java    ✅ Thuật toán gợi ý slot phù hợp
│           │   ├── PricingService.java           ✅ Tính phí gửi xe
│           │   └── SlotMapService.java           ✅ Lấy dữ liệu sơ đồ bãi xe
│           │
│           ├── security/                         ← Bảo mật JWT/Spring Security
│           │   ├── JwtAuthFilter.java            ✅ Kiểm tra token trước khi request vào controller
│           │   └── UserDetailsServiceImpl.java   ✅ Load user từ DB cho Spring Security
│           │
│           ├── util/                             ← Hàm tiện ích dùng chung
│           │   └── JwtUtil.java                  ✅ Tạo token, đọc token, validate token
│           │
│           └── exception/                        ← Xử lý lỗi tập trung
│               ├── BusinessException.java        ✅ Lỗi nghiệp vụ: hết slot, xe đã check-in...
│               ├── ResourceNotFoundException.java✅ Lỗi không tìm thấy dữ liệu
│               ├── ErrorResponse.java            ✅ Format lỗi trả về frontend
│               └── GlobalExceptionHandler.java   ✅ Bắt lỗi toàn hệ thống và trả response đẹp
│
├── frontend/                             ← React + Vite Frontend (port 5173): giao diện web
│   ├── package.json                      ← Khai báo thư viện npm và script chạy frontend
│   ├── package-lock.json                 ← Khóa version thư viện npm
│   ├── vite.config.js                    ← Cấu hình Vite để chạy/build React app
│   ├── eslint.config.js                  ← Cấu hình kiểm tra lỗi code frontend
│   ├── index.html                        ← HTML gốc, chứa div root cho React render
│   ├── README.md                         ← Hướng dẫn riêng cho frontend
│   │
│   └── src/
│       ├── main.jsx                      ✅ Entry point frontend, render App vào index.html
│       ├── App.jsx                       ✅ Routing + layout chính + PrivateRoute nếu có
│       ├── App.css                       ✅ CSS riêng cho App/layout
│       ├── index.css                     ✅ CSS global/Tailwind CSS nếu đã cấu hình
│       │
│       ├── services/
│       │   └── api.js                    ✅ Axios/fetch config, baseURL backend, tự gắn JWT nếu có
│       │
│       └── pages/                        ← Các màn hình frontend chia theo actor/chức năng
│           ├── auth/
│           │   └── Login.jsx             ✅ Trang đăng nhập, gọi API login, lưu token
│           │
│           └── driver/
│               ├── Dashboard.jsx         📌 Trang tổng quan Driver
│               ├── ParkingMap.jsx        📌 Trang xem sơ đồ bãi xe/slot trống
│               └── History.jsx           📌 Trang lịch sử gửi xe của Driver
│
├── docs/                                 ← Tài liệu chung toàn dự án
│   ├── API_SPEC.md                       ← Tài liệu API cho cả team đọc
│   ├── CODE_WALKTHROUGH.md               ← Giải thích luồng code tổng quan
│   └── ONBOARDING.md                     ← Hướng dẫn thành viên mới setup project
│
├── README.md                             ← Giới thiệu tổng quan project
├── SRS_ParkingSystem.md                  ← Tài liệu đặc tả yêu cầu phần mềm
├── task.md                               ← Phân công nhiệm vụ từng thành viên
├── SCRIPT_TRAO_DOI_VOI_GIANG_VIEN.md     ← Script chuẩn bị trao đổi với cô
└── PROJECT_STRUCTURE_TREE_EXPLAINED.md   ← File này: giải thích cấu trúc dự án
```

---

## 2. Giải thích dễ hiểu từng nhóm folder chính

### `backend/` dùng để làm gì?

`backend/` là phần xử lý phía server. Nó không có giao diện cho người dùng bấm trực tiếp, mà cung cấp API cho frontend gọi.

Backend chịu trách nhiệm:

- Đăng nhập/đăng ký.
- Tạo JWT token.
- Phân quyền người dùng.
- Check-in xe vào bãi.
- Check-out xe ra bãi.
- Tính phí gửi xe.
- Gợi ý slot phù hợp.
- Lưu dữ liệu vào PostgreSQL.
- Dùng Redis để lock slot nếu cần.
- Gửi cập nhật real-time qua WebSocket.

Nói ngắn gọn:

```text
Backend = não của hệ thống.
```

---

### `frontend/` dùng để làm gì?

`frontend/` là phần giao diện web mà user nhìn thấy và thao tác.

Frontend chịu trách nhiệm:

- Hiển thị màn hình đăng nhập.
- Hiển thị dashboard.
- Hiển thị sơ đồ bãi xe.
- Cho Staff/Driver nhập dữ liệu.
- Gọi API backend qua `api.js`.
- Lưu JWT token sau khi login.
- Điều hướng trang bằng routing.

Nói ngắn gọn:

```text
Frontend = mặt giao diện của hệ thống.
```

---

### `docs/` dùng để làm gì?

`docs/` chứa tài liệu để team đọc, không phải code chạy trực tiếp.

Dùng cho:

- FE biết BE có API nào.
- Thành viên mới biết setup project.
- Cả nhóm hiểu luồng code.
- Chuẩn bị báo cáo hoặc trao đổi với giảng viên.

---

## 3. Giải thích chi tiết các package backend

### `config/` — cấu hình hệ thống

```text
config/ = nơi chỉnh cách backend hoạt động
```

#### `CorsConfig.java`

File này cho phép frontend gọi backend.

Vì frontend và backend chạy ở 2 port khác nhau:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:8080
```

Nếu không có CORS, browser có thể chặn request.

Ví dụ:

```text
Login.jsx gọi POST http://localhost:8080/api/v1/auth/login
→ CorsConfig cho phép request này đi qua
```

Nói với cô:

> CorsConfig dùng để cho phép React frontend gọi API Spring Boot backend khi hai phần chạy khác port.

---

#### `DataInitializer.java`

File này tạo dữ liệu mẫu khi chạy app.

Ví dụ dữ liệu mẫu:

- User admin/manager/staff/driver.
- Tòa nhà SmartParking Tower.
- Tầng B1, B2.
- Slot B1-A01, B1-A02.
- Loại xe xe máy/ô tô.
- Bảng giá.
- Cổng vào/ra.

Mục đích:

```text
Chạy app lên là có data để test ngay.
```

Nói với cô:

> DataInitializer giúp nhóm có dữ liệu mẫu để demo và test luồng login, check-in, check-out mà không cần nhập tay database.

---

#### `SecurityConfig.java`

File này cấu hình bảo mật.

Nó quyết định:

- API nào không cần login.
- API nào cần token.
- API nào cần role cụ thể.
- Gắn `JwtAuthFilter` vào luồng xử lý request.

Ví dụ:

```text
/auth/login      → public
/auth/register   → public
/sessions/**     → cần login, thường là STAFF
/admin/**        → cần ADMIN
```

Nói với cô:

> SecurityConfig là nơi cấu hình Spring Security và phân quyền API theo JWT/RBAC.

---

#### `WebSocketConfig.java`

File này cấu hình WebSocket.

Dùng để cập nhật real-time.

Ví dụ:

```text
Staff check-in xe
→ slot B1-A01 chuyển từ AVAILABLE sang OCCUPIED
→ backend gửi WebSocket message
→ frontend đổi màu slot ngay, không cần reload
```

Nói với cô:

> WebSocketConfig dùng để hỗ trợ cập nhật trạng thái slot real-time trên giao diện.

---

### `controller/` — nơi nhận API

```text
controller/ = cửa nhận request từ frontend
```

#### `AuthController.java`

Nhận API login/register.

Luồng:

```text
Frontend gửi email/password
→ AuthController nhận request
→ AuthController gọi AuthService
→ Trả token về frontend
```

Nói ngắn:

```text
AuthController = cổng API đăng nhập/đăng ký.
```

---

#### `SessionController.java`

Nhận API check-in/check-out.

Luồng check-in:

```text
Staff nhập biển số
→ Frontend gọi SessionController
→ SessionController gọi ParkingSessionService
→ Backend tạo phiên gửi xe
```

Nói ngắn:

```text
SessionController = cổng API xe vào/xe ra.
```

---

#### `SlotController.java`

Nhận API lấy sơ đồ bãi xe.

Dùng cho:

- Trang xem slot trống.
- Trang sơ đồ bãi xe.
- Public parking map.

Nói ngắn:

```text
SlotController = cổng API xem tình trạng slot.
```

---

#### `HealthController.java`

Dùng để kiểm tra backend còn chạy không.

Ví dụ:

```text
GET /health
→ trả status UP
```

Nói ngắn:

```text
HealthController = API kiểm tra app sống/chết.
```

---

### `dto/` — dữ liệu chuyển qua lại

```text
dto/ = mẫu dữ liệu FE gửi lên và BE trả về
```

Ví dụ frontend login gửi:

```json
{
  "email": "staff@parking.vn",
  "password": "123456"
}
```

Backend dùng `LoginRequest.java` để nhận.

Backend trả:

```json
{
  "success": true,
  "data": {
    "accessToken": "...",
    "user": {
      "role": "STAFF"
    }
  }
}
```

Backend dùng `LoginResponse.java` và `ApiResponse.java` để trả.

Nói với cô:

> DTO giúp tách dữ liệu API khỏi entity database, tránh lộ thông tin nhạy cảm và giúp validate input dễ hơn.

---

### `entity/` — bảng database

```text
entity/ = mỗi file gần như tương ứng một bảng database
```

Các entity quan trọng nhất:

- `User.java`: tài khoản người dùng.
- `Slot.java`: ô đỗ xe.
- `ParkingSession.java`: lượt gửi xe.
- `PricingRule.java`: bảng giá.
- `Payment.java`: thanh toán.
- `Reservation.java`: đặt chỗ.

Nói với cô:

> Entity là lớp ánh xạ với bảng database thông qua JPA/Hibernate.

---

### `repository/` — truy vấn database

```text
repository/ = nơi lấy/lưu dữ liệu database
```

Ví dụ:

```text
AuthService muốn tìm user theo email
→ gọi UserRepository

ParkingSessionService muốn lưu phiên gửi xe
→ gọi ParkingSessionRepository

SlotAssignmentService muốn tìm slot trống
→ gọi SlotRepository
```

Nói với cô:

> Repository là tầng data access, giúp service làm việc với database mà không viết SQL thủ công quá nhiều.

---

### `service/` — xử lý nghiệp vụ

```text
service/ = nơi xử lý logic thật của hệ thống
```

Các file chính:

#### `AuthService.java`

Xử lý:

- Login.
- Register.
- Kiểm tra password.
- Mã hóa password.
- Tạo JWT token.

#### `ParkingSessionService.java`

Xử lý:

- Check-in xe vào.
- Check-out xe ra.
- Tạo parking session.
- Cập nhật slot.
- Gọi tính phí.

#### `SlotAssignmentService.java`

Xử lý:

- Tìm slot AVAILABLE đúng loại xe.
- Tính điểm slot.
- Chọn slot phù hợp nhất.

#### `PricingService.java`

Xử lý:

- Tính thời gian gửi xe.
- Lấy bảng giá.
- Tính tổng tiền.

#### `SlotMapService.java`

Xử lý:

- Lấy dữ liệu building/floor/slot.
- Gom dữ liệu thành format để frontend vẽ bản đồ slot.

Nói với cô:

> Service là tầng business logic chính. Controller chỉ nhận request, còn service mới xử lý nghiệp vụ.

---

### `security/` — bảo mật JWT

```text
security/ = kiểm tra user đã đăng nhập chưa và có quyền không
```

#### `JwtAuthFilter.java`

Làm nhiệm vụ:

```text
Đọc Authorization header
→ lấy Bearer token
→ validate token
→ đưa user vào SecurityContext
```

Nếu token sai:

```text
Trả 401 Unauthorized
```

Nếu token đúng nhưng sai quyền:

```text
Trả 403 Forbidden
```

#### `UserDetailsServiceImpl.java`

Làm nhiệm vụ:

```text
Load user từ database theo email
→ đưa cho Spring Security dùng
```

Nói với cô:

> JwtAuthFilter kiểm tra token trong mỗi request, còn UserDetailsServiceImpl giúp Spring Security lấy thông tin user từ database.

---

### `util/` — tiện ích

#### `JwtUtil.java`

Làm nhiệm vụ:

- Tạo JWT token.
- Đọc email/role từ token.
- Kiểm tra token hết hạn chưa.
- Validate chữ ký token.

Nói ngắn:

```text
JwtUtil = công cụ xử lý token.
```

---

### `exception/` — xử lý lỗi

```text
exception/ = chuẩn hóa lỗi trả về frontend
```

Ví dụ lỗi:

```text
Không còn slot trống
Không tìm thấy session
Sai email/password
User không có quyền
```

Nếu không có xử lý lỗi chung, frontend có thể nhận lỗi Java rất khó đọc.

`GlobalExceptionHandler.java` giúp chuyển lỗi thành JSON dễ hiểu.

Nói với cô:

> Exception package giúp backend trả lỗi nhất quán, frontend dễ hiển thị message cho user.

---

## 4. Giải thích chi tiết frontend

### `src/services/api.js`

File này là cầu nối frontend → backend.

Nó thường làm:

- Khai báo base URL backend:

```text
http://localhost:8080/api/v1
```

- Gọi API bằng Axios hoặc fetch.
- Tự gắn JWT token vào header nếu user đã login.

Ví dụ:

```text
Frontend có accessToken trong localStorage
→ api.js tự thêm Authorization: Bearer <token>
→ backend nhận request đã có token
```

Nói với cô:

> api.js giúp frontend gọi backend tập trung một chỗ, tránh viết lặp URL và token ở từng page.

---

### `src/pages/auth/Login.jsx`

Trang đăng nhập.

Chức năng:

- Hiển thị form email/password.
- Gọi API login.
- Nhận JWT token.
- Lưu token.
- Chuyển user sang dashboard đúng role.

Luồng:

```text
User nhập email/password
→ Login.jsx gọi api.js
→ backend AuthController xử lý
→ trả token
→ frontend lưu token
```

---

### `src/pages/driver/Dashboard.jsx`

Trang tổng quan cho Driver.

Có thể hiển thị:

- Phiên gửi xe hiện tại.
- Slot đang đỗ.
- Phí tạm tính.
- Nút xem bản đồ bãi xe.
- Nút xem lịch sử.

Nếu hiện tại chưa hoàn chỉnh thì có thể xem là:

```text
📌 Placeholder/chức năng đang phát triển cho Driver dashboard.
```

---

### `src/pages/driver/ParkingMap.jsx`

Trang xem sơ đồ bãi xe.

Chức năng:

- Gọi API slot map.
- Hiển thị slot còn trống/đang có xe/đã đặt.
- Có thể dùng màu:
  - Xanh: AVAILABLE.
  - Đỏ: OCCUPIED.
  - Vàng: RESERVED.
  - Xám: MAINTENANCE/LOCKED.

---

### `src/pages/driver/History.jsx`

Trang lịch sử gửi xe của Driver.

Có thể hiển thị:

- Biển số.
- Ngày gửi.
- Giờ vào.
- Giờ ra.
- Slot.
- Tổng phí.
- Trạng thái thanh toán.

Nếu chưa nối API thì có thể là:

```text
📌 Placeholder/chờ backend API lịch sử gửi xe.
```

---

### `src/App.jsx`

File gốc của frontend app.

Thường xử lý:

- Routing.
- PrivateRoute.
- Layout chung.
- Điều hướng giữa các page.

Ví dụ:

```text
/login          → Login.jsx
/driver         → Dashboard.jsx
/driver/map     → ParkingMap.jsx
/driver/history → History.jsx
```

Nói với cô:

> App.jsx là nơi điều phối các màn hình chính của frontend.

---

### `src/main.jsx`

Entry point frontend.

Nhiệm vụ:

```text
Render <App /> vào <div id="root"></div> trong index.html
```

Nói ngắn:

```text
main.jsx = nút start của React app.
```

---

### `src/index.css`

CSS global.

Dùng để:

- Import Tailwind nếu có.
- Set font.
- Set màu nền.
- Reset CSS chung.

---

## 5. Luồng chạy toàn hệ thống

### Login

```text
Login.jsx
→ api.js
→ AuthController
→ AuthService
→ UserRepository
→ JwtUtil
→ LoginResponse
→ frontend lưu token
```

### Check-in

```text
Check-in page
→ api.js gửi JWT
→ JwtAuthFilter kiểm tra token
→ SessionController
→ ParkingSessionService
→ SlotAssignmentService chọn slot
→ ParkingSessionRepository lưu session
→ SlotRepository update slot OCCUPIED
→ trả SessionResponse
```

### Check-out

```text
Check-out page
→ api.js gửi JWT
→ JwtAuthFilter kiểm tra token
→ SessionController
→ ParkingSessionService
→ PricingService tính phí
→ ParkingSessionRepository update session COMPLETED
→ SlotRepository update slot AVAILABLE
→ PaymentRepository lưu payment
→ trả SessionResponse
```

### Xem sơ đồ bãi xe

```text
ParkingMap.jsx
→ api.js gọi SlotController
→ SlotMapService
→ SlotRepository/FloorRepository/BuildingRepository
→ SlotMapResponse
→ frontend vẽ slot map
```

---

## 6. Câu nói ngắn để giải thích với cô

> Dự án của nhóm em chia thành hai phần chính: `backend` và `frontend`. Backend dùng Spring Boot chạy port 8080, chịu trách nhiệm xử lý API, database, JWT, phân quyền, check-in/check-out, tính phí và gợi ý slot. Frontend dùng React + Vite chạy port 5173, chịu trách nhiệm hiển thị giao diện và gọi API backend qua file `api.js`. Trong backend, controller nhận request, service xử lý nghiệp vụ, repository truy vấn database, entity ánh xạ bảng database, DTO định nghĩa dữ liệu request/response, security xử lý JWT, còn config chứa các cấu hình như CORS, Security, WebSocket và data mẫu.

---

## 7. Ghi nhớ nhanh

```text
Controller = nhận API
Service    = xử lý nghiệp vụ
Repository = truy vấn database
Entity     = bảng database
DTO        = dữ liệu FE/BE gửi qua lại
Security   = kiểm tra JWT + phân quyền
Config     = cấu hình hệ thống
Frontend   = giao diện người dùng
api.js     = cầu nối frontend với backend
```
