// Curated, not scraped. Common-knowledge North India hill-station/
// backpacker destinations, matching the blueprint's geographic focus —
// coordinates geocoded for real via Nominatim (the same free, legal
// service the routing module uses), not pulled from MakeMyTrip or Google
// Maps, both of which explicitly prohibit scraping in their ToS and don't
// hold anything proprietary here anyway: this list is genuinely common
// knowledge, not a commercial dataset.
export interface CuratedDestination {
  label: string;
  lat: number;
  lng: number;
}

export const TOP_DESTINATIONS: CuratedDestination[] = [
  { label: "Shimla, Himachal Pradesh", lat: 31.1040393, lng: 77.1707923 },
  { label: "Manali, Himachal Pradesh", lat: 32.2454608, lng: 77.1872926 },
  { label: "Kasol, Himachal Pradesh", lat: 32.0104317, lng: 77.3166036 },
  { label: "Dharamshala, Himachal Pradesh", lat: 32.2143039, lng: 76.3196717 },
  { label: "McLeod Ganj, Himachal Pradesh", lat: 32.2352666, lng: 76.326238 },
  { label: "Dalhousie, Himachal Pradesh", lat: 32.5435755, lng: 75.9448409 },
  { label: "Spiti Valley (Kaza), Himachal Pradesh", lat: 32.2243837, lng: 78.0722634 },
  { label: "Rishikesh, Uttarakhand", lat: 30.1086537, lng: 78.2916193 },
  { label: "Nainital, Uttarakhand", lat: 29.294995, lng: 79.4162511 },
  { label: "Mussoorie, Uttarakhand", lat: 30.4569012, lng: 78.0782906 },
  { label: "Auli, Uttarakhand", lat: 30.5377872, lng: 79.5657242 },
  { label: "Bir Billing, Himachal Pradesh", lat: 32.0472187, lng: 76.7406502 },
  { label: "Tirthan Valley, Himachal Pradesh", lat: 31.6373271, lng: 77.4275843 },
  { label: "Chopta, Uttarakhand", lat: 30.1801851, lng: 79.367685 },
];
