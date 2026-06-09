import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import gsap from "gsap";
import { staffApi } from "../../api/parkingApi";

const REASON_LABELS = {
  STOLEN: "Xe trộm cắp",
  DISTURBANCE: "Gây rối / nguy cơ an ninh",
  UNPAID_FEE: "Nợ phí / chưa thanh toán",
  SECURITY_RISK: "Rủi ro an ninh",
  OTHER: "Khác",
};

const EXCEPTION_LABELS = {
  LOST_TICKET: "Mất thẻ / mất QR",
  WRONG_PLATE: "Sai biển số",
  OVERTIME: "Quá giờ",
  WRONG_ZONE: "Sai khu vực",
  UNPAID: "Chưa thanh toán",
};

const normalizeRole = (role) => String(role || "").toUpperCase();

const formatTime = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("vi-VN");
};

const IconOverview = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const IconBlacklist = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
  </svg>
);

const IconLogs = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

const Icon3D = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 16V8a2 2 0 00-1-1.732l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.732l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.3 7L12 12l8.7-5M12 22V12" />
  </svg>
);

const IconLogout = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const LicensePlate = ({ plate }) => (
  <span className="inline-flex items-center rounded-md border border-slate-300 bg-white px-2.5 py-1 font-mono text-xs font-black tracking-widest text-slate-900 shadow-sm">
    <span className="mr-1.5 h-2 w-2 rounded-full bg-blue-600" />
    {plate || "—"}
  </span>
);

