# 🔍 SmartParking — Giải thích Chi tiết Code Logic

## 📌 Các Use Case Chính

### UC-04: Check-in Xe (Xe vào bãi)

**Endpoint:** `POST /api/v1/sessions/check-in`

**Request:**
```json
{
  "vehicleTypeId": "550e8400-e29b-41d4-a716-446655440000",
  "licensePlate": "29A-12345",
  "gateEntryId": "660e8400-e29b-41d4-a716-446655440001",
  "notes": "Xe màu đỏ"
}
```

**Code Flow:**

```java
@Transactional
public SessionResponse checkIn(CheckInRequest request) {
    // ═══ BƯỚC 1: VALIDATE ═══
    // Kiểm tra biển số không bị trùng session đang ACTIVE (BR-06)
    sessionRepository.findByLicensePlateAndStatus(request.getLicensePlate(), SessionStatus.ACTIVE)
            .ifPresent(s -> {
                throw new BusinessException(
                    "Biển số " + request.getLicensePlate() + 
                    " đang có phiên gửi xe chưa kết thúc (Mã: " + s.getSessionCode() + 
                    "). Vui lòng check-out trước.");
            });
    
    // ═══ BƯỚC 2: TÌM ENTITY REFERENCES ═══
    VehicleType vehicleType = vehicleTypeRepository.findById(request.getVehicleTypeId())
            .orElseThrow(() -> new ResourceNotFoundException("Loại phương tiện không tồn tại"));
    Gate gateEntry = gateRepository.findById(request.getGateEntryId())
            .orElseThrow(() -> new ResourceNotFoundException("Cổng vào không tồn tại"));
    
    // ═══ BƯỚC 3: SINH MÃ SESSION DUY NHẤT ═══
    // Format: PS + yyyyMMdd + 3 ký tự ngẫu nhiên
    // Ví dụ: PS20260516-A3F
    String sessionCode = generateSessionCode();
    
    // ═══ BƯỚC 4: TẠO SESSION TRƯỚC ═══
    // Cần ID session để pass cho slotAssignment lock
    ParkingSession session = ParkingSession.builder()
            .sessionCode(sessionCode)
            .licensePlate(request.getLicensePlate())
            .vehicleType(vehicleType)
            .gateEntry(gateEntry)
            .entryTime(LocalDateTime.now())
            .status(SessionStatus.ACTIVE)
            .notes(request.getNotes())
            .build();
    session = sessionRepository.save(session);  // Lưu vào DB, lấy ID
    
    // ═══ BƯỚC 5: GỌI THUẬT TOÁN PHÂN BỔ SLOT (CORE AI) ═══
    Slot assignedSlot;
    try {
        assignedSlot = slotAssignmentService.assignOptimalSlot(vehicleType, session.getId());
    } catch (BusinessException e) {
        // Nếu không còn slot → xóa session vừa tạo (rollback)
        sessionRepository.delete(session);
        throw e;
    }
    
    // ═══ BƯỚC 6: GÁN SLOT CHO SESSION ═══
    session.setSlot(assignedSlot);
    session = sessionRepository.save(session);
    
    // ═══ BƯỚC 7: BROADCAST SLOT STATUS CHANGE QUA WEBSOCKET ═══
    // Client subscribe: /topic/slots/{buildingId}
    broadcastSlotChange(assignedSlot);
    
    // ═══ BƯỚC 8: BUILD RESPONSE ═══
    return buildSessionResponse(session, assignedSlot, null);
}
```

**Response:**
```json
{
  "success": true,
  "message": "Check-in thành công",
  "data": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "sessionCode": "PS20260516-A3F",
    "licensePlate": "29A-12345",
    "vehicleType": "Xe máy",
    "slotCode": "B1-A01",
    "floorName": "B1",
    "zoneName": "Khu A",
    "entryTime": "2026-05-16T10:30:00",
    "guideMessage": "Vui lòng đến Tầng B1 - Ô số B1-A01"
  }
}
```

