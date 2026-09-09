"use client";

import { useEffect, useRef, useState } from "react";
import {
  CalendarClock,
  Check,
  ChevronUp,
  Eye,
  EyeOff,
  Globe,
  Map as MapIcon,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import type {
  DurationTier,
  OfficeLocation,
  ServiceType,
  TourTemplate,
  TourWaypoints,
} from "@/lib/types";
import { DURATION_TIERS, OFFICE_LOCATIONS, SERVICE_TYPES } from "@/lib/types";
import {
  airportDisplayName,
  draftIdForServiceType,
  estimateRouteMetrics,
  formatDuration,
  formatPrice,
  resolveAirportPickup,
  serviceTypeBadgeClasses,
  suggestedPriceForOffice,
} from "@/lib/tourUtils";
import { OFFICE_AIRPORTS } from "@/lib/pricingCmsMock";
import MapLocationPicker from "@/components/booking/MapLocationPicker";
import RouteMap from "@/components/booking/RouteMap";
import VehiclePricingTable from "@/components/booking/VehiclePricingTable";
import AirportVehiclePricingTable from "@/components/booking/AirportVehiclePricingTable";
import { AIRPORT_MAP_LOCATIONS, type MapLocation } from "@/lib/mapLocationMock";
import ConfirmDialog from "@/components/ConfirmDialog";
import DebugField from "@/components/DebugField";

interface TourTemplateModalProps {
  tour: TourTemplate | null;
  isNew: boolean;
  onClose: () => void;
  onSave: (tour: TourTemplate) => void;
  /** Quick status flip — same instant, no-save-required action as the
   * catalog table's row toggle, just reachable from in here too. */
  onToggleStatus: (id: string) => void;
  /** Permanently removes the template — same action as the catalog
   * table's row delete, just reachable from in here too. */
  onDelete: (id: string) => void;
}

interface HistoryEntry {
  label: string;
  snapshot: TourTemplate;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
      {children}
    </label>
  );
}

const EDIT_ROUTE_ROW_GRID =
  "grid grid-cols-1 gap-2 sm:grid-cols-[1fr_7rem_2.75rem_2rem] sm:items-end";

