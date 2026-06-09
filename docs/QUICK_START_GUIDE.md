# 🚀 SmartParking — Quick Start Guide

## 📋 Tóm tắt Dự án

**SmartParking** là hệ thống quản lý bãi xe thông minh cho tòa nhà, với các tính năng chính:

- ✅ **Check-in/Check-out** xe tự động
- ✅ **AI phân bổ slot** tối ưu (tầng thấp, gần cổng)
- ✅ **Tính phí** theo block giờ
- ✅ **Real-time slot map** (WebSocket)
- ✅ **JWT authentication** (RBAC)
- ✅ **Distributed lock** (Redis) chống race condition

---

## 🛠️ Cài đặt & Chạy

### Bước 1: Cài Docker Desktop
Tải tại: https://www.docker.com/products/docker-desktop

### Bước 2: Start Database & Redis
```bash
cd /c/Users/Lenovo/Downloads/new
docker-compose up -d
```

Kiểm tra:
```bash
docker ps
# Sẽ thấy 2 container: postgres, redis
```

### Bước 3: Chạy Backend
```bash
cd backend
./mvnw spring-boot:run
```

Hoặc mở IntelliJ/VS Code → Run `SmartParkingApplication.java`

### Bước 4: Test API
```bash
curl http://localhost:8080/actuator/health
```

Response:
```json
{
  "status": "UP"
}
```

---

## 📚 Tài liệu Chi tiết

Dự án có 3 tài liệu giải thích chi tiết:

### 1. **PROJECT_STRUCTURE_EXPLANATION.md**
- Giải thích từng package (entity, repository, service, controller, dto, security, config, exception, util)
- Tại sao đặt tên như vậy
- Database schema (13 bảng)
- Flow chính: Check-in & Check-out

### 2. **CODE_LOGIC_EXPLANATION.md**
- Giải thích chi tiết code logic
- UC-04: Check-in Xe
- UC-05: Check-out Xe
- Core AI: SlotAssignmentService (thuật toán phân bổ slot)
- PricingService: Tính phí
- SlotMapService: Sơ đồ bãi xe
- JWT Authentication Flow
- WebSocket: Real-time Slot Status
- Exception Handling

### 3. **DESIGN_PATTERNS_AND_BEST_PRACTICES.md**
- 8 Design Patterns được sử dụng
- 10 Best Practices
- Security Best Practices
- Performance Best Practices
- Testing Best Practices
- Code Style & Conventions

---

## 🔑 Các Endpoint Chính

### Authentication

