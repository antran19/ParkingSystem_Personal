# 📌 SmartParking — Tóm tắt Toàn bộ Dự án

## 🎯 Mục đích Dự án

Xây dựng hệ thống quản lý bãi xe thông minh cho tòa nhà với:
- ✅ Check-in/Check-out tự động
- ✅ AI phân bổ slot tối ưu
- ✅ Tính phí tự động
- ✅ Real-time slot map (WebSocket)
- ✅ JWT authentication + RBAC
- ✅ Distributed lock (Redis) chống race condition

---

## 📦 Package Structure & Tên Gọi

### Tại sao đặt tên như vậy?

Tất cả tên package tuân theo **Spring Boot convention** và **Java best practices**:

| Package | Tên | Lý do |
|---------|-----|-------|
| **entity** | entity | Spring JPA annotation: `@Entity` |
| **repository** | repository | Spring Data pattern: `Repository` interface |
| **service** | service | Spring annotation: `@Service` |
| **controller** | controller | Spring annotation: `@RestController` |
| **dto** | dto | Industry standard: Data Transfer Object |
| **security** | security | Spring Security framework |
| **config** | config | Spring annotation: `@Configuration` |
| **exception** | exception | Java convention: `throw new Exception` |
| **util** | util | Java convention: `java.util.*` |

### Giải thích từng Package

#### 1. **entity/** — 13 bảng Database
```
User → Building → Floor → Slot → VehicleType
                                ↓
                        ParkingSession → Payment
                                ↓
                        PricingRule, Gate, Reservation, MonthlyPass, ExceptionLog, Zone
```

**Mối quan hệ chính:**
- 1 Building → nhiều Floors
- 1 Floor → nhiều Slots
- 1 Slot → 1 ParkingSession (tại 1 thời điểm)
- 1 ParkingSession → 1 Payment

#### 2. **repository/** — Data Access Layer
```java
@Repository
public interface SlotRepository extends JpaRepository<Slot, UUID> {
    @Query("SELECT s FROM Slot s WHERE s.vehicleType.id = :vehicleTypeId AND s.status = 'AVAILABLE'")
    List<Slot> findAvailableSlotsByVehicleType(@Param("vehicleTypeId") UUID vehicleTypeId);
}
```

**Tại sao dùng custom @Query?**
- Method name quá dài → khó đọc
- Custom JPQL rõ ràng hơn, dễ optimize

#### 3. **service/** — Business Logic (Core AI)
```
ParkingSessionService (check-in/check-out)
    ↓
SlotAssignmentService (AI phân bổ slot)
    ↓
PricingService (tính phí)
    ↓
SlotMapService (sơ đồ bãi xe)
    ↓
AuthService (xác thực JWT)
```

**Tại sao tách service?**
- Mỗi service có 1 trách nhiệm duy nhất (Single Responsibility)
- Dễ test (mock dependencies)
- Dễ reuse (nhiều controller gọi cùng 1 service)

#### 4. **controller/** — REST API Endpoints
```
/api/v1/auth/login          → AuthController
/api/v1/sessions/check-in   → SessionController
/api/v1/sessions/check-out  → SessionController
/api/v1/public/slots/map    → SlotController
```

**API Versioning:** `/api/v1/` → dễ upgrade sang v2 sau này

#### 5. **dto/** — Request/Response Objects
```
Request DTO  → Validate input
Response DTO → Format output
ApiResponse  → Wrapper chung
```

**Tại sao tách DTO?**
- FE không cần biết cấu trúc database
- Có thể validate, transform dữ liệu
- Ẩn sensitive fields (password, token, etc.)

#### 6. **security/** — JWT Authentication
```
JwtAuthFilter  → Validate token mỗi request
JwtUtil        → Sinh & validate JWT
SecurityConfig → Cấu hình Spring Security
```

**Flow:**
```
Request → JwtAuthFilter → JwtUtil.isTokenValid() → SecurityContext → Controller
```

#### 7. **config/** — Spring Configuration
```
SecurityConfig  → Spring Security + JWT
WebSocketConfig → WebSocket (real-time)
```

#### 8. **exception/** — Error Handling
```
BusinessException           → Lỗi business logic (400)
ResourceNotFoundException   → Resource không tồn tại (404)
GlobalExceptionHandler      → Xử lý tất cả exceptions
```

#### 9. **util/** — Utilities
```
JwtUtil → Sinh & validate JWT
```

---

## 🤖 Core AI: SlotAssignmentService

**Thuật toán phân bổ slot tối ưu (RQ3):**

```
Tiêu chí ưu tiên (từ cao đến thấp):
1. Loại xe phải đúng (bắt buộc)
2. Tầng thấp hơn (floorNumber nhỏ)
3. Gần cổng/thang máy hơn (distanceToGate ASC)
4. Cân bằng tải giữa các tầng
```

