package com.smartparking.backend.service;

import com.smartparking.backend.dto.request.EmergencyActivateRequest;
import com.smartparking.backend.dto.request.EmergencyDeactivateRequest;
import com.smartparking.backend.dto.response.EmergencyStatusResponse;
import com.smartparking.backend.entity.Building;
import com.smartparking.backend.entity.EmergencyEvent;
import com.smartparking.backend.entity.Gate;
import com.smartparking.backend.entity.User;
import com.smartparking.backend.exception.BusinessException;
import com.smartparking.backend.exception.ResourceNotFoundException;
import com.smartparking.backend.repository.BuildingRepository;
import com.smartparking.backend.repository.EmergencyEventRepository;
import com.smartparking.backend.repository.GateRepository;
import com.smartparking.backend.repository.SystemSettingsRepository;
import com.smartparking.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class EmergencyService {

    private static final Logger log = LoggerFactory.getLogger(EmergencyService.class);
    private static final String EMERGENCY_MESSAGE = "🚨 KHẨN CẤP — TOÀN BỘ BARRIER ĐÃ MỞ — SƠ TÁN NGAY";

    private final EmergencyEventRepository emergencyEventRepository;
    private final BuildingRepository buildingRepository;
    private final UserRepository userRepository;
    private final GateRepository gateRepository;
    private final SystemSettingsRepository systemSettingsRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public EmergencyService(EmergencyEventRepository emergencyEventRepository,
                            BuildingRepository buildingRepository,
                            UserRepository userRepository,
                            GateRepository gateRepository,
                            SystemSettingsRepository systemSettingsRepository,
                            SimpMessagingTemplate messagingTemplate) {
        this.emergencyEventRepository = emergencyEventRepository;
        this.buildingRepository = buildingRepository;
        this.userRepository = userRepository;
        this.gateRepository = gateRepository;
        this.systemSettingsRepository = systemSettingsRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public EmergencyStatusResponse activate(EmergencyActivateRequest request) {
        Boolean sosEnabled = systemSettingsRepository.findAll().stream()
                .findFirst()
                .map(settings -> settings.getSosEnabled())
                .orElse(true);

        if (Boolean.FALSE.equals(sosEnabled)) {
            throw new BusinessException("Chức năng SOS đã bị tắt bởi quản trị viên. Không thể kích hoạt SOS.");
        }

        emergencyEventRepository.findFirstByStatusOrderByActivatedAtDesc(EmergencyEvent.EmergencyStatus.ACTIVE)
                .ifPresent(event -> {
                    throw new BusinessException("SOS đang được kích hoạt. Vui lòng hủy SOS trước khi kích hoạt lại.");
                });

        Building building;
        if (request.getBuildingId() != null) {
            building = buildingRepository.findById(request.getBuildingId())
                    .orElseThrow(() -> new ResourceNotFoundException("Building không tồn tại"));
        } else {
            building = buildingRepository.findAll().stream()
                    .findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("Chưa có building nào trong hệ thống để kích hoạt SOS"));
        }

        User activatedBy = userRepository.findById(request.getActivatedByUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Người kích hoạt không tồn tại"));

        List<Gate> gates = gateRepository.findByBuildingId(building.getId());
        gates.forEach(gate -> gate.setIsActive(true));
        gateRepository.saveAll(gates);

        EmergencyEvent event = EmergencyEvent.builder()
                .building(building)
                .status(EmergencyEvent.EmergencyStatus.ACTIVE)
                .reason(request.getReason() == null || request.getReason().isBlank() ? "EMERGENCY_SOS" : request.getReason())
                .notes(request.getNotes())
                .activatedBy(activatedBy)
                .activatedAt(LocalDateTime.now())
                .build();
        event = emergencyEventRepository.save(event);

        EmergencyStatusResponse response = buildResponse(event, true);
        broadcastEmergency(response, "ACTIVATED");

        log.warn("SOS ACTIVATED: building={}, by={}", building.getName(), activatedBy.getEmail());
        return response;
    }

    @Transactional
    public EmergencyStatusResponse deactivate(EmergencyDeactivateRequest request) {
        EmergencyEvent event = emergencyEventRepository
                .findFirstByStatusOrderByActivatedAtDesc(EmergencyEvent.EmergencyStatus.ACTIVE)
                .orElseThrow(() -> new BusinessException("Hiện không có SOS nào đang kích hoạt"));

        User deactivatedBy = userRepository.findById(request.getDeactivatedByUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Người hủy SOS không tồn tại"));

        event.setStatus(EmergencyEvent.EmergencyStatus.RESOLVED);
        event.setDeactivatedBy(deactivatedBy);
        event.setDeactivatedAt(LocalDateTime.now());
        if (request.getNotes() != null && !request.getNotes().isBlank()) {
            String oldNotes = event.getNotes() == null ? "" : event.getNotes() + "\n";
            event.setNotes(oldNotes + "Deactivation note: " + request.getNotes());
        }
        event = emergencyEventRepository.save(event);

        EmergencyStatusResponse response = buildResponse(event, false);
        broadcastEmergency(response, "DEACTIVATED");

        log.info("SOS DEACTIVATED: building={}, by={}",
                event.getBuilding() != null ? event.getBuilding().getName() : "ALL", deactivatedBy.getEmail());
        return response;
    }

    @Transactional(readOnly = true)
    public EmergencyStatusResponse getCurrentStatus() {
        return emergencyEventRepository
                .findFirstByStatusOrderByActivatedAtDesc(EmergencyEvent.EmergencyStatus.ACTIVE)
                .map(event -> buildResponse(event, true))
                .orElse(EmergencyStatusResponse.builder()
                        .active(false)
                        .message("Hệ thống đang hoạt động bình thường")
                        .build());
    }

    @Transactional(readOnly = true)
    public boolean isSosEnabled() {
        return systemSettingsRepository.findAll().stream()
                .findFirst()
                .map(settings -> settings.getSosEnabled())
                .orElse(true);
    }

    @Transactional
    public boolean updateSosEnabled(boolean enabled) {
        var settings = systemSettingsRepository.findAll().stream()
                .findFirst()
                .orElseGet(() -> systemSettingsRepository.save(com.smartparking.backend.entity.SystemSettings.builder().build()));
        settings.setSosEnabled(enabled);
        return Boolean.TRUE.equals(systemSettingsRepository.save(settings).getSosEnabled());
    }

    @Transactional(readOnly = true)
    public boolean isEmergencyActive() {
        return emergencyEventRepository
                .findFirstByStatusOrderByActivatedAtDesc(EmergencyEvent.EmergencyStatus.ACTIVE)
                .isPresent();
    }

    @Transactional(readOnly = true)
    public void ensureNormalOperation() {
        if (isEmergencyActive()) {
            throw new BusinessException(EMERGENCY_MESSAGE + ". Không thể thao tác bình thường cho đến khi Manager/Admin hủy SOS.");
        }
    }

    @Transactional(readOnly = true)
    public List<EmergencyStatusResponse> getHistory() {
        return emergencyEventRepository.findAllByOrderByActivatedAtDesc()
                .stream()
                .map(event -> buildResponse(event, event.getStatus() == EmergencyEvent.EmergencyStatus.ACTIVE))
                .toList();
    }

    private EmergencyStatusResponse buildResponse(EmergencyEvent event, boolean active) {
        Building building = event.getBuilding();
        User activatedBy = event.getActivatedBy();
        User deactivatedBy = event.getDeactivatedBy();

        return EmergencyStatusResponse.builder()
                .active(active)
                .eventId(event.getId())
                .buildingId(building != null ? building.getId() : null)
                .buildingName(building != null ? building.getName() : null)
                .reason(event.getReason())
                .activatedBy(activatedBy != null ? activatedBy.getFullName() : null)
                .activatedAt(event.getActivatedAt())
                .deactivatedBy(deactivatedBy != null ? deactivatedBy.getFullName() : null)
                .deactivatedAt(event.getDeactivatedAt())
                .message(active ? EMERGENCY_MESSAGE : "SOS đã được hủy. Hệ thống trở lại bình thường.")
                .build();
    }

    private void broadcastEmergency(EmergencyStatusResponse response, String action) {
        try {
            Map<String, Object> message = new java.util.HashMap<>();
            message.put("type", "EMERGENCY_SOS");
            message.put("action", action);
            message.put("active", response.isActive());
            message.put("eventId", response.getEventId() != null ? response.getEventId().toString() : "");
            message.put("buildingId", response.getBuildingId() != null ? response.getBuildingId().toString() : "");
            message.put("buildingName", response.getBuildingName() != null ? response.getBuildingName() : "");
            message.put("reason", response.getReason() != null ? response.getReason() : "");
            message.put("message", response.getMessage());
            message.put("timestamp", LocalDateTime.now().toString());
            messagingTemplate.convertAndSend("/topic/emergency", message);
            if (response.getBuildingId() != null) {
                messagingTemplate.convertAndSend("/topic/emergency/" + response.getBuildingId(), message);
            }
        } catch (Exception e) {
            log.warn("Failed to broadcast emergency event: {}", e.getMessage());
        }
    }
}
