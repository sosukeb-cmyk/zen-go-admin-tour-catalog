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
import { formatPrice } from "@/lib/tourUtils";

interface TourCatalogViewProps {
  tours: TourTemplate[];
  onToggleStatus: (id: string) => void;
  onEdit: (id: string) => void;
  onAddTour: () => void;
  onRefresh: () => void;
}

function StatusToggle({
  status,
  onToggle,
}: {
  status: TourStatus;
  onToggle: () => void;
}) {
  const isActive = status === "active";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isActive}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
        isActive ? "bg-emerald-500" : "bg-gray-300"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform ${
          isActive ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function StatusBadge({ status }: { status: TourStatus }) {
  const isActive = status === "active";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        isActive
          ? "bg-emerald-100 text-emerald-800"
          : "bg-gray-100 text-gray-600"
      }`}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Tour Catalog</h1>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-48 rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-gray-400"
            />
          </div>
          <select
            value={officeFilter}
            onChange={(e) =>
              setOfficeFilter(e.target.value as OfficeLocation | "all")
            }
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-400"
          >
            <option value="all">All Offices</option>
            <option value="Tokyo">Tokyo</option>
            <option value="Osaka">Osaka</option>
            <option value="Nagoya">Nagoya</option>
            <option value="Sapporo">Sapporo</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as TourStatus | "all")
            }
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-400"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button
            type="button"
            onClick={onAddTour}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#FACC15] px-4 text-sm font-semibold text-[#121621] transition hover:bg-[#eab308]"
          >
            <Plus className="h-4 w-4" />
            Add Tour
          </button>
          <button
            type="button"
            onClick={onRefresh}
            title="Refresh"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/80">
              {[
                "Reference",
                "Location",
                "Viewed | Booked",
                "Duration",
                "Status",
                "Price",
                "Start Time",
                "Actions",
              ].map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-12 text-center text-gray-400"
                >
                  No tours match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((tour) => (
                <tr
                  key={tour.id}
                  onClick={() => onEdit(tour.id)}
                  className="cursor-pointer border-b border-gray-50 transition hover:bg-blue-50/40"
                >
                  <td className="px-4 py-3">
                    <span className="font-semibold text-blue-600">
                      {tour.id}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {tour.officeLocation}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-gray-600">
                    {tour.viewedCount} | {tour.bookedCount}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                      {tour.durationTier}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <StatusToggle
                        status={tour.status}
                        onToggle={() => onToggleStatus(tour.id)}
                      />
                      <StatusBadge status={tour.status} />
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium tabular-nums text-gray-900">
                    {formatPrice(tour.price)}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-gray-600">
                    {tour.startTime}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
