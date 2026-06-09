# 📊 SmartParking — Visual Diagrams & Architecture

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (FE)                              │
│                    (React + Vite)                                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    HTTP + WebSocket
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    SPRING BOOT BACKEND                           │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              REST API LAYER (Controller)                 │  │
│  │  /api/v1/auth/login                                      │  │
│  │  /api/v1/sessions/check-in                               │  │
│  │  /api/v1/sessions/check-out                              │  │
│  │  /api/v1/public/slots/map                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                    │
│  ┌──────────────────────────▼──────────────────────────────┐  │
│  │           BUSINESS LOGIC LAYER (Service)                │  │
│  │  ParkingSessionService (check-in/check-out)             │  │
│  │  SlotAssignmentService (AI algorithm)                   │  │
│  │  PricingService (calculate fee)                         │  │
│  │  SlotMapService (parking map)                           │  │
│  │  AuthService (JWT authentication)                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                    │
│  ┌──────────────────────────▼──────────────────────────────┐  │
│  │         DATA ACCESS LAYER (Repository)                  │  │
│  │  SlotRepository                                          │  │
│  │  ParkingSessionRepository                               │  │
│  │  UserRepository                                         │  │
│  │  PricingRuleRepository                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                    │
└─────────────────────────────┼────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
         ┌──────▼──────┐ ┌───▼────┐ ┌─────▼──────┐
         │ PostgreSQL  │ │ Redis  │ │ WebSocket  │
         │ (Database)  │ │(Cache) │ │(Real-time) │
         └─────────────┘ └────────┘ └────────────┘
