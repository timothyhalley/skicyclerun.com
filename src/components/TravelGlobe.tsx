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
import { useState, useEffect, useRef, useCallback } from "react";

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
}

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

const TravelGlobe = ({ pointsData }: { pointsData: Point[] }) => {
  const globeContainerRef = useRef<HTMLDivElement | null>(null);
  const globeRef = useRef<any>(null); // Ref to the Globe component
  const [GlobeComponent, setGlobeComponent] = useState<any>(null);
  const [globeWidth, setGlobeWidth] = useState(0);
  const [globeHeight, setGlobeHeight] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [countryBorders, setCountryBorders] = useState([]);
  const [theme, setTheme] = useState("dark");
  const [loadError, setLoadError] = useState(false);
  // --- New state for the selected post ---
  const [selectedPost, setSelectedPost] = useState(null as Point | null);

  useEffect(() => {
    setIsClient(true);

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
      window.removeEventListener("theme-change", handleThemeChange); // Clean up the custom listener
    };
  }, []);

  // --- Effect to set initial globe position (fallback) ---
  useEffect(() => {
    if (!isClient) return;
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
  }, [isClient, theme]);

  // --- Updated Handler: Selects a post and rotates the globe ---
  const handleLocationSelect = (point: Point) => {
    setSelectedPost(point); // Set the selected post
    if (globeRef.current?.pointOfView) {
      globeRef.current.pointOfView(
        { lat: point.lat, lng: point.lng, altitude: 1.5 },
        1200,
      );
    }
  };

  // Sort points alphabetically for the list
  const sortedPoints = [...pointsData].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  const globeImageUrl =
    theme === "dark"
      ? "/globe/earth-night.jpg"
      : "/globe/earth-blue-marble.jpg";

  return (
    <>
      <div className="flex flex-col md:flex-row items-start gap-4 md:gap-8 min-h-[70vh]">
        {/* --- Location List (hidden on mobile/small tablets, visible on larger screens) --- */}
        <div className="hidden lg:block w-48 xl:w-56 h-[70vh] overflow-y-auto pr-4">
          <h3 className="mb-4 text-xl font-bold text-skin-base">Locations</h3>
          <ul className="list-none p-0 m-0 space-y-2">
            {sortedPoints.map((point) => (
              <li key={point.slug}>
                <button
                  onClick={() => handleLocationSelect(point)}
                  className={`w-full text-left flex items-center gap-2 px-2 py-1 rounded transition-all ${
                    selectedPost?.slug === point.slug
                      ? "font-bold bg-skin-accent text-skin-inverted"
                      : "text-skin-base hover:bg-skin-fill"
                  }`}
                >
                  <span className="opacity-85" aria-hidden="true">
                    📍
                  </span>
                  <span className="leading-tight">{point.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* --- Globe Container --- */}
        <div
          ref={globeContainerRef}
          className="flex-1 w-full min-h-[70vh] h-[70vh] relative cursor-pointer"
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
                handleLocationSelect(label as Point)
              }
              labelsData={pointsData}
              labelLat={(d: any) => (d as Point).lat}
              labelLng={(d: any) => (d as Point).lng}
              labelText={(d: any) => (d as Point).name}
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

      {/* --- Conditionally Rendered Post Card (full width, respecting page margins) --- */}
      {selectedPost && (
        <div className="mt-8 w-full">
          <PostCard post={selectedPost} />
        </div>
      )}
    </>
  );
};

export default TravelGlobe;
