import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { staffApi } from "../../api/parkingApi";
import ParkingDigitalTwin3D from "./ParkingDigitalTwin3D";
import gsap from "gsap";

// Custom SVG Icons for unified premium design (consistent with staff and driver dashboards)
const IconDashboard = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const IconLayout = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

const IconPricing = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconGates = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const IconReports = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H3a2 2 0 01-2-2V5a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1a2 2 0 002 2h4a2 2 0 012 2v6a2 2 0 01-2 2z" />
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

const IconBell = () => (
  <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const IconSettings = () => (
  <svg className="w-6 h-6 text-slate-500 hover:rotate-45 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 01-6 0z" />
  </svg>
);

const LicensePlate = ({ plate }) => (
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-slate-300 bg-white font-mono font-bold text-slate-800 shadow-sm text-xs tracking-widest">
    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block mr-1"></span>
    {plate}
  </span>
);

export default function ManagerDashboard({ onLogout }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);

  // Date time states
  const [liveDate, setLiveDate] = useState("");
  const [liveTime, setLiveTime] = useState("");

  // GSAP Animation container reference
  const containerRef = useRef(null);

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

  // Real-time states loaded from backend
  const [buildings, setBuildings] = useState([]);

  const [zones, setZones] = useState([]);
  const [parkingConfig, setParkingConfig] = useState({ buildings: [], floors: [], vehicleTypes: [] });

  const [priceRules, setPriceRules] = useState([]);

  const [sessions, setSessions] = useState([]);

  // Gates State
  const [gates, setGates] = useState([]);

  // Barrier Event Log State
  const [gateLogs] = useState([]);

  // Action states
  const [newZone, setNewZone] = useState({ buildingId: "b1", floor: "Tầng B1", name: "", type: "XE_MAY", capacity: 100, priceRuleId: "pr1" });
  const [editingPrice, setEditingPrice] = useState(null);
  const [toast, setToast] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sessionSearch, setSessionSearch] = useState("");

  // Live clock widget
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      setLiveDate(d.toLocaleDateString("vi-VN", options));
      setLiveTime(d.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const syncFromBackend = async () => {
    try {
      const res = await staffApi.getParkingConfig();
      const config = res.data.data || {};
      setParkingConfig({
        buildings: config.buildings || [],
        floors: config.floors || [],
        vehicleTypes: config.vehicleTypes || [],
      });

      const mappedZones = (config.zones || []).map(z => ({
        id: z.id,
        buildingId: z.buildingId || config.buildings?.[0]?.id || "",
        floorId: z.floorId,
        vehicleTypeId: z.vehicleTypeId,
        floor: z.floorName ? `Tầng ${z.floorName}` : "Tầng B1",
        name: z.zoneName || `Khu ${z.zoneCode}`,
        type: z.vehicleTypeName === "Ô tô" ? "O_TO" : "XE_MAY",
        capacity: z.capacity || 100,
        occupied: z.currentCount || 0,
        priceRuleId: z.vehicleTypeName === "Ô tô" ? "pr2" : "pr1"
      }));
      setZones(mappedZones);

      setBuildings((config.buildings || []).map(b => ({
        id: b.id,
        name: b.name || "SmartParking Tower"
      })));

      const mappedGates = (config.gates || []).map(g => ({
        id: g.id,
        code: g.gateCode || "G-GATE",
        name: g.gateName || "Cổng chính",
        type: g.gateType || "MAIN_ENTRY",
        status: g.isActive === false ? "INACTIVE" : "ACTIVE",
        buildingId: g.buildingId || config.buildings?.[0]?.id || ""
      }));
      setGates(mappedGates);

      const pricing = (config.pricingRules || []).map(r => ({
        id: r.id,
        name: `${r.vehicleTypeName || "Phương tiện"} · ${r.pricingType || "HOURLY"}`,
        vehicleType: r.vehicleTypeName === "Ô tô" ? "O_TO" : "XE_MAY",
        vehicleTypeId: r.vehicleTypeId,
        buildingId: r.buildingId,
        pricingType: r.pricingType || "HOURLY",
        hourlyRate: r.pricingType === "HOURLY" ? Number(r.pricePerUnit || 0) : 0,
        bookingRate: r.pricingType === "DAILY" ? Number(r.pricePerUnit || 0) : 0,
        monthlyRate: r.pricingType === "MONTHLY" ? Number(r.pricePerUnit || 0) : 0,
        freeMinutes: r.freeMinutes || 0,
      }));
      setPriceRules(pricing);
    } catch (err) {
      console.warn("Manager: Failed to sync config from backend", err);
    }
  };

  // Đồng bộ sức chứa thực tế từ backend (cùng nguồn với Staff/Driver)
  // Đồng bộ toàn bộ dữ liệu cấu hình & trạng thái thực tế từ Backend (xóa bỏ dữ liệu giả lập lệch pha)
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await staffApi.getAllSessionsHistory();
        const backendSessions = res.data.data;
        if (backendSessions && Array.isArray(backendSessions)) {
          const formattedSessions = backendSessions.map(s => ({
            id: s.sessionId || `s_${s.sessionCode}`,
            plate: s.licensePlate,
            building: "SmartParking Tower",
            zone: s.floorName && s.zoneName ? `${s.floorName} - ${s.zoneName}` : s.zoneName || "—",
            type: s.driverType || "WALK_IN",
            entryTime: s.entryTime ? new Date(s.entryTime).toLocaleString("vi-VN") : "—",
            exitTime: s.exitTime ? new Date(s.exitTime).toLocaleString("vi-VN") : "",
            checkIn: s.entryTime ? new Date(s.entryTime).toLocaleString("vi-VN") : "—",
            checkOut: s.exitTime ? new Date(s.exitTime).toLocaleString("vi-VN") : "",
            fee: s.totalFee || 0,
            status: s.status || (s.exitTime ? "COMPLETED" : "ACTIVE")
          }));
          setSessions(formattedSessions);
        }
      } catch (err) {
        console.warn("Manager: Failed to fetch sessions from backend", err);
      }
    };

    // Thực thi ngay lập tức lần đầu
    syncFromBackend();
    fetchSessions();

    // Thiết lập chu kỳ cập nhật tự động mỗi 5 giây
    const intervalId = setInterval(() => {
      syncFromBackend();
      fetchSessions();
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  const triggerToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const managerTypeToVehicleName = (managerType) => managerType === "O_TO" ? "Ô tô" : "Xe máy";
  const vehicleTypeIdFor = (managerType) => {
    const vehicleName = managerTypeToVehicleName(managerType);
    return parkingConfig.vehicleTypes.find(v => v.name === vehicleName)?.id || parkingConfig.vehicleTypes[0]?.id || "";
  };
  const floorIdFor = (floorLabel) => {
    const floorName = String(floorLabel || "").replace("Tầng ", "");
    return parkingConfig.floors.find(f => f.floorName === floorName)?.id || parkingConfig.floors[0]?.id || "";
  };
  const defaultBuildingId = () => parkingConfig.buildings[0]?.id || buildings[0]?.id || "";

  const toggleGateStatus = async (gateId, currentStatus) => {
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await staffApi.updateGate(gateId, { isActive: newStatus === "ACTIVE" });
      setGates(gates.map(g => g.id === gateId ? { ...g, status: newStatus } : g));
      triggerToast(`Đã ${newStatus === "ACTIVE" ? "kích hoạt" : "tạm dừng"} cổng`, "success");
    } catch (err) {
      triggerToast(err.response?.data?.message || "Cập nhật trạng thái cổng thất bại", "error");
    }
  };

  const handleAddZone = async (e) => {
    e.preventDefault();
    try {
      await staffApi.createZone({
        floorId: floorIdFor(newZone.floor),
        vehicleTypeId: vehicleTypeIdFor(newZone.type),
        zoneCode: newZone.name.trim().toUpperCase().replace(/\s+/g, "-").slice(0, 20),
        zoneName: newZone.name,
        capacity: newZone.capacity,
        status: "ACTIVE"
      });
      await syncFromBackend();
      setNewZone({ buildingId: defaultBuildingId(), floor: "Tầng B1", name: "", type: "XE_MAY", capacity: 100, priceRuleId: "pr1" });
      triggerToast("Đã tạo zone mới thành công", "success");
    } catch (err) {
      triggerToast(err.response?.data?.message || "Tạo zone thất bại", "error");
    }
  };

  const handleDeleteZone = async (id, name) => {
    if (!window.confirm(`Xóa khu vực ${name}?`)) return;
    try {
      await staffApi.deleteZone(id);
      await syncFromBackend();
      triggerToast(`Đã xóa ${name}`, "success");
    } catch (err) {
      triggerToast(err.response?.data?.message || "Xóa zone thất bại", "error");
    }
  };

  const handlePriceUpdate = async (e) => {
    e.preventDefault();
    try {
      const rate = editingPrice.pricingType === "MONTHLY"
        ? editingPrice.monthlyRate
        : editingPrice.pricingType === "DAILY"
          ? editingPrice.bookingRate
          : editingPrice.hourlyRate;
      await staffApi.updatePricingRule(editingPrice.id, {
        pricingType: editingPrice.pricingType,
        pricePerUnit: rate,
        freeMinutes: editingPrice.freeMinutes || 0
      });
      await syncFromBackend();
      setEditingPrice(null);
      triggerToast("Đã cập nhật bảng giá", "success");
    } catch (err) {
      triggerToast(err.response?.data?.message || "Cập nhật bảng giá thất bại", "error");
    }
  };



  // Derived stats
  const totalCapacity = zones.reduce((acc, curr) => acc + curr.capacity, 0);
  const totalOccupied = zones.reduce((acc, curr) => acc + curr.occupied, 0);
  const totalFree = totalCapacity - totalOccupied;
  const occupancyPercentage = Math.round((totalOccupied / totalCapacity) * 100) || 0;

  const activeSessionsCount = sessions.filter(s => s.status === "ACTIVE").length;
  const todayRevenue = sessions
    .filter(s => s.status === "COMPLETED")
    .reduce((acc, curr) => acc + curr.fee, 0);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#f8fafc] text-slate-900 flex font-sans antialiased">

      {/* FULLSCREEN 3D DIGITAL TWIN OVERLAY — đè lên toàn bộ sidebar + header */}
      {activeTab === "digitalTwin" && (
        <div className="fixed inset-0 z-[9999] bg-[#020617]">
          <button
            onClick={() => setActiveTab("dashboard")}
            className="fixed top-5 left-5 z-[10000] flex items-center gap-2 px-5 py-2.5 rounded-xl
                       bg-white/10 hover:bg-white/20 border border-white/15
                       text-white text-xs font-bold backdrop-blur-xl transition-all cursor-pointer shadow-xl"
          >
            ← Quay lại Dashboard
          </button>
          <ParkingDigitalTwin3D
            zones={zones}
            floors={parkingConfig.floors}
            gates={gates}
            sessions={sessions}
            onRefresh={syncFromBackend}
          />
        </div>
      )}

      {/* Sidebar - Consistent Dark Glassmorphism with Staff/Driver UI */}
      <aside
        className={`aside-panel fixed left-0 top-0 bottom-0 z-50 flex h-screen flex-col bg-slate-900 text-white shadow-xl transition-all duration-300 ${collapsed ? "w-20" : "w-72"
          }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center gap-3.5 px-6 py-6 border-b border-slate-800 overflow-hidden relative">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-650 text-white shadow-md shadow-blue-500/20 font-black text-lg flex-shrink-0 cursor-pointer"
          >
            M
          </button>
          {!collapsed && (
            <div className="animate-fade-in-fast">
              <h1 className="text-md font-extrabold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent whitespace-nowrap">
                Smart Parking
              </h1>
              <p className="text-xs text-blue-400 font-semibold tracking-wider uppercase whitespace-nowrap">
                Phân hệ Quản lý
              </p>
            </div>
          )}
        </div>

        {/* Sidebar Nav links */}
        <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-x-hidden">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`nav-link-item w-full flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition-all duration-200 cursor-pointer ${activeTab === "dashboard"
                ? "bg-slate-800 text-blue-400 border border-slate-700 shadow-inner"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
          >
            <IconDashboard />
            {!collapsed && <span className="whitespace-nowrap">Bảng điều khiển</span>}
          </button>

          <button
            onClick={() => setActiveTab("digitalTwin")}
            className={`nav-link-item w-full flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition-all duration-200 cursor-pointer ${activeTab === "digitalTwin"
                ? "bg-slate-800 text-cyan-300 border border-slate-700 shadow-inner"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
          >
            <IconDigitalTwin />
            {!collapsed && <span className="whitespace-nowrap">Mô phỏng 3D</span>}
          </button>

          <button
            onClick={() => setActiveTab("layout")}
            className={`nav-link-item w-full flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition-all duration-200 cursor-pointer ${activeTab === "layout"
                ? "bg-slate-800 text-blue-400 border border-slate-700 shadow-inner"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
          >
            <IconLayout />
            {!collapsed && <span className="whitespace-nowrap">Cấu hình bãi đỗ</span>}
          </button>

          <button
            onClick={() => setActiveTab("pricing")}
            className={`nav-link-item w-full flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition-all duration-200 cursor-pointer ${activeTab === "pricing"
                ? "bg-slate-800 text-blue-400 border border-slate-700 shadow-inner"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
          >
            <IconPricing />
            {!collapsed && <span className="whitespace-nowrap">Biểu phí giá đỗ</span>}
          </button>

          <button
            onClick={() => setActiveTab("gates")}
            className={`nav-link-item w-full flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition-all duration-200 cursor-pointer ${activeTab === "gates"
                ? "bg-slate-800 text-blue-450 border border-slate-700 shadow-inner"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
          >
            <IconGates />
            {!collapsed && <span className="whitespace-nowrap">Giám sát cổng chính</span>}
          </button>

          <button
            onClick={() => setActiveTab("reports")}
            className={`nav-link-item w-full flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition-all duration-200 cursor-pointer ${activeTab === "reports"
                ? "bg-slate-800 text-blue-400 border border-slate-700 shadow-inner"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
          >
            <IconReports />
            {!collapsed && <span className="whitespace-nowrap">Phiên đỗ & Báo cáo</span>}
          </button>
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-slate-800 p-4 overflow-hidden">
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 font-semibold text-rose-400 hover:bg-rose-955/30 hover:text-rose-300 transition-all duration-200 cursor-pointer"
          >
            <IconLogout />
            {!collapsed && <span className="whitespace-nowrap">Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main Panel Area - Crisp light themed matching Staff UI */}
      <main
        className={`main-content-area flex-1 min-h-screen flex flex-col transition-all duration-300 ${collapsed ? "ml-20" : "ml-72"
          }`}
      >
        {/* Toast alerts */}
        {toast && (
          <div className="fixed right-6 top-6 z-50 animate-bounce">
            <div className={`rounded-2xl border px-6 py-4 shadow-xl flex items-center gap-3 text-xs font-bold backdrop-blur-md ${toast.type === "error"
                ? "bg-rose-50 border-rose-200 text-rose-700 shadow-rose-100"
                : "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-emerald-100"
              }`}>
              <span>{toast.type === "error" ? "❌" : "✓"}</span>
              <p>{toast.msg}</p>
            </div>
          </div>
        )}

        {/* Header - Transparent sticky glassmorphism */}
        <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/80 px-8 backdrop-blur-md">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Khu vực quản lý vận hành</h2>
            <p className="text-xs text-slate-500 mt-0.5">{liveDate}</p>
          </div>

          <div className="flex items-center gap-6">
            {/* Live Clock Widget - Identical to Staff */}
            <div className="hidden md:flex flex-col items-end border-r border-slate-200 pr-6">
              <span className="font-mono text-lg font-bold text-indigo-650 bg-indigo-50/50 px-3 py-1 rounded-lg border border-indigo-100">
                {liveTime}
              </span>
            </div>

             <div className="flex items-center gap-3">

              <button className="relative rounded-full p-2.5 hover:bg-slate-100/80 transition-colors">
                <IconBell />
                <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
              </button>

              <button className="rounded-full p-2.5 hover:bg-slate-100/80 transition-colors">
                <IconSettings />
              </button>
            </div>

            {/* Profile Info */}
            <div className="flex items-center gap-3.5 border-l border-slate-200 pl-6">
              <div className="text-right hidden sm:block">
                <p className="font-semibold text-sm text-slate-900">Quản lý Trần Hoàng</p>
                <p className="text-xs text-slate-450 font-semibold tracking-wide uppercase">Trưởng ban vận hành</p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-650 font-bold text-white shadow-md shadow-indigo-500/20">
                TH
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <section className="flex-1 space-y-8 p-8">

          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === "dashboard" && (
            <div className="space-y-8 animate-fade-in-fast">

              {/* Architecture V2 Overview card */}
              <div className="welcome-banner relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="absolute right-0 top-0 -mr-24 -mt-24 h-64 w-64 rounded-full bg-indigo-500/5 blur-3xl" />
                <div className="space-y-2 max-w-2xl relative z-10">
                  <span className="text-[10px] font-black text-indigo-650 tracking-widest bg-indigo-50 border border-indigo-100 px-3.5 py-1.5 rounded-full inline-block uppercase">
                    Cập nhật mô hình SmartParking V2
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Xin chào, Quản lý vận hành!</h3>
                  <p className="text-slate-500 leading-relaxed text-xs">
                    Phiên bản 2.0 chuyển sang mô hình counter theo <strong>Tầng & Khu vực (Zone/Floor)</strong> kết hợp <strong>Hệ thống 2 lớp cổng (Main Gate & Zone Gate)</strong> để kiểm soát tối ưu dung lượng xe qua Redis Counter và Distributed Lock.
                  </p>
                </div>
                <div className="flex gap-3 relative z-10 flex-shrink-0">
                  <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 text-center shadow-sm">
                    <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Chiếm dụng</p>
                    <p className="text-2xl font-black text-indigo-650 font-mono mt-1">{occupancyPercentage}%</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 text-center shadow-sm">
                    <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Còn trống</p>
                    <p className="text-2xl font-black text-emerald-600 font-mono mt-1">{totalFree}</p>
                  </div>
                </div>
              </div>

              {/* Stats Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="stat-card-item rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Doanh thu hôm nay</span>
                    <span className="text-sm bg-slate-50 p-2.5 rounded-xl border border-slate-200">💰</span>
                  </div>
                  <div className="mt-4 flex flex-col">
                    <span className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">{todayRevenue.toLocaleString("vi-VN")} đ</span>
                    <span className="text-[10px] font-semibold text-slate-400 mt-1">Từ các phiên đã hoàn thành</span>
                  </div>
                </div>

                <div className="stat-card-item rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Xe đang gửi thực tế</span>
                    <span className="text-sm bg-slate-50 p-2.5 rounded-xl border border-slate-200">🚗</span>
                  </div>
                  <div className="mt-4 flex flex-col">
                    <span className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">{totalOccupied} xe</span>
                    <span className="text-[10px] font-semibold text-slate-400 mt-1">Đầy {occupancyPercentage}% bãi đỗ</span>
                  </div>
                </div>

                <div className="stat-card-item rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Sức chứa định mức</span>
                    <span className="text-sm bg-slate-50 p-2.5 rounded-xl border border-slate-200">🏢</span>
                  </div>
                  <div className="mt-4 flex flex-col">
                    <span className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">{totalCapacity} chỗ đỗ</span>
                    <span className="text-[10px] font-semibold text-slate-400 mt-1">Tất cả các khu vực đỗ</span>
                  </div>
                </div>

                <div className="stat-card-item rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Phiên đang hoạt động</span>
                    <span className="text-sm bg-slate-50 p-2.5 rounded-xl border border-slate-200">⚡</span>
                  </div>
                  <div className="mt-4 flex flex-col">
                    <span className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">{activeSessionsCount} phiên</span>
                    <span className="text-[10px] font-semibold text-slate-400 mt-1">Đang hiện diện tại các zone</span>
                  </div>
                </div>
              </div>

              {/* Progress and capacity lists */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Visual zone/floor capacities monitor list */}
                <div className="lg:col-span-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                    <div>
                      <h4 className="text-md font-extrabold text-slate-900">Giám sát Công suất thực tế từng Tầng & Khu vực</h4>
                      <p className="text-[11px] text-slate-450 mt-1">Công suất counter đồng bộ tức thời từ trạm gác Barrier chính và cổng nội bộ</p>
                    </div>
                    <button
                      onClick={() => setActiveTab("gates")}
                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-150 text-[10px] font-extrabold px-3.5 py-2 rounded-xl transition-all cursor-pointer"
                    >
                      🛡️ Giám sát Cổng chính
                    </button>
                  </div>

                  <div className="space-y-6">
                    {buildings.map(b => {
                      const buildingZones = zones.filter(z => z.buildingId === b.id);
                      if (buildingZones.length === 0) return null;

                      return (
                        <div key={b.id} className="border border-slate-150 bg-slate-50/50 p-5 rounded-2xl space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                            <span className="font-extrabold text-xs text-slate-800 flex items-center gap-2">
                              🏢 {b.name}
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm">
                              {buildingZones.length} Khu vực đỗ
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {buildingZones.map(z => {
                              const pct = Math.round((z.occupied / z.capacity) * 100) || 0;
                              let barColor = "bg-emerald-500";
                              let textTone = "text-emerald-600";
                              if (pct > 75 && pct < 95) {
                                barColor = "bg-amber-500";
                                textTone = "text-amber-600";
                              } else if (pct >= 95) {
                                barColor = "bg-rose-500 animate-pulse";
                                textTone = "text-rose-600 font-black";
                              }

                              return (
                                <div key={z.id} className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 shadow-sm hover:border-slate-350 transition-colors">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="text-xs font-black text-slate-800">{z.name}</p>
                                      <p className="text-[10px] text-slate-450 font-bold mt-0.5">{z.floor} • {z.type === "XE_MAY" ? "🏍️ Xe máy" : "🚗 Ô tô"}</p>
                                    </div>
                                    <span className={`text-xs font-bold font-mono ${textTone}`}>
                                      {z.occupied} / {z.capacity}
                                    </span>
                                  </div>

                                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                                    <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                                  </div>

                                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                                    <span>Chiếm dụng: {pct}%</span>
                                    {pct >= 95 ? (
                                      <span className="text-rose-600 font-extrabold uppercase tracking-wider animate-pulse flex items-center gap-1">
                                        🔒 REDIS LOCK ACTIVE
                                      </span>
                                    ) : (
                                      <span>Còn trống: {z.capacity - z.occupied} chỗ</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right col: quick rules overview */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Tỉ Lệ Loại Vé Đang Sử Dụng</h4>
                        <p className="text-[10px] text-slate-450 font-semibold mt-0.5">Phân bổ lượng xe trong bãi theo nhóm vé</p>
                      </div>
                      <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded uppercase animate-pulse">LIVE</span>
                    </div>

                    {/* Visually stunning multi-segment progress bar representing percentage distribution */}
                    <div className="space-y-1.5 mb-5">
                      <div className="w-full bg-slate-100 rounded-full h-3 flex overflow-hidden border border-slate-200">
                        <div className="bg-slate-850 h-full transition-all cursor-help" style={{ width: "60%" }} title="Vãng lai: 60%" />
                        <div className="bg-indigo-500 h-full transition-all cursor-help" style={{ width: "25%" }} title="Đặt trước: 25%" />
                        <div className="bg-amber-500 h-full transition-all cursor-help" style={{ width: "15%" }} title="Vé định kỳ: 15%" />
                      </div>
                      <div className="flex justify-between text-[9px] font-bold text-slate-450">
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-850"></span> Vãng lai (60%)</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Đặt trước (25%)</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Định kỳ (15%)</span>
                      </div>
                    </div>

                    <div className="space-y-4 text-xs font-bold text-slate-650">

                      <div className="bg-slate-50/50 hover:bg-slate-50 p-3 rounded-xl border border-slate-200 transition-colors">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                            🚶 VÃNG LAI (Walk-in)
                          </span>
                          <span className="text-[10px] text-slate-800 font-extrabold font-mono">
                            {Math.round(totalOccupied * 0.60)} xe (60%)
                          </span>
                        </div>
                        <p className="text-[9.5px] text-slate-450 font-medium leading-relaxed">
                          Khách vãng lai không đặt trước, quét biển số và tính tiền theo giờ tại cổng.
                        </p>
                      </div>

                      <div className="bg-slate-50/50 hover:bg-slate-50 p-3 rounded-xl border border-slate-200 transition-colors">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-extrabold text-indigo-650 flex items-center gap-1.5">
                            📅 ĐẶT GIỮ CHỖ (Pre-booked)
                          </span>
                          <span className="text-[10px] text-indigo-600 font-extrabold font-mono">
                            {Math.round(totalOccupied * 0.25)} xe (25%)
                          </span>
                        </div>
                        <p className="text-[9.5px] text-slate-450 font-medium leading-relaxed">
                          Đặt chỗ trước qua ứng dụng di động, hệ thống tự động khóa giữ vị trí đỗ.
                        </p>
                      </div>

                      <div className="bg-slate-50/50 hover:bg-slate-50 p-3 rounded-xl border border-slate-200 transition-colors">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-extrabold text-amber-600 flex items-center gap-1.5">
                            🎫 VÉ ĐỊNH KỲ (Tháng/Quý/Năm)
                          </span>
                          <span className="text-[10px] text-amber-600 font-extrabold font-mono">
                            {Math.round(totalOccupied * 0.15)} xe (15%)
                          </span>
                        </div>
                        <p className="text-[9.5px] text-slate-450 font-medium leading-relaxed">
                          Các gói thuê bao dài hạn cố định (Tháng/Quý/Năm). Ưu tiên quét barie tự động vào/ra bãi.
                        </p>
                      </div>

                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-center">
                    <span className="text-3xl">🚗</span>
                    <h5 className="text-sm font-bold text-slate-800 mt-3">Giám sát Barrier & Cổng chính</h5>
                    <p className="text-xs text-slate-450 mt-1 max-w-xs mx-auto leading-relaxed font-medium">Bạn có thể kiểm tra danh sách cổng, khóa/mở cổng vận hành và theo dõi live event stream tại tab Giám sát cổng.</p>
                    <button
                      onClick={() => setActiveTab("gates")}
                      className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm shadow-indigo-600/10"
                    >
                      Truy cập Trạm giám sát
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: CONFIGURATION LAYOUT (V2) */}
          {activeTab === "layout" && (
            <div className="space-y-8 animate-fade-in-fast">

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Cấu hình Thiết lập Bãi đỗ xe (V2 Layout)</h3>
                  <p className="text-xs text-slate-500 mt-1">Cập nhật danh sách cơ sở, phân chia tầng và gán định mức sức chứa.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveTab("dashboard")}
                    className="bg-white border border-slate-200 hover:border-slate-350 hover:bg-slate-50 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-650 transition-all cursor-pointer shadow-sm"
                  >
                    ← Trở lại tổng quan
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Form thêm zone mới */}
                <div className="lg:col-span-4 rounded-3xl border border-slate-200 bg-white p-6 space-y-6 shadow-sm">
                  <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">Thêm Zone / Khu vực đỗ mới</h4>

                  <form onSubmit={handleAddZone} className="space-y-4 text-xs font-semibold text-slate-600">
                    <div className="space-y-1.5">
                      <label className="text-slate-500 font-bold block">Tòa nhà / Cơ sở:</label>
                      <select
                        value={newZone.buildingId}
                        onChange={(e) => setNewZone({ ...newZone, buildingId: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 outline-none text-slate-700 transition-all"
                      >
                        {buildings.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-slate-500 font-bold block">Vị trí tầng đỗ:</label>
                      <select
                        value={newZone.floor}
                        onChange={(e) => setNewZone({ ...newZone, floor: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 outline-none text-slate-700 transition-all"
                      >
                        {zones.length > 0 ? (
                          [...new Set(zones.map(z => z.floor))].map(f => (
                            <option key={f} value={f}>{f}</option>
                          ))
                        ) : (
                          <>
                            <option value="Tầng B1">Tầng B1</option>
                            <option value="Tầng B2">Tầng B2</option>
                            <option value="Tầng T1">Tầng T1</option>
                          </>
                        )}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-slate-500 font-bold block">Tên Zone / Khu vực (ví dụ: Khu E):</label>
                      <input
                        type="text"
                        placeholder="Nhập tên khu..."
                        value={newZone.name}
                        onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
                        required
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-slate-800 focus:border-indigo-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-slate-500 font-bold block">Phân loại phương tiện:</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setNewZone({ ...newZone, type: "XE_MAY", priceRuleId: "pr1" })}
                          className={`py-3 rounded-xl border font-black text-xs cursor-pointer transition-all ${newZone.type === "XE_MAY"
                              ? "bg-indigo-50 border-indigo-300 text-indigo-600 shadow-sm"
                              : "bg-slate-50 border-slate-200 text-slate-400"
                            }`}
                        >
                          🏍️ Xe Máy
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewZone({ ...newZone, type: "O_TO", priceRuleId: "pr2" })}
                          className={`py-3 rounded-xl border font-black text-xs cursor-pointer transition-all ${newZone.type === "O_TO"
                              ? "bg-indigo-50 border-indigo-300 text-indigo-600 shadow-sm"
                              : "bg-slate-50 border-slate-200 text-slate-400"
                            }`}
                        >
                          🚗 Ô Tô
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-slate-500 font-bold block">Sức chứa tối đa (Capacity):</label>
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        value={newZone.capacity}
                        onChange={(e) => setNewZone({ ...newZone, capacity: parseInt(e.target.value) || 1 })}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-slate-800 focus:border-indigo-500 outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3.5 rounded-xl shadow-md shadow-indigo-600/10 transition-all text-xs cursor-pointer flex items-center justify-center gap-2"
                    >
                      <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      Thêm Khu Vực Mới
                    </button>
                  </form>
                </div>

                {/* Danh sách các zone đỗ */}
                <div className="lg:col-span-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                  <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-6">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="🔍 Lọc theo tên khu đỗ hoặc tầng..."
                      className="w-full md:max-w-md rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none text-xs font-semibold focus:border-indigo-500 transition-all text-slate-700"
                    />
                    <div className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-3.5 py-2 rounded-xl uppercase tracking-wider shadow-sm">
                      TỔNG ZONE: {zones.length} KHU VỰC
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                        <tr>
                          <th className="px-4 py-3">Khu Vực</th>
                          <th className="px-4 py-3">Cơ Sở</th>
                          <th className="px-4 py-3">Vị Trí Tầng</th>
                          <th className="px-4 py-3">Loại Xe</th>
                          <th className="px-4 py-3">Chiếm Dụng / Sức Chứa</th>
                          <th className="px-4 py-3 text-right">Hành Động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-700 text-xs">
                        {zones.filter(z =>
                          z.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          z.floor.toLowerCase().includes(searchTerm.toLowerCase())
                        ).length === 0 ? (
                          <tr>
                            <td colSpan="6" className="py-8 text-center text-slate-450 font-bold italic">
                              Không tìm thấy khu đỗ nào phù hợp với từ khóa lọc.
                            </td>
                          </tr>
                        ) : (
                          zones
                            .filter(z =>
                              z.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              z.floor.toLowerCase().includes(searchTerm.toLowerCase())
                            )
                            .map((z) => {
                              const buildingName = buildings.find(b => b.id === z.buildingId)?.name || "Chưa xác định";
                              return (
                                <tr key={z.id} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-4 py-4 font-bold text-slate-900">{z.name}</td>
                                  <td className="px-4 py-4 text-slate-500 font-medium">{buildingName}</td>
                                  <td className="px-4 py-4 font-mono font-bold text-indigo-650">{z.floor}</td>
                                  <td className="px-4 py-4">
                                    <span className={`px-2.5 py-1 rounded-lg border font-black text-[9px] ${z.type === "XE_MAY"
                                        ? "bg-indigo-50 border-indigo-150 text-indigo-600"
                                        : "bg-amber-50 border-amber-150 text-amber-600"
                                      }`}>
                                      {z.type === "XE_MAY" ? "🏍️ XE MÁY" : "🚗 Ô TÔ"}
                                    </span>
                                  </td>
                                  <td className="px-4 py-4 font-mono text-slate-500">
                                    <span className="font-extrabold text-slate-800">{z.occupied}</span> / <span className="font-bold text-slate-450">{z.capacity} xe</span>
                                  </td>
                                  <td className="px-4 py-4 text-right">
                                    <button
                                      onClick={() => handleDeleteZone(z.id, z.name)}
                                      className="text-[10px] font-extrabold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 hover:border-rose-350 transition-all cursor-pointer"
                                    >
                                      🗑️ Xóa khu
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 3: PRICING CONFIG */}
          {activeTab === "pricing" && (
            <div className="space-y-8 animate-fade-in-fast">

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Cấu hình Định mức Giá vé & Biểu phí (V2)</h3>
                  <p className="text-xs text-slate-500 mt-1">Thiết lập đơn giá đỗ xe theo giờ, giá đặt chỗ trước và chu kỳ đăng ký vé tháng hội viên.</p>
                </div>
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className="bg-white border border-slate-200 hover:border-slate-350 hover:bg-slate-50 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-650 transition-all cursor-pointer shadow-sm"
                >
                  ← Trở lại tổng quan
                </button>
              </div>

              {editingPrice ? (
                // Form chỉnh sửa bảng giá
                <div className="max-w-2xl mx-auto rounded-3xl border border-slate-200 bg-white p-8 space-y-6 shadow-sm">
                  <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
                    Hiệu chỉnh Biểu Phí [ {editingPrice.name} ]
                  </h4>

                  <form onSubmit={handlePriceUpdate} className="space-y-4 text-xs font-bold text-slate-600">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-slate-500 font-bold block">Tên bảng giá:</label>
                        <input
                          type="text"
                          value={editingPrice.name}
                          onChange={(e) => setEditingPrice({ ...editingPrice, name: e.target.value })}
                          required
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-slate-800 outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-slate-500 font-bold block">Phân loại phương tiện:</label>
                        <input
                          type="text"
                          disabled
                          value={editingPrice.vehicleType === "XE_MAY" ? "🏍️ Xe Máy" : "🚗 Ô Tô"}
                          className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-3 text-slate-400 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-slate-500 font-bold block">Đơn giá giờ (đ/giờ):</label>
                        <input
                          type="number"
                          value={editingPrice.hourlyRate}
                          onChange={(e) => setEditingPrice({ ...editingPrice, hourlyRate: parseInt(e.target.value) || 0 })}
                          required
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-slate-800 outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-slate-500 font-bold block">Phí đặt giữ chỗ (đ/lượt):</label>
                        <input
                          type="number"
                          value={editingPrice.bookingRate}
                          onChange={(e) => setEditingPrice({ ...editingPrice, bookingRate: parseInt(e.target.value) || 0 })}
                          required
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-slate-800 outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-slate-500 font-bold block">Phí vé tháng (đ/30 ngày):</label>
                        <input
                          type="number"
                          value={editingPrice.monthlyRate}
                          onChange={(e) => setEditingPrice({ ...editingPrice, monthlyRate: parseInt(e.target.value) || 0 })}
                          required
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-slate-800 outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setEditingPrice(null)}
                        className="bg-white border border-slate-200 hover:border-slate-350 hover:bg-slate-50 rounded-xl px-5 py-3 font-extrabold text-slate-650 transition-colors cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 py-3 font-extrabold transition-all cursor-pointer shadow-md shadow-indigo-600/10 flex items-center gap-2"
                      >
                        <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        Áp Dụng Bảng Giá
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                // Pricing grid list
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {priceRules.map(pr => (
                    <div key={pr.id} className="rounded-3xl border border-slate-200 bg-white p-8 relative overflow-hidden flex flex-col justify-between space-y-6 shadow-sm hover:border-slate-350 transition-all duration-200">
                      <div className="absolute right-0 top-0 -mr-12 -mt-12 h-28 w-28 rounded-full bg-indigo-500/5 blur-xl" />

                      <div className="flex justify-between items-start relative z-10">
                        <div>
                          <span className={`px-2.5 py-1 rounded-lg border font-black text-[9px] ${pr.vehicleType === "XE_MAY"
                              ? "bg-indigo-50 border-indigo-150 text-indigo-600"
                              : "bg-amber-50 border-amber-150 text-amber-600"
                            }`}>
                            {pr.vehicleType === "XE_MAY" ? "🏍️ XE MÁY" : "🚗 Ô TÔ"}
                          </span>
                          <h4 className="text-lg font-black text-slate-900 mt-2.5">{pr.name}</h4>
                        </div>
                        <span className="text-2xl">{pr.vehicleType === "XE_MAY" ? "🏍️" : "🚗"}</span>
                      </div>

                      <div className="space-y-3.5 border-t border-slate-100 pt-4 text-xs font-bold text-slate-500 relative z-10">
                        <div className="flex justify-between items-center">
                          <span>Giá đỗ xe vãng lai (WALK_IN):</span>
                          <span className="text-slate-800 font-mono font-extrabold">{pr.hourlyRate.toLocaleString("vi-VN")} đ / giờ</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span>Phí đặt giữ chỗ (PRE_BOOKED):</span>
                          <span className="text-indigo-600 font-mono font-extrabold">+{pr.bookingRate.toLocaleString("vi-VN")} đ / lượt</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span>Phí hội viên tháng (MONTHLY):</span>
                          <span className="text-amber-600 font-mono font-extrabold">{pr.monthlyRate.toLocaleString("vi-VN")} đ / 30 ngày</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setEditingPrice(pr)}
                        className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-extrabold text-xs py-3 rounded-xl border border-slate-200 hover:border-slate-350 transition-all text-center cursor-pointer relative z-10 shadow-sm"
                      >
                        ⚙️ Thay Đổi Biểu Phí Bảng Giá
                      </button>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* TAB 4: REDIS GATE BARRIER MONITOR & LOGS (Replaces raw mock simulator) */}
          {activeTab === "gates" && (
            <div className="space-y-8 animate-fade-in-fast">

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">🛡️ Trạm Giám Sát Cổng Barrier & Trạng Thái Redis</h3>
                  <p className="text-xs text-slate-500 mt-1">Kiểm soát trực tuyến trạng thái các Cổng Barrier chính và cổng tầng. Quản lý trạng thái counter hiệu năng phân tán.</p>
                </div>
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className="bg-white border border-slate-200 hover:border-slate-350 hover:bg-slate-50 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-650 transition-all cursor-pointer shadow-sm"
                >
                  ← Trở lại tổng quan
                </button>
              </div>

              {/* Explain Redis counter mechanism for managers */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                  <span className="text-xs font-extrabold text-indigo-650 font-mono bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">zone:count:{`{zoneId}`}</span>
                  <h5 className="text-xs font-extrabold text-slate-900 mt-2.5">Redis Counter - Số xe hiện diện</h5>
                  <p className="text-[10px] text-slate-450 leading-relaxed mt-1 font-semibold">Tăng/giảm tự động tức thời qua câu lệnh `INCR` / `DECR` khi barrier ghi nhận xe quét mã QR hợp lệ.</p>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                  <span className="text-xs font-extrabold text-amber-600 font-mono bg-amber-50 border border-amber-100 px-2 py-0.5 rounded">zone:lock:{`{zoneId}`}</span>
                  <h5 className="text-xs font-extrabold text-slate-900 mt-2.5">Distributed Lock - Khóa chống đua</h5>
                  <p className="text-[10px] text-slate-450 leading-relaxed mt-1 font-semibold">Khi counter đạt 95%+, Redis Lock khóa tạm thời luồng pre-booked/vãng lai mới để chống trùng lặp bãi xe đầy.</p>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                  <span className="text-xs font-extrabold text-emerald-600 font-mono bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">session:qr:{`{qrCode}`}</span>
                  <h5 className="text-xs font-extrabold text-slate-900 mt-2.5">QR Cache - Xác minh siêu tốc</h5>
                  <p className="text-[10px] text-slate-450 leading-relaxed mt-1 font-semibold">Mã QR đặt chỗ được lưu trực tiếp trên RAM Redis giúp camera trạm Barrier đối soát và mở chắn trong dưới 50ms.</p>
                </div>

              </div>

              {/* Physical Gate Controls and status */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Gate controller toggle lists */}
                <div className="lg:col-span-6 rounded-3xl border border-slate-200 bg-white p-6 space-y-6 shadow-sm">
                  <div className="border-b border-slate-100 pb-3">
                    <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Hệ Thống Trạm Gác & Cổng Rào Chắn</h4>
                    <p className="text-[11px] text-slate-450 mt-0.5">Manager có quyền Kích hoạt hoặc Khóa cổng bảo trì khẩn cấp</p>
                  </div>

                  <div className="space-y-4">
                    {gates.map(g => (
                      <div key={g.id} className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-800 font-mono">{g.code}</span>
                            <span className={`text-[9px] px-2 py-0.5 rounded font-black border ${g.status === "ACTIVE"
                                ? "bg-emerald-50 border-emerald-250 text-emerald-600"
                                : "bg-rose-50 border-rose-250 text-rose-600 animate-pulse"
                              }`}>
                              {g.status === "ACTIVE" ? "🟢 ĐANG HOẠT ĐỘNG" : "🔴 BẢO TRÌ / KHÓA CỔNG"}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-bold mt-1">{g.name}</p>
                        </div>

                        <button
                          onClick={() => toggleGateStatus(g.id, g.status)}
                          className={`text-[10px] font-extrabold px-3.5 py-2 rounded-xl border transition-all cursor-pointer ${g.status === "ACTIVE"
                              ? "bg-white border-rose-200 text-rose-600 hover:bg-rose-50"
                              : "bg-indigo-600 border-indigo-700 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-650/15"
                            }`}
                        >
                          {g.status === "ACTIVE" ? "⚠️ Khóa cổng" : "⚙️ Kích hoạt"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Redis real-time counters visual monitor */}
                <div className="lg:col-span-6 rounded-3xl border border-slate-200 bg-white p-6 space-y-6 shadow-sm">
                  <div className="border-b border-slate-100 pb-3">
                    <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Redis Counter & Lock Registry</h4>
                    <p className="text-[11px] text-slate-450 mt-0.5">Trạng thái khóa phân tán đồng bộ từ DB Redis Cluster</p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-150">
                        <tr>
                          <th className="py-2.5 pl-2">Tên Redis Key</th>
                          <th className="py-2.5">Giá Trị C Counter</th>
                          <th className="py-2.5">Sức Chứa Max</th>
                          <th className="py-2.5 text-right pr-2">Distributed Lock</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                        {zones.map(z => {
                          const isLocked = z.occupied >= z.capacity;
                          return (
                            <tr key={z.id} className="hover:bg-slate-50/50">
                              <td className="py-3 pl-2 font-mono text-[10px] text-slate-500">zone:count:{z.id}</td>
                              <td className="py-3 font-mono font-bold text-slate-800">{z.occupied}</td>
                              <td className="py-3 font-mono text-slate-450">{z.capacity}</td>
                              <td className="py-3 text-right pr-2">
                                <span className={`inline-flex h-2.5 w-2.5 rounded-full ${isLocked ? "bg-rose-500 animate-ping" : "bg-slate-300"
                                  }`} title={isLocked ? "Lock Active" : "Lock Inactive"} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* Real-time gate logs stream (Nhật ký sự kiện Barrier) */}
              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                  <div>
                    <h4 className="text-md font-extrabold text-slate-900">Nhật Ký Quét Thẻ / QR Barrier (Live Gate Pass Stream)</h4>
                    <p className="text-[11px] text-slate-450 mt-1">Nhật ký sự kiện thời gian thực tại các Barrier chính và cổng phụ</p>
                  </div>
                  <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" title="Live stream active" />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-3">Thời Gian</th>
                        <th className="px-4 py-3">Biển Số Xe</th>
                        <th className="px-4 py-3">Mã Cổng</th>
                        <th className="px-4 py-3">Nội Dung Sự Kiện</th>
                        <th className="px-4 py-3 text-right">Mức Độ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700 text-xs">
                      {gateLogs.map(log => {
                        let tagColor = "bg-slate-50 text-slate-650 border-slate-200";
                        if (log.status === "WARNING") tagColor = "bg-amber-50 text-amber-700 border-amber-200";
                        if (log.status === "ERROR") tagColor = "bg-rose-50 text-rose-700 border-rose-200 animate-pulse";

                        return (
                          <tr key={log.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3.5 font-mono text-slate-450 font-bold">{log.time}</td>
                            <td className="px-4 py-3.5">
                              {log.plate === "SYSTEM" ? (
                                <span className="text-indigo-650 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded text-[10px] font-black">HỆ THỐNG</span>
                              ) : (
                                <span className="text-slate-800 font-mono font-extrabold bg-slate-100 px-2.5 py-1 rounded border border-slate-250/50 shadow-inner tracking-wider text-[11px]">{log.plate}</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 font-mono text-slate-500 font-bold">{log.gate}</td>
                            <td className="px-4 py-3.5 text-slate-600 font-medium">{log.message}</td>
                            <td className="px-4 py-3.5 text-right">
                              <span className={`px-2.5 py-1 rounded-lg border font-black text-[9px] ${tagColor}`}>
                                {log.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: REPORTS & SESSIONS HISTORY */}
          {activeTab === "reports" && (
            <div className="space-y-8 animate-fade-in-fast">

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Danh Sách Phiên Gửi Xe & Báo Cáo Doanh Thu</h3>
                  <p className="text-xs text-slate-500 mt-1">Truy tra toàn bộ lịch sử chi tiết các phiên đỗ WALK_IN, PRE_BOOKED và MONTHLY.</p>
                </div>
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className="bg-white border border-slate-200 hover:border-slate-350 hover:bg-slate-50 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-650 transition-all cursor-pointer"
                >
                  ← Trở lại tổng quan
                </button>
              </div>

              {/* Listing report details */}
              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">

                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-6">
                  <input
                    type="text"
                    value={sessionSearch}
                    onChange={(e) => setSessionSearch(e.target.value)}
                    placeholder="🔍 Tìm kiếm theo biển số xe hoặc khu vực đỗ (Ví dụ: 30A-999.99)..."
                    className="w-full md:max-w-md rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none text-xs font-semibold focus:border-indigo-500 transition-all text-slate-700"
                  />
                  <div className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-150 px-3.5 py-2 rounded-xl">
                    TỔNG SỐ LƯỢT DỮ LIỆU: {sessions.length} PHIÊN
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-3 pl-6">Biển Số Xe</th>
                        <th className="px-4 py-3">Cơ Sở</th>
                        <th className="px-4 py-3">Khu Đỗ</th>
                        <th className="px-4 py-3">Phân Loại Phiên</th>
                        <th className="px-4 py-3">Thời Gian Vào</th>
                        <th className="px-4 py-3">Thời Gian Ra</th>
                        <th className="px-4 py-3">Chi Phí</th>
                        <th className="px-4 py-3 text-right pr-6">Trạng Thế</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700 text-xs">
                      {sessions.filter(s =>
                        s.plate.toLowerCase().includes(sessionSearch.toLowerCase()) ||
                        s.zone.toLowerCase().includes(sessionSearch.toLowerCase())
                      ).length === 0 ? (
                        <tr>
                          <td colSpan="8" className="py-8 text-center text-slate-450 font-bold italic">
                            Không tìm thấy dữ liệu phiên đỗ nào phù hợp.
                          </td>
                        </tr>
                      ) : (
                        sessions
                          .filter(s =>
                            s.plate.toLowerCase().includes(sessionSearch.toLowerCase()) ||
                            s.zone.toLowerCase().includes(sessionSearch.toLowerCase())
                          )
                          .map((s) => (
                            <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 py-4 pl-6">
                                <LicensePlate plate={s.plate} />
                              </td>
                              <td className="px-4 py-4 text-slate-500 font-medium">{s.building}</td>
                              <td className="px-4 py-4 font-mono font-bold text-indigo-650">{s.zone}</td>
                              <td className="px-4 py-4">
                                <span className={`px-2.5 py-1 rounded border font-black text-[9px] ${s.type === "WALK_IN"
                                    ? "bg-slate-100 border-slate-200 text-slate-655"
                                    : s.type === "PRE_BOOKED"
                                      ? "bg-indigo-50 border-indigo-150 text-indigo-600"
                                      : "bg-amber-50 border-amber-150 text-amber-600"
                                  }`}>
                                  {s.type}
                                </span>
                              </td>
                              <td className="px-4 py-4 font-mono font-bold text-slate-450 text-[11px]">{s.checkIn}</td>
                              <td className="px-4 py-4 font-mono font-bold text-slate-450 text-[11px]">{s.checkOut || "— (Đang đỗ)"}</td>
                              <td className="px-4 py-4 font-black text-slate-900 font-mono">
                                {s.fee > 0 ? `${s.fee.toLocaleString("vi-VN")} đ` : "Miễn phí (Hội viên/Tháng)"}
                              </td>
                              <td className="px-4 py-4 text-right pr-6">
                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase border tracking-wider ${s.status === "ACTIVE"
                                    ? "bg-indigo-50 border-indigo-150 text-indigo-600"
                                    : "bg-emerald-50 border-emerald-150 text-emerald-600"
                                  }`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${s.status === "ACTIVE" ? "bg-indigo-500 animate-ping" : "bg-emerald-500"}`} />
                                  {s.status === "ACTIVE" ? "ĐANG ĐỖ" : "ĐÃ RỜI BÃI"}
                                </span>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>
          )}

        </section>

        {/* Global Footer - Sleek and clean matching style */}
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-[10px] text-slate-450 font-bold uppercase tracking-wider">
          © 2026 SmartParking Inc. Phiên Bản 2.0 • Tích Hợp Đầy Đủ Redis Counters & Distributed Zone Layout.
        </footer>
      </main>

    </div>
  );
}