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
    <div className="flex flex-col items-center gap-3 py-5">
      <div className="relative w-24 h-24">
        <svg width="96" height="96" className="rotate-[-90deg]">
          <circle cx="48" cy="48" r={RADIUS} fill="none" stroke="#e0d9c8" strokeWidth="4" />
          <circle
            cx="48" cy="48" r={RADIUS}
            fill="none"
            stroke="#ff6b35"
            strokeWidth="4"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-base font-mono font-bold text-[#ff6b35]">{formatted}</span>
        </div>
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-semibold text-[#1a1530]">Your quill rests…</p>
        <p className="text-xs text-[#8a8098]">
          Your voice returns in <span className="text-[#ff6b35] font-semibold">{formatted}</span>
        </p>
      </div>
    </div>
  );
}
