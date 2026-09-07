import { SEED_TOURS } from "./mockData";
import { slugifyTripName } from "./tourUtils";

export interface BookingStopover {
  location: string;
  waitTime: string;
}

export interface BookingItinerary {
  slug: string;
  tripName: string;
  pickup: string;
  dropoff: string;
  stopovers: BookingStopover[];
  defaultTime: string;
  tripDistanceKm: number;
  drivingMins: number;
  waitingMins: number;
  totalMins: number;
}

/** Demo itinerary matching the Zen Go booking UI for #T0001A. */
const AUTUMN_FOLIAGE_DEMO: BookingItinerary = {
  slug: "autumn-foliage-deer-paths",
  tripName: "Autumn Foliage & Deer Paths",
  pickup: "THE OSAKA STATION HOTEL, Autograph Collection",
  dropoff: "THE OSAKA STATION HOTEL, Autograph Collection",
  stopovers: [
    { location: "Tōdai-ji", waitTime: "3h" },
    { location: "Mount Wakakusa", waitTime: "None" },
  ],
  defaultTime: "09:00",
  tripDistanceKm: 80.1,
  drivingMins: 118,
  waitingMins: 180,
  totalMins: 298,
};

function parseWaitMins(waitTime: string): number {
  if (!waitTime || waitTime.toLowerCase() === "none") return 0;
  const hourMatch = waitTime.match(/(\d+)\s*h/i);
  const minMatch = waitTime.match(/(\d+)\s*min/i);
  return (hourMatch ? parseInt(hourMatch[1], 10) * 60 : 0) +
    (minMatch ? parseInt(minMatch[1], 10) : 0);
}

function buildFromSeed(slug: string): BookingItinerary | null {
  const tour = SEED_TOURS.find((t) => slugifyTripName(t.tripName) === slug);
  if (!tour) return null;

  const waitingMins = tour.waypoints.stopovers.reduce(
    (sum, s) => sum + parseWaitMins(s.waitTime),
    0,
  );
  const totalMins = tour.tripDurationMins ?? 0;
  const drivingMins = Math.max(totalMins - waitingMins, 0);

  return {
    slug,
    tripName: tour.tripName,
    pickup: tour.waypoints.pickup,
    dropoff: tour.waypoints.dropoff,
    stopovers: tour.waypoints.stopovers.map((s) => ({
      location: s.location,
      waitTime: s.waitTime || "None",
    })),
    defaultTime: tour.waypoints.pickupTime,
    tripDistanceKm: tour.tripDistanceKm ?? 0,
    drivingMins,
    waitingMins,
    totalMins,
  };
}

export function getBookingItinerary(slug: string): BookingItinerary | null {
  if (slug === "autumn-foliage-deer-paths") return AUTUMN_FOLIAGE_DEMO;
  return buildFromSeed(slug);
}

export function formatDurationLabel(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}mins`;
  if (m === 0) return `${h}hrs`;
  return `${h}hrs ${m}mins`;
}
