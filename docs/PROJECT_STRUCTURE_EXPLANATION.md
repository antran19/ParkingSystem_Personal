# 📋 SmartParking — Giải thích Cấu trúc Dự án & Tên Package

## 🏗️ Tổng quan kiến trúc

Dự án **SmartParking** là hệ thống quản lý bãi xe thông minh cho tòa nhà, xây dựng theo **Clean Architecture** với Spring Boot 3.3.5 (Java 17).

```
smartparking-backend/
├── entity/          ← 13 bảng database (JPA entities)
├── repository/      ← Data access layer (JpaRepository)
├── service/         ← Business logic (core AI)
├── controller/      ← REST API endpoints
├── dto/             ← Request/Response objects
├── security/        ← JWT authentication
├── config/          ← Spring configuration
├── exception/       ← Error handling
└── util/            ← Utilities (JWT, helpers)
```

---

## 📦 Giải thích từng Package

### 1. **entity/** — Các bảng Database (13 entities)

**Tên package:** `entity` (không phải `model` hay `domain`)

**Lý do:**
- Trong Spring Data JPA, `@Entity` là annotation chính để đánh dấu class là một bảng database
- Tên `entity` rõ ràng hơn `model` (model có thể là DTO, VO, etc.)
- Tuân theo convention của Spring ecosystem

**Các entities chính:**

| Entity | Mục đích | Quan hệ |
|--------|---------|--------|
| **User** | Tài khoản (Admin, Manager, Staff, Driver) | 1 user → nhiều sessions |
| **Building** | Tòa nhà (địa chỉ, giờ hoạt động) | 1 building → nhiều floors |
| **Floor** | Tầng (B1, T1, T2...) | 1 floor → nhiều slots |
| **Slot** | Ô đỗ xe (B1-A01, T1-C15...) | 1 slot → 1 session (tại 1 thời điểm) |
| **VehicleType** | Loại xe (Xe máy, Ô tô, Xe điện) | 1 type → nhiều slots |
| **ParkingSession** | Phiên gửi xe (check-in → check-out) | 1 session → 1 payment |
| **Payment** | Thanh toán (CASH, ONLINE, QR_CODE) | Polymorphic (SESSION, MONTHLY_PASS, RESERVATION) |
| **PricingRule** | Bảng giá (5000đ/h xe máy, 20000đ/h ô tô) | Per building + vehicle type |
| **Gate** | Cổng vào/ra | 1 gate → nhiều sessions |
| **Reservation** | Đặt chỗ trước | 1 reservation → 1 slot |
| **MonthlyPass** | Vé tháng | 1 pass → 1 user |
| **ExceptionLog** | Log lỗi hệ thống | Audit trail |
| **Zone** | Khu vực (A, B, C...) | 1 zone → nhiều slots |

**Ví dụ code:**
```java
@Entity
@Table(name = "parking_sessions")
public class ParkingSession {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "slot_id")
    private Slot slot;  // Mối quan hệ N-1
    
    @Enumerated(EnumType.STRING)
    private SessionStatus status;  // ACTIVE, COMPLETED, CANCELLED
}
```

---

### 2. **repository/** — Data Access Layer

**Tên package:** `repository` (không phải `dao` hay `persistence`)

**Lý do:**
- Spring Data JPA gọi là `Repository` pattern (từ Domain-Driven Design)
- `@Repository` annotation là chuẩn Spring
- Tên `dao` (Data Access Object) là cũ (thời Hibernate 3.x)

**Các repositories:**

```java
@Repository
public interface SlotRepository extends JpaRepository<Slot, UUID> {
    
    // Custom query — tìm slot trống theo loại xe
    @Query("SELECT s FROM Slot s WHERE s.vehicleType.id = :vehicleTypeId AND s.status = 'AVAILABLE'")
    List<Slot> findAvailableSlotsByVehicleType(@Param("vehicleTypeId") UUID vehicleTypeId);
    
    // Đếm slot trống theo tòa nhà (dùng cho suggest alternative)
    @Query("SELECT COUNT(s) FROM Slot s WHERE s.floor.building.id = :buildingId AND s.status = 'AVAILABLE'")
    long countAvailableByBuilding(@Param("buildingId") UUID buildingId);
}
```

