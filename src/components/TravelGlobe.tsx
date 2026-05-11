/** @jsxImportSource react */
/**
 * TravelGlobe.tsx - Interactive 3D Globe Visualization
 *
 * ⚠️ REQUIRED REACT COMPONENT - DO NOT CONVERT TO ASTRO
 *
 * This component MUST use React because:
 * 1. Depends on react-globe.gl library (React-specific Three.js wrapper)
 * 2. Requires React hooks for complex state management:
 *    - useState: selectedPost, theme, dimensions, globe instance
 *    - useEffect: client-side initialization, theme detection, resize handlers
 *    - useRef: globe instance and container references
 *    - useCallback: memoized event handlers
 * 3. Client-side only rendering required (WebGL/Three.js cannot SSR)
 * 4. Complex interactive features: click, hover, animations, camera controls
 *
 * USAGE:
 * Rendered in: src/pages/travel-globe.astro
 *
 * Example:
 * <TravelGlobeComponent client:only="react" pointsData={travelPoints} />
 *
 * The client:only="react" directive ensures this component only renders
 * in the browser, avoiding SSR issues with Three.js and WebGL.
 *
 * DEPENDENCIES:
 * - react-globe.gl (3D globe library)
 * - three.js (via react-globe.gl)
 * - React 19.2.0
 *
 * CANNOT BE REPLACED: No native Astro equivalent exists for 3D globe
 * visualization with this level of interactivity.
 */
import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// Update the Point interface to include all post data
interface Point {
  lat: number;
  lng: number;
  name: string;
  slug: string;
  author: string;
  pubDatetime: Date;
  tags: string[];
  description: string;
  // --- FIX: 'cover' is now always a string ---
  cover: string;
  type: "BLOG" | "VLOG" | "TECH" | "NOTES" | "TRAVEL" | "BETA";
}

interface TravelGlobeProps {
  pointsData: Point[];
  postsPerPage?: number;
}

interface LocationPin {
  locationKey: string;
  lat: number;
  lng: number;
  name: string;
  posts: Point[];
}

const locationKeyForPoint = (point: Point) =>
  `${point.lat.toFixed(4)},${point.lng.toFixed(4)}`;

// NOTE: We dynamically import react-globe.gl on the client inside useEffect to
// avoid SSR importing modules that reference `window` at module scope.
// We store the loaded component in state.

