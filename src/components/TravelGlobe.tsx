import React, { useState, useEffect, useRef, Suspense } from 'react';
import Card from '@components/Card.tsx';

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
  type: 'BLOG' | 'VLOG' | 'TECH' | 'NOTES' | 'TRAVEL' | 'BETA';
}

interface TravelGlobeProps {
  pointsData: Point[];
}

// Dynamically import the Globe component.
const Globe = React.lazy(() => import('react-globe.gl'));

const TravelGlobe: React.FC<TravelGlobeProps> = ({ pointsData }) => {
  const globeContainerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<any>(null); // Ref for the globe instance itself
  const [globeWidth, setGlobeWidth] = useState(0);
  const [globeHeight, setGlobeHeight] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [countryBorders, setCountryBorders] = useState([]);
  const [theme, setTheme] = useState('dark');
  // --- New state for the selected post ---
  const [selectedPost, setSelectedPost] = useState<Point | null>(null);

  useEffect(() => {
    setIsClient(true);

    const getTheme = () => {
      // This now checks the 'data-theme' attribute, matching your toggle script
      return document.documentElement.getAttribute('data-theme') || 'light';
    };

    setTheme(getTheme());

    // Listen for the custom event dispatched by the theme toggle script
    const handleThemeChange = () => {
      setTheme(getTheme());
    };

    window.addEventListener('theme-change', handleThemeChange);

    // Fetch the LOCAL data file from its new location
    fetch('/globe/ne_110m_admin_0_countries_lakes.json')
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to fetch local country borders: ${res.status}`);
        }
        return res.json();
      })
      .then(countries => {
        setCountryBorders(countries.features);
      })
      .catch(error => console.error('Error loading local country borders:', error));

    const setSize = () => {
      if (globeContainerRef.current) {
        setGlobeWidth(globeContainerRef.current.offsetWidth);
        setGlobeHeight(globeContainerRef.current.offsetHeight);
      }
    };

    setSize();
    window.addEventListener('resize', setSize);

    return () => {
      window.removeEventListener('resize', setSize);
      window.removeEventListener('theme-change', handleThemeChange); // Clean up the custom listener
    };
  }, []);

  // --- Effect to set initial globe position ---
  useEffect(() => {
    if (globeRef.current) {
      const initialLocation = {
        lat: 47.7036,
        lng: -122.0167,
        altitude: 2.0,
      };
      globeRef.current.pointOfView(initialLocation, 0);
    }
  }, [globeRef.current]);

  // --- Updated Handler: Selects a post and rotates the globe ---
  const handleLocationSelect = (point: Point) => {
    setSelectedPost(point); // Set the selected post
    if (globeRef.current) {
      globeRef.current.pointOfView({ lat: point.lat, lng: point.lng, altitude: 1.5 }, 1200);
    }
  };

  // Sort points alphabetically for the list
  const sortedPoints = [...pointsData].sort((a, b) => a.name.localeCompare(b.name));

  const globeImageUrl =
    theme === 'dark' ? '/globe/earth-night.jpg' : '/globe/earth-blue-marble.jpg';

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '2rem' }}>
        {/* --- Location List --- */}
        <div style={{ width: '200px', height: '70vh', overflowY: 'auto', paddingRight: '1rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 'bold' }}>
            Locations
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {sortedPoints.map(point => (
              <li key={point.slug} style={{ marginBottom: '0.5rem' }}>
                <button
                  onClick={() => handleLocationSelect(point)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '0.25rem 0',
                    color: 'var(--text-color)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    fontSize: '1rem',
                    fontWeight: selectedPost?.slug === point.slug ? 'bold' : 'normal',
                  }}
                >
                  {point.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* --- Globe Container --- */}
        <div ref={globeContainerRef} style={{ flex: 1, height: '70vh', cursor: 'pointer' }}>
          {isClient && (
            <Suspense fallback={<div>Loading Globe...</div>}>
              <Globe
                key={theme}
                ref={globeRef}
                width={globeWidth}
                height={globeHeight}
                backgroundColor='rgba(0,0,0,0)'
                globeImageUrl={globeImageUrl}
                polygonsData={countryBorders}
                polygonCapColor={() => 'rgba(0,0,0,0)'}
                polygonSideColor={() => 'rgba(0,0,0,0)'}
                polygonStrokeColor={() => '#aaa'}
                onLabelClick={label => handleLocationSelect(label as Point)}
                labelsData={pointsData}
                labelLat={d => (d as Point).lat}
                labelLng={d => (d as Point).lng}
                labelText={d => (d as Point).name}
                labelSize={0.1}
                labelColor={() => 'rgba(255, 107, 1, 0.85)'}
                labelDotRadius={0.5}
                labelAltitude={0.01}
              />
            </Suspense>
          )}
        </div>
      </div>

      {/* --- Conditionally Rendered Post Card --- */}
      {selectedPost && (
        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-start' }}>
          <div style={{ maxWidth: '40rem', width: '100%' }}>
            <Card
              href={`/posts/${selectedPost.slug}`}
              frontmatter={{
                title: selectedPost.name,
                author: selectedPost.author,
                pubDatetime: selectedPost.pubDatetime,
                tags: selectedPost.tags,
                description: selectedPost.description,
                cover: selectedPost.cover,
                type: selectedPost.type,
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default TravelGlobe;