```

---

## 🔄 Check-in Flow (UC-04)

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Driver gọi POST /api/v1/sessions/check-in                    │
│    {                                                             │
│      "vehicleTypeId": "uuid-xe-may",                            │
│      "licensePlate": "29A-12345",                               │
│      "gateEntryId": "uuid-gate-1"                               │
│    }                                                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│ 2. JwtAuthFilter validate token                                 │
│    ✓ Token valid → set SecurityContext                          │
│    ✗ Token invalid → 401 Unauthorized                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│ 3. SessionController → ParkingSessionService.checkIn()          │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│ 4. Validate biển số không bị trùng (BR-06)                      │
│    SELECT * FROM parking_sessions                               │
│    WHERE license_plate = '29A-12345' AND status = 'ACTIVE'      │
│    ✓ Không trùng → tiếp tục                                     │
│    ✗ Trùng → throw BusinessException                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│ 5. Tạo ParkingSession mới (status = ACTIVE)                     │
│    INSERT INTO parking_sessions (...)                           │
│    VALUES (...)                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│ 6. Gọi SlotAssignmentService.assignOptimalSlot()                │
│                                                                 │
│    a) Lấy tất cả slot AVAILABLE loại xe máy                    │
│       SELECT * FROM slots                                       │
│       WHERE vehicle_type_id = 'uuid-xe-may'                    │
│       AND status = 'AVAILABLE'                                  │
│                                                                 │
│    b) Sort theo scoring:                                        │
│       - Tầng thấp hơn (floorNumber nhỏ)                        │
│       - Gần cổng hơn (distanceToGate ASC)                      │
│                                                                 │
│    c) Thử lock từng slot (Redis):                              │
│       SETNX slot:lock:B1-A01 session1 60s                      │
│       ✓ OK → UPDATE slot status = OCCUPIED                     │
│       ✗ FAIL → thử slot tiếp theo                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│ 7. Gán slot cho session                                         │
│    UPDATE parking_sessions SET slot_id = 'B1-A01'              │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│ 8. Broadcast WebSocket                                          │
│    messagingTemplate.convertAndSend(                            │
│      "/topic/slots/building-uuid",                              │
│      {                                                          │
│        "slotId": "B1-A01",                                      │
│        "status": "OCCUPIED",                                    │
│        "timestamp": "2026-05-16T10:30:00"                       │
│      }                                                          │
│    )                                                            │
│    → Tất cả client subscribe /topic/slots/building-uuid        │
│      nhận được message → update UI (B1-A01 → đỏ)              │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│ 9. Trả response                                                 │
│    {                                                            │
│      "success": true,                                           │
│      "data": {                                                  │
│        "sessionCode": "PS20260516-A3F",                         │
│        "slotCode": "B1-A01",                                    │
│        "guideMessage": "Vui lòng đến Tầng B1 - Ô số B1-A01"   │
│      }                                                          │
│    }                                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Check-out Flow (UC-05)

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Driver gọi POST /api/v1/sessions/check-out                   │
│    {                                                             │
│      "sessionCode": "PS20260516-A3F",                           │
│      "gateExitId": "uuid-gate-2",                               │
│      "paymentMethod": "CASH"                                    │
│    }                                                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│ 2. Tìm session đang ACTIVE                                      │
│    SELECT * FROM parking_sessions                               │
│    WHERE session_code = 'PS20260516-A3F'                        │
│    AND status = 'ACTIVE'                                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│ 3. Tính thời gian gửi                                           │
│    exitTime = now()                                             │
│    durationMinutes = exitTime - entryTime                       │
│    Ví dụ: 10:30 → 11:35 = 65 phút                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│ 4. Tính phí (PricingService)                                    │
│    Bảng giá: Xe máy, 5000đ/h, 0 phút miễn phí                  │
│    chargeableMinutes = 65 - 0 = 65                              │
│    hours = ceil(65 / 60) = 2                                    │
│    totalFee = 2 × 5000 = 10000đ                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│ 5. Cập nhật session                                             │
│    UPDATE parking_sessions SET                                  │
│      exit_time = now(),                                         │
│      duration_minutes = 65,                                     │
│      total_fee = 10000,                                         │
│      status = 'COMPLETED'                                       │
│    WHERE id = 'session-uuid'                                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│ 6. Tạo Payment record                                           │
│    INSERT INTO payments (                                       │
│      reference_type = 'SESSION',                                │
│      reference_id = 'session-uuid',                             │
│      amount = 10000,                                            │
│      payment_method = 'CASH',                                   │
│      status = 'COMPLETED',                                      │
│      paid_at = now()                                            │
│    )                                                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│ 7. Giải phóng slot                                              │
│    a) UPDATE slots SET status = 'AVAILABLE'                     │
│       WHERE id = 'B1-A01'                                       │
│                                                                 │
│    b) DELETE FROM Redis:                                        │
│       DEL slot:lock:B1-A01                                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│ 8. Broadcast WebSocket                                          │
│    messagingTemplate.convertAndSend(                            │
│      "/topic/slots/building-uuid",                              │
│      {                                                          │
│        "slotId": "B1-A01",                                      │
│        "status": "AVAILABLE",                                   │
│        "timestamp": "2026-05-16T11:35:00"                       │
│      }                                                          │
│    )                                                            │
│    → Tất cả client nhận được → update UI (B1-A01 → xanh)       │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│ 9. Trả response                                                 │
│    {                                                            │
│      "success": true,                                           │
│      "data": {                                                  │
│        "sessionCode": "PS20260516-A3F",                         │
│        "durationMinutes": 65,                                   │
│        "totalFee": 10000,                                       │
│        "paymentStatus": "COMPLETED"                             │
│      }                                                          │
│    }                                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🤖 Slot Assignment Algorithm

```
┌─────────────────────────────────────────────────────────────────┐
│ Input: VehicleType (Xe máy), SessionId                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│ Step 1: Lấy tất cả slot AVAILABLE loại xe máy                  │
│                                                                 │
│ SELECT * FROM slots                                             │
│ WHERE vehicle_type_id = 'uuid-xe-may'                          │
│ AND status = 'AVAILABLE'                                        │
│                                                                 │
│ Result:                                                         │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ Slot 1: B1-A01 (floor=-1, distance=10m)                │   │
│ │ Slot 2: B1-B05 (floor=-1, distance=25m)                │   │
│ │ Slot 3: T1-A03 (floor=1,  distance=5m)                 │   │
│ │ Slot 4: T1-C10 (floor=1,  distance=30m)                │   │
│ │ Slot 5: T2-A01 (floor=2,  distance=8m)                 │   │
│ └─────────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│ Step 2: Sort theo scoring                                       │
│                                                                 │
│ Score = abs(floorNumber) * 100 + distanceToGate                │
│                                                                 │
│ Slot 1: abs(-1)*100 + 10 = 110                                 │
│ Slot 2: abs(-1)*100 + 25 = 125                                 │
│ Slot 3: abs(1)*100 + 5 = 105 ✅ BEST                           │
│ Slot 4: abs(1)*100 + 30 = 130                                  │
│ Slot 5: abs(2)*100 + 8 = 208                                   │
│                                                                 │
│ Sorted: [Slot 3, Slot 1, Slot 2, Slot 4, Slot 5]              │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│ Step 3: Thử lock từng slot (Redis)                             │
│                                                                 │
│ For each slot in sorted list:                                  │
│   lockKey = "slot:lock:" + slot.id                             │
│   lockValue = sessionId                                        │
│                                                                 │
│   SETNX lockKey lockValue 60s                                  │
│   ├─ OK (slot 3) → UPDATE slot status = OCCUPIED              │
│   │                 RETURN slot 3                              │
│   ├─ FAIL (slot 1) → thử slot tiếp theo                       │
│   ├─ FAIL (slot 2) → thử slot tiếp theo                       │
│   └─ ...                                                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│ Output: Slot 3 (T1-A03)                                         │
│ ✓ Tầng thấp (T1 vs T2)                                         │
│ ✓ Gần cổng (5m vs 8m, 10m, 25m, 30m)                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 JWT Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Client: POST /api/v1/auth/login                              │
│    {                                                             │
│      "email": "staff@parking.vn",                               │
│      "password": "123456"                                       │
│    }                                                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│ 2. AuthService.login()                                          │
│    - Xác thực email/password (Spring Security)                  │
│    - Sinh access token (1 giờ) + refresh token (7 ngày)        │
│    - Trả về tokens + user info                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│ 3. Response:                                                    │
│    {                                                            │
│      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", │
│      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", │
│      "tokenType": "Bearer",                                     │
│      "expiresIn": 3600,                                         │
│      "user": {                                                  │
│        "id": "550e8400-e29b-41d4-a716-446655440000",           │
│        "email": "staff@parking.vn",                             │
│        "fullName": "Nguyễn Văn A",                              │
│        "role": "STAFF"                                          │
│      }                                                          │
│    }                                                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│ 4. Client: GET /api/v1/sessions/check-in                        │
│    Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...│
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│ 5. JwtAuthFilter.doFilterInternal()                             │
│    - Đọc Bearer token từ Authorization header                   │
│    - Validate token (signature, expiration)                     │
│    - Extract email từ token                                     │
│    - Load UserDetails từ database                               │
│    - Set SecurityContext                                        │
│    - Cho request tiếp tục                                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│ 6. SecurityConfig.filterChain()                                 │
│    - Check @PreAuthorize("hasRole('STAFF')")                    │
│    ✓ OK → cho vào controller                                    │
│    ✗ Không → 403 Forbidden                                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│ 7. Controller xử lý request                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Database Relationships