**Lỗi có thể xảy ra:**
- `BusinessException`: "Biển số đang có phiên gửi xe chưa kết thúc"
- `ResourceNotFoundException`: "Loại phương tiện không tồn tại"
- `BusinessException`: "Không còn chỗ trống cho loại xe"

---

### UC-05: Check-out Xe (Xe ra bãi)

**Endpoint:** `POST /api/v1/sessions/check-out`

**Request:**
```json
{
  "sessionCode": "PS20260516-A3F",
  "gateExitId": "660e8400-e29b-41d4-a716-446655440002",
  "paymentMethod": "CASH"
}
```

**Code Flow:**

```java
@Transactional
public SessionResponse checkOut(CheckOutRequest request) {
    // ═══ BƯỚC 1: TÌM PARKING SESSION ĐANG ACTIVE ═══
    // Có thể tìm bằng: sessionId, sessionCode, hoặc licensePlate
    ParkingSession session = findActiveSession(request);
    
    Gate gateExit = gateRepository.findById(request.getGateExitId())
            .orElseThrow(() -> new ResourceNotFoundException("Cổng ra không tồn tại"));
    
    // ═══ BƯỚC 2: TÍNH THỜI GIAN GỬI ═══
    LocalDateTime exitTime = LocalDateTime.now();
    int durationMinutes = (int) ChronoUnit.MINUTES.between(session.getEntryTime(), exitTime);
    if (durationMinutes < 1) durationMinutes = 1;  // Tối thiểu 1 phút
    
    // ═══ BƯỚC 3: TÍNH PHÍ ═══
    UUID buildingId = session.getSlot().getFloor().getBuilding().getId();
    UUID vehicleTypeId = session.getVehicleType().getId();
    BigDecimal totalFee = pricingService.calculateFee(buildingId, vehicleTypeId, durationMinutes);
    
    // ═══ BƯỚC 4: CẬP NHẬT SESSION ═══
    session.setExitTime(exitTime);
    session.setGateExit(gateExit);
    session.setDurationMinutes(durationMinutes);
    session.setTotalFee(totalFee);
    session.setStatus(SessionStatus.COMPLETED);
    
    // ═══ BƯỚC 5: TẠO PAYMENT RECORD ═══
    Payment.PaymentMethod paymentMethod;
    try {
        paymentMethod = Payment.PaymentMethod.valueOf(
                request.getPaymentMethod() != null ? request.getPaymentMethod().toUpperCase() : "CASH");
    } catch (IllegalArgumentException e) {
        paymentMethod = Payment.PaymentMethod.CASH;
    }
    
    Payment payment = Payment.builder()
            .referenceType("SESSION")  // Polymorphic reference
            .referenceId(session.getId())
            .amount(totalFee)
            .paymentMethod(paymentMethod)
            .status(Payment.PaymentStatus.COMPLETED)
            .paidAt(LocalDateTime.now())
            .build();
    paymentRepository.save(payment);
    
    // ═══ BƯỚC 6: GIẢI PHÓNG SLOT ═══
    Slot slot = session.getSlot();
    if (slot != null) {
        slot.setStatus(SlotStatus.AVAILABLE);  // Đánh dấu slot trống
        slotRepository.save(slot);
        slotAssignmentService.releaseSlotLock(slot.getId());  // Xóa Redis lock
        
        // Broadcast slot change
        broadcastSlotChange(slot);
    }
    
    session = sessionRepository.save(session);
    
    return buildSessionResponse(session, slot, "COMPLETED");
}
```

**Response:**
```json
{
  "success": true,
  "message": "Check-out thành công",
  "data": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "sessionCode": "PS20260516-A3F",
    "licensePlate": "29A-12345",
    "slotCode": "B1-A01",
    "entryTime": "2026-05-16T10:30:00",
    "exitTime": "2026-05-16T11:35:00",
    "durationMinutes": 65,
    "totalFee": 10000,
    "paymentStatus": "COMPLETED"
  }
}
```

