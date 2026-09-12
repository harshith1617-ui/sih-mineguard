"use client";

import { MapPin, Route } from "lucide-react";
import { RISK_META, type RiskLevel } from "@/lib/risk";
import { Panel, PanelHeader, StatusDot } from "@/components/ui/primitives";

const ROAD =
  "M 26 148 C 70 122, 78 96, 108 92 C 150 86, 158 118, 196 116 C 236 114, 248 74, 286 62";

export function MapPanel({ risk }: { risk: RiskLevel }) {
  const hex = RISK_META[risk].hex;

  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader
        icon={<Route className="h-4 w-4" />}
        title="Map & route"
        right={
          <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-fog-500">
            <StatusDot tone="ok" pulse />
            GPS · R-2
          </span>
        }
      />
      <div className="relative m-3 min-h-[220px] flex-1 overflow-hidden rounded-md border border-line bg-[#0a0f16]">
        <svg viewBox="0 0 320 172" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="map-grid" width="16" height="16" patternUnits="userSpaceOnUse">
              <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#182230" strokeWidth="0.5" />
            </pattern>
            <pattern id="map-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" stroke="#223043" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="320" height="172" fill="url(#map-grid)" />

          {/* pit terraces */}
          <ellipse cx="70" cy="46" rx="52" ry="26" fill="none" stroke="#1d2836" strokeWidth="5" />
          <ellipse cx="70" cy="46" rx="34" ry="16" fill="none" stroke="#223043" strokeWidth="4" />
          <ellipse cx="70" cy="46" rx="17" ry="8" fill="none" stroke="#2b3a4e" strokeWidth="3" />

          {/* dump zone */}
          <rect x="250" y="20" width="56" height="38" fill="url(#map-hatch)" stroke="#223043" strokeWidth="0.8" rx="3" />
          <text x="278" y="42" textAnchor="middle" className="fill-fog-500 font-mono" fontSize="7" letterSpacing="1.5">
            DUMP B
          </text>
          <text x="70" y="14" textAnchor="middle" className="fill-fog-500 font-mono" fontSize="7" letterSpacing="1.5">
            PIT A
          </text>
          <text x="272" y="140" className="fill-fog-500 font-mono" fontSize="7" letterSpacing="1.5">
            CRUSHER
          </text>
          <rect x="282" y="128" width="12" height="9" rx="1.5" fill="none" stroke="#223043" />
          <text x="44" y="160" className="fill-fog-500 font-mono" fontSize="7" letterSpacing="1.5">
            FUEL BAY
          </text>
          <rect x="18" y="130" width="12" height="9" rx="1.5" fill="none" stroke="#223043" />

          {/* haul road */}
          <path d={ROAD} fill="none" stroke="#26344a" strokeWidth="7" strokeLinecap="round" />
          <path
            d={ROAD}
            fill="none"
            stroke="#3dd6f0"
            strokeWidth="1.4"
            strokeDasharray="5 9"
            className="route-dash"
            opacity="0.75"
          />

          {/* waypoints */}
          <circle cx="26" cy="148" r="4" fill="#0a0f16" stroke="#3dd6f0" strokeWidth="1.4" />
          <circle cx="26" cy="148" r="1.4" fill="#3dd6f0" />
          <circle cx="286" cy="62" r="4" fill="#0a0f16" stroke="#f5a524" strokeWidth="1.4" />
          <circle cx="286" cy="62" r="1.4" fill="#f5a524" />

          {/* vehicle marker */}
          <g>
            <animateMotion dur="26s" repeatCount="indefinite" path={ROAD} />
            <circle r="10" fill={hex} opacity="0.16" className="ping-slow" style={{ transformBox: "fill-box", transformOrigin: "center" }} />
            <path d="M 0 -6 L 5 5 L -5 5 Z" fill={hex} stroke="#04060a" strokeWidth="1.2" />
          </g>

          {/* scale bar */}
          <g transform="translate(228,158)" className="fill-fog-500">
            <rect width="40" height="2" rx="1" />
            <rect x="0" y="-2" width="1.5" height="6" />
            <rect x="38.5" y="-2" width="1.5" height="6" />
            <text x="46" y="3.5" className="fill-fog-500 font-mono" fontSize="6.5">
              250 m
            </text>
          </g>
        </svg>
        <div className="scan-overlay absolute inset-0" />
      </div>

      <div className="flex items-center justify-between border-t border-line px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.16em] text-fog-500">
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3 w-3 text-cyan-400" />
          HTX-104 · Haul road 2
        </span>
        <span className="tnum">ETA 06:12</span>
      </div>
    </Panel>
  );
}
