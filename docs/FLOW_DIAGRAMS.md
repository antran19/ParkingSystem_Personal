# Sơ Đồ Flow — SmartParking System

> Dùng để trình bày với giảng viên. Copy từng sơ đồ vào slide PowerPoint hoặc mở trực tiếp trên GitHub.

---

## 1. Sơ đồ Kiến trúc tổng thể (System Architecture)

```mermaid
graph TB
    subgraph "🌐 Frontend - React + Vite"
        FE_LOGIN["Trang Đăng nhập"]
        FE_DRIVER["Dashboard Driver"]
        FE_STAFF["Dashboard Staff"]
        FE_MANAGER["Dashboard Manager"]
        FE_ADMIN["Dashboard Admin"]
    end

    subgraph "⚙️ Backend - Spring Boot"
        API["REST API Controller"]
        AUTH["JWT Authentication"]
        SERVICE["Business Logic Service"]
        ALGO["AI Slot Allocation"]
        WS["WebSocket Real-time"]
    end

    subgraph "💾 Database"
        PG["PostgreSQL"]
        RD["Redis Cache"]
    end

    FE_LOGIN -->|"POST /auth/login"| API
    FE_STAFF -->|"POST /check-in"| API
    FE_DRIVER -->|"GET /slots"| API
    FE_MANAGER -->|"GET /reports"| API
    
    API --> AUTH
    AUTH --> SERVICE
    SERVICE --> ALGO
    SERVICE --> PG
    SERVICE --> RD
    WS -->|"Slot status update"| FE_STAFF
    WS -->|"Slot status update"| FE_DRIVER
```

---

## 2. Sơ đồ Phân quyền theo Role (RBAC)

```mermaid
graph LR
    subgraph "🔐 Hệ thống phân quyền"
        JWT["JWT Token"]
    end

    JWT --> ADMIN["ADMIN"]
    JWT --> MANAGER["MANAGER"]
    JWT --> STAFF["STAFF"]
    JWT --> DRIVER["DRIVER"]

    ADMIN -->|"Quản lý"| A1["Tạo tài khoản"]
    ADMIN -->|"Quản lý"| A2["Phân quyền"]
    ADMIN -->|"Quản lý"| A3["Khóa/Mở tài khoản"]

    MANAGER -->|"Cấu hình"| M1["Tòa nhà / Tầng / Slot"]
    MANAGER -->|"Cấu hình"| M2["Bảng giá"]
    MANAGER -->|"Xem"| M3["Báo cáo doanh thu"]

    STAFF -->|"Vận hành"| S1["Check-in xe"]
    STAFF -->|"Vận hành"| S2["Check-out xe"]
    STAFF -->|"Xử lý"| S3["Sự cố / Mất vé"]

    DRIVER -->|"Sử dụng"| D1["Xem slot trống"]
    DRIVER -->|"Sử dụng"| D2["Đặt chỗ trước"]
    DRIVER -->|"Sử dụng"| D3["Thanh toán online"]
```

---

## 3. Luồng Check-in (Xe vào bãi) ⭐ Quan trọng nhất

```mermaid
sequenceDiagram
    participant Staff as 👷 Staff
    participant FE as 🌐 Frontend
    participant API as ⚙️ Backend API
    participant AI as 🤖 AI Slot Finder
    participant DB as 💾 Database
    participant WS as 📡 WebSocket

    Staff->>FE: Nhập biển số + chọn loại xe
    FE->>API: POST /api/v1/check-in
    API->>DB: Kiểm tra biển số trùng
    API->>AI: Tìm slot tối ưu
    
    Note over AI: Thuật toán chấm điểm:<br/>1. Đúng loại xe<br/>2. Slot trống<br/>3. Gần cổng vào<br/>4. Cân bằng tải tầng

    AI->>DB: Lấy danh sách slot trống
    AI-->>API: Slot đề xuất: B1-A01
    
    API->>DB: Tạo Parking Session (ACTIVE)
    API->>DB: Cập nhật Slot → OCCUPIED
    API-->>FE: ✅ Check-in thành công
    FE-->>Staff: Hiện: "Đến Tầng B1, Ô A01"
    
    API->>WS: Broadcast slot update
    WS-->>FE: Sơ đồ bãi xe cập nhật real-time
```

---

## 4. Luồng Check-out (Xe ra bãi)

```mermaid
sequenceDiagram
    participant Staff as 👷 Staff
    participant FE as 🌐 Frontend
    participant API as ⚙️ Backend API
    participant DB as 💾 Database
    participant WS as 📡 WebSocket

    Staff->>FE: Nhập biển số xe
    FE->>API: POST /api/v1/check-out
    API->>DB: Tìm Session đang ACTIVE
    
    Note over API: Tính phí tự động:<br/>Thời gian = giờ ra - giờ vào<br/>Phí = thời gian × đơn giá<br/>(trừ phút miễn phí)

    API->>DB: Cập nhật Session → COMPLETED
    API->>DB: Tạo Payment record
    API->>DB: Cập nhật Slot → AVAILABLE
    API-->>FE: ✅ Phí: 15.000đ | Thời gian: 2h30p
    FE-->>Staff: Hiện thông tin phí + xác nhận
    
    API->>WS: Broadcast slot update
    WS-->>FE: Slot chuyển xanh trên sơ đồ
```

---

## 5. Luồng Đăng nhập + Phân quyền