**Login:**
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "staff@parking.vn",
  "password": "123456"
}
```

Response:
```json
{
  "success": true,
  "data": {
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
}
```

**Refresh Token:**
```bash
POST /api/v1/auth/refresh
Authorization: Bearer <refresh_token>
```

---

### Parking Sessions

**Check-in (Xe vào bãi):**
```bash
POST /api/v1/sessions/check-in
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "vehicleTypeId": "550e8400-e29b-41d4-a716-446655440000",
  "licensePlate": "29A-12345",
  "gateEntryId": "660e8400-e29b-41d4-a716-446655440001",
  "notes": "Xe màu đỏ"
}
```

Response:
```json
{
  "success": true,
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

**Check-out (Xe ra bãi):**
```bash
POST /api/v1/sessions/check-out
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "sessionCode": "PS20260516-A3F",
  "gateExitId": "660e8400-e29b-41d4-a716-446655440002",
  "paymentMethod": "CASH"
}
```

Response:
```json
{
  "success": true,
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

**Get Active Session:**
```bash
GET /api/v1/sessions/active?licensePlate=29A-12345
Authorization: Bearer <access_token>
```

---

### Slot Map

**Get Slot Map (Public - không cần login):**
```bash
GET /api/v1/public/slots/map/550e8400-e29b-41d4-a716-446655440000
```

Response:
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

---

## 🗂️ Cấu trúc Thư mục

```
smartparking/
├── backend/
│   ├── src/main/java/com/smartparking/backend/
│   │   ├── entity/              ← 13 bảng DB
│   │   ├── repository/          ← Query database
│   │   ├── service/             ← Business logic
│   │   ├── controller/          ← REST API
│   │   ├── dto/
│   │   │   ├── request/
│   │   │   └── response/
│   │   ├── security/            ← JWT filter
│   │   ├── config/              ← Spring config
│   │   ├── exception/           ← Error handling
│   │   └── util/                ← Utilities
│   ├── src/main/resources/
│   │   └── application.yml      ← Config
│   └── pom.xml                  ← Maven dependencies
├── docs/
│   ├── API_SPEC.md              ← API documentation
│   └── CODE_WALKTHROUGH.md      ← Code explanation
├── docker-compose.yml           ← PostgreSQL + Redis
├── PROJECT_STRUCTURE_EXPLANATION.md
├── CODE_LOGIC_EXPLANATION.md
├── DESIGN_PATTERNS_AND_BEST_PRACTICES.md
├── QUICK_START_GUIDE.md         ← File này
├── SRS_ParkingSystem.md         ← Requirements (26 Use Cases)
└── task.md                      ← Task assignment
```

---

## 🔧 Configuration

**application.yml:**
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/smartparking_db
    username: postgres
    password: postgres

  data:
    redis:
      host: localhost
      port: 6379

jwt:
  secret: "smartparking-super-secret-key-SU26SWP08-minimum-256-bits-change-in-prod"
  expiration: 3600000          # 1 hour
  refresh-expiration: 604800000  # 7 days

smartparking:
  reservation:
    hold-minutes: 30
  overstay:
    alert-hours: 24
  slot-assignment:
    floor-weight: 100
    distance-weight: 1

server:
  port: 8080
```

---

## 📊 Database Schema

**13 bảng chính:**

1. **users** - Tài khoản (Admin, Manager, Staff, Driver)
2. **buildings** - Tòa nhà
3. **floors** - Tầng (B1, T1, T2...)
4. **slots** - Ô đỗ xe (B1-A01, T1-C15...)
5. **vehicle_types** - Loại xe (Xe máy, Ô tô, Xe điện)
6. **parking_sessions** - Phiên gửi xe (check-in → check-out)
7. **payments** - Thanh toán
8. **pricing_rules** - Bảng giá
9. **gates** - Cổng vào/ra
10. **reservations** - Đặt chỗ trước
11. **monthly_passes** - Vé tháng
12. **exception_logs** - Log lỗi
13. **zones** - Khu vực

---

## 🧪 Testing

### Unit Test
```bash
cd backend
./mvnw test
```

### Integration Test
```bash
cd backend
./mvnw test -Dgroups=integration
```

### Test Coverage
```bash
cd backend
./mvnw jacoco:report
# Report: target/site/jacoco/index.html
```

---

## 🐛 Troubleshooting

### Docker không start
```bash
# Kiểm tra Docker daemon
docker ps

# Nếu lỗi, restart Docker Desktop
```

### Database connection error
```bash
# Kiểm tra PostgreSQL
docker logs smartparking-postgres

# Kiểm tra Redis
docker logs smartparking-redis
```

### Port 8080 đã được sử dụng
```bash
# Tìm process sử dụng port 8080
lsof -i :8080

# Kill process
kill -9 <PID>
```

### JWT token expired
```bash
# Refresh token
POST /api/v1/auth/refresh
Authorization: Bearer <refresh_token>
```

---

## 📈 Performance Tips

### 1. Enable Query Logging
```yaml
logging:
  level:
    org.hibernate.SQL: DEBUG
    org.hibernate.type.descriptor.sql.BasicBinder: TRACE
```

### 2. Monitor Redis
```bash
docker exec smartparking-redis redis-cli
> INFO
> KEYS *
```

### 3. Monitor Database
```bash
docker exec smartparking-postgres psql -U postgres -d smartparking_db
> SELECT * FROM parking_sessions;
> SELECT COUNT(*) FROM slots WHERE status = 'AVAILABLE';
```

---

## 🚀 Deployment

### Build JAR
```bash
cd backend
./mvnw clean package -DskipTests
# JAR: target/smartparking-backend-0.0.1-SNAPSHOT.jar
```

### Run JAR
```bash
java -jar target/smartparking-backend-0.0.1-SNAPSHOT.jar
```

### Docker Image
```bash
docker build -t smartparking-backend:latest .
docker run -p 8080:8080 smartparking-backend:latest
```

---

## 📞 Support

### Tài liệu
- [PROJECT_STRUCTURE_EXPLANATION.md](PROJECT_STRUCTURE_EXPLANATION.md) - Cấu trúc dự án
- [CODE_LOGIC_EXPLANATION.md](CODE_LOGIC_EXPLANATION.md) - Giải thích code
- [DESIGN_PATTERNS_AND_BEST_PRACTICES.md](DESIGN_PATTERNS_AND_BEST_PRACTICES.md) - Design patterns
- [SRS_ParkingSystem.md](SRS_ParkingSystem.md) - Requirements
- [API_SPEC.md](docs/API_SPEC.md) - API documentation

### Liên hệ
- **Leader:** Trần Nguyễn Minh An
- **Email:** an.tran@fpt.edu.vn
- **GitHub:** https://github.com/smartparking

---

## 🎯 Các Use Case Chính

| UC | Tên | Mô tả |
|----|-----|-------|
| UC-04 | Check-in | Xe vào bãi, gán slot tối ưu |
| UC-05 | Check-out | Xe ra bãi, tính phí, giải phóng slot |
| UC-14 | View Session | Xem thông tin phiên gửi xe đang diễn ra |
| UC-15 | View Slot Map | Xem sơ đồ bãi xe real-time |
| UC-01 | Login | Đăng nhập hệ thống |
| UC-02 | Logout | Đăng xuất hệ thống |
| UC-03 | Refresh Token | Làm mới access token |

---

## 🎓 Học Thêm

### Spring Boot
- https://spring.io/projects/spring-boot
- https://spring.io/guides/gs/rest-service/

### Spring Security & JWT
- https://spring.io/guides/gs/securing-web/
- https://jwt.io/

### Redis
- https://redis.io/
- https://spring.io/projects/spring-data-redis

### PostgreSQL
- https://www.postgresql.org/
- https://www.postgresql.org/docs/

### WebSocket
- https://spring.io/guides/gs/messaging-stomp-websocket/

---

## 📝 Ghi chú

1. **Stateless API:** Không dùng session, chỉ dùng JWT token
2. **Redis Lock:** Chống race condition khi 2 xe check-in cùng lúc
3. **WebSocket Broadcast:** Real-time update slot status cho tất cả client
4. **Transactional:** `@Transactional` đảm bảo consistency
5. **Lazy Loading:** `FetchType.LAZY` tránh N+1 query problem
6. **Custom Queries:** Dùng `@Query` thay vì method name quá dài

---

## ✅ Checklist Trước Khi Deploy

- [ ] Tất cả tests pass
- [ ] Code review hoàn thành
- [ ] Database migration chạy thành công
- [ ] JWT secret được thay đổi (production)
- [ ] Redis password được cấu hình (production)
- [ ] Logging được cấu hình đúng
- [ ] Error handling hoàn chỉnh
- [ ] API documentation cập nhật
- [ ] Performance testing hoàn thành
- [ ] Security review hoàn thành

---

**Happy Coding! 🚀**

