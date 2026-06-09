package com.smartparking.backend.service;

import com.smartparking.backend.entity.Reservation;
import com.smartparking.backend.entity.Reservation.ReservationStatus;
import com.smartparking.backend.entity.Zone;
import com.smartparking.backend.repository.ReservationRepository;
import com.smartparking.backend.repository.ZoneRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * ReservationExpiryScheduler — Tự động hủy các reservation đã hết hạn.
 *
 * Chạy mỗi 30 giây, kiểm tra tất cả reservation có trạng thái PENDING/CONFIRMED
 * mà thời gian reservedTo đã qua → chuyển sang EXPIRED, giảm reservedCount của zone.
 */
@Component
public class ReservationExpiryScheduler {

    private static final Logger log = LoggerFactory.getLogger(ReservationExpiryScheduler.class);

    private final ReservationRepository reservationRepository;
    private final ZoneRepository zoneRepository;

    public ReservationExpiryScheduler(ReservationRepository reservationRepository,
                                       ZoneRepository zoneRepository) {
        this.reservationRepository = reservationRepository;
        this.zoneRepository = zoneRepository;
    }

    @Scheduled(fixedRate = 30000) // chạy mỗi 30 giây
    @Transactional
    public void expireOverdueReservations() {
        LocalDateTime now = LocalDateTime.now();

        List<Reservation> activeReservations = reservationRepository.findAll().stream()
                .filter(r -> r.getStatus() == ReservationStatus.PENDING
                        || r.getStatus() == ReservationStatus.CONFIRMED)
                .filter(r -> r.getReservedTo() != null && r.getReservedTo().isBefore(now))
                .toList();

        if (activeReservations.isEmpty()) {
            return;
        }

        for (Reservation reservation : activeReservations) {
            reservation.setStatus(ReservationStatus.EXPIRED);

            // Giải phóng slot giữ chỗ trong zone
            Zone zone = reservation.getZone();
            if (zone != null && zone.getReservedCount() > 0) {
                zone.setReservedCount(zone.getReservedCount() - 1);

                // Nếu zone đang FULL mà giờ có chỗ → chuyển lại ACTIVE
                if (zone.getStatus() == Zone.ZoneStatus.FULL
                        && zone.getCurrentCount() + zone.getReservedCount() < zone.getCapacity()) {
                    zone.setStatus(Zone.ZoneStatus.ACTIVE);
                }
                zoneRepository.save(zone);
            }

            reservationRepository.save(reservation);
            log.info("AUTO-EXPIRED reservation: code={}, plate={}, zone={}",
                    reservation.getReservationCode(),
                    reservation.getLicensePlate(),
                    zone != null ? zone.getZoneCode() : "N/A");
        }

        log.info("⏰ Expired {} overdue reservation(s)", activeReservations.size());
    }
}