**Tại sao dùng custom @Query?**
- Method name quá dài: `findByFloorBuildingIdAndStatusAndVehicleTypeId...` → khó đọc
- Custom JPQL rõ ràng hơn, dễ optimize

---

### 3. **service/** — Business Logic (Core AI)

**Tên package:** `service` (không phải `business` hay `logic`)

**Lý do:**
- Spring gọi là `@Service` (application service layer)
- Chứa tất cả business rules, không phải chỉ CRUD
- Nơi gọi repository, tính toán, broadcast WebSocket

**Các services chính:**

#### **ParkingSessionService** — Xử lý check-in/check-out
```java
@Service
public class ParkingSessionService {
    
    // UC-04: Check-in (xe vào bãi)
    @Transactional
    public SessionResponse checkIn(CheckInRequest request) {
        // 1. Validate biển số không bị trùng
        // 2. Tìm slot tối ưu (gọi SlotAssignmentService)
        // 3. Tạo ParkingSession
        // 4. Broadcast thay đổi qua WebSocket
        // 5. Trả response hướng dẫn tài xế
    }
    
    // UC-05: Check-out (xe ra bãi)
    @Transactional
    public SessionResponse checkOut(CheckOutRequest request) {
        // 1. Tìm session đang ACTIVE
        // 2. Tính thời gian + phí
        // 3. Tạo Payment record
        // 4. Giải phóng slot
        // 5. Broadcast
    }
}
```

#### **SlotAssignmentService** — AI phân bổ slot (Core RQ3)
```java
@Service
public class SlotAssignmentService {
    
    // Thuật toán scoring ưu tiên:
    // 1. Loại xe phải đúng (bắt buộc)
    // 2. Tầng thấp hơn (floorNumber nhỏ)
    // 3. Gần cổng/thang máy hơn (distanceToGate ASC)
    // 4. Cân bằng tải giữa các tầng
    
    public Slot assignOptimalSlot(VehicleType vehicleType, UUID sessionId) {
        List<Slot> candidates = slotRepository.findAvailableSlotsByVehicleType(vehicleType.getId());
        
        // Sort theo scoring
        candidates.sort(Comparator
            .comparingInt((Slot s) -> Math.abs(s.getFloor().getFloorNumber()))
            .thenComparingInt(s -> s.getDistanceToGate() != null ? s.getDistanceToGate() : 9999)
        );
        
        // Redis distributed lock (chống race condition)
        for (Slot candidate : candidates) {
            Boolean locked = redisTemplate.opsForValue()
                .setIfAbsent(lockKey, sessionId.toString(), 60, TimeUnit.SECONDS);
            
            if (Boolean.TRUE.equals(locked)) {
                return candidate;  // Đã lock thành công
            }
        }
    }
}
```

**Tại sao dùng Redis lock?**
- Khi 2 xe check-in cùng lúc, cả 2 có thể chọn cùng 1 slot
- Redis `setIfAbsent` là atomic operation → chỉ 1 xe được lock
- TTL 60s tự động release nếu session crash

#### **PricingService** — Tính phí
```java
@Service
public class PricingService {
    
    // Công thức: phí = ceil((durationMinutes - freeMinutes) / 60) × pricePerUnit
    // Ví dụ: 1h01 gửi xe máy (5000đ/h, 0 phút miễn phí)
    //        → tính 2 giờ → 10.000đ
    
    public BigDecimal calculateFee(UUID buildingId, UUID vehicleTypeId, int durationMinutes) {
        PricingRule rule = pricingRuleRepository
            .findByBuildingIdAndVehicleTypeIdAndPricingType(buildingId, vehicleTypeId, HOURLY)
            .orElse(null);
        
        int chargeableMinutes = Math.max(0, durationMinutes - rule.getFreeMinutes());
        int hours = (int) Math.ceil((double) chargeableMinutes / 60.0);
        
        return rule.getPricePerUnit().multiply(BigDecimal.valueOf(hours));
    }
}
```

