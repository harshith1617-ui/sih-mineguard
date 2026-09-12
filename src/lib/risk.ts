export type RiskLevel = "low" | "beware" | "critical";

export const BEWARE_THRESHOLD_CM = 50;
export const CRITICAL_THRESHOLD_CM = 15;

export function riskFromDistance(distanceCm: number): RiskLevel {
  if (distanceCm < CRITICAL_THRESHOLD_CM) return "critical";
  if (distanceCm <= BEWARE_THRESHOLD_CM) return "beware";
  return "low";
}

export const RISK_META: Record<
  RiskLevel,
  {
    code: string;
    label: string;
    description: string;
    hex: string;
    hexSoft: string;
    hexDim: string;
    hexBg: string;
  }
> = {
  low: {
    code: "L0",
    label: "LOW RISK",
    description: "Path clear — proceed",
    hex: "#2be59b",
    hexSoft: "rgba(43,229,155,0.55)",
    hexDim: "rgba(43,229,155,0.14)",
    hexBg: "rgba(43,229,155,0.07)",
  },
  beware: {
    code: "L1",
    label: "BEWARE",
    description: "Obstacle near — reduce speed",
    hex: "#ffd028",
    hexSoft: "rgba(255,208,40,0.55)",
    hexDim: "rgba(255,208,40,0.14)",
    hexBg: "rgba(255,208,40,0.06)",
  },
  critical: {
    code: "L2",
    label: "CRITICAL RISK",
    description: "Immediate stop required",
    hex: "#ff3b4e",
    hexSoft: "rgba(255,59,78,0.6)",
    hexDim: "rgba(255,59,78,0.16)",
    hexBg: "rgba(255,59,78,0.07)",
  },
};

export function riskRank(r: RiskLevel): number {
  return r === "critical" ? 2 : r === "beware" ? 1 : 0;
}

export function formatAccel(a: number): string {
  return `${a >= 0 ? "+" : "−"}${Math.abs(a).toFixed(2)}`;
}

export function timeAgo(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const s = Math.max(1, Math.floor((Date.now() - d.getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}
