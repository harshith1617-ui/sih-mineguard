"use client";

import { Radar, Siren, ShieldCheck, TriangleAlert, Volume2, VolumeX, Zap } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatAccel, RISK_META, type RiskLevel } from "@/lib/risk";
import { Corners, Panel, StatusDot } from "@/components/ui/primitives";

const RISK_ICON = { low: ShieldCheck, beware: TriangleAlert, critical: Siren } as const;

function Sparkline({ history, risk }: { history: number[]; risk: RiskLevel }) {
  const W = 100;
  const y = (d: number) => 38 - (Math.min(200, Math.max(0, d)) / 200) * 33;
  const pts = history
    .map((d, i) => `${((i / Math.max(1, history.length - 1)) * W).toFixed(1)},${y(d).toFixed(1)}`)
    .join(" ");
  const stroke = RISK_META[risk].hex;
  return (
    <svg viewBox="0 0 100 42" preserveAspectRatio="none" className="h-full w-full">
      <line x1="0" x2={W} y1={y(50)} y2={y(50)} stroke="rgba(255,208,40,0.28)" strokeWidth="0.35" strokeDasharray="2 2" />
      <line x1="0" x2={W} y1={y(15)} y2={y(15)} stroke="rgba(255,59,78,0.34)" strokeWidth="0.35" strokeDasharray="2 2" />
      {history.length > 1 && (
        <>
          <polyline
            points={pts}
            fill="none"
            stroke={stroke}
            strokeWidth="1.1"
            strokeLinejoin="round"
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 3px ${stroke}66)`, transition: "stroke .4s" }}
          />
          <circle cx={W} cy={y(history[history.length - 1])} r="1.6" fill={stroke} />
        </>
      )}
    </svg>
  );
}

export function TelemetryHub({
  distance,
  accel,
  history,
  risk,
  audioEnabled,
}: {
  distance: number;
  accel: number;
  history: number[];
  risk: RiskLevel;
  audioEnabled: boolean;
}) {
  const meta = RISK_META[risk];
  const RiskIcon = RISK_ICON[risk];
  const dRounded = Math.round(distance);
  const pct = Math.max(0, Math.min(100, (distance / 200) * 100));

  return (
    <Panel
      className={cn(
        "h-full overflow-hidden transition-all duration-500",
        risk === "critical" && "critical-frame",
      )}
    >
      <Corners tone={risk === "critical" ? "bright" : "default"} />

      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <Radar className="h-4 w-4 text-fog-500" />
          <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-fog-300">
            Central telemetry · Proximity + motion
          </h2>
        </div>
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "flex items-center gap-1.5 rounded border px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.14em] transition-all",
              audioEnabled
                ? "border-ok-400/40 bg-ok-400/10 text-ok-400"
                : risk !== "low"
                  ? "blink-hard border-warn-400/60 bg-warn-400/10 text-warn-400"
                  : "border-line text-fog-500",
            )}
          >
            {audioEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
            {audioEnabled ? "Alarms armed" : "Audio muted"}
          </span>
          <span className="flex items-center gap-1.5 rounded border border-ok-400/40 bg-ok-400/10 px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-ok-400">
            <StatusDot tone="ok" pulse />
            Live
          </span>
        </div>
      </div>

      {/* readouts */}
      <div className="grid grid-cols-1 gap-px bg-line/60 sm:grid-cols-5">
        <div className="bg-ink-850 px-5 py-5 sm:col-span-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-fog-500">
            Obstacle distance
          </p>
          <div className="mt-2 flex items-end gap-3">
            <span
              key={dRounded}
              className="num-pop tnum font-mono text-[clamp(4.2rem,10vw,7rem)] font-bold leading-[0.9] tracking-tight transition-colors duration-300"
              style={{ color: meta.hex, textShadow: `0 0 34px ${meta.hexSoft}` }}
            >
              {dRounded}
            </span>
            <span className="pb-2 font-mono text-xl font-medium text-fog-500">cm</span>
          </div>
          <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.2em] text-fog-600">
            Ultrasonic array U-2 · forward bumper
          </p>

          {/* distance tape */}
          <div className="mt-5">
            <div className="relative h-3 overflow-hidden rounded-full border border-line bg-ink-900">
              <div className="absolute inset-y-0 left-0 bg-danger-400/35" style={{ width: "7.5%" }} />
              <div className="absolute inset-y-0 bg-warn-400/28" style={{ left: "7.5%", width: "17.5%" }} />
              <div className="absolute inset-y-0 bg-ok-400/22" style={{ left: "25%", right: 0 }} />
              <div
                className="absolute top-[-4px] h-5 w-[3px] rounded-full transition-all duration-200"
                style={{ left: `calc(${pct}% - 1.5px)`, background: meta.hex, boxShadow: `0 0 9px ${meta.hex}` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between font-mono text-[9px] tracking-[0.14em] text-fog-600">
              <span>0</span>
              <span className="text-danger-400/80">15 STOP</span>
              <span className="text-warn-400/80">50 CAUTION</span>
              <span>200</span>
            </div>
          </div>
        </div>

        <div className="bg-ink-850 px-5 py-5 sm:col-span-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-fog-500">
            Motion / Acceleration
          </p>
          <div className="mt-2 flex items-end gap-2">
            <span
              key={Math.round(accel * 100)}
              className="num-pop tnum font-mono text-[clamp(2.4rem,4.5vw,3.6rem)] font-bold leading-none text-fog-100"
            >
              {formatAccel(accel)}
            </span>
            <span className="pb-1 font-mono text-xs text-fog-500">m/s²</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full border border-line bg-ink-900">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                accel < -2.5 ? "bg-danger-400" : accel < 0 ? "bg-warn-400" : "bg-ok-400",
              )}
              style={{ width: `${Math.min(100, Math.abs(accel) * 18)}%` }}
            />
          </div>
          <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.2em] text-fog-600">
            IMU 6-axis · harsh braking −3.6 m/s²
          </p>
          <div className="mt-4 h-16 rounded border border-line bg-ink-900/70 p-1.5">
            <Sparkline history={history} risk={risk} />
          </div>
          <p className="mt-1.5 font-mono text-[8.5px] uppercase tracking-[0.18em] text-fog-600">
            Distance · rolling samples
          </p>
        </div>
      </div>

      {/* ======== risk banner ======== */}
      <div
        className="relative overflow-hidden border-t transition-colors duration-500"
        style={{ borderColor: meta.hexSoft, background: meta.hexBg }}
      >
        <div className="scan-overlay absolute inset-0" />
        <div className="relative flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-center gap-3.5">
            <span
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-md border transition-colors duration-300",
                risk === "critical" && "blink-hard",
              )}
              style={{ borderColor: meta.hexSoft, color: meta.hex, background: meta.hexDim }}
            >
              <RiskIcon className="h-5.5 w-5.5" />
            </span>
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-fog-500">Risk level</p>
              <p
                className={cn(
                  "font-mono text-[clamp(1.4rem,3vw,2rem)] font-bold leading-tight tracking-[0.06em] transition-colors duration-300",
                  risk === "critical" && "blink-hard",
                )}
                style={{ color: meta.hex }}
              >
                {meta.label}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-fog-300">
              {meta.description}
            </p>
            {risk === "critical" && (
              <span className="blink-hard flex items-center gap-1.5 rounded border border-danger-400/60 bg-danger-400/15 px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-danger-400">
                <Siren className="h-3 w-3" />
                Stop vehicle immediately
              </span>
            )}
            {risk === "beware" && (
              <span className="flex items-center gap-1.5 rounded border border-warn-400/50 bg-warn-400/10 px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-warn-400">
                <Zap className="h-3 w-3" />
                Speed limited — proceed with caution
              </span>
            )}
          </div>
        </div>

        {/* legend */}
        <div className="relative flex flex-wrap gap-1.5 border-t border-line/60 px-5 py-2.5">
          {(
            [
              { key: "low" as const, label: "LOW RISK", range: "dist > 50 cm" },
              { key: "beware" as const, label: "BEWARE", range: "15 ≤ dist ≤ 50 cm" },
              { key: "critical" as const, label: "CRITICAL RISK", range: "dist < 15 cm" },
            ]
          ).map((l) => {
            const m = RISK_META[l.key];
            const active = risk === l.key;
            return (
              <span
                key={l.key}
                className="rounded border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] transition-all duration-300"
                style={
                  active
                    ? { borderColor: m.hexSoft, color: m.hex, background: m.hexDim }
                    : { borderColor: "#1c2532", color: "#49596c" }
                }
              >
                {l.label} · {l.range}
              </span>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}
