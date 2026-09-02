export type OfficeLocation = "Tokyo" | "Osaka" | "Nagoya" | "Sapporo";

export type DurationTier =
  | "Half Day 5hrs"
  | "Full Day 10hrs"
  | "Over 10hrs use 10+hrs";

export type TourStatus = "active" | "inactive";

export interface MapLocationRef {
  title: string;
  address: string;
}

export interface WaypointStopover {
  location: string;
  waitTime: string;
  mapLocation?: MapLocationRef | null;
}

export interface TourWaypoints {
  pickup: string;
  pickupTime: string;
  pickupMapLocation?: MapLocationRef | null;
  stopovers: WaypointStopover[];
  dropoff: string;
  dropoffMapLocation?: MapLocationRef | null;
}

export interface PreviewLinks {
  tourDetails: string;
  tourBooking: string;
}

/** Core order fields shared with the orders pipeline. */
export interface OrderDetail {
  reference: string;
  tripName: string;
  officeLocation: OfficeLocation;
  durationTier: DurationTier;
  status: TourStatus;
  price: number;
  startTime: string;
  userName: string | null;
  userEmail: string | null;
  userSource: string | null;
  paymentStatus: string | null;
  serviceType: "Sightseeing Charter";
  passengers: number | null;
  luggage: number | null;
  waypoints: TourWaypoints;
  tripDistanceKm: number;
  tripDurationMins: number;
  previewLinks: PreviewLinks;
  driverName: string | null;
  plateNumber: string | null;
  useDefaultPrice: boolean;
}

/** Catalog template extending OrderDetail with catalog-specific metrics. */
export interface TourTemplate extends OrderDetail {
  id: string;
  viewedCount: number;
  bookedCount: number;
}

export type NavView =
  | "orders"
  | "pricing-cms"
  | "dispatch-board"
  | "tour-catalog";

export const OFFICE_LOCATIONS: OfficeLocation[] = [
  "Tokyo",
  "Osaka",
  "Nagoya",
  "Sapporo",
];

export const DURATION_TIERS: DurationTier[] = [
  "Half Day 5hrs",
  "Full Day 10hrs",
  "Over 10hrs use 10+hrs",
];
