package com.smartparking.backend.controller;

import com.smartparking.backend.dto.response.ApiResponse;
import com.smartparking.backend.entity.*;
import com.smartparking.backend.exception.BusinessException;
import com.smartparking.backend.exception.ResourceNotFoundException;
import com.smartparking.backend.repository.*;
import com.smartparking.backend.service.VnPayService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * DriverController — API dành riêng cho Tài xế (Driver).
 * Quản lý danh sách biển số xe cá nhân, lưu trữ bền vững dưới Database.
 */
@RestController
@RequestMapping("/api/v1/driver")
@PreAuthorize("hasAnyRole('DRIVER', 'MANAGER', 'ADMIN')")
public class DriverController {

    private final UserRepository userRepository;
    private final UserLicensePlateRepository userLicensePlateRepository;
    private final ParkingPassRepository parkingPassRepository;
    private final PricingRuleRepository pricingRuleRepository;
    private final BuildingRepository buildingRepository;
    private final VehicleTypeRepository vehicleTypeRepository;
    private final PaymentRepository paymentRepository;
    private final VnPayService vnPayService;

    public DriverController(UserRepository userRepository,
                            UserLicensePlateRepository userLicensePlateRepository,
                            ParkingPassRepository parkingPassRepository,
                            PricingRuleRepository pricingRuleRepository,
                            BuildingRepository buildingRepository,
                            VehicleTypeRepository vehicleTypeRepository,
                            PaymentRepository paymentRepository,
                            VnPayService vnPayService) {
        this.userRepository = userRepository;
        this.userLicensePlateRepository = userLicensePlateRepository;
        this.parkingPassRepository = parkingPassRepository;
        this.pricingRuleRepository = pricingRuleRepository;
        this.buildingRepository = buildingRepository;
        this.vehicleTypeRepository = vehicleTypeRepository;
        this.paymentRepository = paymentRepository;
        this.vnPayService = vnPayService;
    }

    /**
     * Lấy User hiện tại từ Authentication (JWT).
     */
    private User getCurrentUser(Authentication authentication) {
        if (authentication == null) {
            throw new BusinessException("Chưa xác thực người dùng");
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản người dùng"));
    }

    private String normalizeAndValidatePlate(String plate) {
        String normalized = String.valueOf(plate == null ? "" : plate)
                .trim()
                .toUpperCase()
                .replaceAll("\\s+", "")
                .replace('–', '-')
                .replace('—', '-');
        if (normalized.isEmpty()) {
            throw new BusinessException("Biển số xe không được để trống");
        }
        if (!normalized.matches("^\\d{2}[A-Z]{1,2}\\d?-\\d{3}(\\.\\d{2}|\\d{2})$")) {
            throw new BusinessException("Biển số không đúng định dạng. Ví dụ: 51F-123.45, 30A-12345 hoặc 59X1-12345");
        }
        return normalized;
    }

    /**
     * GET /api/v1/driver/plates
     * Lấy danh sách biển số xe đã lưu của Driver hiện tại.
     */
    @GetMapping("/plates")
    public ResponseEntity<ApiResponse<List<String>>> getMyPlates(Authentication authentication) {
        User user = getCurrentUser(authentication);
        List<UserLicensePlate> plates = userLicensePlateRepository.findByUser(user);
        List<String> plateStrings = plates.stream()
                .map(UserLicensePlate::getLicensePlate)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(plateStrings));
    }

    /**
     * POST /api/v1/driver/plates
     * Đăng ký online thêm biển số xe mới dưới database.
     */
    @PostMapping("/plates")
    @Transactional
    public ResponseEntity<ApiResponse<String>> addPlate(Authentication authentication,
                                                         @RequestBody Map<String, String> requestBody) {
        String plate = normalizeAndValidatePlate(requestBody.get("licensePlate"));

        User user = getCurrentUser(authentication);

        // Kiểm tra xem biển số xe này đã được người dùng đăng ký chưa
        if (userLicensePlateRepository.findByUserAndLicensePlate(user, plate).isPresent()) {
            throw new BusinessException("Biển số xe này đã được bạn đăng ký từ trước!");
        }

        UserLicensePlate licensePlateEntity = UserLicensePlate.builder()
                .user(user)
                .licensePlate(plate)
                .build();
        userLicensePlateRepository.save(licensePlateEntity);

        return ResponseEntity.ok(ApiResponse.success("Đăng ký biển số xe online thành công!", plate));
    }

