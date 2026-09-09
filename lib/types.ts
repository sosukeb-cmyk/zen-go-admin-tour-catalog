export type OfficeLocation = "Tokyo" | "Osaka" | "Nagoya" | "Sapporo";

export type DurationTier = "Half Day 5hrs" | "Full Day 10hrs";

export type TourStatus = "active" | "inactive";

export interface TourVehiclePriceRow {
  vehicleType: string;
  vehicleName: string;
  owner: string;
  halfDayPrice: number;
  fullDayPrice: number;
  custom: boolean;
  customPrice: string;
}

export interface TourVehiclePricing {
  office: OfficeLocation;
  rows: TourVehiclePriceRow[];
}

export interface AirportVehiclePriceRow {
  vehicleType: string;
  vehicleName: string;
  owner: string;
  fixedFee: number;
  distanceCapKm: number;
  excessRatePerKm: number;
  custom: boolean;
  customPrice: string;
}

export interface AirportVehiclePricing {
  office: OfficeLocation;
  airport: string;
  rows: AirportVehiclePriceRow[];
}

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

export type ServiceType = "Sightseeing Charter" | "Airport";

/** Core order fields shared with the orders pipeline. */
export interface OrderDetail {
  reference: string;
  tripName: string;
  officeLocation: OfficeLocation | null;
  durationTier: DurationTier | null;
  status: TourStatus;
  price: number | null;
  startTime: string;
  userName: string | null;
  userEmail: string | null;
  userSource: string | null;
  paymentStatus: string | null;
  serviceType: ServiceType | null;
  /** The specific airport this template picks up from — only meaningful
   * when serviceType is "Airport". */
  airport: string | null;
  passengers: number | null;
  luggage: number | null;
  waypoints: TourWaypoints;
  /** Auto-calculated from the route's pick-up/drop-off/stopover map pins
   * whenever the route is (re)applied — see estimateRouteMetrics. */
  routeDistanceKm: number | null;
  routeDurationMins: number | null;
  /** Admin-set preset — independent of routeDistanceKm/routeDurationMins,
   * never written by the route calculation. */
  tripDistanceKm: number | null;
  tripDurationMins: number | null;
  previewLinks: PreviewLinks;
  driverName: string | null;
  plateNumber: string | null;
  useDefaultPrice: boolean;
  vehiclePricing: TourVehiclePricing | null;
  airportVehiclePricing: AirportVehiclePricing | null;
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

export const DURATION_TIERS: DurationTier[] = ["Half Day 5hrs", "Full Day 10hrs"];

export const SERVICE_TYPES: ServiceType[] = ["Sightseeing Charter", "Airport"];
