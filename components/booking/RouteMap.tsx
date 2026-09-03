"use client";

import type { TourWaypoints } from "@/lib/types";

interface RouteMapProps {
  waypoints: TourWaypoints;
}

type PinKind = "start" | "stop" | "end";

function hashName(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 9973;
  return h;
}

export default function RouteMap({ waypoints }: RouteMapProps) {
  const points: { name: string; kind: PinKind }[] = [
    { name: waypoints.pickup || "Pick-up", kind: "start" },
    ...waypoints.stopovers.map((s) => ({
      name: s.location || "Stop",
      kind: "stop" as const,
    })),
    { name: waypoints.dropoff || "Drop-off", kind: "end" },
  ];
  const n = points.length;
  const coords = points.map((p, i) => ({
    x: n === 1 ? 50 : 14 + (72 * i) / (n - 1),
    y: 34 + (hashName(p.name + i) % 34),
  }));
  const polyline = coords.map((c) => `${c.x},${c.y}`).join(" ");

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/80 px-3.5 py-2.5">
        <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
          Route overview
        </p>
        <p className="text-xs text-gray-400">
          {n} points · schematic order, not to scale
        </p>
      </div>
      <div
        className="relative h-[260px]"
        style={{
          backgroundColor: "#f7f8fa",
          backgroundImage:
            "linear-gradient(#e9ebef 1px, transparent 1px), linear-gradient(90deg, #e9ebef 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      >
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
        >
          <polyline
            points={polyline}
            fill="none"
            stroke="#121621"
            strokeWidth={0.4}
            strokeDasharray="1.6 1.2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {points.map((p, i) => {
          const c = coords[i];
          const color =
            p.kind === "start"
              ? "#16a34a"
              : p.kind === "end"
                ? "#dc2626"
                : "#121621";
          const marker = p.kind === "start" ? "A" : p.kind === "end" ? "B" : String(i);
          return (
            <div
              key={`${p.name}-${i}`}
              className="absolute flex max-w-[132px] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5"
              style={{ left: `${c.x}%`, top: `${c.y}%` }}
            >
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white shadow"
                style={{ background: color }}
              >
                {marker}
              </span>
              <span className="max-w-[132px] truncate rounded-md border border-gray-200 bg-white/95 px-1.5 py-0.5 text-[11px] font-semibold text-gray-900">
                {p.name}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-4 border-t border-gray-100 bg-gray-50/80 px-3.5 py-2.5 text-[11px] text-gray-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-600" />
          Start
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#121621]" />
          Stopover
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-600" />
          End
        </span>
      </div>
    </div>
  );
}