#### **SlotMapService** — Tạo dữ liệu sơ đồ bãi xe
```java
@Service
public class SlotMapService {
    
    // Trả về JSON cấu trúc: Building → Floors → Zones → Slots
    // Dùng để FE render interactive parking map
    
    public SlotMapResponse getSlotMap(UUID buildingId) {
        // Nhóm slot theo Floor → Zone
        // Đếm: totalSlots, availableSlots, occupiedSlots, reservedSlots
        // Trả về SlotMapResponse (nested DTO)
    }
}
```

#### **AuthService** — Xác thực & JWT
```java
@Service
public class AuthService {
    
    public LoginResponse login(LoginRequest request) {
        // 1. Xác thực email/password (Spring Security)
        // 2. Sinh access token (1 giờ) + refresh token (7 ngày)
        // 3. Trả về user info + tokens
    }
    
    public LoginResponse refreshToken(String refreshToken) {
        // Validate refresh token → sinh access token mới
    }
}
```

---

### 4. **controller/** — REST API Endpoints

**Tên package:** `controller` (không phải `api` hay `endpoint`)

**Lý do:**
- Spring gọi là `@RestController` (MVC pattern)
- Tên `controller` rõ ràng hơn `api` (api là khái niệm rộng)

**Các controllers:**

```java
@RestController
@RequestMapping("/api/v1")
public class SlotController {
    
    // GET /api/v1/public/slots/map/{buildingId}
    // → Lấy sơ đồ bãi xe (public, không cần login)
    @GetMapping("/public/slots/map/{buildingId}")
    public ResponseEntity<ApiResponse<SlotMapResponse>> getSlotMap(@PathVariable UUID buildingId) {
        SlotMapResponse response = slotMapService.getSlotMap(buildingId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    
    // POST /api/v1/auth/login
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập thành công", response));
    }
}
```

**API Versioning:** `/api/v1/` → dễ upgrade sang v2 sau này

---

### 5. **dto/** — Request/Response Objects

**Tên package:** `dto` (Data Transfer Object)

**Lý do:**
- DTO tách biệt entity từ API contract
- Có thể validate, transform dữ liệu
- FE không cần biết cấu trúc database

**Cấu trúc:**
```
dto/
├── request/
│   ├── LoginRequest
│   ├── CheckInRequest
│   └── CheckOutRequest
└── response/
    ├── ApiResponse<T>      ← Wrapper chung
    ├── LoginResponse
    ├── SessionResponse
    └── SlotMapResponse
```

**Ví dụ:**
```java
// Request DTO — validate input
@Data
public class CheckInRequest {
    @NotNull
    private UUID vehicleTypeId;
    
    @NotBlank
    private String licensePlate;
    
    @NotNull
    private UUID gateEntryId;
}

// Response DTO — format output
@Data @Builder
public class SessionResponse {
    private UUID sessionId;
    private String sessionCode;      // PS20260516-A3F
    private String licensePlate;
    private String slotCode;         // B1-A01
    private LocalDateTime entryTime;
    private BigDecimal totalFee;
    private String guideMessage;     // "Vui lòng đến Tầng B1 - Ô số B1-A01"
}

// Wrapper chung cho tất cả API
@Data @Builder
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
}
```

---

### 6. **security/** — JWT Authentication

**Tên package:** `security` (không phải `auth` hay `jwt`)

**Lý do:**
- Spring Security là framework chính
- `security` bao gồm cả authentication + authorization

**Các components:**

