import axiosClient from "./axiosClient";

/**
 * parkingApi (Trước đây là staffApi) - Cung cấp tất cả các API kết nối tới Java Spring Boot backend.
 * Được tổ chức khoa học theo đúng chuẩn phân quyền RESTful namespace của hệ thống Enterprise:
 *   - /parking/**: Cấu hình dùng chung
 *   - /driver/**: API dành cho Tài xế (hoặc Staff tra cứu thông tin Driver)
 *   - /staff/**: API tác nghiệp dành riêng cho Nhân viên bãi xe
 */
export const staffApi = {
  // === Cấu hình bãi xe (vehicle types, gates, zones) ===
  getParkingConfig() {
    return axiosClient.get("/parking/config");
  },

  // === Tác vụ của Nhân viên (Staff) ===
  // Check-in xe vào bãi (UC-04)
  checkIn(data) {
    return axiosClient.post("/staff/sessions/checkin", data);
  },

  // Check-out xe ra bãi (UC-05)
  checkOut(data) {
    return axiosClient.post("/staff/sessions/checkout", data);
  },

  // === Tác vụ của Tài xế (Driver) / Tra cứu session ===
  // Tra cứu session đang hoạt động
  getActiveSession(licensePlate) {
    return axiosClient.get(`/driver/sessions/active?plate=${encodeURIComponent(licensePlate)}`);
  },

  // Xác nhận thanh toán chuyển khoản (Real-time)
  confirmPayment(data) {
    return axiosClient.post("/driver/payments/confirm", data);
  },

  // Khởi tạo thanh toán VNPay sandbox cho driver check-out
  initiateVnPayCheckout(data) {
    return axiosClient.post("/driver/sessions/checkout/vnpay", data);
  },

  // Lịch sử gửi xe theo biển số
  getSessionHistory(licensePlate) {
    return axiosClient.get(`/driver/sessions/history?plate=${encodeURIComponent(licensePlate)}`);
  },

  // === Quản lý biển số xe cá nhân của Tài xế (Driver) — Lưu DB ===
  getDriverPlates() {
    return axiosClient.get("/driver/plates");
  },

  addDriverPlate(licensePlate) {
    return axiosClient.post("/driver/plates", { licensePlate });
  },

  deleteDriverPlate(licensePlate) {
    return axiosClient.delete(`/driver/plates?plate=${encodeURIComponent(licensePlate)}`);
  },

  createReservation(data) {
    return axiosClient.post("/driver/reservations", data);
  },

  getDriverReservations() {
    return axiosClient.get("/driver/reservations");
  },

  cancelReservation(reservationId) {
    return axiosClient.delete(`/driver/reservations/${reservationId}`);
  },

  // === Vé gửi xe theo gói (Parking Pass) cho Driver ===
  getDriverPasses() {
    return axiosClient.get("/driver/parking-passes");
  },

  getDriverPricingPlans() {
    return axiosClient.get("/driver/pricing-plans");
  },

  registerDriverPass(data) {
    return axiosClient.post("/driver/parking-passes", data);
  },

  continueDriverPassPayment(passId) {
    return axiosClient.post(`/driver/parking-passes/${passId}/pay`);
  },

  getVnPayPassReturn(queryString) {
    return axiosClient.get(`/driver/payments/vnpay-return${queryString}`);
  },

  getAdminUsers() {
    return axiosClient.get("/admin/users");
  },

  createAdminUser(data) {
    return axiosClient.post("/admin/users", data);
  },

  updateAdminUser(id, data) {
    return axiosClient.put(`/admin/users/${id}`, data);
  },

  deleteAdminUser(id) {
    return axiosClient.delete(`/admin/users/${id}`);
  },

  createZone(data) {
    return axiosClient.post("/admin/zones", data);
  },

  updateZone(id, data) {
    return axiosClient.put(`/admin/zones/${id}`, data);
  },

  deleteZone(id) {
    return axiosClient.delete(`/admin/zones/${id}`);
  },

  createGate(data) {
    return axiosClient.post("/admin/gates", data);
  },

  updateGate(id, data) {
    return axiosClient.put(`/admin/gates/${id}`, data);
  },

  deleteGate(id) {
    return axiosClient.delete(`/admin/gates/${id}`);
  },

  createPricingRule(data) {
    return axiosClient.post("/admin/pricing-rules", data);
  },

  updatePricingRule(id, data) {
    return axiosClient.put(`/admin/pricing-rules/${id}`, data);
  },

  deletePricingRule(id) {
    return axiosClient.delete(`/admin/pricing-rules/${id}`);
  },

  getParkingPasses() {
    return axiosClient.get("/admin/parking-passes");
  },

  createParkingPass(data) {
    return axiosClient.post("/admin/parking-passes", data);
  },

  updateParkingPass(id, data) {
    return axiosClient.put(`/admin/parking-passes/${id}`, data);
  },

  deleteParkingPass(id) {
    return axiosClient.delete(`/admin/parking-passes/${id}`);
  },

  renewParkingPass(id) {
    return axiosClient.post(`/admin/parking-passes/${id}/renew`);
  },

  controlBarrier(gateId, state) {
    return axiosClient.put(`/admin/gates/${gateId}/barrier`, { state });
  },

  getAdminSettings() {
    return axiosClient.get("/admin/settings");
  },

  updateAdminSettings(data) {
    return axiosClient.put("/admin/settings", data);
  },

  // === Quản lý toàn bộ phiên gửi xe dành cho Staff/Manager — Lưu DB ===
  getAllSessionsHistory() {
    return axiosClient.get("/staff/sessions/history");
  },

  // === Quản lý Exception Logs dành cho Security & Admin — Lưu DB thật ===
  logSecurityException(data) {
    return axiosClient.post("/security/exceptions", data);
  },

  getSecurityExceptions() {
    return axiosClient.get("/security/exceptions");
  },

  // === Emergency SOS Mode — Security/Manager/Admin ===
  activateEmergency(data) {
    return axiosClient.post("/security/emergency/activate", data);
  },

  deactivateEmergency(data) {
    return axiosClient.post("/security/emergency/deactivate", data);
  },

  getEmergencyStatus() {
    return axiosClient.get("/emergency/status");
  },

  getEmergencyHistory() {
    return axiosClient.get("/security/emergency/history");
  },

  getEmergencySettings() {
    return axiosClient.get("/security/emergency/settings");
  },

  updateEmergencySettings(data) {
    return axiosClient.put("/security/emergency/settings", data);
  },

  // === Blacklist Plates — Security/Manager/Admin ===
  getBlacklist() {
    return axiosClient.get("/security/blacklist");
  },

  addBlacklistPlate(data) {
    return axiosClient.post("/security/blacklist", data);
  },

  removeBlacklistPlate(id, data) {
    return axiosClient.delete(`/security/blacklist/${id}`, { data });
  },
};