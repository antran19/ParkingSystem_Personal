# 🏗️ SMARTPARKING V2 — GIẢI THÍCH TOÀN BỘ LUỒNG CODE

---

## 1. KIẾN TRÚC TỔNG QUAN

```
FRONTEND (React)  ←── HTTP REST ──→  BACKEND (Spring Boot)  ←── JPA ──→  DATABASE (PostgreSQL)
```

| Tầng | Công nghệ | Vai trò |
|------|-----------|---------|
| Frontend | React 18, Vite, TailwindCSS | Giao diện người dùng |
| Animation | GSAP + ScrollTrigger | Hiệu ứng chuyển động dashboard & landing page |
| HTTP Client | Axios + Interceptor | Gửi request, tự gắn JWT token theo role |
| Backend | Spring Boot 3, Java 17 | Xử lý nghiệp vụ, REST API |
| Bảo mật | Spring Security + JWT | Xác thực & phân quyền 5 role |
| ORM | JPA/Hibernate | Mapping Java Object ↔ DB Table |
| Database | PostgreSQL | Lưu trữ dữ liệu |
| Cache / Pub-Sub | Redis 7 | Cache token, pub/sub cảnh báo SOS, message queue |
| Realtime | WebSocket (STOMP) | Broadcast thay đổi zone, payment confirmed |
| Thanh toán | VNPAY Sandbox | Thanh toán online Parking Pass + phí check-out |
| Background Job | Spring @Scheduled | Tự động hủy reservation hết hạn, dọn dẹp session |
| AI / OCR | Tesseract.js v4 (CDN) | Nhận dạng biển số xe qua camera trực tiếp |
| 3D | Three.js / React Three Fiber | Digital Twin mô phỏng 3D bãi đỗ xe |
| Seed Data | DataInitializer (CommandLineRunner) | Tự động tạo dữ liệu mẫu khi khởi động |

---

## 2. LUỒNG ĐĂNG NHẬP — Từng bước tuần tự

### Bước 1 — [FE] User nhập email + password, bấm "Đăng nhập"

```
File: LoginScreen.jsx dòng 604
```
- React gọi hàm `handleLogin(e)`
- Lấy giá trị `email` và `password` từ state (user đã gõ vào input)

### Bước 2 — [FE] Gửi HTTP POST đến Backend

```
File: LoginScreen.jsx dòng 609
```
```javascript
const res = await axiosClient.post("/auth/login", { email, password });
```
- `axiosClient` ghép baseURL → gửi request đến: `POST http://localhost:8080/api/v1/auth/login`
- Body JSON: `{ "email": "staff@parking.vn", "password": "123456" }`
- Từ khóa `await` = **DỪNG LẠI**, chờ Backend xử lý xong mới chạy tiếp

### Bước 3 — [BE] Spring Security Filter Chain chặn request TRƯỚC

```
Mọi request đến Backend đều phải đi qua Security Filter trước khi vào Controller.
```
- Filter đọc header `Authorization` → có JWT token không?
- **Với endpoint `/auth/**`** (login, register): được cấu hình `permitAll()` → **cho đi qua luôn, KHÔNG cần token** (vì user chưa login thì làm gì có token!)
- **Với endpoint khác** (`/staff/**`, `/driver/**`...): phải có token hợp lệ, nếu không → trả 401

```
Request đến /auth/login → Filter thấy: "à, /auth/** cho phép tự do" → cho vào Controller
```

### Bước 4 — [BE] AuthController nhận request

```
File: AuthController.java dòng 27-32
```
```java
@PostMapping("/login")
public ResponseEntity<ApiResponse<LoginResponse>> login(@RequestBody LoginRequest request) {
    LoginResponse response = authService.login(request);
    return ResponseEntity.ok(ApiResponse.success("Đăng nhập thành công", response));
}
```
- Spring Boot nhận JSON body, tự động map vào `LoginRequest` object (chứa email + password)
- Gọi tiếp `authService.login(request)` để xử lý nghiệp vụ

### Bước 5 — [BE] AuthService xác thực email/password với Database

```
File: AuthService.java dòng 72-74
```
```java
authenticationManager.authenticate(
    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
);
```
- Spring Security lấy email → tìm user trong bảng `users` của DB
- So sánh password user nhập với `password_hash` trong DB (dùng BCrypt)
- **Nếu SAI** → ném `BadCredentialsException` → trả lỗi 401 cho FE → FE hiện "Email hoặc mật khẩu không đúng"
- **Nếu ĐÚNG** → chạy tiếp bước 5

### Bước 6 — [BE] Xác thực ĐÚNG → Sinh JWT Access Token

```
File: AuthService.java dòng 80-84
```
```java
User user = userRepository.findByEmail(request.getEmail());
String accessToken = jwtUtil.generateAccessToken(userDetails);
String refreshToken = jwtUtil.generateRefreshToken(userDetails);
```
- Tìm user entity từ DB để lấy id, role, fullName
- `jwtUtil` sinh JWT token chứa: `{ sub: "staff@parking.vn", role: "ROLE_STAFF", exp: 1h }`
- Token là chuỗi mã hóa dài: `eyJhbGciOiJIUzI1NiJ9.eyJzdWI...`

### Bước 7 — [BE] Đóng gói response, trả về cho Frontend

