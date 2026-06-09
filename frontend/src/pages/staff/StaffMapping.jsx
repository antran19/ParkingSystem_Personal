// src/pages/staff/StaffMapping.jsx

import { useEffect, useMemo, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { staffApi } from "../../api/parkingApi";
import gsap from "gsap";
import { getSortedFloorKeys } from "../driver/DriverMapping";

// Custom SVG Icons for Premium UI
const IconDashboard = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const IconMap = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
);

const IconCheckIn = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
  </svg>
);

const IconCheckOut = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconHistory = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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

const initialFloors = {};

function getVehicleLabel(type) {
  if (type === "bicycle") return "Xe đạp";
  if (type === "motorbike") return "Xe máy";
  if (type === "truck") return "Xe tải";
  return "Ô tô";
}

function getZoneAvailability(zone, isClosed) {
  if (isClosed) return 0;
  return Math.max(zone.capacity - zone.currentCount - zone.reservedCount, 0);
}

function getZoneUsagePercent(zone) {
  return Math.round((zone.currentCount / zone.capacity) * 100);
}

function getZoneStatus(zone, isClosed) {
  if (isClosed) return "closed";
  const available = Math.max(zone.capacity - zone.currentCount - zone.reservedCount, 0);
  if (available === 0 || zone.status === "FULL") return "full";
  if (zone.status === "NEAR_FULL" || available <= Math.ceil(zone.capacity * 0.1)) return "nearFull";
  return "available";
}

function getStatusLabel(status) {
  if (status === "closed") return "Đã tạm đóng";
  if (status === "available") return "Còn sức chứa";
  if (status === "nearFull") return "Sắp đầy";
  return "Đã đầy";
}

