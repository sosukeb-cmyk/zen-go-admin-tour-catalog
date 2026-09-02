export interface MapLocation {
  title: string;
  address: string;
}

export const MAP_LOCATION_SUGGESTIONS: MapLocation[] = [
  {
    title: "Osaka Station",
    address: "3 Chome-1-1 Umeda, Kita Ward, Osaka, Japan",
  },
  {
    title: "THE OSAKA STATION HOTEL, Autograph Collection",
    address: "3 Chome-2-2 Umeda, Kita Ward, Osaka, Japan",
  },
  {
    title: "Tōdai-ji",
    address: "406-1 Zōshichō, Nara, Japan",
  },
  {
    title: "Nara Park",
    address: "Nara, Nara Prefecture, Japan",
  },
  {
    title: "Mount Wakakusa",
    address: "469 Zōshichō, Nara, Japan",
  },
  {
    title: "Yotsuya Station",
    address: "1 Chome Yotsuya, Shinjuku City, Tokyo, Japan",
  },
  {
    title: "Kamakura Station",
    address: "1 Onari, Kamakura, Kanagawa, Japan",
  },
  {
    title: "Great Buddha (Daibutsu)",
    address: "4 Chome-2-28 Hase, Kamakura, Kanagawa, Japan",
  },
];

export function searchMapLocations(query: string): MapLocation[] {
  const q = query.trim().toLowerCase();
  if (!q) return MAP_LOCATION_SUGGESTIONS.slice(0, 5);
  return MAP_LOCATION_SUGGESTIONS.filter(
    (loc) =>
      loc.title.toLowerCase().includes(q) ||
      loc.address.toLowerCase().includes(q),
  );
}
