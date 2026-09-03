import type { TourTemplate } from "./types";

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

export function formatPrice(price: number): string {
  return `¥${price.toLocaleString("ja-JP")}`;
}

export function formatDuration(mins: number): string {
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

export function createEmptyTour(id: string): TourTemplate {
  return {
    id,
    reference: id,
    tripName: "",
    officeLocation: "Osaka",
    durationTier: "Half Day 5hrs",
    status: "active",
    price: 50000,
    startTime: "09:00",
    viewedCount: 0,
    bookedCount: 0,
    userName: null,
    userEmail: null,
    userSource: null,
    paymentStatus: null,
    serviceType: "Sightseeing Charter",
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
    tripDistanceKm: 0,
    tripDurationMins: 300,
    previewLinks: buildDefaultPreviewLinks("", id),
    driverName: null,
    plateNumber: null,
    useDefaultPrice: true,
    vehiclePricing: null,
  };
}
