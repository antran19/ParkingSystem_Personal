import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { staffApi } from "../../api/parkingApi";
import gsap from "gsap";

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

const LicensePlate = ({ plate }) => (
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-slate-300 bg-white font-mono font-bold text-slate-800 shadow-sm text-[10px] tracking-widest scale-95 origin-center">
    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block mr-1"></span>
    {plate}
  </span>
);

export default function StaffDashboard({ onLogout }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const fullName = user.fullName || "Nguyễn Văn A";
  const userRole = user.role || "STAFF";
  const roleLabel = userRole === "STAFF" ? "Nhân viên bãi xe" : (userRole === "ADMIN" ? "Quản trị viên" : (userRole === "MANAGER" ? "Quản lý" : "Tài xế"));
  const avatarChar = fullName.charAt(0).toUpperCase();

  const [collapsed, setCollapsed] = useState(false);
  const [liveTime, setLiveTime] = useState(new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  const [liveDate, setLiveDate] = useState("");

  // Live Stats State from real APIs
  const [stats, setStats] = useState({
    availableSlots: 124,
    occupiedSlots: 42,
    reservedSlots: 12,
    todayCheckIn: 86,
    todayCheckOut: 64,
    revenue: "3.250.000đ",
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // GSAP Animation container reference
  const containerRef = useRef(null);

  useEffect(() => {
    // GSAP Intro animation
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

      // 7. Recent activities table slide up
      gsap.fromTo(".recent-activities-table",
        { y: 45, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.85, ease: "power3.out", delay: 0.85 }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Sync data dynamically from backend
  const syncDashboardData = async () => {
    try {
      // 1. Fetch Parking zones config to calculate live slot statuses
      const configRes = await staffApi.getParkingConfig();
      const zones = configRes.data.data?.zones || [];

      let totalCapacity = 0;
      let totalOccupied = 0;
      let totalReserved = 0;

      zones.forEach(z => {
        totalCapacity += z.capacity || 0;
        totalOccupied += z.currentCount || 0;
        totalReserved += z.reservedCount || 0;
      });

      // Synchronize with locked zones (closed zones in localstorage)
      const closedZonesArray = JSON.parse(localStorage.getItem("closedZones") || "[]");
      const closedZonesSet = new Set(closedZonesArray);
      let closedCapacity = 0;

      zones.forEach(z => {
        if (closedZonesSet.has(z.id)) {
          closedCapacity += (z.capacity - z.currentCount - z.reservedCount);
        }
      });

      const totalAvailable = Math.max(totalCapacity - totalOccupied - totalReserved - closedCapacity, 0);

      // 2. Fetch Sessions history to calculate today statistics
      const sessionsRes = await staffApi.getAllSessionsHistory();
      const rawSessions = sessionsRes.data.data || [];

      // Filter sessions for today
      const todayStr = new Date().toDateString();
      const todaySessions = rawSessions.filter(s => {
        const entryDate = s.entryTime ? new Date(s.entryTime).toDateString() : "";
        const exitDate = s.exitTime ? new Date(s.exitTime).toDateString() : "";
        return entryDate === todayStr || exitDate === todayStr;
      });

      const checkInCount = todaySessions.length;
      const checkOutCount = todaySessions.filter(s => s.status !== "ACTIVE").length;
      let todayRevSum = 0;
      todaySessions.forEach(s => {
        if (s.status !== "ACTIVE" && s.totalFee) {
          todayRevSum += Number(s.totalFee);
        }
      });

      setStats({
        availableSlots: totalAvailable,
        occupiedSlots: totalOccupied,
        reservedSlots: totalReserved,
        todayCheckIn: checkInCount,
        todayCheckOut: checkOutCount,
        revenue: `${todayRevSum.toLocaleString("vi-VN")}đ`
      });

      // 3. Populate Recent Activities table with actual backend sessions
      const sortedSessions = [...rawSessions]
        .sort((a, b) => new Date(b.entryTime || 0).getTime() - new Date(a.entryTime || 0).getTime())
        .slice(0, 5);

      const mappedActivities = sortedSessions.map(s => {
        const inDate = s.entryTime ? new Date(s.entryTime) : new Date();
        return {
          id: s.sessionCode || `PS-${s.sessionId?.slice(0, 6).toUpperCase()}`,
          time: inDate.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
          action: s.status === "ACTIVE" ? "Check-in" : "Check-out",
          vehicle: s.vehicleType || "Phương tiện",
          plate: s.licensePlate,
          slot: s.zoneCode ? `${s.floorName}-ZONE-${s.zoneCode}` : "N/A",
          status: s.status === "ACTIVE" ? "Đang gửi" : "Đã thanh toán",
        };
      });

      setRecentActivities(mappedActivities);
    } catch (err) {
      console.warn("Lỗi khi tải dữ liệu thời gian thực cho Staff Dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    syncDashboardData();
    const configInterval = setInterval(syncDashboardData, 2000);

    const clockTimer = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);

    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setLiveDate(today.toLocaleDateString('vi-VN', options));

    return () => {
      clearInterval(configInterval);
      clearInterval(clockTimer);
    };
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#f8fafc] text-slate-900 flex font-sans">
      {/* Sidebar */}
      <aside
        className={`aside-panel fixed left-0 top-0 bottom-0 z-50 flex h-screen flex-col bg-slate-900 text-white shadow-xl transition-all duration-300 ${collapsed ? "w-20" : "w-72"
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
          <SideLink collapsed={collapsed} to="/staff/dashboard" icon={<IconDashboard />} label="Bảng điều khiển" active />
          <SideLink collapsed={collapsed} to="/staff/map" icon={<IconMap />} label="Sơ đồ bãi xe" />
          <SideLink collapsed={collapsed} to="/staff/check-in" icon={<IconCheckIn />} label="Check-in xe vào" />
          <SideLink collapsed={collapsed} to="/staff/check-out" icon={<IconCheckOut />} label="Check-out xe ra" />
          <SideLink collapsed={collapsed} to="/staff/history" icon={<IconHistory />} label="Lịch sử phiên gửi" />
          <SideLink collapsed={collapsed} to="/staff/3d-map" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 16V8a2 2 0 00-1-1.732l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.732l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /><path strokeLinecap="round" strokeLinejoin="round" d="M3.3 7L12 12l8.7-5M12 22V12" /></svg>} label="Mô phỏng 3D" />
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

      {/* Main content */}
      <main
        className={`main-content-area flex-1 min-h-screen flex flex-col transition-all duration-300 ${collapsed ? "ml-20" : "ml-72"
          }`}
      >
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/80 px-8 backdrop-blur-md">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-slate-900">Bảng điều khiển tác nghiệp</h2>
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

        {/* Content Section */}
        <section className="space-y-8 p-8 flex-1">
          {/* Welcome Banner */}
          <div className="welcome-banner rounded-3xl bg-slate-950 p-8 text-white relative overflow-hidden shadow-xl">
            <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-gradient-to-l from-indigo-600/20 to-transparent pointer-events-none" />
            <h1 className="text-2xl font-bold tracking-tight">
              Xin chào ngày mới, {fullName}! 👋
            </h1>
            <p className="mt-2 text-sm text-slate-300 max-w-xl leading-relaxed">
              Chào mừng bạn đến với cổng quản trị thông tin điều phối SmartParking. Hãy theo dõi trực tiếp tình trạng các zone đỗ xe, hỗ trợ check-in xe vào và xử lý thanh toán check-out đúng quy trình.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-6">
            <StatCard title="Chỗ trống" value={stats.availableSlots} color="emerald" />
            <StatCard title="Đang có xe" value={stats.occupiedSlots} color="rose" />
            <StatCard title="Đã giữ chỗ" value={stats.reservedSlots} color="amber" />
            <StatCard title="Xe vào hôm nay" value={stats.todayCheckIn} color="blue" />
            <StatCard title="Xe ra hôm nay" value={stats.todayCheckOut} color="indigo" />
            <StatCard title="Doanh thu ngày" value={stats.revenue} color="purple" />
          </div>

          {/* Action Hub & Operation Health */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="action-panel-item rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2 space-y-4">
              <h3 className="text-base font-bold text-slate-900">Thao tác tác nghiệp nhanh</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <QuickAction
                  to="/staff/check-in"
                  title="Check-in xe vào"
                  desc="Quét mã đặt chỗ hoặc nhập biển số"
                  icon="🚗"
                />
                <QuickAction
                  to="/staff/check-out"
                  title="Check-out xe ra"
                  desc="Tính toán biểu phí & thu phí"
                  icon="💳"
                />
                <QuickAction
                  to="/staff/map"
                  title="Sơ đồ phân khu"
                  desc="Điều phối vị trí trống & khóa zone"
                  icon="🅿️"
                />
              </div>
            </div>

            <div className="action-panel-item rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900">Trạng thái vận hành IoT</h3>
              <div className="space-y-3">
                <StatusRow label="Barrier Cổng vào" status="Hoạt động" type="green" />
                <StatusRow label="Barrier Cổng ra" status="Hoạt động" type="green" />
                <StatusRow label="Cổng thanh toán QR" status="Sẵn sàng" type="green" />
                <StatusRow label="Camera AI nhận diện" status="Sẵn sàng" type="green" />
              </div>
            </div>
          </div>

          {/* Recent Operations Table */}
          <div className="recent-activities-table overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-250/60 p-6 flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Các hoạt động điều phối gần đây</h3>
              <span className="text-xs font-semibold text-indigo-650 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 animate-pulse">Cập nhật liên tục</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Thời gian</th>
                    <th className="px-6 py-4">Mã phiên</th>
                    <th className="px-6 py-4">Thao tác</th>
                    <th className="px-6 py-4">Phương tiện</th>
                    <th className="px-6 py-4">Biển số</th>
                    <th className="px-6 py-4">Vị trí đỗ</th>
                    <th className="px-6 py-4">Trạng thái</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {recentActivities.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors duration-150">
                      <td className="px-6 py-4 font-medium text-slate-550">{item.time}</td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">{item.id}</td>
                      <td className="px-6 py-4 font-bold text-slate-800">{item.action}</td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{item.vehicle}</td>
                      <td className="px-6 py-4">
                        <LicensePlate plate={item.plate} />
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-705">{item.slot}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${item.status === "Đang gửi"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}>
                          <span className={`h-1 w-1 rounded-full ${item.status === "Đang gửi" ? "bg-emerald-500" : "bg-slate-400"}`} />
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {recentActivities.length === 0 && (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-slate-400 font-semibold text-sm">
                        Không có hoạt động gửi xe nào gần đây
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function SideLink({ to, icon, label, active, collapsed }) {
  return (
    <Link
      to={to}
      className={`nav-link-item flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition-all duration-200 ${active ? "bg-slate-800 text-blue-400 border border-slate-700 shadow-inner" : "text-slate-400 hover:bg-slate-800 hover:text-white"
        }`}
    >
      <span className="flex-shrink-0">{icon}</span>
      {!collapsed && <span className="whitespace-nowrap">{label}</span>}
    </Link>
  );
}

function StatCard({ title, value, color }) {
  const styles = {
    emerald: "border-emerald-100 bg-emerald-50/30 text-emerald-700",
    rose: "border-rose-100 bg-rose-50/30 text-rose-700",
    amber: "border-amber-100 bg-amber-50/30 text-amber-700",
    blue: "border-blue-100 bg-blue-50/30 text-blue-700",
    indigo: "border-indigo-100 bg-indigo-50/30 text-indigo-700",
    purple: "border-purple-100 bg-purple-50/30 text-purple-700",
  };

  return (
    <div className={`rounded-2xl border p-5 shadow-sm space-y-2.5 transition-all hover:translate-y-[-2px] duration-200 bg-white ${styles[color] || ""}`}>
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
        {title}
      </p>
      <p className="text-xl font-black text-slate-900 tracking-tight">
        {value}
      </p>
    </div>
  );
}

function QuickAction({ title, desc, to, icon }) {
  return (
    <Link
      to={to}
      className="rounded-2xl border border-slate-200 p-5 transition-all hover:border-indigo-500 hover:bg-slate-50/50 flex flex-col group h-full shadow-sm"
    >
      <span className="text-2xl mb-3">{icon}</span>
      <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
        {title}
      </p>
      <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
        {desc}
      </p>
    </Link>
  );
}

function StatusRow({ label, status, type }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50/70 p-3.5 border border-slate-100">
      <span className="text-xs font-semibold text-slate-600">
        {label}
      </span>
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        {status}
      </span>
    </div>
  );
}