package com.smartparking.backend.controller;

import com.smartparking.backend.dto.response.ApiResponse;
import com.smartparking.backend.entity.*;
import com.smartparking.backend.exception.ResourceNotFoundException;
import com.smartparking.backend.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminManagementController {
    private final UserRepository userRepository;
    private final ZoneRepository zoneRepository;
    private final GateRepository gateRepository;
    private final PricingRuleRepository pricingRuleRepository;
    private final ParkingPassRepository parkingPassRepository;
    private final BuildingRepository buildingRepository;
    private final FloorRepository floorRepository;
    private final VehicleTypeRepository vehicleTypeRepository;
    private final SystemSettingsRepository systemSettingsRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminManagementController(UserRepository userRepository,
                                     ZoneRepository zoneRepository,
                                     GateRepository gateRepository,
                                     PricingRuleRepository pricingRuleRepository,
                                     ParkingPassRepository parkingPassRepository,
                                     BuildingRepository buildingRepository,
                                     FloorRepository floorRepository,
                                     VehicleTypeRepository vehicleTypeRepository,
                                     SystemSettingsRepository systemSettingsRepository,
                                     PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.zoneRepository = zoneRepository;
        this.gateRepository = gateRepository;
        this.pricingRuleRepository = pricingRuleRepository;
        this.parkingPassRepository = parkingPassRepository;
        this.buildingRepository = buildingRepository;
        this.floorRepository = floorRepository;
        this.vehicleTypeRepository = vehicleTypeRepository;
        this.systemSettingsRepository = systemSettingsRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getUsers() {
        return ResponseEntity.ok(ApiResponse.success(userRepository.findAll().stream().map(this::userMap).toList()));
    }

    @PostMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> createUser(@RequestBody Map<String, Object> body) {
        String email = text(body, "email");
        if (userRepository.existsByEmail(email)) throw new IllegalArgumentException("Email đã tồn tại");
        User user = User.builder()
                .fullName(text(body, "name"))
                .email(email)
                .passwordHash(passwordEncoder.encode(textOrDefault(body, "password", "123456")))
                .role(User.Role.valueOf(textOrDefault(body, "role", "DRIVER").toUpperCase()))
                .phone(textOrDefault(body, "phone", ""))
                .isActive(true)
                .build();
        return ResponseEntity.ok(ApiResponse.success("Đã tạo tài khoản", userMap(userRepository.save(user))));
    }

    @PutMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateUser(@PathVariable UUID id, @RequestBody Map<String, Object> body) {
        User user = userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User không tồn tại"));
        if (body.containsKey("name")) user.setFullName(text(body, "name"));
        if (body.containsKey("email")) user.setEmail(text(body, "email"));
        if (body.containsKey("phone")) user.setPhone(text(body, "phone"));
        if (body.containsKey("role")) user.setRole(User.Role.valueOf(text(body, "role").toUpperCase()));
        if (body.containsKey("status")) user.setIsActive(!"suspended".equalsIgnoreCase(text(body, "status")));
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật tài khoản", userMap(userRepository.save(user))));
    }

    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<ApiResponse<String>> deleteUser(@PathVariable UUID id) {
        userRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa tài khoản", id.toString()));
    }

    @PostMapping("/zones")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Transactional
    public ResponseEntity<ApiResponse<Zone>> createZone(@RequestBody Map<String, Object> body) {
        Floor floor = floorRepository.findById(uuid(body, "floorId")).orElseThrow(() -> new ResourceNotFoundException("Floor không tồn tại"));
        VehicleType vehicleType = vehicleTypeRepository.findById(uuid(body, "vehicleTypeId")).orElseThrow(() -> new ResourceNotFoundException("Loại xe không tồn tại"));
        Zone zone = Zone.builder()
                .floor(floor)
                .vehicleType(vehicleType)
                .zoneCode(text(body, "zoneCode"))
                .zoneName(text(body, "zoneName"))
                .capacity(number(body, "capacity", 0))
                .currentCount(0)
                .reservedCount(0)
                .status(Zone.ZoneStatus.ACTIVE)
                .build();
        return ResponseEntity.ok(ApiResponse.success("Đã tạo zone", zoneRepository.save(zone)));
    }

    @PutMapping("/zones/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Transactional
    public ResponseEntity<ApiResponse<Zone>> updateZone(@PathVariable UUID id, @RequestBody Map<String, Object> body) {
        Zone zone = zoneRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Zone không tồn tại"));
        if (body.containsKey("zoneName")) zone.setZoneName(text(body, "zoneName"));
        if (body.containsKey("capacity")) zone.setCapacity(number(body, "capacity", zone.getCapacity()));
        if (body.containsKey("status")) zone.setStatus(Zone.ZoneStatus.valueOf(text(body, "status").toUpperCase()));
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật zone", zoneRepository.save(zone)));
    }

    @DeleteMapping("/zones/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Transactional
    public ResponseEntity<ApiResponse<String>> deleteZone(@PathVariable UUID id) {
        zoneRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa zone", id.toString()));
    }

    @PostMapping("/gates")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Transactional
    public ResponseEntity<ApiResponse<Gate>> createGate(@RequestBody Map<String, Object> body) {
        Building building = buildingRepository.findById(uuid(body, "buildingId")).orElseThrow(() -> new ResourceNotFoundException("Building không tồn tại"));
        Gate gate = Gate.builder()
                .building(building)
                .gateCode(text(body, "gateCode"))
                .gateName(text(body, "gateName"))
                .gateType(Gate.GateType.valueOf(textOrDefault(body, "gateType", "MAIN_BOTH").toUpperCase()))
                .isActive(true)
                .build();
        return ResponseEntity.ok(ApiResponse.success("Đã tạo cổng", gateRepository.save(gate)));
    }

    @PutMapping("/gates/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Transactional
    public ResponseEntity<ApiResponse<Gate>> updateGate(@PathVariable UUID id, @RequestBody Map<String, Object> body) {
        Gate gate = gateRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Gate không tồn tại"));
        if (body.containsKey("gateName")) gate.setGateName(text(body, "gateName"));
        if (body.containsKey("gateType")) gate.setGateType(Gate.GateType.valueOf(text(body, "gateType").toUpperCase()));
        if (body.containsKey("isActive")) gate.setIsActive(Boolean.parseBoolean(String.valueOf(body.get("isActive"))));
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật cổng", gateRepository.save(gate)));
    }

    @DeleteMapping("/gates/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Transactional
    public ResponseEntity<ApiResponse<String>> deleteGate(@PathVariable UUID id) {
        gateRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa cổng", id.toString()));
    }

    @PostMapping("/pricing-rules")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Transactional
    public ResponseEntity<ApiResponse<PricingRule>> createPricingRule(@RequestBody Map<String, Object> body) {
        Building building = buildingRepository.findById(uuid(body, "buildingId")).orElseThrow(() -> new ResourceNotFoundException("Building không tồn tại"));
        VehicleType vehicleType = vehicleTypeRepository.findById(uuid(body, "vehicleTypeId")).orElseThrow(() -> new ResourceNotFoundException("Loại xe không tồn tại"));
        PricingRule rule = PricingRule.builder()
                .building(building)
                .vehicleType(vehicleType)
                .pricingType(PricingRule.PricingType.valueOf(textOrDefault(body, "pricingType", "HOURLY").toUpperCase()))
                .pricePerUnit(decimal(body, "pricePerUnit", BigDecimal.ZERO))
                .freeMinutes(number(body, "freeMinutes", 0))
                .build();
        return ResponseEntity.ok(ApiResponse.success("Đã tạo bảng giá", pricingRuleRepository.save(rule)));
    }

    @PutMapping("/pricing-rules/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Transactional
    public ResponseEntity<ApiResponse<PricingRule>> updatePricingRule(@PathVariable UUID id, @RequestBody Map<String, Object> body) {
        PricingRule rule = pricingRuleRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Bảng giá không tồn tại"));
        if (body.containsKey("pricingType")) rule.setPricingType(PricingRule.PricingType.valueOf(text(body, "pricingType").toUpperCase()));
        if (body.containsKey("pricePerUnit")) rule.setPricePerUnit(decimal(body, "pricePerUnit", rule.getPricePerUnit()));
        if (body.containsKey("freeMinutes")) rule.setFreeMinutes(number(body, "freeMinutes", rule.getFreeMinutes()));
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật bảng giá", pricingRuleRepository.save(rule)));
    }

    @DeleteMapping("/pricing-rules/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Transactional
    public ResponseEntity<ApiResponse<String>> deletePricingRule(@PathVariable UUID id) {
        pricingRuleRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa bảng giá", id.toString()));
    }

    @GetMapping("/parking-passes")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<ParkingPass>>> getPasses() {
        return ResponseEntity.ok(ApiResponse.success(parkingPassRepository.findAll()));
    }

    @PostMapping("/parking-passes")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Transactional
    public ResponseEntity<ApiResponse<ParkingPass>> createPass(@RequestBody Map<String, Object> body) {
        User user = userRepository.findById(uuid(body, "userId")).orElseThrow(() -> new ResourceNotFoundException("User không tồn tại"));
        Building building = buildingRepository.findById(uuid(body, "buildingId")).orElseThrow(() -> new ResourceNotFoundException("Building không tồn tại"));
        VehicleType vehicleType = vehicleTypeRepository.findById(uuid(body, "vehicleTypeId")).orElseThrow(() -> new ResourceNotFoundException("Loại xe không tồn tại"));
        ParkingPass pass = ParkingPass.builder()
                .user(user)
                .building(building)
                .vehicleType(vehicleType)
                .licensePlate(text(body, "licensePlate").toUpperCase())
                .qrCode("PASS-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .startDate(LocalDate.parse(text(body, "startDate")))
                .endDate(LocalDate.parse(text(body, "endDate")))
                .passType(ParkingPass.PassType.valueOf(textOrDefault(body, "passType", "MONTHLY").toUpperCase()))
                .fee(decimal(body, "fee", BigDecimal.ZERO))
                .status(ParkingPass.PassStatus.ACTIVE)
                .build();
        return ResponseEntity.ok(ApiResponse.success("Đã phát hành vé định kỳ", parkingPassRepository.save(pass)));
    }

    @PutMapping("/parking-passes/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Transactional
    public ResponseEntity<ApiResponse<ParkingPass>> updatePass(@PathVariable UUID id, @RequestBody Map<String, Object> body) {
        ParkingPass pass = parkingPassRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Vé tháng không tồn tại"));
        if (body.containsKey("userId")) pass.setUser(userRepository.findById(uuid(body, "userId")).orElseThrow(() -> new ResourceNotFoundException("User không tồn tại")));
        if (body.containsKey("buildingId")) pass.setBuilding(buildingRepository.findById(uuid(body, "buildingId")).orElseThrow(() -> new ResourceNotFoundException("Building không tồn tại")));
        if (body.containsKey("vehicleTypeId")) pass.setVehicleType(vehicleTypeRepository.findById(uuid(body, "vehicleTypeId")).orElseThrow(() -> new ResourceNotFoundException("Loại xe không tồn tại")));
        if (body.containsKey("licensePlate")) pass.setLicensePlate(text(body, "licensePlate").toUpperCase());
        if (body.containsKey("startDate")) pass.setStartDate(LocalDate.parse(text(body, "startDate")));
        if (body.containsKey("endDate")) pass.setEndDate(LocalDate.parse(text(body, "endDate")));
        if (body.containsKey("passType")) pass.setPassType(ParkingPass.PassType.valueOf(text(body, "passType").toUpperCase()));
        if (body.containsKey("fee")) pass.setFee(decimal(body, "fee", pass.getFee()));
        if (body.containsKey("status")) pass.setStatus(ParkingPass.PassStatus.valueOf(text(body, "status").toUpperCase()));
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật vé tháng", parkingPassRepository.save(pass)));
    }

    @DeleteMapping("/parking-passes/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Transactional
    public ResponseEntity<ApiResponse<String>> deletePass(@PathVariable UUID id) {
        parkingPassRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa vé tháng", id.toString()));
    }

    @PostMapping("/parking-passes/{id}/renew")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Transactional
    public ResponseEntity<ApiResponse<ParkingPass>> renewPass(@PathVariable UUID id) {
        ParkingPass pass = parkingPassRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Vé định kỳ không tồn tại"));
        int days = switch (pass.getPassType()) {
            case YEARLY -> 365;
            case QUARTERLY -> 90;
            default -> 30;
        };
        pass.setEndDate(pass.getEndDate().plusDays(days));
        pass.setStatus(ParkingPass.PassStatus.ACTIVE);
        return ResponseEntity.ok(ApiResponse.success("Đã gia hạn vé " + days + " ngày", parkingPassRepository.save(pass)));
    }

    @PutMapping("/gates/{id}/barrier")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Transactional
    public ResponseEntity<ApiResponse<String>> controlBarrier(@PathVariable UUID id, @RequestBody Map<String, Object> body) {
        Gate gate = gateRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Gate không tồn tại"));
        String state = text(body, "state").toUpperCase();
        if (!state.equals("OPEN") && !state.equals("CLOSED")) throw new IllegalArgumentException("Trạng thái barrier không hợp lệ");
        return ResponseEntity.ok(ApiResponse.success("Đã gửi lệnh " + state + " tới barrier " + gate.getGateName(), state));
    }

    @GetMapping("/settings")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSettings() {
        return ResponseEntity.ok(ApiResponse.success(settingsMap(settings())));
    }

    @PutMapping("/settings")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateSettings(@RequestBody Map<String, Object> body) {
        SystemSettings settings = settings();
        if (body.containsKey("gracePeriod")) settings.setGracePeriodMinutes(number(body, "gracePeriod", settings.getGracePeriodMinutes()));
        if (body.containsKey("currency")) settings.setCurrency(textOrDefault(body, "currency", settings.getCurrency()));
        if (body.containsKey("vat")) settings.setVatPercentage(number(body, "vat", settings.getVatPercentage()));
        if (body.containsKey("systemName")) settings.setSystemName(textOrDefault(body, "systemName", settings.getSystemName()));
        if (body.containsKey("sosEnabled")) settings.setSosEnabled(Boolean.parseBoolean(String.valueOf(body.get("sosEnabled"))));
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật cài đặt hệ thống", settingsMap(systemSettingsRepository.save(settings))));
    }

    private Map<String, Object> userMap(User user) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", user.getId());
        map.put("name", user.getFullName());
        map.put("email", user.getEmail());
        map.put("role", user.getRole().name().toLowerCase());
        map.put("status", Boolean.TRUE.equals(user.getIsActive()) ? "active" : "suspended");
        map.put("phone", user.getPhone());
        return map;
    }

    private SystemSettings settings() {
        return systemSettingsRepository.findAll().stream().findFirst()
                .orElseGet(() -> systemSettingsRepository.save(SystemSettings.builder().build()));
    }

    private Map<String, Object> settingsMap(SystemSettings settings) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", settings.getId());
        map.put("gracePeriod", settings.getGracePeriodMinutes());
        map.put("currency", settings.getCurrency());
        map.put("vat", settings.getVatPercentage());
        map.put("systemName", settings.getSystemName());
        map.put("sosEnabled", settings.getSosEnabled() != null ? settings.getSosEnabled() : true);
        return map;
    }

    private String text(Map<String, Object> body, String key) {
        Object value = body.get(key);
        if (value == null || String.valueOf(value).isBlank()) throw new IllegalArgumentException(key + " không được để trống");
        return String.valueOf(value).trim();
    }

    private String textOrDefault(Map<String, Object> body, String key, String defaultValue) {
        Object value = body.get(key);
        return value == null || String.valueOf(value).isBlank() ? defaultValue : String.valueOf(value).trim();
    }

    private UUID uuid(Map<String, Object> body, String key) {
        return UUID.fromString(text(body, key));
    }

    private int number(Map<String, Object> body, String key, int defaultValue) {
        Object value = body.get(key);
        return value == null ? defaultValue : Integer.parseInt(String.valueOf(value));
    }

    private BigDecimal decimal(Map<String, Object> body, String key, BigDecimal defaultValue) {
        Object value = body.get(key);
        return value == null ? defaultValue : new BigDecimal(String.valueOf(value));
    }
}