---

## 🤖 Core AI: SlotAssignmentService

**Thuật toán phân bổ slot tối ưu (RQ3):**

```java
public Slot assignOptimalSlot(VehicleType vehicleType, UUID sessionId) {
    // ═══ BƯỚC 1: LẤY TẤT CẢ SLOT AVAILABLE ĐÚNG LOẠI XE ═══
    List<Slot> candidates = slotRepository
            .findAvailableSlotsByVehicleType(vehicleType.getId());
    
    if (candidates.isEmpty()) {
        throw new BusinessException(
                "Không còn chỗ trống cho loại xe: " + vehicleType.getName() +
                ". Vui lòng thử lại sau hoặc chọn khu vực khác.");
    }
    
    // ═══ BƯỚC 2: SORT THEO THUẬT TOÁN SCORING ═══
    // Tiêu chí ưu tiên (từ cao đến thấp):
    // 1. Tầng thấp hơn (floorNumber nhỏ hơn về tuyệt đối)
    // 2. Gần cổng/thang máy hơn (distanceToGate ASC)
    
    candidates.sort(Comparator
            // Tiêu chí 1: Tầng thấp hơn
            // Math.abs() vì floor có thể âm (B1=-1, B2=-2) hoặc dương (T1=1, T2=2)
            .comparingInt((Slot s) -> Math.abs(s.getFloor().getFloorNumber()))
            // Tiêu chí 2: Gần cổng hơn
            .thenComparingInt(s -> s.getDistanceToGate() != null ? s.getDistanceToGate() : 9999)
    );
    
    // ═══ BƯỚC 3: THỬ LOCK TỪNG SLOT THEO THỨ TỰ ƯU TIÊN ═══
    // Chống race condition khi 2 xe check-in cùng lúc
    
    for (Slot candidate : candidates) {
        String lockKey = SLOT_LOCK_PREFIX + candidate.getId().toString();
        // lockKey = "slot:lock:550e8400-e29b-41d4-a716-446655440000"
        
        String lockValue = sessionId.toString();
        
        // setIfAbsent = chỉ set nếu key chưa tồn tại (atomic Redis operation)
        // TTL 60s = tự động release nếu session crash
        Boolean locked = redisTemplate.opsForValue()
                .setIfAbsent(lockKey, lockValue, LOCK_TTL_SECONDS, TimeUnit.SECONDS);
        
        if (Boolean.TRUE.equals(locked)) {
            // ✅ Đã lock thành công → cập nhật status trong DB
            candidate.setStatus(SlotStatus.OCCUPIED);
            Slot assigned = slotRepository.save(candidate);
            
            log.info("Slot assigned: {} (floor={}, distance={}m) for session={}",
                    assigned.getSlotCode(),
                    assigned.getFloor().getFloorName(),
                    assigned.getDistanceToGate(),
                    sessionId);
            
            return assigned;
        }
        // ❌ Slot này vừa bị người khác lock → thử slot tiếp theo
    }
    
    throw new BusinessException("Tất cả slot trống đã được đặt. Vui lòng thử lại trong giây lát.");
}
```

**Ví dụ Scoring:**

```
Giả sử có 5 slot trống loại "Xe máy":
1. B1-A01: floor=-1, distance=10m → score = abs(-1)*100 + 10 = 110
2. B1-B05: floor=-1, distance=25m → score = abs(-1)*100 + 25 = 125
3. T1-A03: floor=1,  distance=5m  → score = abs(1)*100 + 5 = 105 ✅ BEST
4. T1-C10: floor=1,  distance=30m → score = abs(1)*100 + 30 = 130
5. T2-A01: floor=2,  distance=8m  → score = abs(2)*100 + 8 = 208

Sau sort: [T1-A03, B1-A01, B1-B05, T1-C10, T2-A01]
→ Chọn T1-A03 (tầng thấp, gần cổng)
```

