package com.smartparking.backend.service;

import com.smartparking.backend.dto.request.BlacklistPlateRequest;
import com.smartparking.backend.dto.request.BlacklistRemoveRequest;
import com.smartparking.backend.dto.response.BlacklistAlertResponse;
import com.smartparking.backend.dto.response.BlacklistPlateResponse;
import com.smartparking.backend.entity.BlacklistPlate;
import com.smartparking.backend.entity.Gate;
import com.smartparking.backend.entity.User;
import com.smartparking.backend.exception.BusinessException;
import com.smartparking.backend.exception.ResourceNotFoundException;
import com.smartparking.backend.repository.BlacklistPlateRepository;
import com.smartparking.backend.repository.GateRepository;
import com.smartparking.backend.repository.UserRepository;
import com.smartparking.backend.util.LicensePlateUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class BlacklistService {

    private static final Logger log = LoggerFactory.getLogger(BlacklistService.class);

    private final BlacklistPlateRepository blacklistPlateRepository;
    private final UserRepository userRepository;
    private final GateRepository gateRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public BlacklistService(BlacklistPlateRepository blacklistPlateRepository,
                            UserRepository userRepository,
                            GateRepository gateRepository,
                            SimpMessagingTemplate messagingTemplate) {
        this.blacklistPlateRepository = blacklistPlateRepository;
        this.userRepository = userRepository;
        this.gateRepository = gateRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public BlacklistPlateResponse add(BlacklistPlateRequest request) {
        String normalizedPlate = LicensePlateUtil.normalize(request.getLicensePlate());
        if (normalizedPlate.isBlank()) {
            throw new BusinessException("Biển số không hợp lệ");
        }
        if (blacklistPlateRepository.existsByNormalizedPlateAndIsActiveTrue(normalizedPlate)) {
            throw new BusinessException("Biển số này đã nằm trong blacklist");
        }

        User addedBy = userRepository.findById(request.getAddedByUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Người thêm blacklist không tồn tại"));

        BlacklistPlate blacklistPlate = BlacklistPlate.builder()
                .licensePlate(request.getLicensePlate())
                .normalizedPlate(normalizedPlate)
                .reason(request.getReason())
                .description(request.getDescription())
                .isActive(true)
                .addedBy(addedBy)
                .build();

        return toResponse(blacklistPlateRepository.save(blacklistPlate));
    }

    @Transactional(readOnly = true)
    public List<BlacklistPlateResponse> getAll() {
        return blacklistPlateRepository.findAllByOrderByAddedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public BlacklistPlateResponse remove(UUID id, BlacklistRemoveRequest request) {
        BlacklistPlate blacklistPlate = blacklistPlateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Blacklist plate không tồn tại"));
        User removedBy = userRepository.findById(request.getRemovedByUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Người gỡ blacklist không tồn tại"));

        blacklistPlate.setIsActive(false);
        blacklistPlate.setRemovedBy(removedBy);
        blacklistPlate.setRemovedAt(LocalDateTime.now());

        return toResponse(blacklistPlateRepository.save(blacklistPlate));
    }

    @Transactional(readOnly = true)
    public Optional<BlacklistPlate> findActiveByPlate(String licensePlate) {
        return blacklistPlateRepository.findByNormalizedPlateAndIsActiveTrue(LicensePlateUtil.normalize(licensePlate));
    }

    public void alertBlacklistAttempt(String licensePlate, BlacklistPlate blacklistPlate, Gate gate) {
        BlacklistAlertResponse alert = BlacklistAlertResponse.builder()
                .type("BLACKLIST_PLATE_DETECTED")
                .licensePlate(licensePlate)
                .normalizedPlate(LicensePlateUtil.normalize(licensePlate))
                .reason(blacklistPlate.getReason())
                .description(blacklistPlate.getDescription())
                .gateId(gate != null ? gate.getId() : null)
                .gateCode(gate != null ? gate.getGateCode() : null)
                .gateName(gate != null ? gate.getGateName() : null)
                .buildingId(gate != null && gate.getBuilding() != null ? gate.getBuilding().getId() : null)
                .buildingName(gate != null && gate.getBuilding() != null ? gate.getBuilding().getName() : null)
                .detectedAt(LocalDateTime.now())
                .message("🚫 Xe trong blacklist cố gắng check-in: " + licensePlate)
                .build();
        broadcastBlacklistAlert(alert);
    }

    @Transactional(readOnly = true)
    public void alertBlacklistAttempt(String licensePlate, UUID gateId) {
        Optional<BlacklistPlate> blacklistPlate = findActiveByPlate(licensePlate);
        if (blacklistPlate.isEmpty()) {
            return;
        }
        Gate gate = gateId == null ? null : gateRepository.findById(gateId).orElse(null);
        alertBlacklistAttempt(licensePlate, blacklistPlate.get(), gate);
    }

    private BlacklistPlateResponse toResponse(BlacklistPlate blacklistPlate) {
        User addedBy = blacklistPlate.getAddedBy();
        User removedBy = blacklistPlate.getRemovedBy();
        return BlacklistPlateResponse.builder()
                .id(blacklistPlate.getId())
                .licensePlate(blacklistPlate.getLicensePlate())
                .normalizedPlate(blacklistPlate.getNormalizedPlate())
                .reason(blacklistPlate.getReason())
                .description(blacklistPlate.getDescription())
                .isActive(blacklistPlate.getIsActive())
                .addedBy(addedBy != null ? addedBy.getFullName() : null)
                .addedAt(blacklistPlate.getAddedAt())
                .removedBy(removedBy != null ? removedBy.getFullName() : null)
                .removedAt(blacklistPlate.getRemovedAt())
                .build();
    }

    private void broadcastBlacklistAlert(BlacklistAlertResponse alert) {
        try {
            java.util.Map<String, Object> message = new java.util.HashMap<>();
            message.put("type", alert.getType());
            message.put("licensePlate", alert.getLicensePlate());
            message.put("normalizedPlate", alert.getNormalizedPlate());
            message.put("reason", alert.getReason().name());
            message.put("description", alert.getDescription() != null ? alert.getDescription() : "");
            message.put("gateId", alert.getGateId() != null ? alert.getGateId().toString() : "");
            message.put("gateCode", alert.getGateCode() != null ? alert.getGateCode() : "");
            message.put("gateName", alert.getGateName() != null ? alert.getGateName() : "");
            message.put("buildingId", alert.getBuildingId() != null ? alert.getBuildingId().toString() : "");
            message.put("buildingName", alert.getBuildingName() != null ? alert.getBuildingName() : "");
            message.put("message", alert.getMessage());
            message.put("detectedAt", alert.getDetectedAt().toString());
            messagingTemplate.convertAndSend("/topic/security/blacklist-alerts", message);
            if (alert.getBuildingId() != null) {
                messagingTemplate.convertAndSend("/topic/security/blacklist-alerts/" + alert.getBuildingId(), message);
            }
        } catch (Exception e) {
            log.warn("Failed to broadcast blacklist alert: {}", e.getMessage());
        }
    }
}
