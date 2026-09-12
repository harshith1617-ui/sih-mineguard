"use client";

import { useEffect, useState } from "react";
import { Cctv } from "lucide-react";
import { cn } from "@/lib/cn";
import { RISK_META, type RiskLevel } from "@/lib/risk";
import { Panel, PanelHeader } from "@/components/ui/primitives";

/* Automotive-style parking bands: far → bumper, green → red */
const BANDS = [
  { id: "far", rx: 158, ry: 92, max: 130, color: "#2be59b" },
  { id: "mid", rx: 122, ry: 70, max: 84, color: "#b7e04a" },
  { id: "near", rx: 88, ry: 50, max: 46, color: "#ffd028" },
  { id: "bumper", rx: 56, ry: 32, max: 20, color: "#ff3b4e" },
] as const;

function ParkingArcs({ distance, risk }: { distance: number; risk: RiskLevel }) {
  const critical = risk === "critical";
  return (
    <svg
      viewBox="0 0 320 96"
      preserveAspectRatio="xMidYMax meet"
      className="pointer-events-none absolute inset-x-2 bottom-1 h-[104px] w-[calc(100%-1rem)]"
    >
      {BANDS.map((b, i) => {
        const active = critical || distance <= b.max;
        const color = critical ? "#ff3b4e" : b.color;
        const flashing = critical && i >= 2; // near + bumper bands strobe when critical
        return (
          <path
            key={b.id}
            d={`M ${160 - b.rx} 118 A ${b.rx} ${b.ry} 0 0 1 ${160 + b.rx} 118`}
            fill="none"
            stroke={color}
            strokeWidth={active ? 3.6 : 1.5}
            strokeLinecap="round"
            opacity={active ? 1 : 0.2}
            className={cn(flashing && "blink-hard", "transition-all duration-300")}
            style={active ? { filter: `drop-shadow(0 0 5px ${color})` } : undefined}
          />
        );
      })}
      {/* bumper silhouette */}
      <rect x="126" y="86" width="68" height="7" rx="3" fill="#0b0f15" stroke="#3a4b61" strokeWidth="1" />
      <line x1="112" y1="89.5" x2="126" y2="89.5" stroke="#3a4b61" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="194" y1="89.5" x2="208" y2="89.5" stroke="#3a4b61" strokeWidth="1.4" strokeLinecap="round" />
      <text
        x="160"
        y="80"
        textAnchor="middle"
        className="fill-fog-500 font-mono"
        fontSize="6"
        letterSpacing="1.6"
        opacity="0.7"
      >
        U-2 SENSOR FIELD
      </text>
    </svg>
  );
}

function DetectionBox({ distance, risk }: { distance: number; risk: RiskLevel }) {
  const meta = RISK_META[risk];
  const closeness = 1 - Math.max(0, Math.min(200, distance)) / 200; // 0 far → 1 touching
  const w = Math.round(64 + closeness * 84);
  const h = Math.round(40 + closeness * 58);
  const c = "pointer-events-none absolute h-3.5 w-3.5";
  const critical = risk === "critical";

  return (
    <div
      className={cn(
        "pointer-events-none absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 transition-all duration-300",
        critical && "blink-hard",
      )}
      style={{ width: w, height: h }}
    >
      {/* corner-bracket bounding box */}
      <span className={cn(c, "left-0 top-0 border-l-2 border-t-2")} style={{ borderColor: meta.hex }} />
      <span className={cn(c, "right-0 top-0 border-r-2 border-t-2")} style={{ borderColor: meta.hex }} />
      <span className={cn(c, "bottom-0 left-0 border-b-2 border-l-2")} style={{ borderColor: meta.hex }} />
      <span className={cn(c, "bottom-0 right-0 border-b-2 border-r-2")} style={{ borderColor: meta.hex }} />
      {/* detection label */}
      <span
        className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded border px-1.5 py-0.5 font-mono text-[8.5px] font-bold tracking-[0.14em]"
        style={{
          borderColor: meta.hexSoft,
          color: meta.hex,
          background: "rgba(4,6,10,0.75)",
        }}
      >
        {critical ? "BRAKE!" : "OBSTACLE"} · {Math.round(distance)} CM
      </span>
    </div>
  );
}

export function CameraPanel({ distance, risk }: { distance: number; risk: RiskLevel }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const meta = RISK_META[risk];

  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader
        icon={<Cctv className="h-4 w-4" />}
        title="Live camera feed"
        right={
          <span className="flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-danger-400">
            <span className="blink-hard h-1.5 w-1.5 rounded-full bg-danger-400" />
            REC
          </span>
        }
      />
      <div className="relative m-3 min-h-[230px] flex-1 overflow-hidden rounded-md border border-line bg-ink-900">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/images/cam-feed.jpg)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-transparent to-ink-950/40" />
        <div className="scan-overlay absolute inset-0" />
        <div className="cam-sweep absolute left-0 h-px w-full bg-cyan-400/25 shadow-[0_0_10px_rgba(61,214,240,0.4)]" />

        {/* HUD top */}
        <div className="absolute left-3 top-2.5 font-mono text-[9px] uppercase tracking-[0.18em] text-fog-200">
          <p className="flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-ok-400" />
            CAM 01 · FRONT · 1080p
          </p>
        </div>
        <p className="tnum absolute right-3 top-2.5 font-mono text-[9px] tracking-[0.14em] text-fog-200">
          {now ? now.toLocaleTimeString("en-GB", { hour12: false }) : "--:--:--"}
        </p>

        {/* proximity detection graphic */}
        <DetectionBox distance={distance} risk={risk} />

        {/* parking-sensor arcs */}
        <ParkingArcs distance={distance} risk={risk} />

        {/* bottom HUD */}
        <div className="absolute inset-x-3 bottom-2.5 flex items-end justify-between">
          <span
            className="rounded border px-2 py-1 font-mono text-[10px] font-bold tracking-[0.14em] backdrop-blur-sm transition-colors duration-300"
            style={{
              borderColor: meta.hexSoft,
              color: meta.hex,
              background: "rgba(4,6,10,0.55)",
            }}
          >
            RNG {Math.round(distance)} CM
          </span>
          <span className="font-mono text-[9px] tracking-[0.16em] text-fog-300">
            HTX-104 · PIT RAMP
          </span>
        </div>
      </div>
    </Panel>
  );
}
