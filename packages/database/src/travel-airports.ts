export type AirportAccessClass = "A" | "B" | "C";

export interface AirportCandidate {
  airportId: string;
  iataCode: string | null;
  keywords: string | null;
  latitude: number;
  longitude: number;
  name: string;
  scheduledService: boolean;
  type: string;
}

export interface ResortAirportCandidate {
  accessClass: AirportAccessClass;
  airportId: string;
  distanceKm: number;
  isPrimary: boolean;
  priorityRank: number;
}

export interface ResortAirportLocation {
  latitude: number;
  longitude: number;
  resortId: string;
}

const PRIMARY_RADIUS_KM = 350;
const SECONDARY_RADIUS_KM = 500;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function accessClassPriority(accessClass: AirportAccessClass) {
  if (accessClass === "A") {
    return 0;
  }

  if (accessClass === "B") {
    return 1;
  }

  return 2;
}

export function calculateDistanceKm(
  first: { latitude: number; longitude: number },
  second: { latitude: number; longitude: number }
) {
  const earthRadiusKm = 6371;
  const deltaLatitude = toRadians(second.latitude - first.latitude);
  const deltaLongitude = toRadians(second.longitude - first.longitude);
  const latitudeOne = toRadians(first.latitude);
  const latitudeTwo = toRadians(second.latitude);

  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(latitudeOne) *
      Math.cos(latitudeTwo) *
      Math.sin(deltaLongitude / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function classifyAirportAccess(
  airport: AirportCandidate
): AirportAccessClass | null {
  if (!(airport.scheduledService && airport.iataCode)) {
    return null;
  }

  if (airport.type === "large_airport") {
    return "A";
  }

  if (airport.type !== "medium_airport") {
    return null;
  }

  const searchableText =
    `${airport.name} ${airport.keywords ?? ""}`.toLowerCase();

  if (searchableText.includes("international")) {
    return "B";
  }

  return "C";
}

function selectWithinRadius(
  resort: ResortAirportLocation,
  airports: AirportCandidate[],
  radiusKm: number
) {
  return airports
    .map((airport) => {
      const accessClass = classifyAirportAccess(airport);

      if (!accessClass) {
        return null;
      }

      const distanceKm = calculateDistanceKm(resort, airport);

      if (distanceKm > radiusKm) {
        return null;
      }

      return {
        accessClass,
        airportId: airport.airportId,
        distanceKm: Number(distanceKm.toFixed(1)),
      };
    })
    .filter((airport) => airport !== null);
}

export function pickResortAirportCandidates(
  resort: ResortAirportLocation,
  airports: AirportCandidate[]
): ResortAirportCandidate[] {
  const nearbyPrimary = selectWithinRadius(resort, airports, PRIMARY_RADIUS_KM);
  const nearby =
    nearbyPrimary.length >= 3
      ? nearbyPrimary
      : selectWithinRadius(resort, airports, SECONDARY_RADIUS_KM);

  const preferred = nearby
    .filter(
      (airport) => airport.accessClass === "A" || airport.accessClass === "B"
    )
    .sort((left, right) => left.distanceKm - right.distanceKm);

  const fallback = nearby
    .filter((airport) => airport.accessClass === "C")
    .sort((left, right) => left.distanceKm - right.distanceKm);

  return [...preferred, ...fallback]
    .sort((left, right) => {
      const classDifference =
        accessClassPriority(left.accessClass) -
        accessClassPriority(right.accessClass);

      if (classDifference !== 0) {
        return classDifference;
      }

      return left.distanceKm - right.distanceKm;
    })
    .slice(0, 3)
    .map((airport, index) => ({
      ...airport,
      isPrimary: index === 0,
      priorityRank: index + 1,
    }));
}