```java
// JwtAuthFilter — chạy 1 lần mỗi request
@Component
public class JwtAuthFilter extends OncePerRequestFilter {
    
    protected void doFilterInternal(HttpServletRequest request, ...) {
        // 1. Đọc Bearer token từ Authorization header
        // 2. Validate token (signature, expiration)
        // 3. Set SecurityContext (Spring Security biết user là ai)
        // 4. Cho request tiếp tục
    }
}

// JwtUtil — sinh & validate token
@Component
public class JwtUtil {
    
    public String generateAccessToken(UserDetails userDetails) {
        // Sinh JWT: header.payload.signature
        // Payload chứa: email, role, type=access, exp=now+1h
    }
    
    public boolean isTokenValid(String token, UserDetails userDetails) {
        // Verify signature + check expiration
    }
}
```

**Flow xác thực:**
```
Client request
    ↓
JwtAuthFilter (đọc token)
    ↓
JwtUtil.isTokenValid() (verify)
    ↓
SecurityContext.setAuthentication() (Spring biết user)
    ↓
@PreAuthorize("hasRole('ADMIN')") (check quyền)
    ↓
Controller method
```

---

### 7. **config/** — Spring Configuration

**Tên package:** `config` (không phải `configuration`)

**Lý do:**
- `@Configuration` annotation
- Tên ngắn gọn, dễ nhớ

**Các configs:**

```java
// SecurityConfig — cấu hình Spring Security
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    // Endpoint public (không cần token)
    private static final String[] PUBLIC_ENDPOINTS = {
        "/api/v1/auth/**",      // Login, refresh
        "/api/v1/public/**",    // Xem sơ đồ bãi xe
        "/actuator/health"
    };
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) {
        http
            .csrf(AbstractHttpConfigurer::disable)  // Stateless API
            .sessionManagement(session -> 
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(PUBLIC_ENDPOINTS).permitAll()
                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/v1/manager/**").hasAnyRole("ADMIN", "MANAGER")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
}

// WebSocketConfig — cấu hình WebSocket (real-time slot status)
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    
    // Client subscribe: /topic/slots/{buildingId}
    // Server broadcast: messagingTemplate.convertAndSend("/topic/slots/...", message)
}
```

---

### 8. **exception/** — Error Handling

**Tên package:** `exception` (không phải `error` hay `handler`)

**Lý do:**
- Java convention: `throw new BusinessException(...)`
- Tên `exception` rõ ràng hơn `error`

**Các exceptions:**

```java
// BusinessException — lỗi business logic
public class BusinessException extends RuntimeException {
    public BusinessException(String message) {
        super(message);
    }
}
// Ví dụ: "Biển số đang có phiên gửi xe chưa kết thúc"

// ResourceNotFoundException — resource không tồn tại
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
// Ví dụ: "Tòa nhà không tồn tại: {buildingId}"

// GlobalExceptionHandler — xử lý tất cả exceptions
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusiness(BusinessException ex) {
        // Trả về 400 Bad Request + message
    }
    
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        // Trả về 404 Not Found
    }
    
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex) {
        // Trả về 403 Forbidden
    }
}
```

---

### 9. **util/** — Utilities

**Tên package:** `util` (không phải `helper` hay `common`)

**Lý do:**
- Java convention: `java.util.*`
- Chứa các utility classes (static methods, helpers)

**Các utils:**

```java
// JwtUtil — sinh & validate JWT
@Component
public class JwtUtil {
    public String generateAccessToken(UserDetails userDetails) { ... }
    public boolean isTokenValid(String token, UserDetails userDetails) { ... }
}

// Có thể thêm sau:
// - DateUtil — format ngày giờ
// - ValidationUtil — validate input
// - FileUtil — upload ảnh xe
```

---

## 🔄 Flow Chính: Check-in Xe

