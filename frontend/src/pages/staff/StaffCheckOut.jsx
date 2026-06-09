import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { staffApi } from "../../api/parkingApi";
import { isValidVietnamLicensePlate, normalizeLicensePlate, LICENSE_PLATE_HINT } from "../../utils/licensePlate";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
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

export default function StaffCheckOut({ onLogout }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const fullName = user.fullName || "Nguyễn Văn A";
  const userRole = user.role || "STAFF";
  const roleLabel = userRole === "STAFF" ? "Nhân viên bãi xe" : (userRole === "ADMIN" ? "Quản trị viên" : (userRole === "MANAGER" ? "Quản lý" : "Tài xế"));
  const avatarChar = fullName.charAt(0).toUpperCase();

  const [lookupMode, setLookupMode] = useState("plate");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [showSuccess, setShowSuccess] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [searchPlate, setSearchPlate] = useState("");
  const [sessionData, setSessionData] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [checkOutResult, setCheckOutResult] = useState(null);
  const [paymentWaiting, setPaymentWaiting] = useState(false);
  const stompClientRef = useRef(null);
  const fallbackExitGates = [
    { id: "e0f0e151-627e-47a8-9660-f6b6ab4c7c2d", gateCode: "MAIN-OUT", gateName: "Cổng chính - Lối ra", gateType: "MAIN_EXIT" },
    { id: "1d2d4320-e8c3-4165-ba6a-0432d85ba834", gateCode: "ZONE-B1", gateName: "Cổng tầng B1", gateType: "ZONE_BOTH" },
    { id: "399a2f47-779e-4822-81a7-2d3ddb986c7d", gateCode: "ZONE-B2", gateName: "Cổng tầng B2", gateType: "ZONE_BOTH" },
    { id: "921d3d5c-5ad5-43a2-a93a-559298325e62", gateCode: "ZONE-T1", gateName: "Cổng tầng T1", gateType: "ZONE_BOTH" }
  ];

  const [exitGates, setExitGates] = useState(fallbackExitGates);
  const [selectedGateId, setSelectedGateId] = useState(fallbackExitGates[0].id);

  const [liveTime, setLiveTime] = useState(new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

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
  }, [lookupMode]);
  const [liveDate, setLiveDate] = useState("");

  // Quét QR Code
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState("CHƯA QUÉT MÃ");
  const scannerRef = useRef(null);

  // Fetch exit gates on mount
  const [checkoutHistory, setCheckoutHistory] = useState([]);

  const fetchCheckoutHistory = async () => {
    try {
      const res = await staffApi.getAllSessionsHistory();
      const data = res.data.data || [];
      const completedSessions = data
        .filter(s => s.status === "COMPLETED")
        .slice(0, 5)
        .map(s => [
          s.exitTime ? new Date(s.exitTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "--",
          s.licensePlate,
          s.vehicleType || "Xe",
          s.totalFee ? `${Number(s.totalFee).toLocaleString("vi-VN")}đ` : "0đ",
          s.paymentMethod === "BANK_TRANSFER" ? "Chuyển khoản" : (s.paymentMethod === "CASH" ? "Tiền mặt" : s.paymentMethod || "Khác"),
          s
        ]);
      setCheckoutHistory(completedSessions);
    } catch (err) {
      console.error("Lỗi khi tải lịch sử checkout:", err);
    }
  };

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await staffApi.getParkingConfig();
        const config = res.data.data;
        const exits = (config.gates || []).filter(g => 
          g.gateType === 'MAIN_EXIT' || 
          g.gateType === 'MAIN_BOTH' || 
          g.gateType === 'ZONE_BOTH' || 
          g.gateType === 'ZONE_EXIT'
        );
        if (exits && exits.length > 0) {
          setExitGates(exits);
          setSelectedGateId(exits[0].id);
        }
      } catch (err) {
        console.warn('Failed to load dynamic config, keeping fallback gates:', err);
      }
    };
    fetchConfig();
    fetchCheckoutHistory();
  }, []);

  useEffect(() => {
    const clockTimer = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);

    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setLiveDate(today.toLocaleDateString('vi-VN', options));

    return () => {
      clearInterval(clockTimer);
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // ═══════════════════════════════════════════════════════════════════
  // WebSocket: Lắng nghe thanh toán chuyển khoản real-time từ Driver
  // ═══════════════════════════════════════════════════════════════════
  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
        if (str.includes("ERROR")) console.error("[STOMP]", str);
      },
    });

    client.onConnect = () => {
      console.log("✅ WebSocket connected - Listening for payment confirmations...");

      // Subscribe topic xác nhận thanh toán
      client.subscribe("/topic/payments/confirmed", (message) => {
        try {
          const paymentData = JSON.parse(message.body);
          console.log(" Payment confirmed received:", paymentData);

          // Tự động hiển thị checkout thành công
          setCheckOutResult({
            sessionCode: paymentData.sessionCode,
            licensePlate: paymentData.licensePlate,
            durationMinutes: paymentData.durationMinutes,
            totalFee: paymentData.totalFee,
            vehicleType: paymentData.vehicleType,
            exitGate: paymentData.exitGate,
          });
          setPaymentMethod("BANK_TRANSFER");
          setPaymentWaiting(false);
          setShowSuccess(true);

          // Xo localStorage driver session
          localStorage.removeItem("driver_session");
          localStorage.removeItem("driver_booking");

          // Reset session data sau khi checkout thành công
          setSessionData(null);
          setSearchPlate("");
          fetchCheckoutHistory();
        } catch (err) {
          console.error("WebSocket parse error:", err);
        }
      });
    };

    client.onStompError = (frame) => {
      console.error("STOMP error:", frame.headers["message"]);
    };

    client.activate();
    stompClientRef.current = client;

    return () => {
      if (client.active) {
        client.deactivate();
      }
    };
  }, []);

  const autoSearchPlate = async (plateToSearch) => {
    const normalizedPlate = normalizeLicensePlate(plateToSearch);
    if (!normalizedPlate) return;
    if (!isValidVietnamLicensePlate(normalizedPlate)) {
      setApiError(LICENSE_PLATE_HINT);
      return;
    }
    setIsSearching(true); setApiError('');
    try {
      const res = await staffApi.getActiveSession(normalizedPlate);
      setSessionData(res.data.data);
    } catch (err) {
      console.warn("Backend getActiveSession failed, falling back to LocalStorage Demo:", err);
      const storedSession = JSON.parse(localStorage.getItem("driver_session") || "null");
      const normalizePlate = (p) => (p || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
      
      if (storedSession && normalizePlate(storedSession.licensePlate) === normalizePlate(normalizedPlate)) {
        const minutes = Math.max(1, Math.round((Date.now() - (storedSession.createdTimestamp || Date.now() - 300000)) / 60000));
        const hourlyRate = storedSession.vehicle?.includes("My") ? 5000 : 15000;
        const fee = Math.max(hourlyRate, Math.ceil(minutes / 60) * hourlyRate);

        setSessionData({
          sessionId: "demo-session-id",
          sessionCode: `SS-${(storedSession.createdTimestamp || Date.now()).toString().slice(-6)}`,
          licensePlate: storedSession.licensePlate,
          entryTime: new Date(storedSession.createdTimestamp || Date.now() - 300000).toISOString(),
          floorName: storedSession.floor || "Tầng 3",
          zoneName: storedSession.slot || "T3-CAR-C",
          vehicleType: storedSession.vehicle || "Ô tô (Đang gửi)",
          durationMinutes: minutes,
          totalFee: fee,
          guideMessage: `Thời gian đỗ thực tế: ${minutes} phút. Đơn giá: ${hourlyRate.toLocaleString("vi-VN")}đ/giờ.`
        });
      } else {
        setSessionData(null);
        setApiError(err.response?.data?.message || 'Không tìm thấy phiên gửi xe đang hoạt động cho biển số này');
      }
    } finally { setIsSearching(false); }
  };

  const handleSearchPlate = () => {
    if (!searchPlate.trim()) { setApiError('Vui lòng nhập biển số'); return; }
    autoSearchPlate(searchPlate);
  };

  const parseQrData = (qrText) => {
    if (!qrText) return;
    
    if (qrText.startsWith("BK-")) {
      const storedBooking = JSON.parse(localStorage.getItem("driver_booking") || "null");
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const activePlate = storedBooking?.licensePlate || (storedUser.licensePlates && storedUser.licensePlates[0]) || "";

      setSearchPlate(activePlate);
      setScanMessage(`Đ NHẬN M ĐẶT CHỖ: ${qrText}`);
      
      setTimeout(() => {
        autoSearchPlate(activePlate);
      }, 500);
      return;
    }

    try {
      const data = JSON.parse(qrText);
      const plate = data.plateNumber || data.licensePlate || "";
      if (plate) {
        setSearchPlate(plate);
        setScanMessage(`Đ ĐỌC BIỂN SỐ: ${plate}`);
        setTimeout(() => {
          autoSearchPlate(plate);
        }, 500);
      } else {
        setScanMessage("KHNG TM THẤY BIỂN SỐ TRONG QR");
      }
    } catch {
      const cleanedText = qrText.trim();
      setSearchPlate(cleanedText);
      setScanMessage(`Đ ĐỌC BIỂN SỐ QR: ${cleanedText}`);
      setTimeout(() => {
        autoSearchPlate(cleanedText);
      }, 500);
    }
  };

  const startScanner = async () => {
    try {
      setIsScanning(true);
      setScanMessage("ĐANG MỞ CAMERA...");

      const scanner = new Html5Qrcode("qr-reader-checkout");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 200, height: 200 },
        },
        async (decodedText) => {
          parseQrData(decodedText);

          if (scannerRef.current) {
            await scannerRef.current.stop();
            scannerRef.current.clear();
            scannerRef.current = null;
          }

          setIsScanning(false);
        },
        () => {}
      );

      setScanMessage("ĐƯA MÃ QR VÀO KHUNG QUÉT");
    } catch (error) {
      console.error(error);
      setScanMessage("KHÔNG MỞ ĐƯỢC CAMERA");
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop();
      scannerRef.current.clear();
      scannerRef.current = null;
    }

    setIsScanning(false);
    setScanMessage("Đ TẮT CAMERA");
  };

  const handleCheckOut = async () => {
    if (!sessionData || !selectedGateId) return;
    setIsSubmitting(true); setApiError('');
    try {
      const res = await staffApi.checkOut({
        sessionId: sessionData.sessionId,
        gateExitId: selectedGateId,
        paymentMethod: paymentMethod,
      });
      setCheckOutResult(res.data.data);
      setShowSuccess(true);

      // Cập nhật localStorage để giải phng xe ở tab Driver lập tức
      localStorage.removeItem("driver_session");
      localStorage.removeItem("driver_booking");
      fetchCheckoutHistory();
    } catch (err) {
      console.error("Backend checkOut error:", err);
      const errorMsg = err.response?.data?.message || err.message || "Lỗi kết nối với hệ thống backend";
      setApiError(`Check-out thất bại: ${errorMsg}`);
    } finally { setIsSubmitting(false); }
  };

  const formatFee = (fee) => {
    if (!fee) return '0đ';
    return Number(fee).toLocaleString('vi-VN') + 'đ';
  };

  const handlePrint = () => {
    if (!checkOutResult) return;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Hóa đơn thanh toán - #${checkOutResult.sessionCode}</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              padding: 40px;
              color: #333;
              background: #fff;
              text-align: center;
            }
            .receipt-card {
              max-width: 400px;
              margin: 0 auto;
              border: 1px solid #ddd;
              padding: 30px;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            }
            h1 {
              font-size: 22px;
              margin-bottom: 5px;
              color: #1e1b4b;
            }
            p {
              font-size: 13px;
              color: #666;
              margin-top: 0;
            }
            .divider {
              border-top: 2px dashed #eee;
              margin: 20px 0;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              font-size: 14px;
              margin-bottom: 12px;
            }
            .info-label {
              color: #777;
            }
            .info-value {
              font-weight: bold;
              color: #111;
            }
            .total-fee {
              font-size: 24px;
              font-weight: 900;
              color: #4f46e5;
              margin: 15px 0;
            }
            .footer-msg {
              font-size: 11px;
              color: #aaa;
              margin-top: 30px;
            }
          </style>
        </head>
        <body>
          <div class="receipt-card">
            <h1>SMART PARKING</h1>
            <p>Hóa đơn điện tử check-out xe</p>
            <div class="divider"></div>
            
            <div class="info-row">
              <span class="info-label">Mã phiên:</span>
              <span class="info-value">#${checkOutResult.sessionCode}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Biển số xe:</span>
              <span class="info-value">${checkOutResult.licensePlate}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Thời gian gửi:</span>
              <span class="info-value">${checkOutResult.durationMinutes} phút</span>
            </div>
            <div class="info-row">
              <span class="info-label">Hình thức:</span>
              <span class="info-value">${paymentMethod === "BANK_TRANSFER" ? "QR Chuyển khoản" : "Tiền mặt tại quầy"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Trạng thái:</span>
              <span class="info-value" style="color: #059669;">ĐÃ THANH TOÁN</span>
            </div>
            
            <div class="divider"></div>
            
            <div class="info-label" style="font-size: 12px; font-weight: bold;">TỔNG TIỀN THANH TOÁN</div>
            <div class="total-fee">${Number(checkOutResult.totalFee).toLocaleString('vi-VN')}đ</div>
            
            <div class="divider"></div>
            <div class="footer-msg">Cảm ơn quý khách đã sử dụng dịch vụ!<br/>Smart Parking Tower - Hân hạnh phục vụ</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const formatTimer = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

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
          <SideLink collapsed={collapsed} to="/staff/check-out" icon={<IconCheckOut />} label="Check-out xe ra" active />
          <SideLink collapsed={collapsed} to="/staff/history" icon={<IconHistory />} label="Lịch sử phiên gửi" />
          <SideLink collapsed={collapsed} to="/staff/3d-map" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 16V8a2 2 0 00-1-1.732l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.732l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /><path strokeLinecap="round" strokeLinejoin="round" d="M3.3 7L12 12l8.7-5M12 22V12" /></svg>} label="Mô phỏng 3D" />
        </nav>

        {/* Sidebar Footer */}
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

      {/* Main Panel */}
      <main
        className={`main-content-area flex-1 min-h-screen flex flex-col transition-all duration-300 ${
          collapsed ? "ml-20" : "ml-72"
        }`}
      >
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/80 px-8 backdrop-blur-md">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-slate-900">Check-out xe ra</h2>
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
          {/* Welcome Banner */}
          <div className="welcome-banner relative overflow-hidden rounded-3xl bg-slate-900 p-8 text-white shadow-lg border border-slate-800">
            {/* Mesh Glow Background */}
            <div className="absolute right-0 top-0 -mr-20 -mt-20 h-60 w-60 rounded-full bg-blue-600/30 blur-3xl" />
            <div className="absolute left-1/3 bottom-0 -mb-20 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />

            <div className="relative z-10 max-w-2xl">
              <h2 className="text-3xl font-extrabold tracking-tight">Thanh toán & Check-out</h2>
              <p className="mt-2 text-slate-300 text-sm leading-relaxed">
                Tra cứu mã vé gửi xe (QR) hoặc tìm kiếm theo biển số xe đang gửi để lập hóa đơn tính toán chi phí, xác nhận thanh toán cổng ra.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Column (Search / QR Scanner / Mini Stat) */}
            <div className="space-y-6 lg:col-span-4 flex flex-col">
              <div className="action-panel-item overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col">
                {/* Tabs Selector */}
                <div className="grid grid-cols-2 border-b border-slate-100 bg-slate-50">
                  <button
                    onClick={() => setLookupMode("qr")}
                    className={`px-4 py-4 font-bold text-sm tracking-wide transition-all cursor-pointer ${
                      lookupMode === "qr"
                        ? "border-b-2 border-indigo-600 bg-white text-indigo-600"
                        : "text-slate-500 hover:text-slate-850"
                    }`}
                  >
                    ▣ Quét mã QR
                  </button>

                  <button
                    onClick={() => setLookupMode("plate")}
                    className={`px-4 py-4 font-bold text-sm tracking-wide transition-all cursor-pointer ${
                      lookupMode === "plate"
                        ? "border-b-2 border-indigo-600 bg-white text-indigo-655"
                        : "text-slate-500 hover:text-slate-850"
                    }`}
                  >
                     Tìm biển số
                  </button>
                </div>

                {/* Tab Content */}
                <div className="p-6 flex-1 flex flex-col justify-between min-h-[280px]">
                  {lookupMode === "qr" ? (
                    <div className="space-y-4 flex-1 flex flex-col justify-between">
                      {/* Scanner Screen Box */}
                      <div className="relative overflow-hidden rounded-2xl bg-slate-950 p-2 shadow-inner border border-slate-800">
                        <div id="qr-reader-checkout" className="min-h-[220px] w-full overflow-hidden rounded-xl bg-slate-900" />

                        {!isScanning && (
                          <div className="absolute inset-2 flex flex-col items-center justify-center rounded-xl bg-slate-950/95 text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-950 text-indigo-400 border border-indigo-500/30 text-2xl mb-3">
                              ▣
                            </div>
                            <p className="font-bold text-white text-xs">CAMERA ĐANG TẮT</p>
                            <p className="text-slate-400 text-[10px] mt-1 max-w-xs px-4">
                              Nhấn nút bắt đầu quét phía dưới để bật máy quét mã QR cổng xuất bãi
                            </p>
                          </div>
                        )}

                        {/* Corner brackets */}
                        <div className="pointer-events-none absolute inset-4 border border-white/10">
                          <span className="absolute -left-1 -top-1 h-4 w-4 border-l-2 border-t-2 border-indigo-400" />
                          <span className="absolute -right-1 -top-1 h-4 w-4 border-r-2 border-t-2 border-indigo-400" />
                          <span className="absolute -bottom-1 -left-1 h-4 w-4 border-b-2 border-l-2 border-indigo-400" />
                          <span className="absolute -bottom-1 -right-1 h-4 w-4 border-b-2 border-r-2 border-indigo-400" />
                        </div>
                      </div>

                      {/* Scan Status Alert */}
                      <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 flex items-center justify-center gap-2 text-xs font-semibold text-slate-700">
                        <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
                        Trạng thái: <span className="text-indigo-600 font-bold">{scanMessage}</span>
                      </div>

                      {/* Trigger buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={startScanner}
                          disabled={isScanning}
                          className="rounded-xl bg-indigo-600 py-3 font-bold text-white shadow-md shadow-indigo-500/10 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none transition-colors cursor-pointer text-xs"
                        >
                          Bật máy quét QR
                        </button>

                        <button
                          onClick={stopScanner}
                          disabled={!isScanning}
                          className="rounded-xl border border-slate-200 py-3 font-bold text-slate-650 hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer text-xs"
                        >
                          Tắt camera
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5 flex-1 flex flex-col justify-between">
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                          Nhập biển số xe cần tìm
                        </label>
                        <input
                          value={searchPlate}
                          onChange={(e) => setSearchPlate(normalizeLicensePlate(e.target.value))}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearchPlate()}
                          placeholder="Ví dụ: 30A-123.45"
                          className="w-full rounded-xl border border-slate-200 px-4 py-4 text-center text-xl font-bold tracking-widest text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all uppercase"
                        />
                      </div>

                      {apiError && (
                        <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-700">
                          ⚠️ {apiError}
                        </div>
                      )}

                      <button
                        onClick={handleSearchPlate}
                        disabled={isSearching}
                        className="w-full rounded-xl bg-slate-900 py-3.5 font-bold text-white shadow-md hover:bg-slate-800 transition-colors text-sm cursor-pointer disabled:opacity-50"
                      >
                        {isSearching ? 'Đang tra cứu...' : 'Tra cứu hệ thống'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Total Card */}
              <div className="stat-card-item rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 p-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute right-0 bottom-0 -mb-6 -mr-6 h-20 w-20 rounded-full bg-white/10 blur-lg" />
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-100">
                  Check-out trong ca trực
                </p>
                <div className="mt-2.5 flex items-end justify-between">
                  <span className="text-4xl font-extrabold tracking-tight">128 xe</span>
                  <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold border border-white/10">
                    +12% so với hôm qua
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column (Info Display & Bill) */}
            <div className="space-y-6 lg:col-span-8">
               <div className="action-panel-item rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="flex flex-col gap-8 xl:flex-row items-stretch">
                  {/* Left block Info */}
                  <div className="flex-1 space-y-6 flex flex-col justify-between">
                    <div className="w-full">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wide">Thông tin xe ra</h3>
                        {sessionData && (
                          <span className="rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 text-xs font-bold text-emerald-600">
                            Đang gửi
                          </span>
                        )}
                      </div>
                    </div>

                    {sessionData ? (
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                          <InfoBlock label="Biển số" value={<LicensePlate plate={sessionData.licensePlate} />} />
                          <InfoBlock label="Mã phiên" value={`#${sessionData.sessionCode}`} />
                          <InfoBlock label="Thời gian vào" value={new Date(sessionData.entryTime).toLocaleString('vi-VN')} />
                          <InfoBlock label="Khu vực" value={`${sessionData.floorName} - ${sessionData.zoneName}`} />
                          <InfoBlock label="Loại xe" value={sessionData.vehicleType} />
                          <InfoBlock label="Thời gian gửi" value={`${sessionData.durationMinutes || 0} phút`} />
                        </div>

                        {/* Gate selector */}
                        <div className="mt-4">
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Cổng ra</label>
                          <select
                            value={selectedGateId}
                            onChange={(e) => setSelectedGateId(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500"
                          >
                            {exitGates.map(g => (
                              <option key={g.id} value={g.id}>{g.gateName}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center py-10 text-slate-400 bg-slate-50/20 border border-dashed border-slate-200 rounded-2xl min-h-[220px]">
                        <div className="text-3xl mb-2">🔍</div>
                        <p className="text-sm font-bold text-slate-500">Tra cứu biển số để xem thông tin</p>
                        <p className="text-[10px] text-slate-450 mt-1.5 max-w-[240px] text-center leading-relaxed">
                          Nhập biển số hoặc quét mã QR ở cột bên trái để hiển thị chi tiết phiên gửi xe
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right block Fees */}
                  <div className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-6 xl:w-80 flex flex-col justify-between min-h-[280px]">
                    <div>
                      <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Phí tạm tính</span>
                      </div>

                      {sessionData ? (
                        <div className="space-y-3.5">
                          <FeeRow label="Loại xe" value={sessionData.vehicleType} />
                          <FeeRow label="Thời gian gửi" value={`${sessionData.durationMinutes || 0} phút`} />
                          <FeeRow label={sessionData.guideMessage || 'Phí ước tính'} value="" />
                        </div>
                      ) : (
                        <div className="py-6 text-center">
                          <p className="text-xs text-slate-400 italic">Chưa có dữ liệu</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex flex-col border-t border-slate-200/80 pt-5">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tổng thanh toán</span>
                      <span className="text-3xl font-black text-indigo-650 tracking-tight mt-1">
                        {sessionData ? formatFee(sessionData.totalFee) : '0đ'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payments options */}
                <div className="mt-8 space-y-5 border-t border-slate-100 pt-8">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Phương thức thanh toán
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setPaymentMethod("BANK_TRANSFER")}
                      className={`rounded-xl border-2 p-5 font-bold transition-all text-sm flex flex-col items-center justify-center gap-2.5 cursor-pointer h-28 ${
                        paymentMethod === "BANK_TRANSFER"
                          ? "border-indigo-600 bg-indigo-50/60 text-indigo-900 shadow-sm shadow-indigo-100"
                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      <svg className={`w-7 h-7 transition-colors ${paymentMethod === "BANK_TRANSFER" ? "text-indigo-600" : "text-slate-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                        {/* Genuine QR Code SVG */}
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 12a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm12-12a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V4zM4 6h2v2H4V6zm0 12h2v2H4v-2zm12-12h2v2h-2V6zm-5 5h2v2h-2v-2zm3 3h2v2h-2v-2zm-3 3h2v2h-2v-2zm6-3h2v2h-2v-2zm-3-3h2v2h-2v-2zm3 0h2v2h-2v-2z" />
                      </svg>
                      <span className="text-xs tracking-wide">QR / Chuyển khoản</span>
                    </button>

                    <button
                      onClick={() => setPaymentMethod("CASH")}
                      className={`rounded-xl border-2 p-5 font-bold transition-all text-sm flex flex-col items-center justify-center gap-2.5 cursor-pointer h-28 ${
                        paymentMethod === "CASH"
                          ? "border-indigo-600 bg-indigo-50/60 text-indigo-900 shadow-sm shadow-indigo-100"
                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      <svg className={`w-7 h-7 transition-colors ${paymentMethod === "CASH" ? "text-indigo-600" : "text-slate-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs tracking-wide">Tiền mặt tại quầy</span>
                    </button>
                  </div>
                  {paymentMethod === "BANK_TRANSFER" && (
                    sessionData ? (
                      <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-6 space-y-4 animate-fade-in">
                        <div className="flex flex-col md:flex-row gap-6 items-center">
                          {/* QR Code Container */}
                          <div className="flex-shrink-0 bg-white p-3 rounded-2xl border border-slate-150 shadow-md flex flex-col items-center">
                            <img
                              src={`https://api.vietqr.io/image/970422-0974114657-compact.png?amount=${sessionData.totalFee}&addInfo=${encodeURIComponent(sessionData.sessionCode || sessionData.licensePlate)}&accountName=TRAN%20NGUYEN%20MINH%20AN`}
                              alt="VietQR Invoice"
                              className="w-44 h-44 object-contain rounded-lg shadow-sm"
                              onError={(e) => {
                                // Dynamic offline fallback using standard openqr
                                e.target.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`STK: 0974114657 | MB BANK | TRAN NGUYEN MINH AN | So tien: ${sessionData.totalFee} | Noi dung: ${sessionData.sessionCode}`)}`;
                              }}
                            />
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mt-2">MÃ QUÉT VIETQR</span>
                          </div>

                          {/* Bank details info list */}
                          <div className="flex-1 space-y-3 w-full">
                            <div className="flex items-center gap-2 border-b border-indigo-100/50 pb-2">
                              <span className="text-xl"></span>
                              <div>
                                <h5 className="font-extrabold text-sm text-indigo-950 uppercase tracking-wide">Thông tin chuyển khoản</h5>
                                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Hệ thống thanh toán tự động</p>
                              </div>
                            </div>

                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between">
                                <span className="text-slate-500 font-medium">Ngân hàng:</span>
                                <span className="font-bold text-slate-900">MB Bank (Ngân hàng Quân Đội)</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500 font-medium">Số tài khoản:</span>
                                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">0974114657</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500 font-medium">Chủ tài khoản:</span>
                                <span className="font-bold text-slate-900 uppercase">TRAN NGUYEN MINH AN</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500 font-medium">Số tiền:</span>
                                <span className="font-black text-indigo-600 text-sm">{formatFee(sessionData.totalFee)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500 font-medium">Nội dung chuyển:</span>
                                <span className="font-mono font-extrabold text-indigo-600 bg-indigo-100/70 px-2 py-0.5 rounded uppercase tracking-wider">{sessionData.sessionCode}</span>
                              </div>
                            </div>

                            {/* Status pulse label */}
                            <div className="rounded-xl bg-indigo-50 border border-indigo-100/80 px-3 py-2.5 flex items-center gap-2 text-xs font-bold text-indigo-800 animate-pulse">
                              <span className="h-2 w-2 rounded-full bg-indigo-600 inline-block"></span>
                              Đang chờ khách hàng chuyển khoản...
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500 italic">
                         Vui lòng tra cứu biển số xe đang gửi ở trên để hiển thị mã thanh toán QR & thông tin chuyển khoản tương ứng.
                      </div>
                    )
                  )}

                  {apiError && (
                    <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-700">
                      ⚠️ {apiError}
                    </div>
                  )}

                  <button
                    onClick={handleCheckOut}
                    disabled={!sessionData || isSubmitting}
                    className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-sm font-bold text-white shadow-lg hover:bg-slate-800 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Đang xử lý...' : 'Xác nhận xuất bãi (Check-out)'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* History Section */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <div>
                <h3 className="text-md font-bold text-slate-850">
                  Lịch sử check-out hôm nay
                </h3>
                <p className="text-xs text-slate-400 mt-1">Các phương tiện đã hoàn tất thủ tục xuất bãi gần đây</p>
              </div>

              <button className="text-xs font-bold text-indigo-600 hover:text-indigo-750 hover:underline cursor-pointer">
                Xem toàn bộ lịch sử
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Thời gian ra</th>
                    <th className="px-6 py-4">Biển số</th>
                    <th className="px-6 py-4">Loại xe</th>
                    <th className="px-6 py-4">Tổng phí</th>
                    <th className="px-6 py-4">Hình thức thanh toán</th>
                    <th className="px-6 py-4 text-right">Biên lai</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {checkoutHistory.map((row) => (
                    <tr
                      key={row[1]}
                      className="hover:bg-slate-50/50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 text-slate-500 font-medium font-mono">
                        {row[0]}
                      </td>
                      <td className="px-6 py-4">
                        <LicensePlate plate={row[1]} />
                      </td>
                      <td className="px-6 py-4 text-slate-655 font-semibold">
                        {row[2]}
                      </td>
                      <td className="px-6 py-4 text-slate-800 font-bold">
                        {row[3]}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 border border-slate-200">
                          {row[4]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            if (row[5]) {
                              const sObj = row[5];
                              setCheckOutResult({
                                sessionCode: sObj.sessionCode || `PS-${sObj.id?.slice(0, 6).toUpperCase()}`,
                                licensePlate: sObj.licensePlate,
                                durationMinutes: sObj.durationMinutes || Math.round((new Date(sObj.exitTime || Date.now()).getTime() - new Date(sObj.entryTime || Date.now() - 300000).getTime()) / 60000),
                                totalFee: sObj.totalFee,
                                vehicleType: sObj.vehicleType,
                                exitGate: sObj.exitGateName || "Cổng chính - Lối ra",
                              });
                              setPaymentMethod(sObj.paymentMethod || "CASH");
                              setShowSuccess(true);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100/70 border border-indigo-100 hover:border-indigo-200 rounded-xl transition-all duration-150 cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                          Xem biên lai
                        </button>
                      </td>
                    </tr>
                  ))}
                  {checkoutHistory.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-slate-400 font-semibold text-sm">
                        Chưa có xe nào check-out trong ngày hôm nay.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      {/* Success Receipt Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl border border-slate-100 flex flex-col relative overflow-hidden">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-3xl">
              ✓
            </div>

            <h3 className="text-xl font-extrabold text-slate-900">Check-out thành công!</h3>
            <p className="mt-1.5 text-xs text-slate-400">
              Xe {checkOutResult?.licensePlate} đã hoàn tất thanh toán và được cấp quyền mở barie.
            </p>

            {/* Receipt info */}
            <div className="my-6 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-5 text-left text-xs space-y-3 font-medium">
              <div className="flex justify-between border-b border-slate-200/80 pb-2.5">
                <span className="font-bold text-slate-700 uppercase">Hóa đơn điện tử</span>
                <span className="font-mono text-slate-400 font-bold">#{checkOutResult?.sessionCode}</span>
              </div>

              <div className="flex justify-between text-slate-500">
                <span>Biển số:</span>
                <span className="font-bold text-slate-900">{checkOutResult?.licensePlate}</span>
              </div>

              <div className="flex justify-between text-slate-500">
                <span>Thời gian gửi:</span>
                <span className="font-bold text-slate-900">{checkOutResult?.durationMinutes} phút</span>
              </div>

              <div className="flex justify-between text-slate-500">
                <span>Số tiền thanh toán:</span>
                <span className="font-bold text-slate-900 text-sm">{formatFee(checkOutResult?.totalFee)}</span>
              </div>

              <div className="flex justify-between text-slate-500">
                <span>Hình thức:</span>
                <span className="font-bold text-slate-900">
                  {paymentMethod === "BANK_TRANSFER" ? "QR Chuyển khoản" : "Tiền mặt tại quầy"}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSuccess(false)}
                className="flex-1 rounded-xl border border-slate-250 py-3 font-semibold text-slate-600 hover:bg-slate-50 text-sm cursor-pointer"
              >
                Đóng
              </button>

              <button 
                onClick={handlePrint}
                className="flex-1 rounded-xl bg-indigo-600 py-3 font-bold text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-700 text-sm cursor-pointer"
              >
                ️ In hóa đơn
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

function InfoBlock({ label, value }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <span className="font-bold text-slate-850 text-sm">
        {value}
      </span>
    </div>
  );
}

function FeeRow({ label, value }) {
  return (
    <div className="flex justify-between text-xs font-semibold">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-800">{value}</span>
    </div>
  );
}