**Tại sao dùng Redis lock?**

```
Scenario: 2 xe check-in cùng lúc, cả 2 thấy slot B1-A01 trống

Không có lock:
  Thread 1: SELECT * FROM slots WHERE id=B1-A01 AND status=AVAILABLE
  Thread 2: SELECT * FROM slots WHERE id=B1-A01 AND status=AVAILABLE
  Thread 1: UPDATE slots SET status=OCCUPIED WHERE id=B1-A01
  Thread 2: UPDATE slots SET status=OCCUPIED WHERE id=B1-A01
  ❌ Cả 2 xe được gán cùng 1 slot!

Có Redis lock:
  Thread 1: SETNX slot:lock:B1-A01 session1 60s → OK
  Thread 2: SETNX slot:lock:B1-A01 session2 60s → FAIL (key đã tồn tại)
  Thread 1: UPDATE slots SET status=OCCUPIED WHERE id=B1-A01
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

Trường hợp 1: Gửi 30 phút
  chargeableMinutes = 30 - 0 = 30
  hours = ceil(30 / 60) = 1
  totalFee = 1 × 5000 = 5000đ

Trường hợp 2: Gửi 65 phút
  chargeableMinutes = 65 - 0 = 65
  hours = ceil(65 / 60) = 2
  totalFee = 2 × 5000 = 10000đ

Trường hợp 3: Gửi 120 phút (2 giờ đúng)
  chargeableMinutes = 120 - 0 = 120
  hours = ceil(120 / 60) = 2
  totalFee = 2 × 5000 = 10000đ

Trường hợp 4: Gửi 121 phút (2 giờ 1 phút)
  chargeableMinutes = 121 - 0 = 121
  hours = ceil(121 / 60) = 3
  totalFee = 3 × 5000 = 15000đ
```

**Code:**

```java
public BigDecimal calculateFee(UUID buildingId, UUID vehicleTypeId, int durationMinutes) {
    // Tìm bảng giá theo giờ (HOURLY)
    PricingRule rule = pricingRuleRepository
            .findByBuildingIdAndVehicleTypeIdAndPricingType(buildingId, vehicleTypeId, PricingType.HOURLY)
            .orElse(null);
    
    if (rule == null) {
        log.warn("No pricing rule found. Using default 5000đ/h");
        return calculateDefault(durationMinutes);
    }
    
    // Trừ số phút miễn phí
    int freeMinutes = rule.getFreeMinutes() != null ? rule.getFreeMinutes() : 0;
    int chargeableMinutes = Math.max(0, durationMinutes - freeMinutes);
    
    if (chargeableMinutes == 0) {
        return BigDecimal.ZERO;
    }
    
    // Tính theo block giờ (làm tròn lên)
    int hours = (int) Math.ceil((double) chargeableMinutes / 60.0);
    
    BigDecimal totalFee = rule.getPricePerUnit().multiply(BigDecimal.valueOf(hours));
    
    return totalFee.setScale(0, RoundingMode.CEILING);
}
```

---

## 🗺️ SlotMapService: Sơ đồ Bãi Xe

**Endpoint:** `GET /api/v1/public/slots/map/{buildingId}`

**Response:**
```json
{
  "success": true,
  "data": {
    "buildingId": "550e8400-e29b-41d4-a716-446655440000",
    "buildingName": "Tòa nhà A",
    "totalSlots": 100,
    "availableSlots": 45,
    "occupiedSlots": 50,
    "reservedSlots": 5,
    "floors": [
      {
        "floorId": "660e8400-e29b-41d4-a716-446655440001",
        "floorName": "B1",
        "floorNumber": -1,
        "zones": [
          {
            "zoneId": "660e8400-e29b-41d4-a716-446655440001",
            "zoneCode": "A",
            "zoneName": "B1 - Xe máy",
            "vehicleType": "Xe máy",
            "slots": [
              {
                "slotId": "770e8400-e29b-41d4-a716-446655440001",
                "slotCode": "B1-A01",
                "status": "AVAILABLE"
              },
              {
                "slotId": "770e8400-e29b-41d4-a716-446655440002",
                "slotCode": "B1-A02",
                "status": "OCCUPIED"
              }
            ]
          }
        ]
      }
    ]
  }
}
```

