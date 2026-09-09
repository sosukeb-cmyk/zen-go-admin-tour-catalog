import { AIRPORT_MAP_LOCATIONS, type MapLocation } from "./mapLocationMock";
import {
  AIRPORT_CODES,
  OFFICE_AIRPORTS,
  SIGHTSEEING_PRICE_SEED,
} from "./pricingCmsMock";
import type {
  OfficeLocation,
  ServiceType,
  TourTemplate,
  TourWaypoints,
} from "./types";

/** SKUs are generated at save time, keyed to the service type — the
 * scheme (and even whether "#" is part of it) differs per type. Until
 * then the draft just shows a placeholder for whichever type is picked. */
export const DRAFT_ID_PLACEHOLDER = "-----";
export const DRAFT_ID_SIGHTSEEING = "#T-----";
export const DRAFT_ID_AIRPORT = "#A-----";

export function draftIdForServiceType(type: ServiceType | null): string {
  if (type === "Sightseeing Charter") return DRAFT_ID_SIGHTSEEING;
  if (type === "Airport") return DRAFT_ID_AIRPORT;
  return DRAFT_ID_PLACEHOLDER;
}

export function serviceTypeBadgeClasses(type: ServiceType | null): string {
  if (type === "Airport") return "bg-blue-50 text-blue-700";
  if (type === "Sightseeing Charter") return "bg-emerald-50 text-emerald-700";
  return "bg-gray-100 text-gray-500";
}

/** Display-only label with the IATA code, e.g. "Narita Airport (NRT)" — the
 * airport name itself (used as the data key everywhere else) is unchanged. */
export function airportDisplayName(airport: string): string {
  const code = AIRPORT_CODES[airport];
  return code ? `${airport} (${code})` : airport;
}

/** For an Airport-service template: which airport(s) serve this office, and
 * — when there's only one candidate — the pickup spot that resolves to
 * automatically. Offices with more than one airport (Tokyo, Osaka) return
 * a null airport/empty pickup so the admin has to pick one explicitly. */
export function resolveAirportPickup(office: OfficeLocation | null): {
  airport: string | null;
  pickup: string;
  pickupMapLocation: MapLocation | null;
} {
  if (!office) return { airport: null, pickup: "", pickupMapLocation: null };
  const airports = OFFICE_AIRPORTS[office] ?? [];
  if (airports.length === 1) {
    const airport = airports[0];
    return {
      airport,
      pickup: airportDisplayName(airport),
      pickupMapLocation: AIRPORT_MAP_LOCATIONS[airport] ?? null,
    };
  }
  return { airport: null, pickup: "", pickupMapLocation: null };
}

export function slugifyTripName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function tourIdToBookingSequence(id: string): string {
  const sightseeing = id.match(/#T(\d{4})A/);
  if (sightseeing) return sightseeing[1];
  const airport = id.match(/^#A(\d{4})/);
  if (airport) return airport[1];
  return "0001";
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

/** Demo-only: an ngrok tunnel onto this app's own booking-page mockup, so
 * the "Booking" preview link is a real, shareable URL instead of a path
 * that only resolves from inside the app itself. Not for production use —
 * ngrok free-tier URLs are ephemeral and will need updating when it changes. */
const DEMO_BOOKING_ORIGIN = "https://exert-hula-resilient.ngrok-free.dev";

export function buildDefaultTourBookingUrl(
  slug: string,
  tourId: string,
  date = new Date(),
): string {
  const seq = tourIdToBookingSequence(tourId);
  return `${DEMO_BOOKING_ORIGIN}/tours/${slug || "new-tour"}/${seq}/${formatBookingDate(date)}`;
}

/** Airport bookings use their own URL shape — /airport/{IATA code}/{seq}/
 * {date} — instead of the Sightseeing /tours/{slug}/{seq}/{date} pattern. */
export function buildAirportBookingUrl(
  airportCode: string,
  sequence: string,
  date = new Date(),
): string {
  return `${DEMO_BOOKING_ORIGIN}/airport/${airportCode}/${sequence}/${formatBookingDate(date)}`;
}

/** The 4-digit sequence in an Airport booking URL is scoped per airport
 * code, not global — each airport (NRT, HND, KIX, ITM, NGO, CTS) ticks up
 * its own counter independently, starting at "0001". */
export function nextAirportBookingSequence(
  tours: TourTemplate[],
  airportCode: string,
): string {
  const pattern = new RegExp(`/airport/${airportCode}/(\\d{4})/`);
  const numbers = tours
    .map((t) => {
      const match = t.previewLinks.tourBooking.match(pattern);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => n > 0);
  const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  return String(next).padStart(4, "0");
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

export function generateNextSightseeingId(tours: TourTemplate[]): string {
  const numbers = tours
    .map((t) => {
      const match = t.id.match(/#T(\d{4})A/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => n > 0);

  const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  return `#T${String(next).padStart(4, "0")}A`;
}

/** Airport SKUs: # + A + 4-digit sequence (its own, independent of the
 * Sightseeing sequence) + the office's first letter, e.g. "#A0002T" for
 * the 2nd airport template ever created, saved with a Tokyo office. */
export function generateNextAirportId(
  tours: TourTemplate[],
  office: OfficeLocation,
): string {
  const numbers = tours
    .map((t) => {
      const match = t.id.match(/^#A(\d{4})/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => n > 0);

  const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  return `#A${String(next).padStart(4, "0")}${office[0].toUpperCase()}`;
}

export function createEmptyTour(): TourTemplate {
  return {
    id: DRAFT_ID_PLACEHOLDER,
    reference: DRAFT_ID_PLACEHOLDER,
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
    airport: null,
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
    routeDistanceKm: null,
    routeDurationMins: null,
    tripDistanceKm: null,
    tripDurationMins: null,
    previewLinks: buildDefaultPreviewLinks("", DRAFT_ID_PLACEHOLDER),
    driverName: null,
    plateNumber: null,
    useDefaultPrice: true,
    vehiclePricing: null,
    airportVehiclePricing: null,
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
