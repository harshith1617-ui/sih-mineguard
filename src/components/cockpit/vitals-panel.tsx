"use client";

import { BatteryCharging, Gauge, Thermometer } from "lucide-react";
import { cn } from "@/lib/cn";
import { RISK_META, type RiskLevel } from "@/lib/risk";
import { Panel, PanelHeader } from "@/components/ui/primitives";

function batteryTone(pct: number) {
  if (pct <= 20) return { bar: "bg-danger-400", text: "text-danger-400" };
  if (pct <= 50) return { bar: "bg-warn-400", text: "text-warn-400" };
  return { bar: "bg-ok-400", text: "text-ok-400" };
}

export function VitalsPanel({
  speed,
  battery,
  temp,
  risk,
}: {
  speed: number;
  battery: number;
  temp: number;
  risk: RiskLevel;
}) {
  const b = batteryTone(battery);
  const tempWarn = temp >= 90;
  const critical = risk === "critical";
  const arcLen = 157; // semicircle r=50
  const speedPct = Math.min(1, speed / 60);
  const needleAngle = -90 + speedPct * 180;
  const gaugeColor = critical ? RISK_META.critical.hex : "#3dd6f0";

  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader icon={<Gauge className="h-4 w-4" />} title="Vehicle vitals" />

      <div className="flex flex-1 flex-col gap-2.5 px-4 py-3">
        {/* speed gauge */}
        <div className="relative">
          <svg viewBox="0 0 120 72" className="w-full">
            <path
              d="M 12 62 A 50 50 0 0 1 108 62"
              fill="none"
              stroke="#1c2532"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <path
              d="M 12 62 A 50 50 0 0 1 108 62"
              fill="none"
              stroke={gaugeColor}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={arcLen}
              strokeDashoffset={arcLen * (1 - speedPct)}
              className="transition-all duration-500"
              style={{ filter: `drop-shadow(0 0 5px ${gaugeColor}73)` }}
            />
            <line
              x1="60"
              y1="62"
              x2="60"
              y2="24"
              stroke={critical ? "#ff3b4e" : "#e9eff6"}
              strokeWidth="1.6"
              strokeLinecap="round"
              className="transition-all duration-500"
              style={{ transform: `rotate(${needleAngle}deg)`, transformOrigin: "60px 62px" }}
            />
            <circle cx="60" cy="62" r="3.4" fill="#0f141b" stroke="#2b3a4e" />
            {[
              { v: 0, a: -90 },
              { v: 30, a: 0 },
              { v: 60, a: 90 },
            ].map((t) => (
              <text
                key={t.v}
                x={60 + Math.cos(((t.a - 90) * Math.PI) / 180) * 42}
                y={62 + Math.sin(((t.a - 90) * Math.PI) / 180) * 42 + 2.5}
                textAnchor="middle"
                className="fill-fog-500 font-mono"
                fontSize="6"
              >
                {t.v}
              </text>
            ))}
          </svg>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 text-center">
            <p className="tnum font-mono text-2xl font-bold leading-none text-fog-100">
              {Math.round(speed)}
              <span className="ml-1 text-[10px] font-medium text-fog-500">km/h</span>
            </p>
          </div>
        </div>

        {/* battery */}
        <div className="flex items-center gap-3 rounded-md border border-line bg-ink-900/60 px-3 py-2.5">
          <BatteryCharging className={cn("h-4 w-4 flex-none", b.text)} />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-fog-500">Battery</p>
              <p className={cn("tnum font-mono text-sm font-bold", b.text)}>
                {Math.round(battery)}%
              </p>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-700">
              <div
                className={cn("h-full rounded-full transition-all duration-700", b.bar)}
                style={{ width: `${Math.round(battery)}%` }}
              />
            </div>
          </div>
          <span className="font-mono text-[9px] text-fog-600">~{(battery * 0.11).toFixed(1)}h</span>
        </div>

        {/* temperature */}
        <div
          className={cn(
            "flex items-center gap-3 rounded-md border bg-ink-900/60 px-3 py-2.5 transition-all duration-500",
            critical && tempWarn
              ? "border-danger-400/50 shadow-[0_0_18px_-4px_rgba(255,59,78,0.5)]"
              : "border-line",
          )}
        >
          <Thermometer
            className={cn(
              "h-4 w-4 flex-none",
              tempWarn ? "text-danger-400" : "text-accent-300",
            )}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-fog-500">Motor temp</p>
              <p
                className={cn(
                  "tnum font-mono text-sm font-bold",
                  tempWarn ? "blink-hard text-danger-400" : "text-fog-100",
                )}
              >
                {temp.toFixed(1)}°C
              </p>
            </div>
            <div className="relative mt-1.5 h-1.5 overflow-visible rounded-full bg-ink-700">
              {/* 90°C redline marker */}
              <span
                className="absolute -top-[3px] h-3 w-px bg-danger-400/70"
                style={{ left: `${(90 / 110) * 100}%` }}
              />
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  tempWarn ? "bg-danger-400" : "bg-accent-400",
                )}
                style={{
                  width: `${Math.min(100, (temp / 110) * 100)}%`,
                  boxShadow: tempWarn ? "0 0 8px rgba(255,59,78,0.7)" : undefined,
                }}
              />
            </div>
          </div>
          {tempWarn && (
            <span className="blink-hard rounded border border-danger-400/50 bg-danger-400/10 px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-danger-400">
              Hot
            </span>
          )}
        </div>
      </div>
    </Panel>
  );
}
