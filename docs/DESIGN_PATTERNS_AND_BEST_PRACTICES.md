# 🏗️ SmartParking — Design Patterns & Best Practices

## 📐 Các Design Patterns Được Sử Dụng

### 1. **Repository Pattern** (Data Access Layer)

**Mục đích:** Tách biệt logic truy cập database từ business logic

**Cách dùng:**
```java
// Interface
@Repository
public interface SlotRepository extends JpaRepository<Slot, UUID> {
    @Query("SELECT s FROM Slot s WHERE s.vehicleType.id = :vehicleTypeId AND s.status = 'AVAILABLE'")
    List<Slot> findAvailableSlotsByVehicleType(@Param("vehicleTypeId") UUID vehicleTypeId);
}

// Service
@Service
public class SlotAssignmentService {
    private final SlotRepository slotRepository;
    
    public Slot assignOptimalSlot(VehicleType vehicleType, UUID sessionId) {
        List<Slot> candidates = slotRepository.findAvailableSlotsByVehicleType(vehicleType.getId());
        // ...
    }
}
```

**Lợi ích:**
- Dễ test (mock repository)
- Dễ thay đổi database (PostgreSQL → MongoDB)
- Tập trung query logic ở 1 chỗ

---

### 2. **Service Layer Pattern** (Business Logic)

**Mục đích:** Chứa tất cả business rules, không phải chỉ CRUD

**Cách dùng:**
```java
@Service
public class ParkingSessionService {
    
    private final ParkingSessionRepository sessionRepository;
    private final SlotAssignmentService slotAssignmentService;
    private final PricingService pricingService;
    private final SimpMessagingTemplate messagingTemplate;
    
    @Transactional
    public SessionResponse checkIn(CheckInRequest request) {
        // 1. Validate
        // 2. Tìm slot tối ưu
        // 3. Tạo session
        // 4. Broadcast WebSocket
        // 5. Trả response
    }
}
```

**Lợi ích:**
- Business logic tập trung ở 1 chỗ
- Dễ test (mock dependencies)
- Dễ reuse (nhiều controller có thể gọi cùng 1 service)

---

### 3. **DTO (Data Transfer Object) Pattern**

**Mục đích:** Tách biệt entity từ API contract

**Cách dùng:**
```java
// Entity (database)
@Entity
@Table(name = "parking_sessions")
public class ParkingSession {
    @Id
    private UUID id;
    @ManyToOne
    private Slot slot;
    @ManyToOne
    private User staffEntry;
    // ... 20+ fields
}

// Request DTO (input validation)
@Data
public class CheckInRequest {
    @NotNull
    private UUID vehicleTypeId;
    @NotBlank
    private String licensePlate;
    @NotNull
    private UUID gateEntryId;
}

// Response DTO (output formatting)
@Data @Builder
public class SessionResponse {
    private UUID sessionId;
    private String sessionCode;
    private String licensePlate;
    private String slotCode;
    private String guideMessage;
    // Chỉ những field cần thiết cho FE
}
```

**Lợi ích:**
- FE không cần biết cấu trúc database
- Có thể validate input
- Có thể transform dữ liệu (ẩn sensitive fields)

---

### 4. **Dependency Injection Pattern**

**Mục đích:** Loose coupling, dễ test

**Cách dùng:**
```java
@Service
public class ParkingSessionService {
    
    private final ParkingSessionRepository sessionRepository;
    private final SlotRepository slotRepository;
    private final SlotAssignmentService slotAssignmentService;
    private final PricingService pricingService;
    
    // Constructor injection (Spring tự inject)
    public ParkingSessionService(
            ParkingSessionRepository sessionRepository,
            SlotRepository slotRepository,
            SlotAssignmentService slotAssignmentService,
            PricingService pricingService
    ) {
        this.sessionRepository = sessionRepository;
        this.slotRepository = slotRepository;
        this.slotAssignmentService = slotAssignmentService;
        this.pricingService = pricingService;
    }
}
```

**Lợi ích:**
- Dễ test (inject mock objects)
- Dễ thay đổi implementation
- Spring quản lý lifecycle

