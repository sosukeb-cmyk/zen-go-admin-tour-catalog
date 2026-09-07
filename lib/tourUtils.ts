import { SIGHTSEEING_PRICE_SEED } from "./pricingCmsMock";
import type { OfficeLocation, TourTemplate, TourWaypoints } from "./types";

export const DRAFT_TOUR_ID = "#T-----";

export function slugifyTripName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function tourIdToBookingSequence(id: string): string {
  const match = id.match(/#T(\d{4})A/);
  return match ? match[1] : "0001";
}

export function formatBookingDate(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function buildDefaultTourDetailsUrl(slug: string): string {
  return `https://www.zengoride.com/tours/${slug || "new-tour"}`;
}

export function buildDefaultTourBookingUrl(
  slug: string,
  tourId: string,
  date = new Date(),
): string {
  const seq = tourIdToBookingSequence(tourId);
  return `/tours/${slug || "new-tour"}/${seq}/${formatBookingDate(date)}`;
}

export function buildDefaultPreviewLinks(
  tripName: string,
  tourId: string,
  date = new Date(),
) {
  const slug = slugifyTripName(tripName);
  return {
    tourDetails: buildDefaultTourDetailsUrl(slug),
    tourBooking: buildDefaultTourBookingUrl(slug, tourId, date),
  };
}

export function formatPrice(price: number | null): string {
  if (price === null) return "—";
  return `¥${price.toLocaleString("ja-JP")}`;
}

export function formatDuration(mins: number | null): string {
  if (mins === null) return "—";
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function generateNextTourId(tours: TourTemplate[]): string {
  const numbers = tours
    .map((t) => {
      const match = t.id.match(/#T(\d{4})A/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => n > 0);

  const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  return `#T${String(next).padStart(4, "0")}A`;
}

export function createEmptyTour(): TourTemplate {
  return {
    id: DRAFT_TOUR_ID,
    reference: DRAFT_TOUR_ID,
    tripName: "",
    officeLocation: null,
    durationTier: null,
    status: "inactive",
    price: null,
    startTime: "09:00",
    viewedCount: 0,
    bookedCount: 0,
    userName: null,
    userEmail: null,
    userSource: null,
    paymentStatus: null,
    serviceType: null,
    passengers: null,
    luggage: null,
    waypoints: {
      pickup: "",
      pickupTime: "09:00",
      pickupMapLocation: null,
      stopovers: [],
      dropoff: "",
      dropoffMapLocation: null,
    },
    tripDistanceKm: null,
    tripDurationMins: null,
    previewLinks: buildDefaultPreviewLinks("", DRAFT_TOUR_ID),
    driverName: null,
    plateNumber: null,
    useDefaultPrice: true,
    vehiclePricing: null,
  };
}

/**
 * Prototype-only stand-in for a real routing/distance API: deterministic
 * "distance" per leg derived from the location names, so the same route
 * always estimates the same numbers. Requires pickup and drop-off to both
 * have a map location set; stopovers contribute a leg only if pinned too.
 */
export function estimateRouteMetrics(
  waypoints: TourWaypoints,
): { distanceKm: number; durationMins: number } | null {
  const pickup = waypoints.pickupMapLocation;
  const dropoff = waypoints.dropoffMapLocation;
  if (!pickup || !dropoff) return null;

  const points = [
    pickup,
    ...waypoints.stopovers
      .map((s) => s.mapLocation)
      .filter((loc): loc is NonNullable<typeof loc> => !!loc),
    dropoff,
  ];

  const hash = (str: string) => {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 10007;
    return h;
  };

  let distanceKm = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const seed = hash(`${points[i].title}::${points[i + 1].title}`);
    distanceKm += 8 + (seed % 40); // 8–47 km per leg
  }
  distanceKm = Math.round(distanceKm * 10) / 10;

  const stopoverCount = points.length - 2;
  const durationMins = Math.round(distanceKm * 1.6 + stopoverCount * 5);

  return { distanceKm, durationMins };
}

/** Rough suggested starting price from the Sightseeing Pricing CMS, used to
 * seed a new template's price once office + duration are both chosen. */
export function suggestedPriceForOffice(
  office: OfficeLocation,
  isHalfDay: boolean,
): number {
  const rows = SIGHTSEEING_PRICE_SEED.filter(
    (r) => r.office === office && r.available,
  );
  if (rows.length === 0) return 0;
  const values = rows.map((r) => (isHalfDay ? r.halfDayPrice : r.fullDayPrice));
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.round(avg / 1000) * 1000;
}
