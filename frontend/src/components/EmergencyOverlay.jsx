import { useEffect, useMemo, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { staffApi } from "../api/parkingApi";

const ROLE_LABELS = {
  DRIVER: "Tài xế",
  STAFF: "Nhân viên bãi xe",
  SECURITY: "Bảo vệ an ninh",
  MANAGER: "Quản lý vận hành",
  ADMIN: "Quản trị viên",
};

function formatTime(value) {
  if (!value) return new Date().toLocaleString("vi-VN");
  return new Date(value).toLocaleString("vi-VN");
}

export default function EmergencyOverlay({ userRole }) {
  const [status, setStatus] = useState({ active: false });
  const [connected, setConnected] = useState(false);
  const [dismissedNotice, setDismissedNotice] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const stompClientRef = useRef(null);

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, [userRole]);

  const role = String(currentUser.role || "").toUpperCase();
  const roleLabel = ROLE_LABELS[role] || "Người dùng hệ thống";

  const playAlarm = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const gain = ctx.createGain();
      gain.gain.value = 0.05;
      gain.connect(ctx.destination);

      [0, 180, 360, 540].forEach((delay, index) => {
        const oscillator = ctx.createOscillator();
        oscillator.type = "square";
        oscillator.frequency.value = index % 2 === 0 ? 740 : 980;
        oscillator.connect(gain);
        oscillator.start(ctx.currentTime + delay / 1000);
        oscillator.stop(ctx.currentTime + delay / 1000 + 0.13);
      });

      window.setTimeout(() => ctx.close().catch(() => {}), 1300);
    } catch (err) {
      console.warn("Cannot play emergency alarm:", err);
    }
  };

  const fetchStatus = async () => {
    try {
      const res = await staffApi.getEmergencyStatus();
      setStatus(res.data.data || { active: false });
    } catch (err) {
      console.warn("Cannot fetch emergency status:", err);
    }
  };

  useEffect(() => {
    if (!userRole) {
      setStatus({ active: false });
      return;
    }

    fetchStatus();

    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
        if (str.includes("ERROR")) console.error("[GLOBAL-SOS-STOMP]", str);
      },
    });

    client.onConnect = () => {
      setConnected(true);
      client.subscribe("/topic/emergency", (message) => {
        try {
          const data = JSON.parse(message.body);
          const nextStatus = {
            active: Boolean(data.active),
            eventId: data.eventId,
            buildingId: data.buildingId,
            buildingName: data.buildingName,
            reason: data.reason,
            message: data.message,
            activatedAt: data.timestamp,
          };
          setStatus(nextStatus);
          setDismissedNotice(false);
          if (nextStatus.active) playAlarm();
        } catch (err) {
          console.error("Cannot parse emergency broadcast:", err);
        }
      });
    };

    client.onDisconnect = () => setConnected(false);
    client.onStompError = () => setConnected(false);

    client.activate();
    stompClientRef.current = client;

    return () => {
      if (client.active) client.deactivate();
      stompClientRef.current = null;
      setConnected(false);
    };
  }, [userRole]);

  const deactivateEmergency = async () => {
    if (role !== "SECURITY" && role !== "MANAGER" && role !== "ADMIN") return;
    if (!currentUser.id) {
      alert("Thiếu user.id thật trong localStorage, vui lòng đăng nhập lại.");
      return;
    }

    setIsDeactivating(true);
    try {
      const res = await staffApi.deactivateEmergency({
        deactivatedByUserId: currentUser.id,
        notes: `SOS cancelled from global overlay by ${currentUser.fullName || currentUser.email || role}`,
      });
      setStatus(res.data.data || { active: false });
      setDismissedNotice(false);
    } catch (err) {
      alert(err.response?.data?.message || "Hủy SOS thất bại");
    } finally {
      setIsDeactivating(false);
    }
  };

  if (!userRole || !status.active) return null;

  const canDeactivateEmergency = role === "SECURITY" || role === "MANAGER" || role === "ADMIN";

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden bg-red-950/95 text-white backdrop-blur-md">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute left-[-10%] top-[-15%] h-96 w-96 rounded-full bg-red-400 blur-3xl" />
        <div className="absolute bottom-[-12%] right-[-8%] h-[32rem] w-[32rem] rounded-full bg-orange-500 blur-3xl" />
      </div>

      <div className="absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12),transparent_32%)]" />

      <main className="relative z-10 flex min-h-screen items-center justify-center p-6">
        <section className="w-full max-w-5xl overflow-hidden rounded-[2.2rem] border-4 border-red-200 bg-red-700 shadow-[0_0_110px_rgba(239,68,68,0.9)]">
          <div className="border-b border-red-300/40 bg-white/10 px-8 py-5 text-center">
            <p className="text-xs font-black uppercase tracking-[0.55em] text-red-100">
              Emergency SOS Broadcast · {connected ? "WebSocket Live" : "Reconnecting"}
            </p>
          </div>

          <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="p-8 md:p-12">
              <div className="flex items-center gap-4">
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-4xl shadow-2xl animate-bounce">
                  🚨
                </span>
                <div>
                  <h1 className="text-4xl font-black leading-none tracking-tight md:text-6xl">
                    KHẨN CẤP
                  </h1>
                  <p className="mt-2 text-sm font-black uppercase tracking-[0.28em] text-red-100">
                    Toàn bộ barrier đã mở
                  </p>
                </div>
              </div>

              <p className="mt-8 max-w-3xl text-2xl font-black leading-tight md:text-3xl">
                {status.message || "🚨 KHẨN CẤP — TOÀN BỘ BARRIER ĐÃ MỞ — SƠ TÁN NGAY"}
              </p>

              <div className="mt-8 grid gap-4 rounded-3xl bg-black/20 p-5 text-sm font-bold md:grid-cols-2">
                <Info label="Vai trò hiện tại" value={roleLabel} />
                <Info label="Tòa nhà" value={status.buildingName || "SmartParking"} />
                <Info label="Lý do" value={status.reason || "EMERGENCY_SOS"} />
                <Info label="Thời điểm nhận cảnh báo" value={formatTime(status.activatedAt)} />
              </div>

              <div className="mt-8 rounded-3xl border border-white/25 bg-white/10 p-5">
                <p className="text-sm font-black uppercase tracking-widest text-red-100">
                  Hướng dẫn tức thời
                </p>
                <ul className="mt-3 space-y-2 text-sm font-semibold text-red-50">
                  <li>• Dừng mọi thao tác check-in/check-out, thanh toán hoặc đặt chỗ.</li>
                  <li>• Ưu tiên sơ tán người và phương tiện khỏi khu vực nguy hiểm.</li>
                  <li>• Staff/Security phối hợp hướng dẫn xe ra theo lối gần nhất.</li>
                  <li>• Security/Manager/Admin được phép hủy SOS sau khi sự cố đã an toàn.</li>
                </ul>
              </div>
            </div>

            <aside className="flex flex-col justify-between border-t border-red-300/30 bg-red-950/35 p-8 lg:border-l lg:border-t-0">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.35em] text-red-100">
                  System Lock
                </p>
                <div className="mt-5 rounded-3xl bg-black/25 p-5">
                  <p className="text-5xl font-black">LOCKED</p>
                  <p className="mt-2 text-sm font-bold text-red-100">
                    Giao diện thao tác bình thường đang bị khóa bởi emergency overlay.
                  </p>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                {canDeactivateEmergency ? (
                  <button
                    type="button"
                    onClick={deactivateEmergency}
                    disabled={isDeactivating}
                    className="w-full rounded-2xl bg-white px-4 py-4 text-center text-sm font-black uppercase tracking-widest text-red-700 shadow-2xl transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isDeactivating ? "Đang hủy SOS..." : "Hủy SOS — xác nhận an toàn"}
                  </button>
                ) : (
                  <p className="rounded-2xl bg-black/25 px-4 py-3 text-center text-sm font-bold text-red-100">
                    Chỉ Security/Manager/Admin mới có quyền hủy SOS.
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => setDismissedNotice(true)}
                  className="w-full rounded-2xl border border-white/25 px-4 py-3 text-sm font-black text-white transition hover:bg-white/10"
                >
                  Tôi đã đọc hướng dẫn
                </button>

                {dismissedNotice && (
                  <p className="text-center text-xs font-semibold text-red-100">
                    Cảnh báo vẫn giữ toàn màn hình cho đến khi SOS được hủy.
                  </p>
                )}
              </div>
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-red-100/80">{label}</p>
      <p className="mt-1 text-base font-black text-white">{value}</p>
    </div>
  );
}
