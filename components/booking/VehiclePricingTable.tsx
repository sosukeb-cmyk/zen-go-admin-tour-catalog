"use client";

import { DollarSign, RefreshCw, TriangleAlert } from "lucide-react";
import type {
  DurationTier,
  OfficeLocation,
  TourVehiclePriceRow,
  TourVehiclePricing,
} from "@/lib/types";
import { SIGHTSEEING_PRICE_SEED } from "@/lib/pricingCmsMock";

interface VehiclePricingTableProps {
  officeLocation: OfficeLocation;
  durationTier: DurationTier;
  pricing: TourVehiclePricing | null;
  onChange: (pricing: TourVehiclePricing | null) => void;
  locked?: boolean;
}

function rowKey(row: { vehicleType: string; vehicleName: string }): string {
  return `${row.vehicleType}::${row.vehicleName}`;
}

function loadRowsForOffice(office: OfficeLocation): TourVehiclePriceRow[] {
  return SIGHTSEEING_PRICE_SEED.filter(
    (row) => row.office === office && row.available,
  ).map((row) => ({
    vehicleType: row.vehicleType,
    vehicleName: row.vehicleName,
    owner: row.owner,
    halfDayPrice: row.halfDayPrice,
    fullDayPrice: row.fullDayPrice,
    custom: false,
    customPrice: "",
  }));
}

