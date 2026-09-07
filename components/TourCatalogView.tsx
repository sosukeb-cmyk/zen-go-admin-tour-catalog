"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarClock,
  Globe,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import type { OfficeLocation, TourStatus, TourTemplate } from "@/lib/types";
import { OFFICE_LOCATIONS } from "@/lib/types";
import { formatPrice, serviceTypeBadgeClasses } from "@/lib/tourUtils";
import ConfirmDialog from "@/components/ConfirmDialog";

interface TourCatalogViewProps {
  tours: TourTemplate[];
  onToggleStatus: (id: string) => void;
  onEdit: (id: string) => void;
  onAddTour: () => void;
  onRefresh: () => void;
  onDelete: (id: string) => void;
}

function pillClass(active: boolean) {
  return `rounded-full px-3 py-1.5 text-xs font-semibold transition ${
    active
      ? "bg-[#121621] text-white"
      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
  }`;
}

type ColumnKey =
  | "serviceType"
  | "office"
  | "duration"
  | "start"
  | "viewsBooked"
  | "price"
  | "status"
  | "preview";

const OPTIONAL_COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: "serviceType", label: "Service Type" },
  { key: "office", label: "Office" },
  { key: "duration", label: "Duration" },
  { key: "start", label: "Start" },
  { key: "viewsBooked", label: "Views / Books" },
  { key: "price", label: "Price" },
  { key: "status", label: "Status" },
  { key: "preview", label: "Preview" },
];

const DEFAULT_VISIBLE_COLUMNS: Record<ColumnKey, boolean> = {
  serviceType: true,
  office: true,
  duration: true,
  start: true,
  viewsBooked: true,
  price: true,
  status: true,
  preview: true,
};

