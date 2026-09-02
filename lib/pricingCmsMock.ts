export type PricingOffice = "Tokyo" | "Osaka" | "Nagoya" | "Sapporo";

export interface SightseeingPriceRow {
  id: string;
  vehicleType: string;
  vehicleName: string;
  office: PricingOffice;
  owner: string;
  available: boolean;
  halfDayPrice: number;
  fullDayPrice: number;
}

export const SIGHTSEEING_PRICE_SEED: SightseeingPriceRow[] = [
  {
    id: "sp-1",
    vehicleType: "Commuter Van",
    vehicleName: "Toyota Hiace Commuter",
    office: "Tokyo",
    owner: "Self-Owned",
    available: true,
    halfDayPrice: 10000,
    fullDayPrice: 12000,
  },
  {
    id: "sp-2",
    vehicleType: "Commuter Van",
    vehicleName: "Toyota Hiace Commuter",
    office: "Osaka",
    owner: "Self-Owned",
    available: true,
    halfDayPrice: 47000,
    fullDayPrice: 66000,
  },
  {
    id: "sp-3",
    vehicleType: "Commuter Van",
    vehicleName: "Toyota Hiace Commuter",
    office: "Nagoya",
    owner: "Self-Owned",
    available: true,
    halfDayPrice: 47000,
    fullDayPrice: 66000,
  },
  {
    id: "sp-4",
    vehicleType: "Premium Minivan",
    vehicleName: "Toyota Alphard 40Gen",
    office: "Tokyo",
    owner: "Self-Owned",
    available: true,
    halfDayPrice: 49000,
    fullDayPrice: 68000,
  },
  {
    id: "sp-5",
    vehicleType: "Premium Minivan",
    vehicleName: "Toyota Alphard 40Gen",
    office: "Osaka",
    owner: "Self-Owned",
    available: false,
    halfDayPrice: 47000,
    fullDayPrice: 62000,
  },
  {
    id: "sp-6",
    vehicleType: "Crossover EV",
    vehicleName: "Tesla Model Y",
    office: "Tokyo",
    owner: "Self-Owned",
    available: true,
    halfDayPrice: 42000,
    fullDayPrice: 59000,
  },
  {
    id: "sp-7",
    vehicleType: "Premium Minivan",
    vehicleName: "Toyota Alphard 30Gen",
    office: "Tokyo",
    owner: "Self-Owned",
    available: true,
    halfDayPrice: 47000,
    fullDayPrice: 66000,
  },
  {
    id: "sp-8",
    vehicleType: "Premium Minivan",
    vehicleName: "Toyota Alphard 40Gen",
    office: "Tokyo",
    owner: "Self-Owned",
    available: true,
    halfDayPrice: 48000,
    fullDayPrice: 67000,
  },
  {
    id: "sp-9",
    vehicleType: "Crossover EV",
    vehicleName: "Tesla Model Y",
    office: "Tokyo",
    owner: "Self-Owned",
    available: true,
    halfDayPrice: 41000,
    fullDayPrice: 58000,
  },
  {
    id: "sp-10",
    vehicleType: "Commuter Van",
    vehicleName: "Toyota Hiace Commuter",
    office: "Osaka",
    owner: "Self-Owned",
    available: true,
    halfDayPrice: 46000,
    fullDayPrice: 65000,
  },
  {
    id: "sp-11",
    vehicleType: "Premium Minivan",
    vehicleName: "Toyota Alphard 30Gen",
    office: "Osaka",
    owner: "Self-Owned",
    available: true,
    halfDayPrice: 48000,
    fullDayPrice: 64000,
  },
  {
    id: "sp-12",
    vehicleType: "Crossover EV",
    vehicleName: "Tesla Model Y",
    office: "Osaka",
    owner: "Self-Owned",
    available: true,
    halfDayPrice: 43000,
    fullDayPrice: 60000,
  },
  {
    id: "sp-13",
    vehicleType: "Commuter Van",
    vehicleName: "Toyota Hiace Commuter",
    office: "Nagoya",
    owner: "Self-Owned",
    available: true,
    halfDayPrice: 45500,
    fullDayPrice: 64500,
  },
  {
    id: "sp-14",
    vehicleType: "Premium Minivan",
    vehicleName: "Toyota Alphard 40Gen",
    office: "Sapporo",
    owner: "Self-Owned",
    available: true,
    halfDayPrice: 52000,
    fullDayPrice: 72000,
  },
];

export const PRICING_CMS_TABS = [
  "Offices",
  "Airports",
  "Vehicle Lineup",
  "Vehicle Detail",
  "Sightseeing Price",
  "Customized Price",
  "Airport Price",
  "Value-Add Services",
] as const;

export type PricingCmsTab = (typeof PRICING_CMS_TABS)[number];

export const PRICING_OFFICES: PricingOffice[] = [
  "Tokyo",
  "Osaka",
  "Nagoya",
  "Sapporo",
];

export function officeCounts(rows: SightseeingPriceRow[]) {
  const counts: Record<PricingOffice | "All", number> = {
    All: rows.length,
    Tokyo: 0,
    Osaka: 0,
    Nagoya: 0,
    Sapporo: 0,
  };
  for (const row of rows) counts[row.office]++;
  return counts;
}
