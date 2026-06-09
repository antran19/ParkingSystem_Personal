// src/pages/driver/DriverDashboard.jsx

import { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import driverAvatar from "../../assets/driver-avatar.png";
import { staffApi } from "../../api/parkingApi";
import gsap from "gsap";
import ProfileTab from "./ProfileTab";
import { isValidVietnamLicensePlate, normalizeLicensePlate, LICENSE_PLATE_HINT } from "../../utils/licensePlate";

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

const IconSession = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconHistory = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

const IconProfile = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-slate-200 bg-white font-mono font-bold text-slate-800 shadow-sm text-xs tracking-widest">
    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block mr-0.5 animate-pulse"></span>
    {plate}
  </span>
);

export default function DriverDashboard({ onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [liveTime, setLiveTime] = useState("");
  const [liveDate, setLiveDate] = useState("");
  const [timerSeconds, setTimerSeconds] = useState(0); // Bắt đầu đếm từ 0 giây thực tế
  const [activeTab, setActiveTab] = useState("dashboard"); // 'dashboard', 'session', 'history', 'profile'

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
  const [newPlateInput, setNewPlateInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Tự động chuyển hướng tab
  const handleScrollTo = (tabId) => {
    if (tabId === "current-session") setActiveTab("session");
    else if (tabId === "history-table") setActiveTab("history");
    else if (tabId === "profile-vip") setActiveTab("profile");
    else setActiveTab("dashboard");
  };

  // Đọc hash fragment từ URL để chuyển tab đng khi navigate từ trang khc
  useEffect(() => {
    const hash = location.hash?.replace("#", "");
    if (hash) handleScrollTo(hash);
  }, [location.hash]);

  const loadUserData = async () => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    let plates = [];
    let activeSession = null;
    let activeReservation = null;
    let historyList = [];
    let totalAvailable = 0;

    try {
      const resPlates = await staffApi.getDriverPlates();
      plates = resPlates.data?.data || [];
    } catch (err) {
      console.error("Không thể tải biển số từ backend:", err);
      plates = [];
    }

    const reservationRes = await staffApi.getDriverReservations().catch(() => null);
    const reservations = reservationRes?.data?.data || [];
    activeReservation = reservations.find((item) => item.status === "CONFIRMED" || item.status === "PENDING") || null;

    if (activeReservation?.licensePlate && !plates.includes(activeReservation.licensePlate)) {
      plates = [...plates, activeReservation.licensePlate];
    }

    if (plates.length > 0) {
      const sessionResults = await Promise.all(
        plates.map((plate) => staffApi.getActiveSession(plate).then((res) => res.data?.data).catch(() => null))
      );
      const backendSession = sessionResults.find(Boolean);

      if (backendSession) {
        activeSession = {
          zoneCode: backendSession.zoneCode || "--",
          floor: backendSession.floorName || "--",
          area: backendSession.zoneName || "--",
          vehicle: backendSession.vehicleType || "--",
          startTime: backendSession.entryTime
            ? new Date(backendSession.entryTime).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })
            : "--",
          estimatedFee: Number(backendSession.totalFee || 0),
          status: backendSession.status === "ACTIVE" ? "Đang gửi xe" : backendSession.status,
          buildingName: "Smart Parking",
          licensePlate: backendSession.licensePlate,
          sessionCode: backendSession.sessionCode,
          createdTimestamp: backendSession.entryTime ? new Date(backendSession.entryTime).getTime() : Date.now(),
        };
        setTimerSeconds(Math.max(0, Math.floor((Date.now() - activeSession.createdTimestamp) / 1000)));
      } else {
        setTimerSeconds(0);
      }

      const historyResults = await Promise.all(
        plates.map((plate) => staffApi.getSessionHistory(plate).then((res) => res.data?.data || []).catch(() => []))
      );

      historyList = historyResults.flat().map((s, idx) => ({
        id: `${s.sessionId || s.sessionCode || idx}`,
        date: s.entryTime ? new Date(s.entryTime).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "--",
        zoneCode: s.zoneCode || "--",
        zoneName: s.zoneName || "--",
        floorName: s.floorName || "--",
        vehicle: s.vehicleType || "--",
        cost: s.totalFee ? `${Number(s.totalFee).toLocaleString("vi-VN")}đ` : "0đ",
        durationMinutes: Number(s.durationMinutes || 0),
        status: s.status === "COMPLETED" ? "Đã thanh toán" : s.status === "ACTIVE" ? "Đang gửi" : s.status || "--",
        building: "Smart Parking",
      }));
    }

    try {
      const configRes = await staffApi.getParkingConfig();
      const zones = configRes.data?.data?.zones || [];
      totalAvailable = zones.reduce((sum, z) => {
        const available = (z.capacity || 0) - (z.currentCount || 0) - (z.reservedCount || 0);
        return sum + Math.max(0, available);
      }, 0);
    } catch (err) {
      console.error("Không thể tải cấu hình zone từ backend:", err);
      totalAvailable = 0;
    }

    const totalCost = historyList.reduce((sum, h) => sum + Number(String(h.cost).replace(/[^\d]/g, "") || 0), 0);
    const totalMinutes = historyList.reduce((sum, h) => sum + (h.durationMinutes || 0), 0);

    setData({
      user: {
        id: storedUser.id,
        name: storedUser.fullName || storedUser.email || "Tài xế",
        avatar: driverAvatar,
        membership: "Tài khoản tài xế",
        vipExpiry: "--",
        licensePlates: plates,
      },
      currentSession: activeSession,
      currentBooking: activeReservation ? {
        bookingCode: activeReservation.reservationCode,
        licensePlate: activeReservation.licensePlate,
        vehicleTypeId: activeReservation.vehicleTypeId,
        vehicleType: activeReservation.vehicleTypeName,
        floor: activeReservation.floorName,
        zoneCode: activeReservation.zoneCode,
        zoneName: activeReservation.zoneName,
        status: activeReservation.status,
        createdTime: activeReservation.createdAt ? new Date(activeReservation.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "--",
        reservedTo: activeReservation.reservedTo,
      } : null,
      stats: {
        totalParking: historyList.length,
        totalHours: totalMinutes > 0 ? `${Math.round(totalMinutes / 60)} giờ` : "0 giờ",
        totalCost: `${totalCost.toLocaleString("vi-VN")}đ`,
        availableSlots: `${totalAvailable} chỗ trống`,
      },
      history: historyList,
    });
    setLoading(false);
  };

  // Thm biển số xe ln Database
  const handleAddPlate = async (e) => {
    e.preventDefault();
    const normalizedPlate = normalizeLicensePlate(newPlateInput);
    if (!normalizedPlate) return;
    if (!isValidVietnamLicensePlate(normalizedPlate)) {
      alert(LICENSE_PLATE_HINT);
      return;
    }

    try {
      await staffApi.addDriverPlate(normalizedPlate);
      setNewPlateInput("");
      await loadUserData();
      alert("Đăng k biển số xe online thành công dưới Database!");
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Lỗi đăng k biển số xe";
      alert(`Đăng k biển số thất bại: ${errorMsg}`);
    }
  };

  // Xa biển số xe khỏi Database
  const handleDeletePlate = async (plateToDelete) => {
    if (!confirm(`Bạn c chắc chắn muốn xa biển số ${plateToDelete} khỏi ti khoản không?`)) {
      return;
    }
    try {
      await staffApi.deleteDriverPlate(plateToDelete);
      await loadUserData();
      alert(`Đ xa biển số xe ${plateToDelete} thành công khỏi Database!`);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Lỗi xa biển số xe";
      alert(`Xa thất bại: ${errorMsg}`);
    }
  };

  const handleVnPayCheckout = async () => {
    if (!currentSession) return;
    if (!confirm("Bạn muốn chuyển sang VNPay sandbox để thanh toán phí ra bãi?")) return;

    try {
      const res = await staffApi.initiateVnPayCheckout({
        sessionCode: currentSession.sessionCode,
        licensePlate: currentSession.licensePlate,
      });
      const paymentUrl = res.data?.data?.paymentUrl;
      if (!paymentUrl) {
        throw new Error("Backend chưa trả về link thanh toán VNPay");
      }
      window.location.href = paymentUrl;
    } catch (err) {
      alert("❌ Không thể tạo thanh toán VNPay: " + (err.response?.data?.message || err.message));
    }
  };

  useEffect(() => {
    // Style laser scan line hiệu ứng cho QR ticket
    const styleEl = document.createElement("style");
    styleEl.innerHTML = `
      @keyframes scan {
        0% { top: 0%; }
        50% { top: 100%; }
        100% { top: 0%; }
      }
      .scanline {
        position: absolute;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, transparent, #4f46e5, transparent);
        box-shadow: 0 0 10px 1px rgba(79, 70, 229, 0.6);
        animation: scan 3.5s linear infinite;
      }
    `;
    document.head.appendChild(styleEl);

    // Đồng hồ thời gian thực
    const clockInterval = setInterval(() => {
      const now = new Date();
      setLiveTime(now.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);

    const today = new Date();
    setLiveDate(today.toLocaleDateString("vi-VN", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));

    // Đếm giây đỗ xe thực tế
    const timerInterval = setInterval(() => {
      setTimerSeconds(prev => prev + 1);
    }, 1000);

    // Nạp dữ liệu khởi tạo
    loadUserData();

    const handleStorageChange = (e) => {
      if (e.key === "user") {
        loadUserData();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    const syncInterval = setInterval(() => {
      loadUserData();
    }, 10000);

    return () => {
      clearInterval(clockInterval);
      clearInterval(timerInterval);
      clearInterval(syncInterval);
      window.removeEventListener("storage", handleStorageChange);
      document.head.removeChild(styleEl);
    };
  }, []);

  // Tự động chuyển tab khi nhận tham số scrollTo từ trang khác
  useEffect(() => {
    if (!loading && data) {
      const params = new URLSearchParams(location.search);
      const scrollToId = params.get("scrollTo");
      if (scrollToId) {
        if (scrollToId === "current-session") setActiveTab("session");
        else if (scrollToId === "history-table") setActiveTab("history");
        else if (scrollToId === "profile-vip") setActiveTab("profile");
      }
    }
  }, [location.search, loading, data]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-t-indigo-600 border-slate-200 animate-spin" />
          <p className="text-sm font-semibold tracking-wider text-slate-500">Đang tải bảng điều khiển tài xế...</p>
        </div>
      </div>
    );
  }

  const { user, currentSession, currentBooking, stats, history } = data;

  const qrPayload = currentSession ? JSON.stringify({
    type: "SESSION",
    sessionCode: currentSession.sessionCode,
    licensePlate: currentSession.licensePlate,
    vehicleType: currentSession.vehicle,
    zoneCode: currentSession.zoneCode,
    floor: currentSession.floor,
  }) : currentBooking ? JSON.stringify({
    type: "RESERVATION",
    reservationCode: currentBooking.bookingCode,
    licensePlate: currentBooking.licensePlate,
    vehicleTypeId: currentBooking.vehicleTypeId,
    vehicleType: currentBooking.vehicleType,
    zoneCode: currentBooking.zoneCode,
    floor: currentBooking.floor,
  }) : "";

  // Format Timer Seconds
  const formatTimer = (totalSecs) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Chi phí thực tế tạm tính lấy trực tiếp từ hệ thống tính phí Backend
  const realTimeFee = currentSession ? currentSession.estimatedFee : 0;

  return (
    <div ref={containerRef} className="min-h-screen bg-[#f8fafc] text-slate-900 flex font-sans">
      {/* Sidebar - Đồng bộ 100% với DriverMapping.jsx */}
      <aside
        className={`aside-panel fixed left-0 top-0 bottom-0 z-50 flex h-screen flex-col bg-slate-900 text-white shadow-xl transition-all duration-300 ${collapsed ? "w-20" : "w-72"
          }`}
      >
        <div className="flex items-center gap-3.5 px-6 py-6 border-b border-slate-800 overflow-hidden">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/20 font-black text-lg flex-shrink-0"
          >
            D
          </button>
          {!collapsed && (
            <div>
              <h1 className="text-md font-extrabold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent whitespace-nowrap">
                Smart Parking
              </h1>
              <p className="text-xs text-blue-400 font-semibold tracking-wider uppercase whitespace-nowrap">
                Cổng tài xế
              </p>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-x-hidden">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`nav-link-item w-full flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition-all duration-200 ${activeTab === "dashboard"
              ? "bg-slate-800 text-blue-400 border border-slate-700 shadow-inner"
              : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
          >
            <span className="flex-shrink-0"><IconDashboard /></span>
            {!collapsed && <span className="whitespace-nowrap">Bảng điều khiển</span>}
          </button>

          <SideLink collapsed={collapsed} to="/driver/map" icon={<IconMap />} label="Sơ đồ bãi xe" />
          <SideLink collapsed={collapsed} to="/driver/3d-map" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 16V8a2 2 0 00-1-1.732l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.732l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /><path strokeLinecap="round" strokeLinejoin="round" d="M3.3 7L12 12l8.7-5M12 22V12" /></svg>} label="Mô phỏng 3D" />

          <button
            onClick={() => setActiveTab("session")}
            className={`nav-link-item w-full flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition-all duration-200 ${activeTab === "session"
              ? "bg-slate-800 text-blue-400 border border-slate-700 shadow-inner"
              : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
          >
            <span className="flex-shrink-0"><IconSession /></span>
            {!collapsed && <span className="whitespace-nowrap">Phiên gửi xe</span>}
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`nav-link-item w-full flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition-all duration-200 ${activeTab === "history"
              ? "bg-slate-800 text-blue-400 border border-slate-700 shadow-inner"
              : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
          >
            <span className="flex-shrink-0"><IconHistory /></span>
            {!collapsed && <span className="whitespace-nowrap">Lịch sử đỗ xe</span>}
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`nav-link-item w-full flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition-all duration-200 ${activeTab === "profile"
              ? "bg-slate-800 text-blue-400 border border-slate-700 shadow-inner"
              : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
          >
            <span className="flex-shrink-0"><IconProfile /></span>
            {!collapsed && <span className="whitespace-nowrap">Hồ sơ & hội viên</span>}
          </button>
        </nav>

        <div className="border-t border-slate-800 p-4 overflow-hidden">
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 font-semibold text-rose-400 hover:bg-rose-955/30 hover:text-rose-300 transition-all duration-200"
          >
            <IconLogout />
            {!collapsed && <span className="whitespace-nowrap">Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`main-content-area flex-1 min-h-screen flex flex-col transition-all duration-300 ${collapsed ? "ml-20" : "ml-72"
          }`}
      >
        {/* Header - Đồng bộ 100% với DriverMapping.jsx */}
        <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/80 px-8 backdrop-blur-md">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-slate-900">Bảng điều khiển tài xế</h2>
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
                <p className="font-semibold text-sm text-slate-900">{user.name}</p>
                <p className="text-xs text-slate-400 font-medium">Thành viên VIP</p>
              </div>
              <img
                src={user.avatar}
                alt="avatar"
                className="h-11 w-11 rounded-xl object-cover ring-2 ring-indigo-500/20"
              />
            </div>
          </div>
        </header>

        {/* Dashboard Panels */}
        <section className="flex-1 space-y-6 p-8" style={{ minHeight: "calc(100vh - 120px)", transition: "all 0.2s ease-in-out" }}>

          {activeTab === "dashboard" && (
            <>
              {/* Welcome Banner */}
              <div className="welcome-banner relative overflow-hidden rounded-3xl bg-slate-900 p-8 text-white shadow-lg border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="absolute right-0 top-0 -mr-20 -mt-20 h-60 w-60 rounded-full bg-indigo-600/30 blur-3xl" />
                <div className="relative z-10">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-4 border border-indigo-500/30">
                    💡 Driver Hub v2
                  </span>
                  <h1 className="text-3xl font-extrabold tracking-tight">Xin chào, {user.name} 👋</h1>
                  <p className="mt-2.5 text-slate-350 text-sm leading-relaxed max-w-2xl">
                    Cập nhật thông tin phiên đỗ xe thực tế, quét mã QR vào bãi và quản lý lịch sử thông tin hội viên VIP.
                  </p>
                </div>
                {user.licensePlates.length === 0 && (
                  <div className="relative z-10 flex-shrink-0 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-xs max-w-xs">
                    <p className="font-bold text-yellow-400">💡 Chưa có biển số xe</p>
                    <p className="mt-1 text-slate-300">Vui lòng đăng ký biển số xe tại mục "Hồ sơ & Hội viên" để bắt đầu sử dụng dịch vụ.</p>
                    <button
                      onClick={() => setActiveTab("profile")}
                      className="mt-3 w-full bg-indigo-500 hover:bg-indigo-600 text-white font-black py-2 rounded-xl transition-all shadow-md shadow-indigo-500/20"
                    >
                      📋 Đăng ký biển số xe
                    </button>
                  </div>
                )}
              </div>

              {/* Stats Badges Grid */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <StatItem title="Tổng lượt đỗ" value={stats.totalParking} icon="🟢" desc="Cập nhật tự động" />
                <StatItem title="Tổng số giờ đỗ" value={stats.totalHours} icon="🕒" desc="Tích lũy từ đầu năm" />
                <StatItem title="Tổng chi tiêu" value={stats.totalCost} icon="💰" desc="Đã thanh toán online" />
                <StatItem title="Sức chứa trống" value={stats.availableSlots} icon="CAP" desc="Đề xuất zone tối ưu" />
              </div>

              {/* Main Interactive Row */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                {/* Left Content Column */}
                <div className="xl:col-span-8 space-y-8">
                  {/* Current Parking Session Summary */}
                  {currentSession ? (
                    <div className="action-panel-item rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                          </span>
                          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Phiên Đỗ Xe Đang Hoạt Động</h3>
                        </div>
                        <button
                          onClick={() => setActiveTab("session")}
                          className="text-xs font-bold text-indigo-600 hover:underline"
                        >
                          Chi tiết phiên đỗ →
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-xs font-semibold">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Vị trí đỗ</p>
                          <p className="text-sm font-black text-slate-955 mt-1">{currentSession.floor} - {currentSession.zoneCode}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Chi phí tạm tính</p>
                          <p className="text-sm font-bold text-emerald-650 mt-1">{realTimeFee.toLocaleString("vi-VN")}đ</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Đã đỗ</p>
                          <p className="text-sm font-bold text-slate-700 mt-1 font-mono">{formatTimer(timerSeconds)}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-center flex flex-col items-center justify-center py-8">
                      <div className="h-12 w-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-[10px] font-black text-slate-400 tracking-widest mb-3 shadow-inner">CAR</div>
                      <h3 className="text-xs font-bold text-slate-900">Không có xe đang gửi</h3>
                      <button
                        onClick={() => navigate("/driver/map")}
                        className="mt-3.5 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] px-4 py-2.5 shadow-md shadow-indigo-600/20 transition-all"
                      >
                        Đặt chỗ trước bãi xe →
                      </button>
                    </div>
                  )}

                  {/* Quick Parking History (Last 2 items) */}
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                      <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Lịch Sử Gửi Gần Đây</h3>
                      <button
                        onClick={() => setActiveTab("history")}
                        className="text-xs font-bold text-indigo-600 hover:underline"
                      >
                        Xem tất cả lịch sử →
                      </button>
                    </div>

                    <div className="space-y-4">
                      {history.length === 0 ? (
                        <p className="text-xs text-slate-400 font-bold italic text-center py-4">Chưa có lịch sử gửi xe nào.</p>
                      ) : (
                        history.slice(0, 2).map((item) => (
                          <div key={item.id} className="flex justify-between items-center bg-slate-50 border border-slate-150 p-4 rounded-2xl">
                            <div>
                              <p className="font-bold text-xs text-slate-900">{item.building} • <span className="text-indigo-600 font-mono font-black">{item.floorName}-{item.zoneCode}</span></p>
                              <p className="text-[10px] text-slate-450 mt-1 font-semibold">{item.date}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-extrabold text-xs text-slate-900">{item.cost}</p>
                              <span className="inline-block text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full mt-1.5 uppercase tracking-wide">
                                {item.status}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="xl:col-span-4 space-y-6">
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-6 -mr-6 w-20 h-20 bg-indigo-500/10 rounded-full blur-xl" />
                    <span className="text-[9px] font-black text-indigo-700 tracking-widest uppercase bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100 inline-block mb-4">
                      Phiên QR hiện tại
                    </span>
                    {currentSession || currentBooking ? (
                      <>
                        <h4 className="text-xs font-extrabold text-slate-900">{currentSession ? "Mã phiên gửi xe" : "Mã giữ chỗ"}</h4>
                        <p className="text-[10px] text-slate-450 font-semibold font-mono mt-0.5">{currentSession ? currentSession.sessionCode : currentBooking.bookingCode}</p>
                        <div className="my-5 relative w-40 h-40 mx-auto bg-white p-2.5 rounded-xl border border-slate-200 shadow-md flex items-center justify-center">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrPayload)}`}
                            alt="Driver QR Code"
                            className="w-full h-full object-contain rounded-lg relative z-10"
                          />
                        </div>
                        <div className="text-[10px] space-y-2.5 text-left font-semibold border-t border-slate-100 pt-3">
                          <div className="flex justify-between">
                            <span className="text-slate-450">Biển số:</span>
                            <LicensePlate plate={currentSession ? currentSession.licensePlate : currentBooking.licensePlate} />
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-450">Zone:</span>
                            <span className="font-bold text-indigo-600 font-mono">{currentSession ? currentSession.floor : currentBooking.floor} - {currentSession ? currentSession.zoneCode : currentBooking.zoneCode}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="py-8">
                        <h4 className="text-xs font-bold text-slate-955">Chưa có phiên hoặc giữ chỗ</h4>
                        <p className="mt-2 text-[11px] text-slate-500 leading-relaxed">Khi có reservation hoặc session thật từ backend, mã QR sẽ hiển thị tại đây.</p>
                      </div>
                    )}
                    <button
                      onClick={() => setActiveTab("session")}
                      className="mt-4 w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-xl text-xs transition-all"
                    >
                      Xem chi tiết phiên →
                    </button>
                  </div>

                  {/* Member Card Summary */}
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <span className="text-[9px] font-black text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-100 tracking-wider uppercase inline-block mb-3.5">
                      🌟 VIP Member
                    </span>
                    <h4 className="text-xs font-bold text-slate-900">Quyền lợi VIP hoạt động</h4>
                    <p className="text-[10px] text-slate-450 mt-1 font-semibold leading-relaxed">
                      Giảm giá 15% tất cả các lượt gửi xe và giữ chỗ trước bãi đỗ hoàn toàn miễn phí.
                    </p>
                    <button
                      onClick={() => setActiveTab("profile")}
                      className="mt-4 w-full border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2 rounded-xl text-xs transition-all"
                    >
                      Quản lý xe & hồ sơ →
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "session" && (
            <div className="space-y-8 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-slate-950 tracking-tight">Phiên gửi xe & Vé QR</h3>
                  <p className="text-xs text-slate-455 mt-1">Quản lý và sử dụng mã QR để tự động ra vào bãi đỗ xe qua trạm barrier AI.</p>
                </div>
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all animate-pulse"
                >
                  ← Bảng điều khiển chính
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Phiên gửi xe hiện tại */}
                <div className="action-panel-item lg:col-span-7">
                  {currentSession ? (
                    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-6">
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                          </span>
                          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Trạng thái gửi thực tế</h3>
                        </div>
                        <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 uppercase tracking-widest">
                          {currentSession.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-6 text-xs font-semibold">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Vị trí đỗ của bạn</p>
                          <p className="text-lg font-black text-slate-905 mt-1">{currentSession.floor} - {currentSession.zoneCode}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tòa nhà</p>
                          <p className="text-sm font-bold text-slate-800 mt-2">{currentSession.buildingName}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Phương tiện</p>
                          <p className="text-sm font-bold text-slate-800 mt-2">{currentSession.vehicle}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Thời điểm vào</p>
                          <p className="text-sm font-semibold text-slate-650 mt-2">{currentSession.startTime}</p>
                        </div>
                      </div>

                      <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-150">
                        <div className="flex items-center gap-4">
                          <div className="p-3.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 text-lg">⏱️</div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Thời gian gửi xe</span>
                            <span className="font-mono text-2xl font-black text-slate-900 tracking-widest">{formatTimer(timerSeconds)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 md:border-l md:border-slate-200 md:pl-6">
                          <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-650 border border-emerald-100 text-lg">💰</div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Chi phí tạm tính</span>
                            <span className="font-mono text-2xl font-black text-emerald-700">{realTimeFee.toLocaleString("vi-VN")}đ</span>
                          </div>
                        </div>
                      </div>

                      {/* === THANH TOÁN CHUYỂN KHOẢN REALTIME === */}
                      <div className="mt-6 pt-6 border-t border-slate-100">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-lg">💳</span>
                          <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Thanh toán khi ra bãi</h4>
                        </div>

                        {!data?.paymentConfirmed ? (
                          <div className="space-y-4">
                            {/* VietQR hiển thị */}
                            <div className="flex flex-col items-center bg-indigo-50/50 rounded-2xl border border-indigo-100 p-5">
                              <img
                                src={`https://api.vietqr.io/image/970422-0974114657-compact.png?amount=${Math.round(realTimeFee)}&addInfo=${encodeURIComponent(currentSession?.licensePlate || 'SMART PARKING')}&accountName=TRAN%20NGUYEN%20MINH%20AN`}
                                alt="VietQR Payment"
                                className="w-36 h-36 object-contain rounded-lg shadow-sm"
                                onError={(e) => {
                                  e.target.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`STK: 0974114657 | MB BANK | TRAN NGUYEN MINH AN | So tien: ${Math.round(realTimeFee)}`)}`;
                                }}
                              />
                              <div className="text-center mt-3 space-y-1">
                                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Quét QR để chuyển khoản</p>
                                <p className="text-xs font-bold text-slate-700">MB Bank - <span className="font-mono">0974114657</span></p>
                                <p className="text-xs font-semibold text-slate-500">TRAN NGUYEN MINH AN</p>
                                <p className="text-sm font-black text-indigo-600 mt-1">{Math.round(realTimeFee).toLocaleString("vi-VN")}đ</p>
                              </div>
                            </div>

                            {/* Nút thanh toán VNPay sandbox thật */}
                            <button
                              onClick={handleVnPayCheckout}
                              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-700 hover:to-cyan-600 text-white font-extrabold text-sm py-4 shadow-lg shadow-indigo-600/20 transition-all duration-200 active:scale-[0.97] cursor-pointer"
                            >
                              <span className="text-lg">💳</span>
                              Thanh toán VNPay Sandbox
                            </button>

                            {/* Nút xác nhận đã chuyển khoản */}
                            <button
                              onClick={async () => {
                                if (!confirm("Bạn đã chuyển khoản thành công? Hệ thống sẽ xác nhận và tự động check-out xe cho bạn.")) return;
                                try {
                                  await staffApi.confirmPayment({
                                    licensePlate: currentSession?.licensePlate,
                                  });
                                  // Cập nhật UI
                                  setData(prev => ({ ...prev, paymentConfirmed: true }));
                                  alert("✅ Thanh toán đã được xác nhận! Nhân viên bãi xe đã nhận thông báo. Xe của bạn sẽ được mở barrier tự động.");
                                  // Reload dữ liệu
                                  setTimeout(() => loadUserData(), 2000);
                                } catch (err) {
                                  alert("❌ Lỗi xác nhận thanh toán: " + (err.response?.data?.message || err.message));
                                }
                              }}
                              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm py-4 shadow-lg shadow-emerald-600/20 transition-all duration-200 active:scale-[0.97] cursor-pointer"
                            >
                              <span className="text-lg">✅</span>
                              Tôi đã chuyển khoản xong
                            </button>

                            <p className="text-[10px] text-slate-400 text-center font-medium leading-relaxed">
                              Sau khi bạn bấm xác nhận, nhân viên bãi xe sẽ tự động nhận thông báo <strong>real-time</strong> và mở barrier cho xe ra.
                            </p>
                          </div>
                        ) : (
                          <div className="text-center py-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-[10px] font-black tracking-widest text-emerald-600">OK</div>
                            <h4 className="font-extrabold text-emerald-800 text-sm">Thanh toán thành công!</h4>
                            <p className="text-xs text-emerald-600 mt-1">Barrier sẽ tự động mở khi bạn đến cổng ra.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm text-center py-16 flex flex-col items-center justify-center">
                      <div className="h-16 w-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-[10px] font-black text-slate-400 tracking-widest mb-4 shadow-inner">CAR</div>
                      <h3 className="text-md font-bold text-slate-900">Không có phiên gửi xe</h3>
                      <p className="text-xs text-slate-400 font-medium max-w-sm mt-1.5 leading-relaxed">
                        Bạn chưa có xe nào đỗ trong hệ thống bãi đỗ. Hãy quét QR ở trạm kiểm soát hoặc đăng ký trước.
                      </p>
                      <button
                        onClick={() => navigate("/driver/map")}
                        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 py-3 shadow-md shadow-indigo-600/20 transition-all duration-200"
                      >
                        Đến sơ đồ bãi xe ngay
                      </button>
                    </div>
                  )}
                </div>

                <div className="action-panel-item lg:col-span-5">
                  <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-6 -mr-6 w-20 h-20 bg-indigo-500/10 rounded-full blur-xl" />
                    <span className="text-[9px] font-black text-indigo-700 tracking-widest uppercase bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100 inline-block mb-4">
                      Session QR
                    </span>
                    {currentSession || currentBooking ? (
                      <>
                        <h4 className="text-md font-extrabold text-slate-900">{currentSession ? "Mã phiên gửi xe" : "Mã giữ chỗ"}</h4>
                        <p className="text-xs text-slate-400 font-semibold font-mono mt-1">{currentSession ? currentSession.sessionCode : currentBooking.bookingCode}</p>
                        <div className="my-6 relative w-48 h-48 mx-auto bg-white p-3 rounded-2xl border border-slate-200/80 shadow-md overflow-hidden flex items-center justify-center">
                          <div className="scanline" />
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrPayload)}`}
                            alt="Driver QR Code"
                            className="w-full h-full object-contain rounded-lg relative z-10"
                          />
                        </div>
                        <div className="space-y-3.5 border-t border-slate-100 pt-4 text-left text-xs font-semibold">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-450 font-bold">Chủ xe:</span>
                            <span className="text-slate-800">{user.name}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-450 font-bold">Biển số:</span>
                            <LicensePlate plate={currentSession ? currentSession.licensePlate : currentBooking.licensePlate} />
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-450 font-bold">Zone:</span>
                            <span className="font-bold text-indigo-600 font-mono">{currentSession ? currentSession.floor : currentBooking.floor} - {currentSession ? currentSession.zoneCode : currentBooking.zoneCode}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-450 font-bold">Trạng thái:</span>
                            <span className="text-emerald-600 font-extrabold">{currentSession ? currentSession.status : currentBooking.status}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="py-16 flex flex-col items-center">
                        <div className="h-16 w-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mb-4 shadow-inner text-[10px] font-black text-slate-400 tracking-widest">QR</div>
                        <h4 className="text-sm font-bold text-slate-950">Chưa có phiên hoặc giữ chỗ</h4>
                        <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed max-w-[240px]">
                          QR chỉ xuất hiện khi có session hoặc reservation thật từ backend.
                        </p>
                      </div>
                    )}
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-4 border-t border-slate-100 pt-3">
                      Mã QR lấy từ dữ liệu thật của hệ thống.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-8 animate-fadeIn">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-black text-slate-950 tracking-tight">Lịch sử gửi xe của bạn</h3>
                  <p className="text-xs text-slate-455 mt-1">Truy lục, kiểm soát toàn bộ lịch sử chi tiêu và thời gian gửi xe tại hệ thống bãi đỗ.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveTab("dashboard")}
                    className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all whitespace-nowrap"
                  >
                    ← Bảng điều khiển chính
                  </button>
                </div>
              </div>

              {/* Lịch Sử Gửi Xe Expanded */}
              <div className="action-panel-item rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-6">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="🔍 Tìm kiếm theo cơ sở hoặc vị trí đỗ (Ví dụ: FPT Landmark)..."
                    className="w-full md:max-w-md rounded-xl border border-slate-200 px-4 py-2.5 outline-none text-xs font-semibold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all bg-slate-50 text-slate-800"
                  />
                  <div className="text-[10px] font-black text-slate-500 bg-slate-100 px-3.5 py-2 rounded-xl">
                    TỔNG LƯỢT ĐỖ: {history.length} LƯỢT
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-150 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="pb-3 pl-2">Thời Gian Vào</th>
                        <th className="pb-3">Cơ Sở</th>
                        <th className="pb-3">Vị Trí Đỗ</th>
                        <th className="pb-3">Phương Tiện</th>
                        <th className="pb-3">Chi Phí</th>
                        <th className="pb-3 text-right pr-2">Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {history.filter(item =>
                        item.building.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        `${item.floorName} ${item.zoneCode} ${item.zoneName}`.toLowerCase().includes(searchTerm.toLowerCase())
                      ).length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-slate-400 font-bold italic">
                            Không tìm thấy dữ liệu đỗ xe phù hợp.
                          </td>
                        </tr>
                      ) : (
                        history
                          .filter(item =>
                            item.building.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            `${item.floorName} ${item.zoneCode} ${item.zoneName}`.toLowerCase().includes(searchTerm.toLowerCase())
                          )
                          .map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors duration-150">
                              <td className="py-4 pl-2 font-mono font-medium text-slate-500">{item.date}</td>
                              <td className="py-4 font-bold text-slate-900">{item.building}</td>
                              <td className="py-4 font-mono text-indigo-600 font-bold">{item.floorName}-{item.zoneCode}</td>
                              <td className="py-4 text-slate-650">{item.vehicle || "Xe ô tô"}</td>
                              <td className="py-4 font-bold text-slate-900">{item.cost}</td>
                              <td className="py-4 text-right pr-2">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-1 text-[10px] font-black text-emerald-700 uppercase tracking-wider">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                  {item.status}
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

          {activeTab === "profile" && (
            <ProfileTab
              user={user}
              newPlateInput={newPlateInput}
              setNewPlateInput={setNewPlateInput}
              handleAddPlate={handleAddPlate}
              handleDeletePlate={handleDeletePlate}
              setActiveTab={setActiveTab}
              loadUserData={loadUserData}
            />
          )}
        </section>
      </main>
    </div>
  );
}

// Side Navigation helper components
function SideLink({ to, icon, label, active, collapsed }) {
  return (
    <Link
      to={to}
      className={`nav-link-item flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition-all duration-200 ${active
        ? "bg-slate-800 text-blue-400 border border-slate-700 shadow-inner"
        : "text-slate-400 hover:bg-slate-800 hover:text-white"
        }`}
    >
      <span className="flex-shrink-0">{icon}</span>
      {!collapsed && <span className="whitespace-nowrap">{label}</span>}
    </Link>
  );
}

function ButtonLink({ icon, label, collapsed, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 rounded-xl px-4 py-3 font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-200"
    >
      <span className="flex-shrink-0">{icon}</span>
      {!collapsed && <span className="whitespace-nowrap">{label}</span>}
    </button>
  );
}

function StatItem({ title, value, icon, desc }) {
  return (
    <div className="stat-card-item rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{title}</span>
        <span className="text-md bg-slate-50 p-2 rounded-xl border border-slate-100">{icon}</span>
      </div>
      <div className="mt-4 flex flex-col">
        <span className="text-2xl font-black text-slate-900 font-mono">{value}</span>
        <span className="text-[10px] font-semibold text-slate-400 mt-1">{desc}</span>
      </div>
    </div>
  );
}