// Lightweight React card for the selected post (avoids importing .astro inside React)
const PostCard = ({ post }: { post: Point }) => {
  const dateStr = post.pubDatetime
    ? new Date(post.pubDatetime).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
      })
    : "";
  return (
    <article className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-4 items-start p-4 sm:p-6 border border-skin-line rounded-2xl bg-skin-card shadow-lg">
      {post.cover ? (
        <a href={`/posts/${post.slug}`} className="block">
          <img
            src={post.cover}
            alt={post.name}
            className="w-full sm:w-[140px] h-[140px] object-cover rounded-xl bg-skin-card-muted"
            loading="lazy"
          />
        </a>
      ) : (
        <div className="w-full sm:w-[140px] h-[140px] rounded-xl bg-skin-card-muted" />
      )}
      <div className="min-w-0">
        <h4 className="m-0 text-xl font-bold text-skin-base">
          <a
            href={`/posts/${post.slug}`}
            className="text-skin-base no-underline transition-all hover:underline"
          >
            {post.name}
          </a>
        </h4>
        {dateStr && (
          <div className="text-sm opacity-70 mt-1 text-skin-base">
            {dateStr} • {post.author}
          </div>
        )}
        {post.description && (
          <p className="mt-3 mb-2 text-skin-base">{post.description}</p>
        )}
        {post.tags?.length ? (
          <div className="flex gap-2 flex-wrap mt-3">
            {post.tags.map((t) => (
              <a
                key={t}
                href={`/tags/${encodeURIComponent(t)}`}
                className="text-sm whitespace-nowrap text-skin-base underline decoration-dashed relative inline-block transition-all opacity-85 hover:opacity-100 hover:-top-0.5"
              >
                #{t}
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
};

const DESKTOP_GLOBE_MIN_WIDTH = 1001;
const GLOBE_DESKTOP_QUERY = `(min-width: ${DESKTOP_GLOBE_MIN_WIDTH}px)`;
const CAMERA_ANIMATION_MS = 650;

// NOTE: Recurring regression guard.
// We have repeatedly seen a "globe flashes, then disappears" issue when
// display mode is derived from delayed width measurements during hydration.
// Keep desktop/mobile mode detection driven by matchMedia with an immediate
// sync on mount. If this file is changed, verify first-load behavior on both
// <=1000px and >=1001px viewports before merging.

const TravelGlobe = ({ pointsData, postsPerPage = 5 }: TravelGlobeProps) => {
  const globeContainerRef = useRef<HTMLDivElement | null>(null);
  const locationListRef = useRef<HTMLUListElement | null>(null);
  const selectedCardsRef = useRef<HTMLDivElement | null>(null);
  const globeRef = useRef<any>(null); // Ref to the Globe component
  const [GlobeComponent, setGlobeComponent] = useState<any>(null);
  const [globeWidth, setGlobeWidth] = useState(0);
  const [globeHeight, setGlobeHeight] = useState(0);
  const [showGlobeLayout, setShowGlobeLayout] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia(GLOBE_DESKTOP_QUERY).matches;
  });
  const [countryBorders, setCountryBorders] = useState([]);
  const [theme, setTheme] = useState("dark");
  const [loadError, setLoadError] = useState(false);
  const [selectedLocationKey, setSelectedLocationKey] = useState<string | null>(
    null,
  );
  const [currentCardPage, setCurrentCardPage] = useState(1);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia(GLOBE_DESKTOP_QUERY);
    const syncLayoutMode = () => setShowGlobeLayout(media.matches);

    // Sync immediately to avoid first-paint mode mismatch.
    syncLayoutMode();

    const onMediaChange = (event: MediaQueryListEvent) => {
      setShowGlobeLayout(event.matches);
    };

    media.addEventListener("change", onMediaChange);

    return () => {
      media.removeEventListener("change", onMediaChange);
    };
  }, []);

  useEffect(() => {
    if (!showGlobeLayout) return;

    const setSize = () => {
      if (globeContainerRef.current) {
        setGlobeWidth(globeContainerRef.current.offsetWidth);
        setGlobeHeight(globeContainerRef.current.offsetHeight);
      }
    };

    setSize();
    window.addEventListener("resize", setSize);

    return () => {
      window.removeEventListener("resize", setSize);
    };
  }, [showGlobeLayout, selectedLocationKey]);

  useEffect(() => {
    if (!showGlobeLayout) return;

    // Log device and browser info for debugging
    console.log("[Globe] Device info:", {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      vendor: navigator.vendor,
      windowSize: `${window.innerWidth}x${window.innerHeight}`,
    });

    // Check WebGL support before loading
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) {
      console.error("[Globe] WebGL not supported on this device");
      setLoadError(true);
      return;
    }
    console.log(
      "[Globe] WebGL is supported, renderer:",
      gl.getParameter(gl.RENDERER),
    );

    if (!GlobeComponent) {
      // Dynamically import react-globe.gl only on the client to avoid SSR issues
      // Add timeout to catch hanging imports on slow connections
      const importTimeout = setTimeout(() => {
        console.error("[Globe] Import timeout - taking too long to load");
        setLoadError(true);
      }, 30000); // 30 second timeout

      import("react-globe.gl")
        .then((mod) => {
          clearTimeout(importTimeout);
          console.log("[Globe] Successfully loaded react-globe.gl");
          setGlobeComponent(() => mod.default);
        })
        .catch((e) => {
          clearTimeout(importTimeout);
          console.error("[Globe] Failed to load react-globe.gl:", e);
          console.error("[Globe] Error details:", {
            message: e.message,
            stack: e.stack,
            name: e.name,
          });
          setLoadError(true);
        });
    }

    const getTheme = () => {
      // This now checks the 'data-theme' attribute, matching your toggle script
      return document.documentElement.getAttribute("data-theme") || "light";
    };

    setTheme(getTheme());

    // Listen for the custom event dispatched by the theme toggle script
    const handleThemeChange = () => {
      setTheme(getTheme());
    };

    window.addEventListener("theme-change", handleThemeChange);

    if (countryBorders.length === 0) {
      // Fetch the LOCAL data file from its new location
      fetch("/globe/ne_110m_admin_0_countries_lakes.json")
        .then((res) => {
          if (!res.ok) {
            throw new Error(
              `Failed to fetch local country borders: ${res.status}`,
            );
          }
          return res.json();
        })
        .then((countries) => {
          const features = (countries && countries.features) || [];
          setCountryBorders(features);
          console.log("[Globe] Loaded borders features:", features.length);
        })
        .catch((error) => {
          console.error("[Globe] Error loading local country borders:", error);
          setCountryBorders([]);
        });
    }

    return () => {
      window.removeEventListener("theme-change", handleThemeChange); // Clean up the custom listener
    };
  }, [showGlobeLayout, GlobeComponent, countryBorders.length]);

  // --- Effect to set initial globe position (fallback) ---
  useEffect(() => {
    if (!showGlobeLayout) return;
    // wait a tick for the Globe to mount
    const id = window.setTimeout(() => {
      try {
        if (globeRef.current?.pointOfView) {
          globeRef.current.pointOfView(
            { lat: 47.6956, lng: -122.0164, altitude: 2.0 },
            0,
          );
        }
      } catch (e) {
        console.warn("[Globe] pointOfView init skipped:", e);
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, [showGlobeLayout, theme]);

  const scrollLocations = useCallback((direction: "up" | "down") => {
    const listEl = locationListRef.current;
    if (!listEl) return;

    const step = Math.max(180, Math.floor(listEl.clientHeight * 0.45));
    listEl.scrollBy({
      top: direction === "down" ? step : -step,
      behavior: "smooth",
    });
  }, []);

  // Small-screen feed is ordered by pubDatetime (newest first), similar to /tech listing.
  const pointsByPubDate = useMemo(
    () =>
      [...pointsData].sort(
        (a, b) =>
          new Date(b.pubDatetime).getTime() - new Date(a.pubDatetime).getTime(),
      ),
    [pointsData],
  );

  const locationPinsByKey = useMemo(() => {
    const grouped = new Map<string, LocationPin>();

    for (const point of pointsByPubDate) {
      const locationKey = locationKeyForPoint(point);
      const existing = grouped.get(locationKey);

      if (existing) {
        existing.posts.push(point);
      } else {
        grouped.set(locationKey, {
          locationKey,
          lat: point.lat,
          lng: point.lng,
          name: point.name,
          posts: [point],
        });
      }
    }

    return grouped;
  }, [pointsByPubDate]);

  // Keep list sorted by location name while each location's posts stay newest-first.
  const sortedPins = useMemo(
    () =>
      [...locationPinsByKey.values()].sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    [locationPinsByKey],
  );

  const selectedLocationPosts = selectedLocationKey
    ? locationPinsByKey.get(selectedLocationKey)?.posts ?? []
    : [];

  const hasSelectedLocation = selectedLocationPosts.length > 0;

  const scrollToSelectedCards = useCallback(() => {
    const cardsEl = selectedCardsRef.current;
    if (!cardsEl) return;

    const firstCard = cardsEl.querySelector("article") as HTMLElement | null;
    if (!firstCard) return;

    const cardRect = firstCard.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const topOffset = 92;
    const bottomPadding = 24;
    const fitsInViewport =
      cardRect.height + topOffset + bottomPadding <= viewportHeight;

    let targetTop = firstCard.offsetTop - topOffset;
    if (fitsInViewport) {
      const centeredOffset = (viewportHeight - cardRect.height) / 2;
      targetTop = firstCard.offsetTop - Math.max(topOffset, centeredOffset);
    }

    window.scrollTo({
      top: Math.max(0, targetTop),
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    if (!showGlobeLayout || !hasSelectedLocation) {
      return;
    }

    // Wait for selected cards to render and globe section to collapse, then reveal.
    const id = window.setTimeout(() => {
      scrollToSelectedCards();
    }, CAMERA_ANIMATION_MS + 80);

    return () => {
      window.clearTimeout(id);
    };
  }, [
    showGlobeLayout,
    hasSelectedLocation,
    scrollToSelectedCards,
  ]);

  // --- Updated Handler: Selects a location and rotates the globe ---
  const handleLocationSelect = (pin: LocationPin) => {
    setSelectedLocationKey(pin.locationKey);
    if (globeRef.current?.pointOfView) {
      globeRef.current.pointOfView(
        { lat: pin.lat, lng: pin.lng, altitude: 1.5 },
        CAMERA_ANIMATION_MS,
      );
    }
  };

  const totalCardPages = Math.max(
    1,
    Math.ceil(pointsByPubDate.length / postsPerPage),
  );

  useEffect(() => {
    if (currentCardPage > totalCardPages) {
      setCurrentCardPage(totalCardPages);
    }
  }, [currentCardPage, totalCardPages]);

  const paginatedCardPoints = pointsByPubDate.slice(
    (currentCardPage - 1) * postsPerPage,
    currentCardPage * postsPerPage,
  );

  const globeImageUrl =
    theme === "dark"
      ? "/globe/earth-night.jpg"
      : "/globe/earth-blue-marble.jpg";

  return (
    <>
      {showGlobeLayout ? (
        <>
          <div
            className={`flex flex-col md:flex-row items-start gap-4 md:gap-8 transition-all duration-300 ${
              hasSelectedLocation ? "min-h-[44vh]" : "min-h-[70vh]"
            }`}
          >
            {/* --- Location List (desktop globe mode) --- */}
            <div
              className={`w-56 xl:w-64 pr-3 flex flex-col transition-all duration-300 ${
                hasSelectedLocation ? "h-[44vh]" : "h-[70vh]"
              }`}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="text-xl font-bold text-skin-base">Locations</h3>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => scrollLocations("up")}
                    className="px-2 py-1 rounded border border-skin-line text-skin-base hover:bg-skin-fill transition-colors"
                    aria-label="Scroll locations up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollLocations("down")}
                    className="px-2 py-1 rounded border border-skin-line text-skin-base hover:bg-skin-fill transition-colors"
                    aria-label="Scroll locations down"
                  >
                    ↓
                  </button>
                </div>
              </div>

              <ul
                ref={locationListRef}
                className="list-none p-0 m-0 space-y-2 h-full overflow-y-auto pr-1 snap-y snap-mandatory"
              >
                {sortedPins.map((pin) => (
                  <li key={pin.locationKey} className="snap-start">
                    <button
                      onClick={() => handleLocationSelect(pin)}
                      className={`w-full text-left flex items-center gap-2 px-2 py-1 rounded transition-all ${
                        selectedLocationKey === pin.locationKey
                          ? "font-bold bg-skin-accent text-skin-inverted"
                          : "text-skin-base hover:bg-skin-fill"
                      }`}
                    >
                      <span className="opacity-85" aria-hidden="true">
                        📍
                      </span>
                      <span className="leading-tight">{pin.name}</span>
                      {pin.posts.length > 1 && (
                        <span className="ml-auto text-xs opacity-80">
                          {pin.posts.length}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* --- Globe Container --- */}
            <div
              ref={globeContainerRef}
              className={`flex-1 w-full relative cursor-pointer transition-all duration-300 ${
                hasSelectedLocation
                  ? "min-h-[44vh] h-[44vh]"
                  : "min-h-[70vh] h-[70vh]"
              }`}
            >
              {/* Globe (loaded client-side only) */}
              {loadError ? (
                <div className="flex flex-col items-center justify-center h-full text-skin-base p-6">
                  <div className="text-6xl mb-4">🌍</div>
                  <h3 className="text-xl font-bold mb-2">Globe Failed to Load</h3>
                  <p className="text-center max-w-md opacity-75 mb-4">
                    The 3D globe visualization couldn't be loaded on your device.
                  </p>
                  <details className="text-sm opacity-75 max-w-md">
                    <summary className="cursor-pointer font-semibold mb-2">
                      Troubleshooting
                    </summary>
                    <ul className="list-disc pl-5 space-y-1 text-left">
                      <li>Check browser console for error details</li>
                      <li>Ensure WebGL is enabled in browser settings</li>
                      <li>Try clearing browser cache and reloading</li>
                      <li>iPad users: Disable "Low Power Mode" if enabled</li>
                      <li>Check your internet connection (1.7MB download)</li>
                    </ul>
                  </details>
                </div>
              ) : GlobeComponent ? (
                <GlobeComponent
                  key={theme}
                  ref={globeRef}
                  width={globeWidth}
                  height={globeHeight}
                  backgroundColor="rgba(0,0,0,0)"
                  globeImageUrl={globeImageUrl}
                  onGlobeReady={() => {
                    try {
                      if (globeRef.current?.pointOfView) {
                        globeRef.current.pointOfView(
                          { lat: 47.6956, lng: -122.0164, altitude: 2.0 },
                          0,
                        );
                      }
                    } catch (e) {
                      console.warn("[Globe] Initial position failed:", e);
                    }
                  }}
                  polygonsData={countryBorders}
                  polygonCapColor={() => "rgba(0,0,0,0)"}
                  polygonSideColor={() => "rgba(0,0,0,0)"}
                  polygonStrokeColor={() => "#aaa"}
                  onLabelClick={(label: any) =>
                    handleLocationSelect(label as LocationPin)
                  }
                  labelsData={sortedPins}
                  labelLat={(d: any) => (d as LocationPin).lat}
                  labelLng={(d: any) => (d as LocationPin).lng}
                  labelText={(d: any) => (d as LocationPin).name}
                  labelSize={0.1}
                  labelColor={() => "rgba(255, 107, 1, 0.85)"}
                  labelDotRadius={0.5}
                  labelAltitude={0.01}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-skin-base text-lg">
                  <div className="animate-spin text-4xl mb-4">🌍</div>
                  <p>Loading Globe...</p>
                </div>
              )}
            </div>
          </div>

          {/* --- Selected location posts (newest first) --- */}
          {selectedLocationPosts.length > 0 && (
            <div ref={selectedCardsRef} className="mt-8 w-full flex flex-col gap-6">
              {selectedLocationPosts.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col gap-6">
          {paginatedCardPoints.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}

          {totalCardPages > 1 && (
            <nav className="mt-2 flex items-center justify-center gap-3 text-skin-base">
              <button
                type="button"
                onClick={() => setCurrentCardPage((p) => Math.max(1, p - 1))}
                disabled={currentCardPage === 1}
                className="px-3 py-1 rounded border border-skin-line disabled:opacity-50 disabled:cursor-not-allowed hover:bg-skin-fill transition-colors"
                aria-label="Previous page"
              >
                Previous
              </button>
              <span className="text-sm opacity-85">
                Page {currentCardPage} of {totalCardPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setCurrentCardPage((p) => Math.min(totalCardPages, p + 1))
                }
                disabled={currentCardPage === totalCardPages}
                className="px-3 py-1 rounded border border-skin-line disabled:opacity-50 disabled:cursor-not-allowed hover:bg-skin-fill transition-colors"
                aria-label="Next page"
              >
                Next
              </button>
            </nav>
          )}
        </div>
      )}
    </>
  );
};

export default TravelGlobe;