**Code:**

```java
public SlotMapResponse getSlotMap(UUID buildingId) {
    Building building = buildingRepository.findById(buildingId)
            .orElseThrow(() -> new ResourceNotFoundException("Tòa nhà không tồn tại"));
    
    List<Slot> allSlots = slotRepository.findAllByBuildingId(buildingId);
    
    // Nhóm slot theo Floor
    Map<UUID, List<Slot>> slotsByFloor = allSlots.stream()
            .collect(Collectors.groupingBy(s -> s.getFloor().getId()));
    
    List<SlotMapResponse.FloorMap> floors = new ArrayList<>();
    int totalAvailable = 0, totalOccupied = 0, totalReserved = 0;
    
    for (Map.Entry<UUID, List<Slot>> entry : slotsByFloor.entrySet()) {
        List<Slot> floorSlots = entry.getValue();
        if (floorSlots.isEmpty()) continue;
        
        var floor = floorSlots.get(0).getFloor();
        
        // Tạo slot info list
        List<SlotMapResponse.SlotInfo> slotInfos = floorSlots.stream()
                .map(s -> SlotMapResponse.SlotInfo.builder()
                        .slotId(s.getId())
                        .slotCode(s.getSlotCode())
                        .status(s.getStatus())
                        .build())
                .toList();
        
        // Đếm trạng thái
        for (Slot s : floorSlots) {
            switch (s.getStatus()) {
                case AVAILABLE -> totalAvailable++;
                case OCCUPIED -> totalOccupied++;
                case RESERVED -> totalReserved++;
                default -> {}
            }
        }
        
        // Build response
        SlotMapResponse.ZoneMap defaultZone = SlotMapResponse.ZoneMap.builder()
                .zoneId(floor.getId())
                .zoneCode("A")
                .zoneName(floor.getFloorName() + " - " + floor.getVehicleType().getName())
                .vehicleType(floor.getVehicleType().getName())
                .slots(slotInfos)
                .build();
        
        floors.add(SlotMapResponse.FloorMap.builder()
                .floorId(floor.getId())
                .floorName(floor.getFloorName())
                .floorNumber(floor.getFloorNumber())
                .zones(List.of(defaultZone))
                .build());
    }
    
    // Sort tầng theo floorNumber
    floors.sort(Comparator.comparingInt(SlotMapResponse.FloorMap::getFloorNumber));
    
    return SlotMapResponse.builder()
            .buildingId(buildingId)
            .buildingName(building.getName())
            .totalSlots(allSlots.size())
            .availableSlots(totalAvailable)
            .occupiedSlots(totalOccupied)
            .reservedSlots(totalReserved)
            .floors(floors)
            .build();
}
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

AuthService.login():
  - Xác thực email/password (Spring Security)
  - Sinh access token (1 giờ) + refresh token (7 ngày)
  - Trả về tokens + user info

Response:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "staff@parking.vn",
    "fullName": "Nguyễn Văn A",
    "role": "STAFF"
  }
}
```

**2. Sử dụng Token:**
```
GET /api/v1/sessions/check-in
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

↓

JwtAuthFilter.doFilterInternal():
  - Đọc Bearer token từ Authorization header
  - Validate token (signature, expiration)
  - Extract email từ token
  - Load UserDetails từ database
  - Set SecurityContext (Spring Security biết user là ai)
  - Cho request tiếp tục

↓

SecurityConfig.filterChain():
  - Check @PreAuthorize("hasRole('STAFF')")
  - Nếu OK → cho vào controller
  - Nếu không → trả 403 Forbidden
```

