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
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-slate-350 bg-white font-mono font-bold text-slate-800 shadow-sm text-xs tracking-widest">
    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block mr-1"></span>
    {plate}
  </span>
);

export default function StaffHistory({ onLogout }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const fullName = user.fullName || "Nguyễn Văn A";
  const userRole = user.role || "STAFF";
  const roleLabel = userRole === "STAFF" ? "Nhân viên bãi xe" : (userRole === "ADMIN" ? "Quản trị viên" : (userRole === "MANAGER" ? "Quản lý" : "Tài xế"));
  const avatarChar = fullName.charAt(0).toUpperCase();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [liveTime, setLiveTime] = useState(new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  const [liveDate, setLiveDate] = useState("");

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

      // 4. Quick metrics bar staggered load
      gsap.fromTo(".stat-card-item", 
        { y: 35, opacity: 0, scale: 0.98 }, 
        { y: 0, opacity: 1, scale: 1, duration: 0.65, stagger: 0.07, ease: "power3.out", delay: 0.3 }
      );

      // 5. Search panel slide up
      gsap.fromTo(".action-panel-item", 
        { y: 40, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.75, ease: "power3.out", delay: 0.5 }
      );

      // 6. History table slide up
      gsap.fromTo(".history-table-container", 
        { y: 50, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", delay: 0.65 }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [statusFilter, typeFilter]);

  const fetchHistoryData = async () => {
    try {
      setLoading(true);
      const res = await staffApi.getAllSessionsHistory();
      const rawData = res.data.data || [];
      const formattedData = rawData.map((item, idx) => ({
        id: item.sessionCode || `PS-${item.sessionId?.slice(0, 6).toUpperCase()}`,
        plate: item.licensePlate,
        type: item.vehicleType?.toLowerCase()?.includes("máy") ? "motorbike" : "car",
        inTime: item.entryTime ? new Date(item.entryTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) + " • " + new Date(item.entryTime).toLocaleDateString("vi-VN") : "--",
        outTime: item.exitTime ? new Date(item.exitTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) + " • " + new Date(item.exitTime).toLocaleDateString("vi-VN") : "--",
        slot: item.zoneCode ? `${item.floorName}-ZONE-${item.zoneCode}` : "--",
        floor: item.floorName ? `Tầng ${item.floorName}` : "--",
        fee: item.totalFee ? `${Number(item.totalFee).toLocaleString("vi-VN")}đ` : (item.status === "ACTIVE" ? `${Number(item.baseFee).toLocaleString("vi-VN")}đ (Tạm tính)` : "--"),
        status: item.status === "ACTIVE" ? "parked" : "checked_out",
        paymentMethod: item.status === "ACTIVE" ? "--" : "QR Code / Tiền mặt",
      }));
      setHistoryList(formattedData);
    } catch (err) {
      console.error("Lỗi khi lấy lịch sử từ backend:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoryData();

    const clockTimer = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);

    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setLiveDate(today.toLocaleDateString('vi-VN', options));

    return () => {
      clearInterval(clockTimer);
    };
  }, []);

  const getVehicleLabel = (type) => {
    if (type === "car") return "🚗 Ô tô";
    if (type === "motorbike") return "🏍️ Xe máy";
    if (type === "ebike") return "⚡ Xe điện";
    return "🚲 Xe đạp";
  };

  const filteredHistory = historyList.filter((item) => {
    const keyword = search.toLowerCase();
    const matchSearch =
      item.plate.toLowerCase().includes(keyword) ||
      item.id.toLowerCase().includes(keyword) ||
      item.slot.toLowerCase().includes(keyword);

    const matchStatus = statusFilter === "all" || item.status === statusFilter;
    const matchType = typeFilter === "all" || item.type === typeFilter;

    return matchSearch && matchStatus && matchType;
  });

  return (
    <div ref={containerRef} className="min-h-screen bg-[#f8fafc] text-slate-900 flex font-sans">
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

        {/* Sidebar Nav */}
        <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-x-hidden">
          <SideLink collapsed={collapsed} to="/staff/dashboard" icon={<IconDashboard />} label="Bảng điều khiển" />
          <SideLink collapsed={collapsed} to="/staff/map" icon={<IconMap />} label="Sơ đồ bãi xe" />
          <SideLink collapsed={collapsed} to="/staff/check-in" icon={<IconCheckIn />} label="Check-in xe vào" />
          <SideLink collapsed={collapsed} to="/staff/check-out" icon={<IconCheckOut />} label="Check-out xe ra" />
          <SideLink collapsed={collapsed} to="/staff/history" icon={<IconHistory />} label="Lịch sử phiên gửi" active />
          <SideLink collapsed={collapsed} to="/staff/3d-map" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 16V8a2 2 0 00-1-1.732l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.732l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /><path strokeLinecap="round" strokeLinejoin="round" d="M3.3 7L12 12l8.7-5M12 22V12" /></svg>} label="Mô phỏng 3D" />
        </nav>

        {/* Sidebar Footer */}
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

      {/* Main Panel */}
      <main
        className={`main-content-area flex-1 min-h-screen flex flex-col transition-all duration-300 ${
          collapsed ? "ml-20" : "ml-72"
        }`}
      >
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/80 px-8 backdrop-blur-md">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-slate-900">Lịch sử phiên gửi xe</h2>
            <p className="text-xs text-slate-500 mt-0.5">{liveDate}</p>
          </div>

          <div className="flex items-center gap-6">
            {/* Live Clock Widget */}
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

            {/* Profile Avatar */}
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
        <section className="flex-1 space-y-6 p-8">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard title="Tổng doanh thu hôm nay" value="301.000đ" sub="Tính từ 00:00" color="indigo" />
            <MetricCard title="Tổng số lượt gửi xe" value="142 lượt" sub="Đã xử lý trong ngày" color="blue" />
            <MetricCard title="Lượt xe đang đỗ" value="28 xe" sub="Hiện diện trong bãi" color="emerald" />
            <MetricCard title="Công suất hoạt động" value="64%" sub="Tối ưu hóa vị trí" color="purple" />
          </div>

          {/* Search and Filter Panel */}
          <div className="action-panel-item grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-12">
            <div className="md:col-span-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Tìm kiếm thông tin
              </label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nhập mã vé, biển số hoặc vị trí đỗ..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all text-sm font-medium"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Trạng thái đỗ
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 outline-none text-sm font-semibold text-slate-700 focus:border-indigo-500 transition-all"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="checked_out">Đã thanh toán ra</option>
                <option value="parked">Đang trong bãi</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Loại phương tiện
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 outline-none text-sm font-semibold text-slate-700 focus:border-indigo-500 transition-all"
              >
                <option value="all">Tất cả các loại</option>
                <option value="car">🚗 Ô tô</option>
                <option value="motorbike">🏍️ Xe máy</option>
                <option value="ebike">⚡ Xe điện</option>
                <option value="bicycle">🚲 Xe đạp</option>
              </select>
            </div>
          </div>

          {/* History table */}
          <div className="history-table-container overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Mã vé</th>
                    <th className="px-6 py-4">Biển số</th>
                    <th className="px-6 py-4">Vị trí</th>
                    <th className="px-6 py-4">Thời gian vào</th>
                    <th className="px-6 py-4">Thời gian ra</th>
                    <th className="px-6 py-4">Phí gửi</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4 text-right">Chi tiết</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredHistory.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50/50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">
                        {row.id}
                      </td>
                      <td className="px-6 py-4">
                        {row.type === "bicycle" || row.type === "ebike" ? (
                          <span className="text-slate-500 text-xs font-bold font-mono bg-slate-100 px-2 py-1 rounded border border-slate-200/50">{row.plate}</span>
                        ) : (
                          <LicensePlate plate={row.plate} />
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-semibold text-xs">
                        {row.slot} ({row.floor})
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium font-mono text-xs">
                        {row.inTime}
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium font-mono text-xs">
                        {row.outTime}
                      </td>
                      <td className="px-6 py-4 text-slate-900 font-extrabold text-xs">
                        {row.fee}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            row.status === "checked_out"
                              ? "bg-slate-100 text-slate-755 border-slate-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-100 animate-pulse"
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${row.status === "checked_out" ? "bg-slate-400" : "bg-emerald-500"}`} />
                          {row.status === "checked_out" ? "Đã ra" : "Đang đỗ"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedReceipt(row)}
                          className="rounded-xl border border-slate-200 hover:border-slate-350 hover:bg-slate-50 px-3.5 py-1.5 font-bold text-slate-650 text-xs transition-colors cursor-pointer"
                        >
                          Xem biên lai
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredHistory.length === 0 && (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center text-slate-400 font-semibold text-sm">
                        Không tìm thấy phiên gửi xe nào phù hợp với bộ lọc
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      {/* Receipt Detail Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl">
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">Biên lai vé điện tử</h3>
                <p className="text-xs text-slate-400 mt-0.5">Mã số: {selectedReceipt.id}</p>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="rounded-full p-1.5 hover:bg-white/10 text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 p-8">
              <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-5 text-xs font-semibold space-y-3.5 text-slate-600">
                <div className="flex justify-between items-center text-slate-800 font-bold border-b border-slate-200/80 pb-2.5">
                  <span className="uppercase text-[10px] tracking-wider text-slate-450">Chi tiết phiên gửi</span>
                  <span className="text-xs">Hoàn thành</span>
                </div>

                <div className="flex justify-between">
                  <span>Biển số xe:</span>
                  <span className="font-mono text-slate-900 font-bold">
                    {selectedReceipt.plate}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Vị trí ô đỗ:</span>
                  <span className="text-slate-900 font-bold">
                    {selectedReceipt.slot} ({selectedReceipt.floor})
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Loại xe:</span>
                  <span className="text-slate-900 font-bold">
                    {getVehicleLabel(selectedReceipt.type)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Thời gian vào:</span>
                  <span className="text-slate-900 font-mono">
                    {selectedReceipt.inTime}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Thời gian ra:</span>
                  <span className="text-slate-900 font-mono">
                    {selectedReceipt.outTime}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Hình thức:</span>
                  <span className="text-slate-900 font-bold">
                    {selectedReceipt.paymentMethod}
                  </span>
                </div>

                <div className="flex justify-between border-t border-slate-200/80 pt-3.5 text-slate-800 font-bold text-sm">
                  <span>Tổng tiền đã thu:</span>
                  <span className="text-indigo-600 text-base font-black">
                    {selectedReceipt.fee}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 bg-slate-50 p-6 border-t border-slate-100">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="flex-1 rounded-xl border border-slate-250 py-3 font-semibold text-slate-600 hover:bg-white text-sm transition-colors cursor-pointer"
              >
                Đóng
              </button>

              <button
                onClick={() => {
                  alert("Đang in biên lai gửi xe...");
                  setSelectedReceipt(null);
                }}
                className="flex-1 rounded-xl bg-slate-900 py-3 font-bold text-white hover:bg-slate-800 text-sm transition-colors cursor-pointer"
              >
                🖨️ In lại hóa đơn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SideLink({ to, icon, label, active, collapsed }) {
  return (
    <Link
      to={to}
      className={`nav-link-item flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition-all duration-200 ${
        active
          ? "bg-slate-800 text-blue-400 border border-slate-700 shadow-inner"
          : "text-slate-400 hover:bg-slate-800 hover:text-white"
      }`}
    >
      <span className="flex-shrink-0">{icon}</span>
      {!collapsed && <span className="whitespace-nowrap">{label}</span>}
    </Link>
  );
}

function MetricCard({ title, value, sub, color }) {
  const gradients = {
    indigo: "from-indigo-600 to-indigo-700 text-white shadow-indigo-600/10",
    blue: "from-blue-600 to-blue-700 text-white shadow-blue-600/10",
    emerald: "from-emerald-600 to-emerald-700 text-white shadow-emerald-600/10",
    purple: "from-purple-600 to-purple-700 text-white shadow-purple-600/10",
  };

  return (
    <div className={`stat-card-item rounded-2xl bg-gradient-to-br p-6 shadow-lg border border-white/5 relative overflow-hidden ${gradients[color]}`}>
      <div className="absolute right-0 bottom-0 -mb-6 -mr-6 h-20 w-20 rounded-full bg-white/10 blur-lg" />
      <span className="text-[10px] font-black uppercase tracking-wider opacity-85">
        {title}
      </span>
      <h3 className="text-2xl font-extrabold tracking-tight mt-2.5">
        {value}
      </h3>
      <p className="text-[10px] font-semibold opacity-75 mt-1.5">
        {sub}
      </p>
    </div>
  );
}