```
File: AuthService.java dòng 88-99
```
```java
return LoginResponse.builder()
    .accessToken("eyJhbGciOiJIUzI1NiJ9...")
    .user(UserInfo.builder()
        .id("550e8400-e29b-41d4-a716-446655440000")
        .email("staff@parking.vn")
        .fullName("Nguyễn Văn A")
        .role("STAFF")
        .build())
    .build();
```
- Response JSON gửi về FE: `{ data: { accessToken: "eyJ...", user: { id, role, fullName, email } } }`

### Bước 8 — [FE] Nhận response, lưu token vào localStorage

```
File: LoginScreen.jsx dòng 610-621
```
```javascript
// await ở bước 2 giờ mới hoàn thành, res chứa data từ Backend
const { accessToken, user } = res.data.data;

localStorage.setItem("accessToken", accessToken);              // Token chung
localStorage.setItem(`accessToken_${user.role}`, accessToken); // Token theo role (VD: accessToken_STAFF)
localStorage.setItem("user", JSON.stringify({
  id: user.id, role: user.role, fullName: user.fullName, email: user.email
}));
```
- Lưu token để các request sau tự gắn vào header (không cần login lại)
- **Token key theo role**: `accessToken_DRIVER`, `accessToken_STAFF`... giúp multi-role testing trên cùng browser

### Bước 9 — [FE] Chuyển trang sang Dashboard theo role

```
File: LoginScreen.jsx dòng 623-631 → App.jsx → AppRoutes.jsx
```
```javascript
// LoginScreen map role backend → route:
const roleMap = { DRIVER: "driver", STAFF: "staff", MANAGER: "manager", ADMIN: "admin", SECURITY: "security" };
const mappedRole = roleMap[user.role] || "driver";
onLogin(mappedRole);

// App.jsx nhận → set state:
setUserRole("staff");

// AppRoutes.jsx kiểm tra role → render component tương ứng:
if (userRole === "staff")    → hiển thị <StaffDashboard />
if (userRole === "driver")   → hiển thị <DriverDashboard />
if (userRole === "security") → hiển thị <SecurityDashboard />
if (userRole === "manager")  → hiển thị <ManagerDashboard />
if (userRole === "admin")    → hiển thị <AdminDashboard />
```

### Sơ đồ tóm tắt toàn bộ:

```
[FE] User bấm Login
  ↓
[FE] POST /auth/login {email, password} ──────→ [BE] AuthController nhận
                                                   ↓
                                                 [BE] AuthService.login()
                                                   ↓
                                                 [BE] Spring Security xác thực với DB
                                                   ↓ (đúng)
                                                 [BE] Sinh JWT token
                                                   ↓
[FE] Nhận {accessToken, user} ←──────────────── [BE] Trả response
  ↓
[FE] Lưu token vào localStorage
  ↓
[FE] App.jsx set userRole → AppRoutes render Dashboard
```

---

## 3. CƠ CHẾ JWT TOKEN — Các request sau khi đã login

Sau khi login xong, mọi request tiếp theo đều tự động gắn token:

### Bước 1 — [FE] Component gọi API (ví dụ load cấu hình bãi xe)

```javascript
const res = await staffApi.getParkingConfig();
// → axiosClient.get("/parking/config")
```

### Bước 2 — [FE] axiosClient interceptor TỰ ĐỘNG gắn token