**Ví dụ Scoring:**
```
Slot 1: B1-A01 (floor=-1, distance=10m) → score = 1*100 + 10 = 110
Slot 2: B1-B05 (floor=-1, distance=25m) → score = 1*100 + 25 = 125
Slot 3: T1-A03 (floor=1,  distance=5m)  → score = 1*100 + 5 = 105 ✅ BEST
Slot 4: T1-C10 (floor=1,  distance=30m) → score = 1*100 + 30 = 130
Slot 5: T2-A01 (floor=2,  distance=8m)  → score = 2*100 + 8 = 208

Chọn: T1-A03 (tầng thấp, gần cổng)
```

**Redis Distributed Lock:**
```
Scenario: 2 xe check-in cùng lúc

Không có lock:
  Thread 1: SELECT slot B1-A01 (AVAILABLE)
  Thread 2: SELECT slot B1-A01 (AVAILABLE)
  Thread 1: UPDATE slot B1-A01 (OCCUPIED)
  Thread 2: UPDATE slot B1-A01 (OCCUPIED)
  ❌ Cả 2 xe được gán cùng 1 slot!

Có Redis lock:
  Thread 1: SETNX slot:lock:B1-A01 session1 60s → OK
  Thread 2: SETNX slot:lock:B1-A01 session2 60s → FAIL
  Thread 1: UPDATE slot B1-A01 (OCCUPIED)
  Thread 2: Thử slot tiếp theo
  ✅ Chỉ 1 xe được gán!
```

---

## 💰 PricingService: Tính Phí

**Công thức:**
```
Nếu durationMinutes <= freeMinutes → phí = 0
Nếu không:
  chargeableMinutes = durationMinutes - freeMinutes
  hours = ceil(chargeableMinutes / 60)
  totalFee = hours × pricePerUnit
```

**Ví dụ:**
```
Bảng giá: Xe máy, 5000đ/h, 0 phút miễn phí

Gửi 30 phút  → ceil(30/60) = 1h  → 5000đ
Gửi 65 phút  → ceil(65/60) = 2h  → 10000đ
Gửi 120 phút → ceil(120/60) = 2h → 10000đ
Gửi 121 phút → ceil(121/60) = 3h → 15000đ
```

---

## 🔐 JWT Authentication Flow

**1. Login:**
```
POST /api/v1/auth/login
{
  "email": "staff@parking.vn",
  "password": "123456"
}
↓
AuthService.login()
  - Xác thực email/password (Spring Security)
  - Sinh access token (1 giờ) + refresh token (7 ngày)
  - Trả về tokens + user info
```

**2. Sử dụng Token:**
```
GET /api/v1/sessions/check-in
Authorization: Bearer <access_token>
↓
JwtAuthFilter.doFilterInternal()
  - Đọc Bearer token
  - Validate token (signature, expiration)
  - Set SecurityContext
  - Cho request tiếp tục
↓
SecurityConfig.filterChain()
  - Check @PreAuthorize("hasRole('STAFF')")
  - Nếu OK → cho vào controller
  - Nếu không → 403 Forbidden
```

**3. Refresh Token:**
```
POST /api/v1/auth/refresh
Authorization: Bearer <refresh_token>
↓
AuthService.refreshToken()
  - Validate refresh token
  - Sinh access token mới
  - Trả về access token mới
```

---

## 🌐 WebSocket: Real-time Slot Status

**Client Subscribe:**
```javascript
stompClient.subscribe('/topic/slots/{buildingId}', function(message) {
    const slotUpdate = JSON.parse(message.body);
    // Update UI: B1-A01 → OCCUPIED (đỏ)
});
```

**Server Broadcast:**
```java
messagingTemplate.convertAndSend("/topic/slots/" + buildingId, message);
```

**Message Format:**
```json
{
  "slotId": "770e8400-e29b-41d4-a716-446655440001",
  "slotCode": "B1-A01",
  "status": "OCCUPIED",
  "floorName": "B1",
  "timestamp": "2026-05-16T10:30:00"
}
```

---

## 📊 Database Schema (13 bảng)

```
users (id, email, password_hash, full_name, role, is_active, created_at)
buildings (id, name, address, operating_hours_start, operating_hours_end)
floors (id, building_id, floor_number, floor_name, vehicle_type_id, total_slots)
slots (id, floor_id, slot_code, vehicle_type_id, status, distance_to_gate)
vehicle_types (id, name, description)
parking_sessions (id, session_code, slot_id, gate_entry_id, gate_exit_id, 
                  license_plate, entry_time, exit_time, duration_minutes, 
                  base_fee, total_fee, status)
payments (id, reference_type, reference_id, amount, payment_method, status, 
          transaction_id, paid_at)
pricing_rules (id, building_id, vehicle_type_id, pricing_type, price_per_unit, 
               free_minutes)
gates (id, building_id, gate_name, gate_type, is_active)
reservations (id, user_id, slot_id, reserved_from, reserved_to, status)
monthly_passes (id, user_id, building_id, valid_from, valid_to, status)
exception_logs (id, error_type, error_message, stack_trace, created_at)
zones (id, floor_id, zone_code, zone_name)
```

