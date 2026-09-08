"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CalendarClock,
  Check,
  ChevronDown,
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

function SortIcon({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  if (!active) {
    return <ArrowUpDown className="h-3 w-3 text-gray-300" />;
  }
  return dir === "asc" ? (
    <ArrowUp className="h-3 w-3 text-gray-900" />
  ) : (
    <ArrowDown className="h-3 w-3 text-gray-900" />
  );
}

type ColumnKey =
  | "id"
  | "serviceType"
  | "office"
  | "duration"
  | "start"
  | "views"
  | "books"
  | "price"
  | "status"
  | "preview";

const OPTIONAL_COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: "id", label: "ID" },
  { key: "serviceType", label: "Service Type" },
  { key: "office", label: "Office" },
  { key: "duration", label: "Duration" },
  { key: "start", label: "Start" },
  { key: "views", label: "Clicks" },
  { key: "books", label: "Booked" },
  { key: "price", label: "Price" },
  { key: "status", label: "Status" },
  { key: "preview", label: "Preview" },
];

const DEFAULT_VISIBLE_COLUMNS: Record<ColumnKey, boolean> = {
  id: true,
  serviceType: true,
  office: true,
  duration: true,
  start: true,
  views: true,
  books: true,
  price: true,
  status: true,
  preview: true,
};

/** Every column except Preview (and the always-fixed trash/column-picker
 * utility columns) can be resized and dragged into a new position. Name
 * joins this set even though it isn't part of ColumnKey/visibleColumns,
 * since it's never hideable — only reorderable/resizable like the rest. */
type SortableKey = Exclude<ColumnKey, "preview"> | "name";
type SortDirection = "asc" | "desc";

/** Every sortable column's comparable value and its first-click direction —
 * text columns start A→Z, numeric-ish ones start highest→lowest. Rows
 * with no value for the column (e.g. Airport's null Duration/Start) always
 * sort to the bottom, regardless of direction. */
const SORT_CONFIG: Record<
  SortableKey,
  {
    type: "string" | "number";
    getValue: (t: TourTemplate) => string | number | null;
    defaultDir: SortDirection;
  }
> = {
  name: { type: "string", getValue: (t) => t.tripName || null, defaultDir: "asc" },
  id: { type: "string", getValue: (t) => t.id, defaultDir: "asc" },
  serviceType: { type: "string", getValue: (t) => t.serviceType, defaultDir: "asc" },
  office: { type: "string", getValue: (t) => t.officeLocation, defaultDir: "asc" },
  duration: { type: "string", getValue: (t) => t.durationTier, defaultDir: "asc" },
  start: {
    type: "string",
    getValue: (t) => (t.serviceType === "Airport" ? null : t.startTime),
    defaultDir: "asc",
  },
  views: { type: "number", getValue: (t) => t.viewedCount, defaultDir: "desc" },
  books: { type: "number", getValue: (t) => t.bookedCount, defaultDir: "desc" },
  price: { type: "number", getValue: (t) => t.price, defaultDir: "desc" },
  status: {
    type: "number",
    getValue: (t) => (t.status === "active" ? 1 : 0),
    defaultDir: "desc",
  },
};

const COLUMN_LABELS: Record<SortableKey, string> = {
  name: "Name",
  id: "ID",
  serviceType: "Service Type",
  office: "Office",
  duration: "Duration",
  start: "Start",
  views: "Clicks",
  books: "Booked",
  price: "Price",
  status: "Status",
};

const DEFAULT_COLUMN_ORDER: SortableKey[] = [
  "name",
  "id",
  "serviceType",
  "office",
  "duration",
  "start",
  "views",
  "books",
  "price",
  "status",
];

const DEFAULT_COLUMN_WIDTHS: Record<SortableKey, number> = {
  name: 240,
  id: 100,
  serviceType: 150,
  office: 100,
  duration: 130,
  start: 80,
  views: 80,
  books: 80,
  price: 110,
  status: 90,
};

const MIN_COLUMN_WIDTH = 60;
const PREVIEW_COLUMN_WIDTH = 96;
const UTILITY_COLUMN_WIDTH = 32;

/** Persists only for the browser session (cleared on browser/tab close) —
 * the closest stand-in this prototype has for "until the user logs out",
 * since there's no real auth. Deliberately untouched by the Refresh
 * button, which only resets search/filter/sort, not layout. */
