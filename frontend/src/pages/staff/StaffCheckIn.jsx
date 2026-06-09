import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { staffApi } from "../../api/parkingApi";
import { isValidVietnamLicensePlate, normalizeLicensePlate, LICENSE_PLATE_HINT } from "../../utils/licensePlate";
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

export default function StaffCheckIn({ onLogout }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const fullName = user.fullName || "Nguyễn Văn A";
  const userRole = user.role || "STAFF";
  const roleLabel = userRole === "STAFF" ? "Nhân viên bãi xe" : (userRole === "ADMIN" ? "Quản trị viên" : (userRole === "MANAGER" ? "Quản lý" : "Tài xế"));
  const avatarChar = fullName.charAt(0).toUpperCase();

  const [isSuccess, setIsSuccess] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState("ĐANG CHỜ QUÉT...");
  const [collapsed, setCollapsed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [checkInResult, setCheckInResult] = useState(null);
  const scannerRef = useRef(null);

  // Config from BE
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [gates, setGates] = useState([]);
  const [configLoaded, setConfigLoaded] = useState(false);

  const [liveTime, setLiveTime] = useState(new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  const [liveDate, setLiveDate] = useState("");

  const [formData, setFormData] = useState({
    plateNumber: "",
    vehicleTypeId: "",
    gateEntryId: "",
    reservationCode: "",
    driverType: "WALK_IN",
    notes: "",
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
  }, []);

  const handleFetchBookingInfo = () => {
    if (!formData.reservationCode || !formData.reservationCode.trim()) {
      alert("Vui lòng nhập mã đặt chỗ trước!");
      return;
    }
    setFormData(prev => ({ ...prev, driverType: "PRE_BOOKED" }));
    alert("Mã reservation đã được ghi nhận. Nếu quét QR từ driver, biển số và loại xe sẽ tự điền từ dữ liệu QR.");
  };

  // --- Web-based AI OCR States & Logic (Real Webcam & Tesseract.js) ---
  const [activeTab, setActiveTab] = useState("qr");
  const [ocrScanning, setOcrScanning] = useState(false);
  const [ocrResult, setOcrResult] = useState("");
  const [ocrStream, setOcrStream] = useState(null);
  const [isOcrCameraOn, setIsOcrCameraOn] = useState(false);

  const ocrVideoRef = useRef(null);
  const ocrCanvasRef = useRef(null);

  // Load Tesseract.js script dynamically from CDN
  useEffect(() => {
    if (!window.Tesseract) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/tesseract.js@v4.0.1/dist/tesseract.min.js";
      script.async = true;
      script.onload = () => {
        console.log("Tesseract.js loaded successfully from CDN");
      };
      document.body.appendChild(script);
    }
  }, []);

  // Cleanup OCR camera stream on unmount
  useEffect(() => {
    return () => {
      if (ocrStream) {
        ocrStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [ocrStream]);

  const startOcrCamera = async () => {
    try {
      setIsOcrCameraOn(true);
      setOcrResult("Đang kết nối camera của thiết bị...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      setOcrStream(stream);
      if (ocrVideoRef.current) {
        ocrVideoRef.current.srcObject = stream;
        ocrVideoRef.current.play();
      }
      setOcrResult("Camera hoạt động! Giơ biển số trước camera.");
    } catch (err) {
      console.error("Lỗi bật camera OCR:", err);
      setOcrResult("❌ Lỗi: Không thể truy cập Camera.");
      setIsOcrCameraOn(false);
    }
  };

  const stopOcrCamera = () => {
    if (ocrStream) {
      ocrStream.getTracks().forEach(track => track.stop());
      setOcrStream(null);
    }
    setIsOcrCameraOn(false);
    setOcrResult("Camera đã tắt.");
  };

  const captureAndOcr = async () => {
    if (!ocrVideoRef.current || !window.Tesseract) {
      setOcrResult("⚠️ Thư viện AI chưa sẵn sàng hoặc Camera đang tắt!");
      return;
    }

    setOcrScanning(true);
    setOcrResult(" Đang chụp ảnh & phân tích biển số xe...");

    try {
      const video = ocrVideoRef.current;
      const canvas = ocrCanvasRef.current || document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // --- Tiền xử lý ảnh nâng cao (Computer Vision Binarization) ---
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        // Chuyển ảnh xám (Grayscale)
        const grayscale = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        // Nhị phân hóa ảnh (Binarization) với ngưỡng lý tưởng 125 giúp chữ đen và số nổi rõ rệt
        const binary = grayscale < 125 ? 0 : 255;
        data[i] = binary;     // R
        data[i + 1] = binary; // G
        data[i + 2] = binary; // B
      }
      ctx.putImageData(imgData, 0, 0);

      // Gửi ảnh đã nhị phân hóa siêu rõ nét cho AI Tesseract
      const { data: { text } } = await window.Tesseract.recognize(
        canvas,
        'eng',
        { logger: m => console.log(m) }
      );

      console.log("OCR Raw Text:", text);

      // Làm sạch ký tự rác, loại bỏ các ký tự dấu ngoặc hay viền khung biển số
      let cleanedText = text.replace(/[^a-zA-Z0-9-\n\s]/g, "").toUpperCase();
      let lines = cleanedText.split("\n").map(l => l.trim()).filter(l => l.length >= 2);

      let matchedPlate = "";
      let rawTextRead = "";

      if (lines.length > 0) {
        // --- GIẢI PHÁP GHÉP DÒNG CHO BIỂN SỐ XE MÁY 2 DÒNG ---
        // Nối tất cả các dòng lại với nhau thành 1 dòng duy nhất!
        let rawCandidate = lines.join("").replace(/\s/g, "").replace(/-/g, "");
        rawTextRead = lines.join(" ");

        // --- Thuật toán sửa lỗi nhận dạng thông minh của Việt Nam ---
        let chars = rawCandidate.split("");

        // 1. Sửa các lỗi nhầm lẫn chữ-số cơ bản trước để đưa về dạng số/chữ nguyên thủy
        for (let i = 0; i < chars.length; i++) {
          if (i < 2 || i >= 4) {
            if (chars[i] === 'O' || chars[i] === 'D' || chars[i] === 'Q') chars[i] = '0';
            else if (chars[i] === 'I' || chars[i] === 'L') chars[i] = '1';
            else if (chars[i] === 'Z') chars[i] = '2';
            else if (chars[i] === 'S') chars[i] = '5';
            else if (chars[i] === 'G') chars[i] = '6';
            else if (chars[i] === 'B') chars[i] = '8';
          } else if (i === 2) { // Vị trí thứ 3 là CHỮ CÁI
            if (chars[i] === '0') chars[i] = 'D';
            else if (chars[i] === '1') chars[i] = 'I';
            else if (chars[i] === '5') chars[i] = 'S';
            else if (chars[i] === '8') chars[i] = 'B';
            else if (chars[i] === '2') chars[i] = 'Z';
          }
        }

        const normalizedCandidate = chars.join("");
        console.log("Chuỗi sau chuẩn hóa thô:", normalizedCandidate);

        // --- BỘ PHÂN TÍCH REGEX BIỂN SỐ XE VIỆT NAM CHUẨN ---
        // Mẫu 1: Xe máy Việt Nam (Ví dụ 99E1-22268) hoặc ô tô thế hệ mới (Ví dụ 30G-12345)
        // Dạng: [2 số tỉnh] + [1 chữ cái] + [1 số hoặc chữ cái] + [4 hoặc 5 số]
        const bikeRegex = /([0-9]{2})([A-Z])([0-9A-Z])([0-9]{4,5})/;
        const matchBike = normalizedCandidate.match(bikeRegex);

        // Mẫu 2: Ô tô Việt Nam tiêu chuẩn (Ví dụ 30A-888.88)
        // Dạng: [2 số tỉnh] + [1 chữ cái] + [4 hoặc 5 số]
        const carRegex = /([0-9]{2})([A-Z])([0-9]{4,5})/;
        const matchCar = normalizedCandidate.match(carRegex);

        if (matchBike) {
          // Lấy đúng phần trùng khớp cấu trúc xe máy Việt Nam và ghép định dạng chuẩn
          const [fullMatch, tinh, series1, series2, stt] = matchBike;
          // Thêm dấu chấm cho biển 5 số nếu cần
          const formattedStt = stt.length === 5 ? `${stt.slice(0, 3)}.${stt.slice(3)}` : stt;
          matchedPlate = `${tinh}${series1}${series2}-${formattedStt}`;
        } else if (matchCar) {
          // Lấy đúng phần trùng khớp cấu trúc ô tô Việt Nam và ghép định dạng chuẩn
          const [fullMatch, tinh, series, stt] = matchCar;
          const formattedStt = stt.length === 5 ? `${stt.slice(0, 3)}.${stt.slice(3)}` : stt;
          matchedPlate = `${tinh}${series}-${formattedStt}`;
        } else {
          // Fallback: nếu không khớp mẫu nào thì lấy chuỗi đã làm sạch thô từ 7-9 ký tự
          matchedPlate = normalizedCandidate.slice(0, 9);
        }
      }

      if (matchedPlate) {
        matchedPlate = matchedPlate.slice(0, 11); // Biển số Việt Nam tối đa 10-11 ký tự cả dấu gạch

        // Tự động định dạng thêm dấu gạch ngang sau chữ cái đầu tiên cho đẹp
        if (matchedPlate.length >= 4 && !matchedPlate.includes("-")) {
          const letterMatch = matchedPlate.match(/[A-Z]/);
          if (letterMatch) {
            const idx = matchedPlate.indexOf(letterMatch[0]) + 1;
            // Nếu ký tự tiếp theo cũng là chữ/số thì chèn dấu gạch
            matchedPlate = matchedPlate.slice(0, idx) + "-" + matchedPlate.slice(idx);
          }
        }

        let targetType = "ô tô";
        // Nhận diện loại xe dựa trên ký hiệu biển số xe máy phổ biến ở Việt Nam
        if (matchedPlate.includes("A1") || matchedPlate.includes("B1") || matchedPlate.includes("E1") || matchedPlate.includes("F1")) {
          targetType = "máy";
        }
        const vt = vehicleTypes.find(v => v.name.toLowerCase().includes(targetType));

        setFormData(prev => ({
          ...prev,
          plateNumber: matchedPlate,
          vehicleTypeId: vt?.id || prev.vehicleTypeId,
          driverType: "WALK_IN",
          reservationCode: ""
        }));

        setOcrResult(`✅ ĐỌC THÀNH CÔNG: ${matchedPlate} (AI nhận dạng thô: ${rawTextRead || matchedPlate})`);
      } else {
        setOcrResult(`❌ AI đọc được ký tự không phù hợp: "${text.trim() || 'Rỗng'}". Vui lòng căn chỉnh lại góc camera!`);
      }
    } catch (err) {
      console.error("Lỗi phân tích OCR:", err);
      setOcrResult("❌ Có lỗi xảy ra trong quá trình nhận dạng ảnh.");
    } finally {
      setOcrScanning(false);
    }
  };

  // Hàm mô phỏng quét biển số dự phòng cho Demo nhanh
  const handleOcrScan = (vehicleTypeChoice) => {
    setOcrScanning(true);
    setOcrResult("Đang khởi động camera quét biển số AI...");

    setTimeout(() => {
      setOcrResult(" AI đang phân tích luồng ảnh & nhận diện ký tự...");

      setTimeout(() => {
        let plate = "30G-888.88";
        let targetType = "ô tô";

        if (vehicleTypeChoice === "motorbike") {
          plate = "59A1-999.99";
          targetType = "máy";
        }

        const vt = vehicleTypes.find(v => v.name.toLowerCase().includes(targetType));

        setFormData(prev => ({
          ...prev,
          plateNumber: plate,
          vehicleTypeId: vt?.id || prev.vehicleTypeId,
          driverType: "WALK_IN",
          reservationCode: ""
        }));

        setOcrScanning(false);
        setOcrResult(`✅ Nhận diện THÀNH CÔNG! Biển số: ${plate}`);
      }, 1200);
    }, 800);
  };

  // Fetch parking config from BE on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await staffApi.getParkingConfig();
        const config = res.data.data;
        setVehicleTypes(config.vehicleTypes || []);
        const entryGates = (config.gates || []).filter(g => g.gateType === 'MAIN_ENTRY' || g.gateType === 'MAIN_BOTH');
        setGates(entryGates);
        // Set defaults
        if (config.vehicleTypes?.length > 0) {
          setFormData(prev => ({ ...prev, vehicleTypeId: config.vehicleTypes[0].id }));
        }
        if (entryGates.length > 0) {
          setFormData(prev => ({ ...prev, gateEntryId: entryGates[0].id }));
        }
        setConfigLoaded(true);
      } catch (err) {
        console.error('Failed to load parking config:', err);
        setApiError('Không thể tải cấu hình bãi xe. Kiểm tra kết nối BE.');
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);

    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setLiveDate(today.toLocaleDateString('vi-VN', options));

    return () => {
      clearInterval(timer);
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => { });
      }
    };
  }, []);

  const parseQrData = (qrText) => {
    if (!qrText) return;

    // Khởi tạo các giá trị mặc định từ dữ liệu hiện tại
    let targetPlate = "";
    let targetReservation = "";
    let matchedVehicleTypeId = formData.vehicleTypeId || (vehicleTypes[0]?.id || "");
    let matchedGateId = formData.gateEntryId || (gates[0]?.id || "");

    try {
      // Nếu quét mã QR JSON thế hệ mới của chúng ta
      const data = JSON.parse(qrText);
      targetPlate = data.plateNumber || data.licensePlate || "";
      targetReservation = data.reservationCode || data.bookingCode || "";

      if (data.vehicleTypeId) {
        matchedVehicleTypeId = data.vehicleTypeId;
      } else {
        const vDesc = (data.vehicleType || "car").toLowerCase();
        const matchVehicle = vehicleTypes.find(v => {
          const vName = v.name.toLowerCase();
          return vName.includes(vDesc) || vDesc.includes(vName) ||
            (vDesc === "car" && vName.includes("t")) ||
            (vDesc === "motorbike" && vName.includes("my"));
        });
        if (matchVehicle) {
          matchedVehicleTypeId = matchVehicle.id;
        }
      }

      setFormData(prev => ({
        ...prev,
        plateNumber: targetPlate,
        reservationCode: targetReservation,
        vehicleTypeId: matchedVehicleTypeId,
        gateEntryId: matchedGateId,
        driverType: targetReservation ? "PRE_BOOKED" : prev.driverType
      }));

      setScanMessage("QUÉT QR ĐỒNG BỘ THÀNH CÔNG");
    } catch (e) {
      // Nếu là mã chuỗi thông thường (ví dụ quét trực tiếp biển số hoặc mã vạch)
      setFormData((prev) => ({
        ...prev,
        plateNumber: qrText.length < 15 ? qrText : prev.plateNumber,
        reservationCode: qrText.startsWith("RS") ? qrText : prev.reservationCode,
        vehicleTypeId: matchedVehicleTypeId,
        gateEntryId: matchedGateId
      }));

      setScanMessage("ĐÃ NHẬN MÃ CHUỖI");
    }
  };

  const startScanner = async () => {
    try {
      setIsScanning(true);
      setScanMessage("ĐANG MỞ CAMERA...");

      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
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
        () => { }
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
    setScanMessage("ĐÃ TẮT CAMERA");
  };

  const handleCheckIn = async () => {
    const normalizedPlate = normalizeLicensePlate(formData.plateNumber);
    if (!normalizedPlate) {
      setApiError('Vui lòng nhập biển số xe');
      return;
    }
    if (!isValidVietnamLicensePlate(normalizedPlate)) {
      setApiError(LICENSE_PLATE_HINT);
      return;
    }
    if (!formData.vehicleTypeId || !formData.gateEntryId) {
      setApiError('Vui lòng chọn loại xe và cổng vào');
      return;
    }
    setIsSubmitting(true);
    setApiError('');
    try {
      // 1. Thử gọi API thực tế của Java Backend trước
      const res = await staffApi.checkIn({
        licensePlate: normalizedPlate,
        vehicleTypeId: formData.vehicleTypeId,
        gateEntryId: formData.gateEntryId,
        reservationCode: formData.reservationCode || null,
        driverType: formData.driverType,
        notes: formData.notes || null,
      });
      const backendSession = res.data.data;
      setCheckInResult(backendSession);
      setIsSuccess(true);

      // Cập nhật localStorage để đồng bộ tab Driver lập tức
      if (backendSession) {
        // Dùng dữ liệu thật từ backend không fallback giá trị mock nữa
        const realSlot = (backendSession.floorName && backendSession.zoneCode)
          ? `${backendSession.floorName}-ZONE-${backendSession.zoneCode}`
          : `ZONE-${backendSession.sessionCode || "UNKNOWN"}`;
        const realFloor = backendSession.floorName
          ? `Tầng ${backendSession.floorName}`
          : "Tầng chưa xác định";

        const sessionData = {
          slot: realSlot,
          floor: realFloor,
          area: backendSession.zoneName || "Khu vực đỗ xe",
          vehicle: backendSession.vehicleType || "Phương tiện",
          startTime: new Date(backendSession.entryTime || Date.now()).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) + " hôm nay",
          estimatedFee: backendSession.totalFee || 35000,
          status: "Đang gửi xe",
          buildingName: "Tòa Nhà FPT Landmark",
          licensePlate: backendSession.licensePlate,
          createdTimestamp: backendSession.entryTime ? new Date(backendSession.entryTime).getTime() : Date.now()
        };

        localStorage.setItem("driver_session", JSON.stringify(sessionData));

        // Đồng bộ cả booking: cập nhật slot + floor + status cho khớp backend
        const storedBooking = JSON.parse(localStorage.getItem("driver_booking") || "null");
        if (storedBooking) {
          localStorage.setItem("driver_booking", JSON.stringify({
            ...storedBooking,
            slot: realSlot,
            floor: realFloor,
            status: "Đã đỗ xe thành công"
          }));
        }
      }
    } catch (err) {
      console.error("Backend check-in error:", err);
      const errorMsg = err.response?.data?.message || err.message || "Lỗi kết nối với hệ thống backend";
      setApiError(`Check-in thất bại: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getVehicleLabel = (typeId) => {
    const vt = vehicleTypes.find(v => v.id === typeId);
    return vt ? vt.name : 'Không xác định';
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-[#f8fafc] text-slate-900 flex font-sans">
      {/* Sidebar - Dark Glassmorphism style */}
      <aside
        className={`aside-panel fixed left-0 top-0 bottom-0 z-50 flex h-screen flex-col bg-slate-900 text-white shadow-xl transition-all duration-300 ${collapsed ? "w-20" : "w-72"
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
          <SideLink collapsed={collapsed} to="/staff/check-in" icon={<IconCheckIn />} label="Check-in xe vào" active />
          <SideLink collapsed={collapsed} to="/staff/check-out" icon={<IconCheckOut />} label="Check-out xe ra" />
          <SideLink collapsed={collapsed} to="/staff/history" icon={<IconHistory />} label="Lịch sử phiên gửi" />
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
        className={`main-content-area flex-1 min-h-screen flex flex-col transition-all duration-300 ${collapsed ? "ml-20" : "ml-72"
          }`}
      >
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/80 px-8 backdrop-blur-md">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-slate-900">Check-in xe vào</h2>
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
              <h2 className="text-3xl font-extrabold tracking-tight">Ghi nhận phương tiện vào bãi</h2>
              <p className="mt-2 text-slate-300 text-sm leading-relaxed">
                Sử dụng camera quét mã QR của tài xế để tự động nhận dạng thông tin đăng ký, hoặc nhập tay biển số xe để phân phối chỗ đỗ trống.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            {/* Left Content Area (Camera & Inputs) */}
            <div className="action-panel-item rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-3 flex flex-col overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50 px-6 py-4 flex items-center justify-between">
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab("qr")}
                    className={`font-bold text-sm tracking-wide uppercase pb-1 border-b-2 transition-all cursor-pointer ${activeTab === "qr" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
                      }`}
                  >
                    ▣ Quét mã QR
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("ocr")}
                    className={`font-bold text-sm tracking-wide uppercase pb-1 border-b-2 transition-all cursor-pointer ${activeTab === "ocr" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
                      }`}
                  >
                    Quét Biển số AI
                  </button>
                </div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${activeTab === "qr"
                    ? (isScanning ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600')
                    : (ocrScanning ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600')
                  }`}>
                  {activeTab === "qr" ? (isScanning ? 'Đang quét QR' : 'Chờ quét') : (ocrScanning ? 'Đang nhận dạng' : 'Sẵn sàng')}
                </span>
              </div>

              <div className="p-6 space-y-6 flex-1">
                {activeTab === "qr" ? (
                  <>
                    {/* Scanner Screen Box */}
                    <div className="relative overflow-hidden rounded-2xl bg-slate-950 p-3 shadow-inner border border-slate-800">
                      <div id="qr-reader" className="min-h-[260px] w-full overflow-hidden rounded-xl bg-slate-900" />

                      {!isScanning && (
                        <div className="absolute inset-3 flex flex-col items-center justify-center rounded-xl bg-slate-950/95 text-center">
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-950 text-indigo-400 border border-indigo-500/30 text-3xl mb-4">
                            ▣
                          </div>
                          <p className="font-bold text-white text-md">CAMERA ĐANG TẮT</p>
                          <p className="text-slate-400 text-xs mt-1 max-w-xs px-4">
                            Nhấn nút bắt đầu quét phía dưới để bật máy quét mã QR
                          </p>
                        </div>
                      )}

                      {/* Corner brackets */}
                      <div className="pointer-events-none absolute inset-6 border border-white/10">
                        <span className="absolute -left-1 -top-1 h-5 w-5 border-l-2 border-t-2 border-indigo-400" />
                        <span className="absolute -right-1 -top-1 h-5 w-5 border-r-2 border-t-2 border-indigo-400" />
                        <span className="absolute -bottom-1 -left-1 h-5 w-5 border-b-2 border-l-2 border-indigo-400" />
                        <span className="absolute -bottom-1 -right-1 h-5 w-5 border-b-2 border-r-2 border-indigo-400" />
                      </div>
                    </div>

                    {/* Scan Message Alert */}
                    <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3.5 flex items-center justify-center gap-2 text-sm font-semibold text-slate-700">
                      <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
                      Trạng thái: <span className="text-indigo-600 font-bold">{scanMessage}</span>
                    </div>

                    {/* Trigger Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={startScanner}
                        disabled={isScanning}
                        className="rounded-xl bg-indigo-600 py-3 font-bold text-white shadow-md shadow-indigo-500/10 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none transition-colors cursor-pointer"
                      >
                        Bật máy quét QR
                      </button>

                      <button
                        onClick={stopScanner}
                        disabled={!isScanning}
                        className="rounded-xl border border-slate-200 py-3 font-bold text-slate-650 hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        Tắt camera
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* OCR AI Scanner Box with WebRTC Webcam and Canvas */}
                    <div className="relative overflow-hidden rounded-2xl bg-slate-950 p-3 shadow-inner border border-slate-800">
                      <div className="min-h-[260px] w-full overflow-hidden rounded-xl bg-slate-900 flex flex-col items-center justify-center text-center relative">
                        {isOcrCameraOn ? (
                          <video
                            ref={ocrVideoRef}
                            className="w-full h-[260px] object-cover rounded-lg"
                            playsInline
                            muted
                          />
                        ) : (
                          <div className="space-y-4 max-w-sm p-6">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-3xl mb-1 mx-auto animate-pulse">

                            </div>
                            <p className="font-bold text-white text-md">AI WEB-BASED OCR ACTIVE</p>
                            <p className="text-slate-400 text-xs px-2">
                              Sử dụng Webcam của thiết bị kết hợp thư viện OCR Tesseract.js để tự động nhận dạng biển số xe.
                            </p>
                          </div>
                        )}

                        {ocrScanning && (
                          <div className="absolute inset-0 bg-slate-950/85 flex flex-col items-center justify-center text-center p-6 z-10">
                            <div className="space-y-4">
                              {/* Scanning laser animation */}
                              <div className="relative w-48 h-28 bg-indigo-950/40 border border-indigo-500/30 rounded-lg overflow-hidden flex items-center justify-center mx-auto">
                                <span className="font-mono font-bold text-white tracking-widest text-lg animate-pulse">
                                  [ QUÉT BKS ]
                                </span>
                                <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-400 shadow-md shadow-indigo-500 animate-bounce" style={{ animationDuration: '1.2s' }} />
                              </div>
                              <p className="text-sm text-indigo-400 font-bold animate-pulse"> Trí tuệ nhân tạo đang phân tích ảnh...</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Canvas ẩn phục vụ capture ảnh chụp từ video frame */}
                      <canvas ref={ocrCanvasRef} className="hidden" />

                      {/* Corner brackets */}
                      <div className="pointer-events-none absolute inset-6 border border-white/10">
                        <span className="absolute -left-1 -top-1 h-5 w-5 border-l-2 border-t-2 border-emerald-400" />
                        <span className="absolute -right-1 -top-1 h-5 w-5 border-r-2 border-t-2 border-emerald-400" />
                        <span className="absolute -bottom-1 -left-1 h-5 w-5 border-b-2 border-l-2 border-emerald-400" />
                        <span className="absolute -bottom-1 -right-1 h-5 w-5 border-b-2 border-r-2 border-emerald-400" />
                      </div>
                    </div>

                    {/* OCR Scan Status Alert */}
                    <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3.5 flex items-center justify-center gap-2 text-sm font-semibold text-slate-700">
                      <span className={`h-2.5 w-2.5 rounded-full ${ocrScanning ? 'bg-indigo-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                      Trạng thái: <span className={`${ocrScanning ? 'text-indigo-600' : 'text-emerald-600'} font-bold`}>{ocrResult || "Sẵn sàng quét"}</span>
                    </div>

                    {/* Trigger Buttons for Webcam and Capture */}
                    <div className="grid grid-cols-2 gap-3">
                      {!isOcrCameraOn ? (
                        <button
                          type="button"
                          onClick={startOcrCamera}
                          className="rounded-xl bg-emerald-600 py-3 font-bold text-white shadow-md shadow-emerald-500/10 hover:bg-emerald-700 transition-colors cursor-pointer text-sm"
                        >
                          Bật Camera OCR
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={stopOcrCamera}
                          className="rounded-xl border border-slate-200 py-3 font-bold text-slate-650 hover:bg-slate-50 transition-colors cursor-pointer text-sm"
                        >
                          Tắt Camera
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={captureAndOcr}
                        disabled={!isOcrCameraOn || ocrScanning}
                        className="rounded-xl bg-indigo-600 py-3 font-bold text-white shadow-md shadow-indigo-500/10 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none transition-colors cursor-pointer text-sm flex items-center justify-center gap-1.5"
                      >
                        Chụp & Nhận Diện AI
                      </button>
                    </div>

                    {/* Simulation Triggers for Demo (Backup) */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">Phương án dự phòng mô phỏng (Demo không cần camera):</p>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => handleOcrScan("motorbike")}
                          disabled={ocrScanning}
                          className="rounded-xl border border-indigo-100 bg-indigo-50/50 py-2.5 text-[11px] font-bold text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          ️ Mô phỏng xe máy (59A1)
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOcrScan("car")}
                          disabled={ocrScanning}
                          className="rounded-xl border border-emerald-100 bg-emerald-50/50 py-2.5 text-[11px] font-bold text-emerald-600 hover:bg-emerald-55 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          Mô phỏng ô tô (30G)
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* Main Form Fields */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Biển số xe</label>
                    <input
                      value={formData.plateNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, plateNumber: normalizeLicensePlate(e.target.value) })
                      }
                      placeholder="Nhập biển số, ví dụ: 30A-123.45"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-md font-bold text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Loại xe</label>
                      <select
                        value={formData.vehicleTypeId}
                        onChange={(e) =>
                          setFormData({ ...formData, vehicleTypeId: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                      >
                        {vehicleTypes.map(vt => (
                          <option key={vt.id} value={vt.id}>{vt.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Cổng vào</label>
                      <select
                        value={formData.gateEntryId}
                        onChange={(e) =>
                          setFormData({ ...formData, gateEntryId: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                      >
                        {gates.map(g => (
                          <option key={g.id} value={g.id}>{g.gateName}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Loại vé / Hình thức</label>
                      <select
                        value={formData.driverType}
                        onChange={(e) =>
                          setFormData({ ...formData, driverType: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500 transition-all cursor-pointer bg-white"
                      >
                        <option value="WALK_IN"> Khách vãng lai (Vé lượt)</option>
                        <option value="PRE_BOOKED"> Đăng ký đặt trước (Online)</option>
                        <option value="SUBSCRIBER"> Vé tháng/quý/năm (Miễn phí ra)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Mã đặt chỗ (nếu có)</label>
                      <div className="flex gap-2">
                        <input
                          value={formData.reservationCode}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData(prev => ({
                              ...prev,
                              reservationCode: val,
                              driverType: val.trim() ? "PRE_BOOKED" : prev.driverType
                            }));
                          }}
                          placeholder="Nhập mã reservation nếu có"
                          className="flex-1 rounded-xl border border-slate-200 px-4 py-3.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all bg-white"
                        />
                        <button
                          type="button"
                          onClick={handleFetchBookingInfo}
                          className="px-4 py-3.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold rounded-xl text-xs whitespace-nowrap transition-colors border border-indigo-200 cursor-pointer"
                        >
                          Tìm vé
                        </button>
                      </div>
                    </div>
                  </div>

                  {apiError && (
                    <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-700">
                      ⚠️ {apiError}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Content Area (Status & Summary) */}
            <div className="space-y-6 lg:col-span-2">
              <div className="action-panel-item rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                    <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Thông tin gửi xe</h3>
                    <span className="rounded-full bg-indigo-550/10 border border-indigo-100 px-3 py-1 text-xs font-bold text-indigo-600">
                      {configLoaded ? 'Đã kết nối BE' : 'Đang tải...'}
                    </span>
                  </div>

                  {/* Info Box */}
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 mb-6">
                    <p className="font-bold text-emerald-950 flex items-center gap-1.5 text-sm">
                      <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                      Zone sẽ được tự động gán khi check-in
                    </p>
                    <p className="text-xs text-emerald-600 mt-1">
                      Hệ thống sẽ gợi ý khu vực tối ưu theo loại xe và sức chứa
                    </p>
                  </div>

                  {/* Summary */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Biển số</label>
                      <input
                        value={formData.plateNumber || ''}
                        readOnly
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-650 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Loại xe</label>
                      <input
                        value={getVehicleLabel(formData.vehicleTypeId)}
                        readOnly
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCheckIn}
                  disabled={isSubmitting || !configLoaded}
                  className="mt-8 w-full rounded-xl bg-slate-900 py-3.5 text-md font-bold text-white shadow-lg hover:bg-slate-800 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:not-allowed"
                >
                  {isSubmitting ? 'Đang xử lý...' : 'Xác nhận Check-in'}
                </button>
              </div>

              {/* Success Result Component */}
              {isSuccess && checkInResult && (
                <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 p-6 text-white shadow-lg border border-emerald-500/20 relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 -mb-8 -mr-8 h-24 w-24 rounded-full bg-white/10 blur-xl"></div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-xl flex-shrink-0">
                      ✓
                    </div>

                    <div>
                      <h3 className="text-lg font-bold">Check-in thành công!</h3>
                      <p className="text-xs text-emerald-100 mt-0.5">
                        {checkInResult.guideMessage}
                      </p>
                    </div>
                  </div>

                  {/* Summary Box - Real data from BE */}
                  <div className="mt-5 grid grid-cols-2 gap-4 rounded-xl bg-black/10 p-4 text-xs">
                    <div>
                      <p className="text-emerald-200 font-medium">Mã phiên</p>
                      <p className="font-bold text-sm mt-0.5">#{checkInResult.sessionCode}</p>
                    </div>

                    <div>
                      <p className="text-emerald-200 font-medium">Vị trí đỗ</p>
                      <p className="font-bold text-sm mt-0.5">{checkInResult.zoneName} ({checkInResult.floorName})</p>
                    </div>

                    <div>
                      <p className="text-emerald-200 font-medium">Loại xe</p>
                      <p className="font-bold text-sm mt-0.5">{checkInResult.vehicleType}</p>
                    </div>

                    <div>
                      <p className="text-emerald-200 font-medium">Biển số</p>
                      <p className="font-bold text-sm mt-0.5">{checkInResult.licensePlate}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => { setIsSuccess(false); setCheckInResult(null); setFormData(prev => ({ ...prev, plateNumber: '', reservationCode: '', notes: '' })); }}
                    className="mt-5 w-full rounded-xl bg-white py-2.5 font-bold text-emerald-700 text-sm hover:bg-emerald-50 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    ➕ Check-in xe tiếp theo
                  </button>
                </div>
              )}
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