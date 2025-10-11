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
    <article className="globe-postcard">
      {post.cover ? (
        <a href={`/posts/${post.slug}`} className="globe-postcard-link">
          <img
            src={post.cover}
            alt={post.name}
            className="globe-postcard-img"
            loading="lazy"
          />
        </a>
      ) : (
        <div className="globe-postcard-img globe-postcard-img--placeholder" />
      )}
      <div className="globe-postcard-body">
        <h4 className="globe-postcard-title">
          <a href={`/posts/${post.slug}`}>{post.name}</a>
        </h4>
        {dateStr && (
          <div className="globe-postcard-meta">
            {dateStr} • {post.author}
          </div>
        )}
        {post.description && (
          <p className="globe-postcard-desc">{post.description}</p>
        )}
        {post.tags?.length ? (
          <div className="globe-postcard-tags">
            {post.tags.map((t) => (
              <a
                key={t}
                href={`/tags/${encodeURIComponent(t)}`}
                className="globe-postcard-tag"
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
  // --- New state for the selected post ---
  const [selectedPost, setSelectedPost] = useState(null as Point | null);

  useEffect(() => {
    setIsClient(true);

    // Dynamically import react-globe.gl only on the client to avoid SSR issues
    import("react-globe.gl")
      .then((mod) => setGlobeComponent(() => mod.default))
      .catch((e) => console.warn("[Globe] Failed to load react-globe.gl:", e));

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
      <div
        className="globe-layout"
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "2rem",
          minHeight: "70vh",
        }}
      >
        {/* --- Location List --- */}
        <div className="globe-list">
          <h3 className="globe-list-title">Locations</h3>
          <ul className="globe-list-ul">
            {sortedPoints.map((point) => (
              <li key={point.slug} className="globe-list-li">
                <button
                  onClick={() => handleLocationSelect(point)}
                  className={`globe-list-button ${selectedPost?.slug === point.slug ? "globe-list-button--active" : ""}`}
                >
                  <span className="globe-list-pin" aria-hidden="true">
                    📍
                  </span>
                  <span className="globe-list-label">{point.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* --- Globe Container --- */}
        <div
          ref={globeContainerRef}
          className="globe-container"
          style={{
            minHeight: "70vh",
            height: "70vh",
            width: "100%",
            position: "relative",
          }}
        >
          {/* Globe (loaded client-side only) */}
          {GlobeComponent ? (
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
                } catch {}
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
            <div>Loading Globe...</div>
          )}
        </div>
      </div>

      {/* --- Conditionally Rendered Post Card --- */}
      {selectedPost && (
        <div className="globe-card">
          <div className="globe-card-inner">
            <PostCard post={selectedPost} />
          </div>
        </div>
      )}
    </>
  );
};

export default TravelGlobe;

// CSS module for inline styles migration
// Using a template string to keep styles co-located; could be moved to a CSS file later
const styles = `
:root { --globe-gap: 2rem; }
.globe-layout { display: flex; flex-direction: row; align-items: center; gap: var(--globe-gap); }
.globe-container { flex: 1; height: 70vh; cursor: pointer; }
.globe-list { width: 200px; height: 70vh; overflow-y: auto; padding-right: 1rem; }
.globe-list-title { margin-bottom: 1rem; font-size: 1.25rem; font-weight: bold; }
.globe-list-ul { list-style: none; padding: 0; margin: 0; }
.globe-list-li { margin-bottom: 0.5rem; }
.globe-list-button { background: none; border: none; padding: 0.25rem 0 0.25rem 0.5rem; color: var(--text-color); cursor: pointer; text-align: left; width: 100%; font-size: 1rem; display: flex; align-items: center; gap: 0.375rem; }
.globe-list-button--active { font-weight: bold; }
.globe-list-pin { opacity: 0.85; }
.globe-list-label { line-height: 1.3; }
.globe-card { margin-top: 2rem; display: flex; justify-content: flex-start; }
.globe-card-inner { max-width: 40rem; width: 100%; }

/* Responsive: Hide location list on small screens */
@media (max-width: 750px) {
  .globe-list { display: none; }
  .globe-container { width: 100%; margin: 0 1rem; }
}

/* PostCard styles */
.globe-postcard {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 0.75rem;
  align-items: center;
  border: 1px solid rgba(var(--color-text-base), 0.15);
  border-radius: 12px;
  padding: 0.75rem;
  background: rgb(var(--color-card));
  box-shadow: 0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06);
}
.globe-postcard-link { display: block; }
.globe-postcard-img {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  background: rgb(var(--color-card-muted));
}
.globe-postcard-img--placeholder { background: rgb(var(--color-card-muted)); }
.globe-postcard-body { min-width: 0; }
.globe-postcard-title { margin: 0; font-size: 1.1rem; font-weight: 700; color: rgb(var(--color-text-base)); }
.globe-postcard-title a { 
  color: rgb(var(--color-text-base)); 
  text-decoration: none;
  transition: all 0.2s;
}
.globe-postcard-title a:hover { 
  text-decoration: underline;
}
.globe-postcard-meta { font-size: 0.85rem; opacity: 0.7; margin-top: 2px; color: rgb(var(--color-text-base)); }
.globe-postcard-desc { margin: 0.5rem 0 0.25rem 0; color: rgb(var(--color-text-base)); }
.globe-postcard-tags { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.globe-postcard-tag { 
  font-size: 0.85rem; 
  white-space: nowrap; 
  color: rgb(var(--color-text-base)); 
  text-decoration: underline;
  text-decoration-style: dashed;
  position: relative;
  display: inline-block;
  transition: all 0.2s;
  opacity: 0.85;
}
.globe-postcard-tag:hover { 
  top: -0.125rem;
  opacity: 1;
}
`;

if (typeof document !== "undefined") {
  const id = "travel-globe-styles";
  if (!document.getElementById(id)) {
    const el = document.createElement("style");
    el.id = id;
    el.textContent = styles;
    document.head.appendChild(el);
  }
}
