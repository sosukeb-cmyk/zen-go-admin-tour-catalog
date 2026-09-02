"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Check,
  Flag,
  Clock,
  GripVertical,
  Headphones,
  MapPin,
  Plus,
  RotateCcw,
  ShoppingCart,
  User,
} from "lucide-react";
import type { BookingItinerary } from "@/lib/bookingData";
import { formatDurationLabel } from "@/lib/bookingData";
import type { MapLocation } from "@/lib/mapLocationMock";
import MapLocationPicker from "@/components/booking/MapLocationPicker";

interface StopoverRow {
  location: string;
  waitTime: string;
  mapLocation: MapLocation | null;
}

interface ItineraryPlannerProps {
  itinerary: BookingItinerary;
  sequence: string;
}

const STEPS = [
  "Itinerary Planning",
  "Vehicle Class",
  "Additional Info",
  "Review & Submit",
];

export default function ItineraryPlanner({
  itinerary,
  sequence,
}: ItineraryPlannerProps) {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState(itinerary.defaultTime);
  const [passengers, setPassengers] = useState(2);
  const [luggage, setLuggage] = useState(2);
  const [otherLuggage, setOtherLuggage] = useState("");
  const [pickup, setPickup] = useState(itinerary.pickup);
  const [dropoff, setDropoff] = useState(itinerary.dropoff);
  const [pickupMap, setPickupMap] = useState<MapLocation | null>(null);
  const [dropoffMap, setDropoffMap] = useState<MapLocation | null>(null);
  const [stopovers, setStopovers] = useState<StopoverRow[]>(
    itinerary.stopovers.map((s) => ({
      location: s.location,
      waitTime: s.waitTime,
      mapLocation: null,
    })),
  );
  const [pickupConfirmed, setPickupConfirmed] = useState(false);
  const [dropoffConfirmed, setDropoffConfirmed] = useState(false);

  const defaultPickup = itinerary.pickup;
  const defaultDropoff = itinerary.dropoff;
  const dateReady = selectedDate.length > 0;
  const locationsReady = pickupConfirmed && dropoffConfirmed;
  const canContinue = dateReady && locationsReady;

  const formattedDate = useMemo(() => {
    if (!selectedDate) return null;
    const d = new Date(`${selectedDate}T12:00:00`);
    if (Number.isNaN(d.getTime())) return selectedDate;
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [selectedDate]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=2000&q=80')",
        }}
      />
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6 sm:px-6">
        {/* Top bar */}
        <header className="mb-6 flex items-center justify-between text-white">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-md transition hover:bg-white/20"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FACC15] text-[#121621]">
              <ArrowLeft className="h-4 w-4" />
            </span>
            Custom Trip
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <button
              type="button"
              className="relative flex items-center gap-1.5 text-white/90"
            >
              <ShoppingCart className="h-4 w-4" />
              Cart
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold">
                1
              </span>
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 text-white/90"
            >
              <Headphones className="h-4 w-4" />
              Support
            </button>
            <span className="flex items-center gap-1.5 text-white/90">
              <User className="h-4 w-4" />
              Hi Sosuke Brause!
            </span>
          </div>
        </header>

        {/* Main card */}
        <div className="flex flex-1 flex-col rounded-[2rem] border border-white/20 bg-slate-900/40 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          {/* Stepper */}
          <div className="mb-8 flex flex-wrap items-center justify-center gap-2 sm:gap-4">
            {STEPS.map((label, i) => {
              const step = i + 1;
              const active = step === 1;
              return (
                <div key={label} className="flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                      active
                        ? "bg-[#FACC15] text-[#121621]"
                        : "border border-white/30 text-white/70"
                    }`}
                  >
                    {step}
                  </div>
                  <span
                    className={`hidden text-sm sm:inline ${
                      active ? "font-semibold text-[#FACC15]" : "text-white/60"
                    }`}
                  >
                    {label}
                  </span>
                  {step < STEPS.length && (
                    <div className="mx-1 hidden h-px w-6 bg-white/20 sm:block" />
                  )}
                </div>
              );
            })}
          </div>

          <h1 className="mb-8 text-center text-3xl font-bold text-white sm:text-4xl">
            Chartered Tour
          </h1>

          {/* Date & Time */}
          <div
            className={`mb-6 rounded-2xl border p-4 ${
              dateReady
                ? "border-white/10 bg-white/5"
                : "border-amber-400/40 bg-amber-500/5 ring-1 ring-amber-400/30"
            }`}
          >
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
                Scheduled trip date
              </p>
              {!dateReady && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
                  <AlertTriangle className="h-3 w-3" />
                  Required
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label
                className={`flex items-center gap-3 rounded-full border px-4 py-3 text-white ${
                  dateReady
                    ? "border-white/10 bg-white/5"
                    : "border-amber-400/30 bg-white/5"
                }`}
              >
                <Calendar className="h-4 w-4 shrink-0 text-white/60" />
                <span className="text-xs text-white/50">Date</span>
                <input
                  type="date"
                  required
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="ml-auto bg-transparent text-sm outline-none [color-scheme:dark]"
                />
              </label>
              <label className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-white">
                <Clock className="h-4 w-4 shrink-0 text-white/60" />
                <span className="text-xs text-white/50">Time</span>
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="ml-auto bg-transparent text-sm outline-none"
                />
              </label>
            </div>
            <p className="mt-2 text-center text-xs text-white/40">
              {formattedDate
                ? `${formattedDate} · Ref ${sequence}`
                : "Choose the date for your trip · Ref " + sequence}
            </p>
          </div>

          {/* Route timeline + map */}
          <div className="mb-6">
            {!locationsReady && (
              <div
                role="alert"
                className="mb-4 flex gap-3 rounded-2xl border border-amber-400/40 bg-amber-500/10 p-4 text-amber-100"
              >
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                <div className="text-sm leading-relaxed">
                  <p className="font-semibold text-amber-200">
                    Review your pick-up &amp; drop-off locations
                  </p>
                  <p className="mt-1 text-amber-100/80">
                    These defaults use a central location so we can estimate
                    trip time and distance. Please confirm or update both to
                    match your accommodation before continuing.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch">
            <div className="h-full rounded-2xl border border-white/10 bg-white/5 p-4">
              <LocationReviewPoint
                kind="pickup"
                icon={<MapPin className="h-4 w-4 text-emerald-400" />}
                label="Pick-up spot"
                value={pickup}
                defaultValue={defaultPickup}
                confirmed={pickupConfirmed}
                mapLocation={pickupMap}
                onMapLocationChange={setPickupMap}
                onChange={(next) => {
                  setPickup(next);
                  setPickupConfirmed(false);
                }}
                onReset={() => {
                  setPickup(defaultPickup);
                  setPickupMap(null);
                  setPickupConfirmed(false);
                }}
                onConfirm={() => setPickupConfirmed(true)}
                isFirst
              />
              {stopovers.map((stop, i) => (
                <StopoverPoint
                  key={i}
                  index={i}
                  location={stop.location}
                  waitTime={stop.waitTime}
                  mapLocation={stop.mapLocation}
                  onLocationChange={(location) =>
                    setStopovers((prev) =>
                      prev.map((s, j) => (j === i ? { ...s, location } : s)),
                    )
                  }
                  onWaitTimeChange={(waitTime) =>
                    setStopovers((prev) =>
                      prev.map((s, j) => (j === i ? { ...s, waitTime } : s)),
                    )
                  }
                  onMapLocationChange={(mapLocation) =>
                    setStopovers((prev) =>
                      prev.map((s, j) => (j === i ? { ...s, mapLocation } : s)),
                    )
                  }
                />
              ))}
              <button
                type="button"
                className="my-3 ml-8 inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
              >
                <Plus className="h-4 w-4" />
                Add a new Stopover
              </button>
              <LocationReviewPoint
                kind="dropoff"
                icon={<Flag className="h-4 w-4 text-rose-400" />}
                label="Drop-off Spot"
                value={dropoff}
                defaultValue={defaultDropoff}
                confirmed={dropoffConfirmed}
                mapLocation={dropoffMap}
                onMapLocationChange={setDropoffMap}
                onChange={(next) => {
                  setDropoff(next);
                  setDropoffConfirmed(false);
                }}
                onReset={() => {
                  setDropoff(defaultDropoff);
                  setDropoffMap(null);
                  setDropoffConfirmed(false);
                }}
                onConfirm={() => setDropoffConfirmed(true)}
                isLast
              />
            </div>

            <RouteMapPreview tripName={itinerary.tripName} />
            </div>
          </div>

          {/* Route stats */}
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {
                label: "Trip Distance",
                value: `${itinerary.tripDistanceKm.toFixed(1)} km`,
                highlight: false,
              },
              {
                label: "Driving",
                value: formatDurationLabel(itinerary.drivingMins),
                highlight: false,
              },
              {
                label: "Sightseeing",
                value: formatDurationLabel(itinerary.waitingMins),
                highlight: false,
              },
              {
                label: "Total",
                value: formatDurationLabel(itinerary.totalMins),
                highlight: true,
              },
            ].map(({ label, value, highlight }) => (
              <div
                key={label}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center"
              >
                <p className="text-xs text-white/50">{label}</p>
                <p
                  className={`mt-1 text-sm font-semibold sm:text-base ${
                    highlight ? "text-[#FACC15]" : "text-white"
                  }`}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Passengers & luggage */}
          <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-white">
              <User className="h-4 w-4 text-white/60" />
              <span className="text-sm text-white/50">Passenger</span>
              <select
                value={passengers}
                onChange={(e) => setPassengers(Number(e.target.value))}
                className="ml-auto bg-transparent text-sm outline-none"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n} className="bg-slate-800">
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-white">
              <span className="text-lg">🧳</span>
              <span className="text-sm text-white/50">Check-in size luggage</span>
              <select
                value={luggage}
                onChange={(e) => setLuggage(Number(e.target.value))}
                className="ml-auto bg-transparent text-sm outline-none"
              >
                {[0, 1, 2, 3, 4].map((n) => (
                  <option key={n} value={n} className="bg-slate-800">
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <input
            type="text"
            value={otherLuggage}
            onChange={(e) => setOtherLuggage(e.target.value)}
            placeholder="Other luggage — Skis, stroller, wheel chair, etc"
            className="mb-8 w-full rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white placeholder-white/40 outline-none focus:border-white/30"
          />

          <button
            type="button"
            disabled={!canContinue}
            className={`w-full rounded-full border py-4 text-base font-semibold backdrop-blur-md transition ${
              canContinue
                ? "border-white/20 bg-slate-900/60 text-white hover:bg-slate-800/80"
                : "cursor-not-allowed border-white/10 bg-white/5 text-white/40"
            }`}
          >
            Continue
          </button>
          {!canContinue && (
            <p className="mt-3 text-center text-sm text-amber-300/90">
              {!dateReady && !locationsReady
                ? "Select your trip date and confirm both pick-up and drop-off locations to continue."
                : !dateReady
                  ? "Select your scheduled trip date to continue."
                  : "Confirm both pick-up and drop-off locations above to continue."}
            </p>
          )}
          {canContinue && (
            <p className="mt-3 text-center text-xs text-emerald-400/80">
              Trip date and locations confirmed — ready to continue.
            </p>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-white/40">
          {itinerary.tripName} · Prototype booking flow
        </p>
      </div>
    </div>
  );
}

function RouteMapPreview({ tripName }: { tripName: string }) {
  return (
    <div className="flex h-full min-h-[320px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5">
      <div className="relative min-h-[260px] flex-1">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://unsplash.com/photos/a-close-up-of-a-map-with-a-pin-in-it-CC3RZJ2C86A')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-slate-800/50 to-emerald-900/30" />
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 400 280"
          preserveAspectRatio="none"
        >
          <path
            d="M 50 220 Q 130 120, 210 140 T 350 80"
            fill="none"
            stroke="#FACC15"
            strokeWidth="3"
            strokeDasharray="6 4"
          />
          <circle cx="50" cy="220" r="7" fill="#34d399" stroke="#fff" strokeWidth="2" />
          <circle cx="210" cy="140" r="6" fill="#FACC15" stroke="#fff" strokeWidth="2" />
          <circle cx="280" cy="110" r="6" fill="#FACC15" stroke="#fff" strokeWidth="2" />
          <circle cx="350" cy="80" r="7" fill="#f87171" stroke="#fff" strokeWidth="2" />
        </svg>
        <div className="absolute left-3 top-3 rounded-lg bg-black/40 px-2.5 py-1 text-[10px] font-medium text-white/80 backdrop-blur-sm">
          Osaka → Nara
        </div>
        <div className="absolute bottom-3 right-3 flex flex-col gap-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/90 text-xs font-bold text-slate-700 shadow">
            +
          </div>
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/90 text-xs font-bold text-slate-700 shadow">
            −
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 border-t border-white/10 px-4 py-3 text-xs text-white/60">
        <MapPin className="h-3.5 w-3.5 shrink-0 text-[#FACC15]" />
        <span>Route Preview</span>
        <span className="ml-auto truncate text-white/40">{tripName}</span>
      </div>
    </div>
  );
}

function LocationReviewPoint({
  kind,
  icon,
  label,
  value,
  defaultValue,
  confirmed,
  mapLocation,
  onMapLocationChange,
  onChange,
  onReset,
  onConfirm,
  isFirst,
  isLast,
}: {
  kind: "pickup" | "dropoff";
  icon: React.ReactNode;
  label: string;
  value: string;
  defaultValue: string;
  confirmed: boolean;
  mapLocation: MapLocation | null;
  onMapLocationChange: (location: MapLocation | null) => void;
  onChange: (value: string) => void;
  onReset: () => void;
  onConfirm: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  const isDefault = value.trim() === defaultValue.trim();
  const canConfirm = value.trim().length > 0;

  return (
    <div
      className={`relative flex gap-4 pl-2 ${
        confirmed
          ? "rounded-xl ring-1 ring-emerald-400/30"
          : "rounded-xl ring-2 ring-amber-400/50 ring-offset-2 ring-offset-transparent"
      }`}
    >
      {!isLast && (
        <div className="absolute left-[19px] top-8 h-[calc(100%+8px)] w-px bg-white/20" />
      )}
      <div
        className={`relative z-10 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isFirst ? "bg-emerald-500/20" : isLast ? "bg-rose-500/20" : "bg-white/10"
        }`}
      >
        {icon}
      </div>
      <div className="flex min-w-0 flex-1 gap-3 pb-6 pt-0.5">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs text-white/50">{label}</p>
            {confirmed ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                <Check className="h-3 w-3" />
                Confirmed
              </span>
            ) : (
              <NeedsReviewBadge />
            )}
            {!confirmed && isDefault && (
              <span className="text-[10px] text-white/40">Default location</span>
            )}
          </div>

          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            aria-label={`${label} description`}
            placeholder={`Enter your ${kind === "pickup" ? "pick-up" : "drop-off"} description`}
            className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/30"
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/10"
            >
              <RotateCcw className="h-3 w-3" />
              Reset to default
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={!canConfirm}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                canConfirm
                  ? confirmed
                    ? "bg-emerald-500/25 text-emerald-200"
                    : "bg-[#FACC15] text-[#121621] hover:bg-[#eab308]"
                  : "cursor-not-allowed bg-white/5 text-white/30"
              }`}
            >
              <Check className="h-3 w-3" />
              {confirmed ? "Confirmed" : "Confirm location"}
            </button>
          </div>
        </div>

        <MapLocationPicker
          label={label}
          value={mapLocation}
          onChange={onMapLocationChange}
        />
      </div>
    </div>
  );
}

