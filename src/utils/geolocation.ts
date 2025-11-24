/**
 * Geolocation utilities for detecting user location
 */

export interface GeolocationResult {
  location: string; // Format: "country/state" or "country" (e.g., "usa/wa", "canada/bc")
  latitude?: number;
  longitude?: number;
  accuracy?: number;
}

/**
 * Request geolocation permission with user-friendly message
 */
export async function requestGeolocationPermission(): Promise<boolean> {
  if (!navigator.geolocation) {
    return false;
  }

  // Check if we already have permission
  if (navigator.permissions) {
    try {
      const result = await navigator.permissions.query({ name: "geolocation" });
      if (result.state === "granted") {
        return true;
      }
      if (result.state === "denied") {
        return false;
      }
    } catch (e) {
      // Permissions API not supported, continue
    }
  }

  return true; // Will prompt user
}

/**
 * Get user's geolocation using browser Geolocation API
 * Returns location in format: "usa/wa", "canada/bc", etc.
 */
export async function detectGeolocation(): Promise<GeolocationResult | null> {
  if (!navigator.geolocation) {
    console.warn("[Geolocation] Browser doesn't support geolocation");
    return null;
  }

  try {
    const position = await new Promise<GeolocationPosition>(
      (resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes cache
        });
      },
    );

    const { latitude, longitude, accuracy } = position.coords;

    // Reverse geocode to get country/state
    const location = await reverseGeocode(latitude, longitude);

    return {
      location,
      latitude,
      longitude,
      accuracy,
    };
  } catch (error: any) {
    console.warn("[Geolocation] Failed to get position:", error.message);
    return null;
  }
}

/**
 * Reverse geocode coordinates to country/state format
 * Uses OpenStreetMap Nominatim API (free, no API key required)
 */
async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
      {
        headers: {
          "User-Agent": "SkiCycleRun/1.0", // Required by Nominatim
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`);
    }

    const data = await response.json();
    const address = data.address || {};

    // Extract country and state/province
    const country = normalizeCountry(address.country_code);
    const state = normalizeState(address.state || address.region);

    if (country && state) {
      return `${country}/${state}`;
    } else if (country) {
      return country;
    }

    return "unknown";
  } catch (error) {
    console.warn("[Geolocation] Reverse geocoding failed:", error);
    return "unknown";
  }
}

/**
 * Normalize country code to lowercase
 */
function normalizeCountry(countryCode?: string): string {
  if (!countryCode) return "";

  const code = countryCode.toLowerCase();

  // Map country codes to preferred format
  const countryMap: Record<string, string> = {
    us: "usa",
    ca: "canada",
    gb: "uk",
    au: "australia",
    nz: "newzealand",
  };

  return countryMap[code] || code;
}

/**
 * Normalize state/province to lowercase abbreviation
 */
function normalizeState(state?: string): string {
  if (!state) return "";

  const normalized = state.toLowerCase().trim();

  // US states - convert full names to abbreviations
  const usStates: Record<string, string> = {
    alabama: "al",
    alaska: "ak",
    arizona: "az",
    arkansas: "ar",
    california: "ca",
    colorado: "co",
    connecticut: "ct",
    delaware: "de",
    florida: "fl",
    georgia: "ga",
    hawaii: "hi",
    idaho: "id",
    illinois: "il",
    indiana: "in",
    iowa: "ia",
    kansas: "ks",
    kentucky: "ky",
    louisiana: "la",
    maine: "me",
    maryland: "md",
    massachusetts: "ma",
    michigan: "mi",
    minnesota: "mn",
    mississippi: "ms",
    missouri: "mo",
    montana: "mt",
    nebraska: "ne",
    nevada: "nv",
    "new hampshire": "nh",
    "new jersey": "nj",
    "new mexico": "nm",
    "new york": "ny",
    "north carolina": "nc",
    "north dakota": "nd",
    ohio: "oh",
    oklahoma: "ok",
    oregon: "or",
    pennsylvania: "pa",
    "rhode island": "ri",
    "south carolina": "sc",
    "south dakota": "sd",
    tennessee: "tn",
    texas: "tx",
    utah: "ut",
    vermont: "vt",
    virginia: "va",
    washington: "wa",
    "west virginia": "wv",
    wisconsin: "wi",
    wyoming: "wy",
  };

  // Canadian provinces
  const canadianProvinces: Record<string, string> = {
    "british columbia": "bc",
    alberta: "ab",
    saskatchewan: "sk",
    manitoba: "mb",
    ontario: "on",
    quebec: "qc",
    "new brunswick": "nb",
    "nova scotia": "ns",
    "prince edward island": "pe",
    newfoundland: "nl",
    yukon: "yt",
    "northwest territories": "nt",
    nunavut: "nu",
  };

  // Check if it's already an abbreviation (2 letters)
  if (normalized.length === 2) {
    return normalized;
  }

  // Try to match full state name
  return usStates[normalized] || canadianProvinces[normalized] || normalized;
}

/**
 * Validate location format (country/state or country)
 * Returns normalized location or null if invalid
 */
export function validateLocation(location: string): string | null {
  if (!location) return null;

  const trimmed = location.trim().toLowerCase();
  const parts = trimmed.split(/[\/\s]+/);

  if (parts.length === 0 || parts.length > 2) {
    return null;
  }

  // Single part (country only)
  if (parts.length === 1) {
    return parts[0];
  }

  // Two parts (country/state)
  const [country, state] = parts;
  if (!country || !state) {
    return null;
  }

  return `${country}/${state}`;
}

/**
 * Format location string for display
 * "usa/wa" → "USA / WA"
 * "canada" → "Canada"
 */
export function formatLocationForDisplay(location: string): string {
  if (!location) return "";

  const parts = location.split("/");
  return parts.map((part) => part.toUpperCase()).join(" / ");
}

/**
 * Parse display format back to storage format
 * "USA / WA" → "usa/wa"
 */
export function parseLocationFromDisplay(display: string): string {
  if (!display) return "";

  return display
    .toLowerCase()
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s+/g, "");
}
