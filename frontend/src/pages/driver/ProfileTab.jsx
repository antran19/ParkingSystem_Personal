import { useState, useEffect } from "react";
import { staffApi } from "../../api/parkingApi";
import { isValidVietnamLicensePlate, normalizeLicensePlate, LICENSE_PLATE_HINT } from "../../utils/licensePlate";

const PASS_TYPE_INFO = {
  MONTHLY: { label: "Gói tháng", months: 1, code: "M", color: "from-slate-800 to-slate-950", discount: null },
  QUARTERLY: { label: "Gói quý", months: 3, code: "Q", color: "from-cyan-800 to-slate-950", discount: null },
  YEARLY: { label: "Gói năm", months: 12, code: "Y", color: "from-amber-700 to-slate-950", discount: "Giảm 10%" },
};

const LicensePlate = ({ plate }) => (
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-slate-200 bg-white font-mono font-bold text-slate-800 shadow-sm text-xs tracking-widest">
    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block mr-0.5 animate-pulse"></span>
    {plate}
  </span>
);

export default function ProfileTab({ user, newPlateInput, setNewPlateInput, handleAddPlate, handleDeletePlate, setActiveTab, loadUserData }) {
  const [pricingPlans, setPricingPlans] = useState([]);
  const [myPasses, setMyPasses] = useState([]);
  const [config, setConfig] = useState({ buildings: [], vehicleTypes: [] });
  const [selectedPlan, setSelectedPlan] = useState(null); // { vehicleTypeId, vehicleTypeName, monthlyPrice, buildingId }
  const [selectedPassType, setSelectedPassType] = useState("MONTHLY");
  const [regPlate, setRegPlate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  useEffect(() => {
    (async () => {
      try {
        const [plansRes, passesRes, configRes] = await Promise.all([
          staffApi.getDriverPricingPlans(),
          staffApi.getDriverPasses(),
          staffApi.getParkingConfig(),
        ]);
        setPricingPlans(plansRes.data?.data || []);
        setMyPasses(passesRes.data?.data || []);
        const c = configRes.data?.data || {};
        setConfig({ buildings: c.buildings || [], vehicleTypes: c.vehicleTypes || [] });
      } catch (err) {
        console.warn("ProfileTab: Failed to load data", err);
      }
    })();
  }, []);

  const calcFee = (monthlyPrice, passType) => {
    const mp = Number(monthlyPrice || 0);
    if (passType === "QUARTERLY") return mp * 3;
    if (passType === "YEARLY") return Math.round(mp * 12 * 0.9);
    return mp;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const normalizedPlate = normalizeLicensePlate(regPlate);
    if (!selectedPlan || !normalizedPlate) return;
    if (!isValidVietnamLicensePlate(normalizedPlate)) {
      showToast(LICENSE_PLATE_HINT, "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await staffApi.registerDriverPass({
        buildingId: selectedPlan.buildingId,
        vehicleTypeId: selectedPlan.vehicleTypeId,
        licensePlate: normalizedPlate,
        passType: selectedPassType,
      });
      const paymentUrl = res.data?.data?.paymentUrl;
      if (paymentUrl) {
        window.location.href = paymentUrl;
        return;
      }
      showToast("Đã tạo đơn thanh toán thành công!");
      setSelectedPlan(null);
      setRegPlate("");
      // Reload passes
      const passesRes = await staffApi.getDriverPasses();
      setMyPasses(passesRes.data?.data || []);
      loadUserData();
    } catch (err) {
      showToast(err.response?.data?.message || "Đăng ký thất bại", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinuePayment = async (passId) => {
    setSubmitting(true);
    try {
      const res = await staffApi.continueDriverPassPayment(passId);
      const paymentUrl = res.data?.data?.paymentUrl;
      if (paymentUrl) {
        window.location.href = paymentUrl;
        return;
      }
      showToast("Không lấy được liên kết thanh toán", "error");
    } catch (err) {
      showToast(err.response?.data?.message || "Không thể tiếp tục thanh toán", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const activePasses = myPasses.filter(p => p.status === "ACTIVE");
  const pendingPasses = myPasses.filter(p => p.status === "PENDING_PAYMENT");
  const expiredPasses = myPasses.filter(p => !["ACTIVE", "PENDING_PAYMENT"].includes(p.status));
  const primaryPass = activePasses[0];
  const totalActiveValue = activePasses.reduce((sum, pass) => sum + Number(pass.fee || 0), 0);
  const nearestExpiry = activePasses.reduce((min, pass) => {
    const days = Math.max(0, Math.ceil((new Date(pass.endDate) - new Date()) / (1000 * 60 * 60 * 24)));
    return Math.min(min, days);
  }, activePasses.length ? 9999 : 0);

  return (
    <div className="space-y-8 animate-fadeIn">
      {toast && (
        <div className={`fixed top-5 right-5 z-[9999] flex items-center gap-2 rounded-2xl px-5 py-3.5 text-xs font-bold text-white shadow-2xl animate-bounce ${toast.type === "success" ? "bg-emerald-500" : "bg-red-500"}`}>
          <span>{toast.msg}</span>
        </div>
      )}

      <section className="relative overflow-hidden rounded-[2rem] border border-slate-900/10 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/15 md:p-8">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute left-1/2 top-10 h-48 w-48 rounded-full bg-amber-300/10 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.9)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.9)_1px,transparent_1px)] [background-size:42px_42px]" />

        <div className="relative grid gap-7 lg:grid-cols-[1.35fr_.65fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-100">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,.9)]" />
              Driver Membership Console
            </div>
            <h3 className="mt-5 max-w-2xl text-3xl font-black tracking-[-0.04em] text-white md:text-5xl">
              Hồ sơ hội viên & đặc quyền gửi xe
            </h3>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
              Quản lý biển số, theo dõi vé định kỳ và đăng ký gói thành viên theo dữ liệu giá thực tế của hệ thống.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
              <HeroMetric label="Biển số" value={user.licensePlates.length} />
              <HeroMetric label="Vé hiệu lực" value={activePasses.length} tone="text-emerald-200" />
              <HeroMetric label="Sắp hết hạn" value={activePasses.length ? `${nearestExpiry} ngày` : "—"} tone="text-amber-200" />
              <HeroMetric label="Giá trị gói" value={`${totalActiveValue.toLocaleString("vi-VN")}đ`} tone="text-cyan-200" />
            </div>
          </div>

          <div className="relative rounded-3xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Trạng thái hội viên</p>
                <p className="mt-1 text-2xl font-black text-white">{primaryPass ? "Premium Active" : "Standard"}</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-500 text-2xl shadow-lg shadow-amber-500/20">
                {primaryPass ? "VIP" : "STD"}
              </div>
            </div>
            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Gói nổi bật</p>
              <p className="mt-2 text-sm font-black text-white">
                {primaryPass ? `${PASS_TYPE_INFO[primaryPass.passType]?.label || primaryPass.passType} · ${primaryPass.licensePlate}` : "Chưa có vé định kỳ"}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-400">
                {primaryPass ? `Hiệu lực đến ${new Date(primaryPass.endDate).toLocaleDateString("vi-VN")}` : "Chọn một gói bên dưới để nâng cấp trải nghiệm gửi xe."}
              </p>
            </div>
            <button onClick={() => setActiveTab("dashboard")} className="mt-5 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-white transition-all hover:bg-white/15 cursor-pointer">
              Quay lại bảng điều khiển
            </button>
          </div>
        </div>
      </section>

      {/* ===== GÓI DỊCH VỤ ===== */}
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-[0.18em]">Marketplace gói dịch vụ</h4>
            <p className="mt-2 text-xs text-slate-400">Chọn loại xe và gói phù hợp để đăng ký vé định kỳ. Giá lấy từ bảng giá thật trên hệ thống.</p>
          </div>
          <span className="w-fit rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-700">Live pricing</span>
        </div>

        {pricingPlans.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
            Chưa có gói dịch vụ nào được cấu hình. Liên hệ Admin.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {pricingPlans.map((plan) => {
              const vtName = plan.vehicleType?.name || config.vehicleTypes.find(v => v.id === plan.vehicleTypeId)?.name || "Xe";
              const buildingName = plan.building?.buildingName || config.buildings.find(b => b.id === plan.buildingId)?.buildingName || "Bãi xe";
              const monthlyPrice = Number(plan.pricePerUnit || 0);

              return (
                <div key={plan.id} className="action-panel-item group relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-cyan-200 hover:shadow-2xl hover:shadow-cyan-950/10">
                  <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full bg-cyan-100 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
                  <div className="relative flex items-center justify-between mb-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-xs font-black tracking-widest text-white shadow-lg shadow-slate-900/10">PASS</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-full border border-cyan-100">{vtName}</span>
                  </div>
                  <h5 className="relative text-lg font-black text-slate-950">{buildingName}</h5>
                  <p className="relative text-xs text-slate-400 mt-1 mb-4">Giá cơ bản: <span className="font-black text-slate-800">{monthlyPrice.toLocaleString("vi-VN")}đ/tháng</span></p>

                  {/* 3 plan types */}
                  <div className="space-y-2.5 mb-5">
                    {Object.entries(PASS_TYPE_INFO).map(([type, info]) => {
                      const fee = calcFee(monthlyPrice, type);
                      return (
                        <button key={type} onClick={() => { setSelectedPlan({ vehicleTypeId: plan.vehicleType?.id || plan.vehicleTypeId, vehicleTypeName: vtName, monthlyPrice, buildingId: plan.building?.id || plan.buildingId, buildingName }); setSelectedPassType(type); }}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${selectedPlan?.vehicleTypeId === (plan.vehicleType?.id || plan.vehicleTypeId) && selectedPassType === type ? "border-indigo-400 bg-indigo-50 shadow-md" : "border-slate-100 bg-slate-50/50 hover:border-slate-200"}`}>
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-[10px] font-black tracking-widest text-white">{info.code}</span>
                            <div>
                              <span className="text-xs font-black text-slate-800">{info.label}</span>
                              {info.discount && <span className="ml-2 text-[9px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">{info.discount}</span>}
                            </div>
                          </div>
                          <span className="text-sm font-black text-slate-900">{fee.toLocaleString("vi-VN")}đ</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===== FORM ĐĂNG KÝ ===== */}
      {selectedPlan && (
        <div className="action-panel-item relative overflow-hidden rounded-[2rem] border border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-amber-50 p-8 shadow-xl shadow-cyan-950/10">
          <div className="absolute right-8 top-6 rounded-full bg-white/70 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-cyan-700 ring-1 ring-cyan-100">
            Secure checkout
          </div>
          <h4 className="text-sm font-extrabold text-slate-950 uppercase tracking-[0.18em] mb-5 flex items-center gap-2">
            Đăng ký {PASS_TYPE_INFO[selectedPassType].label} — {selectedPlan.vehicleTypeName}
          </h4>
          <form onSubmit={handleRegister} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Biển số xe đăng ký</label>
              <input
                type="text"
                value={regPlate}
                onChange={(e) => setRegPlate(normalizeLicensePlate(e.target.value))}
                placeholder="Ví dụ: 51F-123.45"
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-3 font-mono font-bold text-sm tracking-wider outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all bg-white text-slate-800"
              />
              <p className="mt-2 text-[10px] font-semibold text-slate-400">{LICENSE_PLATE_HINT}</p>
            </div>
            <div className="text-left md:text-right">
              <p className="text-[10px] font-bold text-slate-400 mb-1">Tổng thanh toán</p>
              <p className="text-2xl font-black text-indigo-600">{calcFee(selectedPlan.monthlyPrice, selectedPassType).toLocaleString("vi-VN")}đ</p>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-indigo-600 text-white px-8 py-3.5 font-extrabold hover:bg-indigo-700 transition-colors text-sm shadow-xl shadow-indigo-600/20 whitespace-nowrap disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Đang xử lý..." : "Xác nhận đăng ký"}
            </button>
          </form>
          <p className="text-[10px] text-slate-400 mt-3">* Sau khi tạo đơn, hệ thống sẽ chuyển bạn sang VNPay Sandbox. Vé chỉ kích hoạt khi VNPay xác nhận thanh toán thành công.</p>
        </div>
      )}

      {pendingPasses.length > 0 && (
        <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 md:p-8">
          <h4 className="text-sm font-extrabold text-amber-900 uppercase tracking-[0.18em]">Đơn chờ thanh toán ({pendingPasses.length})</h4>
          <p className="mt-1 text-xs font-medium text-amber-700/70">Các gói này đã tạo đơn nhưng chưa được VNPay xác nhận thanh toán thành công.</p>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingPasses.map(pass => (
              <div key={pass.id} className="rounded-2xl border border-amber-200 bg-white p-5 text-xs shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Pending Payment</p>
                    <p className="mt-2 text-base font-black text-slate-900">{PASS_TYPE_INFO[pass.passType]?.label || pass.passType}</p>
                    <p className="mt-1 font-mono font-black tracking-wider text-slate-600">{pass.licensePlate}</p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-amber-700">Chờ thanh toán</span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-amber-100 pt-4">
                  <span className="font-bold text-slate-500">Số tiền</span>
                  <span className="text-sm font-black text-slate-950">{Number(pass.fee || 0).toLocaleString("vi-VN")}đ</span>
                </div>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleContinuePayment(pass.id)}
                  className="mt-4 w-full rounded-xl bg-amber-600 px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-white transition hover:bg-amber-700 disabled:opacity-50 cursor-pointer"
                >
                  Thanh toán tiếp qua VNPay
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== VÉ ĐÃ MUA ===== */}
      {activePasses.length > 0 && (
        <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 md:p-8">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-[0.18em]">Vé đang hoạt động ({activePasses.length})</h4>
              <p className="mt-1 text-xs font-medium text-slate-400">Các quyền gửi xe còn hiệu lực, hiển thị theo thời hạn còn lại.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activePasses.map(pass => {
              const info = PASS_TYPE_INFO[pass.passType] || PASS_TYPE_INFO.MONTHLY;
              const daysLeft = Math.max(0, Math.ceil((new Date(pass.endDate) - new Date()) / (1000*60*60*24)));
              return (
                <div key={pass.id} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${info.color} p-6 text-white shadow-lg`}>
                  <div className="absolute right-0 top-0 -mr-10 -mt-10 h-28 w-28 rounded-full bg-white/10 blur-xl" />
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full">{info.label}</span>
                      <p className="text-lg font-black mt-2">{pass.vehicleType?.name || "Xe"}</p>
                    </div>
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-xs font-black tracking-widest text-white">{info.code}</span>
                  </div>
                  <div className="space-y-1 text-xs font-semibold text-white/85">
                    <p>Biển số: <span className="font-black text-white font-mono">{pass.licensePlate}</span></p>
                    <p>Hiệu lực: {new Date(pass.startDate).toLocaleDateString("vi-VN")} → {new Date(pass.endDate).toLocaleDateString("vi-VN")}</p>
                    <p>Phí: <span className="font-black text-white">{Number(pass.fee || 0).toLocaleString("vi-VN")}đ</span></p>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="h-1.5 flex-1 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-white/80 rounded-full transition-all" style={{ width: `${Math.min(100, (daysLeft / (info.months * 30)) * 100)}%` }} />
                    </div>
                    <span className="text-[10px] font-black">{daysLeft} ngày</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {expiredPasses.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Vé hết hạn / đã hủy ({expiredPasses.length})</h4>
          <div className="space-y-2">
            {expiredPasses.map(pass => (
              <div key={pass.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 text-xs">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-200 text-[10px] font-black tracking-widest text-slate-500">OLD</span>
                  <div>
                    <span className="font-bold text-slate-600">{pass.vehicleType?.name || "Xe"} · {pass.passType}</span>
                    <p className="text-slate-400 font-medium">Biển: {pass.licensePlate} · {new Date(pass.startDate).toLocaleDateString("vi-VN")} → {new Date(pass.endDate).toLocaleDateString("vi-VN")}</p>
                  </div>
                </div>
                <span className="text-[9px] font-black uppercase text-slate-400 bg-slate-100 px-2 py-1 rounded-full">{pass.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== QUẢN LÝ BIỂN SỐ XE ===== */}
      <div className="action-panel-item overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-950 to-slate-800 p-6 text-white md:p-8">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">Vehicle Registry</p>
          <h4 className="mt-2 text-xl font-black tracking-tight">Danh sách biển số xe đăng ký</h4>
          <p className="mt-2 text-xs font-medium text-slate-400">Các biển số này được dùng khi đặt chỗ, check-in và tra cứu phiên gửi xe.</p>
        </div>
        <div className="space-y-6 p-6 md:p-8">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-3.5">Xe đã đăng ký trong hồ sơ</span>
            {user.licensePlates.length === 0 ? (
              <p className="text-slate-400 font-bold italic py-2 text-xs">Chưa có biển số xe nào được liên kết vào tài khoản.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {user.licensePlates.map((plate, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-50 border border-slate-150 p-4 rounded-2xl hover:border-indigo-100 transition-colors">
                    <LicensePlate plate={plate} />
                    <button onClick={() => handleDeletePlate(plate)} className="text-xs font-bold text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-2 rounded-xl transition-all cursor-pointer" title="Xóa biển số này">
                      Xóa
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="pt-6 border-t border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-3">Đăng ký thêm phương tiện mới</span>
            <form onSubmit={handleAddPlate} className="flex gap-3 max-w-md">
              <input type="text" value={newPlateInput} onChange={(e) => setNewPlateInput(normalizeLicensePlate(e.target.value))} placeholder="Nhập biển số xe" required className="flex-1 rounded-xl border border-slate-200 px-4 py-3 font-mono font-bold text-xs tracking-wider outline-none focus:border-indigo-500 transition-all shadow-inner bg-slate-50 text-slate-800" />
              <button type="submit" className="rounded-xl bg-indigo-600 text-white px-5 py-3 font-extrabold hover:bg-indigo-700 transition-colors text-xs shadow-md shadow-indigo-600/15 whitespace-nowrap cursor-pointer">
                + Thêm xe
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroMetric({ label, value, tone = "text-white" }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-xl">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className={`mt-2 text-lg font-black ${tone}`}>{value}</p>
    </div>
  );
}