    /**
     * DELETE /api/v1/driver/plates
     * Xóa biển số xe khỏi tài khoản Driver.
     */
    @DeleteMapping("/plates")
    @Transactional
    public ResponseEntity<ApiResponse<String>> deletePlate(Authentication authentication,
                                                            @RequestParam("plate") String plate) {
        plate = normalizeAndValidatePlate(plate);

        User user = getCurrentUser(authentication);

        // Tìm và xóa
        UserLicensePlate licensePlateEntity = userLicensePlateRepository.findByUserAndLicensePlate(user, plate)
                .orElseThrow(() -> new ResourceNotFoundException("Biển số xe này không tồn tại trong tài khoản của bạn"));

        userLicensePlateRepository.delete(licensePlateEntity);

        return ResponseEntity.ok(ApiResponse.success("Đã xóa biển số xe thành công!", plate));
    }

    // ========== PARKING PASS (Vé gửi xe theo gói) ==========

    /**
     * GET /api/v1/driver/parking-passes
     * Lấy danh sách vé gửi xe (pass) của tài xế hiện tại.
     */
    @GetMapping("/parking-passes")
    public ResponseEntity<ApiResponse<List<ParkingPass>>> getMyPasses(Authentication authentication) {
        User user = getCurrentUser(authentication);
        List<ParkingPass> passes = parkingPassRepository.findByUser(user);
        return ResponseEntity.ok(ApiResponse.success(passes));
    }

