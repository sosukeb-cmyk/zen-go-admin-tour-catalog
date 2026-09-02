"use client";

import { useEffect, useId, useState } from "react";
import { MapPin, Maximize2, Search, X } from "lucide-react";
import {
  searchMapLocations,
  type MapLocation,
} from "@/lib/mapLocationMock";

type PickerTheme = "dark" | "light";

interface MapLocationPickerProps {
  value: MapLocation | null;
  onChange: (location: MapLocation | null) => void;
  label: string;
  theme?: PickerTheme;
}

const triggerStyles: Record<PickerTheme, { empty: string; filled: string }> = {
  dark: {
    empty:
      "border-white/15 bg-white/5 text-white/35 hover:border-white/25 hover:bg-white/10 hover:text-white/60",
    filled:
      "border-emerald-400/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15",
  },
  light: {
    empty:
      "border-gray-200 bg-gray-50 text-gray-400 hover:border-gray-300 hover:bg-gray-100 hover:text-gray-600",
    filled:
      "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  },
};

export default function MapLocationPicker({
  value,
  onChange,
  label,
  theme = "dark",
}: MapLocationPickerProps) {
  const [open, setOpen] = useState(false);
  const styles = triggerStyles[theme];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={
          value
            ? `Edit map location: ${value.title}`
            : `Set map location for ${label}`
        }
        aria-label={
          value
            ? `Edit map location for ${label}`
            : `Add map location for ${label}`
        }
        className={`flex w-11 shrink-0 flex-col items-center justify-center self-stretch rounded-xl border transition ${value ? styles.filled : styles.empty}`}
      >
        <MapPin
          className={`h-4 w-4 ${value ? (theme === "light" ? "text-emerald-600" : "text-emerald-400") : ""}`}
        />
        <span className="mt-1 text-[9px] font-medium uppercase tracking-wide">
          {value ? "Pin" : "Map"}
        </span>
      </button>

      {open && (
        <MapLocationModal
          label={label}
          initial={value}
          theme={theme}
          onClose={() => setOpen(false)}
          onSave={(loc) => {
            onChange(loc);
            setOpen(false);
          }}
        />
      )}
    </>
  );
}

function MapLocationModal({
  label,
  initial,
  theme,
  onClose,
  onSave,
}: {
  label: string;
  initial: MapLocation | null;
  theme: PickerTheme;
  onClose: () => void;
  onSave: (location: MapLocation) => void;
}) {
  const searchId = useId();
  const [query, setQuery] = useState(initial?.title ?? "");
  const [selected, setSelected] = useState<MapLocation | null>(initial);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = searchMapLocations(query);
  const isLight = theme === "light";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const displayLocation = selected ?? {
    title: query || "Search for a location",
    address: "Select an address from the suggestions below",
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={searchId}
        className={`w-full max-w-lg overflow-hidden rounded-2xl border shadow-2xl ${
          isLight
            ? "border-gray-200 bg-white"
            : "border-white/20 bg-slate-900/95 backdrop-blur-xl"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`flex items-center justify-between border-b px-4 py-3 ${
            isLight ? "border-gray-100" : "border-white/10"
          }`}
        >
          <p
            className={`text-sm font-semibold ${isLight ? "text-gray-900" : "text-white"}`}
          >
            {label}
          </p>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-lg p-1.5 ${isLight ? "text-gray-400 hover:bg-gray-100 hover:text-gray-600" : "text-white/50 hover:bg-white/10 hover:text-white"}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4">
          <div className="relative">
            <div
              className={`flex items-center gap-3 rounded-full border px-4 py-3 ${
                isLight
                  ? "border-gray-200 bg-gray-50"
                  : "border-white/15 bg-white/5"
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isLight ? "bg-white" : "bg-white/10"}`}
              >
                <MapPin className="h-4 w-4 text-[#FACC15]" />
              </span>
              <input
                id={searchId}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowSuggestions(true);
                  setSelected(null);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search for a location..."
                className={`min-w-0 flex-1 bg-transparent text-sm outline-none ${isLight ? "text-gray-900 placeholder:text-gray-400" : "text-white placeholder:text-white/35"}`}
              />
              <Search
                className={`h-4 w-4 shrink-0 ${isLight ? "text-gray-400" : "text-white/40"}`}
              />
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <ul
                className={`absolute left-0 right-0 top-full z-10 mt-2 overflow-hidden rounded-xl border shadow-xl ${
                  isLight
                    ? "border-gray-200 bg-white"
                    : "border-white/15 bg-slate-900"
                }`}
              >
                {suggestions.map((loc) => (
                  <li key={`${loc.title}-${loc.address}`}>
                    <button
                      type="button"
                      onClick={() => {
                        setQuery(loc.title);
                        setSelected(loc);
                        setShowSuggestions(false);
                      }}
                      className={`flex w-full gap-3 px-4 py-3 text-left transition ${isLight ? "hover:bg-gray-50" : "hover:bg-white/5"}`}
                    >
                      <MapPin
                        className={`mt-0.5 h-4 w-4 shrink-0 ${isLight ? "text-gray-400" : "text-white/40"}`}
                      />
                      <div className="min-w-0">
                        <p
                          className={`truncate text-sm font-medium ${isLight ? "text-gray-900" : "text-white"}`}
                        >
                          {loc.title}
                        </p>
                        <p
                          className={`truncate text-xs ${isLight ? "text-gray-500" : "text-white/45"}`}
                        >
                          {loc.address}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div
            className={`relative mt-4 overflow-hidden rounded-xl border ${isLight ? "border-gray-200" : "border-white/10"}`}
          >
            <div
              className="h-52 bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1524666041070-9d87656c25bb?auto=format&fit=crop&w=800&q=80')",
              }}
            />
            <div
              className={`absolute inset-0 ${isLight ? "bg-white/20" : "bg-slate-900/30"}`}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <MapPin
                  className="h-10 w-10 text-red-500 drop-shadow-lg"
                  fill="currentColor"
                />
                <span
                  className={`absolute -bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full px-3 py-1 text-[10px] backdrop-blur-sm ${isLight ? "bg-gray-900/90 text-white/80" : "bg-slate-900/90 text-white/80"}`}
                >
                  <MapPin className="h-3 w-3 text-[#FACC15]" />
                  Click to enable pin drag
                </span>
              </div>
            </div>
            <button
              type="button"
              className="absolute right-2 top-2 rounded-md bg-white/90 p-1.5 text-slate-700 shadow"
              aria-label="Fullscreen map"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>

          <div
            className={`mt-3 rounded-lg px-3 py-2 ${isLight ? "bg-gray-50" : "bg-white/5"}`}
          >
            <p
              className={`text-sm font-medium ${isLight ? "text-gray-900" : "text-white"}`}
            >
              {displayLocation.title}
            </p>
            <p
              className={`mt-0.5 text-xs ${isLight ? "text-gray-500" : "text-white/45"}`}
            >
              {displayLocation.address}
            </p>
          </div>
        </div>

        <div
          className={`grid grid-cols-2 gap-3 border-t p-4 ${isLight ? "border-gray-100" : "border-white/10"}`}
        >
          <button
            type="button"
            onClick={onClose}
            className={`rounded-xl border py-3 text-sm font-medium transition ${
              isLight
                ? "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                : "border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
            }`}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selected}
            onClick={() => selected && onSave(selected)}
            className={`rounded-xl border py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
              isLight
                ? "border-gray-800 bg-gray-900 text-white hover:bg-gray-800"
                : "border-white/15 bg-slate-800/80 text-white hover:bg-slate-700/80"
            }`}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
