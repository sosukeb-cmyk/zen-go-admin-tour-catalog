"use client";

import { useMemo, useState } from "react";
import { Pencil, RefreshCw } from "lucide-react";
import {
  officeCounts,
  PRICING_CMS_TABS,
  PRICING_OFFICES,
  SIGHTSEEING_PRICE_SEED,
  type PricingCmsTab,
  type PricingOffice,
  type SightseeingPriceRow,
} from "@/lib/pricingCmsMock";
import { formatPrice } from "@/lib/tourUtils";

function AvailabilityToggle({
  available,
  onToggle,
}: {
  available: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={available}
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
        available ? "bg-emerald-500" : "bg-gray-300"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform ${
          available ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export default function PricingCMSView() {
  const [activeTab, setActiveTab] = useState<PricingCmsTab>("Sightseeing Price");
  const [rows, setRows] = useState<SightseeingPriceRow[]>(SIGHTSEEING_PRICE_SEED);
  const [officeFilter, setOfficeFilter] = useState<PricingOffice | "All">("All");

  const counts = useMemo(() => officeCounts(rows), [rows]);

  const filtered = useMemo(() => {
    if (officeFilter === "All") return rows;
    return rows.filter((r) => r.office === officeFilter);
  }, [rows, officeFilter]);

  const toggleAvailable = (id: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, available: !r.available } : r,
      ),
    );
  };

  const handleRefresh = () => {
    setRows(SIGHTSEEING_PRICE_SEED);
    setOfficeFilter("All");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Pricing CMS</h1>
        <button
          type="button"
          onClick={handleRefresh}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-gray-200">
        {PRICING_CMS_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition ${
              activeTab === tab
                ? "border-b-2 border-[#FACC15] text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Sightseeing Price" ? (
        <>
          <div className="flex flex-wrap gap-2">
            {(["All", ...PRICING_OFFICES] as const).map((office) => (
              <button
                key={office}
                type="button"
                onClick={() => setOfficeFilter(office)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  officeFilter === office
                    ? "bg-[#121621] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {office} ({counts[office]})
              </button>
            ))}
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  {[
                    "Vehicle Type",
                    "Vehicle Name",
                    "Office",
                    "Owner",
                    "Available",
                    "Half Day ¥",
                    "Full Day ¥",
                    "Action",
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
                {filtered.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-gray-50 transition hover:bg-gray-50/60"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {row.vehicleType}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{row.vehicleName}</td>
                    <td className="px-4 py-3 text-gray-700">{row.office}</td>
                    <td className="px-4 py-3 text-gray-600">{row.owner}</td>
                    <td className="px-4 py-3">
                      <AvailabilityToggle
                        available={row.available}
                        onToggle={() => toggleAvailable(row.id)}
                      />
                    </td>
                    <td className="px-4 py-3 tabular-nums text-gray-900">
                      {formatPrice(row.halfDayPrice)}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-gray-900">
                      {formatPrice(row.fullDayPrice)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        title="Edit row"
                        className="rounded p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-blue-600"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-24 text-gray-400">
          <p className="text-lg font-medium text-gray-600">{activeTab}</p>
          <p className="mt-1 text-sm">No records yet — prototype placeholder.</p>
        </div>
      )}
    </div>
  );
}
