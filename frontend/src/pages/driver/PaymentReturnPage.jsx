import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { staffApi } from "../../api/parkingApi";

/* ── tiny confetti engine ── */
function Confetti({ active }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!active) return;
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    let w = (c.width = window.innerWidth);
    let h = (c.height = window.innerHeight);
    const colors = ["#34d399", "#60a5fa", "#f472b6", "#fbbf24", "#a78bfa", "#fb923c", "#38bdf8"];
    const pieces = Array.from({ length: 120 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h - h,
      r: Math.random() * 6 + 3,
      d: Math.random() * 120,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 5,
      tiltAngle: 0,
      tiltInc: Math.random() * 0.07 + 0.05,
      vx: Math.random() * 2 - 1,
      vy: Math.random() * 3 + 2,
      shape: Math.random() > 0.5 ? "rect" : "circle",
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      pieces.forEach((p) => {
        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.85;
        if (p.shape === "rect") {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.tiltAngle * Math.PI) / 180);
          ctx.fillRect(-p.r / 2, -p.r, p.r, p.r * 1.6);
          ctx.restore();
        } else {
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
        p.y += p.vy;
        p.x += p.vx + Math.sin(p.d * 0.02) * 0.5;
        p.tiltAngle += p.tiltInc;
        if (p.y > h + 20) { p.y = -20; p.x = Math.random() * w; }
      });
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    draw();
    const onResize = () => { w = c.width = window.innerWidth; h = c.height = window.innerHeight; };
    window.addEventListener("resize", onResize);
    const timeout = setTimeout(() => cancelAnimationFrame(raf), 6000);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); clearTimeout(timeout); };
  }, [active]);
  if (!active) return null;
  return <canvas ref={canvasRef} className="fixed inset-0 z-50 pointer-events-none" />;
}

/* ── animated checkmark ── */
function AnimatedCheck() {
  return (
    <div className="relative mx-auto mb-6 flex h-28 w-28 items-center justify-center">
      <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400/20" />
      <div className="absolute inset-2 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-2xl shadow-emerald-500/40" />
      <svg className="relative z-10" width="52" height="52" viewBox="0 0 52 52" fill="none">
        <path
          d="M14 27L22 35L38 17"
          stroke="white"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: 60,
            strokeDashoffset: 60,
            animation: "checkDraw 0.7s ease 0.5s forwards",
          }}
        />
      </svg>
      <style>{`@keyframes checkDraw { to { stroke-dashoffset: 0 } }`}</style>
    </div>
  );
}

/* ── animated X mark ── */
function AnimatedFail() {
  return (
    <div className="relative mx-auto mb-6 flex h-28 w-28 items-center justify-center">
      <div className="absolute inset-0 animate-ping rounded-full bg-red-400/20" />
      <div className="absolute inset-2 rounded-full bg-gradient-to-br from-red-500 to-rose-600 shadow-2xl shadow-red-500/40" />
      <svg className="relative z-10" width="44" height="44" viewBox="0 0 44 44" fill="none">
        <path d="M14 14L30 30M30 14L14 30" stroke="white" strokeWidth="4.5" strokeLinecap="round"
          style={{ strokeDasharray: 50, strokeDashoffset: 50, animation: "checkDraw 0.5s ease 0.5s forwards" }} />
      </svg>
    </div>
  );
}

/* ── receipt row ── */
function ReceiptRow({ label, value, highlight, mono }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
      <span className={`text-sm font-bold ${highlight ? "text-emerald-600" : "text-slate-800"} ${mono ? "font-mono tracking-wider" : ""}`}>{value}</span>
    </div>
  );
}