const LOCATION_REVIEW_HINT =
  "Trip time and distance are estimated from a central default. Update this to your hotel or accommodation, then confirm.";

function NeedsReviewBadge() {
  const hintId = useId();

  return (
    <span className="group/review relative inline-flex">
      <span
        tabIndex={0}
        className="inline-flex cursor-help items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300 outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
        aria-describedby={hintId}
      >
        <AlertTriangle className="h-3 w-3" />
        Needs review
      </span>
      <span
        id={hintId}
        role="tooltip"
        className="pointer-events-none absolute left-0 top-full z-30 mt-2 hidden w-64 rounded-xl border border-amber-400/30 bg-slate-900/95 p-3 text-xs font-normal normal-case leading-relaxed tracking-normal text-amber-100/90 shadow-xl backdrop-blur-md group-hover/review:block group-focus-within/review:block"
      >
        {LOCATION_REVIEW_HINT}
      </span>
    </span>
  );
}

function StopoverPoint({
  index,
  location,
  waitTime,
  mapLocation,
  onLocationChange,
  onWaitTimeChange,
  onMapLocationChange,
}: {
  index: number;
  location: string;
  waitTime: string;
  mapLocation: MapLocation | null;
  onLocationChange: (value: string) => void;
  onWaitTimeChange: (value: string) => void;
  onMapLocationChange: (value: MapLocation | null) => void;
}) {
  return (
    <div className="relative flex gap-4 pl-2">
      <div className="absolute left-[19px] top-8 h-[calc(100%+8px)] w-px bg-white/20" />
      <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
        <span className="flex h-4 w-4 items-center justify-center rounded-full border border-white/40 text-[10px] text-white/70">
          {index + 1}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 gap-3 pb-6">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="text-xs text-white/50">Stopover {index + 1}</p>
          <input
            type="text"
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            aria-label={`Stopover ${index + 1} description`}
            placeholder="Sightseeing spot name or description"
            className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/30 focus:ring-1 focus:ring-white/20"
          />
          <label className="flex items-center gap-2 text-xs text-white/50">
            Standby time
            <input
              type="text"
              value={waitTime}
              onChange={(e) => onWaitTimeChange(e.target.value)}
              className="flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-white/30"
            />
          </label>
        </div>
        <MapLocationPicker
          label={`Stopover ${index + 1}`}
          value={mapLocation}
          onChange={onMapLocationChange}
        />
        <GripVertical className="mt-2 h-5 w-5 shrink-0 self-start text-white/30" />
      </div>
    </div>
  );
}