---

### 5. **Strategy Pattern** (Slot Assignment Algorithm)

**Mục đích:** Có thể thay đổi thuật toán mà không thay đổi code gọi

**Cách dùng:**
```java
// Hiện tại: sort theo floor + distance
candidates.sort(Comparator
    .comparingInt((Slot s) -> Math.abs(s.getFloor().getFloorNumber()))
    .thenComparingInt(s -> s.getDistanceToGate() != null ? s.getDistanceToGate() : 9999)
);

// Trong tương lai: có thể thêm strategy khác
// - Ưu tiên slot gần nhất (distance first)
// - Ưu tiên cân bằng tải (load balancing)
// - Ưu tiên slot có camera (security)
```

---

### 6. **Decorator Pattern** (ApiResponse Wrapper)

**Mục đích:** Wrap response với metadata (success, message, data)

**Cách dùng:**
```java
@Data @Builder
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
    
    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
            .success(true)
            .message("Success")
            .data(data)
            .build();
    }
    
    public static <T> ApiResponse<T> error(String message) {
        return ApiResponse.<T>builder()
            .success(false)
            .message(message)
            .data(null)
            .build();
    }
}

// Sử dụng
return ResponseEntity.ok(ApiResponse.success(response));
return ResponseEntity.badRequest().body(ApiResponse.error("Invalid input"));
```

**Lợi ích:**
- Consistent response format
- Dễ parse ở FE
- Có thể thêm metadata (timestamp, version, etc.)

---

### 7. **Observer Pattern** (WebSocket Broadcast)

**Mục đích:** Notify tất cả client khi slot status thay đổi

**Cách dùng:**
```java
// Subject (ParkingSessionService)
private void broadcastSlotChange(Slot slot) {
    UUID buildingId = slot.getFloor().getBuilding().getId();
    Map<String, Object> message = Map.of(
        "slotId", slot.getId().toString(),
        "status", slot.getStatus().name(),
        "timestamp", LocalDateTime.now().toString()
    );
    messagingTemplate.convertAndSend("/topic/slots/" + buildingId, message);
}

// Observers (FE clients)
stompClient.subscribe('/topic/slots/{buildingId}', function(message) {
    const slotUpdate = JSON.parse(message.body);
    updateUI(slotUpdate);
});
```

**Lợi ích:**
- Real-time update
- Loose coupling (server không cần biết client)
- Scalable (có thể có nhiều subscribers)

---

### 8. **Singleton Pattern** (Spring Beans)

**Mục đích:** Chỉ tạo 1 instance của service/repository

**Cách dùng:**
```java
@Service
public class ParkingSessionService {
    // Spring tự động tạo 1 instance duy nhất
    // Tất cả request dùng chung instance này
}

@Repository
public interface SlotRepository extends JpaRepository<Slot, UUID> {
    // Spring tự động tạo 1 instance duy nhất
}
```

**Lợi ích:**
- Tiết kiệm memory
- Thread-safe (Spring quản lý)
- Dễ quản lý lifecycle

---

## 🎯 Best Practices

### 1. **Transactional Consistency**

```java
@Transactional
public SessionResponse checkIn(CheckInRequest request) {
    // Nếu có exception ở bất kỳ bước nào → ROLLBACK tất cả
    sessionRepository.save(session);
    slotRepository.save(slot);
    broadcastSlotChange(slot);  // Exception ở đây?
    // Nếu exception → ROLLBACK cả 2 query trên
}
```

**Lợi ích:**
- Đảm bảo data consistency
- Tránh partial updates

---

### 2. **Lazy Loading để tránh N+1 Query**

```java
@Entity
public class Slot {
    @ManyToOne(fetch = FetchType.LAZY)  // ← LAZY, không phải EAGER
    @JoinColumn(name = "floor_id")
    private Floor floor;
}

// Query tối ưu
@Query("SELECT s FROM Slot s " +
       "JOIN FETCH s.floor f " +  // ← Explicit JOIN FETCH
       "JOIN FETCH f.building b " +
       "WHERE b.id = :buildingId")
List<Slot> findAllByBuildingId(@Param("buildingId") UUID buildingId);
```

