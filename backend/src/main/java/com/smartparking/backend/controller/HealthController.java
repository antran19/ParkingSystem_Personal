package com.smartparking.backend.controller;

import com.smartparking.backend.dto.response.ApiResponse;
import com.smartparking.backend.entity.Zone;
import com.smartparking.backend.repository.ParkingSessionRepository;
import com.smartparking.backend.repository.PaymentRepository;
import com.smartparking.backend.repository.ZoneRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * HealthController — Cung cấp các API kiểm tra sức khỏe hệ thống và tiện ích kiểm thử.
 */
@RestController
@RequestMapping("/api/v1")
public class HealthController {

    private final PaymentRepository paymentRepository;
    private final ParkingSessionRepository parkingSessionRepository;
    private final ZoneRepository zoneRepository;
    private final JdbcTemplate jdbcTemplate;

    public HealthController(PaymentRepository paymentRepository,
                            ParkingSessionRepository parkingSessionRepository,
                            ZoneRepository zoneRepository,
                            JdbcTemplate jdbcTemplate) {
        this.paymentRepository = paymentRepository;
        this.parkingSessionRepository = parkingSessionRepository;
        this.zoneRepository = zoneRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/ping")
    public ApiResponse<Map<String, Object>> ping() {
        return ApiResponse.success("SmartParking Backend is running!", Map.of(
                "status", "OK",
                "timestamp", LocalDateTime.now().toString(),
                "version", "2.0.0"
        ));
    }

    /**
     * GET /api/v1/public/fix-constraints
     * API tự động sửa lỗi Check Constraint của Database PostgreSQL:
     *   - Loại bỏ ràng buộc kiểm tra enum cũ `payments_payment_method_check` do Hibernate không tự cập nhật khi bổ sung BANK_TRANSFER.
     *   - Cho phép chèn các phương thức thanh toán mới (BANK_TRANSFER, QR_CODE) một cách an toàn.
     */
    @GetMapping("/public/fix-constraints")
    public ApiResponse<Map<String, Object>> fixConstraints() {
        try {
            jdbcTemplate.execute("ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_method_check;");
            return ApiResponse.success("Đã loại bỏ check constraint payments_payment_method_check thành công! Hệ thống đã chấp nhận thanh toán BANK_TRANSFER.", Map.of(
                    "status", "FIXED",
                    "timestamp", LocalDateTime.now().toString()
            ));
        } catch (Exception e) {
            return ApiResponse.error("Lỗi khi xử lý DB Constraint: " + e.getMessage());
        }
    }

    /**
     * GET /api/v1/public/reset-db
     * Endpoint hỗ trợ chạy thử nghiệm (Demo Sandbox Tool):
     *   1. Xóa sạch lịch sử giao dịch và phiên gửi xe cũ (payments, parking_sessions)
     *   2. Đưa tất cả Zone đỗ xe về trạng thái trống hoàn toàn (currentCount = 0, reservedCount = 0, status = ACTIVE)
     * Giúp dọn dẹp các xe bị kẹt do lỗi test ở các phiên làm việc trước một cách nhanh chóng và an toàn.
     */
    @GetMapping("/public/reset-db")
    @Transactional
    public ApiResponse<Map<String, Object>> resetDatabase() {
        // 1. Tự động sửa lỗi check constraint trước
        try {
            jdbcTemplate.execute("ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_method_check;");
        } catch (Exception e) {
            // Bỏ qua nếu lỗi
        }

        // 2. Xóa dữ liệu liên kết trước để tránh vi phạm khóa ngoại (Foreign Key Constraint)
        paymentRepository.deleteAll();
        parkingSessionRepository.deleteAll();

        // 3. Reset trạng thái toàn bộ khu vực đỗ xe (Zones)
        List<Zone> zones = zoneRepository.findAll();
        for (Zone zone : zones) {
            zone.setCurrentCount(0);
            zone.setReservedCount(0);
            zone.setStatus(Zone.ZoneStatus.ACTIVE);
        }
        zoneRepository.saveAll(zones);

        return ApiResponse.success("Đã reset và dọn dẹp database thành công! Bãi đỗ xe đã trống 100%. Ràng buộc thanh toán đã được sửa.", Map.of(
                "resetTime", LocalDateTime.now().toString(),
                "activeSessionsCleared", 0,
                "zonesResetCount", zones.size()
        ));
    }
}
