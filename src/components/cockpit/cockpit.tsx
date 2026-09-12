"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BellRing, ShieldHalf, Volume2, Wifi } from "lucide-react";
import { cn } from "@/lib/cn";
import { riskFromDistance } from "@/lib/risk";
import { TelemetryHub } from "@/components/cockpit/telemetry-hub";
import { SimSlider } from "@/components/cockpit/sim-slider";
import { CameraPanel } from "@/components/cockpit/camera-panel";
import { VitalsPanel } from "@/components/cockpit/vitals-panel";
import { MapPanel } from "@/components/cockpit/map-panel";

function speedTarget(distance: number): number {
  if (distance < 15) return 0;
  if (distance < 50) return 3.5 + ((distance - 15) / 35) * 4.5;
  return 9 + ((Math.min(200, distance) - 50) / 150) * 21;
}

/* ------------------------------------------------------------------ */
/* Parking-sensor audio engine (Web Audio API — OscillatorNode)        */
/* ------------------------------------------------------------------ */
type AudioCfg = {
  mode: "off" | "pulse" | "solid";
  freq: number;
  onMs: number;
  offMs: number;
  level: number;
};

export function Cockpit() {
  const [distance, setDistance] = useState(128);
  const [speed, setSpeed] = useState(18.6);
  const [accel, setAccel] = useState(0.18);
  const [temp, setTemp] = useState(68.4);
  const [battery, setBattery] = useState(78);
  const [history, setHistory] = useState<number[]>([140, 138, 136, 134, 131, 130, 128]);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  const risk = riskFromDistance(distance);
  const liveRef = useRef({ distance, speed });
  liveRef.current = { distance, speed };

  /* ----- cabin clock ----- */
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  /* ----- physics loop: keeps vitals alive & organic ----- */
  useEffect(() => {
    const iv = setInterval(() => {
      const d = liveRef.current.distance;
      const critical = d < 15;
      setSpeed((prev) => {
        const target = speedTarget(d);
        const next = prev + (target - prev) * (critical ? 0.16 : 0.055) + (Math.random() - 0.5) * 0.08;
        const clamped = Math.max(0, Math.min(42, next));
        const instAccel = ((clamped - prev) / 3.6 / 0.12) * -1;
        setAccel((a) =>
          Math.max(-5.5, Math.min(3.2, a * 0.72 + instAccel * 0.28 + (Math.random() - 0.5) * 0.06)),
        );
        return clamped;
      });
      setTemp((t) => {
        // Emergency braking spikes drivetrain temperature into the red.
        const target = critical ? 97.5 : 62 + liveRef.current.speed * 0.62;
        const rate = critical ? 0.085 : 0.02;
        return Math.max(54, Math.min(99, t + (target - t) * rate + (Math.random() - 0.5) * 0.08));
      });
      setBattery((b) => (b <= 24 ? 82 : b - 0.0022));
    }, 120);

    const hist = setInterval(() => {
      setHistory((h) => [...h.slice(-79), Math.round(liveRef.current.distance)]);
    }, 480);

    return () => {
      clearInterval(iv);
      clearInterval(hist);
    };
  }, []);

  /* ----- audio context + persistent oscillator chain ----- */
  const audioCtxRef = useRef<AudioContext | null>(null);
  const chainRef = useRef<{ osc: OscillatorNode; gain: GainNode } | null>(null);
  const cfgRef = useRef<AudioCfg>({ mode: "off", freq: 900, onMs: 110, offMs: 700, level: 0.2 });

  const silence = useCallback(() => {
    const ch = chainRef.current;
    const ctx = audioCtxRef.current;
    if (ch && ctx) ch.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.015);
  }, []);

  const enableAudio = useCallback(async () => {
    try {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      if (!audioCtxRef.current) audioCtxRef.current = new Ctor();
      const ctx = audioCtxRef.current;
      await ctx.resume();
      if (!chainRef.current) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.value = 900;
        gain.gain.value = 0;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        chainRef.current = { osc, gain };
      }
      // confirm beep so the user knows alarms are live
      const ch = chainRef.current;
      ch.osc.frequency.setValueAtTime(1120, ctx.currentTime);
      ch.gain.gain.setValueAtTime(0.16, ctx.currentTime);
      ch.gain.gain.setTargetAtTime(0, ctx.currentTime + 0.09, 0.01);
      setAudioEnabled(true);
    } catch {
      /* audio unavailable */
    }
  }, []);

  const disableAudio = useCallback(() => {
    setAudioEnabled(false);
    cfgRef.current = { ...cfgRef.current, mode: "off" };
    silence();
  }, [silence]);

  /* sync the alarm pattern from current distance/risk state */
  useEffect(() => {
    if (!audioEnabled) {
      cfgRef.current = { ...cfgRef.current, mode: "off" };
      return;
    }
    if (risk === "critical") {
      // continuous solid tone — maximum urgency
      cfgRef.current = { mode: "solid", freq: 990, onMs: 0, offMs: 0, level: 0.32 };
    } else if (risk === "beware") {
      // repeating beeps, rate + pitch climb as distance shrinks
      const t = Math.max(0, Math.min(1, (distance - 15) / 35)); // 1 = 50cm, 0 = 15cm
      cfgRef.current = {
        mode: "pulse",
        freq: 700 + (1 - t) * 420, // 700Hz → 1120Hz
        onMs: 105,
        offMs: 85 + t * 640, // 725ms → 85ms gaps
        level: 0.16 + (1 - t) * 0.1,
      };
    } else {
      cfgRef.current = { ...cfgRef.current, mode: "off" };
    }
  }, [audioEnabled, risk, distance]);

  /* the scheduler: gates the oscillator from the live config */
  useEffect(() => {
    if (!audioEnabled) {
      silence();
      return;
    }
    let on = false;
    let nextFlip = 0;
    let lastType: OscillatorType = "square";
    const iv = setInterval(() => {
      const ch = chainRef.current;
      const ctx = audioCtxRef.current;
      if (!ch || !ctx || ctx.state !== "running") return;
      const c = cfgRef.current;
      const nowMs = performance.now();

      // harsher timbre when critical
      const wantType: OscillatorType = c.mode === "solid" ? "sawtooth" : "square";
      if (ch.osc.type !== wantType) {
        ch.osc.type = wantType;
        lastType = wantType;
      }

      if (c.mode === "solid") {
        if (Math.abs(ch.osc.frequency.value - c.freq) > 1) {
          ch.osc.frequency.setValueAtTime(c.freq, ctx.currentTime);
        }
        if (!on) {
          // fast ramp so the solid tone punches instantly
          ch.gain.gain.setValueAtTime(ch.gain.gain.value, ctx.currentTime);
          ch.gain.gain.linearRampToValueAtTime(c.level, ctx.currentTime + 0.02);
          on = true;
        }
      } else if (c.mode === "pulse") {
        if (nowMs >= nextFlip) {
          on = !on;
          ch.osc.frequency.setValueAtTime(c.freq, ctx.currentTime);
          ch.gain.gain.setTargetAtTime(on ? c.level : 0, ctx.currentTime, 0.005);
          nextFlip = nowMs + (on ? c.onMs : c.offMs);
        } else if (on && Math.abs(ch.osc.frequency.value - c.freq) > 6) {
          // glide pitch while beeping as the slider moves
          ch.osc.frequency.setValueAtTime(c.freq, ctx.currentTime);
        }
      } else if (on) {
        ch.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.02);
        on = false;
      }
    }, 28);
    return () => {
      clearInterval(iv);
      silence();
    };
  }, [audioEnabled, silence]);

  /* suspend cleanly on unmount */
  useEffect(
    () => () => {
      const ctx = audioCtxRef.current;
      ctx?.close().catch(() => undefined);
    },
    [],
  );

  const alarmsLive = audioEnabled && risk !== "low";

  return (
    <div className="grid-bg noise-fade min-h-screen bg-ink-950">
      {risk === "critical" && (
        <div aria-hidden className="emergency-frame pointer-events-none fixed inset-0 z-40" />
      )}

      {/* ======== cabin header ======== */}
      <header className="sticky top-0 z-30 border-b border-line bg-ink-950/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md border border-accent-400/40 bg-accent-400/10 text-accent-300">
              <ShieldHalf className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="font-mono text-[13px] font-bold tracking-[0.28em] text-fog-100">
                MINEGUARD
              </p>
              <p className="font-mono text-[8.5px] uppercase tracking-[0.26em] text-fog-600">
                Collision avoidance system
              </p>
            </div>
          </div>

          {/* prominent alarm master switch — satisfies browser autoplay policy */}
          <button
            type="button"
            onClick={audioEnabled ? disableAudio : enableAudio}
            className={cn(
              "flex items-center gap-2 rounded-md px-3.5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] transition-all duration-300 sm:px-4",
              audioEnabled
                ? "border border-ok-400/50 bg-ok-400/10 text-ok-400 hover:bg-ok-400/20"
                : alarmsLive
                  ? "blink-hard bg-danger-400 text-ink-950 shadow-[0_0_24px_rgba(255,59,78,0.5)]"
                  : "bg-warn-400 text-ink-950 shadow-[0_0_20px_rgba(255,208,40,0.35)] hover:bg-accent-300",
            )}
          >
            {audioEnabled ? <Volume2 className="h-4 w-4" /> : <BellRing className="h-4 w-4" />}
            <span className="hidden sm:inline">
              {audioEnabled ? "Alarms armed — tap to mute" : "Enable audio / alarms"}
            </span>
            <span className="sm:hidden">{audioEnabled ? "Armed" : "Enable"}</span>
          </button>

          <div className="hidden items-center gap-5 font-mono text-[10px] uppercase tracking-[0.16em] text-fog-500 lg:flex">
            <span>HTX-104 · Haul route R-2</span>
            <span className="flex items-center gap-1.5">
              <Wifi className="h-3.5 w-3.5 text-ok-400" />
              <span className="text-ok-400">Link 98%</span>
            </span>
            <span className="tnum text-fog-200">
              {now ? now.toLocaleTimeString("en-GB", { hour12: false }) : "--:--:--"}
            </span>
          </div>
        </div>
      </header>

      {/* ======== dashboard grid ======== */}
      <main className="mx-auto max-w-[1480px] px-4 py-5 sm:px-6">
        <div className="grid grid-cols-12 gap-4">
          <section className="col-span-12 xl:col-span-8">
            <TelemetryHub
              distance={distance}
              accel={accel}
              history={history}
              risk={risk}
              audioEnabled={audioEnabled}
            />
          </section>
          <section className="col-span-12 xl:col-span-4">
            <SimSlider distance={distance} onChange={setDistance} risk={risk} />
          </section>

          <section className="col-span-12 md:col-span-6 xl:col-span-5">
            <CameraPanel distance={distance} risk={risk} />
          </section>
          <section className="col-span-12 sm:col-span-6 md:col-span-6 xl:col-span-3">
            <VitalsPanel speed={speed} battery={battery} temp={temp} risk={risk} />
          </section>
          <section className="col-span-12 sm:col-span-6 md:col-span-12 xl:col-span-4">
            <MapPanel risk={risk} />
          </section>
        </div>

        <footer className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-line/60 pt-3 font-mono text-[9px] uppercase tracking-[0.2em] text-fog-600">
          <span>MINEGUARD v2.4 · ultrasonic array U-2 · IMU 6-axis</span>
          <span>Kupang West — Site 7 · Shift B · Ops Deck 01</span>
        </footer>
      </main>
    </div>
  );
}
