package com.smartparking.backend.controller;

import com.smartparking.backend.dto.request.BlacklistPlateRequest;
import com.smartparking.backend.dto.request.BlacklistRemoveRequest;
import com.smartparking.backend.dto.request.EmergencyActivateRequest;
import com.smartparking.backend.dto.request.EmergencyDeactivateRequest;
import com.smartparking.backend.dto.request.SecurityExceptionRequest;
import com.smartparking.backend.dto.response.ApiResponse;
import com.smartparking.backend.dto.response.BlacklistPlateResponse;
import com.smartparking.backend.dto.response.EmergencyStatusResponse;
import com.smartparking.backend.entity.ExceptionLog;
import com.smartparking.backend.service.BlacklistService;
import com.smartparking.backend.service.EmergencyService;
import com.smartparking.backend.service.SecurityExceptionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/security")
public class SecurityController {

    private final SecurityExceptionService securityExceptionService;
    private final EmergencyService emergencyService;
    private final BlacklistService blacklistService;

    public SecurityController(SecurityExceptionService securityExceptionService,
                              EmergencyService emergencyService,
                              BlacklistService blacklistService) {
        this.securityExceptionService = securityExceptionService;
        this.emergencyService = emergencyService;
        this.blacklistService = blacklistService;
    }

    @PostMapping("/exceptions")
    @PreAuthorize("hasAnyRole('SECURITY', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<ExceptionLog>> logException(
            @Valid @RequestBody SecurityExceptionRequest request) {
        ExceptionLog exceptionLog = securityExceptionService.logException(request);
        return ResponseEntity.ok(ApiResponse.success("Đã ghi nhận ngoại lệ bảo vệ xử lý", exceptionLog));
    }

    @GetMapping("/exceptions")
    @PreAuthorize("hasAnyRole('SECURITY', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<java.util.List<ExceptionLog>>> getAllExceptions() {
        java.util.List<ExceptionLog> list = securityExceptionService.getAllExceptions();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PostMapping("/emergency/activate")
    @PreAuthorize("hasAnyRole('SECURITY', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<EmergencyStatusResponse>> activateEmergency(
            @Valid @RequestBody EmergencyActivateRequest request) {
        EmergencyStatusResponse response = emergencyService.activate(request);
        return ResponseEntity.ok(ApiResponse.success("SOS đã kích hoạt. Toàn bộ barrier đã mở.", response));
    }

    @PostMapping("/emergency/deactivate")
    @PreAuthorize("hasAnyRole('SECURITY', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<EmergencyStatusResponse>> deactivateEmergency(
            @Valid @RequestBody EmergencyDeactivateRequest request) {
        EmergencyStatusResponse response = emergencyService.deactivate(request);
        return ResponseEntity.ok(ApiResponse.success("SOS đã được hủy", response));
    }

    @GetMapping("/emergency/status")
    @PreAuthorize("hasAnyRole('SECURITY', 'STAFF', 'DRIVER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<EmergencyStatusResponse>> getEmergencyStatus() {
        return ResponseEntity.ok(ApiResponse.success(emergencyService.getCurrentStatus()));
    }

    @GetMapping("/emergency/history")
    @PreAuthorize("hasAnyRole('SECURITY', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<EmergencyStatusResponse>>> getEmergencyHistory() {
        return ResponseEntity.ok(ApiResponse.success(emergencyService.getHistory()));
    }

    @GetMapping("/emergency/settings")
    @PreAuthorize("hasAnyRole('SECURITY', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getEmergencySettings() {
        return ResponseEntity.ok(ApiResponse.success(Map.of("sosEnabled", emergencyService.isSosEnabled())));
    }

    @PutMapping("/emergency/settings")
    @PreAuthorize("hasAnyRole('SECURITY', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateEmergencySettings(@RequestBody Map<String, Object> body) {
        boolean sosEnabled = Boolean.parseBoolean(String.valueOf(body.getOrDefault("sosEnabled", true)));
        boolean saved = emergencyService.updateSosEnabled(sosEnabled);
        return ResponseEntity.ok(ApiResponse.success(
                saved ? "Đã bật chức năng SOS" : "Đã tắt chức năng SOS",
                Map.of("sosEnabled", saved)
        ));
    }

    @GetMapping("/blacklist")
    @PreAuthorize("hasAnyRole('SECURITY', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<BlacklistPlateResponse>>> getBlacklist() {
        return ResponseEntity.ok(ApiResponse.success(blacklistService.getAll()));
    }

    @PostMapping("/blacklist")
    @PreAuthorize("hasAnyRole('SECURITY', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<BlacklistPlateResponse>> addBlacklistPlate(
            @Valid @RequestBody BlacklistPlateRequest request) {
        BlacklistPlateResponse response = blacklistService.add(request);
        return ResponseEntity.ok(ApiResponse.success("Đã thêm biển số vào blacklist", response));
    }

    @DeleteMapping("/blacklist/{id}")
    @PreAuthorize("hasAnyRole('SECURITY', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<BlacklistPlateResponse>> removeBlacklistPlate(
            @PathVariable UUID id,
            @Valid @RequestBody BlacklistRemoveRequest request) {
        BlacklistPlateResponse response = blacklistService.remove(id, request);
        return ResponseEntity.ok(ApiResponse.success("Đã gỡ biển số khỏi blacklist", response));
    }
}
