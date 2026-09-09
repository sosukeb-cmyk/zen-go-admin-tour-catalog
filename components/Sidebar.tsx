"use client";

import {
  Bug,
  ClipboardList,
  DollarSign,
  LayoutDashboard,
  Map,
} from "lucide-react";
import type { NavView } from "@/lib/types";
import { useDebugMode } from "@/lib/debugMode";

interface SidebarProps {
  activeView: NavView;
  onNavigate: (view: NavView) => void;
}

const NAV_ITEMS: { id: NavView; label: string; icon: typeof Map }[] = [
  { id: "orders", label: "Orders", icon: ClipboardList },
  { id: "pricing-cms", label: "Pricing CMS", icon: DollarSign },
  { id: "dispatch-board", label: "Dispatch Board", icon: LayoutDashboard },
  { id: "tour-catalog", label: "Catalog", icon: Map },
];

export default function Sidebar({ activeView, onNavigate }: SidebarProps) {
  const { debugMode, toggleDebugMode } = useDebugMode();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-56 flex-col bg-[#121621] text-white">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FACC15] text-sm font-black text-[#121621]">
          ZG
        </div>
        <div>
          <div className="text-sm font-bold tracking-tight">Zen Go</div>
          <div className="text-[10px] font-medium uppercase tracking-widest text-white/40">
            Admin Console
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-white/30">
          Navigation
        </p>
        <ul className="space-y-0.5">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = activeView === id;
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => onNavigate(id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "border-l-[3px] border-[#FACC15] bg-[#FACC15]/[0.12] pl-[9px] font-semibold text-[#FACC15]"
                      : "border-l-[3px] border-transparent text-white/60 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 px-3 py-3">
        <button
          type="button"
          onClick={toggleDebugMode}
          title={
            debugMode
              ? "Debug mode on — hover a field to see its Model/Field"
              : "Turn on debug mode"
          }
          aria-pressed={debugMode}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
            debugMode
              ? "bg-emerald-500/15 text-emerald-400"
              : "text-white/40 hover:bg-white/5 hover:text-white/70"
          }`}
        >
          <Bug className="h-4 w-4 shrink-0" />
          Debug Mode
          <span
            className={`ml-auto inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors ${
              debugMode ? "bg-emerald-500" : "bg-white/15"
            }`}
          >
            <span
              className={`inline-block h-3 w-3 rounded-full bg-white shadow transition-transform ${
                debugMode ? "translate-x-[13px]" : "translate-x-0.5"
              }`}
            />
          </span>
        </button>
      </div>
    </aside>
  );
}
