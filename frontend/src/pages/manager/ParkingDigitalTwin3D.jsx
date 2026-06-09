import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const zonePalette = {
  low: { base: 0x14f195, rgb: "20, 241, 149", label: "Còn trống" },
  medium: { base: 0xfbbf24, rgb: "251, 191, 36", label: "Đang đông" },
  high: { base: 0xf97316, rgb: "249, 115, 22", label: "Gần đầy" },
  full: { base: 0xef4444, rgb: "239, 68, 68", label: "Đầy" },
  locked: { base: 0x818cf8, rgb: "129, 140, 248", label: "Tạm khóa" },
};

function floorOrder(floor) {
  return Number.isFinite(floor?.floorNumber) ? floor.floorNumber : 0;
}

function statusForZone(zone) {
  const usage = zone.capacity ? (zone.currentCount || zone.occupied || 0) / zone.capacity : 0;
  const status = String(zone.status || "ACTIVE").toUpperCase();
  if (["LOCKED", "MAINTENANCE"].includes(status)) return "locked";
  if (status === "FULL" || usage >= 1) return "full";
  if (usage >= 0.85) return "high";
  if (usage >= 0.55) return "medium";
  return "low";
}

function normalizeZone(zone) {
  return {
    ...zone,
    currentCount: zone.currentCount ?? zone.occupied ?? 0,
    reservedCount: zone.reservedCount ?? 0,
    floorName: zone.floorName || String(zone.floor || "B1").replace("Tầng ", ""),
    zoneName: zone.zoneName || zone.name || `Zone ${zone.zoneCode || ""}`,
    zoneCode: zone.zoneCode || zone.name || "Z",
    vehicleTypeName: zone.vehicleTypeName || (zone.type === "O_TO" ? "Ô tô" : zone.type === "XE_MAY" ? "Xe máy" : zone.type || "Phương tiện"),
  };
}

function makeMat(color, emissiveIntensity = 0.18, opacity = 0.92) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity,
    metalness: 0.26,
    roughness: 0.35,
    transparent: true,
    opacity,
  });
}