export default function PaymentReturnPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState({ loading: true, success: false, message: "", data: {} });
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await staffApi.getVnPayPassReturn(location.search || "");
        const data = res.data?.data || {};
        const success = Boolean(data.success);
        setState({ loading: false, success, message: data.message || "", data });
        setTimeout(() => setShowContent(true), 200);
      } catch (err) {
        setState({
          loading: false,
          success: false,
          message: err.response?.data?.message || "Không thể xác minh kết quả thanh toán.",
          data: {},
        });
        setTimeout(() => setShowContent(true), 200);
      }
    })();
  }, [location.search]);

  // Extract transaction info from URL params
  const params = new URLSearchParams(location.search);
  const txnRef = params.get("vnp_TxnRef") || "—";
  const isSessionPayment = state.data?.paymentType === "SESSION" || txnRef.startsWith("SESSION-");
  const amount = params.get("vnp_Amount") ? (parseInt(params.get("vnp_Amount")) / 100).toLocaleString("vi-VN") + "đ" : "—";
  const bankCode = params.get("vnp_BankCode") || "—";
  const transNo = params.get("vnp_TransactionNo") || "—";
  const payDate = params.get("vnp_PayDate") || "";
  const formattedDate = payDate
    ? `${payDate.slice(6, 8)}/${payDate.slice(4, 6)}/${payDate.slice(0, 4)} ${payDate.slice(8, 10)}:${payDate.slice(10, 12)}:${payDate.slice(12, 14)}`
    : new Date().toLocaleString("vi-VN");

  if (state.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mx-auto h-20 w-20">
            <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-500 animate-spin" />
          </div>
          <p className="mt-6 text-sm font-bold text-slate-500 animate-pulse">Đang xác minh thanh toán...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50 relative overflow-hidden">
      <Confetti active={state.success} />

      {/* decorative bg */}
      <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-gradient-to-br from-emerald-100 to-cyan-100 blur-3xl opacity-60" />
      <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-gradient-to-br from-amber-100 to-rose-100 blur-3xl opacity-40" />

      <div className={`relative z-10 flex min-h-screen flex-col items-center justify-center px-5 py-10 transition-all duration-700 ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>

        {/* main card */}
        <div className="w-full max-w-lg">

          {/* icon */}
          {state.success ? <AnimatedCheck /> : <AnimatedFail />}

          {/* status badge */}
          <div className="text-center mb-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] ${
              state.success
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                : "bg-red-50 text-red-700 ring-1 ring-red-200"
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${state.success ? "bg-emerald-500" : "bg-red-500"} animate-pulse`} />
              {state.success ? "Giao dịch thành công" : "Giao dịch thất bại"}
            </span>
          </div>

          {/* title */}
          <h1 className="mt-4 text-center text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
            {state.success ? "Thanh toán hoàn tất!" : "Thanh toán không thành công"}
          </h1>
          <p className="mt-3 text-center text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            {state.success
              ? isSessionPayment
                ? "Phí gửi xe đã được thanh toán. Phiên gửi xe đã hoàn tất và barrier có thể mở cho xe ra bãi."
                : "Gói hội viên của bạn đã được kích hoạt. Cảm ơn bạn đã sử dụng dịch vụ Smart Parking!"
              : state.message || "Vui lòng thử lại hoặc liên hệ hỗ trợ."}
          </p>

          {/* receipt card */}
          <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
            {/* receipt header */}
            <div className={`px-6 py-4 ${state.success ? "bg-gradient-to-r from-emerald-500 to-teal-500" : "bg-gradient-to-r from-red-500 to-rose-500"}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Biên lai giao dịch</p>
                  <p className="mt-0.5 text-lg font-black text-white">Smart Parking</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                </div>
              </div>
            </div>

            {/* receipt body */}
            <div className="px-6 py-5">
              <ReceiptRow label="Mã đơn hàng" value={txnRef} mono />
              <ReceiptRow label="Số tiền" value={amount} highlight={state.success} />
              <ReceiptRow label="Ngân hàng" value={bankCode} />
              <ReceiptRow label="Mã giao dịch" value={transNo} mono />
              <ReceiptRow label="Thời gian" value={formattedDate} />
              <ReceiptRow label="Trạng thái" value={state.success ? "✓ Đã thanh toán" : "✗ Thất bại"} highlight={state.success} />
            </div>

            {/* receipt footer */}
            <div className="border-t border-dashed border-slate-200 px-6 py-4 bg-slate-50/50">
              <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Powered by VNPay · {new Date().getFullYear()}
              </p>
            </div>
          </div>

          {/* action buttons */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => navigate(isSessionPayment ? "/driver/dashboard#history-table" : "/driver/dashboard?tab=profile")}
              className={`group flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-2xl px-7 py-3.5 text-xs font-black uppercase tracking-[0.14em] transition-all shadow-lg cursor-pointer ${
                state.success
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
                  : "bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-x-0.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
              {isSessionPayment ? "Xem lịch sử gửi xe" : "Về hồ sơ hội viên"}
            </button>
            <button
              onClick={() => navigate("/driver/dashboard")}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-7 py-3.5 text-xs font-black uppercase tracking-[0.14em] text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 hover:-translate-y-0.5 cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
              </svg>
              Bảng điều khiển
            </button>
          </div>

          {/* security note */}
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-slate-100 bg-white/60 backdrop-blur-sm p-4">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <p className="text-[11px] leading-5 text-slate-400">
              Giao dịch được bảo mật bởi <span className="font-bold text-slate-500">VNPay</span> với mã hóa SSL 256-bit.
              Mọi thông tin thẻ không được lưu trữ trên hệ thống Smart Parking.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