    /**
     * GET /api/v1/driver/pricing-plans
     * Lấy danh sách các gói dịch vụ có sẵn (từ pricing rules loại MONTHLY).
     * Driver dùng để xem có bao nhiêu gói, giá bao nhiêu, rồi quyết định đăng ký.
     */
    @GetMapping("/pricing-plans")
    public ResponseEntity<ApiResponse<List<PricingRule>>> getPricingPlans() {
        List<PricingRule> monthlyRules = pricingRuleRepository.findAll().stream()
                .filter(r -> r.getPricingType() == PricingRule.PricingType.MONTHLY)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(monthlyRules));
    }

    /**
     * POST /api/v1/driver/parking-passes
     * Tài xế tự đăng ký vé gửi xe theo gói.
     * Body: { buildingId, vehicleTypeId, licensePlate, passType: "MONTHLY"|"QUARTERLY"|"YEARLY" }
     */
    @PostMapping("/parking-passes")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> registerPass(Authentication authentication,
                                                                          @RequestBody Map<String, Object> body,
                                                                          HttpServletRequest request) {
        User user = getCurrentUser(authentication);

        String licensePlate = normalizeAndValidatePlate((String) body.getOrDefault("licensePlate", ""));

        UUID buildingId = UUID.fromString((String) body.get("buildingId"));
        UUID vehicleTypeId = UUID.fromString((String) body.get("vehicleTypeId"));
        String passTypeStr = ((String) body.getOrDefault("passType", "MONTHLY")).toUpperCase();
        ParkingPass.PassType passType = ParkingPass.PassType.valueOf(passTypeStr);

        Building building = buildingRepository.findById(buildingId)
                .orElseThrow(() -> new ResourceNotFoundException("Tòa nhà không tồn tại"));
        VehicleType vehicleType = vehicleTypeRepository.findById(vehicleTypeId)
                .orElseThrow(() -> new ResourceNotFoundException("Loại xe không tồn tại"));

        PricingRule monthlyRule = pricingRuleRepository
                .findByBuildingIdAndVehicleTypeIdAndPricingType(buildingId, vehicleTypeId, PricingRule.PricingType.MONTHLY)
                .orElseThrow(() -> new BusinessException("Không tìm thấy bảng giá hàng tháng cho loại xe này"));

        BigDecimal monthlyPrice = monthlyRule.getPricePerUnit();
        BigDecimal fee;
        int months;
        switch (passType) {
            case QUARTERLY:
                months = 3;
                fee = monthlyPrice.multiply(BigDecimal.valueOf(3));
                break;
            case YEARLY:
                months = 12;
                fee = monthlyPrice.multiply(BigDecimal.valueOf(12)).multiply(BigDecimal.valueOf(0.9));
                break;
            default:
                months = 1;
                fee = monthlyPrice;
                break;
        }

        LocalDate startDate = LocalDate.now();
        LocalDate endDate = startDate.plusMonths(months);

        ParkingPass pass = ParkingPass.builder()
                .user(user)
                .building(building)
                .vehicleType(vehicleType)
                .licensePlate(licensePlate)
                .startDate(startDate)
                .endDate(endDate)
                .passType(passType)
                .fee(fee)
                .status(ParkingPass.PassStatus.PENDING_PAYMENT)
                .build();

        parkingPassRepository.save(pass);

        String orderCode = "PASS-" + pass.getId().toString().replace("-", "").substring(0, 16).toUpperCase();
        Payment payment = Payment.builder()
                .referenceType("MONTHLY_PASS")
                .referenceId(pass.getId())
                .amount(fee)
                .paymentMethod(Payment.PaymentMethod.ONLINE)
                .status(Payment.PaymentStatus.PENDING)
                .transactionId(orderCode)
                .build();
        paymentRepository.save(payment);

        String orderInfo = "Thanh toan goi " + passType.name() + " bien so " + licensePlate;
        String paymentUrl = vnPayService.createPaymentUrl(orderCode, fee, orderInfo, request);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("pass", pass);
        response.put("payment", payment);
        response.put("paymentUrl", paymentUrl);
        response.put("orderCode", orderCode);
        response.put("expiresAt", LocalDateTime.now().plusMinutes(15));

        return ResponseEntity.ok(ApiResponse.success("Đã tạo đơn thanh toán VNPay cho gói dịch vụ", response));
    }

    @PostMapping("/parking-passes/{passId}/pay")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> continuePassPayment(Authentication authentication,
                                                                                 @PathVariable UUID passId,
                                                                                 HttpServletRequest request) {
        User user = getCurrentUser(authentication);
        ParkingPass pass = parkingPassRepository.findById(passId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy gói hội viên"));

        if (!pass.getUser().getId().equals(user.getId())) {
            throw new BusinessException("Bạn không có quyền thanh toán gói này");
        }
        if (pass.getStatus() != ParkingPass.PassStatus.PENDING_PAYMENT) {
            throw new BusinessException("Gói này không còn ở trạng thái chờ thanh toán");
        }

        Payment payment = paymentRepository.findByReferenceTypeAndReferenceId("MONTHLY_PASS", pass.getId()).stream()
                .filter(p -> p.getStatus() == Payment.PaymentStatus.PENDING)
                .findFirst()
                .orElseGet(() -> paymentRepository.save(Payment.builder()
                        .referenceType("MONTHLY_PASS")
                        .referenceId(pass.getId())
                        .amount(pass.getFee())
                        .paymentMethod(Payment.PaymentMethod.ONLINE)
                        .status(Payment.PaymentStatus.PENDING)
                        .transactionId("PASS-" + pass.getId().toString().replace("-", "").substring(0, 16).toUpperCase())
                        .build()));

        String orderInfo = "Thanh toan goi " + pass.getPassType().name() + " bien so " + pass.getLicensePlate();
        String paymentUrl = vnPayService.createPaymentUrl(payment.getTransactionId(), pass.getFee(), orderInfo, request);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("pass", pass);
        response.put("payment", payment);
        response.put("paymentUrl", paymentUrl);
        response.put("orderCode", payment.getTransactionId());
        response.put("expiresAt", LocalDateTime.now().plusMinutes(15));

        return ResponseEntity.ok(ApiResponse.success("Đã tạo lại liên kết thanh toán VNPay", response));
    }
}