```
1. Driver gọi POST /api/v1/sessions/check-in
   {
     "vehicleTypeId": "uuid-xe-may",
     "licensePlate": "29A-12345",
     "gateEntryId": "uuid-gate-1"
   }

2. AuthController → AuthService.login() → JwtUtil.generateAccessToken()
   (Nếu chưa login)

3. JwtAuthFilter validate token → SecurityContext.setAuthentication()

4. SessionController → ParkingSessionService.checkIn()
   
5. ParkingSessionService:
   a. Validate biển số không bị trùng (BR-06)
   b. Gọi SlotAssignmentService.assignOptimalSlot()
      - Lấy tất cả slot AVAILABLE loại xe máy
      - Sort theo: tầng thấp → gần cổng
      - Redis lock (chống race condition)
   c. Tạo ParkingSession entity
   d. Broadcast qua WebSocket: /topic/slots/{buildingId}
      {
        "slotId": "uuid",
        "slotCode": "B1-A01",
        "status": "OCCUPIED",
        "timestamp": "2026-05-16T10:30:00"
      }
   e. Trả response:
      {
        "success": true,
        "data": {
          "sessionCode": "PS20260516-A3F",
          "slotCode": "B1-A01",
          "guideMessage": "Vui lòng đến Tầng B1 - Ô số B1-A01"
        }
      }

6. FE nhận WebSocket message → update UI (slot B1-A01 → đỏ/occupied)

7. Driver đỗ xe tại B1-A01
```

---

## 🔄 Flow Chính: Check-out Xe

```
1. Driver gọi POST /api/v1/sessions/check-out
   {
     "sessionCode": "PS20260516-A3F",
     "gateExitId": "uuid-gate-2",
     "paymentMethod": "CASH"
   }

2. ParkingSessionService.checkOut():
   a. Tìm session đang ACTIVE
   b. Tính thời gian: exitTime - entryTime
   c. Gọi PricingService.calculateFee()
      - Lấy bảng giá (5000đ/h xe máy)
      - Tính: ceil(duration / 60) × 5000
   d. Tạo Payment record
   e. Giải phóng slot:
      - slot.setStatus(AVAILABLE)
      - slotAssignmentService.releaseSlotLock()
   f. Broadcast WebSocket: slot B1-A01 → AVAILABLE (xanh)
   g. Trả response:
      {
        "success": true,
        "data": {
          "sessionCode": "PS20260516-A3F",
          "durationMinutes": 65,
          "totalFee": 10000,
          "paymentStatus": "COMPLETED"
        }
      }

3. FE nhận WebSocket → update UI (slot B1-A01 → xanh/available)
```

---

## 📊 Database Schema (13 bảng)

```sql
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

## 🎯 Tại sao đặt tên như vậy?

| Package | Tên | Lý do |
|---------|-----|-------|
| entity | entity | Spring JPA convention (@Entity) |
| repository | repository | Spring Data pattern (Repository interface) |
| service | service | Spring @Service annotation |
| controller | controller | Spring @RestController annotation |
| dto | dto | Industry standard (Data Transfer Object) |
| security | security | Spring Security framework |
| config | config | @Configuration annotation |
| exception | exception | Java convention (throw new Exception) |
| util | util | Java convention (java.util.*) |

**Tóm lại:** Tất cả tên package đều tuân theo **Spring Boot convention** và **Java best practices**, không phải tên tùy ý.

---

## 🚀 Công nghệ Stack

- **Framework:** Spring Boot 3.3.5
- **Language:** Java 17
- **Database:** PostgreSQL 15
- **Cache/Lock:** Redis 7
- **Authentication:** JWT (JJWT 0.12.6)
- **Real-time:** WebSocket (Spring WebSocket)
- **Build:** Maven
- **ORM:** Hibernate JPA

---

## 📝 Ghi chú quan trọng

1. **Stateless API:** Không dùng session, chỉ dùng JWT token
2. **Redis Lock:** Chống race condition khi 2 xe check-in cùng lúc
3. **WebSocket Broadcast:** Real-time update slot status cho tất cả client
4. **Transactional:** `@Transactional` đảm bảo consistency (check-in/check-out)
5. **Lazy Loading:** `FetchType.LAZY` tránh N+1 query problem
6. **Custom Queries:** Dùng `@Query` thay vì method name quá dài