**Lợi ích:**
- Tránh N+1 query problem
- Tăng performance

---

### 3. **Distributed Lock (Redis)**

```java
// Chống race condition khi 2 xe check-in cùng lúc
Boolean locked = redisTemplate.opsForValue()
    .setIfAbsent(lockKey, sessionId.toString(), 60, TimeUnit.SECONDS);

if (Boolean.TRUE.equals(locked)) {
    // Đã lock thành công
    candidate.setStatus(SlotStatus.OCCUPIED);
    slotRepository.save(candidate);
}
```

**Lợi ích:**
- Atomic operation (không có race condition)
- TTL tự động release
- Scalable (Redis cluster)

---

### 4. **Validation ở Boundary**

```java
// ✅ Validate ở DTO (boundary)
@Data
public class CheckInRequest {
    @NotNull(message = "vehicleTypeId không được null")
    private UUID vehicleTypeId;
    
    @NotBlank(message = "licensePlate không được trống")
    private String licensePlate;
}

// ❌ Không validate ở service
@Service
public class ParkingSessionService {
    public SessionResponse checkIn(CheckInRequest request) {
        // Giả sử request đã valid
        // Không cần check null/blank lại
    }
}
```

**Lợi ích:**
- Tập trung validation ở 1 chỗ
- Dễ maintain
- Tránh duplicate code

---

### 5. **Logging ở các điểm quan trọng**

```java
@Service
public class ParkingSessionService {
    private static final Logger log = LoggerFactory.getLogger(ParkingSessionService.class);
    
    @Transactional
    public SessionResponse checkIn(CheckInRequest request) {
        // ...
        log.info("CHECK-IN: plate={}, session={}, slot={}, floor={}",
                request.getLicensePlate(), sessionCode,
                assignedSlot.getSlotCode(), assignedSlot.getFloor().getFloorName());
    }
    
    @Transactional
    public SessionResponse checkOut(CheckOutRequest request) {
        // ...
        log.info("CHECK-OUT: plate={}, session={}, duration={}min, fee={}đ",
                session.getLicensePlate(), session.getSessionCode(),
                durationMinutes, totalFee);
    }
}
```

**Lợi ích:**
- Dễ debug
- Dễ monitor
- Dễ audit

---

### 6. **Exception Handling tập trung**

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusiness(BusinessException ex) {
        return ResponseEntity.badRequest().body(
            ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error("Bad Request")
                .message(ex.getMessage())
                .build()
        );
    }
}
```

**Lợi itch:**
- Consistent error format
- Dễ maintain
- Tránh duplicate try-catch

---

### 7. **Immutable DTOs**

```java
@Data  // Lombok: getter, setter, equals, hashCode, toString
@Builder
public class SessionResponse {
    private final UUID sessionId;
    private final String sessionCode;
    private final String licensePlate;
    // ...
}

// Hoặc dùng record (Java 16+)
public record SessionResponse(
    UUID sessionId,
    String sessionCode,
    String licensePlate
) {}
```

**Lợi ích:**
- Thread-safe
- Dễ test
- Dễ hiểu intent

---

### 8. **Enum cho Status**

```java
@Entity
public class Slot {
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private SlotStatus status = SlotStatus.AVAILABLE;
    
    public enum SlotStatus {
        AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE, LOCKED
    }
}

// Sử dụng
if (slot.getStatus() == SlotStatus.AVAILABLE) {
    // ...
}
```

**Lợi ích:**
- Type-safe
- Tránh typo
- Dễ refactor

---

### 9. **Builder Pattern cho Entity**

```java
@Entity
@Builder
public class ParkingSession {
    @Id
    private UUID id;
    private String sessionCode;
    private String licensePlate;
    // ...
}

// Sử dụng
ParkingSession session = ParkingSession.builder()
    .sessionCode(sessionCode)
    .licensePlate(request.getLicensePlate())
    .vehicleType(vehicleType)
    .gateEntry(gateEntry)
    .entryTime(LocalDateTime.now())
    .status(SessionStatus.ACTIVE)
    .build();