```mermaid
sequenceDiagram
    participant User as 👤 User
    participant FE as 🌐 Frontend
    participant API as ⚙️ Backend
    participant JWT as 🔐 JWT Filter
    participant DB as 💾 Database

    User->>FE: Nhập email + password
    FE->>API: POST /api/v1/auth/login
    API->>DB: Tìm user theo email
    API->>API: So sánh password (BCrypt)
    API->>API: Tạo JWT Token (chứa role)
    API-->>FE: ✅ {accessToken, user: {role}}
    
    FE->>FE: Lưu token vào localStorage
    
    alt role = DRIVER
        FE->>FE: Redirect → /driver
    else role = STAFF
        FE->>FE: Redirect → /staff
    else role = MANAGER
        FE->>FE: Redirect → /manager
    else role = ADMIN
        FE->>FE: Redirect → /admin
    end

    Note over FE,API: Mọi request sau đều gắn<br/>Header: Authorization: Bearer {token}

    FE->>API: GET /api/v1/slots (có token)
    API->>JWT: Xác thực token
    JWT->>JWT: Kiểm tra role có quyền không
    JWT-->>API: ✅ Hợp lệ
    API-->>FE: Trả dữ liệu
```

---

## 6. Sơ đồ Trạng thái Slot (State Diagram)

```mermaid
stateDiagram-v2
    [*] --> AVAILABLE: Manager tạo slot

    AVAILABLE --> OCCUPIED: Staff check-in xe
    AVAILABLE --> RESERVED: Driver đặt chỗ trước
    AVAILABLE --> MAINTENANCE: Manager bảo trì
    AVAILABLE --> LOCKED: Hệ thống khóa tạm

    OCCUPIED --> AVAILABLE: Staff check-out xe

    RESERVED --> OCCUPIED: Driver đến, Staff check-in
    RESERVED --> AVAILABLE: Hết hạn giữ chỗ (30 phút)

    MAINTENANCE --> AVAILABLE: Manager hoàn tất bảo trì
    LOCKED --> AVAILABLE: Hệ thống mở khóa
```

---

## 7. Sơ đồ Vòng đời Parking Session

```mermaid
stateDiagram-v2
    [*] --> ACTIVE: Staff check-in xe vào

    ACTIVE --> COMPLETED: Staff check-out xe ra
    ACTIVE --> CANCELLED: Hủy phiên (trường hợp đặc biệt)

    COMPLETED --> [*]: Phiên kết thúc

    Note right of ACTIVE: Đang gửi xe<br/>Slot = OCCUPIED<br/>Phí đang tích lũy
    Note right of COMPLETED: Đã ra bãi<br/>Slot = AVAILABLE<br/>Payment đã tạo
```

---

## 8. Sơ đồ Database chính (ERD đơn giản)

```mermaid
erDiagram
    USER ||--o{ PARKING_SESSION : "tạo"
    USER {
        UUID id PK
        string email
        string password_hash
        string full_name
        enum role "ADMIN/MANAGER/STAFF/DRIVER"
        boolean is_active
    }

    BUILDING ||--o{ FLOOR : "chứa"
    BUILDING {
        UUID id PK
        string name
        string address
    }

    FLOOR ||--o{ SLOT : "chứa"
    FLOOR {
        UUID id PK
        string floor_code "B1, B2, T1"
        int total_slots
    }

    SLOT ||--o{ PARKING_SESSION : "được gán"
    SLOT {
        UUID id PK
        string slot_code "B1-A01"
        enum status "AVAILABLE/OCCUPIED/RESERVED"
    }

    PARKING_SESSION ||--o| PAYMENT : "tạo"
    PARKING_SESSION {
        UUID id PK
        string license_plate
        datetime check_in_time
        datetime check_out_time
        enum status "ACTIVE/COMPLETED"
    }

    PAYMENT {
        UUID id PK
        decimal amount
        enum method "CASH/MOMO/VNPAY"
        enum status "PENDING/COMPLETED"
    }

    VEHICLE_TYPE ||--o{ SLOT : "phù hợp"
    VEHICLE_TYPE {
        UUID id PK
        string name "Xe máy / Ô tô"
    }

    PRICING_RULE {
        UUID id PK
        decimal price_per_hour
        int free_minutes
    }
```

---

## 9. Sơ đồ Luồng vận hành hằng ngày

```mermaid
graph TD
    A["🔧 Admin tạo tài khoản"] --> B["📋 Manager cấu hình bãi xe"]
    B --> C["👷 Staff đăng nhập + chọn cổng"]
    C --> D{"🚗 Xe đến cổng?"}
    
    D -->|Xe VÀO| E["Staff nhập biển số + loại xe"]
    E --> F["🤖 AI gợi ý slot tối ưu"]
    F --> G["✅ Tạo Parking Session"]
    G --> H["Slot → OCCUPIED"]
    H --> I["📡 Cập nhật sơ đồ real-time"]
    
    D -->|Xe RA| J["Staff nhập biển số"]
    J --> K["💰 Tính phí tự động"]
    K --> L["✅ Hoàn tất Session"]
    L --> M["Slot → AVAILABLE"]
    M --> I
    
    I --> N["📊 Manager xem báo cáo"]
```

---

## 10. Cách sử dụng sơ đồ khi trình bày

| Sơ đồ | Khi nào dùng | Ai nói |
|-------|-------------|--------|
| #1 Kiến trúc | Mở đầu giới thiệu | An |
| #2 Phân quyền | Nói về actor/role | An hoặc Tùng |
| #3 Check-in ⭐ | **Luồng quan trọng nhất** | An |
| #4 Check-out | Nối tiếp check-in | An |
| #5 Đăng nhập | Nói về bảo mật | Tùng |
| #6 Trạng thái Slot | Nói về business rule | Toàn |
| #7 Parking Session | Giải thích đối tượng trung tâm | An |
| #8 ERD | Nói về database | Toàn |
| #9 Luồng hằng ngày | Tóm tắt cuối | An |

> **Tip:** In sơ đồ #3 (Check-in) và #4 (Check-out) ra giấy A4 mang theo phòng khi cô hỏi chi tiết.
