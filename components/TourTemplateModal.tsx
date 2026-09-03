"use client";

import { useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  MapPin,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import type { DurationTier, OfficeLocation, TourTemplate } from "@/lib/types";
import { DURATION_TIERS, OFFICE_LOCATIONS } from "@/lib/types";
import { formatDuration, formatPrice } from "@/lib/tourUtils";
import MapLocationPicker from "@/components/booking/MapLocationPicker";
import VehiclePricingTable from "@/components/booking/VehiclePricingTable";
import type { MapLocation } from "@/lib/mapLocationMock";

interface TourTemplateModalProps {
  tour: TourTemplate | null;
  isNew: boolean;
  onClose: () => void;
  onSave: (tour: TourTemplate) => void;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
      {children}
    </label>
  );
}

const ROUTE_ROW_GRID =
  "grid grid-cols-1 gap-2 sm:grid-cols-[1fr_7rem_2.75rem_2rem] sm:items-end";

export default function TourTemplateModal({
  tour,
  isNew,
  onClose,
  onSave,
}: TourTemplateModalProps) {
  const [draft, setDraft] = useState<TourTemplate | null>(null);
  const [showHidden, setShowHidden] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (tour) {
      setDraft(structuredClone(tour));
      setShowHidden(false);
      setSaveError(null);
    }
  }, [tour]);

  if (!tour || !draft) return null;

  const update = (patch: Partial<TourTemplate>) =>
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));

  const updateWaypoint = (
    field: keyof TourTemplate["waypoints"],
    value: string,
  ) =>
    setDraft((prev) =>
      prev
        ? { ...prev, waypoints: { ...prev.waypoints, [field]: value } }
        : prev,
    );

  const addStopover = () =>
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            waypoints: {
              ...prev.waypoints,
              stopovers: [
                ...prev.waypoints.stopovers,
                { location: "", waitTime: "30 min", mapLocation: null },
              ],
            },
          }
        : prev,
    );

  const removeStopover = (index: number) =>
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            waypoints: {
              ...prev.waypoints,
              stopovers: prev.waypoints.stopovers.filter((_, i) => i !== index),
            },
          }
        : prev,
    );

  const updateStopover = (
    index: number,
    field: "location" | "waitTime",
    value: string,
  ) =>
    setDraft((prev) => {
      if (!prev) return prev;
      const stopovers = [...prev.waypoints.stopovers];
      stopovers[index] = { ...stopovers[index], [field]: value };
      return { ...prev, waypoints: { ...prev.waypoints, stopovers } };
    });

  const updateStopoverMap = (index: number, mapLocation: MapLocation | null) =>
    setDraft((prev) => {
      if (!prev) return prev;
      const stopovers = [...prev.waypoints.stopovers];
      stopovers[index] = { ...stopovers[index], mapLocation };
      return { ...prev, waypoints: { ...prev.waypoints, stopovers } };
    });

  const handleSave = () => {
    if (!draft.tripName.trim()) return;
    const hasMissingCustomPrice = draft.vehiclePricing?.rows.some(
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

  const hiddenClass = showHidden ? "" : "hidden";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-8">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-modal-title"
        className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-lg bg-gray-100 px-3 py-1 font-mono text-sm font-bold text-gray-800">
              {draft.id}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={draft.status === "active"}
              onClick={() =>
                update({
                  status: draft.status === "active" ? "inactive" : "active",
                })
              }
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition ${
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
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">
              <input
                type="url"
                aria-label="Tour details URL"
                value={draft.previewLinks.tourDetails}
                onChange={(e) =>
                  update({
                    previewLinks: {
                      ...draft.previewLinks,
                      tourDetails: e.target.value,
                    },
                  })
                }
                className="min-w-0 flex-1 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 outline-none focus:border-violet-400"
                placeholder="https://www.zengoride.com/tours/..."
              />
              <input
                type="url"
                aria-label="Booking URL"
                value={draft.previewLinks.tourBooking}
                onChange={(e) =>
                  update({
                    previewLinks: {
                      ...draft.previewLinks,
                      tourBooking: e.target.value,
                    },
                  })
                }
                className="min-w-0 flex-1 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 outline-none focus:border-violet-400"
                placeholder="/tours/your-slug/00001/2026-09-02"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
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
        <div className="space-y-6 px-6 py-5">
          <h2 id="tour-modal-title" className="text-lg font-bold text-gray-900">
            {isNew ? "Create Tour Template" : "Tour Info"}
          </h2>

          {/* User Info Box — hidden by default */}
          <div
            className={`rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-4 ${hiddenClass}`}
          >
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">
              User Info (Redacted)
            </p>
            <div className="grid grid-cols-2 gap-4">
              {(
                [
                  ["User Name", "userName"],
                  ["Email", "userEmail"],
                  ["User Source", "userSource"],
                  ["Payment Status", "paymentStatus"],
                ] as const
              ).map(([label, key]) => (
                <div key={key}>
                  <FieldLabel>{label}</FieldLabel>
                  <input
                    type="text"
                    value={(draft[key] as string | null) ?? ""}
                    onChange={(e) =>
                      update({ [key]: e.target.value || null })
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                    placeholder="—"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Service Type — locked */}
          <div>
            <FieldLabel>Service Type</FieldLabel>
            <span className="inline-flex rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700">
              Sightseeing Charter
            </span>
          </div>

          {/* Passengers / Luggage — hidden by default */}
          <div className={`grid grid-cols-2 gap-4 ${hiddenClass}`}>
            <div>
              <FieldLabel>Passengers</FieldLabel>
              <select
                value={draft.passengers ?? ""}
                onChange={(e) =>
                  update({
                    passengers: e.target.value
                      ? Number(e.target.value)
                      : null,
                  })
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none"
              >
                <option value="">—</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>Luggage</FieldLabel>
              <select
                value={draft.luggage ?? ""}
                onChange={(e) =>
                  update({
                    luggage: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none"
              >
                <option value="">—</option>
                {[0, 1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Trip Name */}
          <div>
            <FieldLabel>Trip Name</FieldLabel>
            <input
              type="text"
              value={draft.tripName}
              onChange={(e) => update({ tripName: e.target.value })}
              placeholder="e.g. Autumn Foliage & Deer Paths"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gray-400"
            />
          </div>

          {/* Office & Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>Office Location</FieldLabel>
              <select
                value={draft.officeLocation}
                onChange={(e) =>
                  update({ officeLocation: e.target.value as OfficeLocation })
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
              >
                {OFFICE_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>Duration Tier</FieldLabel>
              <div className="flex flex-wrap gap-1.5">
                {DURATION_TIERS.map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => update({ durationTier: tier as DurationTier })}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                      draft.durationTier === tier
                        ? "bg-[#121621] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Route Builder */}
          <div className="rounded-xl border border-gray-200 p-4">
            <p className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-800">
              <MapPin className="h-4 w-4 text-gray-500" />
              Route Builder
            </p>

            <div className={`mb-4 ${ROUTE_ROW_GRID}`}>
              <div>
                <FieldLabel>Pick-up Spot</FieldLabel>
                <input
                  type="text"
                  value={draft.waypoints.pickup}
                  onChange={(e) => updateWaypoint("pickup", e.target.value)}
                  placeholder="Pick-up description"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                />
              </div>
              <div>
                <FieldLabel>Time</FieldLabel>
                <input
                  type="time"
                  value={draft.waypoints.pickupTime}
                  onChange={(e) => {
                    updateWaypoint("pickupTime", e.target.value);
                    update({ startTime: e.target.value });
                  }}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                />
              </div>
              <MapLocationPicker
                theme="light"
                label="Pick-up Spot"
                value={draft.waypoints.pickupMapLocation ?? null}
                onChange={(loc) =>
                  update({
                    waypoints: {
                      ...draft.waypoints,
                      pickupMapLocation: loc,
                    },
                  })
                }
              />
              <div aria-hidden="true" className="hidden sm:block" />
            </div>

            <div className="mb-4 space-y-2">
              <FieldLabel>Stopovers</FieldLabel>
              {draft.waypoints.stopovers.map((stop, i) => (
                <div key={i} className={ROUTE_ROW_GRID}>
                  <input
                    type="text"
                    value={stop.location}
                    onChange={(e) =>
                      updateStopover(i, "location", e.target.value)
                    }
                    placeholder={`Stop ${i + 1} description`}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                  />
                  <input
                    type="text"
                    value={stop.waitTime}
                    onChange={(e) =>
                      updateStopover(i, "waitTime", e.target.value)
                    }
                    placeholder="Wait time"
                    aria-label={`Stop ${i + 1} wait time`}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                  />
                  <MapLocationPicker
                    theme="light"
                    label={`Stopover ${i + 1}`}
                    value={stop.mapLocation ?? null}
                    onChange={(loc) => updateStopoverMap(i, loc)}
                  />
                  <button
                    type="button"
                    onClick={() => removeStopover(i)}
                    className="flex h-9 w-8 shrink-0 items-center justify-center rounded text-red-400 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addStopover}
                className="inline-flex items-center gap-1 text-sm font-medium text-violet-600 transition hover:text-violet-800"
              >
                <Plus className="h-4 w-4" />
                Add new spot
              </button>
            </div>

            <div className={`mb-4 ${ROUTE_ROW_GRID}`}>
              <div>
                <FieldLabel>Drop-off Spot</FieldLabel>
                <input
                  type="text"
                  value={draft.waypoints.dropoff}
                  onChange={(e) => updateWaypoint("dropoff", e.target.value)}
                  placeholder="Drop-off description"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                />
              </div>
              <div aria-hidden="true" className="hidden sm:block" />
              <MapLocationPicker
                theme="light"
                label="Drop-off Spot"
                value={draft.waypoints.dropoffMapLocation ?? null}
                onChange={(loc) =>
                  update({
                    waypoints: {
                      ...draft.waypoints,
                      dropoffMapLocation: loc,
                    },
                  })
                }
              />
              <div aria-hidden="true" className="hidden sm:block" />
            </div>

            <div className="flex gap-6 rounded-lg bg-gray-50 px-4 py-3">
              <div>
                <p className="text-xs text-gray-500">Total Distance</p>
                <p className="text-sm font-bold text-gray-900">
                  {draft.tripDistanceKm.toFixed(1)} km
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Duration</p>
                <p className="text-sm font-bold text-gray-900">
                  {formatDuration(draft.tripDurationMins)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Price</p>
                <p className="text-sm font-bold text-gray-900">
                  {formatPrice(draft.price)}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <div>
                <FieldLabel>Distance (km)</FieldLabel>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={draft.tripDistanceKm}
                  onChange={(e) =>
                    update({ tripDistanceKm: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none"
                />
              </div>
              <div>
                <FieldLabel>Duration (mins)</FieldLabel>
                <input
                  type="number"
                  min="0"
                  value={draft.tripDurationMins}
                  onChange={(e) =>
                    update({
                      tripDurationMins: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none"
                />
              </div>
              <div>
                <FieldLabel>Price (¥)</FieldLabel>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={draft.price}
                  onChange={(e) =>
                    update({ price: parseInt(e.target.value, 10) || 0 })
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none"
                />
              </div>
            </div>
          </div>

          {/* Vehicle Pricing */}
          <VehiclePricingTable
            officeLocation={draft.officeLocation}
            durationTier={draft.durationTier}
            pricing={draft.vehiclePricing}
            onChange={(vehiclePricing) => update({ vehiclePricing })}
          />

          {/* Vehicle Assignment — hidden by default */}
          <div
            className={`rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-4 ${hiddenClass}`}
          >
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">
              Vehicle Assignment (Redacted)
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Driver</FieldLabel>
                <input
                  type="text"
                  value={draft.driverName ?? ""}
                  onChange={(e) =>
                    update({ driverName: e.target.value || null })
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none"
                />
              </div>
              <div>
                <FieldLabel>Plate Number</FieldLabel>
                <input
                  type="text"
                  value={draft.plateNumber ?? ""}
                  onChange={(e) =>
                    update({ plateNumber: e.target.value || null })
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none"
                />
              </div>
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={draft.useDefaultPrice}
                onChange={(e) => update({ useDefaultPrice: e.target.checked })}
                className="rounded"
              />
              Use Default Price
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
          {saveError && (
            <p className="mr-auto text-xs font-medium text-red-600">
              {saveError}
            </p>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!draft.tripName.trim()}
            className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
