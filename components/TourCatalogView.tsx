"use client";

import { useMemo, useState } from "react";
import {
  CalendarClock,
  Globe,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import type { OfficeLocation, TourStatus, TourTemplate } from "@/lib/types";
import { OFFICE_LOCATIONS } from "@/lib/types";
import { formatPrice } from "@/lib/tourUtils";

interface TourCatalogViewProps {
  tours: TourTemplate[];
  onToggleStatus: (id: string) => void;
  onEdit: (id: string) => void;
  onAddTour: () => void;
  onRefresh: () => void;
}

function pillClass(active: boolean) {
  return `rounded-full px-3 py-1.5 text-xs font-semibold transition ${
    active
      ? "bg-[#121621] text-white"
      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
  }`;
}

export default function TourCatalogView({
  tours,
  onToggleStatus,
  onEdit,
  onAddTour,
  onRefresh,
}: TourCatalogViewProps) {
  const [search, setSearch] = useState("");
  const [officeFilter, setOfficeFilter] = useState<OfficeLocation | "all">(
    "all",
  );
  const [statusFilter, setStatusFilter] = useState<TourStatus | "all">("all");

  const filtered = useMemo(() => {
    return tours.filter((t) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        t.id.toLowerCase().includes(q) ||
        t.tripName.toLowerCase().includes(q) ||
        t.officeLocation.toLowerCase().includes(q);
      const matchesOffice =
        officeFilter === "all" || t.officeLocation === officeFilter;
      const matchesStatus =
        statusFilter === "all" || t.status === statusFilter;
      return matchesSearch && matchesOffice && matchesStatus;
    });
  }, [tours, search, officeFilter, statusFilter]);

  const activeCount = tours.filter((t) => t.status === "active").length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-gray-900">
            Tour Catalog
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
            Add Tour
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
              {[
                "Tour",
                "Office",
                "Duration",
                "Start",
                "Views / Books",
                "Price",
                "Status",
                "Preview",
              ].map((col, i) => (
                <th
                  key={col}
                  className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500 ${
                    i === 4 || i === 5 ? "text-right" : "text-left"
                  } ${i === 7 ? "text-right" : ""}`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-14 text-center text-gray-400">
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
                    <td className="px-4 py-3.5 text-gray-700">
                      {tour.officeLocation}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex whitespace-nowrap rounded-md border border-gray-200 bg-gray-50/80 px-2 py-0.5 text-xs font-medium text-gray-600">
                        {tour.durationTier}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 tabular-nums text-gray-600">
                      {tour.startTime}
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums text-gray-600">
                      {tour.viewedCount} / {tour.bookedCount}
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-gray-900">
                      {formatPrice(tour.price)}
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={active}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleStatus(tour.id);
                        }}
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition ${
                          active
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        <span
                          className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${
                            active ? "bg-emerald-600" : "bg-gray-400"
                          }`}
                        />
                        {active ? "Active" : "Inactive"}
                      </button>
                    </td>
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
                          className="rounded p-1.5 text-gray-400 transition hover:bg-blue-50 hover:text-blue-600"
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
                          className="rounded p-1.5 text-gray-400 transition hover:bg-violet-50 hover:text-violet-600"
                        >
                          <CalendarClock className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