```
┌──────────────┐
│   Building   │
│  (Tòa nhà)   │
└──────┬───────┘
       │ 1:N
       │
┌──────▼───────────┐
│     Floor        │
│    (Tầng)        │
└──────┬───────────┘
       │ 1:N
       │
┌──────▼──────────────────┐
│       Slot               │
│    (Ô đỗ xe)             │
└──────┬──────────────────┘
       │ 1:1
       │
┌──────▼──────────────────────────┐
│    ParkingSession                │
│   (Phiên gửi xe)                 │
└──────┬──────────────────────────┘
       │ 1:1
       │
┌──────▼──────────────────────────┐
│      Payment                     │
│    (Thanh toán)                  │
└──────────────────────────────────┘

Polymorphic Reference:
┌──────────────────────────────────┐
│      Payment                     │
│  reference_type: "SESSION"       │
│  reference_id: <session_uuid>    │
│                                  │
│  reference_type: "MONTHLY_PASS"  │
│  reference_id: <pass_uuid>       │
│                                  │
│  reference_type: "RESERVATION"   │
│  reference_id: <reservation_uuid>│
└──────────────────────────────────┘
```

---

## 🌐 WebSocket Real-time Update

```
┌─────────────────────────────────────────────────────────────────┐
│ Client 1 (FE)                                                   │
│ stompClient.subscribe('/topic/slots/{buildingId}', ...)        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Subscribe
                         │
┌────────────────────────▼────────────────────────────────────────┐
│ WebSocket Message Broker                                        │
│ /topic/slots/{buildingId}                                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Broadcast
                         │
        ┌────────────────┼────────────────┐
        │                │                │
┌───────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
│ Client 1     │ │ Client 2    │ │ Client 3    │
│ Update UI    │ │ Update UI   │ │ Update UI   │
│ B1-A01 → 🔴  │ │ B1-A01 → 🔴 │ │ B1-A01 → 🔴 │
└──────────────┘ └─────────────┘ └─────────────┘

Message Format:
{
  "slotId": "770e8400-e29b-41d4-a716-446655440001",
  "slotCode": "B1-A01",
  "status": "OCCUPIED",
  "floorName": "B1",
  "timestamp": "2026-05-16T10:30:00"
}
```

