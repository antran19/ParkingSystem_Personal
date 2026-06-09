# 🅿️ SmartParking V2 — Hệ thống Quản lý Bãi Gửi xe Thông minh

> **Dự án cá nhân** | Trần Nguyễn Minh An  
> **Mã đề tài:** SU26SWP08 | **Môn:** SWP391 | **FPT University HCM** | **Summer 2026**

---

##  Tổng quan

Hệ thống quản lý bãi gửi xe toàn diện với **5 vai trò** (Driver, Staff, Security, Manager, Admin), tích hợp **AI nhận dạng biển số**, **thanh toán VNPAY**, **Digital Twin 3D**, và **real-time WebSocket**.

### Tính năng nổi bật

| Tính năng | Công nghệ |
|-----------|-----------|
| AI nhận dạng biển số xe | Tesseract.js v4 (OCR trên trình duyệt) |
| Thanh toán online | VNPAY Sandbox |
| Digital Twin 3D bãi xe | Three.js / React Three Fiber |
| Cập nhật slot real-time | WebSocket (STOMP) |
| Tự động hủy giữ chỗ hết hạn | Spring @Scheduled (Background Job) |
| Phân quyền 5 vai trò | Spring Security + JWT |
| SOS khẩn cấp | Redis Pub/Sub + WebSocket |
| Dashboard thống kê | Dữ liệu real-time từ DB |

---

## Tech Stack

| Tầng | Công nghệ |
|------|-----------|
| **Frontend** | React 18, Vite, TailwindCSS v4, GSAP |
| **Backend** | Spring Boot 3, Java 17, Spring Security, JPA/Hibernate |
| **Database** | PostgreSQL 16 |
| **Cache** | Redis 7 |
| **Realtime** | WebSocket (STOMP) |
| **Thanh toán** | VNPAY Sandbox |
| **AI/OCR** | Tesseract.js v4 |
| **3D** | Three.js / React Three Fiber |
| **DevOps** | Docker, GitHub |

---

## Cách chạy project

### Yêu cầu
- **Java 17+** (JDK)
- **Node.js 18+** (npm)
- **Docker Desktop** — [Tải tại đây](https://www.docker.com/products/docker-desktop)

### Bước 1: Start Database (PostgreSQL + Redis)

```bash
docker-compose up -d
```

### Bước 2: Chạy Backend

```bash
cd backend
mvn spring-boot:run
```

> Backend chạy tại `http://localhost:8080`  
> Kiểm tra: `http://localhost:8080/actuator/health` → `{ "status": "UP" }`

### Bước 3: Chạy Frontend

```bash
cd frontend
npm install
npm run dev
```

> Frontend chạy tại `http://localhost:5173`

### Bước 4: Đăng nhập thử

| Role | Email | Password |
|------|-------|----------|
| Driver | `driver@parking.vn` | `123456` |
| Staff | `staff@parking.vn` | `123456` |
| Security | `security@parking.vn` | `123456` |
| Manager | `manager@parking.vn` | `123456` |
| Admin | `admin@parking.vn` | `123456` |

---

## Cấu trúc project

```
ParkingSystem_Personal/
├── backend/                         ← Spring Boot (Java 17)
│   └── src/main/java/.../backend/
│       ├── entity/                  ← 16 bảng DB (User, Zone, ParkingSession, Payment...)
│       ├── repository/              ← JPA Repository interfaces (16 files)
│       ├── service/                 ← Logic nghiệp vụ  (12 files)
│       │   ├── ParkingSessionService    ← Core: Check-in/out + VNPAY + WebSocket
│       │   ├── ReservationService       ← Đặt giữ chỗ zone
│       │   ├── ReservationExpiryScheduler ← Background Job: tự hủy reservation hết hạn
│       │   ├── VnPayService             ← Tích hợp thanh toán VNPAY
│       │   ├── BlacklistService         ← Quản lý biển số đen
│       │   └── EmergencyService         ← SOS khẩn cấp
│       ├── controller/              ← REST API (12 files)
│       ├── dto/                     ← Request/Response objects
│       ├── config/                  ← SecurityConfig, WebSocket, CORS, DataInitializer
│       ├── security/                ← JWT Filter + UserDetailsService
│       ├── exception/               ← Global Exception Handler
│       └── util/                    ← JwtUtil, LicensePlateUtil
│
├── frontend/                        ← React 18 + Vite + TailwindCSS v4
│   └── src/
│       ├── api/                     ← axiosClient (JWT interceptor) + parkingApi (42 methods)
│       ├── pages/
│       │   ├── auth/LoginScreen     ← Landing page + Login + Register + OAuth
│       │   ├── driver/              ← Dashboard, Bản đồ, Profile, Payment
│       │   ├── staff/               ← Check-in, Check-out, Dashboard, Lịch sử, Sơ đồ
│       │   ├── security/            ← SOS, Blacklist, Exception Log
│       │   ├── manager/             ← Thống kê, Digital Twin 3D
│       │   └── admin/               ← CRUD Users, Zones, Gates, Pricing, Passes
│       └── route/AppRoutes          ← Điều hướng 5 role
│
├── docs/                            ← Tài liệu kỹ thuật
├── SYSTEM_WALKTHROUGH.md            ← Giải thích toàn bộ luồng code từng bước
├── SRS_SmartParking.md              ← Đặc tả yêu cầu phần mềm
└── docker-compose.yml               ← PostgreSQL + Redis containers
```

---

## Phân quyền 5 vai trò

| Role | Dashboard | Chức năng chính |
|------|-----------|----------------|
| **Driver** | Quản lý biển số, đặt giữ chỗ | Xem session, thanh toán VNPAY, đăng ký vé tháng |
| **Staff** | Check-in/out xe | AI OCR biển số, quét QR, sơ đồ bãi xe real-time |
| **Security** | Giám sát an ninh | Báo sự cố, SOS khẩn cấp, quản lý blacklist |
| **Manager** | Thống kê & báo cáo | Digital Twin 3D, lịch sử giao dịch, doanh thu |
| **Admin** | Quản trị hệ thống | CRUD users, zones, gates, pricing rules, passes |

---

## Tài liệu

| File | Mô tả |
|------|-------|
| [SYSTEM_WALKTHROUGH.md](SYSTEM_WALKTHROUGH.md) | Giải thích từng bước luồng code (Login → Check-in → Check-out → Payment) |
| [SRS_SmartParking.md](SRS_SmartParking.md) | Đặc tả yêu cầu phần mềm |
| [DATABASE_SCHEMA_V2.md](DATABASE_SCHEMA_V2.md) | Thiết kế cơ sở dữ liệu 16 bảng |
| [docs/API_SPEC.md](docs/API_SPEC.md) | Đặc tả API endpoints |

---

## Tác giả

**Trần Nguyễn Minh An** 
FPT University HCM — Khoa Công nghệ Thông tin  
📧 Email: trannguyenminhan2005@gmail.com 
🔗 GitHub: [github.com/antran19](https://github.com/antran19)