export default function TourCatalogView({
  tours,
  onToggleStatus,
  onEdit,
  onAddTour,
  onRefresh,
  onDelete,
}: TourCatalogViewProps) {
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<TourTemplate | null>(null);
  const [officeFilter, setOfficeFilter] = useState<OfficeLocation | "all">(
    "all",
  );
  const [statusFilter, setStatusFilter] = useState<TourStatus | "all">("all");
  const [visibleColumns, setVisibleColumns] =
    useState<Record<ColumnKey, boolean>>(DEFAULT_VISIBLE_COLUMNS);
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);
  const columnMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!columnMenuOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (!columnMenuRef.current?.contains(e.target as Node)) {
        setColumnMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [columnMenuOpen]);

  const toggleColumn = (key: ColumnKey) =>
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));

  const filtered = useMemo(() => {
    return tours.filter((t) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        t.id.toLowerCase().includes(q) ||
        t.tripName.toLowerCase().includes(q) ||
        (t.officeLocation?.toLowerCase().includes(q) ?? false);
      const matchesOffice =
        officeFilter === "all" || t.officeLocation === officeFilter;
      const matchesStatus =
        statusFilter === "all" || t.status === statusFilter;
      return matchesSearch && matchesOffice && matchesStatus;
    });
  }, [tours, search, officeFilter, statusFilter]);

  const activeCount = tours.filter((t) => t.status === "active").length;
  const visibleCount =
    1 + OPTIONAL_COLUMNS.filter((c) => visibleColumns[c.key]).length + 2;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-gray-900">
            Catalog
          </h1>
          <p className="mt-1.5 text-sm text-gray-500">
            {tours.length} templates · {activeCount} active ·{" "}
            {tours.length - activeCount} inactive
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            title="Refresh"
            onClick={onRefresh}
            className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onAddTour}
            className="inline-flex h-[38px] items-center gap-2 rounded-lg bg-[#FACC15] px-[18px] text-sm font-semibold text-[#121621] transition hover:bg-[#eab308]"
          >
            <Plus className="h-4 w-4" />
            Add Template
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm">
        <div className="relative max-w-[340px] flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search reference, trip name, office…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-[38px] w-full rounded-lg border border-gray-200 bg-gray-50/60 pl-9 pr-3 text-sm outline-none focus:border-gray-400 focus:bg-white"
          />
        </div>
        <div className="h-6 w-px bg-gray-200" />
        <div className="flex flex-wrap items-center gap-1.5">
          {(["all", ...OFFICE_LOCATIONS] as const).map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => setOfficeFilter(o)}
              className={pillClass(officeFilter === o)}
            >
              {o === "all" ? "All offices" : o}
            </button>
          ))}
        </div>
        <div className="h-6 w-px bg-gray-200" />
        <div className="flex flex-wrap items-center gap-1.5">
          {(["all", "active", "inactive"] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={pillClass(statusFilter === st)}
            >
              {st === "all" ? "Any status" : st === "active" ? "Active" : "Inactive"}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full min-w-[940px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/80">
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Name
              </th>
              {OPTIONAL_COLUMNS.filter((c) => visibleColumns[c.key]).map(
                (c) => (
                  <th
                    key={c.key}
                    className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500 ${
                      c.key === "viewsBooked" ||
                      c.key === "price" ||
                      c.key === "preview"
                        ? "text-right"
                        : "text-left"
                    }`}
                  >
                    {c.label}
                  </th>
                ),
              )}
              <th className="w-10 px-2 py-2.5" aria-hidden="true" />
              <th className="relative w-10 px-2 py-2.5">
                <button
                  type="button"
                  title="Show/hide columns"
                  onClick={() => setColumnMenuOpen((v) => !v)}
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-md transition ${
                    columnMenuOpen
                      ? "bg-gray-200 text-gray-900"
                      : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  }`}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </button>
                {columnMenuOpen && (
                  <div
                    ref={columnMenuRef}
                    className="absolute right-0 top-full z-20 mt-1.5 w-52 rounded-lg border border-gray-200 bg-white p-1.5 text-left normal-case tracking-normal shadow-lg"
                  >
                    {OPTIONAL_COLUMNS.map((c) => (
                      <label
                        key={c.key}
                        className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-normal text-gray-700 hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={visibleColumns[c.key]}
                          onChange={() => toggleColumn(c.key)}
                          className="rounded border-gray-300"
                        />
                        {c.label}
                      </label>
                    ))}
                  </div>
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleCount}
                  className="px-4 py-14 text-center text-gray-400"
                >
                  No tours match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((tour) => {
                const active = tour.status === "active";
                return (
                  <tr
                    key={tour.id}
                    onClick={() => onEdit(tour.id)}
                    className="cursor-pointer border-b border-gray-50 transition hover:bg-gray-50/80"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[15px] font-semibold tracking-tight text-gray-900">
                          {tour.tripName || "Untitled template"}
                        </span>
                        <span className="font-mono text-xs font-medium text-gray-400">
                          {tour.id}
                        </span>
                      </div>
                    </td>
                    {visibleColumns.serviceType && (
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-semibold ${serviceTypeBadgeClasses(tour.serviceType)}`}
                        >
                          {tour.serviceType ?? "—"}
                        </span>
                      </td>
                    )}
                    {visibleColumns.office && (
                      <td className="px-4 py-3.5 text-gray-700">
                        {tour.officeLocation}
                      </td>
                    )}
                    {visibleColumns.duration && (
                      <td className="px-4 py-3.5">
                        {tour.durationTier ? (
                          <span className="inline-flex whitespace-nowrap rounded-md border border-gray-200 bg-gray-50/80 px-2 py-0.5 text-xs font-medium text-gray-600">
                            {tour.durationTier}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    )}
                    {visibleColumns.start && (
                      <td className="px-4 py-3.5 tabular-nums text-gray-600">
                        {tour.startTime}
                      </td>
                    )}
                    {visibleColumns.viewsBooked && (
                      <td className="px-4 py-3.5 text-right tabular-nums text-gray-600">
                        {tour.viewedCount} / {tour.bookedCount}
                      </td>
                    )}
                    {visibleColumns.price && (
                      <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-gray-900">
                        {formatPrice(tour.price)}
                      </td>
                    )}
                    {visibleColumns.status && (
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={active}
                          aria-label={active ? "Active" : "Inactive"}
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleStatus(tour.id);
                          }}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
                            active ? "bg-emerald-500" : "bg-gray-300"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform ${
                              active ? "translate-x-[22px]" : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </td>
                    )}
                    {visibleColumns.preview && (
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            title="Open tour details page"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(
                                tour.previewLinks.tourDetails,
                                "_blank",
                                "noopener,noreferrer",
                              );
                            }}
                            className="rounded p-1.5 text-blue-500 transition hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Globe className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            title="Open booking page"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(
                                tour.previewLinks.tourBooking,
                                "_blank",
                                "noopener,noreferrer",
                              );
                            }}
                            className="rounded p-1.5 text-violet-500 transition hover:bg-violet-50 hover:text-violet-600"
                          >
                            <CalendarClock className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                    <td className="px-2 py-3.5">
                      <button
                        type="button"
                        title="Delete template"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(tour);
                        }}
                        className="rounded p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                    <td />
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title="Delete this template?"
          description={`"${deleteTarget.tripName || "Untitled template"}" (${deleteTarget.id}) will be permanently removed from the catalog. This can't be undone.`}
          confirmLabel="Delete template"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => {
            onDelete(deleteTarget.id);
            setDeleteTarget(null);
          }}
        />
      )}
    </div>
  );
}