```

**Lợi ích:**
- Dễ đọc
- Dễ maintain
- Tránh constructor dài

---

### 10. **Polymorphic Reference (Payment)**

```java
@Entity
public class Payment {
    @Column(name = "reference_type", nullable = false, length = 20)
    private String referenceType;  // SESSION | MONTHLY_PASS | RESERVATION
    
    @Column(name = "reference_id", nullable = false)
    private UUID referenceId;
}

// Sử dụng
Payment payment = Payment.builder()
    .referenceType("SESSION")
    .referenceId(session.getId())
    .amount(totalFee)
    .paymentMethod(PaymentMethod.CASH)
    .status(PaymentStatus.COMPLETED)
    .build();
```

**Lợi ích:**
- Flexible (1 bảng payment cho nhiều loại reference)
- Tránh duplicate bảng
- Dễ extend

---

## 🔒 Security Best Practices

### 1. **Password Hashing**

```java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(12);  // Strength 12
}

// Sử dụng
authenticationManager.authenticate(
    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
);
```

**Lợi ích:**
- Password không lưu plain text
- Resistant to brute force (slow hash)

---

### 2. **JWT Token Expiration**

```yaml
jwt:
  expiration: 3600000          # 1 hour (access token)
  refresh-expiration: 604800000  # 7 days (refresh token)