export default function ParkingDigitalTwin3D({ zones = [], floors = [], gates = [], sessions = [], onRefresh }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const userInteractingRef = useRef(false);
  const raycasterRef = useRef(new THREE.Raycaster());
  const pointerRef = useRef(new THREE.Vector2(4, 4));
  const hoverablesRef = useRef([]);
  const animatedRef = useRef({ floors: [], cars: [], barriers: [] });
  const animationRef = useRef(null);
  const [activeFloor, setActiveFloor] = useState("all");
  const [hoveredZone, setHoveredZone] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const normalizedZones = useMemo(() => zones.map(normalizeZone), [zones]);

  const sortedFloors = useMemo(() => {
    const map = new Map();
    floors.forEach((f) => map.set(f.floorName, f));
    normalizedZones.forEach((zone) => {
      if (!map.has(zone.floorName)) map.set(zone.floorName, { floorName: zone.floorName, floorNumber: 0 });
    });
    return Array.from(map.values()).sort((a, b) => floorOrder(a) - floorOrder(b));
  }, [floors, normalizedZones]);

  const visibleZones = useMemo(() => {
    if (activeFloor === "all") return normalizedZones;
    return normalizedZones.filter((zone) => zone.floorName === activeFloor);
  }, [activeFloor, normalizedZones]);

  const floorSummaries = useMemo(() => sortedFloors.map((floor) => {
    const floorZones = normalizedZones.filter((zone) => zone.floorName === floor.floorName);
    const capacity = floorZones.reduce((sum, zone) => sum + (zone.capacity || 0), 0);
    const occupied = floorZones.reduce((sum, zone) => sum + (zone.currentCount || 0), 0);
    const reserved = floorZones.reduce((sum, zone) => sum + (zone.reservedCount || 0), 0);
    return {
      ...floor,
      zones: floorZones.length,
      capacity,
      occupied,
      reserved,
      percent: capacity ? Math.round((occupied / capacity) * 100) : 0,
    };
  }), [sortedFloors, normalizedZones]);

  const stats = useMemo(() => {
    const capacity = visibleZones.reduce((sum, zone) => sum + (zone.capacity || 0), 0);
    const occupied = visibleZones.reduce((sum, zone) => sum + (zone.currentCount || 0), 0);
    const reserved = visibleZones.reduce((sum, zone) => sum + (zone.reservedCount || 0), 0);
    const locked = visibleZones.filter((zone) => ["LOCKED", "MAINTENANCE"].includes(String(zone.status || "").toUpperCase())).length;
    return { capacity, occupied, reserved, free: Math.max(capacity - occupied - reserved, 0), locked };
  }, [visibleZones]);

  useEffect(() => {
    const resize = () => window.dispatchEvent(new Event("resize"));
    const timer = setTimeout(resize, 80);
    document.body.style.overflow = isFullscreen ? "hidden" : "";
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030712);
    scene.fog = new THREE.Fog(0x030712, 26, 70);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(46, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    camera.position.set(17, 13, 22);
    camera.lookAt(0, 3, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.rotateSpeed = 0.55;
    controls.zoomSpeed = 0.85;
    controls.panSpeed = 0.55;
    controls.minDistance = 8;
    controls.maxDistance = 46;
    controls.minPolarAngle = 0.18;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.target.set(0, 4.2, 0);
    controls.addEventListener("start", () => { userInteractingRef.current = true; });
    controls.addEventListener("end", () => { setTimeout(() => { userInteractingRef.current = false; }, 1800); });
    controlsRef.current = controls;

    scene.add(new THREE.AmbientLight(0xdbeafe, 1.1));
    const key = new THREE.DirectionalLight(0xffffff, 2.7);
    key.position.set(16, 20, 12);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    scene.add(key);

    const cyan = new THREE.PointLight(0x38bdf8, 4.2, 44);
    cyan.position.set(-9, 8, 8);
    scene.add(cyan);
    const emerald = new THREE.PointLight(0x14f195, 2.6, 36);
    emerald.position.set(9, 5, -7);
    scene.add(emerald);

    const grid = new THREE.GridHelper(42, 42, 0x0ea5e9, 0x0f172a);
    grid.position.y = -0.08;
    scene.add(grid);

    const base = new THREE.Mesh(
      new THREE.BoxGeometry(18, 0.16, 10.5),
      new THREE.MeshStandardMaterial({ color: 0x020617, metalness: 0.45, roughness: 0.45 })
    );
    base.position.y = -0.14;
    base.receiveShadow = true;
    scene.add(base);

    const onResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };

    const onPointerMove = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointerRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointerRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      setTooltip((current) => current ? { ...current, x: event.clientX - rect.left, y: event.clientY - rect.top } : null);
    };

    const pickZone = () => {
      const camera = cameraRef.current;
      if (!camera) return null;
      raycasterRef.current.setFromCamera(pointerRef.current, camera);
      return raycasterRef.current.intersectObjects(hoverablesRef.current, false)[0]?.object || null;
    };

    const onClick = () => {
      const hit = pickZone();
      if (hit?.userData?.zone) {
        setSelectedZone(hit.userData.zone);
        setActiveFloor(hit.userData.zone.floorName || activeFloor);
      }
    };

    const onPointerLeave = () => {
      pointerRef.current.set(4, 4);
      setTooltip(null);
      setHoveredZone(null);
      renderer.domElement.style.cursor = "grab";
    };

    renderer.domElement.style.cursor = "grab";
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerleave", onPointerLeave);
    renderer.domElement.addEventListener("click", onClick);
    window.addEventListener("resize", onResize);

    const clock = new THREE.Clock();
    const animate = () => {
      const t = clock.getElapsedTime();
      const root = scene.getObjectByName("parking-tower-root");
      if (root) root.rotation.y += ((Math.sin(t * 0.12) * 0.11) - root.rotation.y) * 0.018;

      const camera = cameraRef.current;
      const controls = controlsRef.current;
      if (camera && controls) {
        const targetY = activeFloor === "all" ? 5.2 : 3.3;
        controls.target.y += (targetY - controls.target.y) * 0.04;
        controls.update();

        raycasterRef.current.setFromCamera(pointerRef.current, camera);
        const hits = raycasterRef.current.intersectObjects(hoverablesRef.current, false);
        const hit = hits[0]?.object;
        renderer.domElement.style.cursor = hit ? "pointer" : "grab";
        hoverablesRef.current.forEach((mesh) => {
          const targetScale = hit === mesh ? 1.14 : 1;
          mesh.scale.x += (targetScale - mesh.scale.x) * 0.12;
          mesh.scale.z += (targetScale - mesh.scale.z) * 0.12;
          mesh.material.emissiveIntensity += ((hit === mesh ? 0.62 : mesh.userData.baseGlow) - mesh.material.emissiveIntensity) * 0.12;
        });
        const zone = hit?.userData?.zone || null;
        setHoveredZone(zone);
        setTooltip((current) => zone ? { ...(current || { x: 0, y: 0 }), zone } : null);
      }

      animatedRef.current.floors.forEach((floor, index) => {
        floor.group.position.y += (floor.targetY - floor.group.position.y) * 0.08;
        floor.group.position.x += (floor.targetX - floor.group.position.x) * 0.08;
        floor.group.rotation.z = Math.sin(t * 0.8 + index) * 0.004;
      });

      animatedRef.current.cars.forEach((car, index) => {
        car.position.y = car.userData.baseY + Math.sin(t * 1.8 + index * 0.8) * 0.035;
      });

      animatedRef.current.barriers.forEach((barrier, index) => {
        const target = barrier.userData.active ? -0.72 : 0;
        barrier.rotation.z += (target - barrier.rotation.z) * 0.08;
        barrier.position.y = barrier.userData.baseY + Math.sin(t * 1.5 + index) * 0.025;
      });

      renderer.render(scene, cameraRef.current);
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerleave", onPointerLeave);
      renderer.domElement.removeEventListener("click", onClick);
      window.removeEventListener("resize", onResize);
      controls.dispose();
      mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [activeFloor]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const old = scene.getObjectByName("parking-tower-root");
    if (old) {
      old.traverse((obj) => {
        obj.geometry?.dispose?.();
        obj.material?.dispose?.();
      });
      scene.remove(old);
    }

    const root = new THREE.Group();
    root.name = "parking-tower-root";
    hoverablesRef.current = [];
    animatedRef.current = { floors: [], cars: [], barriers: [] };

    const floorsToRender = sortedFloors
      .filter((floor) => activeFloor === "all" || floor.floorName === activeFloor)
      .sort((a, b) => floorOrder(a) - floorOrder(b));

    floorsToRender.forEach((floor, floorIndex) => {
      const floorZones = normalizedZones.filter((zone) => zone.floorName === floor.floorName);
      const yTarget = activeFloor === "all" ? floorIndex * 2.45 : 1.2;
      const floorGroup = new THREE.Group();
      floorGroup.position.set(activeFloor === "all" ? 0 : 0.8, yTarget - 1.2, 0);

      const slab = new THREE.Mesh(
        new THREE.BoxGeometry(14.6, 0.14, 8.4),
        new THREE.MeshPhysicalMaterial({
          color: 0x071527,
          metalness: 0.25,
          roughness: 0.2,
          transmission: 0.08,
          transparent: true,
          opacity: 0.72,
          clearcoat: 0.8,
          clearcoatRoughness: 0.2,
        })
      );
      slab.receiveShadow = true;
      floorGroup.add(slab);

      const edge = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(14.8, 0.18, 8.6)),
        new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.5 })
      );
      floorGroup.add(edge);

      // vertical corner pillars make the tower/floors visually separated
      [[-7.1, -4.1], [7.1, -4.1], [-7.1, 4.1], [7.1, 4.1]].forEach(([x, z]) => {
        const pillar = new THREE.Mesh(
          new THREE.CylinderGeometry(0.055, 0.055, 2.2, 12),
          makeMat(0x38bdf8, 0.28, 0.48)
        );
        pillar.position.set(x, 1.12, z);
        floorGroup.add(pillar);
      });

      // ramp ribbon
      const ramp = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 0.09, 5.6),
        makeMat(0x2563eb, 0.18, 0.58)
      );
      ramp.position.set(6.6, 0.24, 0);
      ramp.rotation.z = -0.08;
      floorGroup.add(ramp);

      const cols = Math.max(2, Math.ceil(Math.sqrt(floorZones.length || 1)));
      const laneWidth = 3.25;
      const laneDepth = 2.25;
      floorZones.forEach((zone, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        const x = (col - (cols - 1) / 2) * laneWidth - 0.6;
        const z = (row - 0.5) * laneDepth;
        const key = statusForZone(zone);
        const palette = zonePalette[key];
        const usage = zone.capacity ? Math.min(1, (zone.currentCount || 0) / zone.capacity) : 0;
        const height = 0.34 + usage * 0.9;

        const zoneMesh = new THREE.Mesh(
          new THREE.BoxGeometry(2.72, height, 1.68),
          makeMat(palette.base, key === "locked" ? 0.14 : 0.24, 0.9)
        );
        zoneMesh.position.set(x, 0.22 + height / 2, z);
        zoneMesh.castShadow = true;
        zoneMesh.userData.zone = zone;
        zoneMesh.userData.baseGlow = key === "locked" ? 0.14 : 0.24;
        floorGroup.add(zoneMesh);
        hoverablesRef.current.push(zoneMesh);

        const zoneOutline = new THREE.LineSegments(
          new THREE.EdgesGeometry(new THREE.BoxGeometry(2.78, height + 0.03, 1.74)),
          new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.38 })
        );
        zoneOutline.position.copy(zoneMesh.position);
        floorGroup.add(zoneOutline);

        const carCount = Math.min(12, Math.round(usage * 12));
        for (let i = 0; i < carCount; i += 1) {
          const carBody = new THREE.Mesh(
            new THREE.BoxGeometry(0.34, 0.13, 0.58),
            new THREE.MeshStandardMaterial({ color: zone.vehicleTypeName?.includes("máy") ? 0xa5b4fc : 0xf8fafc, metalness: 0.2, roughness: 0.5 })
          );
          const cx = x - 0.95 + (i % 4) * 0.62;
          const cz = z - 0.48 + Math.floor(i / 4) * 0.42;
          carBody.position.set(cx, 0.38 + height, cz);
          carBody.userData.baseY = carBody.position.y;
          carBody.castShadow = true;
          floorGroup.add(carBody);
          animatedRef.current.cars.push(carBody);
        }
      });

      root.add(floorGroup);
      animatedRef.current.floors.push({ group: floorGroup, targetY: yTarget, targetX: activeFloor === "all" ? 0 : 0.8 });
    });


    scene.add(root);
  }, [activeFloor, sortedFloors, normalizedZones, gates]);

  const highlighted = hoveredZone || selectedZone;
  const highlightedStatus = highlighted ? statusForZone(highlighted) : null;

  return (
    <div className={`${isFullscreen ? "fixed inset-0 z-[9999] rounded-none border-0" : "min-h-[820px] rounded-[2.25rem] border border-slate-800"} overflow-hidden bg-[#020617] text-white shadow-2xl shadow-slate-950/50`}>
      <div className={`relative grid ${isFullscreen ? "h-screen min-h-screen" : "min-h-[820px]"} grid-cols-1 xl:grid-cols-[1fr_380px]`}>
        <div className="relative min-h-[680px]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_12%,rgba(56,189,248,0.20),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(20,241,149,0.13),transparent_28%),linear-gradient(135deg,#020617,#06111f_48%,#020617)]" />
          <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:48px_48px]" />

          <div className="absolute left-7 top-7 z-10 max-w-2xl">
            <div className="inline-flex rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200 shadow-lg shadow-cyan-500/10">
              Live 3D Parking Tower · DB Connected
            </div>
            <h2 className="mt-4 font-serif text-4xl font-black tracking-[-0.045em] text-white md:text-6xl">
              Digital Twin Tower
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
              Mô phỏng nhiều tầng tách lớp rõ ràng. Zone, sức chứa và phiên đang đỗ được dựng từ dữ liệu backend thật.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsFullscreen((value) => !value)}
            className="absolute right-7 top-7 z-30 rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-black uppercase tracking-[0.16em] text-white shadow-xl backdrop-blur-xl transition hover:bg-white/20"
          >
            {isFullscreen ? "Thoát fullscreen" : "Fullscreen"}
          </button>

          <div ref={mountRef} className="absolute inset-0" />
          {tooltip?.zone && (
            <div
              className="pointer-events-none absolute z-20 rounded-2xl border border-cyan-300/30 bg-slate-950/90 px-4 py-3 text-xs text-white shadow-2xl shadow-cyan-500/10 backdrop-blur-xl"
              style={{ left: Math.min((tooltip.x || 0) + 18, 620), top: Math.max((tooltip.y || 0) - 18, 90) }}
            >
              <p className="font-black text-cyan-200">{tooltip.zone.zoneName}</p>
              <p className="mt-1 text-slate-400">Tầng {tooltip.zone.floorName} · {tooltip.zone.currentCount}/{tooltip.zone.capacity} xe</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-200">Click để ghim thông tin</p>
            </div>
          )}

          <div className="pointer-events-none absolute left-7 top-48 z-10 hidden w-52 space-y-2 lg:block">
            {floorSummaries.map((floor) => (
              <div key={floor.floorName} className={`rounded-2xl border px-4 py-3 backdrop-blur-xl transition-all ${activeFloor === floor.floorName ? "border-emerald-300/70 bg-emerald-300/15 shadow-lg shadow-emerald-500/10" : "border-white/10 bg-white/[0.045]"}`}>
                <div className="flex items-center justify-between">
                  <span className="font-serif text-lg font-black text-white">{floor.floorName}</span>
                  <span className="text-[10px] font-black text-cyan-200">{floor.percent}%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-cyan-300" style={{ width: `${Math.min(100, floor.percent)}%` }} />
                </div>
                <p className="mt-2 text-[10px] font-bold text-slate-400">{floor.occupied}/{floor.capacity} xe · {floor.zones} zones</p>
              </div>
            ))}
          </div>

          <div className="absolute bottom-7 left-7 right-7 z-10 flex flex-wrap gap-2">
            <button onClick={() => setActiveFloor("all")} className={`rounded-full border px-4 py-2 text-xs font-black transition-all ${activeFloor === "all" ? "border-cyan-300 bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-400/20" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"}`}>
              Tower View
            </button>
            {sortedFloors.map((floor) => (
              <button key={floor.floorName} onClick={() => setActiveFloor(floor.floorName)} className={`rounded-full border px-4 py-2 text-xs font-black transition-all ${activeFloor === floor.floorName ? "border-emerald-300 bg-emerald-300 text-slate-950 shadow-lg shadow-emerald-400/20" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"}`}>
                Tầng {floor.floorName}
              </button>
            ))}
          </div>
        </div>

        <aside className="relative z-10 border-l border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl overflow-y-auto max-h-screen">
          {/* Realtime Capacity */}
          <div className="rounded-3xl border border-white/10 bg-black/25 p-5 shadow-xl shadow-black/20">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">Realtime Capacity</p>
              <button onClick={onRefresh} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black text-cyan-200 transition hover:bg-white/10 cursor-pointer">
                ↻ Sync
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <Metric label="Sức chứa" value={stats.capacity} tone="text-white" />
              <Metric label="Đang đỗ" value={stats.occupied} tone="text-cyan-200" />
              <Metric label="Đã giữ chỗ" value={stats.reserved} tone="text-amber-200" />
              <Metric label="Còn trống" value={stats.free} tone="text-emerald-200" />
            </div>
            {/* Overall progress */}
            {stats.capacity > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-[9px] font-black mb-1.5">
                  <span className="text-slate-400">Tỷ lệ lấp đầy toàn bãi</span>
                  <span className="text-cyan-200">{Math.round((stats.occupied / stats.capacity) * 100)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-700" style={{ width: `${Math.min(100, Math.round((stats.occupied / stats.capacity) * 100))}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Zone Inspector — khi click zone */}
          <div className="mt-4 rounded-3xl border border-white/10 bg-black/25 p-5 shadow-xl shadow-black/20">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 mb-4">
              {highlighted ? "🔍 Zone Inspector" : "🔍 Chọn Zone để xem"}
            </p>
            {highlighted ? (() => {
              const floorName = highlighted.floorName;
              const floorZones = normalizedZones.filter(z => z.floorName === floorName);
              const floorCap = floorZones.reduce((s, z) => s + (z.capacity || 0), 0);
              const floorOcc = floorZones.reduce((s, z) => s + (z.currentCount || 0), 0);
              const floorPct = floorCap ? Math.round((floorOcc / floorCap) * 100) : 0;
              const hStatus = statusForZone(highlighted);
              const hPalette = zonePalette[hStatus];
              const hPct = highlighted.capacity ? Math.round(((highlighted.currentCount || 0) / highlighted.capacity) * 100) : 0;
              return (
                <div className="space-y-4">
                  {/* Selected zone hero */}
                  <div className="rounded-2xl border p-4" style={{ borderColor: `rgba(${hPalette.rgb}, .4)`, background: `rgba(${hPalette.rgb}, .08)` }}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-serif text-2xl font-black tracking-tight text-white">{highlighted.zoneName}</p>
                        <p className="mt-1 text-[11px] font-bold text-slate-400">Tầng {floorName} · {highlighted.vehicleTypeName}</p>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full border" style={{ color: `rgb(${hPalette.rgb})`, borderColor: `rgba(${hPalette.rgb}, .4)`, background: `rgba(${hPalette.rgb}, .15)` }}>
                        {hPalette.label}
                      </span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${hPct}%`, background: `rgb(${hPalette.rgb})` }} />
                    </div>
                    <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                      <MiniStat label="Đang đỗ" value={highlighted.currentCount || 0} />
                      <MiniStat label="Đã giữ" value={highlighted.reservedCount || 0} />
                      <MiniStat label="Trống" value={Math.max(0, (highlighted.capacity || 0) - (highlighted.currentCount || 0))} />
                      <MiniStat label="Sức chứa" value={highlighted.capacity || 0} />
                    </div>
                  </div>

                  {/* Floor summary */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200">📊 Tổng quan Tầng {floorName}</p>
                      <span className="text-[10px] font-black text-white">{floorPct}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10 mb-3">
                      <div className="h-full rounded-full bg-cyan-400 transition-all duration-500" style={{ width: `${floorPct}%` }} />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-[9px]">
                      <div className="rounded-lg bg-white/5 p-2"><p className="font-black text-white text-sm">{floorOcc}</p><p className="text-slate-500 font-bold mt-0.5">Đang đỗ</p></div>
                      <div className="rounded-lg bg-white/5 p-2"><p className="font-black text-emerald-300 text-sm">{floorCap - floorOcc}</p><p className="text-slate-500 font-bold mt-0.5">Còn trống</p></div>
                      <div className="rounded-lg bg-white/5 p-2"><p className="font-black text-slate-300 text-sm">{floorCap}</p><p className="text-slate-500 font-bold mt-0.5">Tổng chỗ</p></div>
                    </div>
                  </div>

                  {/* All zones in this floor */}
                  <div className="space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">Tất cả zones · Tầng {floorName} ({floorZones.length})</p>
                    {floorZones.map(z => {
                      const zSt = statusForZone(z);
                      const zPal = zonePalette[zSt];
                      const zPct = z.capacity ? Math.round(((z.currentCount || 0) / z.capacity) * 100) : 0;
                      const isSelected = z.zoneName === highlighted.zoneName;
                      return (
                        <div key={z.id || z.zoneName} onClick={() => setSelectedZone(z)}
                          className={`rounded-xl border p-3 cursor-pointer transition-all ${isSelected ? "border-cyan-400/50 bg-cyan-400/10 shadow-lg shadow-cyan-500/10" : "border-white/8 bg-white/[0.03] hover:bg-white/[0.06]"}`}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: `rgb(${zPal.rgb})` }} />
                              <span className="text-[11px] font-black text-white">{z.zoneName}</span>
                              <span className="text-[9px] text-slate-500 font-bold">{z.vehicleTypeName}</span>
                            </div>
                            <span className="text-[10px] font-black font-mono" style={{ color: `rgb(${zPal.rgb})` }}>{z.currentCount}/{z.capacity}</span>
                          </div>
                          <div className="h-1 overflow-hidden rounded-full bg-white/10">
                            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${zPct}%`, background: `rgb(${zPal.rgb})` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })() : (
              <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-[11px] leading-6 text-slate-500">
                <p className="text-2xl mb-2">👆</p>
                Hover hoặc click vào một khối zone trong mô hình 3D để xem thông tin chi tiết.
              </div>
            )}
          </div>

          {/* Operations */}
          <div className="mt-4 rounded-3xl border border-white/10 bg-black/25 p-5 shadow-xl shadow-black/20">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 mb-4">⚙️ Operations</p>
            <div className="space-y-2.5">
              <Metric label="Phiên đang hoạt động" value={sessions.filter(s => s.status === "ACTIVE").length} tone="text-emerald-200" />
              <Metric label="Tổng phiên đã hoàn thành" value={sessions.filter(s => s.status === "COMPLETED").length} tone="text-cyan-200" />
              <Metric label="Tổng tầng" value={sortedFloors.length} tone="text-white" />
              <Metric label="Tổng zones" value={normalizedZones.length} tone="text-white" />
              <Metric label="Cổng hoạt động" value={gates.filter(g => g.status === "ACTIVE").length} tone="text-emerald-200" />
              <Metric label="Zone khóa/bảo trì" value={stats.locked} tone="text-indigo-200" />
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500 mb-3">Chú giải màu sắc</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(zonePalette).map(([key, val]) => (
                <div key={key} className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: `rgb(${val.rgb})` }} />
                  <span className="font-bold">{val.label}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Metric({ label, value, tone }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-black ${tone}`}>{Number(value || 0).toLocaleString("vi-VN")}</p>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.045] p-3">
      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-black text-white">{Number(value || 0).toLocaleString("vi-VN")}</p>
    </div>
  );
}