const COLUMN_LAYOUT_STORAGE_KEY = "catalog:columnLayout:v1";

interface StoredColumnLayout {
  order: SortableKey[];
  widths: Partial<Record<SortableKey, number>>;
}

function loadStoredLayout(): StoredColumnLayout | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(COLUMN_LAYOUT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as StoredColumnLayout;
  } catch {
    return null;
  }
}

function sanitizeOrder(stored: unknown): SortableKey[] {
  if (!Array.isArray(stored)) return [...DEFAULT_COLUMN_ORDER];
  const known = stored.filter((k): k is SortableKey =>
    DEFAULT_COLUMN_ORDER.includes(k as SortableKey),
  );
  const missing = DEFAULT_COLUMN_ORDER.filter((k) => !known.includes(k));
  return [...known, ...missing];
}

function sanitizeWidths(
  stored: unknown,
): Record<SortableKey, number> {
  const result = { ...DEFAULT_COLUMN_WIDTHS };
  if (stored && typeof stored === "object") {
    for (const key of DEFAULT_COLUMN_ORDER) {
      const value = (stored as Record<string, unknown>)[key];
      if (typeof value === "number" && value >= MIN_COLUMN_WIDTH) {
        result[key] = value;
      }
    }
  }
  return result;
}

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
  const [officeFilter, setOfficeFilter] = useState<OfficeLocation[]>([]);
  const [officeMenuOpen, setOfficeMenuOpen] = useState(false);
  const officeMenuRef = useRef<HTMLDivElement>(null);
  const [statusFilter, setStatusFilter] = useState<TourStatus | "all">("all");
  const [visibleColumns, setVisibleColumns] =
    useState<Record<ColumnKey, boolean>>(DEFAULT_VISIBLE_COLUMNS);
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);
  const columnMenuRef = useRef<HTMLDivElement>(null);
  const [sortKey, setSortKey] = useState<SortableKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>("asc");

  /** Start with the plain defaults (matching what the server renders) and
   * only pull in the session's saved layout from an effect below — reading
   * sessionStorage directly in the initial state would make the client's
   * first render diverge from the server's and trigger a hydration error. */
  const [columnOrder, setColumnOrder] = useState<SortableKey[]>(DEFAULT_COLUMN_ORDER);
  const [columnWidths, setColumnWidths] =
    useState<Record<SortableKey, number>>(DEFAULT_COLUMN_WIDTHS);
  const [draggedKey, setDraggedKey] = useState<SortableKey | null>(null);
  const [dragOverKey, setDragOverKey] = useState<SortableKey | null>(null);
  const resizingRef = useRef<{
    key: SortableKey;
    startX: number;
    startWidth: number;
  } | null>(null);
  /** Real state (not a ref) so the gate is tied to a specific render's
   * closure — React 18 dev-mode double-invokes effects on the same
   * initial render, and a mutable ref would let the second invocation
   * see itself already flipped, letting the save effect below write the
   * pre-load defaults over a real stored layout before it ever loads. */
  const [layoutLoaded, setLayoutLoaded] = useState(false);

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

  useEffect(() => {
    if (!officeMenuOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (!officeMenuRef.current?.contains(e.target as Node)) {
        setOfficeMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [officeMenuOpen]);

  /** Client-only: pull in this session's saved layout once, after the
   * hydration-safe default render above has already committed. */
  useEffect(() => {
    const stored = loadStoredLayout();
    if (stored) {
      setColumnOrder(sanitizeOrder(stored.order));
      setColumnWidths(sanitizeWidths(stored.widths));
    }
    setLayoutLoaded(true);
  }, []);

  /** Column order/width changes are session-scoped, not tied to any
   * particular tour data — persisted independent of Refresh/filters. Held
   * off until the load effect above has had its turn, so it can't clobber
   * a just-restored layout with the defaults from the very first render. */
  useEffect(() => {
    if (!layoutLoaded) return;
    try {
      window.sessionStorage.setItem(
        COLUMN_LAYOUT_STORAGE_KEY,
        JSON.stringify({ order: columnOrder, widths: columnWidths }),
      );
    } catch {
      // sessionStorage unavailable (private browsing, etc.) — layout just
      // won't persist across a remount, which is a harmless degradation.
    }
  }, [columnOrder, columnWidths, layoutLoaded]);

  const handleResizeMove = useCallback((e: MouseEvent) => {
    const resizing = resizingRef.current;
    if (!resizing) return;
    const next = Math.max(
      MIN_COLUMN_WIDTH,
      resizing.startWidth + (e.clientX - resizing.startX),
    );
    setColumnWidths((prev) => ({ ...prev, [resizing.key]: next }));
  }, []);

  const startResize = (e: React.MouseEvent, key: SortableKey) => {
    e.preventDefault();
    e.stopPropagation();
    resizingRef.current = { key, startX: e.clientX, startWidth: columnWidths[key] };
    const onUp = () => {
      resizingRef.current = null;
      window.removeEventListener("mousemove", handleResizeMove);
    };
    window.addEventListener("mousemove", handleResizeMove);
    window.addEventListener("mouseup", onUp, { once: true });
  };

  const reorderColumns = (sourceKey: SortableKey, targetKey: SortableKey) => {
    if (sourceKey === targetKey) return;
    setColumnOrder((prev) => {
      const next = [...prev];
      const from = next.indexOf(sourceKey);
      const to = next.indexOf(targetKey);
      if (from === -1 || to === -1) return prev;
      next.splice(from, 1);
      next.splice(to, 0, sourceKey);
      return next;
    });
  };

  /** Column reordering is driven by plain mouse events rather than native
   * HTML5 drag-and-drop — the native API isn't reliably triggerable via
   * automated/synthetic input and has its own UX quirks (browser-drawn
   * ghost image, inconsistent feel); a manual drag matches the resize
   * handle's approach above and behaves the same for a real click (no
   * movement) so the sort button underneath still works normally. */
  const startHeaderDrag = (e: React.MouseEvent, key: SortableKey) => {
    const startX = e.clientX;
    let dragging = false;
    let currentOverKey: SortableKey | null = null;

    const onMove = (moveEvent: MouseEvent) => {
      if (!dragging) {
        if (Math.abs(moveEvent.clientX - startX) < 5) return;
        dragging = true;
        setDraggedKey(key);
      }
      const el = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
      const th = el?.closest("[data-col-key]");
      const overKey = th?.getAttribute("data-col-key") as SortableKey | null;
      currentOverKey = overKey && overKey !== key ? overKey : null;
      setDragOverKey(currentOverKey);
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      if (dragging && currentOverKey) {
        reorderColumns(key, currentOverKey);
      }
      setDraggedKey(null);
      setDragOverKey(null);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp, { once: true });
  };

  const toggleColumn = (key: ColumnKey) =>
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggleOfficeFilter = (o: OfficeLocation) =>
    setOfficeFilter((prev) =>
      prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o],
    );

  const officeFilterLabel =
    officeFilter.length === 0
      ? "All offices"
      : officeFilter.length === 1
        ? officeFilter[0]
        : `${officeFilter.length} offices`;

  const handleSort = (key: SortableKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(SORT_CONFIG[key].defaultDir);
    }
  };

  /** Refresh clears every filter/sort back to its default (search, office,
   * status, sort) so the table shows everything, unsorted — but leaves the
   * Show/Hide column selection and the column order/widths alone, since
   * those are display preferences, not filters. */
  const handleRefreshClick = () => {
    setSearch("");
    setOfficeFilter([]);
    setStatusFilter("all");
    setSortKey(null);
    setSortDir("asc");
    onRefresh();
  };

  const filtered = useMemo(() => {
    return tours.filter((t) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        t.id.toLowerCase().includes(q) ||
        t.tripName.toLowerCase().includes(q) ||
        (t.officeLocation?.toLowerCase().includes(q) ?? false);
      const matchesOffice =
        officeFilter.length === 0 ||
        (t.officeLocation !== null && officeFilter.includes(t.officeLocation));
      const matchesStatus =
        statusFilter === "all" || t.status === statusFilter;
      return matchesSearch && matchesOffice && matchesStatus;
    });
  }, [tours, search, officeFilter, statusFilter]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const config = SORT_CONFIG[sortKey];
    return [...filtered].sort((a, b) => {
      const va = config.getValue(a);
      const vb = config.getValue(b);
      const aEmpty = config.type === "number" ? va == null : !va;
      const bEmpty = config.type === "number" ? vb == null : !vb;
      if (aEmpty && bEmpty) return 0;
      if (aEmpty) return 1;
      if (bEmpty) return -1;
      const cmp =
        config.type === "number"
          ? (va as number) - (vb as number)
          : String(va).localeCompare(String(vb), undefined, {
              numeric: true,
              sensitivity: "base",
            });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const activeCount = tours.filter((t) => t.status === "active").length;

  const visibleOrderedColumns = columnOrder.filter(
    (key) => key === "name" || visibleColumns[key as ColumnKey],
  );
  const rightAlignedKeys = new Set<SortableKey>(["views", "books", "price"]);

  const visibleCount =
    visibleOrderedColumns.length + (visibleColumns.preview ? 1 : 0) + 2;

  /** table-layout:fixed only honors <col> widths once the table itself has
   * a definite (non-auto) width — otherwise browsers silently fall back to
   * content-based sizing and every drag-resize is a no-op. */
  const totalTableWidth =
    visibleOrderedColumns.reduce((sum, key) => sum + columnWidths[key], 0) +
    (visibleColumns.preview ? PREVIEW_COLUMN_WIDTH : 0) +
    UTILITY_COLUMN_WIDTH * 2;

  function renderCell(tour: TourTemplate, key: SortableKey, active: boolean) {
    switch (key) {
      case "name":
        return (
          <span className="text-[15px] font-semibold tracking-tight text-gray-900">
            {tour.tripName || "Untitled template"}
          </span>
        );
      case "id":
        return (
          <span className="font-mono text-xs font-medium text-gray-400">
            {tour.id}
          </span>
        );
      case "serviceType":
        return (
          <span
            className={`inline-flex whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-semibold ${serviceTypeBadgeClasses(tour.serviceType)}`}
          >
            {tour.serviceType ?? "—"}
          </span>
        );
      case "office":
        return tour.officeLocation;
      case "duration":
        return tour.durationTier ? (
          <span className="inline-flex whitespace-nowrap rounded-md border border-gray-200 bg-gray-50/80 px-2 py-0.5 text-xs font-medium text-gray-600">
            {tour.durationTier}
          </span>
        ) : (
          <span className="text-gray-300">—</span>
        );
      case "start":
        return tour.serviceType === "Airport" ? (
          <span className="text-gray-300">—</span>
        ) : (
          <span className="tabular-nums">{tour.startTime}</span>
        );
      case "views":
        return <span className="tabular-nums">{tour.viewedCount}</span>;
      case "books":
        return <span className="tabular-nums">{tour.bookedCount}</span>;
      case "price":
        return (
          <span className="font-semibold tabular-nums text-gray-900">
            {formatPrice(tour.price)}
          </span>
        );
      case "status":
        return (
          <button
            type="button"
            role="switch"
            aria-checked={active}
            aria-label={active ? "Active" : "Inactive"}
            onClick={(e) => {
              e.stopPropagation();
              onToggleStatus(tour.id);
            }}
            className={`relative inline-flex h-[14px] w-[26px] shrink-0 cursor-pointer rounded-full transition-colors ${
              active ? "bg-emerald-500" : "bg-gray-300"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-3 w-3 translate-y-[1px] rounded-full bg-white shadow transition-transform ${
                active ? "translate-x-[13px]" : "translate-x-[1px]"
              }`}
            />
          </button>
        );
      default:
        return null;
    }
  }

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
            onClick={handleRefreshClick}
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
        <div ref={officeMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setOfficeMenuOpen((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              officeFilter.length > 0
                ? "bg-[#121621] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {officeFilterLabel}
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          {officeMenuOpen && (
            <div className="absolute left-0 top-full z-20 mt-1.5 w-44 rounded-lg border border-gray-200 bg-white p-1.5 shadow-lg">
              <button
                type="button"
                onClick={() => setOfficeFilter([])}
                className="mb-1 flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                All offices
                {officeFilter.length === 0 && (
                  <Check className="h-3.5 w-3.5 text-gray-900" />
                )}
              </button>
              <div className="my-1 h-px bg-gray-100" />
              {OFFICE_LOCATIONS.map((o) => (
                <label
                  key={o}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-normal text-gray-700 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={officeFilter.includes(o)}
                    onChange={() => toggleOfficeFilter(o)}
                    className="rounded border-gray-300"
                  />
                  {o}
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="h-6 w-px bg-gray-200" />
        <div className="relative inline-flex items-center rounded-full bg-gray-100 p-1 text-xs font-semibold">
          <span
            className="absolute inset-y-1 w-[58px] rounded-full bg-[#121621] shadow-sm transition-transform duration-200 ease-out"
            style={{
              transform: `translateX(${
                statusFilter === "all" ? 0 : statusFilter === "active" ? 58 : 116
              }px)`,
            }}
          />
          {(["all", "active", "inactive"] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`relative z-10 w-[58px] rounded-full py-1.5 text-center transition-colors ${
                statusFilter === st
                  ? "text-white"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {st === "all" ? "All" : st === "active" ? "Active" : "Inactive"}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table
          className="table-fixed border-collapse text-left text-sm"
          style={{ width: totalTableWidth, minWidth: "100%" }}
        >
          <colgroup>
            {visibleOrderedColumns.map((key) => (
              <col key={key} style={{ width: columnWidths[key] }} />
            ))}
            {visibleColumns.preview && (
              <col style={{ width: PREVIEW_COLUMN_WIDTH }} />
            )}
            <col style={{ width: UTILITY_COLUMN_WIDTH }} />
            <col style={{ width: UTILITY_COLUMN_WIDTH }} />
          </colgroup>
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/80">
              {visibleOrderedColumns.map((key) => {
                const rightAlign = rightAlignedKeys.has(key);
                return (
                  <th
                    key={key}
                    data-col-key={key}
                    onMouseDown={(e) => startHeaderDrag(e, key)}
                    aria-sort={
                      sortKey === key
                        ? sortDir === "asc"
                          ? "ascending"
                          : "descending"
                        : undefined
                    }
                    className={`relative cursor-grab select-none px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500 active:cursor-grabbing ${
                      rightAlign ? "text-right" : "text-left"
                    } ${draggedKey === key ? "opacity-40" : ""} ${
                      dragOverKey === key
                        ? "bg-blue-50 outline outline-2 -outline-offset-2 outline-blue-300"
                        : ""
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSort(key)}
                      className={`inline-flex items-center gap-1 transition hover:text-gray-900 ${
                        rightAlign ? "flex-row-reverse" : ""
                      }`}
                    >
                      {COLUMN_LABELS[key]}
                      <SortIcon active={sortKey === key} dir={sortDir} />
                    </button>
                    <div
                      onMouseDown={(e) => startResize(e, key)}
                      draggable={false}
                      title="Drag to resize"
                      className="group absolute right-0 top-0 z-10 h-full w-2 cursor-col-resize"
                    >
                      <div className="mx-auto h-full w-px bg-gray-200 transition-colors group-hover:w-[3px] group-hover:bg-gray-400" />
                    </div>
                  </th>
                );
              })}
              {visibleColumns.preview && (
                <th className="sticky right-16 z-20 border-l border-gray-100 bg-gray-50 px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Preview
                </th>
              )}
              <th
                className="sticky right-8 z-20 w-8 bg-gray-50 px-1 py-2.5"
                aria-hidden="true"
              />
              <th className="sticky right-0 z-20 w-8 bg-gray-50 px-1 py-2.5">
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
            {sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleCount}
                  className="px-4 py-14 text-center text-gray-400"
                >
                  No tours match your filters.
                </td>
              </tr>
            ) : (
              sorted.map((tour) => {
                const active = tour.status === "active";
                return (
                  <tr
                    key={tour.id}
                    onClick={() => onEdit(tour.id)}
                    className="group cursor-pointer border-b border-gray-50 transition hover:bg-gray-50/80"
                  >
                    {visibleOrderedColumns.map((key) => (
                      <td
                        key={key}
                        className={`px-4 py-3.5 text-gray-600 ${
                          rightAlignedKeys.has(key) ? "text-right" : ""
                        }`}
                      >
                        {renderCell(tour, key, active)}
                      </td>
                    ))}
                    {visibleColumns.preview && (
                      <td className="sticky right-16 z-10 border-l border-gray-100 bg-white px-4 py-3.5 group-hover:bg-gray-50">
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
                    <td className="sticky right-8 z-10 w-8 bg-white px-2 py-3.5 group-hover:bg-gray-50">
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
                    <td className="sticky right-0 z-10 w-8 bg-white group-hover:bg-gray-50" />
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
