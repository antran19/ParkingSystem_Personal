package com.smartparking.backend.controller;

import com.smartparking.backend.dto.request.ReservationRequest;
import com.smartparking.backend.dto.response.ApiResponse;
import com.smartparking.backend.dto.response.ReservationResponse;
import com.smartparking.backend.service.ReservationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/driver/reservations")
@PreAuthorize("hasAnyRole('DRIVER', 'MANAGER', 'ADMIN')")
public class ReservationController {
    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ReservationResponse>> createReservation(
            Authentication authentication,
            @Valid @RequestBody ReservationRequest request) {
        ReservationResponse response = reservationService.createReservation(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Đặt giữ chỗ thành công", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ReservationResponse>>> getMyReservations(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(reservationService.getMyReservations(authentication.getName())));
    }

    @DeleteMapping("/{reservationId}")
    public ResponseEntity<ApiResponse<ReservationResponse>> cancelReservation(
            Authentication authentication,
            @PathVariable UUID reservationId) {
        ReservationResponse response = reservationService.cancelReservation(authentication.getName(), reservationId);
        return ResponseEntity.ok(ApiResponse.success("Đã hủy giữ chỗ", response));
    }
}