export default function TourTemplateModal({
  tour,
  isNew,
  onClose,
  onSave,
  onToggleStatus,
  onDelete,
}: TourTemplateModalProps) {
  const [draft, setDraft] = useState<TourTemplate | null>(null);
  const [baseline, setBaseline] = useState<TourTemplate | null>(null);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [routeEditing, setRouteEditing] = useState(false);
  const [routeCopy, setRouteCopy] = useState<TourWaypoints | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [routeMapOpen, setRouteMapOpen] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const fieldSnapshotRef = useRef<TourTemplate | null>(null);

  useEffect(() => {
    if (tour) {
      setDraft(structuredClone(tour));
      setBaseline(isNew ? null : structuredClone(tour));
      setMode(isNew ? "edit" : "view");
      setHistory([]);
      setRouteEditing(isNew);
      setRouteCopy(isNew ? structuredClone(tour.waypoints) : null);
      setRouteMapOpen(false);
      setShowHidden(false);
      setSaveError(null);
    }
  }, [tour, isNew]);

  if (!tour || !draft) return null;

  const locked = mode === "view";

  /** A real, save-worthy change: either an undo-tracked edit, or an active
   * custom price override (setting one doesn't itself push undo history). */
  const hasCustomOverride =
    !!draft.vehiclePricing?.rows.some((r) => r.custom) ||
    !!draft.airportVehiclePricing?.rows.some((r) => r.custom);
  const hasEdits = history.length > 0 || hasCustomOverride;

  const update = (patch: Partial<TourTemplate>) =>
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));

  const updateRouteCopy = (patch: Partial<TourWaypoints>) =>
    setRouteCopy((prev) => (prev ? { ...prev, ...patch } : prev));

  /** Push an undo point, then apply a patch to the draft — for discrete button-driven edits. */
  const commit = (label: string, patch: Partial<TourTemplate>) => {
    setHistory((h) => [...h, { label, snapshot: structuredClone(draft) }]);
    setDraft({ ...draft, ...patch });
    setSaveError(null);
  };

  /** Once office + duration are both known, suggest a starting price — but
   * only if nothing's been set yet, so it never clobbers a real price. */
  const withSuggestedPrice = (
    patch: Partial<TourTemplate>,
  ): Partial<TourTemplate> => {
    if (draft.price !== null) return patch;
    const nextOffice = patch.officeLocation ?? draft.officeLocation;
    const nextDuration = patch.durationTier ?? draft.durationTier;
    if (!nextOffice || !nextDuration) return patch;
    return {
      ...patch,
      price: suggestedPriceForOffice(
        nextOffice,
        nextDuration.startsWith("Half Day"),
      ),
    };
  };

  /** Sets pickup + its map pin, going through routeCopy when the route
   * section is actively being edited (which it always is for a new
   * template), or straight onto the draft's waypoints otherwise. */
  const applyPickupResolution = (
    patch: Partial<TourTemplate>,
    resolved: { pickup: string; pickupMapLocation: MapLocation | null },
  ): Partial<TourTemplate> => {
    if (routeEditing) {
      setRouteCopy((prev) =>
        prev
          ? {
              ...prev,
              pickup: resolved.pickup,
              pickupMapLocation: resolved.pickupMapLocation,
            }
          : prev,
      );
      return patch;
    }
    return {
      ...patch,
      waypoints: {
        ...draft.waypoints,
        pickup: resolved.pickup,
        pickupMapLocation: resolved.pickupMapLocation,
      },
    };
  };

  const selectServiceType = (type: ServiceType) => {
    const newId = draftIdForServiceType(type);
    let patch: Partial<TourTemplate> = {
      serviceType: type,
      id: newId,
      reference: newId,
      price: null,
      vehiclePricing: null,
      airportVehiclePricing: null,
    };
    if (type === "Sightseeing Charter") {
      patch = { ...patch, airport: null };
    } else {
      const resolved = resolveAirportPickup(draft.officeLocation);
      patch = { ...patch, durationTier: null, airport: resolved.airport };
      patch = applyPickupResolution(patch, resolved);
    }
    commit("Service type selected", patch);
  };

  const selectOffice = (loc: OfficeLocation) => {
    let patch = withSuggestedPrice({ officeLocation: loc });
    if (draft.serviceType === "Airport") {
      const resolved = resolveAirportPickup(loc);
      patch = { ...patch, airport: resolved.airport };
      patch = applyPickupResolution(patch, resolved);
    }
    commit("Office changed", patch);
  };

  const selectAirport = (airport: string) => {
    const patch = applyPickupResolution(
      { airport },
      {
        pickup: airportDisplayName(airport),
        pickupMapLocation: AIRPORT_MAP_LOCATIONS[airport] ?? null,
      },
    );
    commit("Airport selected", patch);
  };

  /** Instant, no-save-required status flip — mirrors the catalog table's
   * row toggle instead of going through the draft/commit/save pipeline,
   * so it works even while the rest of the form is locked (view mode). */
  const toggleStatusNow = () => {
    const next = draft.status === "active" ? "inactive" : "active";
    setDraft((prev) => (prev ? { ...prev, status: next } : prev));
    if (!isNew) {
      setBaseline((prev) => (prev ? { ...prev, status: next } : prev));
      onToggleStatus(tour.id);
    }
  };

  const undo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory(history.slice(0, -1));
    setDraft(last.snapshot);
    setRouteEditing(false);
    setRouteCopy(null);
    setSaveError(null);
  };

  const enterEdit = () => setMode("edit");

  const cancelEdits = () => {
    if (mode === "view" || !baseline) {
      onClose();
      return;
    }
    setDraft(structuredClone(baseline));
    setMode("view");
    setHistory([]);
    setRouteEditing(false);
    setRouteCopy(null);
    setSaveError(null);
  };

  const editRoute = () => {
    setMode("edit");
    setRouteEditing(true);
    setRouteCopy(structuredClone(draft.waypoints));
  };

  const discardRoute = () => {
    setRouteEditing(false);
    setRouteCopy(null);
  };

  const applyRoute = () => {
    if (!routeCopy) return;
    const unchanged =
      JSON.stringify(draft.waypoints) === JSON.stringify(routeCopy);
    if (unchanged) {
      setRouteEditing(false);
      setRouteCopy(null);
      setSaveError(null);
      return;
    }
    const metrics = estimateRouteMetrics(routeCopy);
    setHistory((h) => [
      ...h,
      { label: "Route updated", snapshot: structuredClone(draft) },
    ]);
    setDraft({
      ...draft,
      waypoints: structuredClone(routeCopy),
      startTime: routeCopy.pickupTime,
      tripDistanceKm: metrics?.distanceKm ?? null,
      tripDurationMins: metrics?.durationMins ?? null,
    });
    setRouteEditing(false);
    setRouteCopy(null);
    setSaveError(null);
  };

  const onFieldFocus = () => {
    fieldSnapshotRef.current = structuredClone(draft);
  };

  const onFieldBlur = () => {
    const before = fieldSnapshotRef.current;
    fieldSnapshotRef.current = null;
    if (!before) return;
    if (JSON.stringify(before) === JSON.stringify(draft)) return;
    setHistory((h) => [...h, { label: "Field edited", snapshot: before }]);
  };

  const handleVehiclePricingChange: React.ComponentProps<
    typeof VehiclePricingTable
  >["onChange"] = (pricing) => {
    if (pricing === null && draft.vehiclePricing) {
      commit("Vehicle prices cleared", { vehiclePricing: null });
    } else {
      update({ vehiclePricing: pricing });
    }
  };

  const handleAirportVehiclePricingChange: React.ComponentProps<
    typeof AirportVehiclePricingTable
  >["onChange"] = (pricing) => {
    if (pricing === null && draft.airportVehiclePricing) {
      commit("Vehicle prices cleared", { airportVehiclePricing: null });
    } else {
      update({ airportVehiclePricing: pricing });
    }
  };

  const handleSave = () => {
    if (!draft.tripName.trim()) {
      setSaveError("Give the template a trip name before saving.");
      return;
    }
    if (!draft.serviceType) {
      setSaveError("Select a service type before saving.");
      return;
    }
    if (!draft.officeLocation) {
      setSaveError("Select an office location before saving.");
      return;
    }
    if (draft.serviceType === "Sightseeing Charter" && !draft.durationTier) {
      setSaveError("Select a duration tier before saving.");
      return;
    }
    if (draft.serviceType === "Airport" && !draft.airport) {
      setSaveError("Select an airport before saving.");
      return;
    }
    const hasMissingCustomPrice =
      draft.vehiclePricing?.rows.some(
        (row) => row.custom && !row.customPrice.trim(),
      ) ||
      draft.airportVehiclePricing?.rows.some(
        (row) => row.custom && !row.customPrice.trim(),
      );
    if (hasMissingCustomPrice) {
      setSaveError(
        "Set a custom price for every vehicle with Custom turned on, or turn Custom off.",
      );
      return;
    }
    setSaveError(null);
    onSave({
      ...draft,
      reference: draft.id,
      startTime: draft.waypoints.pickupTime,
    });
  };

  const wp = routeEditing && routeCopy ? routeCopy : draft.waypoints;
  const readyForPrice =
    draft.serviceType === "Sightseeing Charter"
      ? !!draft.officeLocation && !!draft.durationTier
      : draft.serviceType === "Airport"
        ? !!draft.officeLocation
        : false;
  const canSave =
    !!draft.tripName.trim() &&
    !!draft.serviceType &&
    !!draft.officeLocation &&
    (draft.serviceType === "Airport" ? !!draft.airport : !!draft.durationTier);
  const dirty = baseline
    ? JSON.stringify(baseline) !== JSON.stringify(draft)
    : true;
  const saveEnabled = canSave && dirty && hasEdits && !routeEditing;
  const lastLabel = history.length
    ? history[history.length - 1].label
    : hasCustomOverride
      ? "Custom price set"
      : "";
  const footerNote = saveError
    ? saveError
    : mode === "view"
      ? "Viewing — locked. Choose Edit template to make changes."
      : routeEditing
        ? "Editing route — choose Set route to apply it to this template."
        : hasEdits
          ? `${history.length || 1} unsaved change${
              (history.length || 1) === 1 ? "" : "s"
            } · last: ${lastLabel}`
          : "No changes yet.";
  const footerNoteClass = saveError
    ? "font-medium text-red-600"
    : hasEdits && mode === "edit"
      ? "font-medium text-gray-600"
      : "text-gray-400";

  const fieldClass = `w-full rounded-lg border px-3 py-2.5 text-sm outline-none ${
    locked
      ? "cursor-default border-gray-200 bg-gray-100 text-gray-600"
      : "border-gray-200 bg-white focus:border-gray-400"
  }`;
  const numFieldClass = `w-full rounded-lg border px-3 py-2 text-sm outline-none ${
    locked
      ? "cursor-default border-gray-200 bg-gray-100 text-gray-600"
      : "border-gray-200 bg-white focus:border-gray-400"
  }`;
  const smallFieldClass = numFieldClass;
  const linkFieldClass = `w-full rounded-lg border px-3 py-2 text-xs font-medium outline-none ${
    locked
      ? "cursor-default border-violet-100 bg-violet-50/40 text-violet-400"
      : "border-violet-200 bg-violet-50 text-violet-700 focus:border-violet-400"
  }`;

  const routeRows: {
    badge: string;
    tone: "green" | "red" | "plain";
    name: string;
    meta: string;
    pin: MapLocation | null | undefined;
  }[] = [
    {
      badge: "Pick-up",
      tone: "green",
      name: draft.waypoints.pickup,
      meta: draft.serviceType === "Airport" ? "" : draft.waypoints.pickupTime,
      pin: draft.waypoints.pickupMapLocation,
    },
    ...draft.waypoints.stopovers.map((s, i) => ({
      badge: `Stop ${i + 1}`,
      tone: "plain" as const,
      name: s.location,
      meta: s.waitTime,
      pin: s.mapLocation,
    })),
    {
      badge: "Drop-off",
      tone: "red",
      name: draft.waypoints.dropoff,
      meta: "",
      pin: draft.waypoints.dropoffMapLocation,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 sm:p-8">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-modal-title"
        className="flex max-h-[calc(100vh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <span className="shrink-0 rounded-lg bg-gray-100 px-3 py-1 font-mono text-sm font-bold text-gray-800">
              {draft.id}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2
                  id="tour-modal-title"
                  className="truncate text-[17px] font-bold tracking-tight text-gray-900"
                >
                  {isNew
                    ? "Create trip template"
                    : draft.tripName || "Untitled template"}
                </h2>
                <button
                  type="button"
                  role="switch"
                  aria-checked={draft.status === "active"}
                  title="Toggle active status"
                  onClick={toggleStatusNow}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition hover:opacity-80 ${
                    draft.status === "active"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      draft.status === "active" ? "bg-emerald-500" : "bg-gray-400"
                    }`}
                  />
                  {draft.status === "active" ? "Active" : "Inactive"}
                </button>
              </div>
              <p className="mt-0.5 truncate text-xs text-gray-400">
                {draft.serviceType === "Sightseeing Charter" &&
                draft.officeLocation
                  ? `${draft.officeLocation} office · Sightseeing Charter${
                      draft.durationTier
                        ? ` · ${draft.durationTier} · start ${draft.waypoints.pickupTime}`
                        : ""
                    }`
                  : draft.serviceType === "Airport" && draft.officeLocation
                    ? `${draft.officeLocation} office · Airport transfer${
                        draft.airport
                          ? ` · ${airportDisplayName(draft.airport)}`
                          : ""
                      }`
                    : "Service type and office not set yet"}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setShowHidden((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
            >
              {showHidden ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
              {showHidden ? "Hide Redacted" : "Show Hidden"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[340px_minmax(0,1fr)]">
          {/* Left: Template panel */}
          <div className="flex flex-col gap-5 overflow-y-auto border-b border-gray-100 bg-gray-50/50 p-5 md:border-b-0 md:border-r">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
              Template
            </p>

            <DebugField model="tour_templates" field="service_type">
              <div>
                <FieldLabel>Service Type</FieldLabel>
                <div className="flex flex-wrap gap-1.5">
                  {SERVICE_TYPES.map((type) => {
                    const selected = draft.serviceType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        disabled={locked}
                        onClick={() => selectServiceType(type)}
                        className={`rounded-lg border px-2.5 py-2 text-xs font-bold transition disabled:cursor-default ${
                          selected
                            ? serviceTypeBadgeClasses(type) + " border-transparent"
                            : `border-gray-200 bg-white text-gray-600 ${locked ? "opacity-60" : "hover:bg-gray-100"}`
                        }`}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>
            </DebugField>

            <DebugField model="tour_templates" field="trip_name">
              <div>
                <FieldLabel>Trip Name</FieldLabel>
                <input
                  type="text"
                  readOnly={locked}
                  value={draft.tripName}
                  onChange={(e) => update({ tripName: e.target.value })}
                  onFocus={onFieldFocus}
                  onBlur={onFieldBlur}
                  placeholder="e.g. Autumn Foliage & Deer Paths"
                  className={fieldClass}
                />
              </div>
            </DebugField>

            <DebugField model="tour_templates" field="office_id">
              <div>
                <FieldLabel>Office Location</FieldLabel>
                <div className="grid grid-cols-2 gap-1.5">
                  {OFFICE_LOCATIONS.map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      disabled={locked}
                      onClick={() => selectOffice(loc)}
                      className={`rounded-lg px-2.5 py-2 text-xs font-semibold transition disabled:cursor-default ${
                        draft.officeLocation === loc
                          ? "bg-[#121621] text-white"
                          : `bg-white text-gray-600 ${locked ? "opacity-60" : "hover:bg-gray-100"} border border-gray-200`
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>
            </DebugField>

            {draft.serviceType === "Airport" ? (
              draft.officeLocation &&
              (OFFICE_AIRPORTS[draft.officeLocation]?.length ?? 0) > 1 && (
                <DebugField model="tour_templates" field="airport_code">
                  <div>
                    <FieldLabel>Airport</FieldLabel>
                    <div className="grid grid-cols-2 gap-1.5">
                      {OFFICE_AIRPORTS[draft.officeLocation].map((airport) => (
                        <button
                          key={airport}
                          type="button"
                          disabled={locked}
                          onClick={() => selectAirport(airport)}
                          className={`rounded-lg px-2.5 py-2 text-center text-xs font-semibold transition disabled:cursor-default ${
                            draft.airport === airport
                              ? "bg-[#121621] text-white"
                              : `bg-white text-gray-600 ${locked ? "opacity-60" : "hover:bg-gray-100"} border border-gray-200`
                          }`}
                        >
                          {airportDisplayName(airport)}
                        </button>
                      ))}
                    </div>
                  </div>
                </DebugField>
              )
            ) : (
              <DebugField model="tour_templates" field="duration_tier">
                <div>
                  <FieldLabel>Duration Tier</FieldLabel>
                  <div className="grid grid-cols-2 gap-1.5">
                    {DURATION_TIERS.map((tier) => (
                      <button
                        key={tier}
                        type="button"
                        disabled={locked}
                        onClick={() =>
                          commit(
                            "Duration tier changed",
                            withSuggestedPrice({
                              durationTier: tier as DurationTier,
                            }),
                          )
                        }
                        className={`rounded-lg px-2.5 py-2 text-center text-xs font-semibold transition disabled:cursor-default ${
                          draft.durationTier === tier
                            ? "bg-[#121621] text-white"
                            : `bg-white text-gray-600 ${locked ? "opacity-60" : "hover:bg-gray-100"} border border-gray-200`
                        }`}
                      >
                        {tier}
                      </button>
                    ))}
                  </div>
                </div>
              </DebugField>
            )}

            <div className="h-px bg-gray-200" />

            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
              Trip Totals
            </p>
            <div className="grid grid-cols-3 gap-2">
              <DebugField model="tour_templates" field="trip_distance_km">
                <div className="rounded-lg border border-gray-200 bg-white px-2.5 py-2">
                  <p className="text-[11px] text-gray-400">Distance</p>
                  <p className="mt-0.5 text-sm font-bold tabular-nums text-gray-900">
                    {draft.tripDistanceKm !== null
                      ? `${draft.tripDistanceKm.toFixed(1)} km`
                      : "--"}
                  </p>
                </div>
              </DebugField>
              <DebugField model="tour_templates" field="trip_duration_mins">
                <div className="rounded-lg border border-gray-200 bg-white px-2.5 py-2">
                  <p className="text-[11px] text-gray-400">Duration</p>
                  <p className="mt-0.5 text-sm font-bold tabular-nums text-gray-900">
                    {draft.tripDurationMins !== null
                      ? formatDuration(draft.tripDurationMins)
                      : "--"}
                  </p>
                </div>
              </DebugField>
              <DebugField model="tour_templates" field="price">
                <div className="rounded-lg border border-[#121621] bg-[#121621] px-2.5 py-2">
                  <p className="text-[11px] text-white/50">Price</p>
                  <p className="mt-0.5 text-sm font-bold tabular-nums text-[#FACC15]">
                    {draft.price !== null ? formatPrice(draft.price) : "--"}
                  </p>
                </div>
              </DebugField>
            </div>
            {!readyForPrice ? (
              <p className="-mt-1 text-[11px] text-gray-400">
                {draft.serviceType === "Airport"
                  ? "Select an office to set a starting price."
                  : "Select an office and duration tier to set a starting price."}
              </p>
            ) : (
              <DebugField model="tour_templates" field="price">
                <div>
                  <FieldLabel>¥</FieldLabel>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    readOnly={locked}
                    value={draft.price ?? 0}
                    onChange={(e) =>
                      update({ price: parseInt(e.target.value, 10) || 0 })
                    }
                    onFocus={onFieldFocus}
                    onBlur={onFieldBlur}
                    className={numFieldClass}
                  />
                </div>
              </DebugField>
            )}
            {!draft.tripDistanceKm && !draft.tripDurationMins && (
              <p className="-mt-1 text-[11px] text-gray-400">
                Distance and duration are calculated once the route&apos;s
                pick-up and drop-off pins are set.
              </p>
            )}

            <div className="h-px bg-gray-200" />

            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
              Public Links
            </p>
            <div className="flex flex-col gap-2">
              <DebugField model="tour_templates" field="tour_details_url">
              <div>
                <FieldLabel>Tour details page</FieldLabel>
                <div className="flex items-center gap-1.5">
                  <input
                    type="url"
                    aria-label="Tour details URL"
                    readOnly={locked}
                    value={draft.previewLinks.tourDetails}
                    onChange={(e) =>
                      update({
                        previewLinks: {
                          ...draft.previewLinks,
                          tourDetails: e.target.value,
                        },
                      })
                    }
                    onFocus={onFieldFocus}
                    onBlur={onFieldBlur}
                    placeholder="https://www.zengoride.com/tours/..."
                    className={linkFieldClass}
                  />
                  {!isNew && draft.previewLinks.tourDetails && (
                    <button
                      type="button"
                      title="Open tour details page"
                      onClick={() =>
                        window.open(
                          draft.previewLinks.tourDetails,
                          "_blank",
                          "noopener,noreferrer",
                        )
                      }
                      className="shrink-0 rounded-lg border border-gray-200 bg-white p-2 text-blue-500 transition hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Globe className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              </DebugField>
              <DebugField model="tour_templates" field="tour_booking_url">
              <div>
                <FieldLabel>Booking page</FieldLabel>
                <div className="flex items-center gap-1.5">
                  <input
                    type="url"
                    aria-label="Booking URL"
                    readOnly={locked}
                    value={draft.previewLinks.tourBooking}
                    onChange={(e) =>
                      update({
                        previewLinks: {
                          ...draft.previewLinks,
                          tourBooking: e.target.value,
                        },
                      })
                    }
                    onFocus={onFieldFocus}
                    onBlur={onFieldBlur}
                    placeholder="/tours/your-slug/00001/2026-09-02"
                    className={linkFieldClass}
                  />
                  {!isNew && draft.previewLinks.tourBooking && (
                    <button
                      type="button"
                      title="Open booking page"
                      onClick={() =>
                        window.open(
                          draft.previewLinks.tourBooking,
                          "_blank",
                          "noopener,noreferrer",
                        )
                      }
                      className="shrink-0 rounded-lg border border-gray-200 bg-white p-2 text-violet-500 transition hover:bg-violet-50 hover:text-violet-600"
                    >
                      <CalendarClock className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              </DebugField>
            </div>

            {showHidden && (
              <div className="flex flex-col gap-3 rounded-lg border border-dashed border-gray-200 bg-white p-3.5">
                <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                  Redacted fields
                </p>
                {(
                  [
                    ["User Name", "userName", "user_name"],
                    ["Email", "userEmail", "user_email"],
                    ["User Source", "userSource", "user_source"],
                    ["Payment Status", "paymentStatus", "payment_status"],
                  ] as const
                ).map(([label, key, dbField]) => (
                  <DebugField key={key} model="tour_templates" field={dbField}>
                    <div>
                      <FieldLabel>{label}</FieldLabel>
                      <input
                        type="text"
                        readOnly={locked}
                        value={(draft[key] as string | null) ?? ""}
                        onChange={(e) =>
                          update({ [key]: e.target.value || null })
                        }
                        onFocus={onFieldFocus}
                        onBlur={onFieldBlur}
                        placeholder="—"
                        className={smallFieldClass}
                      />
                    </div>
                  </DebugField>
                ))}
                <div className="grid grid-cols-2 gap-2">
                  <DebugField model="tour_templates" field="driver_name">
                    <div>
                      <FieldLabel>Driver</FieldLabel>
                      <input
                        type="text"
                        readOnly={locked}
                        value={draft.driverName ?? ""}
                        onChange={(e) =>
                          update({ driverName: e.target.value || null })
                        }
                        onFocus={onFieldFocus}
                        onBlur={onFieldBlur}
                        className={smallFieldClass}
                      />
                    </div>
                  </DebugField>
                  <DebugField model="tour_templates" field="plate_number">
                    <div>
                      <FieldLabel>Plate Number</FieldLabel>
                      <input
                        type="text"
                        readOnly={locked}
                        value={draft.plateNumber ?? ""}
                        onChange={(e) =>
                          update({ plateNumber: e.target.value || null })
                        }
                        onFocus={onFieldFocus}
                        onBlur={onFieldBlur}
                        className={smallFieldClass}
                      />
                    </div>
                  </DebugField>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <DebugField model="tour_templates" field="passengers">
                    <div>
                      <FieldLabel>Passengers</FieldLabel>
                      <select
                        disabled={locked}
                        value={draft.passengers ?? ""}
                        onChange={(e) =>
                          update({
                            passengers: e.target.value
                              ? Number(e.target.value)
                              : null,
                          })
                        }
                        className={smallFieldClass}
                      >
                        <option value="">—</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                  </DebugField>
                  <DebugField model="tour_templates" field="luggage">
                    <div>
                      <FieldLabel>Luggage</FieldLabel>
                      <select
                        disabled={locked}
                        value={draft.luggage ?? ""}
                        onChange={(e) =>
                          update({
                            luggage: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                        className={smallFieldClass}
                      >
                        <option value="">—</option>
                        {[0, 1, 2, 3, 4].map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                    </select>
                  </div>
                  </DebugField>
                </div>
                <label className="flex items-center gap-2 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    disabled={locked}
                    checked={draft.useDefaultPrice}
                    onChange={(e) =>
                      update({ useDefaultPrice: e.target.checked })
                    }
                    className="rounded"
                  />
                  Use Default Price
                </label>
              </div>
            )}
          </div>

          {/* Right: Route + Vehicle Pricing */}
          <div className="flex flex-col gap-6 overflow-y-auto p-5">
            <div>
              <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                  <MapPin className="h-3.5 w-3.5" />
                  Route
                </p>
                <div className="flex items-center gap-2.5">
                  <p className="text-xs text-gray-400">
                    {wp.stopovers.length} stopover
                    {wp.stopovers.length === 1 ? "" : "s"} ·{" "}
                    {draft.tripDistanceKm !== null
                      ? `${draft.tripDistanceKm.toFixed(1)} km`
                      : "--"}{" "}
                    · {formatDuration(draft.tripDurationMins)}
                  </p>
                  <button
                    type="button"
                    onClick={() => setRouteMapOpen((v) => !v)}
                    className={`inline-flex h-[30px] items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition ${
                      routeMapOpen
                        ? "border-[#121621] bg-gray-100 text-gray-900"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-900 hover:text-gray-900"
                    }`}
                  >
                    {routeMapOpen ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <MapIcon className="h-3.5 w-3.5" />
                    )}
                    {routeMapOpen ? "Hide map" : "Show map"}
                  </button>
                  {!routeEditing ? (
                    <button
                      type="button"
                      onClick={editRoute}
                      className="inline-flex h-[30px] items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-600 transition hover:border-gray-900 hover:text-gray-900"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit route
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={discardRoute}
                        className="inline-flex h-[30px] items-center rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-600 transition hover:bg-gray-100"
                      >
                        Discard
                      </button>
                      <button
                        type="button"
                        onClick={applyRoute}
                        className="inline-flex h-[30px] items-center gap-1.5 rounded-lg border border-[#121621] bg-[#121621] px-3 text-xs font-semibold text-white transition hover:bg-gray-800"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Set route
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-gray-200">
                {!routeEditing ? (
                  routeRows.map((row, i) => (
                    <div
                      key={row.badge}
                      className={`grid grid-cols-[80px_minmax(0,1fr)_auto_28px] items-center gap-2.5 px-3.5 py-3 ${
                        i !== routeRows.length - 1 ? "border-b border-gray-100" : ""
                      } ${row.tone !== "plain" ? "bg-gray-50/60" : ""}`}
                    >
                      {row.tone === "plain" ? (
                        <span className="text-xs font-semibold text-gray-400">
                          {row.badge}
                        </span>
                      ) : (
                        <span
                          className={`inline-flex w-fit items-center justify-center rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                            row.tone === "green"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {row.badge}
                        </span>
                      )}
                      <span className="truncate text-sm font-medium text-gray-900">
                        {row.name || "—"}
                      </span>
                      <span className="whitespace-nowrap text-xs tabular-nums text-gray-400">
                        {row.meta}
                      </span>
                      <MapPin
                        className={`h-4 w-4 justify-self-end ${row.pin ? "text-emerald-600" : "text-gray-300"}`}
                      />
                    </div>
                  ))
                ) : (
                  <>
                    <div className={`border-b border-gray-100 bg-gray-50/60 p-3 ${EDIT_ROUTE_ROW_GRID}`}>
                      <DebugField model="waypoints" field="pickup_text">
                        <div>
                          <FieldLabel>Pick-up Spot</FieldLabel>
                          <input
                            type="text"
                            value={wp.pickup}
                            onChange={(e) => updateRouteCopy({ pickup: e.target.value })}
                            placeholder="Pick-up description"
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                          />
                        </div>
                      </DebugField>
                      {draft.serviceType === "Airport" ? (
                        <div aria-hidden="true" />
                      ) : (
                        <DebugField model="waypoints" field="pickup_time">
                          <div>
                            <FieldLabel>Time</FieldLabel>
                            <input
                              type="time"
                              value={wp.pickupTime}
                              onChange={(e) => updateRouteCopy({ pickupTime: e.target.value })}
                              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                            />
                          </div>
                        </DebugField>
                      )}
                      <MapLocationPicker
                        theme="light"
                        size="compact"
                        label="Pick-up Spot"
                        value={wp.pickupMapLocation ?? null}
                        onChange={(loc) => updateRouteCopy({ pickupMapLocation: loc })}
                      />
                      <div aria-hidden="true" className="hidden sm:block" />
                    </div>

                    {wp.stopovers.map((stop, i) => (
                      <div key={i} className={`border-b border-gray-100 p-3 ${EDIT_ROUTE_ROW_GRID}`}>
                        <input
                          type="text"
                          value={stop.location}
                          onChange={(e) => {
                            const arr = [...wp.stopovers];
                            arr[i] = { ...arr[i], location: e.target.value };
                            updateRouteCopy({ stopovers: arr });
                          }}
                          placeholder={`Stop ${i + 1} description`}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                        />
                        <input
                          type="text"
                          value={stop.waitTime}
                          onChange={(e) => {
                            const arr = [...wp.stopovers];
                            arr[i] = { ...arr[i], waitTime: e.target.value };
                            updateRouteCopy({ stopovers: arr });
                          }}
                          placeholder="Wait time"
                          aria-label={`Stop ${i + 1} wait time`}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                        />
                        <MapLocationPicker
                          theme="light"
                          size="compact"
                          label={`Stopover ${i + 1}`}
                          value={stop.mapLocation ?? null}
                          onChange={(loc) => {
                            const arr = [...wp.stopovers];
                            arr[i] = { ...arr[i], mapLocation: loc };
                            updateRouteCopy({ stopovers: arr });
                          }}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            updateRouteCopy({
                              stopovers: wp.stopovers.filter((_, j) => j !== i),
                            })
                          }
                          className="flex h-9 w-8 shrink-0 items-center justify-center rounded text-red-400 transition hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}

                    <div className="border-b border-gray-100 p-3">
                      <button
                        type="button"
                        onClick={() =>
                          updateRouteCopy({
                            stopovers: [
                              ...wp.stopovers,
                              { location: "", waitTime: "30 min", mapLocation: null },
                            ],
                          })
                        }
                        className="inline-flex items-center gap-1 text-sm font-medium text-violet-600 transition hover:text-violet-800"
                      >
                        <Plus className="h-4 w-4" />
                        Add stopover
                      </button>
                    </div>

                    <div className={`bg-gray-50/60 p-3 ${EDIT_ROUTE_ROW_GRID}`}>
                      <DebugField model="waypoints" field="dropoff_text">
                        <div>
                          <FieldLabel>Drop-off Spot</FieldLabel>
                          <input
                            type="text"
                            value={wp.dropoff}
                            onChange={(e) => updateRouteCopy({ dropoff: e.target.value })}
                            placeholder="Drop-off description"
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                          />
                        </div>
                      </DebugField>
                      <div aria-hidden="true" className="hidden sm:block" />
                      <MapLocationPicker
                        theme="light"
                        size="compact"
                        label="Drop-off Spot"
                        value={wp.dropoffMapLocation ?? null}
                        onChange={(loc) => updateRouteCopy({ dropoffMapLocation: loc })}
                      />
                      <div aria-hidden="true" className="hidden sm:block" />
                    </div>
                  </>
                )}
              </div>

              {routeMapOpen && <RouteMap waypoints={draft.waypoints} />}
            </div>

            {draft.serviceType === "Sightseeing Charter" ? (
              draft.officeLocation && draft.durationTier ? (
                <VehiclePricingTable
                  officeLocation={draft.officeLocation}
                  durationTier={draft.durationTier}
                  pricing={draft.vehiclePricing}
                  onChange={handleVehiclePricingChange}
                  locked={locked}
                />
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 p-5 text-center text-xs text-gray-500">
                  Select an office and duration tier to see available vehicle
                  pricing.
                </div>
              )
            ) : draft.serviceType === "Airport" ? (
              draft.officeLocation && draft.airport ? (
                <AirportVehiclePricingTable
                  officeLocation={draft.officeLocation}
                  airport={draft.airport}
                  pricing={draft.airportVehiclePricing}
                  onChange={handleAirportVehiclePricingChange}
                  locked={locked}
                />
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 p-5 text-center text-xs text-gray-500">
                  Select an office and airport to see available vehicle
                  pricing.
                </div>
              )
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 p-5 text-center text-xs text-gray-500">
                Select a service type to see available vehicle pricing.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 bg-gray-50/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <p className={`text-xs ${footerNoteClass}`}>{footerNote}</p>
            {!isNew && (
              <button
                type="button"
                title="Delete template"
                onClick={() => setDeleteConfirmOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-gray-400 transition hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {mode === "edit" && (
              <button
                type="button"
                disabled={history.length === 0}
                title={
                  history.length > 0
                    ? `Undo: ${history[history.length - 1].label}`
                    : "Nothing to undo yet"
                }
                onClick={undo}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-600 transition hover:border-gray-900 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-gray-200 disabled:hover:text-gray-600"
              >
                <Undo2 className="h-3.5 w-3.5" />
                Undo
              </button>
            )}
            <button
              type="button"
              onClick={cancelEdits}
              className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              {mode === "view" ? "Close" : "Cancel"}
            </button>
            {mode === "view" ? (
              <button
                type="button"
                onClick={enterEdit}
                className="inline-flex items-center gap-2 rounded-lg bg-[#FACC15] px-5 py-2.5 text-sm font-semibold text-[#121621] transition hover:bg-[#eab308]"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit template
              </button>
            ) : (
              <button
                type="button"
                disabled={!saveEnabled}
                onClick={handleSave}
                className="rounded-lg bg-[#FACC15] px-6 py-2.5 text-sm font-semibold text-[#121621] transition hover:bg-[#eab308] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {isNew ? "Create template" : "Save changes"}
              </button>
            )}
          </div>
        </div>
      </div>

      {deleteConfirmOpen && (
        <ConfirmDialog
          title="Delete this template?"
          description={`"${draft.tripName || "Untitled template"}" (${draft.id}) will be permanently removed from the catalog. This can't be undone.`}
          confirmLabel="Delete template"
          onCancel={() => setDeleteConfirmOpen(false)}
          onConfirm={() => {
            onDelete(tour.id);
            setDeleteConfirmOpen(false);
          }}
        />
      )}
    </div>
  );
}
