import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { staffApi } from "../../api/parkingApi";
import ParkingDigitalTwin3D from "../manager/ParkingDigitalTwin3D";

export default function ParkingTwin3DPage() {
  const navigate = useNavigate();
  const [zones, setZones] = useState([]);
  const [floors, setFloors] = useState([]);
  const [gates, setGates] = useState([]);
  const [sessions, setSessions] = useState([]);

  const fetchData = async () => {
    try {
      const res = await staffApi.getParkingConfig();
      const config = res.data.data || {};
      setFloors(config.floors || []);
      setZones(
        (config.zones || []).map((z) => ({
          id: z.id,
          zoneName: z.zoneName || `Khu ${z.zoneCode}`,
          zoneCode: z.zoneCode,
          floorName: z.floorName || "B1",
          vehicleTypeName: z.vehicleTypeName || "Xe máy",
          capacity: z.capacity || 0,
          currentCount: z.currentCount || 0,
          reservedCount: z.reservedCount || 0,
          status: z.status || "ACTIVE",
        }))
      );
      setGates(
        (config.gates || []).map((g) => ({
          id: g.id,
          gateCode: g.gateCode,
          gateName: g.gateName,
          gateType: g.gateType,
          status: g.isActive === false ? "INACTIVE" : "ACTIVE",
        }))
      );
    } catch (err) {
      console.warn("3D Page: Failed to load config", err);
    }

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const role = String(user.role || "").toLowerCase();
    const canReadAllSessions = ["staff", "manager", "admin"].includes(role);

    if (!canReadAllSessions) {
      setSessions([]);
      return;
    }

    try {
      const res = await staffApi.getAllSessionsHistory();
      setSessions(
        (res.data.data || []).map((s) => ({
          id: s.sessionId,
          status: s.status || (s.exitTime ? "COMPLETED" : "ACTIVE"),
        }))
      );
    } catch (err) {
      console.warn("3D Page: Failed to load sessions", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Detect which role's dashboard to go back to
  const goBack = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const role = user.role || "staff";
    navigate(`/${role}/dashboard`);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#020617]">
      <button
        onClick={goBack}
        className="fixed top-5 left-5 z-[10000] flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold backdrop-blur-xl transition-all cursor-pointer shadow-xl"
      >
        ← Quay lại Dashboard
      </button>
      <ParkingDigitalTwin3D
        zones={zones}
        floors={floors}
        gates={gates}
        sessions={sessions}
        onRefresh={fetchData}
      />
    </div>
  );
}