```

**Lợi ích:**
- Access token ngắn hạn (1 giờ)
- Refresh token dài hạn (7 ngày)
- Nếu access token bị leak, hacker chỉ có 1 giờ

---

### 3. **Role-Based Access Control (RBAC)**

```java
@Configuration
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) {
        http.authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
            .requestMatchers("/api/v1/manager/**").hasAnyRole("ADMIN", "MANAGER")
            .requestMatchers("/api/v1/staff/**").hasAnyRole("ADMIN", "MANAGER", "STAFF")
            .anyRequest().authenticated()
        );
        return http.build();
    }
}
```

**Lợi ích:**
- Centralized access control
- Dễ maintain
- Dễ audit

---

### 4. **CSRF Protection (Disabled for Stateless API)**

```java
http.csrf(AbstractHttpConfigurer::disable)  // Stateless API không cần CSRF
    .sessionManagement(session ->
        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
```

**Lý do:**
- API stateless (không dùng session)
- CSRF chỉ cần cho form-based authentication

---

## 📊 Performance Best Practices

### 1. **Database Indexing**

```java
@Entity
@Table(name = "parking_sessions",
       indexes = {
           @Index(name = "idx_license_plate", columnList = "license_plate"),
           @Index(name = "idx_session_code", columnList = "session_code"),
           @Index(name = "idx_status", columnList = "status")
       })
public class ParkingSession {
    // ...
}
```

**Lợi ích:**
- Tăng tốc độ query
- Đặc biệt quan trọng cho WHERE clause

---

### 2. **Connection Pooling**

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 30000
```

**Lợi ích:**
- Reuse connections
- Tránh tạo connection mới mỗi request
- Tăng throughput

---

### 3. **Caching (Redis)**

```java
@Service
public class SlotMapService {
    
    @Cacheable(value = "slotMap", key = "#buildingId")
    public SlotMapResponse getSlotMap(UUID buildingId) {
        // Lần đầu: query database
        // Lần sau: lấy từ cache
    }
}
```

**Lợi ích:**
- Giảm database load
- Tăng response time

---

## 🧪 Testing Best Practices

### 1. **Unit Test (Service)**

```java
@ExtendWith(MockitoExtension.class)
class ParkingSessionServiceTest {
    
    @Mock
    private ParkingSessionRepository sessionRepository;
    
    @Mock
    private SlotAssignmentService slotAssignmentService;
    
    @InjectMocks
    private ParkingSessionService service;
    
    @Test
    void testCheckInSuccess() {
        // Arrange
        CheckInRequest request = new CheckInRequest(...);
        
        // Act
        SessionResponse response = service.checkIn(request);
        
        // Assert
        assertThat(response.getSessionCode()).isNotNull();
    }
}
```

**Lợi ích:**
- Dễ test (mock dependencies)
- Nhanh (không cần database)
- Dễ maintain

---

### 2. **Integration Test**

```java
@SpringBootTest
@AutoConfigureMockMvc
class ParkingSessionControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Test
    void testCheckInEndpoint() throws Exception {
        mockMvc.perform(post("/api/v1/sessions/check-in")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "vehicleTypeId": "...",
                        "licensePlate": "29A-12345",
                        "gateEntryId": "..."
                    }
                """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));
    }
}
```

**Lợi ích:**
- Test toàn bộ flow
- Phát hiện integration issues

---

## 📝 Code Style & Conventions

### 1. **Naming Conventions**

```java
// ✅ Good
private final SlotRepository slotRepository;
private final ParkingSessionService parkingSessionService;
private static final String SLOT_LOCK_PREFIX = "slot:lock:";
private static final long LOCK_TTL_SECONDS = 60;

// ❌ Bad
private final SlotRepository sr;
private final ParkingSessionService pss;
private static final String PREFIX = "slot:lock:";
private static final long TTL = 60;
```

---

### 2. **Method Naming**

```java
// ✅ Good
public SessionResponse checkIn(CheckInRequest request)
public SessionResponse checkOut(CheckOutRequest request)
public SlotMapResponse getSlotMap(UUID buildingId)
public boolean isSlotLocked(UUID slotId)
public Optional<String> suggestAlternative(UUID buildingId, VehicleType vehicleType)

// ❌ Bad
public SessionResponse ci(CheckInRequest request)
public SessionResponse co(CheckOutRequest request)
public SlotMapResponse getSM(UUID buildingId)
public boolean locked(UUID slotId)
public Optional<String> suggest(UUID buildingId, VehicleType vehicleType)
```

---

### 3. **Comment Style**

```java
// ✅ Good - giải thích WHY, không phải WHAT
// Redis distributed lock (TTL 60s) chống race condition
// khi nhiều xe check-in cùng lúc
Boolean locked = redisTemplate.opsForValue()
    .setIfAbsent(lockKey, lockValue, LOCK_TTL_SECONDS, TimeUnit.SECONDS);

// ❌ Bad - giải thích WHAT (code đã rõ)
// Set lock key in Redis
Boolean locked = redisTemplate.opsForValue()
    .setIfAbsent(lockKey, lockValue, LOCK_TTL_SECONDS, TimeUnit.SECONDS);
```

---

## 🎓 Tóm lại

| Pattern/Practice | Mục đích | Lợi ích |
|------------------|---------|---------|
| Repository | Tách data access | Dễ test, dễ thay đổi DB |
| Service Layer | Chứa business logic | Dễ reuse, dễ test |
| DTO | Tách entity từ API | FE không cần biết DB schema |
| Dependency Injection | Loose coupling | Dễ test, dễ maintain |
| Strategy | Thay đổi thuật toán | Flexible, extensible |
| Decorator | Wrap response | Consistent format |
| Observer | Real-time update | Scalable, loose coupling |
| Singleton | 1 instance | Tiết kiệm memory |
| Transactional | Data consistency | Tránh partial updates |
| Lazy Loading | Tránh N+1 query | Tăng performance |
| Distributed Lock | Chống race condition | Atomic operation |
| Validation | Input validation | Tập trung ở boundary |
| Logging | Debug & monitor | Dễ troubleshoot |
| Exception Handling | Centralized error | Consistent format |
| Immutable DTO | Thread-safe | Dễ test |
| Enum | Type-safe status | Tránh typo |
| Builder | Readable code | Dễ maintain |
| Polymorphic Ref | Flexible schema | Tránh duplicate table |
| Password Hashing | Security | Resistant to brute force |
| JWT Expiration | Security | Limit token lifetime |
| RBAC | Access control | Centralized permission |
| Indexing | Performance | Tăng query speed |
| Connection Pool | Performance | Reuse connections |
| Caching | Performance | Giảm DB load |

