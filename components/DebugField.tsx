"use client";

import { useRef, useState } from "react";
import { useDebugMode } from "@/lib/debugMode";

interface DebugFieldProps {
  /** Backend table this field would read/write, e.g. "tour_templates". */
  model: string;
  /** Column name on that table, e.g. "trip_name". */
  field: string;
  children: React.ReactNode;
}

const HOVER_DELAY_MS = 1000;

/**
 * Odoo-style dev-mode field inspector: when debug mode is on, hovering the
 * wrapped content for 1s+ shows a small tooltip with the field's backend
 * Model/Field, matching db/schema.sql. No-ops entirely (renders children
 * as-is) when debug mode is off, so it's safe to wrap broadly.
 */
export default function DebugField({ model, field, children }: DebugFieldProps) {
  const { debugMode } = useDebugMode();
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!debugMode) return <>{children}</>;

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    // display:contents keeps this wrapper out of layout entirely — the
    // children render exactly as if it weren't there — while still letting
    // it catch hover events bubbling up from them.
    <span
      style={{ display: "contents" }}
      onMouseEnter={(e) => {
        setPos({ x: e.clientX, y: e.clientY });
        clearTimer();
        timerRef.current = setTimeout(() => setVisible(true), HOVER_DELAY_MS);
      }}
      onMouseMove={(e) => {
        if (visible) setPos({ x: e.clientX, y: e.clientY });
      }}
      onMouseLeave={() => {
        clearTimer();
        setVisible(false);
      }}
    >
      {children}
      {visible && (
        <span
          role="tooltip"
          className="pointer-events-none fixed z-[999] whitespace-nowrap rounded-md bg-[#1c1c1c] px-2.5 py-1.5 text-[11px] font-medium text-white shadow-xl"
          style={{ left: pos.x + 14, top: pos.y + 14 }}
        >
          <span className="block">
            <span className="text-gray-400">Field: </span>
            <span className="font-mono">{field}</span>
          </span>
          <span className="block">
            <span className="text-gray-400">Model: </span>
            <span className="font-mono">{model}</span>
          </span>
        </span>
      )}
    </span>
  );
}