```
File: axiosClient.js dòng 37-46
```
```javascript
axiosClient.interceptors.request.use((config) => {
  const token = getAccessToken();  // Không cần URL, dùng user.role từ localStorage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**Cơ chế `getAccessToken()` (dòng 17-34):**
```javascript
function getAccessToken() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const currentRole = user?.role?.toUpperCase();      // VD: "STAFF"
  const sharedToken = localStorage.getItem("accessToken");
  if (currentRole) {
    const roleKey = `accessToken_${currentRole}`;     // VD: "accessToken_STAFF"
    const roleToken = localStorage.getItem(roleKey);
    if (roleToken) return roleToken;                  // Ưu tiên token theo role
    if (sharedToken) {
      localStorage.setItem(roleKey, sharedToken);     // Auto-heal: copy shared → role
      return sharedToken;
    }
  }
  return sharedToken;                                 // Fallback
}
```
- **Ưu tiên token theo role** (VD: `accessToken_STAFF`) → **Fallback** token chung
- **Auto-heal**: nếu chỉ có token chung mà thiếu token role → tự copy vào
- Frontend KHÔNG CẦN tự gắn token mỗi lần gọi API

### Bước 3 — [BE] Spring Security Filter kiểm tra token

- Đọc header `Authorization` → tách lấy JWT token
- Giải mã token → lấy email + role + thời hạn
- Kiểm tra: token còn hạn không? role có quyền truy cập endpoint này không?
- **Hết hạn/sai** → trả 401 → FE tự redirect về trang login
- **Hợp lệ** → cho request vào Controller xử lý

---

## 4. LUỒNG CHECK-IN (Xe vào bãi) — Từng bước tuần tự

### Bước 1 — [FE] Staff mở trang Check-in, hệ thống tự load cấu hình

```
File: StaffCheckIn.jsx dòng 386-408
```
```javascript
useEffect(() => {
  const res = await staffApi.getParkingConfig();
  setVehicleTypes(config.vehicleTypes); // ["Xe máy", "Ô tô", "Xe điện"]
  setGates(entryGates);                 // Danh sách cổng vào
}, []);
```

### Bước 2 — [FE→BE] axiosClient tự gắn token + Security Filter xác thực

```
axiosClient gắn header: Authorization: Bearer eyJabc... (token Staff đã lưu lúc login)
→ Request đến Backend → Security Filter kiểm tra:
  - JwtAuthFilter: giải mã token → email=staff@parking.vn, role=STAFF → OK
  - SecurityFilterChain: URL /parking/** → cần authenticated() → có token hợp lệ → CHO VÀO ✅
```
- Nếu Staff chưa login (không có token) → trả 401 → FE redirect về trang login

### Bước 3 — [BE] ParkingConfigController đọc DB trả cấu hình

```
File: ParkingConfigController.java dòng 62-96
```
- Đọc bảng `vehicle_types` → trả danh sách loại xe
- Đọc bảng `gates` → trả danh sách cổng (lọc isActive = true)
- Đọc bảng `zones` → trả danh sách khu đỗ (kèm sức chứa hiện tại)

### Bước 4 — [FE] Staff nhập biển số xe (có 3 cách)

| Cách | Mô tả | Cách hoạt động |
|------|-------|----------------|
| Thủ công | Gõ biển số vào input | Staff gõ trực tiếp "30A-999.88" |
| Quét QR | Camera đọc mã QR | Thư viện Html5Qrcode giải mã → điền form |
| AI OCR | Camera chụp biển số | Tesseract.js nhận dạng ký tự → sửa lỗi → điền form |

### Bước 5 — [FE] Staff chọn loại xe + cổng vào, bấm "Xác nhận Check-in"

```
File: StaffCheckIn.jsx dòng 546-553
```
```javascript
const res = await staffApi.checkIn({
  licensePlate: "30A-999.88",
  vehicleTypeId: "uuid-ô-tô",
  gateEntryId: "uuid-cổng-vào-chính",
  driverType: "WALK_IN",
  reservationCode: null,
});
```
- Gửi `POST /staff/sessions/checkin` → **chờ Backend xử lý**

### Bước 6 — [FE→BE] axiosClient gắn token + Security Filter kiểm quyền + SessionController nhận request

```
File: SessionController.java dòng 39-43
```
- `@PreAuthorize("hasAnyRole('STAFF','MANAGER','ADMIN')")` kiểm tra quyền
- Gọi `parkingSessionService.checkIn(request)`

### Bước 7 — [BE] ParkingSessionService xử lý nghiệp vụ check-in

```
File: ParkingSessionService.java dòng 89-183
```

**6a. Validate biển số:**
```java
sessionRepository.findByLicensePlateAndStatus("30A-999.88", ACTIVE)
    .ifPresent(s -> { throw new BusinessException("Xe đang có phiên chưa kết thúc"); });
```
- Kiểm tra xe này đã có session ACTIVE chưa → nếu có thì từ chối (phải check-out trước)

**6b. Tìm entity từ DB:**
```java
VehicleType vehicleType = vehicleTypeRepository.findById(vehicleTypeId);  // "Ô tô"
Gate mainGate = gateRepository.findById(gateEntryId);                     // "Cổng Vào Chính"
```

**6c. Gợi ý zone tối ưu (ZoneSuggestionService):**
```java
Zone assignedZone = zoneSuggestionService.suggestZone(vehicleType);
```
- Tìm tất cả zone ACTIVE + cùng loại xe (ô tô)
- Ưu tiên: zone ít xe nhất → gần cổng nhất
- Ví dụ: "Khu C - Tầng B2" (45/80 chỗ, gần cổng nhất)

**6d. Cập nhật sức chứa zone (+1 xe):**
```java
assignedZone = zoneSuggestionService.enterZone(assignedZone);
// zone.currentCount: 45 → 46
// Nếu 46 >= 80 (capacity) → zone.status = FULL
```

**6e. Tạo ParkingSession mới lưu vào DB:**
```java
ParkingSession session = ParkingSession.builder()
    .sessionCode("PS20260527-A3F")
    .licensePlate("30A-999.88")
    .vehicleType(vehicleType)    // Ô tô
    .zone(assignedZone)          // Khu C - Tầng B2
    .entryTime(LocalDateTime.now())
    .status(ACTIVE)
    .build();
sessionRepository.save(session);
```

**6f. Broadcast WebSocket:**
```java
broadcastZoneChange(assignedZone);
// Gửi message đến /topic/zones/{buildingId}
// Tất cả client đang mở sẽ nhận được cập nhật zone realtime
```

### Bước 8 — [BE] Trả response cho Frontend

```java
return SessionResponse {
    sessionCode: "PS20260527-A3F",
    licensePlate: "30A-999.88",
    vehicleType: "Ô tô",
    zoneCode: "C",
    zoneName: "Khu C - Ô tô",
    floorName: "Tầng B2",
    guideMessage: "Vui lòng đến Tầng B2 - Khu C - Ô tô"
}
```

### Bước 9 — [FE] Nhận kết quả, hiển thị thông báo thành công

```
File: StaffCheckIn.jsx dòng 555-600
```
- Hiện thông báo: "Check-in thành công! Hướng dẫn: Tầng B2 - Khu C"
- Lưu session vào localStorage để đồng bộ sang tab Driver

---

## 5. LUỒNG CHECK-OUT (Xe ra bãi) — Từng bước tuần tự

### Bước 1 — [FE] Staff nhập biển số xe ra, bấm "Check-out"

```javascript
await staffApi.checkOut({
  licensePlate: "30A-999.88",
  gateExitId: "uuid-cổng-ra",
  paymentMethod: "CASH",
});
```

### Bước 2 — [BE] ParkingSessionService tìm session đang ACTIVE

```java
ParkingSession session = findActiveSession(request);
// Tìm theo: sessionId HOẶC sessionCode HOẶC licensePlate
```

### Bước 3 — [BE] Tính thời gian gửi xe

```java
int durationMinutes = ChronoUnit.MINUTES.between(session.getEntryTime(), LocalDateTime.now());
// VD: vào lúc 8:00, ra lúc 10:05 → 125 phút
```

### Bước 4 — [BE] PricingService tính phí

```
File: PricingService.java dòng 41-70
```
```java
// Công thức: ceil((phút - phút miễn phí) / 60) × giá/giờ
// VD: 125 phút, miễn phí 10 phút
// → ceil((125 - 10) / 60) = ceil(1.92) = 2 giờ
// → 2 × 20.000đ = 40.000đ
```
- Nếu là vé tháng (SUBSCRIBER) → miễn phí = 0đ

### Bước 5 — [BE] Tạo Payment record + đóng session

```java
// Tạo bản ghi thanh toán
Payment payment = Payment.builder()
    .amount(40000)
    .paymentMethod(CASH)
    .status(COMPLETED)
    .build();
paymentRepository.save(payment);

// Đóng session
session.setStatus(COMPLETED);
session.setExitTime(now);
session.setTotalFee(40000);

// Giải phóng zone (-1 xe)
zone.currentCount: 46 → 45
```

### Bước 6 — [BE] Broadcast WebSocket + trả response cho FE

```java
broadcastZoneChange(zone); // Cập nhật realtime
return SessionResponse { totalFee: 40000, durationMinutes: 125, status: COMPLETED }
```

---

## 6. LUỒNG BÁO CÁO SỰ CỐ (Security) — Từng bước tuần tự

### Bước 1 — [FE] Bảo an điền form sự cố, bấm "Lưu báo cáo"

### Bước 2 — [FE] Tra cứu session của xe (nếu biết biển số)

```javascript
const sessionRes = await staffApi.getActiveSession("30A-999.88");
const sessionId = sessionRes.data.data.sessionId;
```

### Bước 3 — [FE] Map loại sự cố sang enum Backend

```javascript
"Mất thẻ QR vãng lai" → "LOST_TICKET"
"AI đọc lệch biển số" → "WRONG_PLATE"
"Xe chết máy chặn làn" → "OVERTIME"
```

### Bước 4 — [FE] Gửi POST /security/exceptions

```javascript
await staffApi.logSecurityException({
  sessionId: sessionId,
  exceptionType: "LOST_TICKET",
  description: "Mô tả chi tiết sự cố...",
  handledByUserId: user.id
});
```

### Bước 5 — [BE] SecurityController → SecurityExceptionService

- Tìm ParkingSession theo sessionId (nếu có)
- Tìm User (bảo an) theo handledByUserId
- Tạo ExceptionLog entity → lưu vào bảng `exception_logs` trong DB

---

## 7. LUỒNG DRIVER — Load Dashboard (5 API song song)

Khi Driver đăng nhập → `DriverDashboard.jsx` mount → hàm `loadUserData()` chạy:

### Bước 1 — [FE] Lấy danh sách biển số xe đã đăng ký

```javascript
// File: DriverDashboard.jsx dòng 149
const resPlates = await staffApi.getDriverPlates();
// → GET /api/v1/driver/plates
```

### Bước 2 — [BE] DriverController truy vấn DB theo user từ JWT

```java
// File: DriverController.java dòng 66-73
User user = getCurrentUser(authentication);  // JWT → email → User
List<UserLicensePlate> plates = userLicensePlateRepository.findByUser(user);
// → Trả: ["30A-12345", "51B-67890"]
```

### Bước 3 — [FE] Với MỖI biển số, gọi 2 API song song

```javascript
// File: DriverDashboard.jsx dòng 165-206
// 3a. Tìm session đang ACTIVE
const session = await staffApi.getActiveSession("30A-12345");
// → GET /api/v1/driver/sessions/active?plate=30A-12345
// → BE: filter parking_sessions WHERE status=ACTIVE AND licensePlate match

// 3b. Lấy lịch sử gửi xe
const history = await staffApi.getSessionHistory("30A-12345");
// → GET /api/v1/driver/sessions/history?plate=30A-12345
// → BE: sessionRepository.findByLicensePlateOrderByEntryTimeDesc()
```

### Bước 4 — [FE] Lấy cấu hình zone để tính chỗ trống

```javascript
// File: DriverDashboard.jsx dòng 209-219
const configRes = await staffApi.getParkingConfig();
// → GET /api/v1/parking/config
totalAvailable = zones.reduce((sum, z) => {
  return sum + Math.max(0, z.capacity - z.currentCount - z.reservedCount);
}, 0);
```

### Bước 5 — [FE] Tổng hợp tất cả vào state

```javascript
// File: DriverDashboard.jsx dòng 224-253
setData({
  user: { name, licensePlates: ["30A-12345"] },
  currentSession: { zoneCode, estimatedFee, status: "Đang gửi xe" },
  stats: { totalParking: 5, totalHours: "12 giờ", totalCost: "240.000đ", availableSlots: "35 chỗ" },
  history: [{ date, zoneCode, cost, status }]
});
```

### Tóm tắt 5 API load dashboard:

```
[FE] loadUserData()
  ├─→ GET /driver/plates               → Danh sách biển số
  ├─→ GET /driver/reservations          → Reservation đang chờ
  ├─→ GET /driver/sessions/active?plate= → Session đang gửi (cho MỖI plate)
  ├─→ GET /driver/sessions/history?plate= → Lịch sử (cho MỖI plate)
  └─→ GET /parking/config              → Zone + tính chỗ trống
```

---

## 8. LUỒNG DRIVER — Đặt giữ chỗ (Reservation)

### Bước 1 — [FE] Driver chọn zone + loại xe + biển số, bấm "Đặt giữ chỗ"

```javascript
await staffApi.createReservation({
  zoneId: "uuid-zone-A", vehicleTypeId: "uuid-xe-máy", licensePlate: "30A-12345"
});
// → POST /api/v1/driver/reservations
```

### Bước 2 — [BE] ReservationService validate + tạo reservation

```
File: ReservationService.java dòng 41-84
```
```java
// 2a. Kiểm tra biển số đã có reservation chưa hoàn tất?
if (reservationRepository.existsByUserAndLicensePlateAndStatusIn(user, plate, [PENDING, CONFIRMED]))
    throw BusinessException("Biển số đang có reservation chưa hoàn tất");

// 2b. Loại xe có khớp zone không?
if (!zone.getVehicleType().getId().equals(vehicleType.getId()))
    throw BusinessException("Loại phương tiện không phù hợp");

// 2c. Zone còn chỗ không?
int occupied = zone.currentCount + zone.reservedCount;
if (occupied >= zone.capacity) throw BusinessException("Zone đã đầy");

// 2d. Tăng reservedCount + lưu DB
zone.reservedCount += 1;  // VD: 5 → 6
zoneRepository.save(zone);

// 2e. Tạo reservation: mã "RS20260603-A3F4", status = CONFIRMED
reservationRepository.save(reservation);
```

### Bước 3 — Khi check-in có reservation code

```
Staff nhập reservationCode → BE tìm đúng zone đã đặt:
  zone.reservedCount -= 1  (6 → 5, giải phóng slot reserved)
  zone.currentCount += 1   (45 → 46, xe thực sự vào)
  reservation.status = COMPLETED
```

### Bước 4 — [System] Tự động hủy reservation hết hạn (Background Job)

```
File: ReservationExpiryScheduler.java
```
```java
@Scheduled(fixedRate = 30000) // Chạy mỗi 30 giây
public void expireOverdueReservations() {
    // Tìm reservation PENDING/CONFIRMED mà reservedTo < now
    // → Chuyển status sang EXPIRED
    // → zone.reservedCount -= 1 (trả lại slot)
    // → Nếu zone đang FULL → chuyển về ACTIVE
}
```
- **Actor**: System Handler (không cần người bấm nút)
- **Công nghệ**: Spring `@EnableScheduling` + `@Scheduled`
- **Kết quả**: Slot tự động được giải phóng khi Driver không check-in đúng hạn

---

## 9. LUỒNG DRIVER — Thanh toán chuyển khoản (Real-time WebSocket)

**Đây là luồng kết nối Driver ↔ Staff qua WebSocket:**

### Bước 1 — [FE] Driver xem session đang gửi, bấm "Xác nhận chuyển khoản"

```javascript
// File: DriverDashboard.jsx
await staffApi.confirmPayment({ sessionCode: "PS20260603-A3F", licensePlate: "30A-12345" });
// → POST /api/v1/driver/payments/confirm
```

### Bước 2 — [BE] PaymentConfirmationService xử lý (7 bước)

```
File: PaymentConfirmationService.java dòng 58-169
```
```java
// 2a. Tìm session ACTIVE theo sessionCode
ParkingSession session = sessionRepository.findBySessionCode("PS20260603-A3F");

// 2b. Tính thời gian + phí
int duration = ChronoUnit.MINUTES.between(session.entryTime, now);  // VD: 125 phút
BigDecimal totalFee = pricingService.calculateFee(buildingId, vehicleTypeId, 125);

// 2c. Cập nhật session → COMPLETED
session.setStatus(COMPLETED);
session.setTotalFee(totalFee);  // 40.000đ

// 2d. Tạo Payment record
Payment payment = Payment.builder()
    .paymentMethod(BANK_TRANSFER)
    .status(COMPLETED)
    .transactionId("VQR-1717394400000")
    .build();
paymentRepository.save(payment);

// 2e. Giải phóng zone (-1 xe)
zoneSuggestionService.exitZone(zone);  // currentCount: 46 → 45
```

### Bước 3 — [BE] Broadcast WebSocket real-time cho Staff

```java
// File: PaymentConfirmationService.java dòng 152-165
messagingTemplate.convertAndSend("/topic/payments/confirmed", {
    type: "PAYMENT_CONFIRMED",
    sessionCode: "PS20260603-A3F",
    licensePlate: "30A-12345",
    totalFee: "40000",
    paymentMethod: "BANK_TRANSFER"
});
// → Staff đang mở trang Check-out nhận được notification real-time
```

### Tóm tắt luồng:

```
[Driver] Bấm "Xác nhận CK"
   ↓
[BE] Tìm session → Tính phí → Tạo Payment → Đóng session → Giải phóng zone
   ↓
[BE] WebSocket broadcast /topic/payments/confirmed
   ↓                                    ↓
[Driver] loadUserData() refresh      [Staff] Nhận notification real-time
   → session biến mất                   → hiện "Thanh toán xác nhận"
   → history thêm 1 dòng
```

---

## 10. LUỒNG DRIVER — Đăng ký Parking Pass (Vé tháng/quý/năm)

### Bước 1 — [FE] Driver xem danh sách gói dịch vụ

```javascript
const plans = await staffApi.getDriverPricingPlans();
// → GET /api/v1/driver/pricing-plans
// → BE: pricingRuleRepository.findAll() → filter PricingType.MONTHLY
// → [{vehicleTypeId, pricePerUnit: 500000}]
```

### Bước 2 — [FE] Driver chọn gói + bấm "Đăng ký"

```javascript
await staffApi.registerDriverPass({
  buildingId: "uuid", vehicleTypeId: "uuid",
  licensePlate: "30A-12345", passType: "MONTHLY"
});
// → POST /api/v1/driver/parking-passes
```

### Bước 3 — [BE] DriverController tính phí theo loại gói

```java
// File: DriverController.java dòng 161-224
switch (passType) {
    case MONTHLY:   fee = monthlyPrice;                              // 500.000đ
    case QUARTERLY: fee = monthlyPrice × 3;                          // 1.500.000đ
    case YEARLY:    fee = monthlyPrice × 12 × 0.9;                   // 5.400.000đ (giảm 10%)
}

ParkingPass pass = ParkingPass.builder()
    .startDate(today)
    .endDate(today + months)    // +1/+3/+12 tháng
    .status(ACTIVE)
    .fee(fee)
    .build();
parkingPassRepository.save(pass);
```

### Bước 4 — Khi check-in với Parking Pass

```
Staff chọn driverType = "SUBSCRIBER"
  → Check-out: totalFee = BigDecimal.ZERO (miễn phí)
  → ParkingSessionService.checkOut() dòng 211-213:
     if (driverType == SUBSCRIBER) → totalFee = 0đ
```

---

## 10.5. LUỒNG DRIVER — Thanh toán VNPAY Online (Parking Pass + Check-out)

### Luồng A: Thanh toán Parking Pass qua VNPAY

**Bước 1 — [FE] Driver chọn gói dịch vụ, bấm "Thanh toán online"**

```javascript
await staffApi.registerDriverPass({
  buildingId: "uuid", vehicleTypeId: "uuid",
  licensePlate: "30A-12345", passType: "MONTHLY"
});
// → POST /api/v1/driver/parking-passes
// → BE tạo ParkingPass (status=PENDING_PAYMENT) + Payment (status=PENDING)
// → BE gọi VnPayService.createPaymentUrl() → trả paymentUrl cho FE
```

**Bước 2 — [FE] Redirect sang VNPAY Sandbox**

```
User được chuyển đến https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
→ Nhập thẻ test NCB (9704198526191432198)
→ Hoàn tất thanh toán
→ VNPAY redirect về: http://localhost:5173/driver/payment-return?vnp_ResponseCode=00&...
```

**Bước 3 — [BE] PaymentController xử lý callback (vnpayReturn)**

```
File: PaymentController.java — vnpayReturn()
```
```java
// 3a. Xác minh chữ ký VNPAY (vnp_SecureHash)
// 3b. Nếu vnp_ResponseCode == "00" (thành công):
//     → Payment.status = COMPLETED
//     → ParkingPass.status = ACTIVE
//     → Nếu là checkout: session.status = COMPLETED, zone.currentCount -= 1
// 3c. Redirect FE về PaymentReturnPage với query params
```

**Bước 4 — [FE] PaymentReturnPage hiển thị kết quả**

```
File: PaymentReturnPage.jsx
```
- Thành công: hiệu ứng Confetti 🎉 + checkmark animation + biên lai chi tiết
- Thất bại: thông báo lỗi + hướng dẫn thử lại

### Luồng B: Thanh toán phí Check-out qua VNPAY

```
[Driver] Xem session → Bấm "Thanh toán online"
   ↓
[BE] initiateDriverVnPayCheckout() → Tính phí → Tạo Payment PENDING → Tạo URL VNPAY
   ↓
[FE] Redirect sang VNPAY Sandbox → Thanh toán
   ↓
[BE] vnpayReturn() → completeOnlineCheckoutPayment()
   → session.status = COMPLETED
   → zone.currentCount -= 1 (giải phóng slot)
   → WebSocket broadcast /topic/payments/confirmed
   ↓
[FE] PaymentReturnPage hiển thị kết quả
[Staff] Nhận notification real-time → xe đã thanh toán online
```

### Cấu hình VNPAY (application.yml):

```yaml
smartparking:
  vnpay:
    vnp_TmnCode: 2AS5E3Q3                          # Mã website VNPAY cấp
    vnp_HashSecret: 5DJ4Q95ESAEMBAM3H68QBKQ616DHTSZ4  # Key bí mật
    payment-url: https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
    return-url: http://localhost:5173/driver/payment-return  # FE nhận redirect
    ipn-url: https://<ngrok-url>/api/v1/driver/payments/vnpay-ipn  # Server-to-server
```

---

## 10.6. SYSTEM HANDLER — Các Background Job tự động

Actor **System Handler** thực hiện các tác vụ tự động mà không cần người dùng can thiệp:

### Job 1: Tự động hủy Reservation hết hạn

```
File: ReservationExpiryScheduler.java
Công nghệ: Spring @Scheduled(fixedRate = 30000)
```

| Bước | Mô tả |
|------|--------|
| 1 | Scheduler chạy mỗi 30 giây |
| 2 | Query tất cả reservation `PENDING`/`CONFIRMED` có `reservedTo < now` |
| 3 | Chuyển status → `EXPIRED` |
| 4 | Giảm `zone.reservedCount -= 1` (trả lại slot) |
| 5 | Nếu zone đang `FULL` → chuyển về `ACTIVE` |
| 6 | Log: `AUTO-EXPIRED reservation: code=RS..., plate=...` |

### Kiến trúc Background Job:

```
@EnableScheduling (SmartParkingApplication.java)
   ↓
Spring TaskScheduler thread pool
   ↓
┌─────────────────────────────────────┐
│ ReservationExpiryScheduler          │ ← @Scheduled(fixedRate = 30000)
│   → Hủy reservation hết hạn        │
│   → Giải phóng slot zone           │
└─────────────────────────────────────┘
```

### Mở rộng tiềm năng:

```java
// Chúc mừng sinh nhật — 7h sáng mỗi ngày
@Scheduled(cron = "0 0 7 * * *")
public void sendBirthdayGreetings() { ... }

// Nhắc reservation sắp hết — mỗi 5 phút
@Scheduled(fixedRate = 300000)
public void remindExpiringReservations() { ... }

// Báo cáo doanh thu cuối ngày — 23h59
@Scheduled(cron = "0 59 23 * * *")
public void generateDailyReport() { ... }
```

## 11. BẢNG TÓM TẮT API DRIVER

| # | Hành động | HTTP | Endpoint | Controller |
|---|-----------|------|----------|------------|
| 1 | Lấy biển số | GET | `/driver/plates` | DriverController |
| 2 | Thêm biển số | POST | `/driver/plates` | DriverController |
| 3 | Xóa biển số | DELETE | `/driver/plates?plate=` | DriverController |
| 4 | Xem session đang gửi | GET | `/driver/sessions/active?plate=` | SessionController |
| 5 | Lịch sử gửi xe | GET | `/driver/sessions/history?plate=` | SessionController |
| 6 | Đặt giữ chỗ | POST | `/driver/reservations` | ReservationController |
| 7 | Xem reservations | GET | `/driver/reservations` | ReservationController |
| 8 | Hủy reservation | DELETE | `/driver/reservations/{id}` | ReservationController |
| 9 | Thanh toán CK | POST | `/driver/payments/confirm` | PaymentController |
| 10 | Xem pricing plans | GET | `/driver/pricing-plans` | DriverController |
| 11 | Đăng ký pass | POST | `/driver/parking-passes` | DriverController |

### Bảng API cho Security (10 API):

| # | Hành động | HTTP | Endpoint | Controller |
|---|-----------|------|----------|------------|
| 1 | Báo cáo sự cố | POST | `/security/exceptions` | SecurityController |
| 2 | Xem sự cố | GET | `/security/exceptions` | SecurityController |
| 3 | Kích hoạt SOS | POST | `/security/emergency/activate` | SecurityController |
| 4 | Hủy SOS | POST | `/security/emergency/deactivate` | SecurityController |
| 5 | Trạng thái SOS | GET | `/security/emergency/status` | SecurityController |
| 6 | Lịch sử SOS | GET | `/security/emergency/history` | SecurityController |
| 7 | Cài đặt SOS | GET/PUT | `/security/emergency/settings` | SecurityController |
| 8 | Xem blacklist | GET | `/security/blacklist` | SecurityController |
| 9 | Thêm blacklist | POST | `/security/blacklist` | SecurityController |
| 10 | Gỡ blacklist | DELETE | `/security/blacklist/{id}` | SecurityController |

### Bảng API cho Admin (16 API):

| # | Hành động | HTTP | Endpoint | Controller |
|---|-----------|------|----------|------------|
| 1 | CRUD Users | GET/POST/PUT/DELETE | `/admin/users` | AdminManagementController |
| 2 | CRUD Zones | POST/PUT/DELETE | `/admin/zones` | AdminManagementController |
| 3 | CRUD Gates | POST/PUT/DELETE | `/admin/gates` | AdminManagementController |
| 4 | CRUD Pricing Rules | POST/PUT/DELETE | `/admin/pricing-rules` | AdminManagementController |
| 5 | CRUD Parking Passes | GET/POST/PUT/DELETE | `/admin/parking-passes` | AdminManagementController |
| 6 | Gia hạn Pass | POST | `/admin/parking-passes/{id}/renew` | AdminManagementController |
| 7 | Điều khiển barrier | PUT | `/admin/gates/{id}/barrier` | AdminManagementController |
| 8 | System Settings | GET/PUT | `/admin/settings` | AdminManagementController |

---

## 12. PHÂN QUYỀN 5 VAI TRÒ

| Role | Endpoints được phép | Dashboard |
|------|-------------------|-----------| 
| DRIVER | `/driver/**` | Quản lý biển số, xem session, đặt chỗ, thanh toán |
| STAFF | `/staff/**` + `/driver/**` | Check-in, Check-out |
| SECURITY | `/security/**` | Giám sát cổng, báo sự cố, SOS, blacklist |
| MANAGER | `/staff/**` + `/driver/**` | Xem lịch sử, thống kê |
| ADMIN | Tất cả | CRUD users, zones, gates, tariffs |

Backend kiểm tra quyền:
```java
@PreAuthorize("hasAnyRole('STAFF', 'MANAGER', 'ADMIN')")
// → Chỉ 3 role này mới được gọi endpoint này

@PreAuthorize("hasAnyRole('DRIVER', 'MANAGER', 'ADMIN')")
// → Driver + Manager + Admin được gọi
```

---

## 13. CẤU TRÚC THƯ MỤC (Cập nhật 03/06/2026)

```
frontend/src/
├── api/
│   ├── axiosClient.js          ← Axios + JWT interceptor (role-based token)
│   └── parkingApi.js            ← 42 API methods (Driver + Staff + Security + Admin)
├── pages/
│   ├── auth/LoginScreen.jsx     ← Landing page + Login + Register + OAuth (Google/Facebook)
│   ├── staff/
│   │   ├── StaffCheckIn.jsx     ← ★ Xe vào bãi (QR + AI OCR + Reservation code)
│   │   ├── StaffCheckOut.jsx    ← Xe ra bãi + WebSocket listener
│   │   └── StaffDashboard.jsx   ← Dashboard nhân viên (GSAP 7-step choreography)
│   ├── driver/
│   │   ├── DriverDashboard.jsx  ← ★ Dashboard tài xế (session, reservation, payment)
│   │   ├── DriverMapping.jsx    ← Bản đồ 3D nhún tài xế
│   │   └── ProfileTab.jsx       ← Quản lý biển số + Parking Pass
│   ├── security/
│   │   └── SecurityDashboard.jsx ← SOS + Blacklist + Exception Log (GSAP parity)
│   ├── manager/
│   │   ├── ManagerDashboard.jsx ← Thống kê, lịch sử, quản lý
│   │   └── ParkingDigitalTwin3D.jsx ← ★ Bản đồ 3D realtime (Three.js/R3F)
│   ├── admin/AdminDashboard.jsx ← CRUD users, zones, gates, pricing, passes
│   └── shared/ParkingTwin3DPage.jsx ← Wrapper cho 3D component dùng chung
├── route/AppRoutes.jsx          ← Điều hướng 5 role
└── App.jsx                      ← Root, quản lý auth state

backend/.../
├── controller/   (12 files)
│   ├── AuthController.java          ← Login, Register, OAuth2, Refresh
│   ├── DriverController.java        ← Plates, Parking Pass, Pricing Plans
│   ├── SessionController.java       ← Check-in, Check-out, Active Session, History
│   ├── ReservationController.java   ← CRUD Reservation
│   ├── PaymentController.java       ← Xác nhận thanh toán CK
│   ├── SecurityController.java      ← Exception logs, Blacklist, SOS
│   ├── AdminManagementController.java ← ★ CRUD users/zones/gates/pricing/passes/settings
│   ├── ParkingConfigController.java ← Config zones/gates/vehicleTypes (public)
│   ├── PublicInfoController.java    ← Thông tin bãi xe công khai (không cần auth)
│   ├── EmergencyPublicController.java ← SOS status public endpoint
│   └── HealthController.java        ← Health check / monitoring
├── service/    (12 files)
│   ├── AuthService.java             ← Xác thực + JWT + OAuth2
│   ├── ParkingSessionService.java   ← ★ Core: check-in/out + VNPAY checkout + WebSocket
│   ├── ReservationService.java      ← Đặt giữ chỗ + zone management
│   ├── ReservationExpiryScheduler.java ← ★ Background Job: tự động hủy reservation hết hạn
│   ├── PaymentConfirmationService.java ← ★ Real-time payment + WebSocket
│   ├── VnPayService.java            ← ★ Tích hợp VNPAY: tạo URL, xác minh callback
│   ├── PricingService.java          ← Tính phí theo giờ/ngày/tháng
│   ├── ZoneSuggestionService.java   ← Gợi ý zone tối ưu (low occupancy + near gate)
│   ├── BlacklistService.java        ← ★ CRUD biển số đen + lý do
│   ├── EmergencyService.java        ← ★ SOS kích hoạt/hủy + lịch sử + settings
│   └── SecurityExceptionService.java ← Ghi nhận sự cố an ninh
├── repository/   ← JPA interfaces (findByUser, findByLicensePlate...)
├── entity/       (16 files)
│   ├── User, Zone, Floor, Building, Gate, VehicleType
│   ├── ParkingSession, Payment, Reservation, ParkingPass
│   ├── PricingRule, UserLicensePlate, ExceptionLog
│   └── BlacklistPlate, EmergencyEvent, SystemSettings  ← Mới
├── dto/          ← Request/Response objects
└── config/
    ├── SecurityConfig.java      ← JWT filter chain, CORS, endpoint permissions
    ├── WebSocketConfig.java     ← STOMP /ws endpoint + /topic/* destinations
    └── DataInitializer.java     ← ★ Idempotent seed: 5 users, 4 floors, 11 zones, 6 gates
```