export default function StaffMapping({ onLogout }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const fullName = user.fullName || "Nguyễn Văn A";
  const userRole = user.role || "STAFF";
  const roleLabel = userRole === "STAFF" ? "Nhân viên bãi xe" : (userRole === "ADMIN" ? "Quản trị viên" : (userRole === "MANAGER" ? "Quản lý" : "Tài xế"));
  const avatarChar = fullName.charAt(0).toUpperCase();

  const [activeFloor, setActiveFloor] = useState("B1");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedZone, setSelectedZone] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [liveTime, setLiveTime] = useState(new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  const [liveDate, setLiveDate] = useState("");

  const [floors, setFloors] = useState(initialFloors);

  // Closed/Locked zones synchronized dynamically via localstorage
  const [closedZones, setClosedZones] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem("closedZones") || "[]"));
    } catch {
      return new Set();
    }
  });

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

      // 4. Stagger animate the zone cards
      gsap.fromTo(".zone-card-item", 
        { y: 35, opacity: 0, scale: 0.98 }, 
        { y: 0, opacity: 1, scale: 1, duration: 0.65, stagger: 0.07, ease: "power3.out", delay: 0.3 }
      );

      // 5. Right side control panels slide-in
      gsap.fromTo(".action-panel-item", 
        { x: 40, opacity: 0 }, 
        { x: 0, opacity: 1, duration: 0.75, ease: "power3.out", delay: 0.55 }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [activeFloor, statusFilter, typeFilter]);

  // Load Real-time configs from backend APIs
  const fetchRealtimeConfig = async () => {
    try {
      const res = await staffApi.getParkingConfig();
      const backendZones = res.data.data?.zones;
      if (backendZones && backendZones.length > 0) {
        const floorMap = {};
        backendZones.forEach(z => {
          let fName = z.floorName || "B1";
          // Đồng bộ hóa tên tầng: Backend dùng "T1" -> Client hiển thị "1" (Tầng 1)
          if (fName === "T1") {
            fName = "1";
          }
          
          if (!floorMap[fName]) {
            floorMap[fName] = [];
          }
          const vName = z.vehicleTypeName || "";
          const categoryMap = { "Xe đạp": "Khu vực Xe Đạp", "Xe máy": "Khu vực Xe Máy", "Ô tô": "Khu vực Ô Tô", "Xe tải": "Khu vực Xe Tải" };
          const iconMap = { "Xe đạp": "🚲", "Xe máy": "🏍️", "Ô tô": "🚗", "Xe tải": "🚚" };
          const typeMap = { "Xe đạp": "bicycle", "Xe máy": "motorbike", "Ô tô": "car", "Xe tải": "truck" };
          const category = categoryMap[vName] || `Khu vực ${vName}`;
          const icon = iconMap[vName] || "🚗";
          let group = floorMap[fName].find(g => g.category === category);
          if (!group) {
            group = { category, icon, zones: [] };
            floorMap[fName].push(group);
          }
          group.zones.push({
            id: z.id,
            zoneCode: `${fName}-ZONE-${z.zoneCode}`,
            name: z.zoneName,
            type: typeMap[vName] || "car",
            capacity: z.capacity,
            currentCount: z.currentCount,
            reservedCount: z.reservedCount,
            status: z.status
          });
        });

        setFloors(floorMap);
        // Tự động chọn tầng đầu tiên (thấp nhất) nếu tầng hiện tại không có trong data backend
        const sortedFloorKeys = getSortedFloorKeys(floorMap);
        if (sortedFloorKeys.length > 0 && !floorMap[activeFloor]) {
          setActiveFloor(sortedFloorKeys[0]);
        }
      }
    } catch (err) {
      console.warn("Failed to load live parking config for staff map, using fallback:", err);
    }
  };

  useEffect(() => {
    fetchRealtimeConfig();
    const configInterval = setInterval(fetchRealtimeConfig, 2000);

    const clockTimer = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);

    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setLiveDate(today.toLocaleDateString('vi-VN', options));

    // Storage event sync
    const handleStorageChange = (e) => {
      if (e.key === "closedZones") {
        setClosedZones(new Set(JSON.parse(localStorage.getItem("closedZones") || "[]")));
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // Regular polling for closedZones in same tab
    const closedSync = setInterval(() => {
      try {
        setClosedZones(new Set(JSON.parse(localStorage.getItem("closedZones") || "[]")));
      } catch {}
    }, 1500);

    return () => {
      clearInterval(configInterval);
      clearInterval(clockTimer);
      clearInterval(closedSync);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Filter Zone logic
  const filterZone = (zone) => {
    const keyword = search.toLowerCase();
    const isClosed = closedZones.has(zone.id);
    const status = getZoneStatus(zone, isClosed);

    const matchSearch =
      zone.name.toLowerCase().includes(keyword) ||
      zone.zoneCode.toLowerCase().includes(keyword);

    const matchStatus = statusFilter === "all" || status === statusFilter;
    const matchType = typeFilter === "all" || zone.type === typeFilter;

    return matchSearch && matchStatus && matchType;
  };

  // Staff action: Lock/Unlock a zone instantly (synchronizes to Driver maps real-time!)
  const handleToggleLockZone = (zoneId) => {
    const newClosed = new Set(closedZones);
    let locked = false;
    if (newClosed.has(zoneId)) {
      newClosed.delete(zoneId);
      locked = false;
    } else {
      newClosed.add(zoneId);
      locked = true;
    }
    setClosedZones(newClosed);
    localStorage.setItem("closedZones", JSON.stringify(Array.from(newClosed)));
    
    // Alert staff
    alert(`${locked ? "Khóa" : "Mở khóa"} thành công phân khu này! Trạng thái đã được đồng bộ hóa tức thì tới toàn bộ tài xế trong hệ thống.`);
    setSelectedZone(null);
  };

  const groups = floors[activeFloor] || [];

  // Calculate live badge counts
  const liveCounts = useMemo(() => {
    let available = 0;
    let occupied = 0;
    let reserved = 0;
    
    groups.forEach(group => {
      group.zones.forEach(zone => {
        const isClosed = closedZones.has(zone.id);
        if (isClosed) return;
        available += getZoneAvailability(zone, false);
        occupied += zone.currentCount || 0;
        reserved += zone.reservedCount || 0;
      });
    });

    return { available, occupied, reserved };
  }, [groups, closedZones]);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#f8fafc] text-slate-900 flex font-sans">
      {/* Sidebar */}
      <aside
        className={`aside-panel fixed left-0 top-0 bottom-0 z-50 flex h-screen flex-col bg-slate-900 text-white shadow-xl transition-all duration-300 ${
          collapsed ? "w-20" : "w-72"
        }`}
      >
        <div className="flex items-center gap-3.5 px-6 py-6 border-b border-slate-800 overflow-hidden">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/20 font-black text-lg flex-shrink-0"
          >
            P
          </button>
          {!collapsed && (
            <div className="animate-fade-in-fast">
              <h1 className="text-md font-extrabold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent whitespace-nowrap">
                Smart Parking
              </h1>
              <p className="text-xs text-blue-400 font-semibold tracking-wider uppercase whitespace-nowrap">
                Cổng nhân viên
              </p>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-x-hidden">
          <SideLink collapsed={collapsed} to="/staff/dashboard" icon={<IconDashboard />} label="Bảng điều khiển" />
          <SideLink collapsed={collapsed} to="/staff/map" icon={<IconMap />} label="Sơ đồ bãi xe" active />
          <SideLink collapsed={collapsed} to="/staff/check-in" icon={<IconCheckIn />} label="Check-in xe vào" />
          <SideLink collapsed={collapsed} to="/staff/check-out" icon={<IconCheckOut />} label="Check-out xe ra" />
          <SideLink collapsed={collapsed} to="/staff/history" icon={<IconHistory />} label="Lịch sử phiên gửi" />
          <SideLink
            collapsed={collapsed}
            to="/staff/3d-map"
            icon={(
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 16V8a2 2 0 00-1-1.732l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.732l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.3 7L12 12l8.7-5M12 22V12" />
              </svg>
            )}
            label="Mô phỏng 3D"
          />
        </nav>

        <div className="border-t border-slate-800 p-4 overflow-hidden">
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 font-semibold text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition-all duration-200"
          >
            <IconLogout />
            {!collapsed && <span className="whitespace-nowrap">Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main panel */}
      <main
        className={`main-content-area flex-1 min-h-screen flex flex-col transition-all duration-300 ${
          collapsed ? "ml-20" : "ml-72"
        }`}
      >
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/80 px-8 backdrop-blur-md">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-slate-900">Sơ đồ phân khu thực tế</h2>
            <p className="text-xs text-slate-500 mt-0.5">{liveDate}</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end border-r border-slate-200 pr-6">
              <span className="font-mono text-lg font-bold text-indigo-600 bg-indigo-50/50 px-3 py-1 rounded-lg border border-indigo-100">
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

            <div className="flex items-center gap-3.5 border-l border-slate-200 pl-6">
              <div className="text-right">
                <p className="font-semibold text-sm text-slate-900">{fullName}</p>
                <p className="text-xs text-slate-400 font-medium">{roleLabel}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 font-bold text-white shadow-md shadow-indigo-500/20">
                {avatarChar}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-8 flex-1 space-y-6">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            {/* Floor button switcher */}
            <div className="flex rounded-2xl bg-slate-200/80 p-1 border border-slate-300/30">
              {getSortedFloorKeys(floors).length > 0 ? getSortedFloorKeys(floors).map(floorKey => {
                const labelMap = { "B1": "Hầm B1", "B2": "Hầm B2", "G": "Tầng G", "1": "Tầng 1", "T1": "Tầng 1", "T2": "Tầng 2" };
                const iconMap = { "B1": "🏢", "B2": "🏢", "G": "🏠" };
                return (
                  <FloorButton
                    key={floorKey}
                    active={activeFloor === floorKey}
                    onClick={() => setActiveFloor(floorKey)}
                    icon={iconMap[floorKey] || "🏢"}
                    label={labelMap[floorKey] || `Tầng ${floorKey}`}
                  />
                );
              }) : (
                <div className="px-4 py-2 text-sm text-slate-500">Đang tải dữ liệu tầng...</div>
              )}
            </div>

            {/* Total live availability count for the current floor */}
            <div className="flex flex-wrap gap-3">
              <Badge color="green" label={`Còn sức chứa: ${liveCounts.available}`} />
              <Badge color="red" label={`Đang gửi: ${liveCounts.occupied}`} />
              <Badge color="amber" label={`Đã giữ chỗ: ${liveCounts.reserved}`} />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm phân khu hoặc mã zone..."
              className="flex-1 rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all text-sm font-medium"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 outline-none text-sm font-semibold text-slate-700 focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="available">Còn chỗ trống</option>
              <option value="nearFull">Sắp đầy</option>
              <option value="full">Đã đầy</option>
              <option value="closed">Đã tạm khóa</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 outline-none text-sm font-semibold text-slate-700 focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="all">Tất cả phương tiện</option>
              <option value="bicycle">🚲 Xe đạp</option>
              <option value="motorbike">🏍️ Xe máy</option>
              <option value="car">🚗 Ô tô</option>
              <option value="truck">🚚 Xe tải</option>
            </select>
          </div>

          {/* Bố cục 2 cột tối ưu hóa khoảng trắng và hiển thị Premium giống Driver */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            
            {/* Cột trái: Bảng thống kê các Zone */}
            <div className="lg:col-span-8 space-y-10">
              {groups.map((group) => {
                const matchedZones = group.zones.filter(filterZone);
                if (matchedZones.length === 0) return null;
                return (
                  <section key={group.category} className="space-y-6">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{group.icon}</span>
                      <h2 className="text-md font-extrabold uppercase text-slate-900 tracking-wide">
                        {group.category}
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      {matchedZones.map((zone) => {
                        const isClosed = closedZones.has(zone.id);
                        return (
                          <ZoneCard
                            key={zone.id}
                            zone={zone}
                            isClosed={isClosed}
                            onClick={() => setSelectedZone(zone)}
                          />
                        );
                      })}
                    </div>
                  </section>
                );
              })}

              {groups.length === 0 && (
                <div className="text-center py-16 text-slate-400 font-semibold">
                  Không tìm thấy cấu hình bãi xe nào phù hợp
                </div>
              )}
            </div>

            {/* Cột phải: Bản đồ dẫn đường SVG mini, biểu phí bãi đỗ & hướng dẫn sử dụng dành cho Nhân viên */}
            <div className="action-panel-item lg:col-span-4 space-y-6">
              {/* Bản đồ định vị nhanh */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <span className="text-xl">🗺️</span>
                  <h3 className="text-sm font-bold text-slate-800">Định vị nhanh ({activeFloor === "B1" || activeFloor === "B2" ? "Tầng Hầm" : "Tầng Nổi"})</h3>
                </div>
                
                {/* SVG Live Direction Map */}
                <div className="relative rounded-2xl bg-slate-900 aspect-[4/3] w-full flex items-center justify-center border border-slate-800 overflow-hidden shadow-inner">
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(79,70,229,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(79,70,229,0.05)_1px,transparent_1px)] bg-[size:16px_16px]" />
                  
                  <svg className="w-4/5 h-4/5 text-slate-600 z-10" viewBox="0 0 200 150">
                    <rect x="10" y="10" width="180" height="130" rx="8" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                    
                    <text x="25" y="25" className="fill-emerald-400 font-sans text-[7px] font-black tracking-widest">CỔNG VÀO</text>
                    <path d="M 10 30 L 40 30" stroke="#34d399" strokeWidth="1.5" />
                    
                    <text x="130" y="138" className="fill-rose-400 font-sans text-[7px] font-black tracking-widest">CỔNG RA</text>
                    <path d="M 160 120 L 190 120" stroke="#f87171" strokeWidth="1.5" />
                    
                    <line x1="85" y1="10" x2="85" y2="140" stroke="#475569" strokeWidth="1.5" strokeDasharray="3 3" />
                    
                    <g className="opacity-50">
                      <rect x="25" y="45" width="20" height="12" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1" />
                      <rect x="25" y="65" width="20" height="12" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1" />
                      <rect x="25" y="85" width="20" height="12" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1" />
                      
                      <rect x="155" y="45" width="20" height="12" rx="1.5" fill="none" stroke="#6366f1" strokeWidth="1.5" />
                      <text x="157" y="53" className="fill-indigo-400 font-mono text-[5px] font-bold">B1-B</text>
                      <rect x="155" y="65" width="20" height="12" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1" />
                      <rect x="155" y="85" width="20" height="12" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1" />
                    </g>
                    
                    <circle cx="100" cy="75" r="16" className="fill-indigo-500/10 stroke-indigo-500/30" strokeWidth="1" />
                    <text x="100" y="78" textAnchor="middle" className="fill-indigo-400 font-sans text-[8px] font-bold">Lối di chuyển</text>
                  </svg>
                  
                  <div className="absolute bottom-3 left-4 text-[9px] font-semibold text-slate-400 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Hệ thống lưu thông thông minh
                  </div>
                </div>
              </div>

              {/* Biểu phí áp dụng */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <span className="text-xl">💳</span>
                  <h3 className="text-sm font-bold text-slate-800">Biểu Phí Giữ Chỗ Áp Dụng</h3>
                </div>
                
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-500">Mô tô / Xe máy</span>
                    <span className="font-bold text-slate-800">5.000đ / lượt</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-500">Ô tô (4-7 chỗ)</span>
                    <span className="font-bold text-slate-800">15.000đ / giờ đầu</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-500">Đặt chỗ trước (Booking Fee)</span>
                    <span className="font-bold text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">Miễn phí 30 phút</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-500">Thành viên VIP hội viên</span>
                    <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">Giảm giá -20%</span>
                  </div>
                </div>
              </div>

              {/* Chỉ dẫn nghiệp vụ nhân viên */}
              <div className="rounded-3xl border border-indigo-100 bg-indigo-50/50 p-6 shadow-sm space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-600">💡 Chỉ dẫn nghiệp vụ nhân viên</h4>
                <p className="text-xs text-indigo-900/80 leading-relaxed font-medium">
                  Nhấn trực tiếp vào phân khu (zone) bất kỳ để mở hộp thoại tác nghiệp. Nhân viên có thể thực hiện <strong>Khóa / Mở khóa phân khu</strong> để đồng bộ hóa trạng thái đỗ xe trực tiếp tới các tài xế trong thời gian thực.
                </p>
              </div>
            </div>

          </div>
        </main>
      </main>

      {/* Zone Action Modal */}
      {selectedZone && (
        <ZoneModal
          zone={selectedZone}
          isClosed={closedZones.has(selectedZone.id)}
          onClose={() => setSelectedZone(null)}
          onToggleLock={() => handleToggleLockZone(selectedZone.id)}
        />
      )}
    </div>
  );
}

function SideLink({ to, icon, label, active, collapsed }) {
  return (
    <Link
      to={to}
      className={`nav-link-item flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition-all duration-200 ${
        active ? "bg-slate-800 text-blue-400 border border-slate-700 shadow-inner" : "text-slate-400 hover:bg-slate-800 hover:text-white"
      }`}
    >
      <span className="flex-shrink-0">{icon}</span>
      {!collapsed && <span className="whitespace-nowrap">{label}</span>}
    </Link>
  );
}

function FloorButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-150 cursor-pointer ${
        active ? "bg-white text-indigo-600 shadow-sm border border-slate-200" : "text-slate-500 hover:bg-white/40"
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function Badge({ color, label }) {
  const classes = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    red: "bg-rose-50 text-rose-700 border-rose-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
  };

  return (
    <div className={`rounded-full border px-4 py-2 text-[10px] font-bold uppercase tracking-wider ${classes[color]}`}>
      {label}
    </div>
  );
}

function ZoneCard({ zone, isClosed, onClick }) {
  const available = getZoneAvailability(zone, isClosed);
  const usagePercent = getZoneUsagePercent(zone);
  const status = getZoneStatus(zone, isClosed);
  
  const style = isClosed
    ? "border-slate-300 bg-slate-100 opacity-70 hover:opacity-90"
    : status === "available"
    ? "border-emerald-100 bg-white hover:border-emerald-200 hover:shadow-md hover:translate-y-[-2px]"
    : status === "nearFull"
    ? "border-amber-100 bg-amber-50/20 hover:border-amber-200 hover:shadow-md hover:translate-y-[-2px]"
    : "border-rose-100 bg-rose-50/20 hover:border-rose-200 hover:shadow-md hover:translate-y-[-2px]";

  const barColor = isClosed ? "bg-slate-400" : status === "available" ? "bg-emerald-500" : status === "nearFull" ? "bg-amber-500" : "bg-rose-500";

  return (
    <button onClick={onClick} className={`zone-card-item rounded-2xl border p-6 text-left transition-all duration-200 cursor-pointer ${style}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs font-black uppercase tracking-wider text-slate-500">{zone.zoneCode}</p>
          <h3 className="mt-1 text-lg font-black text-slate-900">{zone.name}</h3>
          <p className="mt-1 text-xs font-semibold text-slate-400">{getVehicleLabel(zone.type)}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
          isClosed ? "bg-slate-600 text-white" : status === "available" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : status === "nearFull" ? "bg-amber-50 text-amber-700 border border-amber-100" : "bg-rose-50 text-rose-700 border border-rose-100"
        }`}>
          {isClosed ? "🔒 Đã Khóa" : getStatusLabel(status)}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <MiniMetric label="Sức chứa" value={zone.capacity} />
        <MiniMetric label="Đang gửi" value={zone.currentCount} />
        <MiniMetric label="Còn lại" value={available} strong />
      </div>

      {/* Visual Progress Bar */}
      <div className="mt-5 flex items-center justify-between text-xs font-bold text-slate-500">
        <span>Tỉ lệ sử dụng</span>
        <span>{usagePercent}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${usagePercent}%` }} />
      </div>

      {/* Actual Slot Grid Map */}
      <div className="mt-5 border-t border-slate-100 pt-4">
        <div className="flex justify-between items-center mb-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phân bổ chỗ đỗ thực tế</p>
          <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500 scale-90 origin-right">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2 rounded-[2px] bg-rose-500 inline-block"></span>🔴 Đang đỗ</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2 rounded-[2px] bg-amber-400 inline-block"></span>🟡 Giữ chỗ</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2 rounded-[2px] bg-emerald-400 inline-block"></span>🟢 Trống</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {Array.from({ length: 24 }).map((_, idx) => {
            const isOccupied = idx < Math.round((zone.currentCount / zone.capacity) * 24);
            const isReserved = !isOccupied && idx < Math.round(((zone.currentCount + zone.reservedCount) / zone.capacity) * 24);
            return (
              <span
                key={idx}
                className={`w-3.5 h-3.5 rounded-[3px] inline-block border transition-all duration-200 ${
                  isClosed
                    ? "bg-slate-300 border-slate-400"
                    : isOccupied
                    ? "bg-rose-500 border-rose-600 shadow-sm"
                    : isReserved
                    ? "bg-amber-400 border-amber-500 shadow-sm animate-pulse"
                    : "bg-emerald-400 border-emerald-500"
                }`}
                title={isOccupied ? "Đang đỗ" : isReserved ? "Đã giữ chỗ trước" : "Chỗ trống"}
              />
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs font-semibold text-slate-500 border-t border-slate-100 pt-3">
        <span>Đã giữ chỗ: {zone.reservedCount}</span>
        <span>{isClosed ? "Zone đã khóa" : (available > 0 ? "Có thể đặt zone" : "Tạm hết sức chứa")}</span>
      </div>
    </button>
  );
}

function MiniMetric({ label, value, strong }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white/70 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-1 text-lg font-black ${strong ? "text-indigo-700" : "text-slate-800"}`}>{value}</p>
    </div>
  );
}

function ZoneModal({ zone, isClosed, onClose, onToggleLock }) {
  const available = getZoneAvailability(zone, isClosed);
  const usagePercent = getZoneUsagePercent(zone);
  const status = getZoneStatus(zone, isClosed);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl animate-scale-up">
        <div className="flex items-center justify-between bg-slate-900 p-6 text-white">
          <div>
            <h3 className="text-lg font-bold">Phân khu {zone.zoneCode}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{zone.name}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-white/10 text-white transition-colors cursor-pointer">
            ✕
          </button>
        </div>

        <div className="space-y-4 p-8">
          <div className={`rounded-2xl p-5 text-center border ${
            isClosed
              ? "bg-slate-100 text-slate-600 border-slate-200"
              : status === "available"
              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
              : status === "nearFull"
              ? "bg-amber-50 text-amber-700 border-amber-100"
              : "bg-rose-50 text-rose-700 border-rose-100"
          }`}>
            <div className="text-3xl mb-1">{isClosed ? "🔒" : "🟢"}</div>
            <h4 className="text-base font-bold">
              Trạng thái: {isClosed ? "Phân khu đang TẠM KHÓA" : getStatusLabel(status)}
            </h4>
            <p className="text-[11px] font-semibold text-slate-500 mt-1">
              {isClosed ? "Tài xế không thể xem và đặt chỗ tại phân khu này" : `Còn lại ${available} chỗ trống có thể sử dụng`}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4.5 pt-2">
            <InfoBlock label="Sức chứa tối đa" value={zone.capacity} />
            <InfoBlock label="Số xe đang đỗ" value={zone.currentCount} />
            <InfoBlock label="Số xe đặt trước" value={zone.reservedCount} />
            <InfoBlock label="Hiệu suất đỗ" value={`${usagePercent}%`} />
          </div>
        </div>

        <div className="flex gap-3 bg-slate-50 p-6 border-t border-slate-100">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-3 font-semibold text-slate-600 hover:bg-white text-sm transition-colors cursor-pointer"
          >
            Đóng
          </button>

          <button
            onClick={onToggleLock}
            className={`flex-1 rounded-xl py-3 font-bold text-white text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 ${
              isClosed
                ? "bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/10"
                : "bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/10"
            }`}
          >
            {isClosed ? "🔓 Mở khóa Zone" : "🔒 Khóa Zone này"}
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoBlock({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 flex justify-between items-center text-xs font-semibold">
      <span className="text-slate-500">{label}:</span>
      <span className="font-bold text-slate-900">{value}</span>
    </div>
  );
}