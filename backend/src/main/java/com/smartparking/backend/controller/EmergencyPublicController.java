package com.smartparking.backend.controller;

import com.smartparking.backend.dto.response.ApiResponse;
import com.smartparking.backend.dto.response.EmergencyStatusResponse;
import com.smartparking.backend.service.EmergencyService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/emergency")
public class EmergencyPublicController {

    private final EmergencyService emergencyService;

    public EmergencyPublicController(EmergencyService emergencyService) {
        this.emergencyService = emergencyService;
    }

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<EmergencyStatusResponse>> getStatus() {
        return ResponseEntity.ok(ApiResponse.success(emergencyService.getCurrentStatus()));
    }
}