---

## 🏗️ Design Patterns Được Sử Dụng

| Pattern | Mục đích | Ví dụ |
|---------|---------|-------|
| **Repository** | Tách data access | SlotRepository |
| **Service Layer** | Business logic | ParkingSessionService |
| **DTO** | Tách entity từ API | SessionResponse |
| **Dependency Injection** | Loose coupling | Constructor injection |
| **Strategy** | Thay đổi thuật toán | Slot assignment algorithm |
| **Decorator** | Wrap response | ApiResponse<T> |
| **Observer** | Real-time update | WebSocket broadcast |
| **Singleton** | 1 instance | Spring beans |

---

## ✅ Best Practices

| Practice | Mục đích | Lợi ích |
|----------|---------|---------|
| **@Transactional** | Data consistency | Tránh partial updates |
| **Lazy Loading** | Tránh N+1 query | Tăng performance |
| **Redis Lock** | Chống race condition | Atomic operation |
| **Validation** | Input validation | Tập trung ở boundary |
| **Logging** | Debug & monitor | Dễ troubleshoot |
| **Exception Handling** | Centralized error | Consistent format |
| **Immutable DTO** | Thread-safe | Dễ test |
| **Enum** | Type-safe status | Tránh typo |
| **Builder** | Readable code | Dễ maintain |
| **Polymorphic Ref** | Flexible schema | Tránh duplicate table |

---

## 🚀 Chạy Dự án

### Bước 1: Start Database & Redis
```bash
docker-compose up -d
```

### Bước 2: Chạy Backend
```bash
cd backend
./mvnw spring-boot:run
```

### Bước 3: Test API
```bash
curl http://localhost:8080/actuator/health
```

---

## 📚 Tài liệu Chi tiết

1. **PROJECT_STRUCTURE_EXPLANATION.md** — Cấu trúc dự án & tên package
2. **CODE_LOGIC_EXPLANATION.md** — Giải thích code logic chi tiết
3. **DESIGN_PATTERNS_AND_BEST_PRACTICES.md** — Design patterns & best practices
4. **QUICK_START_GUIDE.md** — Hướng dẫn chạy & troubleshooting

---

## 🎯 Các Use Case Chính

| UC | Tên | Mô tả |
|----|-----|-------|
| UC-04 | Check-in | Xe vào bãi, gán slot tối ưu |
| UC-05 | Check-out | Xe ra bãi, tính phí, giải phóng slot |
| UC-14 | View Session | Xem thông tin phiên gửi xe |
| UC-15 | View Slot Map | Xem sơ đồ bãi xe real-time |
| UC-01 | Login | Đăng nhập hệ thống |
| UC-02 | Logout | Đăng xuất hệ thống |
| UC-03 | Refresh Token | Làm mới access token |

---

## 🔑 Công nghệ Stack

- **Framework:** Spring Boot 3.3.5
- **Language:** Java 17
- **Database:** PostgreSQL 15
- **Cache/Lock:** Redis 7
- **Authentication:** JWT (JJWT 0.12.6)
- **Real-time:** WebSocket (Spring WebSocket)
- **Build:** Maven
- **ORM:** Hibernate JPA

---

## 📝 Ghi chú Quan Trọng

1. **Stateless API** — Không dùng session, chỉ dùng JWT token
2. **Redis Lock** — Chống race condition khi 2 xe check-in cùng lúc
3. **WebSocket Broadcast** — Real-time update slot status cho tất cả client
4. **@Transactional** — Đảm bảo consistency (check-in/check-out)
5. **Lazy Loading** — `FetchType.LAZY` tránh N+1 query problem
6. **Custom Queries** — Dùng `@Query` thay vì method name quá dài

---

## 🎓 Tóm lại

**SmartParking** là một dự án Spring Boot hoàn chỉnh với:

✅ **Architecture:** Clean Architecture (entity → repository → service → controller)
✅ **Security:** JWT authentication + RBAC
✅ **Performance:** Redis lock + Lazy loading + Connection pooling
✅ **Real-time:** WebSocket broadcast
✅ **AI:** Smart slot assignment algorithm
✅ **Best Practices:** Design patterns, error handling, logging, testing

Tất cả tên package đều tuân theo **Spring Boot convention** và **Java best practices**, không phải tên tùy ý.

---

**Happy Coding! 🚀**

