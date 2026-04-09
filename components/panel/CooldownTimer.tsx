"use client";

const RADIUS = 32;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const HOUR_MS = 60 * 60 * 1000;

interface CooldownTimerProps {
  msRemaining: number;
  formatted: string;
}

export function CooldownTimer({ msRemaining, formatted }: CooldownTimerProps) {
  const progress = msRemaining / HOUR_MS;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <div className="relative w-24 h-24">
        {/* Glow behind ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{ boxShadow: "0 0 32px rgba(255,107,53,0.25)", borderRadius: "50%" }}
        />
        <svg width="96" height="96" className="rotate-[-90deg]">
          <circle
            cx="48" cy="48" r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="4"
          />
          <circle
            cx="48" cy="48" r={RADIUS}
            fill="none"
            stroke="url(#cooldownGrad)"
            strokeWidth="4"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
          <defs>
            <linearGradient id="cooldownGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ff6b35" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-base font-mono font-bold" style={{ color: "#ff6b35" }}>
            {formatted}
          </span>
        </div>
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.75)" }}>
          Your quill rests…
        </p>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
          Your voice returns in{" "}
          <span className="font-semibold" style={{ color: "#ff6b35" }}>
            {formatted}
          </span>
        </p>
      </div>
    </div>
  );
}