export default function SecurityDashboard({ onLogout }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = normalizeRole(user.role);
  const canManageSos = userRole === "ADMIN" || userRole === "MANAGER" || userRole === "SECURITY";
  const fullName = user.fullName || "Bảo vệ";

  const containerRef = useRef(null);
  const holdTimerRef = useRef(null);
  const holdIntervalRef = useRef(null);
  const stompClientRef = useRef(null);

  const [collapsed, setCollapsed] = useState(false);
  const [liveTime, setLiveTime] = useState("");
  const [liveDate, setLiveDate] = useState("");
  const [toast, setToast] = useState(null);
  const [apiErrors, setApiErrors] = useState([]);
  const [loading, setLoading] = useState(true);

  const [buildings, setBuildings] = useState([]);
  const [gates, setGates] = useState([]);
  const [zones, setZones] = useState([]);
  const [blacklist, setBlacklist] = useState([]);
  const [securityLogs, setSecurityLogs] = useState([]);
  const [emergencyHistory, setEmergencyHistory] = useState([]);

  const [emergencyStatus, setEmergencyStatus] = useState({ active: false, message: "Hệ thống đang hoạt động bình thường" });
  const [sosEnabled, setSosEnabled] = useState(true);
  const [sosSettingLoaded, setSosSettingLoaded] = useState(false);
  const [updatingSosSetting, setUpdatingSosSetting] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHoldingSos, setIsHoldingSos] = useState(false);
  const [sosReason, setSosReason] = useState("FIRE_OR_FLOOD");

  const [activeTab, setActiveTab] = useState("overview");
  const [blacklistForm, setBlacklistForm] = useState({ licensePlate: "", reason: "STOLEN", description: "" });
  const [submittingBlacklist, setSubmittingBlacklist] = useState(false);
  const [blacklistAlert, setBlacklistAlert] = useState(null);

  const buildingId = useMemo(() => buildings[0]?.id || gates[0]?.buildingId || zones[0]?.buildingId || null, [buildings, gates, zones]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3500);
  };

  const playAlarm = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const gain = ctx.createGain();
      gain.gain.value = 0.08;
      gain.connect(ctx.destination);

      [0, 220, 440].forEach((delay) => {
        const oscillator = ctx.createOscillator();
        oscillator.type = "square";
        oscillator.frequency.value = 880;
        oscillator.connect(gain);
        oscillator.start(ctx.currentTime + delay / 1000);
        oscillator.stop(ctx.currentTime + delay / 1000 + 0.16);
      });

      window.setTimeout(() => ctx.close().catch(() => {}), 1200);
    } catch (err) {
      console.warn("Cannot play browser alarm:", err);
    }
  };

  const fetchSecurityData = async () => {
    setApiErrors([]);
    const apiCalls = [
      {
        key: "parkingConfig",
        label: "Cấu hình bãi xe",
        required: true,
        call: staffApi.getParkingConfig,
        onSuccess: (res) => {
          const config = res.data.data || {};
          setBuildings(config.buildings || []);
          setGates(config.gates || []);
          setZones(config.zones || []);
        },
        errorMessage: "Không tải được cấu hình bãi xe. Danh sách cổng/zone có thể không đầy đủ.",
      },
      {
        key: "blacklist",
        label: "Danh sách đen",
        required: false,
        call: staffApi.getBlacklist,
        onSuccess: (res) => setBlacklist(res.data.data || []),
        errorMessage: "Không tải được danh sách blacklist. Chức năng thêm/gỡ blacklist có thể cần thử lại.",
      },
      {
        key: "securityLogs",
        label: "Log sự cố an ninh",
        required: false,
        call: staffApi.getSecurityExceptions,
        onSuccess: (res) => setSecurityLogs(res.data.data || []),
        errorMessage: "Không tải được log sự cố an ninh.",
      },
      {
        key: "emergencyStatus",
        label: "Trạng thái SOS realtime",
        required: true,
        call: staffApi.getEmergencyStatus,
        onSuccess: (res) => setEmergencyStatus(res.data.data || { active: false }),
        errorMessage: "Không tải được trạng thái SOS realtime. Vui lòng kiểm tra backend hoặc đăng nhập lại.",
      },
      {
        key: "emergencyHistory",
        label: "Lịch sử SOS",
        required: false,
        call: staffApi.getEmergencyHistory,
        onSuccess: (res) => setEmergencyHistory(res.data.data || []),
        errorMessage: "Không tải được lịch sử SOS.",
      },
      {
        key: "emergencySettings",
        label: "Cấu hình bật/tắt SOS",
        required: true,
        call: staffApi.getEmergencySettings,
        onSuccess: (res) => {
          setSosEnabled(res.data.data?.sosEnabled !== false);
          setSosSettingLoaded(true);
        },
        onFailure: () => setSosSettingLoaded(false),
        errorMessage: "Không tải được cấu hình bật/tắt SOS. Nút kích hoạt và khóa/mở khóa SOS tạm thời bị vô hiệu hóa.",
      },
    ];

    const results = await Promise.allSettled(apiCalls.map((api) => api.call()));
    const errors = [];

    results.forEach((result, index) => {
      const api = apiCalls[index];
      if (result.status === "fulfilled") {
        api.onSuccess(result.value);
        return;
      }

      api.onFailure?.(result.reason);
      errors.push({ key: api.key, label: api.label, required: api.required, message: api.errorMessage });
      console.warn(`Security Dashboard API failed: ${api.key}`, result.reason);
    });

    setApiErrors(errors);
    setLoading(false);
  };

  // GSAP Animation — single useEffect with [activeTab] (matching Driver Dashboard pattern)
  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Sidebar slide-in
      gsap.fromTo(".aside-panel",
        { x: -120, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.9, ease: "power4.out" }
      );

      // 2. Main content area fade-in
      gsap.fromTo(".main-content-area",
        { opacity: 0 },
        { opacity: 1, duration: 0.6 }
      );

      // 3. Stagger animate the navigation links
      gsap.fromTo(".nav-link-item",
        { x: -40, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: "power2.out", delay: 0.25 }
      );

      // 4. Welcome banner scale up with a beautiful bounce
      gsap.fromTo(".welcome-banner",
        { scale: 0.96, opacity: 0, y: 15 },
        { scale: 1, opacity: 1, y: 0, duration: 0.8, ease: "back.out(1.15)", delay: 0.3 }
      );

      // 5. Stats cards stagger bounce
      gsap.fromTo(".stat-card-item",
        { y: 35, opacity: 0, scale: 0.98 },
        { y: 0, opacity: 1, scale: 1, duration: 0.65, stagger: 0.07, ease: "power3.out", delay: 0.45 }
      );

      // 6. Action panels slide up
      gsap.fromTo(".action-panel-item",
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.75, stagger: 0.1, ease: "power3.out", delay: 0.65 }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [activeTab]);

  useEffect(() => {
    fetchSecurityData();
    const timer = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }, 1000);
    setLiveDate(new Date().toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" }));
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
        if (str.includes("ERROR")) console.error("[SECURITY-STOMP]", str);
      },
    });

    client.onConnect = () => {
      client.subscribe("/topic/emergency", (message) => {
        try {
          const data = JSON.parse(message.body);
          const active = Boolean(data.active);
          setEmergencyStatus({
            active,
            eventId: data.eventId,
            buildingId: data.buildingId,
            buildingName: data.buildingName,
            reason: data.reason,
            message: data.message,
          });
          showToast(active ? "SOS đã được kích hoạt toàn hệ thống" : "SOS đã được hủy", active ? "danger" : "success");
          if (active) playAlarm();
          fetchSecurityData();
        } catch (err) {
          console.error("Emergency WS parse error:", err);
        }
      });

      client.subscribe("/topic/security/blacklist-alerts", (message) => {
        try {
          const data = JSON.parse(message.body);
          setBlacklistAlert(data);
          playAlarm();
          showToast(`Phát hiện xe blacklist: ${data.licensePlate}`, "danger");
        } catch (err) {
          console.error("Blacklist WS parse error:", err);
        }
      });
    };

    client.activate();
    stompClientRef.current = client;
    return () => {
      if (client.active) client.deactivate();
    };
  }, []);

  const startSosHold = () => {
    if (!user.id) {
      showToast("Thiếu user.id thật trong localStorage, vui lòng login lại.", "error");
      return;
    }
    if (emergencyStatus.active) return;
    if (!sosSettingLoaded) {
      showToast("Chưa tải được cấu hình bật/tắt SOS. Vui lòng kiểm tra backend hoặc thử tải lại.", "error");
      return;
    }
    if (!sosEnabled) {
      showToast("Chức năng SOS đang bị khóa bởi Security.", "error");
      return;
    }

    setIsHoldingSos(true);
    setHoldProgress(0);
    const startedAt = Date.now();
    holdIntervalRef.current = window.setInterval(() => {
      const progress = Math.min(100, ((Date.now() - startedAt) / 3000) * 100);
      setHoldProgress(progress);
    }, 60);

    holdTimerRef.current = window.setTimeout(async () => {
      clearSosHold(false);
      await activateSos();
    }, 3000);
  };

  const clearSosHold = (reset = true) => {
    if (holdTimerRef.current) window.clearTimeout(holdTimerRef.current);
    if (holdIntervalRef.current) window.clearInterval(holdIntervalRef.current);
    holdTimerRef.current = null;
    holdIntervalRef.current = null;
    setIsHoldingSos(false);
    if (reset) setHoldProgress(0);
  };

  const activateSos = async () => {
    if (!sosSettingLoaded) {
      showToast("Chưa tải được cấu hình bật/tắt SOS. Không thể kích hoạt SOS lúc này.", "error");
      return;
    }
    if (!sosEnabled) {
      showToast("Chức năng SOS đang bị khóa bởi Security.", "error");
      return;
    }
    try {
      const res = await staffApi.activateEmergency({
        buildingId,
        activatedByUserId: user.id,
        reason: sosReason,
        notes: `Security Dashboard SOS hold-3s by ${fullName}`,
      });
      setEmergencyStatus(res.data.data);
      showToast("SOS đã kích hoạt — toàn bộ dashboard sẽ nhận cảnh báo", "danger");
      playAlarm();
      fetchSecurityData();
    } catch (err) {
      console.error("Activate SOS failed:", err);
      showToast(err.response?.data?.message || "Kích hoạt SOS thất bại", "error");
    }
  };

  const updateSosEnabled = async (enabled) => {
    if (!sosSettingLoaded) {
      showToast("Chưa tải được cấu hình bật/tắt SOS. Không thể cập nhật lúc này.", "error");
      return;
    }
    setUpdatingSosSetting(true);
    try {
      const res = await staffApi.updateEmergencySettings({ sosEnabled: enabled });
      setSosEnabled(res.data.data?.sosEnabled !== false);
      setSosSettingLoaded(true);
      showToast(enabled ? "Đã mở khóa kích hoạt SOS" : "Đã khóa kích hoạt SOS", enabled ? "success" : "warning");
    } catch (err) {
      console.error("Update SOS setting failed:", err);
      showToast(err.response?.data?.message || "Cập nhật trạng thái SOS thất bại", "error");
    } finally {
      setUpdatingSosSetting(false);
    }
  };

  const deactivateSos = async () => {
    if (!canManageSos) {
      showToast("Chỉ Security/Manager/Admin được quyền hủy SOS.", "error");
      return;
    }
    if (!user.id) {
      showToast("Thiếu user.id thật trong localStorage, vui lòng login lại.", "error");
      return;
    }
    try {
      const res = await staffApi.deactivateEmergency({
        deactivatedByUserId: user.id,
        notes: `SOS cancelled from Security Dashboard by ${fullName}`,
      });
      setEmergencyStatus(res.data.data);
      showToast("SOS đã được hủy", "success");
      fetchSecurityData();
    } catch (err) {
      console.error("Deactivate SOS failed:", err);
      showToast(err.response?.data?.message || "Hủy SOS thất bại", "error");
    }
  };

  const addBlacklist = async (e) => {
    e.preventDefault();
    if (!blacklistForm.licensePlate.trim()) {
      showToast("Vui lòng nhập biển số", "error");
      return;
    }
    if (!user.id) {
      showToast("Thiếu user.id thật trong localStorage, vui lòng login lại.", "error");
      return;
    }
    setSubmittingBlacklist(true);
    try {
      await staffApi.addBlacklistPlate({
        licensePlate: blacklistForm.licensePlate.trim().toUpperCase(),
        reason: blacklistForm.reason,
        description: blacklistForm.description || REASON_LABELS[blacklistForm.reason],
        addedByUserId: user.id,
      });
      setBlacklistForm({ licensePlate: "", reason: "STOLEN", description: "" });
      showToast("Đã thêm biển số vào blacklist", "success");
      fetchSecurityData();
    } catch (err) {
      console.error("Add blacklist failed:", err);
      showToast(err.response?.data?.message || "Thêm blacklist thất bại", "error");
    } finally {
      setSubmittingBlacklist(false);
    }
  };

  const removeBlacklist = async (id) => {
    if (!user.id) {
      showToast("Thiếu user.id thật trong localStorage, vui lòng login lại.", "error");
      return;
    }
    try {
      await staffApi.removeBlacklistPlate(id, { removedByUserId: user.id });
      showToast("Đã gỡ biển số khỏi blacklist", "success");
      fetchSecurityData();
    } catch (err) {
      console.error("Remove blacklist failed:", err);
      showToast(err.response?.data?.message || "Gỡ blacklist thất bại", "error");
    }
  };

  const activeBlacklistCount = blacklist.filter((p) => p.isActive !== false).length;
  const openGates = gates.filter((g) => g.isActive).length;
  const criticalLogs = securityLogs.filter((log) => String(log.description || "").toLowerCase().includes("khẩn") || String(log.description || "").toLowerCase().includes("emergency")).length;

  return (
    <div ref={containerRef} className={`min-h-screen bg-[#f8fafc] text-slate-900 flex font-sans ${emergencyStatus.active ? "animate-pulse" : ""}`}>
      {toast && (
        <div className={`fixed right-5 top-5 z-[80] rounded-xl px-5 py-3 text-sm font-bold text-white shadow-xl ${toast.type === "danger" || toast.type === "error" ? "bg-red-600" : toast.type === "warning" ? "bg-amber-500" : "bg-emerald-600"}`}>
          {toast.message}
        </div>
      )}

      {emergencyStatus.active && (
        <div className="fixed inset-x-0 top-0 z-[70] border-b-4 border-red-300 bg-red-700 px-6 py-4 text-center text-white shadow-2xl">
          <p className="text-2xl font-black tracking-wide">🚨 {emergencyStatus.message || "KHẨN CẤP — TOÀN BỘ BARRIER ĐÃ MỞ — SƠ TÁN NGAY"}</p>
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.35em] text-red-100">Hệ thống bị khóa thao tác thường cho đến khi Security/Manager/Admin hủy SOS</p>
        </div>
      )}

      {blacklistAlert && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-red-950/90 p-6 backdrop-blur-md">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border-4 border-red-300 bg-red-700 p-8 text-white shadow-[0_0_80px_rgba(239,68,68,0.85)]">
            <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-white/20 blur-3xl" />
            <p className="text-sm font-black uppercase tracking-[0.45em] text-red-100">Blacklist Alert</p>
            <h2 className="mt-3 text-5xl font-black">🚫 XE BLACKLIST</h2>
            <div className="mt-6 grid gap-4 rounded-2xl bg-black/20 p-5 text-left">
              <p><span className="text-red-100">Biển số:</span> <span className="font-mono text-3xl font-black">{blacklistAlert.licensePlate}</span></p>
              <p><span className="text-red-100">Lý do:</span> <span className="font-bold">{REASON_LABELS[blacklistAlert.reason] || blacklistAlert.reason}</span></p>
              <p><span className="text-red-100">Cổng:</span> <span className="font-bold">{blacklistAlert.gateName || blacklistAlert.gateCode || "Không rõ cổng"}</span></p>
              <p><span className="text-red-100">Tòa nhà:</span> <span className="font-bold">{blacklistAlert.buildingName || "—"}</span></p>
              <p><span className="text-red-100">Thời gian:</span> <span className="font-bold">{formatTime(blacklistAlert.detectedAt)}</span></p>
            </div>
            <button onClick={() => setBlacklistAlert(null)} className="mt-6 w-full rounded-2xl bg-white py-4 text-sm font-black uppercase tracking-widest text-red-700 hover:bg-red-50">
              Đã tiếp nhận cảnh báo
            </button>
          </div>
        </div>
      )}

      <aside className={`aside-panel fixed bottom-0 left-0 top-0 z-50 flex h-screen flex-col bg-slate-900 text-white shadow-xl transition-all duration-300 ${collapsed ? "w-20" : "w-72"}`}>
        <div className="flex items-center gap-3.5 px-6 py-6 border-b border-slate-800 overflow-hidden">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-red-500 to-rose-600 text-white shadow-md shadow-red-500/20 font-black text-lg flex-shrink-0"
          >
            S
          </button>
          {!collapsed && (
            <div className="animate-fade-in-fast">
              <h1 className="text-md font-extrabold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent whitespace-nowrap">
                Smart Parking
              </h1>
              <p className="text-xs text-red-400 font-semibold tracking-wider uppercase whitespace-nowrap">
                Cổng an ninh
              </p>
            </div>
          )}
        </div>
        <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-x-hidden">
          <button onClick={() => setActiveTab("overview")} className={`nav-link-item flex items-center gap-3 w-full rounded-xl px-4 py-3 text-left font-semibold transition-all duration-200 ${activeTab === "overview" ? "bg-slate-800 text-red-400 border border-slate-700 shadow-inner" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}><span className="flex-shrink-0"><IconOverview /></span>{!collapsed && <span className="whitespace-nowrap">Tổng quan an ninh</span>}</button>
          <button onClick={() => setActiveTab("blacklist")} className={`nav-link-item flex items-center gap-3 w-full rounded-xl px-4 py-3 text-left font-semibold transition-all duration-200 ${activeTab === "blacklist" ? "bg-slate-800 text-red-400 border border-slate-700 shadow-inner" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}><span className="flex-shrink-0"><IconBlacklist /></span>{!collapsed && <span className="whitespace-nowrap">Danh sách đen</span>}</button>
          <button onClick={() => setActiveTab("logs")} className={`nav-link-item flex items-center gap-3 w-full rounded-xl px-4 py-3 text-left font-semibold transition-all duration-200 ${activeTab === "logs" ? "bg-slate-800 text-red-400 border border-slate-700 shadow-inner" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}><span className="flex-shrink-0"><IconLogs /></span>{!collapsed && <span className="whitespace-nowrap">Sự cố & SOS log</span>}</button>
          <Link to="/security/3d-map" className="nav-link-item flex items-center gap-3 rounded-xl px-4 py-3 font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-200"><span className="flex-shrink-0"><Icon3D /></span>{!collapsed && <span className="whitespace-nowrap">Mô phỏng 3D</span>}</Link>
        </nav>
        <div className="border-t border-slate-800 p-4 overflow-hidden">
          <button onClick={onLogout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 font-semibold text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition-all duration-200"><IconLogout /> {!collapsed && <span className="whitespace-nowrap">Đăng xuất</span>}</button>
        </div>
      </aside>

      <main className={`main-content-area min-h-screen flex-1 flex flex-col transition-all duration-300 ${collapsed ? "ml-20" : "ml-72"} ${emergencyStatus.active ? "pt-24" : ""}`}>
        <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/80 px-8 backdrop-blur-md">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-slate-900">Chốt An Ninh Trung Tâm</h2>
            <p className="text-xs text-slate-500 mt-0.5">{liveDate}</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end border-r border-slate-200 pr-6">
              <span className="font-mono text-lg font-bold text-red-600 bg-red-50/50 px-3 py-1 rounded-lg border border-red-100">{liveTime}</span>
            </div>
            <div className="flex items-center gap-3.5 border-l border-slate-200 pl-6">
              <div className="text-right"><p className="font-semibold text-sm text-slate-900">{fullName}</p><p className="text-xs text-slate-400 font-medium">{userRole === "SECURITY" ? "Nhân viên an ninh" : userRole}</p></div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-red-500 to-rose-600 font-bold text-white shadow-md shadow-red-500/20">{fullName.charAt(0).toUpperCase()}</div>
            </div>
          </div>
        </header>

        <section className="space-y-8 p-8 flex-1">
          {apiErrors.length > 0 && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p className="font-black">⚠️ Một số dữ liệu Security Dashboard chưa tải được:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 font-semibold">
                {apiErrors.map((error) => (
                  <li key={error.key}>
                    <span className={error.required ? "font-black" : "font-semibold"}>{error.label}:</span> {error.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="welcome-banner relative overflow-hidden rounded-3xl bg-slate-950 p-8 shadow-xl">
            <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-gradient-to-l from-red-600/20 to-transparent pointer-events-none" />
            <div className="relative z-10 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.45em] text-red-400">Emergency Control</p>
                <h1 className="mt-3 text-4xl font-black text-white">SOS KHẨN CẤP</h1>
                <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-slate-300">
                  {!sosSettingLoaded
                    ? "Chưa tải được cấu hình bật/tắt SOS từ backend. Vui lòng kiểm tra kết nối hoặc đăng nhập lại trước khi thao tác SOS."
                    : sosEnabled
                      ? "Nhấn giữ nút SOS đủ 3 giây để kích hoạt chế độ sơ tán. Backend sẽ mở toàn bộ barrier, khóa thao tác thường và broadcast tới mọi dashboard qua WebSocket."
                      : "Chức năng kích hoạt SOS đang bị khóa bởi bộ phận an ninh. Dashboard vẫn theo dõi trạng thái realtime, nhưng không thể kích hoạt SOS cho đến khi được bật lại."}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <select value={sosReason} onChange={(e) => setSosReason(e.target.value)} disabled={emergencyStatus.active} className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-bold text-white outline-none disabled:opacity-50">
                    <option value="FIRE_OR_FLOOD">Cháy / ngập / sơ tán khẩn cấp</option>
                    <option value="SECURITY_THREAT">Đe dọa an ninh</option>
                    <option value="MEDICAL_EMERGENCY">Cấp cứu y tế</option>
                    <option value="OTHER_EMERGENCY">Khẩn cấp khác</option>
                  </select>
                  {canManageSos && (
                    <button
                      onClick={() => updateSosEnabled(!sosEnabled)}
                      disabled={updatingSosSetting || emergencyStatus.active || !sosSettingLoaded}
                      title={!sosSettingLoaded ? "Chưa tải được cấu hình bật/tắt SOS" : emergencyStatus.active ? "Cần hủy SOS đang active trước khi tắt chức năng SOS" : "Bật/tắt quyền kích hoạt SOS toàn hệ thống"}
                      className={`rounded-2xl px-5 py-3 text-sm font-black shadow-xl disabled:cursor-not-allowed disabled:opacity-50 ${sosEnabled ? "bg-amber-400 text-slate-950" : "bg-emerald-400 text-slate-950"}`}
                    >
                      {updatingSosSetting ? "Đang cập nhật..." : !sosSettingLoaded ? "Không tải được cấu hình SOS" : sosEnabled ? "Khóa kích hoạt SOS" : "Mở khóa kích hoạt SOS"}
                    </button>
                  )}
                  {emergencyStatus.active && (
                    <button onClick={deactivateSos} disabled={!canManageSos} className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-red-700 shadow-xl disabled:cursor-not-allowed disabled:opacity-50">
                      {canManageSos ? "Hủy SOS đang active" : "Chỉ Security/Manager/Admin được hủy"}
                    </button>
                  )}
                </div>
              </div>
              <button
                type="button"
                onMouseDown={startSosHold}
                onMouseUp={() => clearSosHold()}
                onMouseLeave={() => clearSosHold()}
                onTouchStart={startSosHold}
                onTouchEnd={() => clearSosHold()}
                disabled={emergencyStatus.active || loading || !sosSettingLoaded || !sosEnabled}
                className={`relative flex min-h-56 flex-col items-center justify-center overflow-hidden rounded-[2rem] border-4 text-white shadow-[0_0_60px_rgba(239,68,68,0.55)] transition hover:scale-[1.01] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${sosSettingLoaded && sosEnabled ? "border-red-300 bg-red-600" : "border-slate-500 bg-slate-700"}`}
              >
                <div className="absolute bottom-0 left-0 top-0 bg-white/25 transition-all" style={{ width: `${holdProgress}%` }} />
                <span className="relative text-6xl">🔴</span>
                <span className="relative mt-3 text-2xl font-black">{!sosSettingLoaded ? "CHƯA TẢI CẤU HÌNH" : sosEnabled ? "GIỮ 3 GIÂY" : "SOS ĐÃ KHÓA"}</span>
                <span className="relative mt-1 text-xs font-black uppercase tracking-[0.35em] text-red-100">{!sosSettingLoaded ? "KIỂM TRA BACKEND" : sosEnabled ? "SOS KHẨN CẤP" : "SECURITY ĐÃ KHÓA"}</span>
                {isHoldingSos && <span className="relative mt-3 font-mono text-lg font-black">{Math.ceil((3000 - (holdProgress / 100) * 3000) / 1000)}s</span>}
              </button>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-4">
            <Stat title="Cổng hoạt động" value={`${openGates}/${gates.length}`} tone="red" />
            <Stat title="Zone giám sát" value={zones.length} tone="blue" />
            <Stat title="Blacklist" value={activeBlacklistCount} tone="amber" />
            <Stat title="Security logs" value={securityLogs.length + criticalLogs} tone="emerald" />
          </div>

          {activeTab === "overview" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <Panel title="🚧 Cổng từ dữ liệu thật backend" className="action-panel-item">
                <div className="grid gap-3 sm:grid-cols-2">
                  {gates.map((gate) => (
                    <div key={gate.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between"><p className="font-bold text-slate-900">{gate.gateName || gate.gateCode}</p><span className={`h-3 w-3 rounded-full ${gate.isActive ? "bg-emerald-400" : "bg-red-400"}`} /></div>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{gate.gateType} · {gate.gateCode}</p>
                      <p className="mt-2 text-xs text-slate-400">Building: {gate.buildingId}</p>
                    </div>
                  ))}
                  {!gates.length && <Empty text="Backend chưa trả về gate nào." />}
                </div>
              </Panel>
              <Panel title="📡 Trạng thái SOS realtime">
                <div className={`rounded-2xl border p-6 ${emergencyStatus.active ? "border-red-300 bg-red-50" : sosEnabled ? "border-emerald-200 bg-emerald-50" : "border-slate-300 bg-slate-50"}`}>
                  <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-400">Current State</p>
                  <h3 className={`mt-3 text-3xl font-black ${emergencyStatus.active ? "text-red-700" : sosEnabled ? "text-emerald-700" : "text-slate-700"}`}>
                    {emergencyStatus.active ? "SOS ACTIVE" : sosEnabled ? "SOS READY" : "SOS DISABLED"}
                  </h3>
                  <p className="mt-2 text-sm font-semibold text-slate-600">
                    {emergencyStatus.active
                      ? emergencyStatus.message
                      : sosEnabled
                        ? "Chức năng SOS đang sẵn sàng. Security có thể kích hoạt khi xảy ra khẩn cấp."
                        : "Chức năng kích hoạt SOS đang bị khóa. Security/Manager/Admin có thể mở khóa khi cần."}
                  </p>
                  <p className="mt-4 text-xs text-slate-500">Building: {emergencyStatus.buildingName || buildings[0]?.name || "—"}</p>
                </div>
              </Panel>
            </div>
          )}

          {activeTab === "blacklist" && (
            <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
              <Panel title="➕ Thêm biển số blacklist">
                <form onSubmit={addBlacklist} className="space-y-4">
                  <Field label="Biển số xe">
                    <input value={blacklistForm.licensePlate} onChange={(e) => setBlacklistForm({ ...blacklistForm, licensePlate: e.target.value.toUpperCase() })} placeholder="VD: 29A-666.66" className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-mono font-bold text-slate-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100" />
                  </Field>
                  <Field label="Lý do">
                    <select value={blacklistForm.reason} onChange={(e) => setBlacklistForm({ ...blacklistForm, reason: e.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100">
                      {Object.entries(REASON_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </Field>
                  <Field label="Mô tả chi tiết">
                    <textarea value={blacklistForm.description} onChange={(e) => setBlacklistForm({ ...blacklistForm, description: e.target.value })} rows="4" placeholder="Ghi rõ lý do, biên bản, tình huống..." className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100" />
                  </Field>
                  <button disabled={submittingBlacklist} className="w-full rounded-xl bg-red-600 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-red-600/20 hover:bg-red-700 disabled:opacity-60">{submittingBlacklist ? "Đang lưu..." : "Thêm vào blacklist"}</button>
                </form>
              </Panel>
              <Panel title="🚫 Danh sách đen từ database">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500"><tr><th className="p-3">Biển số</th><th className="p-3">Lý do</th><th className="p-3">Ngày thêm</th><th className="p-3">Trạng thái</th><th className="p-3"></th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {blacklist.map((item) => (
                        <tr key={item.id} className={`hover:bg-slate-50/50 transition-colors ${item.isActive === false ? "opacity-45" : ""}`}>
                          <td className="p-3"><LicensePlate plate={item.licensePlate} /></td>
                          <td className="p-3"><p className="font-bold text-slate-900">{REASON_LABELS[item.reason] || item.reason}</p><p className="mt-1 max-w-xs text-xs text-slate-500">{item.description}</p></td>
                          <td className="p-3 text-xs font-semibold text-slate-500">{formatTime(item.addedAt)}</td>
                          <td className="p-3"><span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${item.isActive === false ? "bg-slate-100 text-slate-500 border border-slate-200" : "bg-red-50 text-red-700 border border-red-100"}`}>{item.isActive === false ? "Đã gỡ" : "Đang chặn"}</span></td>
                          <td className="p-3 text-right">{item.isActive !== false && <button onClick={() => removeBlacklist(item.id)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">Gỡ</button>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!blacklist.length && <Empty text="Chưa có biển số nào trong blacklist." />}
                </div>
              </Panel>
            </div>
          )}

          {activeTab === "logs" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <Panel title="📋 Security exception logs">
                <LogList logs={securityLogs.map((log) => ({ id: log.id, title: EXCEPTION_LABELS[log.exceptionType] || log.exceptionType, subtitle: log.description, time: log.resolvedAt || log.createdAt, badge: log.session?.licensePlate }))} />
              </Panel>
              <Panel title="🚨 Emergency SOS history">
                <LogList logs={emergencyHistory.map((event) => ({ id: event.eventId, title: event.active ? "SOS ACTIVE" : "SOS RESOLVED", subtitle: `${event.reason || "EMERGENCY"} · ${event.message || ""}`, time: event.activatedAt, badge: event.activatedBy }))} />
              </Panel>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Stat({ title, value, tone }) {
  const tones = {
    red: "border-red-100 bg-red-50/30 text-red-700",
    blue: "border-blue-100 bg-blue-50/30 text-blue-700",
    amber: "border-amber-100 bg-amber-50/30 text-amber-700",
    emerald: "border-emerald-100 bg-emerald-50/30 text-emerald-700",
  };
  return <div className={`stat-card-item rounded-2xl border p-5 shadow-sm space-y-2.5 transition-all hover:translate-y-[-2px] duration-200 bg-white ${tones[tone]}`}><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{title}</p><p className="text-xl font-black text-slate-900 tracking-tight">{value}</p></div>;
}

function Panel({ title, children, className }) {
  return <div className={`action-panel-item rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ${className || ""}`}><h3 className="mb-5 text-base font-bold text-slate-900">{title}</h3>{children}</div>;
}

function Field({ label, children }) {
  return <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>{children}</label>;
}

function Empty({ text }) {
  return <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm font-semibold text-slate-400">{text}</div>;
}

function LogList({ logs }) {
  if (!logs.length) return <Empty text="Chưa có log từ backend." />;
  return <div className="space-y-3">{logs.slice(0, 12).map((log) => <div key={log.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 hover:bg-slate-50 transition-colors"><div className="flex items-start justify-between gap-3"><div><p className="font-bold text-slate-900">{log.title}</p><p className="mt-1 text-xs font-medium leading-relaxed text-slate-500">{log.subtitle || "—"}</p></div>{log.badge && <span className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold text-red-700 border border-red-100">{log.badge}</span>}</div><p className="mt-3 text-[11px] font-semibold text-slate-400">{formatTime(log.time)}</p></div>)}</div>;
}
