import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { staffApi } from "../../api/parkingApi";
import ParkingDigitalTwin3D from "../manager/ParkingDigitalTwin3D";
import gsap from "gsap";

// Icons
const IconDashboard = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);
const IconUsers = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);
const IconZones = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);
const IconGates = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);
const IconTariffs = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const IconPasses = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
  </svg>
);
const IconExceptions = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);
const IconReports = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
  </svg>
);
const IconSettings = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 01-6 0z" />
  </svg>
);
const IconDigitalTwin = () => (
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
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-slate-300 bg-white font-mono font-bold text-slate-800 shadow-sm text-xs tracking-widest">
    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block mr-1"></span>
    {plate}
  </span>
);

export default function AdminDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [liveTime, setLiveTime] = useState("");
  const [liveDate, setLiveDate] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const fullName = user.fullName || "Admin Hệ Thống";

  // GSAP Animation container reference
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Sidebar slide-in (only on mount)
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

  // --- STATE QUẢN LÝ ---
  const [users, setUsers] = useState([]);
  const [zones, setZones] = useState([]);
  const [gates, setGates] = useState([]);
  const [tariffs, setTariffs] = useState([]);
  const [passes, setPasses] = useState([]);
  const [parkingConfig, setParkingConfig] = useState({ buildings: [], floors: [], vehicleTypes: [] });
  const [logs, setLogs] = useState([]);

  const [sessions, setSessions] = useState([]);

  // Cài đặt hệ thống chung
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("admin_settings");
    return saved ? JSON.parse(saved) : { gracePeriod: 10, currency: "VND", vat: 10, systemName: "Bãi xe Thông minh SmartParking v2" };
  });

  // --- MODAL STATES ---
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userForm, setUserForm] = useState({ id: "", name: "", email: "", role: "staff", status: "active", phone: "" });
  const [isEditingUser, setIsEditingUser] = useState(false);

  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [zoneForm, setZoneForm] = useState({ id: "", name: "", type: "Xe máy", capacity: 100, occupied: 0, floorId: "", vehicleTypeId: "", status: "ACTIVE" });
  const [isEditingZone, setIsEditingZone] = useState(false);

  const [isGateModalOpen, setIsGateModalOpen] = useState(false);
  const [gateForm, setGateForm] = useState({ id: "", name: "", type: "MAIN_ENTRY", status: "active", barrier: "CLOSED", cameraIp: "", buildingId: "" });
  const [isEditingGate, setIsEditingGate] = useState(false);

  const [isTariffModalOpen, setIsTariffModalOpen] = useState(false);
  const [tariffForm, setTariffForm] = useState({ id: "", vehicleType: "Xe máy", vehicleTypeId: "", buildingId: "", type: "HOURLY", price: 0, freeMinutes: 0, description: "" });
  const [isEditingTariff, setIsEditingTariff] = useState(false);

  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [passForm, setPassForm] = useState({ id: "", owner: "", userId: "", plate: "", type: "Xe máy", vehicleTypeId: "", buildingId: "", start: "", end: "", status: "active", passType: "MONTHLY", fee: 0 });
  const [isEditingPass, setIsEditingPass] = useState(false);

  const fetchLogs = async () => {
    try {
      const res = await staffApi.getSecurityExceptions();
      const backendLogs = res.data.data || [];
      const mappedLogs = backendLogs.map(l => ({
        id: l.id ? l.id.toString().substring(0, 8).toUpperCase() : "EX-DB",
        time: l.resolvedAt ? new Date(l.resolvedAt).toLocaleString("vi-VN") : "—",
        plate: l.session?.licensePlate || "KHÔNG RÕ BIỂN",
        handler: l.handledBy?.fullName || "Phạm Văn Bảo Vệ",
        issue: l.exceptionType === "LOST_TICKET" ? "Mất thẻ QR vãng lai" : l.exceptionType === "WRONG_PLATE" ? "AI đọc lệch biển số" : "Sự cố an ninh",
        severity: l.description?.includes("severity: high") || l.description?.includes("severity: \"high\"") || l.description?.includes("Mức độ: high") ? "high" : "medium",
        action: l.description || "Đã giải quyết"
      }));
      setLogs(mappedLogs);
    } catch (err) {
      console.warn("Failed to load real exception logs from backend for Admin Dashboard:", err);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await staffApi.getAllSessionsHistory();
      const backendSessions = res.data.data || [];
      const formattedSessions = backendSessions.map(s => ({
        id: s.sessionId || `s_${s.sessionCode}`,
        plate: s.licensePlate,
        building: "SmartParking Tower",
        zone: s.floorName && s.zoneName ? `${s.floorName} - ${s.zoneName}` : s.zoneName || "—",
        type: s.driverType || "WALK_IN",
        entryTime: s.entryTime ? new Date(s.entryTime) : null,
        exitTime: s.exitTime ? new Date(s.exitTime) : null,
        fee: s.totalFee || 0,
        status: s.status || (s.exitTime ? "COMPLETED" : "ACTIVE")
      }));
      setSessions(formattedSessions);
    } catch (err) {
      console.warn("Failed to fetch sessions for Admin Dashboard:", err);
    }
  };

  // Load cấu hình bãi xe thực tế từ Backend (Zones, Gates)
  useEffect(() => {
    const fetchAdminUsers = async () => {
      try {
        const res = await staffApi.getAdminUsers();
        setUsers(res.data.data || []);
      } catch (err) {
        console.warn("Failed to load users from backend:", err);
      }
    };

    const fetchPasses = async () => {
      try {
        const res = await staffApi.getParkingPasses();
        setPasses(mapPasses(res.data.data));
      } catch (err) {
        console.warn("Failed to load parking passes from backend:", err);
      }
    };

    const fetchConfig = async () => {
      try {
        await reloadAdminConfig();
      } catch (err) {
        console.warn("Failed to load real config from backend for Admin Dashboard:", err);
      }
    };

    const fetchSettings = async () => {
      try {
        const res = await staffApi.getAdminSettings();
        setSettings(res.data.data || { gracePeriod: 10, currency: "VND", vat: 10, systemName: "Bãi xe Thông minh SmartParking v2" });
      } catch (err) {
        console.warn("Failed to load settings from backend:", err);
      }
    };
    fetchAdminUsers();
    fetchPasses();
    fetchConfig();
    fetchSettings();
    fetchLogs();
    fetchSessions();

    // Auto refresh exceptions logs & sessions every 5 seconds
    const interval = setInterval(() => {
      fetchAdminUsers();
      fetchPasses();
      fetchLogs();
      fetchSessions();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Đồng bộ hóa thời gian
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);

    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setLiveDate(today.toLocaleDateString('vi-VN', options));

    return () => clearInterval(timer);
  }, []);

  // --- TOAST NOTIFICATION ---
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const unavailableAdminAction = (message = "Chức năng này cần API admin thật từ backend. Frontend không cập nhật dữ liệu giả.") => {
    showToast(message, "warning");
  };

  const firstBuildingId = () => parkingConfig.buildings?.[0]?.id || "";
  const firstVehicleTypeId = () => parkingConfig.vehicleTypes?.[0]?.id || "";
  const firstFloorId = () => parkingConfig.floors?.[0]?.id || "";
  const vehicleTypeNameById = (id) => parkingConfig.vehicleTypes?.find((v) => v.id === id)?.name || "Xe máy";

  const mapPasses = (items) => (items || []).map((p) => ({
    id: p.id,
    owner: p.user?.fullName || "--",
    userId: p.user?.id || "",
    buildingId: p.building?.id || "",
    vehicleTypeId: p.vehicleType?.id || "",
    plate: p.licensePlate,
    type: p.vehicleType?.name || "--",
    start: p.startDate,
    end: p.endDate,
    status: String(p.status || "active").toLowerCase(),
    passType: p.passType || "MONTHLY",
    fee: Number(p.fee || 0),
  }));

  const reloadPasses = async () => {
    const res = await staffApi.getParkingPasses();
    setPasses(mapPasses(res.data.data));
  };

  const reloadAdminConfig = async () => {
    const res = await staffApi.getParkingConfig();
    const config = res.data.data || {};
    setParkingConfig({
      buildings: config.buildings || [],
      floors: config.floors || [],
      vehicleTypes: config.vehicleTypes || [],
    });
    setZones((config.zones || []).map(z => ({
      id: z.id,
      name: z.zoneName || `Khu ${z.zoneCode}`,
      type: z.vehicleTypeName || "Xe máy",
      vehicleTypeId: z.vehicleTypeId,
      floorId: z.floorId,
      status: z.status || "ACTIVE",
      capacity: z.capacity || 100,
      occupied: z.currentCount || 0
    })));
    setGates((config.gates || []).map((g, idx) => ({
      id: g.id,
      name: g.gateName || `Cổng ${g.gateCode}`,
      type: g.gateType || "MAIN_ENTRY",
      status: "active",
      barrier: "CLOSED",
      cameraIp: `192.168.1.${50 + idx}`
    })));
    setTariffs((config.pricingRules || []).map((r) => ({
      id: r.id,
      buildingId: r.buildingId,
      vehicleTypeId: r.vehicleTypeId,
      vehicleType: r.vehicleTypeName || "Xe máy",
      type: r.pricingType || "HOURLY",
      price: Number(r.pricePerUnit || 0),
      freeMinutes: r.freeMinutes || 0,
      description: `${r.pricingType === "MONTHLY" ? "Vé tháng" : r.pricingType === "DAILY" ? "Theo ngày" : "Theo giờ"} · miễn phí ${r.freeMinutes || 0} phút đầu`
    })));
  };

  const handleOpenAddUser = () => {
    setUserForm({ id: "", name: "", email: "", role: "staff", status: "active", phone: "" });
    setIsEditingUser(false);
    setIsUserModalOpen(true);
  };
  const handleOpenEditUser = (u) => { setUserForm(u); setIsEditingUser(true); setIsUserModalOpen(true); };
  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      if (isEditingUser) {
        await staffApi.updateAdminUser(userForm.id, userForm);
        showToast(`Cập nhật thành công ${userForm.name}`);
      } else {
        await staffApi.createAdminUser(userForm);
        showToast(`Tạo tài khoản ${userForm.name} thành công`);
      }
      const res = await staffApi.getAdminUsers();
      setUsers(res.data.data || []);
      setIsUserModalOpen(false);
    } catch (err) {
      showToast(err.response?.data?.message || "Thao tác tài khoản thất bại", "warning");
    }
  };
  const toggleUserStatus = async (id) => {
    const target = users.find((u) => u.id === id);
    if (!target) return;
    await staffApi.updateAdminUser(id, { ...target, status: target.status === "active" ? "suspended" : "active" });
    const res = await staffApi.getAdminUsers();
    setUsers(res.data.data || []);
    showToast("Đã cập nhật trạng thái hoạt động người dùng!");
  };
  const handleDeleteUser = async (id, name) => {
    if (window.confirm(`Xóa tài khoản ${name}?`)) {
      await staffApi.deleteAdminUser(id);
      setUsers(users.filter(u => u.id !== id));
      showToast(`Đã xóa ${name}`, "warning");
    }
  };

  const handleOpenAddZone = () => {
    const vehicleTypeId = firstVehicleTypeId();
    setZoneForm({ id: "", name: "", type: vehicleTypeNameById(vehicleTypeId), capacity: 100, occupied: 0, floorId: firstFloorId(), vehicleTypeId, status: "ACTIVE" });
    setIsEditingZone(false);
    setIsZoneModalOpen(true);
  };
  const handleOpenEditZone = (zone) => {
    setZoneForm({ ...zone, vehicleTypeId: zone.vehicleTypeId || firstVehicleTypeId(), floorId: zone.floorId || firstFloorId() });
    setIsEditingZone(true);
    setIsZoneModalOpen(true);
  };
  const handleSaveZone = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        floorId: zoneForm.floorId || firstFloorId(),
        vehicleTypeId: zoneForm.vehicleTypeId || firstVehicleTypeId(),
        zoneCode: zoneForm.name.trim().toUpperCase().replace(/\s+/g, "-").slice(0, 20),
        zoneName: zoneForm.name,
        capacity: zoneForm.capacity,
        status: zoneForm.status || "ACTIVE"
      };
      if (isEditingZone) await staffApi.updateZone(zoneForm.id, payload);
      else await staffApi.createZone(payload);
      await reloadAdminConfig();
      setIsZoneModalOpen(false);
      showToast(isEditingZone ? "Đã cập nhật zone" : "Đã tạo zone mới");
    } catch (err) {
      showToast(err.response?.data?.message || "Thao tác zone thất bại", "warning");
    }
  };
  const handleDeleteZone = async (id, name) => {
    if (!window.confirm(`Xóa khu vực ${name}?`)) return;
    await staffApi.deleteZone(id);
    await reloadAdminConfig();
    showToast(`Đã xóa ${name}`, "warning");
  };

  const handleOpenAddGate = () => {
    setGateForm({ id: "", name: "", type: "MAIN_ENTRY", status: "active", barrier: "CLOSED", cameraIp: "", buildingId: firstBuildingId() });
    setIsEditingGate(false);
    setIsGateModalOpen(true);
  };
  const handleOpenEditGate = (gate) => {
    setGateForm({ ...gate, buildingId: gate.buildingId || firstBuildingId() });
    setIsEditingGate(true);
    setIsGateModalOpen(true);
  };
  const handleSaveGate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        buildingId: gateForm.buildingId || firstBuildingId(),
        gateCode: gateForm.name.trim().toUpperCase().replace(/\s+/g, "-").slice(0, 20),
        gateName: gateForm.name,
        gateType: gateForm.type,
        isActive: gateForm.status === "active"
      };
      if (isEditingGate) await staffApi.updateGate(gateForm.id, payload);
      else await staffApi.createGate(payload);
      await reloadAdminConfig();
      setIsGateModalOpen(false);
      showToast(isEditingGate ? "Đã cập nhật cổng" : "Đã tạo cổng mới");
    } catch (err) {
      showToast(err.response?.data?.message || "Thao tác cổng thất bại", "warning");
    }
  };
  const handleDeleteGate = async (id, name) => {
    if (!window.confirm(`Xóa cổng ${name}?`)) return;
    await staffApi.deleteGate(id);
    await reloadAdminConfig();
    showToast(`Đã xóa cổng ${name}`, "warning");
  };

  const toggleBarrier = async (gateId, currentState) => {
    const newState = currentState === "OPEN" ? "CLOSED" : "OPEN";
    try {
      await staffApi.controlBarrier(gateId, newState);
      setGates(gates.map((g) => g.id === gateId ? { ...g, barrier: newState } : g));
      showToast(`Đã ${newState === "OPEN" ? "mở" : "khóa"} barrier`);
    } catch (err) {
      showToast(err.response?.data?.message || "Điều khiển barrier thất bại", "warning");
    }
  };

  const handleOpenAddTariff = () => {
    const vehicleTypeId = firstVehicleTypeId();
    setTariffForm({ id: "", vehicleType: vehicleTypeNameById(vehicleTypeId), vehicleTypeId, buildingId: firstBuildingId(), type: "HOURLY", price: 0, freeMinutes: 0, description: "" });
    setIsEditingTariff(false);
    setIsTariffModalOpen(true);
  };
  const handleOpenEditTariff = (tariff) => {
    setTariffForm({ ...tariff, vehicleTypeId: tariff.vehicleTypeId || firstVehicleTypeId(), buildingId: tariff.buildingId || firstBuildingId() });
    setIsEditingTariff(true);
    setIsTariffModalOpen(true);
  };
  const handleSaveTariff = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        buildingId: tariffForm.buildingId || firstBuildingId(),
        vehicleTypeId: tariffForm.vehicleTypeId || firstVehicleTypeId(),
        pricingType: tariffForm.type,
        pricePerUnit: tariffForm.price,
        freeMinutes: tariffForm.freeMinutes || 0
      };
      if (isEditingTariff) await staffApi.updatePricingRule(tariffForm.id, payload);
      else await staffApi.createPricingRule(payload);
      await reloadAdminConfig();
      setIsTariffModalOpen(false);
      showToast(isEditingTariff ? "Đã cập nhật biểu phí" : "Đã tạo biểu phí mới");
    } catch (err) {
      showToast(err.response?.data?.message || "Thao tác biểu phí thất bại", "warning");
    }
  };

  const handleOpenAddPass = () => {
    const driver = users.find((u) => u.role === "driver") || users[0];
    const vehicleTypeId = firstVehicleTypeId();
    setPassForm({ id: "", owner: driver?.name || "", userId: driver?.id || "", plate: "", type: vehicleTypeNameById(vehicleTypeId), vehicleTypeId, buildingId: firstBuildingId(), start: "", end: "", status: "active", passType: "MONTHLY", fee: 0 });
    setIsEditingPass(false);
    setIsPassModalOpen(true);
  };
  const handleOpenEditPass = (pass) => {
    setPassForm({
      id: pass.id,
      owner: pass.owner,
      userId: pass.userId || "",
      plate: pass.plate,
      type: pass.type,
      vehicleTypeId: pass.vehicleTypeId || firstVehicleTypeId(),
      buildingId: pass.buildingId || firstBuildingId(),
      start: pass.start,
      end: pass.end,
      status: pass.status,
      passType: pass.passType || "MONTHLY",
      fee: pass.fee || 0
    });
    setIsEditingPass(true);
    setIsPassModalOpen(true);
  };
  const handleSavePass = async (e) => {
    e.preventDefault();
    try {
      if (isEditingPass) {
        await staffApi.updateParkingPass(passForm.id, {
          userId: passForm.userId,
          buildingId: passForm.buildingId || firstBuildingId(),
          vehicleTypeId: passForm.vehicleTypeId || firstVehicleTypeId(),
          licensePlate: passForm.plate,
          startDate: passForm.start,
          endDate: passForm.end,
          passType: passForm.passType || "MONTHLY",
          fee: passForm.fee || 0,
          status: passForm.status
        });
        showToast("Đã cập nhật vé định kỳ");
      } else {
        await staffApi.createParkingPass({
          userId: passForm.userId,
          buildingId: passForm.buildingId || firstBuildingId(),
          vehicleTypeId: passForm.vehicleTypeId || firstVehicleTypeId(),
          licensePlate: passForm.plate,
          startDate: passForm.start,
          endDate: passForm.end,
          passType: passForm.passType || "MONTHLY",
          fee: passForm.fee || 0
        });
        showToast("Đã phát hành vé định kỳ mới");
      }
      await reloadPasses();
      setIsPassModalOpen(false);
    } catch (err) {
      showToast(err.response?.data?.message || "Thao tác vé định kỳ thất bại", "warning");
    }
  };
  const handleRenewPass = async (id) => {
    try {
      await staffApi.renewParkingPass(id);
      await reloadPasses();
      showToast("Đã gia hạn vé định kỳ");
    } catch (err) {
      showToast(err.response?.data?.message || "Gia hạn vé định kỳ thất bại", "warning");
    }
  };
  const handleDeletePass = async (id, plate) => {
    if (!window.confirm(`Xóa vé định kỳ ${plate}?`)) return;
    await staffApi.deleteParkingPass(id);
    await reloadPasses();
    showToast(`Đã xóa vé định kỳ ${plate}`, "warning");
  };

  // Calculate dynamic stats from real backend data
  const todayRevenue = sessions
    .filter(s => {
      if (!s.exitTime) return false;
      const exitDate = new Date(s.exitTime);
      const today = new Date();
      return exitDate.getDate() === today.getDate() &&
             exitDate.getMonth() === today.getMonth() &&
             exitDate.getFullYear() === today.getFullYear();
    })
    .reduce((acc, curr) => acc + (curr.fee || 0), 0);

  // Hiệu suất lấp đầy bình quân: Tổng số xe đang đỗ / tổng capacity thực tế
  const totalCapacity = zones.reduce((acc, z) => acc + (z.capacity || 0), 0);
  const totalOccupied = zones.reduce((acc, z) => acc + (z.occupied || 0), 0);
  const occupancyPercent = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 1000) / 10 : 0;

  // Lượt xe trong tháng: số lượng sessions có entryTime thuộc tháng hiện tại
  const monthlySessionsCount = sessions.filter(s => {
    if (!s.entryTime) return false;
    const entryDate = new Date(s.entryTime);
    const today = new Date();
    return entryDate.getMonth() === today.getMonth() && entryDate.getFullYear() === today.getFullYear();
  }).length;

  const displayMonthlyCount = monthlySessionsCount;

  // Số lượng vé tháng hoạt động thực tế
  const activePassesCount = passes.filter(p => p.status === "active").length;
  // Số lượng vé tháng chờ gia hạn tuần này (hết hạn trong 7 ngày tới)
  const expiringPassesCount = passes.filter(p => {
    if (p.status !== "active") return false;
    const endDate = new Date(p.end);
    const diffTime = endDate.getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  }).length;

  // Thống kê doanh thu 7 ngày qua (cho biểu đồ cột tuần)
  const getLast7DaysRevenue = () => {
    const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    const result = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayLabel = days[d.getDay()];
      
      const dailyRevenue = sessions
        .filter(s => {
          if (!s.exitTime) return false;
          const exitDate = new Date(s.exitTime);
          return exitDate.getDate() === d.getDate() &&
                 exitDate.getMonth() === d.getMonth() &&
                 exitDate.getFullYear() === d.getFullYear();
        })
        .reduce((acc, curr) => acc + (curr.fee || 0), 0);
        
      result.push({
        day: dayLabel,
        val: (dailyRevenue / 1000000).toFixed(2), // triệu đồng
        raw: dailyRevenue
      });
    }
    return result;
  };

  const weeklyRevenueData = getLast7DaysRevenue();
  const maxWeeklyVal = Math.max(...weeklyRevenueData.map(d => parseFloat(d.val)), 0.1);

  // Memoize zones cho 3D Twin — tránh tạo array mới mỗi lần render gây rebuild scene
  const twinZones = React.useMemo(() =>
    zones.map(z => ({
      ...z,
      currentCount: z.occupied,
      floorName: parkingConfig.floors?.find(f => f.id === z.floorId)?.floorName || "B1",
      vehicleTypeName: z.type,
    })),
    [zones, parkingConfig.floors]
  );

  return (
    <div ref={containerRef} className="min-h-screen bg-[#f8fafc] text-slate-900 flex font-sans">

      {/* FULLSCREEN 3D DIGITAL TWIN OVERLAY */}
      {activeTab === "digitalTwin" && (
        <div className="fixed inset-0 z-[9999] bg-[#020617]">
          <button
            onClick={() => setActiveTab("dashboard")}
            className="fixed top-5 left-5 z-[10000] flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold backdrop-blur-xl transition-all cursor-pointer shadow-xl"
          >
            ← Quay lại Dashboard
          </button>
          <ParkingDigitalTwin3D
            zones={twinZones}
            floors={parkingConfig.floors || []}
            gates={gates}
            sessions={sessions}
            onRefresh={reloadAdminConfig}
          />
        </div>
      )}

      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-5 right-5 z-55 flex items-center gap-2 rounded-2xl px-5 py-3.5 text-xs font-bold text-white shadow-xl animate-bounce ${
          toast.type === "success" ? "bg-emerald-500" : toast.type === "warning" ? "bg-amber-500" : "bg-red-500"
        }`}>
          <span>{toast.type === "success" ? "✅" : toast.type === "warning" ? "⚠️" : "❌"}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Sidebar - Dark Glassmorphism style */}
      <aside
        className={`aside-panel fixed left-0 top-0 bottom-0 z-50 flex h-screen flex-col bg-slate-900 text-white shadow-xl transition-all duration-300 ${
          collapsed ? "w-20" : "w-72"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center gap-3.5 px-6 py-6 border-b border-slate-800 overflow-hidden">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white shadow-md shadow-purple-500/20 font-black text-lg flex-shrink-0 cursor-pointer"
          >
            A
          </button>
          {!collapsed && (
            <div className="animate-fade-in-fast text-left">
              <h1 className="text-md font-extrabold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent whitespace-nowrap">
                Smart Parking
              </h1>
              <p className="text-xs text-purple-400 font-bold tracking-wider uppercase whitespace-nowrap">
                Hệ thống quản trị
              </p>
            </div>
          )}
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto overflow-x-hidden">
          <SidebarBtn active={activeTab === "dashboard"} collapsed={collapsed} label="Bảng tổng quan" icon={<IconDashboard />} onClick={() => setActiveTab("dashboard")} />
          <SidebarBtn active={activeTab === "digitalTwin"} collapsed={collapsed} label="Mô phỏng 3D" icon={<IconDigitalTwin />} onClick={() => setActiveTab("digitalTwin")} />
          <SidebarBtn active={activeTab === "users"} collapsed={collapsed} label="Quản lý người dùng" icon={<IconUsers />} onClick={() => setActiveTab("users")} />
          <SidebarBtn active={activeTab === "zones"} collapsed={collapsed} label="Phân khu đỗ xe" icon={<IconZones />} onClick={() => setActiveTab("zones")} />
          <SidebarBtn active={activeTab === "gates"} collapsed={collapsed} label="Cổng kiểm soát" icon={<IconGates />} onClick={() => setActiveTab("gates")} />
          <SidebarBtn active={activeTab === "tariffs"} collapsed={collapsed} label="Bảng biểu giá gửi" icon={<IconTariffs />} onClick={() => setActiveTab("tariffs")} />
          <SidebarBtn active={activeTab === "passes"} collapsed={collapsed} label="Vé định kỳ" icon={<IconPasses />} onClick={() => setActiveTab("passes")} />
          <SidebarBtn active={activeTab === "exceptions"} collapsed={collapsed} label="Nhật ký sự cố" icon={<IconExceptions />} onClick={() => setActiveTab("exceptions")} />
          <SidebarBtn active={activeTab === "reports"} collapsed={collapsed} label="Báo cáo doanh thu" icon={<IconReports />} onClick={() => setActiveTab("reports")} />
          <SidebarBtn active={activeTab === "settings"} collapsed={collapsed} label="Cấu hình hệ thống" icon={<IconSettings />} onClick={() => setActiveTab("settings")} />
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-slate-800 p-4 overflow-hidden">
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 font-semibold text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition-all duration-200 cursor-pointer"
          >
            <IconLogout />
            {!collapsed && <span className="whitespace-nowrap">Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <main
        className={`main-content-area flex-1 min-h-screen flex flex-col transition-all duration-300 ${
          collapsed ? "ml-20" : "ml-72"
        }`}
      >
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/80 px-8 backdrop-blur-md">
          <div className="flex flex-col text-left">
            <h2 className="text-xl font-bold text-slate-900">
              {activeTab === "dashboard" && "Hệ thống vận hành tổng quan"}
              {activeTab === "users" && "Quản lý nhân sự & Quyền hạn"}
              {activeTab === "zones" && "Thiết lập Phân khu đỗ xe"}
              {activeTab === "gates" && "Cổng kiểm soát Barrier & Camera AI"}
              {activeTab === "tariffs" && "Cấu hình Giá đỗ xe"}
              {activeTab === "passes" && "Danh sách Vé định kỳ Cư dân"}
              {activeTab === "exceptions" && "Nhật ký Ngoại lệ & Log an ninh"}
              {activeTab === "reports" && "Phân tích Số liệu Doanh thu"}
              {activeTab === "settings" && "Cài đặt Nghiệp vụ Bãi xe"}
              {activeTab === "digitalTwin" && "Mô phỏng 3D Digital Twin"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{liveDate}</p>
          </div>

          <div className="flex items-center gap-6">
            {/* Live Clock Widget */}
            <div className="hidden md:flex flex-col items-end border-r border-slate-200 pr-6">
              <span className="font-mono text-lg font-bold text-indigo-600 bg-indigo-50/50 px-3 py-1 rounded-lg border border-indigo-100">
                {liveTime}
              </span>
            </div>

            {/* Profile Avatar */}
            <div className="flex items-center gap-3.5 pl-6">
              <div className="text-right">
                <p className="font-semibold text-sm text-slate-900">
                  {fullName}
                </p>
                <p className="text-xs text-slate-400 font-medium">
                  System Admin
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 font-bold text-white shadow-md shadow-purple-500/20">
                {fullName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Content Section */}
        <section className="flex-1 space-y-6 p-8">
          
          {/* Welcome Banner */}
          <div className="welcome-banner relative overflow-hidden rounded-3xl bg-slate-900 p-8 text-white shadow-lg border border-slate-800">
            {/* Mesh Glow Background */}
            <div className="absolute right-0 top-0 -mr-20 -mt-20 h-60 w-60 rounded-full bg-purple-600/30 blur-3xl" />
            <div className="absolute left-1/3 bottom-0 -mb-20 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />

            <div className="relative z-10 max-w-2xl text-left">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-semibold mb-4 border border-purple-500/20">
                <span className="h-2 w-2 rounded-full bg-purple-500 animate-ping"></span>
                🛡️ TRUNG TÂM QUẢN TRỊ CAO CẤP
              </span>
              <h1 className="text-3xl font-extrabold tracking-tight">
                Hệ thống Quản trị SmartParking 👋
              </h1>
              <p className="mt-2.5 text-slate-300 text-sm leading-relaxed max-w-lg">
                Chào mừng trở lại trung tâm kiểm soát {settings.systemName}. Giám sát hoạt động an ninh, doanh thu, thiết lập giá gửi, phân quyền nhân sự, và cứu hộ barrier trực tuyến.
              </p>
            </div>
          </div>

          {/* TAB 1: DASHBOARD */}
          {activeTab === "dashboard" && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Tổng người dùng" value={`${users.length} tài khoản`} icon="👥" accentColor="bg-blue-500" subtext="Staff, Security & Drivers" />
                <StatCard title="Số cổng kiểm soát" value={`${gates.length} làn trực tuyến`} icon="🚧" accentColor="bg-purple-500" subtext="Hệ thống barrier AI live" />
                <StatCard title="Doanh thu hôm nay" value={`${todayRevenue.toLocaleString("vi-VN")}đ`} icon="💰" accentColor="bg-emerald-500" subtext={`Bypass ${settings.gracePeriod} phút đầu`} />
                <StatCard title="Log an ninh khẩn" value={`${logs.length} biên bản`} icon="⚠️" accentColor="bg-rose-500" subtext="Cần giám sát khẩn cấp" />
              </div>

              {/* Grid 2 Columns */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Phân khu đỗ */}
                <div className="action-panel-item lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm shadow-slate-100/50 space-y-4">
                  <h3 className="font-extrabold text-slate-900 text-base text-left flex items-center gap-2">
                    <span className="w-1 h-5 rounded-full bg-purple-600 block"></span>
                    📊 Công suất đỗ thực tế các phân khu
                  </h3>
                  <div className="space-y-4">
                    {zones.map(z => {
                      const percent = Math.min(100, Math.round((z.occupied / z.capacity) * 100));
                      return (
                        <div key={z.id} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-slate-800">{z.name} ({z.type})</span>
                            <span className="text-slate-500">{z.occupied}/{z.capacity} xe ({percent}%)</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-500 ${
                              percent > 90 ? "bg-red-500" : percent > 75 ? "bg-amber-500" : "bg-indigo-500"
                            }`} style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Barrier Control Panel */}
                <div className="action-panel-item bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm shadow-slate-100/50 flex flex-col space-y-4 text-left">
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    <span className="w-1 h-5 rounded-full bg-purple-600 block"></span>
                    🚧 Khống chế Barrier cưỡng chế
                  </h3>
                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-1">
                    {gates.map(g => (
                      <div key={g.id} className="p-3.5 bg-slate-50/50 rounded-xl flex items-center justify-between border border-slate-100 hover:bg-slate-50 transition-colors">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{g.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">Camera: {g.cameraIp}</p>
                        </div>
                        <button
                          onClick={() => toggleBarrier(g.id, g.barrier)}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border cursor-pointer transition-colors ${
                            g.barrier === "OPEN" 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" 
                              : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                          }`}
                        >
                          {g.barrier === "OPEN" ? "🔓 ĐANG MỞ" : "🔒 ĐANG ĐÓNG"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: USERS MANAGEMENT */}
          {activeTab === "users" && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm shadow-slate-100/50 space-y-6">
              <div className="flex justify-between items-center text-left">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Danh sách tài khoản hệ thống</h3>
                  <p className="text-xs text-slate-400">Quản trị phân quyền, gán vai trò & trạng thái các nhân viên bãi đỗ.</p>
                </div>
                <button onClick={handleOpenAddUser} className="rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2.5 text-xs font-bold text-white cursor-pointer transition-colors shadow-lg shadow-purple-500/10">
                  ➕ Thêm tài khoản mới
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                    <tr>
                      <th className="p-4">Họ và Tên</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Số điện thoại</th>
                      <th className="p-4">Phân quyền (Role)</th>
                      <th className="p-4">Trạng thái</th>
                      <th className="p-4 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-bold text-slate-900">{u.name}</td>
                        <td className="p-4 text-slate-500">{u.email}</td>
                        <td className="p-4 text-slate-500 font-mono">{u.phone}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            u.role === "admin" ? "bg-red-50 text-red-700 border border-red-100" :
                            u.role === "security" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                            u.role === "staff" ? "bg-indigo-50 text-indigo-700 border border-indigo-100" : 
                            "bg-slate-100 text-slate-700"
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-4 text-xs">
                          <span className={`inline-flex items-center gap-1 font-bold ${u.status === "active" ? "text-emerald-600" : "text-rose-600"}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${u.status === "active" ? "bg-emerald-500" : "bg-rose-500"}`} />
                            {u.status === "active" ? "Hoạt động" : "Bị Khóa"}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex justify-center gap-2 text-xs font-bold">
                            <button onClick={() => handleOpenEditUser(u)} className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors">Sửa</button>
                            <button onClick={() => toggleUserStatus(u.id)} className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors">Khóa/Mở</button>
                            {u.role !== "admin" && (
                              <button onClick={() => handleDeleteUser(u.id, u.name)} className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-100 cursor-pointer transition-colors">Xóa</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: ZONES CONFIGURATION */}
          {activeTab === "zones" && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm shadow-slate-100/50 space-y-6">
              <div className="flex justify-between items-center text-left">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Quy hoạch phân khu đỗ xe</h3>
                  <p className="text-xs text-slate-400">Phân định quy chuẩn sức chứa từng zone đỗ riêng biệt trong bãi.</p>
                </div>
                <button onClick={handleOpenAddZone} className="rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2.5 text-xs font-bold text-white cursor-pointer transition-colors shadow-lg shadow-purple-500/10">
                  🏢 Thêm khu vực mới
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {zones.map(z => {
                  const percent = Math.min(100, Math.round((z.occupied / z.capacity) * 100));
                  return (
                    <div key={z.id} className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5 space-y-4 hover:shadow-md transition-shadow text-left">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">{z.type}</span>
                        <div className="flex gap-3 text-xs font-bold">
                          <button onClick={() => handleOpenEditZone(z)} className="text-slate-500 hover:text-slate-900 cursor-pointer transition-colors">Sửa</button>
                          <button onClick={() => handleDeleteZone(z.id, z.name)} className="text-red-500 hover:text-red-700 cursor-pointer transition-colors">Xóa</button>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">{z.name}</h4>
                        <p className="text-[10px] text-slate-400 font-mono mt-1">Sức chứa thực tế: {z.occupied} / {z.capacity} xe ({percent}%)</p>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200/60 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${percent > 90 ? "bg-red-500" : percent > 75 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: GATES CONTROL */}
          {activeTab === "gates" && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm shadow-slate-100/50 space-y-6">
              <div className="flex justify-between items-center text-left">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Cổng kiểm soát & Làn Barrier</h3>
                  <p className="text-xs text-slate-400">Giám sát các camera IP nhận diện AI & thiết bị ngoại vi làn vào/ra.</p>
                </div>
                <button onClick={handleOpenAddGate} className="rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2.5 text-xs font-bold text-white cursor-pointer transition-colors shadow-lg shadow-purple-500/10">
                  🚧 Thêm làn mới
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                {gates.map(g => (
                  <div key={g.id} className="rounded-2xl border border-slate-200/80 p-5 bg-slate-50/50 flex justify-between items-center hover:bg-slate-50 transition-colors">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          g.type.includes("ENTRY") || g.type === "IN"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : g.type.includes("BOTH")
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                        }`}>
                          {g.type.includes("ENTRY") || g.type === "IN" ? "CỔNG VÀO" : g.type.includes("BOTH") ? "HAI CHIỀU" : "CỔNG RA"}
                        </span>
                        <span className={`h-2 w-2 rounded-full ${g.status === "active" ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{g.name}</h4>
                      <p className="text-[10px] text-slate-450 font-mono">Địa chỉ IP Camera: {g.cameraIp}</p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={() => toggleBarrier(g.id, g.barrier)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all border ${
                          g.barrier === "OPEN" 
                            ? "bg-emerald-500 text-white border-emerald-600 shadow-md shadow-emerald-500/10" 
                            : "bg-slate-800 text-white hover:bg-slate-700"
                        }`}
                      >
                        {g.barrier === "OPEN" ? "🔓 OVERRIDE MỞ" : "🔒 KHÓA BẢO VỆ"}
                      </button>
                      <button onClick={() => handleDeleteGate(g.id, g.name)} className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-bold border border-red-200 cursor-pointer transition-colors text-xs">Xóa</button>
                      <span className="text-[9px] font-black text-slate-400 uppercase">{g.status === "active" ? "Online" : "Bảo trì"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: TARIFFS (Cấu hình bảng biểu giá) */}
          {activeTab === "tariffs" && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm shadow-slate-100/50 space-y-6">
              <div className="flex justify-between items-center text-left">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Bảng biểu phí đỗ xe</h3>
                  <p className="text-xs text-slate-400">Quy định cơ chế định giá linh động theo lượt đỗ, vé tháng hoặc lũy kế theo giờ.</p>
                </div>
                <button onClick={handleOpenAddTariff} className="rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2.5 text-xs font-bold text-white cursor-pointer transition-colors shadow-lg shadow-purple-500/10">
                  💵 Thêm biểu phí mới
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                {tariffs.map(t => (
                  <div key={t.id} className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5 space-y-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 uppercase">{t.vehicleType}</span>
                      <div className="flex gap-3 text-xs font-bold">
                        <button onClick={() => handleOpenEditTariff(t)} className="text-slate-500 hover:text-slate-900 cursor-pointer transition-colors">Sửa</button>
                        <button onClick={async () => { if (window.confirm(`Xóa biểu phí ${t.vehicleType}?`)) { await staffApi.deletePricingRule(t.id); await reloadAdminConfig(); showToast("Đã xóa biểu phí", "warning"); } }} className="text-red-500 hover:text-red-700 cursor-pointer transition-colors">Xóa</button>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-2xl font-black text-slate-900">{t.price.toLocaleString("vi-VN")} {settings.currency}</h4>
                      <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">{t.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: PERIODIC PASSES (Vé tháng/quý/năm) */}
          {activeTab === "passes" && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm shadow-slate-100/50 space-y-6">
              <div className="flex justify-between items-center text-left">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Quản lý vé định kỳ (Tháng / Quý / Năm)</h3>
                  <p className="text-xs text-slate-400">Kiểm soát vé định kỳ theo tháng, quý, năm cho biển số đăng ký và cấp quyền ra vào tự động.</p>
                </div>
                <button onClick={handleOpenAddPass} className="rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2.5 text-xs font-bold text-white cursor-pointer transition-colors shadow-lg shadow-purple-500/10">
                  🎫 Phát hành vé định kỳ mới
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                    <tr>
                      <th className="p-4">Chủ sở hữu</th>
                      <th className="p-4">Đăng ký Biển số</th>
                      <th className="p-4">Loại xe</th>
                      <th className="p-4">Gói vé</th>
                      <th className="p-4">Thời điểm cấp</th>
                      <th className="p-4">Hạn sử dụng</th>
                      <th className="p-4">Tình trạng</th>
                      <th className="p-4 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
                    {passes.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-bold text-slate-900">{p.owner}</td>
                        <td className="p-4">
                          <LicensePlate plate={p.plate} />
                        </td>
                        <td className="p-4 font-bold text-slate-500">{p.type}</td>
                        <td className="p-4 font-bold text-slate-500">{p.passType === "YEARLY" ? "Vé năm" : p.passType === "QUARTERLY" ? "Vé quý" : "Vé tháng"}</td>
                        <td className="p-4 text-slate-500 font-mono">{p.start}</td>
                        <td className="p-4 text-slate-500 font-mono">{p.end}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            p.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${p.status === "active" ? "bg-emerald-500" : "bg-red-500"}`} />
                            {p.status === "active" ? "Còn hạn" : "Hết hạn"}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex justify-center gap-2">
                            <button onClick={() => handleRenewPass(p.id)} className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 cursor-pointer transition-colors">Gia hạn {p.passType === "YEARLY" ? "1 năm" : p.passType === "QUARTERLY" ? "1 quý" : "1 tháng"}</button>
                            <button onClick={() => handleOpenEditPass(p)} className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 cursor-pointer transition-colors">Sửa</button>
                            <button onClick={() => handleDeletePass(p.id, p.plate)} className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-bold border border-red-200 cursor-pointer transition-colors">Xóa</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: EXCEPTIONS LOGS */}
          {activeTab === "exceptions" && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm shadow-slate-100/50 space-y-6">
              <div className="text-left border-b border-slate-100 pb-5">
                <h3 className="font-extrabold text-slate-900 text-base">🚨 Log an ninh & Nhật ký giải quyết sự cố</h3>
                <p className="text-xs text-slate-450 mt-1">Tổng hợp ngoại lệ xử lý thủ công (AI nhận sai biển, mất thẻ, override barrier) do lực lượng bảo an khai báo.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                    <tr>
                      <th className="p-4">Mã Log</th>
                      <th className="p-4">Thời gian</th>
                      <th className="p-4">Biển số</th>
                      <th className="p-4">Bảo an xử lý</th>
                      <th className="p-4">Chi tiết sự cố</th>
                      <th className="p-4">Mức độ nguy cấp</th>
                      <th className="p-4">Giải pháp xử lý</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 font-medium text-slate-600">
                    {logs.map(l => (
                      <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-mono font-bold text-slate-400">{l.id}</td>
                        <td className="p-4 text-slate-550 font-mono">{l.time}</td>
                        <td className="p-4">
                          <LicensePlate plate={l.plate} />
                        </td>
                        <td className="p-4 text-slate-800 font-extrabold">{l.handler}</td>
                        <td className="p-4 text-slate-700 font-semibold">{l.issue}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider inline-block ${
                            l.severity === "high" ? "bg-red-50 text-red-700 border border-red-200 animate-pulse" :
                            l.severity === "medium" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                            "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}>
                            {l.severity === "high" ? "Khẩn cấp" : l.severity === "medium" ? "Cần lưu ý" : "Thấp"}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-emerald-600">{l.action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 8: REPORTS & REVENUE ANALYSIS */}
          {activeTab === "reports" && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm shadow-slate-100/50 space-y-6">
              <div className="text-left">
                <h3 className="font-extrabold text-slate-900 text-base">📊 Báo cáo tài chính & Biểu đồ doanh thu</h3>
                <p className="text-xs text-slate-400">Thống kê doanh số theo tuần và tỷ lệ lấp đầy tổng thể của bãi đỗ.</p>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                <div className="p-5 bg-slate-50/50 border border-slate-100 rounded-xl space-y-2">
                  <p className="text-[10px] font-bold text-slate-450 uppercase">Hiệu suất lấp đầy bình quân</p>
                  <h4 className="text-2xl font-black text-slate-900">{occupancyPercent}%</h4>
                  <p className={`text-xs font-bold ${occupancyPercent > 90 ? "text-amber-600" : "text-emerald-600"}`}>
                    {occupancyPercent > 90 ? "⚠️ Bãi đỗ sắp đầy" : "🟢 Vận hành ổn định"}
                  </p>
                </div>
                <div className="p-5 bg-slate-50/50 border border-slate-100 rounded-xl space-y-2">
                  <p className="text-[10px] font-bold text-slate-450 uppercase">Lượt xe trong tháng</p>
                  <h4 className="text-2xl font-black text-slate-900">{displayMonthlyCount.toLocaleString("vi-VN")} xe</h4>
                  <p className="text-xs text-indigo-600 font-bold">🟢 Dữ liệu thời gian thực</p>
                </div>
                <div className="p-5 bg-slate-50/50 border border-slate-100 rounded-xl space-y-2">
                  <p className="text-[10px] font-bold text-slate-450 uppercase">Vé định kỳ hoạt động</p>
                  <h4 className="text-2xl font-black text-slate-900">{activePassesCount} Active</h4>
                  <p className="text-xs text-slate-400 font-bold">Chờ gia hạn tuần này: {expiringPassesCount} vé</p>
                </div>
              </div>

              {/* Beautiful Dark Mode CSS Chart */}
              <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 text-white min-h-[300px] flex flex-col justify-between shadow-inner text-left">
                <div>
                  <h4 className="font-extrabold text-[10px] text-slate-400 uppercase tracking-widest">[ DOANH THU THỰC TẾ TUẦN NÀY ]</h4>
                  <p className="text-[11px] text-slate-400 mt-1">Đơn vị thống kê: Triệu Đồng (VND)</p>
                </div>

                <div className="h-44 flex items-end justify-between gap-4 px-4 pt-6 border-b border-white/10">
                  {weeklyRevenueData.map((d, index) => {
                    const isToday = index === weeklyRevenueData.length - 1;
                    const heightPercent = maxWeeklyVal > 0 ? `${Math.max(10, Math.round((parseFloat(d.val) / maxWeeklyVal) * 100))}%` : "10%";
                    return (
                      <ChartBar
                        key={index}
                        day={d.day}
                        val={d.val}
                        height={heightPercent}
                        active={isToday}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: SETTINGS */}
          {activeTab === "settings" && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm shadow-slate-100/50 space-y-6 text-left">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">⚙️ Cấu hình nghiệp vụ bãi đỗ</h3>
                <p className="text-xs text-slate-400">Thiết lập các tham số tài chính & quy định về thời gian miễn phí cho bãi xe.</p>
              </div>

              <div className="max-w-xl space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Thời gian đỗ xe miễn phí (Phút)</label>
                    <input
                      type="number"
                      value={settings.gracePeriod}
                      onChange={e => setSettings({ ...settings, gracePeriod: parseInt(e.target.value) || 0 })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Thuế suất gia tăng VAT (%)</label>
                    <input
                      type="number"
                      value={settings.vat}
                      onChange={e => setSettings({ ...settings, vat: parseInt(e.target.value) || 0 })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tên hệ thống hiển thị</label>
                  <input
                    type="text"
                    value={settings.systemName}
                    onChange={e => setSettings({ ...settings, systemName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  onClick={async () => {
                    try {
                      const res = await staffApi.updateAdminSettings(settings);
                      setSettings(res.data.data || settings);
                      showToast("Đã lưu cài đặt hệ thống");
                    } catch (err) {
                      showToast(err.response?.data?.message || "Lưu cài đặt thất bại", "warning");
                    }
                  }}
                  className="rounded-xl bg-purple-600 hover:bg-purple-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-purple-500/10 cursor-pointer transition-colors"
                >
                  Lưu thiết lập
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* --- CÁC DIALOG MODAL CHO CÁC PHẦN CRUD KHÁC --- */}
      {/* 1. USER MODAL */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6 text-left border border-slate-200">
            <h3 className="font-extrabold text-slate-900 text-base">{isEditingUser ? "Sửa tài khoản" : "Tạo tài khoản mới"}</h3>
            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Họ và tên</label>
                <input type="text" required value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Email đăng nhập</label>
                  <input type="email" required value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Điện thoại</label>
                  <input type="text" required value={userForm.phone} onChange={e => setUserForm({ ...userForm, phone: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Phân quyền (Role)</label>
                  <select value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none bg-white">
                    <option value="driver">Driver</option>
                    <option value="staff">Staff</option>
                    <option value="security">Security</option>
                    <option value="manager">Manager</option>
                    <option value="admin">System Admin</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Trạng thái</label>
                  <select value={userForm.status} onChange={e => setUserForm({ ...userForm, status: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none bg-white">
                    <option value="active">Hoạt động</option>
                    <option value="suspended">Khóa tài khoản</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsUserModalOpen(false)} className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-3 text-xs font-bold text-slate-550 hover:bg-slate-100 transition-colors cursor-pointer">Hủy</button>
                <button type="submit" className="flex-1 rounded-xl bg-purple-600 text-white py-3 text-xs font-bold cursor-pointer transition-colors">Lưu lại</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. ZONE MODAL */}
      {isZoneModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-6 text-left border border-slate-200">
            <h3 className="font-extrabold text-slate-900 text-base">{isEditingZone ? "Sửa khu vực" : "Thêm khu vực"}</h3>
            <form onSubmit={handleSaveZone} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Tên phân khu đỗ</label>
                <input type="text" required value={zoneForm.name} onChange={e => setZoneForm({ ...zoneForm, name: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Tầng áp dụng</label>
                <select value={zoneForm.floorId} onChange={e => setZoneForm({ ...zoneForm, floorId: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none bg-white">
                  {parkingConfig.floors.map((floor) => (
                    <option key={floor.id} value={floor.id}>{floor.buildingName} · {floor.floorName}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Loại xe đỗ</label>
                  <select value={zoneForm.vehicleTypeId} onChange={e => setZoneForm({ ...zoneForm, vehicleTypeId: e.target.value, type: vehicleTypeNameById(e.target.value) })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none bg-white">
                    {parkingConfig.vehicleTypes.map((vehicleType) => (
                      <option key={vehicleType.id} value={vehicleType.id}>{vehicleType.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Sức chứa tối đa</label>
                  <input type="number" required min="1" value={zoneForm.capacity} onChange={e => setZoneForm({ ...zoneForm, capacity: parseInt(e.target.value) || 0 })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsZoneModalOpen(false)} className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-3 text-xs font-bold text-slate-550 hover:bg-slate-100 transition-colors cursor-pointer">Hủy</button>
                <button type="submit" className="flex-1 rounded-xl bg-purple-600 text-white py-3 text-xs font-bold cursor-pointer transition-colors">Lưu lại</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. GATE MODAL */}
      {isGateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-6 text-left border border-slate-200">
            <h3 className="font-extrabold text-slate-900 text-base">{isEditingGate ? "Cấu hình cổng" : "Thêm làn kiểm soát"}</h3>
            <form onSubmit={handleSaveGate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Tòa nhà</label>
                <select value={gateForm.buildingId} onChange={e => setGateForm({ ...gateForm, buildingId: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none bg-white">
                  {parkingConfig.buildings.map((building) => (
                    <option key={building.id} value={building.id}>{building.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Tên Cổng / Làn</label>
                <input type="text" required value={gateForm.name} onChange={e => setGateForm({ ...gateForm, name: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Loại Cổng</label>
                  <select value={gateForm.type} onChange={e => setGateForm({ ...gateForm, type: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none bg-white">
                    <option value="MAIN_ENTRY">CỔNG VÀO</option>
                    <option value="MAIN_EXIT">CỔNG RA</option>
                    <option value="MAIN_BOTH">HAI CHIỀU</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Camera IP Address</label>
                  <input type="text" required value={gateForm.cameraIp} onChange={e => setGateForm({ ...gateForm, cameraIp: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsGateModalOpen(false)} className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-3 text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer">Hủy</button>
                <button type="submit" className="flex-1 rounded-xl bg-purple-600 text-white py-3 text-xs font-bold cursor-pointer transition-colors">Lưu lại</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. TARIFF MODAL */}
      {isTariffModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-6 text-left border border-slate-200">
            <h3 className="font-extrabold text-slate-900 text-base">Cài đặt biểu phí mới</h3>
            <form onSubmit={handleSaveTariff} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Tòa nhà</label>
                <select value={tariffForm.buildingId} onChange={e => setTariffForm({ ...tariffForm, buildingId: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none bg-white">
                  {parkingConfig.buildings.map((building) => (
                    <option key={building.id} value={building.id}>{building.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Loại phương tiện</label>
                  <select value={tariffForm.vehicleTypeId} onChange={e => setTariffForm({ ...tariffForm, vehicleTypeId: e.target.value, vehicleType: vehicleTypeNameById(e.target.value) })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none bg-white">
                    {parkingConfig.vehicleTypes.map((vehicleType) => (
                      <option key={vehicleType.id} value={vehicleType.id}>{vehicleType.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Kiểu thu phí</label>
                  <select value={tariffForm.type} onChange={e => setTariffForm({ ...tariffForm, type: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none bg-white">
                    <option value="HOURLY">Theo Giờ</option>
                    <option value="DAILY">Theo Ngày</option>
                    <option value="MONTHLY">Cố định Tháng</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Đơn giá ({settings.currency})</label>
                <input type="number" required min="0" value={tariffForm.price} onChange={e => setTariffForm({ ...tariffForm, price: parseInt(e.target.value) || 0 })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Số phút miễn phí</label>
                <input type="number" required min="0" value={tariffForm.freeMinutes} onChange={e => setTariffForm({ ...tariffForm, freeMinutes: parseInt(e.target.value) || 0 })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsTariffModalOpen(false)} className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-3 text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer">Hủy</button>
                <button type="submit" className="flex-1 rounded-xl bg-purple-600 text-white py-3 text-xs font-bold cursor-pointer transition-colors">Lưu lại</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MONTHLY PASS MODAL */}
      {isPassModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-6 text-left border border-slate-200">
            <h3 className="font-extrabold text-slate-900 text-base">{isEditingPass ? "Sửa vé định kỳ" : "Cấp vé định kỳ mới"}</h3>
            <form onSubmit={handleSavePass} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Tài khoản khách hàng</label>
                <select required value={passForm.userId} onChange={e => { const selected = users.find((u) => u.id === e.target.value); setPassForm({ ...passForm, userId: e.target.value, owner: selected?.name || "" }); }} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none bg-white">
                  <option value="">Chọn khách hàng</option>
                  {users.map((customer) => (
                    <option key={customer.id} value={customer.id}>{customer.name} · {customer.email}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Tòa nhà</label>
                <select value={passForm.buildingId} onChange={e => setPassForm({ ...passForm, buildingId: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none bg-white">
                  {parkingConfig.buildings.map((building) => (
                    <option key={building.id} value={building.id}>{building.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Biển số đăng ký</label>
                  <input type="text" required value={passForm.plate} onChange={e => setPassForm({ ...passForm, plate: e.target.value.toUpperCase() })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Loại xe</label>
                  <select value={passForm.vehicleTypeId} onChange={e => setPassForm({ ...passForm, vehicleTypeId: e.target.value, type: vehicleTypeNameById(e.target.value) })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none bg-white">
                    {parkingConfig.vehicleTypes.map((vehicleType) => (
                      <option key={vehicleType.id} value={vehicleType.id}>{vehicleType.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Gói vé định kỳ</label>
                  <select value={passForm.passType} onChange={e => setPassForm({ ...passForm, passType: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none bg-white">
                    <option value="MONTHLY">Vé tháng</option>
                    <option value="QUARTERLY">Vé quý</option>
                    <option value="YEARLY">Vé năm</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Phí gói vé ({settings.currency})</label>
                  <input type="number" required min="0" value={passForm.fee} onChange={e => setPassForm({ ...passForm, fee: parseInt(e.target.value) || 0 })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Ngày bắt đầu</label>
                  <input type="date" required value={passForm.start} onChange={e => setPassForm({ ...passForm, start: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Ngày hết hạn</label>
                  <input type="date" required value={passForm.end} onChange={e => setPassForm({ ...passForm, end: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsPassModalOpen(false)} className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-3 text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer">Hủy</button>
                <button type="submit" className="flex-1 rounded-xl bg-purple-600 text-white py-3 text-xs font-bold cursor-pointer transition-colors">{isEditingPass ? "Lưu lại" : "Cấp vé"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENTS ---
function SidebarBtn({ label, active, onClick, collapsed, icon }) {
  return (
    <button
      onClick={onClick}
      className={`nav-link-item flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-semibold transition-all duration-200 cursor-pointer ${
        active
          ? "bg-slate-800 text-purple-400 border border-slate-700 shadow-inner"
          : "text-slate-400 hover:bg-slate-800 hover:text-white"
      }`}
    >
      <span className="flex-shrink-0">{icon}</span>
      {!collapsed && <span className="whitespace-nowrap">{label}</span>}
    </button>
  );
}

function StatCard({ title, value, icon, accentColor, subtext }) {
  return (
    <div className="stat-card-item group relative rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm shadow-slate-100/50 hover:shadow-md hover:border-slate-300 transition-all duration-300 overflow-hidden text-left">
      {/* Top accent highlight */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${accentColor}`} />

      <div className="flex items-center justify-between">
        <span className="text-xs font-extrabold uppercase tracking-wide text-slate-400 group-hover:text-slate-500 transition-colors">
          {title}
        </span>
        <span className="text-xl">{icon}</span>
      </div>

      <div className="mt-4 flex flex-col">
        <span className="text-2xl font-black text-slate-900 group-hover:scale-[1.02] origin-left transition-transform duration-300">
          {value}
        </span>
        <span className="text-[10px] font-semibold text-slate-400 mt-1">
          {subtext}
        </span>
      </div>
    </div>
  );
}

function ChartBar({ day, val, height, active }) {
  return (
    <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
      <div className="text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 px-1.5 py-0.5 rounded text-white mb-1 shadow-lg">
        {val}tr
      </div>
      <div
        className={`w-full rounded-t-lg transition-all duration-700 cursor-pointer ${
          active
            ? "bg-purple-500 shadow-lg shadow-purple-500/30"
            : "bg-slate-800 hover:bg-slate-700"
        }`}
        style={{ height }}
      />
      <span className={`text-[10px] font-extrabold mt-1 ${active ? "text-purple-400" : "text-slate-500"}`}>{day}</span>
    </div>
  );
}