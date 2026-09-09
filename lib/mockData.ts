import { AIRPORT_MAP_LOCATIONS } from "./mapLocationMock";
import { AIRPORT_CODES } from "./pricingCmsMock";
import { airportDisplayName, buildAirportBookingUrl } from "./tourUtils";
import type { OfficeLocation, TourTemplate } from "./types";

const SIGHTSEEING_SEED_TOURS: TourTemplate[] = [
  {
    id: "#T0001A",
    reference: "#T0001A",
    tripName: "Autumn Foliage & Deer Paths",
    officeLocation: "Osaka",
    durationTier: "Half Day 5hrs",
    status: "active",
    price: 60000,
    startTime: "09:00",
    viewedCount: 27,
    bookedCount: 3,
    userName: null,
    userEmail: null,
    userSource: null,
    paymentStatus: null,
    serviceType: "Sightseeing Charter",
    airport: null,
    passengers: null,
    luggage: null,
    waypoints: {
      pickup: "Osaka Station",
      pickupTime: "09:00",
      stopovers: [
        { location: "Nara Park", waitTime: "90 min" },
        { location: "Todai-ji Temple", waitTime: "60 min" },
      ],
      dropoff: "Osaka Station",
    },
    routeDistanceKm: 80.2,
    routeDurationMins: 330,
    tripDistanceKm: null,
    tripDurationMins: null,
    previewLinks: {
      tourDetails:
        "https://www.zengoride.com/tours/autumn-foliage-deer-paths",
      tourBooking: "https://exert-hula-resilient.ngrok-free.dev/tours/autumn-foliage-deer-paths/00001/2026-09-02",
    },
    driverName: null,
    plateNumber: null,
    useDefaultPrice: true,
    vehiclePricing: null,
    airportVehiclePricing: null,
  },
  {
    id: "#T0002A",
    reference: "#T0002A",
    tripName: "Buddha by the Beach",
    officeLocation: "Tokyo",
    durationTier: "Half Day 5hrs",
    status: "active",
    price: 50000,
    startTime: "09:00",
    viewedCount: 41,
    bookedCount: 7,
    userName: null,
    userEmail: null,
    userSource: null,
    paymentStatus: null,
    serviceType: "Sightseeing Charter",
    airport: null,
    passengers: null,
    luggage: null,
    waypoints: {
      pickup: "Kamakura Station",
      pickupTime: "09:00",
      stopovers: [
        { location: "Great Buddha (Daibutsu)", waitTime: "45 min" },
        { location: "Yuigahama Beach", waitTime: "30 min" },
      ],
      dropoff: "Kamakura Station",
    },
    routeDistanceKm: 45.0,
    routeDurationMins: 300,
    tripDistanceKm: null,
    tripDurationMins: null,
    previewLinks: {
      tourDetails: "https://www.zengoride.com/tours/buddha-by-the-beach",
      tourBooking: "https://exert-hula-resilient.ngrok-free.dev/tours/buddha-by-the-beach/00002/2026-09-02",
    },
    driverName: null,
    plateNumber: null,
    useDefaultPrice: true,
    vehiclePricing: null,
    airportVehiclePricing: null,
  },
  {
    id: "#T0003A",
    reference: "#T0003A",
    tripName: "Flavors of Edo",
    officeLocation: "Tokyo",
    durationTier: "Full Day 10hrs",
    status: "inactive",
    price: 80000,
    startTime: "10:00",
    viewedCount: 12,
    bookedCount: 1,
    userName: null,
    userEmail: null,
    userSource: null,
    paymentStatus: null,
    serviceType: "Sightseeing Charter",
    airport: null,
    passengers: null,
    luggage: null,
    waypoints: {
      pickup: "Tokyo Station",
      pickupTime: "10:00",
      stopovers: [
        { location: "Tsukiji Outer Market", waitTime: "60 min" },
        { location: "Asakusa Senso-ji", waitTime: "45 min" },
      ],
      dropoff: "Shibuya Crossing",
    },
    routeDistanceKm: 30.5,
    routeDurationMins: 600,
    tripDistanceKm: null,
    tripDurationMins: null,
    previewLinks: {
      tourDetails: "https://www.zengoride.com/tours/flavors-of-edo",
      tourBooking: "https://exert-hula-resilient.ngrok-free.dev/tours/flavors-of-edo/00003/2026-09-02",
    },
    driverName: null,
    plateNumber: null,
    useDefaultPrice: true,
    vehiclePricing: null,
    airportVehiclePricing: null,
  },
];

/** The "Popular Airport Transfer Routes" cards on zengoride.com/airport-transfer
 * — one preset per airport → destination listed there, so each can carry a
 * prefilled booking-page link the way the Sightseeing tours already do. */
interface AirportRouteDef {
  airport: string;
  office: OfficeLocation;
  destination: string;
  priceUsd: number;
}