---

## 🔒 Redis Distributed Lock

```
Scenario: 2 xe check-in cùng lúc, cả 2 thấy slot B1-A01 trống

Timeline:
┌─────────────────────────────────────────────────────────────────┐
│ T0: Thread 1 & Thread 2 cùng query slot B1-A01                  │
│     SELECT * FROM slots WHERE id = 'B1-A01' AND status = 'AVAILABLE'
│     Result: AVAILABLE (cả 2 thấy)                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ T1: Thread 1 thử lock                                           │
│     SETNX slot:lock:B1-A01 session1 60s                         │
│     Result: OK (key chưa tồn tại)                               │
│                                                                 │
│     Thread 2 thử lock                                           │
│     SETNX slot:lock:B1-A01 session2 60s                         │
│     Result: FAIL (key đã tồn tại)                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ T2: Thread 1 UPDATE slot status = OCCUPIED                      │
│     UPDATE slots SET status = 'OCCUPIED' WHERE id = 'B1-A01'    │
│     ✓ Thành công                                                │
│                                                                 │
│     Thread 2 thử slot tiếp theo                                 │
│     SELECT * FROM slots WHERE status = 'AVAILABLE' ...          │
│     Chọn slot khác (ví dụ: B1-B05)                              │
└─────────────────────────────────────────────────────────────────┘

Result: ✅ Chỉ 1 xe được gán B1-A01, xe kia được gán B1-B05
```

---

## 💰 Pricing Calculation

```
Bảng giá: Xe máy, 5000đ/h, 0 phút miễn phí

┌─────────────────────────────────────────────────────────────────┐
│ Trường hợp 1: Gửi 30 phút                                       │
│                                                                 │
│ chargeableMinutes = 30 - 0 = 30                                 │
│ hours = ceil(30 / 60) = ceil(0.5) = 1                           │
│ totalFee = 1 × 5000 = 5000đ                                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Trường hợp 2: Gửi 65 phút                                       │
│                                                                 │
│ chargeableMinutes = 65 - 0 = 65                                 │
│ hours = ceil(65 / 60) = ceil(1.083) = 2                         │
│ totalFee = 2 × 5000 = 10000đ                                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Trường hợp 3: Gửi 120 phút (2 giờ đúng)                         │
│                                                                 │
│ chargeableMinutes = 120 - 0 = 120                               │
│ hours = ceil(120 / 60) = ceil(2.0) = 2                          │
│ totalFee = 2 × 5000 = 10000đ                                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Trường hợp 4: Gửi 121 phút (2 giờ 1 phút)                       │
│                                                                 │
│ chargeableMinutes = 121 - 0 = 121                               │
│ hours = ceil(121 / 60) = ceil(2.017) = 3                        │
│ totalFee = 3 × 5000 = 15000đ                                    │
└─────────────────────────────────────────────────────────────────┘

Công thức: totalFee = ceil(chargeableMinutes / 60) × pricePerUnit
```

---

## 📋 Tóm lại

**SmartParking** là một hệ thống hoàn chỉnh với:

✅ **Clean Architecture** — entity → repository → service → controller
✅ **Security** — JWT authentication + RBAC
✅ **Performance** — Redis lock + Lazy loading
✅ **Real-time** — WebSocket broadcast
✅ **AI** — Smart slot assignment algorithm
✅ **Best Practices** — Design patterns, error handling, logging

Tất cả tên package tuân theo **Spring Boot convention** và **Java best practices**.