**3. Refresh Token:**
```
POST /api/v1/auth/refresh
Authorization: Bearer <refresh_token>

↓

AuthService.refreshToken():
  - Validate refresh token
  - Sinh access token mới
  - Trả về access token mới + refresh token cũ
```

---

## 🌐 WebSocket: Real-time Slot Status

**Client Subscribe:**
```javascript
// JavaScript
const stompClient = new StompClient();
stompClient.connect({}, function(frame) {
    stompClient.subscribe('/topic/slots/550e8400-e29b-41d4-a716-446655440000', function(message) {
        const slotUpdate = JSON.parse(message.body);
        console.log('Slot updated:', slotUpdate);
        // Update UI: B1-A01 → OCCUPIED (đỏ)
    });
});
```

**Server Broadcast:**
```java
private void broadcastSlotChange(Slot slot) {
    try {
        UUID buildingId = slot.getFloor().getBuilding().getId();
        Map<String, Object> message = Map.of(
                "slotId", slot.getId().toString(),
                "slotCode", slot.getSlotCode(),
                "status", slot.getStatus().name(),
                "floorName", slot.getFloor().getFloorName(),
                "timestamp", LocalDateTime.now().toString()
        );
        // Gửi tới tất cả client subscribe /topic/slots/{buildingId}
        messagingTemplate.convertAndSend("/topic/slots/" + buildingId, message);
    } catch (Exception e) {
        log.warn("Failed to broadcast slot change: {}", e.getMessage());
    }
}
```

**Message Format:**
```json
{
  "slotId": "770e8400-e29b-41d4-a716-446655440001",
  "slotCode": "B1-A01",[]
  "status": "OCCUPIED",
  "floorName": "B1",
  "timestamp": "2026-05-16T10:30:00"
}
```

---

## 🛡️ Exception Handling

**GlobalExceptionHandler xử lý tất cả exceptions:**

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    // Validation errors (400)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationErrors(...) {
        // Trả về field errors
    }
    
    // Resource not found (404)
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(...) {
        // Trả về 404 + message
    }
    
    // Access denied (403)
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(...) {
        // Trả về 403 + "You don't have permission"
    }
    
    // Business logic errors (400)
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusiness(...) {
        // Trả về 400 + message
    }
    
    // General errors (500)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneral(...) {
        // Trả về 500 + "An unexpected error occurred"
    }
}
```

**Error Response Format:**
```json
{
  "timestamp": "2026-05-16T10:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Biển số 29A-12345 đang có phiên gửi xe chưa kết thúc"
}
```

---

## 📊 Database Transactions

**@Transactional đảm bảo consistency:**

```java
@Transactional
public SessionResponse checkIn(CheckInRequest request) {
    // Nếu có exception ở bất kỳ bước nào → ROLLBACK tất cả
    // Ví dụ: nếu broadcast WebSocket fail → session không được tạo
    
    sessionRepository.save(session);  // INSERT
    slotRepository.save(slot);        // UPDATE
    broadcastSlotChange(slot);        // Exception ở đây?
    
    // Nếu exception → ROLLBACK cả 2 query trên
}
```

---

## 🎯 Tóm lại

| Component | Mục đích | Công nghệ |
|-----------|---------|-----------|
| **SlotAssignmentService** | AI phân bổ slot tối ưu | Redis lock + Comparator |
| **PricingService** | Tính phí theo block giờ | BigDecimal + Math.ceil |
| **ParkingSessionService** | Xử lý check-in/check-out | @Transactional + WebSocket |
| **SlotMapService** | Tạo sơ đồ bãi xe | Stream + Collectors.groupingBy |
| **AuthService** | Xác thực & JWT | Spring Security + JJWT |
| **JwtAuthFilter** | Validate token mỗi request | OncePerRequestFilter |
| **GlobalExceptionHandler** | Xử lý lỗi tập trung | @RestControllerAdvice |