export default function VehiclePricingTable({
  officeLocation,
  durationTier,
  pricing,
  onChange,
  locked = false,
}: VehiclePricingTableProps) {
  const isHalfDay = durationTier.startsWith("Half Day");
  const applicableLabel = isHalfDay ? "Half Day" : "Full Day";
  const stale = pricing !== null && pricing.office !== officeLocation;

  /** Nothing has been customized/reloaded yet — show the live Pricing CMS
   * list for the current office without requiring an explicit load step. */
  const activeOffice = pricing?.office ?? officeLocation;
  const activeRows = pricing?.rows ?? loadRowsForOffice(officeLocation);

  const handleReload = () => {
    const freshRows = loadRowsForOffice(officeLocation);
    const prevByKey = new Map(activeRows.map((r) => [rowKey(r), r]));
    const rows = freshRows.map((row) => {
      const prev = prevByKey.get(rowKey(row));
      return prev
        ? { ...row, custom: prev.custom, customPrice: prev.customPrice }
        : row;
    });
    onChange({ office: officeLocation, rows });
  };

  const toggleCustom = (index: number) => {
    const rows = [...activeRows];
    const row = rows[index];
    const willBeOn = !row.custom;
    rows[index] = {
      ...row,
      custom: willBeOn,
      customPrice: willBeOn
        ? String(isHalfDay ? row.halfDayPrice : row.fullDayPrice)
        : "",
    };
    onChange({ office: activeOffice, rows });
  };

  const setCustomPrice = (index: number, value: string) => {
    const rows = [...activeRows];
    rows[index] = { ...rows[index], customPrice: value };
    onChange({ office: activeOffice, rows });
  };

  const overrideCount = activeRows.filter((r) => r.custom).length;
  const missingCount = activeRows.filter(
    (r) => r.custom && !r.customPrice.trim(),
  ).length;

  return (
    <div className="relative rounded-xl border border-gray-200 p-4">
      <button
        type="button"
        title="Reload from CMS"
        disabled={locked}
        onClick={handleReload}
        className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 transition hover:border-gray-900 hover:text-gray-900 disabled:cursor-default disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-400"
      >
        <RefreshCw className="h-3.5 w-3.5" />
      </button>

      <div className="flex items-start justify-between gap-4 pr-9">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold text-gray-800">
            <DollarSign className="h-4 w-4 text-gray-500" />
            Vehicle Pricing
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Sightseeing category · {officeLocation} office · available
            vehicles only
          </p>
        </div>
        {pricing && !locked && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="h-8 shrink-0 rounded-lg border border-gray-200 bg-white px-3 text-[13px] font-medium text-gray-600 transition hover:bg-gray-50"
          >
            Clear
          </button>
        )}
      </div>

      {stale && (
        <div className="mt-3.5 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
          Loaded for the {pricing.office} office — this template is now set
          to {officeLocation}. Reload to refresh the list.
        </div>
      )}

      {activeRows.length === 0 ? (
        <div className="mt-3.5 rounded-[10px] border border-dashed border-gray-200 bg-gray-50/60 p-5 text-center text-xs text-gray-500">
          No available Sightseeing vehicles found for {officeLocation}.
        </div>
      ) : (
        <div className="mt-3.5 overflow-hidden rounded-[10px] border border-gray-200">
          <table className="w-full border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="whitespace-nowrap px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Vehicle Type
                </th>
                <th className="whitespace-nowrap px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Vehicle Name
                </th>
                <th className="px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Owner
                </th>
                <th className="px-2 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Half Day ¥
                </th>
                <th className="px-2 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Full Day ¥
                </th>
                <th className="w-16 px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Custom
                </th>
                <th className="w-[104px] px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Custom Price ¥
                </th>
              </tr>
            </thead>
            <tbody>
              {activeRows.map((row, i) => {
                const invalid = row.custom && !row.customPrice.trim();
                return (
                  <tr
                    key={rowKey(row)}
                    className="border-b border-gray-100 last:border-b-0"
                  >
                    <td className="whitespace-nowrap px-2 py-[9px] text-gray-700">
                      {row.vehicleType}
                    </td>
                    <td className="whitespace-nowrap px-2 py-[9px] font-medium text-gray-900">
                      {row.vehicleName}
                    </td>
                    <td className="px-2 py-[9px] text-gray-600">
                      {row.owner}
                    </td>
                    <td className="px-2 py-[9px] text-right tabular-nums text-gray-600">
                      {row.halfDayPrice}
                    </td>
                    <td className="px-2 py-[9px] text-right tabular-nums text-gray-600">
                      {row.fullDayPrice}
                    </td>
                    <td className="px-2 py-[9px]">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={row.custom}
                        disabled={locked}
                        onClick={() => toggleCustom(i)}
                        className={`inline-flex h-[22px] items-center rounded-full text-[10px] font-extrabold tracking-wide disabled:cursor-default disabled:opacity-60 ${
                          row.custom
                            ? "justify-start bg-[#FACC15] pl-[9px] pr-1 text-[#121621]"
                            : "justify-end bg-gray-300 pl-1 pr-[9px] text-gray-600"
                        }`}
                      >
                        {row.custom ? (
                          <>
                            ON
                            <span className="ml-1 h-4 w-4 rounded-full bg-white" />
                          </>
                        ) : (
                          <>
                            <span className="mr-1 h-4 w-4 rounded-full bg-white" />
                            OFF
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-2 py-[9px]">
                      {!row.custom ? (
                        <span className="text-gray-300">—</span>
                      ) : (
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          readOnly={locked}
                          value={row.customPrice}
                          onChange={(e) => setCustomPrice(i, e.target.value)}
                          placeholder={invalid ? "Required" : undefined}
                          className={`w-full rounded-lg border px-2 py-1.5 text-[13px] font-semibold tabular-nums outline-none ${
                            invalid
                              ? "border-red-300 bg-red-50 text-red-700 placeholder:text-red-400"
                              : "border-gray-200 bg-white text-gray-900 focus:border-gray-400"
                          }`}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="flex items-center justify-between gap-3 border-t border-gray-200 bg-gray-50 px-3 py-[9px]">
            <p className="text-xs text-gray-500">
              {activeRows.length} available vehicles from Pricing CMS ·{" "}
              {overrideCount} custom override
              {overrideCount === 1 ? "" : "s"}
              {missingCount > 0 && ` · ${missingCount} missing a price`}
            </p>
            <p className="whitespace-nowrap text-xs font-semibold text-gray-900">
              {applicableLabel} ¥ applies to this template ({durationTier})
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
