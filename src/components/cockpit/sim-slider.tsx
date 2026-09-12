"use client";

import type { CSSProperties } from "react";
import { Hand, SlidersHorizontal } from "lucide-react";
import { RISK_META, type RiskLevel } from "@/lib/risk";
import { Panel, PanelHeader } from "@/components/ui/primitives";

const PRESETS = [
  { label: "Clear", value: 180, hint: "LOW RISK" },
  { label: "Caution", value: 42, hint: "BEWARE" },
  { label: "Danger", value: 8, hint: "CRITICAL" },
] as const;

export function SimSlider({
  distance,
  onChange,
  risk,
}: {
  distance: number;
  onChange: (d: number) => void;
  risk: RiskLevel;
}) {
  const meta = RISK_META[risk];
  const pct = Math.max(0, Math.min(100, (distance / 200) * 100));
  const sliderStyle = {
    "--fill": `${pct}%`,
    "--track-fill": meta.hex,
    "--track-glow": meta.hexSoft,
  } as CSSProperties;

  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader
        icon={<SlidersHorizontal className="h-4 w-4" />}
        title="Sensor simulator"
        right={
          <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-accent-300">
            <Hand className="h-3 w-3" />
            Interactive
          </span>
        }
      />

      <div className="flex flex-1 flex-col justify-center gap-6 px-5 py-6">
        {/* current value */}
        <div className="text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-fog-500">
            Simulate obstacle distance (0–200 cm)
          </p>
          <p
            className="tnum mt-2 font-mono text-[clamp(3rem,6vw,4.6rem)] font-bold leading-none transition-colors duration-300"
            style={{ color: meta.hex, textShadow: `0 0 26px ${meta.hexSoft}` }}
          >
            {Math.round(distance)}
            <span className="ml-2 text-lg font-medium text-fog-500">cm</span>
          </p>
        </div>

        {/* slider */}
        <div>
          <input
            type="range"
            min={0}
            max={200}
            step={1}
            value={Math.round(distance)}
            onChange={(e) => onChange(Number(e.target.value))}
            className="mg-range mg-range-xl"
            style={sliderStyle}
            aria-label="Simulate obstacle distance in centimeters"
          />
          <div className="flex justify-between font-mono text-[10px] tracking-[0.14em] text-fog-600">
            <span>0 — CRASH</span>
            <span>200 — CLEAR</span>
          </div>
        </div>

        {/* zone ruler */}
        <div>
          <div className="flex h-1.5 overflow-hidden rounded-full border border-line">
            <span className="bg-danger-400/50" style={{ width: "7.5%" }} />
            <span className="bg-warn-400/45" style={{ width: "17.5%" }} />
            <span className="bg-ok-400/40" style={{ width: "75%" }} />
          </div>
          <div className="mt-1 flex font-mono text-[8.5px] uppercase tracking-[0.1em]">
            <span className="text-danger-400/90" style={{ width: "7.5%" }}>Critical</span>
            <span className="text-warn-400/90" style={{ width: "17.5%" }}>Beware</span>
            <span className="text-ok-400/90">Low risk</span>
          </div>
        </div>

        {/* presets */}
        <div className="grid grid-cols-3 gap-2">
          {PRESETS.map((p) => {
            const active = Math.round(distance) === p.value;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => onChange(p.value)}
                className="rounded-md border px-2 py-2.5 transition-all duration-300"
                style={
                  active
                    ? { borderColor: meta.hexSoft, background: meta.hexDim, color: meta.hex }
                    : { borderColor: "#1c2532", background: "#0a0e13", color: "#a9b7c6" }
                }
              >
                <span className="block font-mono text-[10px] font-bold uppercase tracking-[0.14em]">
                  {p.label} · {p.value}
                </span>
                <span className="mt-0.5 block font-mono text-[8px] uppercase tracking-[0.16em] opacity-70">
                  {p.hint}
                </span>
              </button>
            );
          })}
        </div>

        <p className="rounded-md border border-dashed border-line-bright bg-ink-900/50 px-3 py-2.5 text-center font-mono text-[9px] uppercase leading-relaxed tracking-[0.14em] text-fog-500">
          Drag the slider to demo — the hub, camera overlay and vitals react live
        </p>
      </div>
    </Panel>
  );
}