const AIRPORT_ROUTE_DEFS: AirportRouteDef[] = [
  { airport: "Narita Airport", office: "Tokyo", destination: "Tokyo (23 Wards)", priceUsd: 116 },
  { airport: "Narita Airport", office: "Tokyo", destination: "Yokohama (Central)", priceUsd: 153 },
  { airport: "Narita Airport", office: "Tokyo", destination: "Chiba City", priceUsd: 60 },
  { airport: "Narita Airport", office: "Tokyo", destination: "Disneyland Resort", priceUsd: 100 },
  { airport: "Haneda Airport", office: "Tokyo", destination: "Tokyo (23 Wards)", priceUsd: 73 },
  { airport: "Haneda Airport", office: "Tokyo", destination: "Yokohama", priceUsd: 68 },
  { airport: "Haneda Airport", office: "Tokyo", destination: "Kawasaki", priceUsd: 65 },
  { airport: "Haneda Airport", office: "Tokyo", destination: "Chiba City", priceUsd: 120 },
  { airport: "Kansai Airport", office: "Osaka", destination: "Osaka City", priceUsd: 85 },
  { airport: "Kansai Airport", office: "Osaka", destination: "Kyoto City", priceUsd: 122 },
  { airport: "Kansai Airport", office: "Osaka", destination: "Wakayama City", priceUsd: 153 },
  { airport: "Kansai Airport", office: "Osaka", destination: "Universal Studios Osaka", priceUsd: 85 },
  { airport: "Chubu Centrair Airport", office: "Nagoya", destination: "Nagoya City (16 Wards)", priceUsd: 85 },
  { airport: "Chubu Centrair Airport", office: "Nagoya", destination: "Lego Land", priceUsd: 73 },
  { airport: "Chubu Centrair Airport", office: "Nagoya", destination: "Nagashima Spa Land", priceUsd: 100 },
  { airport: "Chubu Centrair Airport", office: "Nagoya", destination: "Ghibli Park", priceUsd: 85 },
  { airport: "Osaka Itami Airport", office: "Osaka", destination: "Osaka City", priceUsd: 70 },
  { airport: "Osaka Itami Airport", office: "Osaka", destination: "Kyoto City", priceUsd: 92 },
  { airport: "Osaka Itami Airport", office: "Osaka", destination: "Kobe City", priceUsd: 85 },
  { airport: "Osaka Itami Airport", office: "Osaka", destination: "Wakayama City", priceUsd: 170 },
  { airport: "New Chitose Airport", office: "Sapporo", destination: "Sapporo City", priceUsd: 140 },
  { airport: "New Chitose Airport", office: "Sapporo", destination: "Lake Toya / Niseko / Kiroro", priceUsd: 215 },
  { airport: "New Chitose Airport", office: "Sapporo", destination: "Furano / Biei", priceUsd: 240 },
  { airport: "New Chitose Airport", office: "Sapporo", destination: "Noboribetsu Onsen", priceUsd: 177 },
];

/** Rough, non-authoritative reference rate — the site shows USD, our
 * pricing is all in ¥, and this keeps the preset prices in the same
 * ballpark as the Airport Price CMS's fixed fees for the same airports. */
const USD_TO_JPY = 150;

/** Short, recognizable names for trip titles — e.g. "Narita to Tokyo (23
 * Wards)" instead of "Narita Airport → Tokyo (23 Wards)". */
const AIRPORT_SHORT_NAMES: Record<string, string> = {
  "Narita Airport": "Narita",
  "Haneda Airport": "Haneda",
  "Kansai Airport": "Kansai",
  "Osaka Itami Airport": "Itami",
  "Chubu Centrair Airport": "Centrair",
  "New Chitose Airport": "Chitose",
};

/** No dedicated per-route details page exists on the marketing site yet —
 * every Airport preset's "tour details" link points at the general
 * routes page these presets were seeded from. */
const AIRPORT_TRANSFER_LANDING_URL = "https://www.zengoride.com/airport-transfer";

/** Airport booking-URL sequences are scoped per airport code (not global),
 * so this counter ticks up independently for each of the six airports as
 * the presets below are generated in order. */
const airportBookingSeqCounters: Record<string, number> = {};

function buildAirportPresetTours(): TourTemplate[] {
  return AIRPORT_ROUTE_DEFS.map((route, index) => {
    const id = `#A${String(index + 1).padStart(4, "0")}${route.office[0]}`;
    const shortName = AIRPORT_SHORT_NAMES[route.airport] ?? route.airport;
    const tripName = `${shortName} to ${route.destination}`;
    const airportCode = AIRPORT_CODES[route.airport] ?? route.airport;
    airportBookingSeqCounters[airportCode] =
      (airportBookingSeqCounters[airportCode] ?? 0) + 1;
    const bookingSequence = String(
      airportBookingSeqCounters[airportCode],
    ).padStart(4, "0");
    const tourBooking = buildAirportBookingUrl(airportCode, bookingSequence);
    return {
      id,
      reference: id,
      tripName,
      officeLocation: route.office,
      durationTier: null,
      status: "active",
      price: Math.round((route.priceUsd * USD_TO_JPY) / 100) * 100,
      startTime: "09:00",
      viewedCount: 0,
      bookedCount: 0,
      userName: null,
      userEmail: null,
      userSource: null,
      paymentStatus: null,
      serviceType: "Airport",
      airport: route.airport,
      passengers: null,
      luggage: null,
      waypoints: {
        pickup: airportDisplayName(route.airport),
        pickupTime: "09:00",
        pickupMapLocation: AIRPORT_MAP_LOCATIONS[route.airport] ?? null,
        stopovers: [],
        dropoff: route.destination,
        dropoffMapLocation: null,
      },
      routeDistanceKm: null,
      routeDurationMins: null,
      tripDistanceKm: null,
      tripDurationMins: null,
      previewLinks: {
        tourDetails: AIRPORT_TRANSFER_LANDING_URL,
        tourBooking,
      },
      driverName: null,
      plateNumber: null,
      useDefaultPrice: true,
      vehiclePricing: null,
      airportVehiclePricing: null,
    };
  });
}

export const SEED_TOURS: TourTemplate[] = [
  ...SIGHTSEEING_SEED_TOURS,
  ...buildAirportPresetTours(),
];
