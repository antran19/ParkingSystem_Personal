package com.smartparking.backend.service;

import com.smartparking.backend.dto.request.ReservationRequest;
import com.smartparking.backend.dto.response.ReservationResponse;
import com.smartparking.backend.entity.Reservation;
import com.smartparking.backend.entity.Reservation.ReservationStatus;
import com.smartparking.backend.entity.User;
import com.smartparking.backend.entity.VehicleType;
import com.smartparking.backend.entity.Zone;
import com.smartparking.backend.exception.BusinessException;
import com.smartparking.backend.exception.ResourceNotFoundException;
import com.smartparking.backend.repository.ReservationRepository;
import com.smartparking.backend.repository.UserRepository;
import com.smartparking.backend.repository.VehicleTypeRepository;
import com.smartparking.backend.repository.ZoneRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
public class ReservationService {
    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;
    private final ZoneRepository zoneRepository;
    private final VehicleTypeRepository vehicleTypeRepository;

    public ReservationService(ReservationRepository reservationRepository,
                              UserRepository userRepository,
                              ZoneRepository zoneRepository,
                              VehicleTypeRepository vehicleTypeRepository) {
        this.reservationRepository = reservationRepository;
        this.userRepository = userRepository;
        this.zoneRepository = zoneRepository;
        this.vehicleTypeRepository = vehicleTypeRepository;
    }

    @Transactional
    public ReservationResponse createReservation(String email, ReservationRequest request) {
        User user = getUser(email);
        Zone zone = zoneRepository.findById(request.getZoneId())
                .orElseThrow(() -> new ResourceNotFoundException("Zone không tồn tại"));
        VehicleType vehicleType = vehicleTypeRepository.findById(request.getVehicleTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Loại phương tiện không tồn tại"));

        String plate = normalizeAndValidatePlate(request.getLicensePlate());
        if (reservationRepository.existsByUserAndLicensePlateAndStatusIn(
                user, plate, List.of(ReservationStatus.PENDING, ReservationStatus.CONFIRMED))) {
            throw new BusinessException("Biển số này đang có reservation chưa hoàn tất");
        }
        if (!zone.getVehicleType().getId().equals(vehicleType.getId())) {
            throw new BusinessException("Loại phương tiện không phù hợp với zone đã chọn");
        }
        int occupied = zone.getCurrentCount() + zone.getReservedCount();
        if (zone.getStatus() != Zone.ZoneStatus.ACTIVE || occupied >= zone.getCapacity()) {
            throw new BusinessException("Zone đã đầy hoặc không hoạt động");
        }

        LocalDateTime from = request.getReservedFrom() != null ? request.getReservedFrom() : LocalDateTime.now();
        LocalDateTime to = request.getReservedTo() != null ? request.getReservedTo() : from.plusMinutes(30);
        if (!to.isAfter(from)) {
            throw new BusinessException("Thời gian kết thúc giữ chỗ phải sau thời gian bắt đầu");
        }

        zone.setReservedCount(zone.getReservedCount() + 1);
        if (zone.getCurrentCount() + zone.getReservedCount() >= zone.getCapacity()) {
            zone.setStatus(Zone.ZoneStatus.FULL);
        }
        zoneRepository.save(zone);

        Reservation reservation = Reservation.builder()
                .user(user)
                .zone(zone)
                .reservationCode(generateReservationCode())
                .vehicleType(vehicleType)
                .licensePlate(plate)
                .reservedFrom(from)
                .reservedTo(to)
                .status(ReservationStatus.CONFIRMED)
                .build();
        return toResponse(reservationRepository.save(reservation));
    }

    @Transactional(readOnly = true)
    public List<ReservationResponse> getMyReservations(String email) {
        User user = getUser(email);
        return reservationRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ReservationResponse cancelReservation(String email, UUID reservationId) {
        User user = getUser(email);
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation không tồn tại"));
        if (!reservation.getUser().getId().equals(user.getId())) {
            throw new BusinessException("Bạn không có quyền hủy reservation này");
        }
        if (reservation.getStatus() == ReservationStatus.CANCELLED || reservation.getStatus() == ReservationStatus.COMPLETED) {
            return toResponse(reservation);
        }

        reservation.setStatus(ReservationStatus.CANCELLED);
        Zone zone = reservation.getZone();
        if (zone.getReservedCount() > 0) {
            zone.setReservedCount(zone.getReservedCount() - 1);
        }
        if (zone.getStatus() == Zone.ZoneStatus.FULL && zone.getCurrentCount() + zone.getReservedCount() < zone.getCapacity()) {
            zone.setStatus(Zone.ZoneStatus.ACTIVE);
        }
        zoneRepository.save(zone);
        return toResponse(reservationRepository.save(reservation));
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
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

    private String generateReservationCode() {
        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String random = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        return "RS" + date + "-" + random;
    }

    private ReservationResponse toResponse(Reservation reservation) {
        Zone zone = reservation.getZone();
        VehicleType vehicleType = reservation.getVehicleType();
        return ReservationResponse.builder()
                .reservationId(reservation.getId())
                .reservationCode(reservation.getReservationCode())
                .zoneId(zone.getId())
                .zoneCode(zone.getZoneCode())
                .zoneName(zone.getZoneName())
                .floorName(zone.getFloor().getFloorName())
                .vehicleTypeId(vehicleType.getId())
                .vehicleTypeName(vehicleType.getName())
                .licensePlate(reservation.getLicensePlate())
                .reservedFrom(reservation.getReservedFrom())
                .reservedTo(reservation.getReservedTo())
                .status(reservation.getStatus())
                .createdAt(reservation.getCreatedAt())
                .build();
    }
}
