import { useState, useEffect } from "react";
import type { ImageMetadata } from "astro";
import { DebugConsole } from "@utils/DebugConsole";

interface Photo {
  src: string | undefined;
  altText: string;
  sourceType: "remote" | "local";
}

async function getLocalImages() {
  const imageObject = import.meta.glob<{ default: ImageMetadata }>(
    "/src/assets/images/*.{jpeg,jpg,png,gif,svg}",
  );
  const imageKeys = Object.keys(imageObject);
  return imageKeys;
}

async function getLocalPhotos(): Promise<Photo[]> {
  const imagePaths = await getLocalImages();
  const imageModules = import.meta.glob<{ default: ImageMetadata }>(
    "/src/assets/images/*.{jpeg,jpg,png,gif,svg}",
  );

  const photos = await Promise.all(
    imagePaths.map(async (path: string, i: number) => {
      const mod = imageModules[path];
      const img = mod ? await mod() : null;
      return {
        src: img?.default?.src ?? undefined,
        altText: `Photo ${i + 1}`,
        sourceType: "local" as const,
      };
    }),
  );
  return photos;
}

export default function RemotePhotoGallery({ album }: { album: string }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"gallery" | "hero">("gallery");
  const [cycleOffset, setCycleOffset] = useState(0);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const baseUrl =
          import.meta.env.PUBLIC_SKICYCLERUN_API ||
          "https://api.skicyclerun.com/v2/";
        const photoURL = `${baseUrl}getphotosrandom?bucketName=skicyclerun.lib&albumPath=albums/${album}/&numPhotos=150`;
        const res = await fetch(photoURL);
        const data = await res.json();
        DebugConsole.api("[RemotePhotoGallery] API response data:", data);

        if (Array.isArray(data)) {
          const remotePhotos = data.map((p: any, i: number) => {
            const src = typeof p === "string" ? p : p?.src;
            return {
              src,
              altText: p?.altText ?? `Photo ${i + 1}`,
              sourceType: "remote" as const,
            };
          });
          setPhotos(remotePhotos);
        } else {
          DebugConsole.warn(
            "⚠️ Unexpected response format from photo API, falling back to local images",
          );
          const local = await getLocalPhotos();
          setPhotos(local);
        }
      } catch (error) {
        DebugConsole.warn(
          "⚠️ Photo API failed, falling back to local images:",
          error,
        );
        const local = await getLocalPhotos();
        setPhotos(local);
      } finally {
        setLoading(false);
      }
    };

    if (album && album !== "local") {
      fetchPhotos();
    } else {
      getLocalPhotos().then((localPhotos) => {
        setPhotos(localPhotos);
        setLoading(false);
      });
    }
  }, [album]);

  const handleImageClick = () => {
    setCycleOffset((prev) => (prev + 1) % photos.length);
    DebugConsole.ui(
      `🔄 Cycling photos, new offset: ${(cycleOffset + 1) % photos.length}`,
    );
  };

  const toggleView = () => {
    setViewMode((prev) => (prev === "gallery" ? "hero" : "gallery"));
    DebugConsole.ui(
      `🧨 Toggled view to: ${viewMode === "gallery" ? "hero" : "gallery"}`,
    );
  };

  if (loading) {
    return <div className="p-4 text-center">Loading photos...</div>;
  }

  if (photos.length === 0) {
    return <div className="p-4 text-center">No photos available</div>;
  }

  DebugConsole.ui(
    `[RemotePhotoGallery] Rendering ${photos.length} photos in ${viewMode} mode`,
  );

  // Calculate which photos to display based on cycle offset
  const getPhotoAtIndex = (index: number) =>
    photos[(cycleOffset + index) % photos.length];

  return (
    <div className="remote-photo-shell">
      {/* Gallery View - 6 photos in grid */}
      {viewMode === "gallery" && (
        <div className="remote-photo-frame lg:px-32 lg:pt-24 container mx-auto px-2 sm:px-3 py-2">
          <div className="md:-m-2 -m-1 flex flex-wrap">
            {/* Left column - 3 photos */}
            <div className="flex w-1/2 flex-wrap">
              {[0, 1, 2].map((index) => {
                const photo = getPhotoAtIndex(index);
                return (
                  <div
                    key={index}
                    className={`remote-photo-tile md:p-2 ${index === 2 ? "w-full" : "w-1/2"} p-1 cursor-pointer`}
                    onClick={handleImageClick}
                  >
                    {photo?.src && (
                      <img
                        src={photo.src}
                        alt={photo.altText}
                        className="remote-photo-image block h-full w-full object-cover object-center"
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                  </div>
                );
              })}
            </div>
            {/* Right column - 3 photos */}
            <div className="flex w-1/2 flex-wrap">
              {[3, 4, 5].map((index) => {
                const photo = getPhotoAtIndex(index);
                return (
                  <div
                    key={index}
                    className={`remote-photo-tile md:p-2 ${index === 3 ? "w-full" : "w-1/2"} p-1 cursor-pointer`}
                    onClick={handleImageClick}
                  >
                    {photo?.src && (
                      <img
                        src={photo.src}
                        alt={photo.altText}
                        className="remote-photo-image block h-full w-full object-cover object-center"
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Hero View - 1 large photo */}
      {viewMode === "hero" && (
        <div className="remote-photo-frame lg:px-32 lg:pt-24 container mx-auto px-2 sm:px-3 py-2">
          <div
            className="remote-photo-hero md:-m-2 -m-1 flex flex-wrap cursor-pointer"
            onClick={handleImageClick}
          >
            {getPhotoAtIndex(0)?.src && (
              <img
                src={getPhotoAtIndex(0).src}
                alt={getPhotoAtIndex(0).altText}
                className="remote-photo-image remote-photo-image-hero block h-full w-full object-contain object-center"
                loading="lazy"
                decoding="async"
              />
            )}
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <div className="container mx-auto p-4">
        <button
          onClick={toggleView}
          className="remote-photo-toggle mt-4 px-4 py-2 transition-colors"
        >
          {viewMode === "gallery" ? "Hero View" : "Gallery View"}
        </button>
      </div>

      <style>{`
        .remote-photo-shell {
          --remote-aspect: 4 / 5;
          max-width: min(100vw, 1180px);
          margin: 0 auto;
          animation: remote-enter 560ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }

        .remote-photo-frame {
          border: 1px solid rgba(var(--color-border), 0.44);
          border-radius: clamp(0.95rem, 2.2vw, 1.5rem);
          background:
            radial-gradient(
              130% 145% at 10% 6%,
              rgba(var(--color-accent), 0.14),
              rgba(var(--color-fill), 0.46) 42%,
              rgba(var(--color-fill), 0.92) 100%
            ),
            rgb(var(--color-fill));
          backdrop-filter: blur(14px) saturate(125%);
          -webkit-backdrop-filter: blur(14px) saturate(125%);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.16),
            0 22px 54px rgba(0, 0, 0, 0.22);
        }

        .remote-photo-tile {
          animation: remote-enter 480ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
          animation-delay: 110ms;
        }

        .remote-photo-image {
          width: 100%;
          height: 100%;
          min-height: 150px;
          border-radius: clamp(0.66rem, 1.5vw, 0.95rem);
          border: 1px solid rgba(var(--color-border), 0.42);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.16),
            0 12px 28px rgba(0, 0, 0, 0.2);
          transition:
            transform 0.2s ease,
            filter 0.2s ease,
            box-shadow 0.2s ease;
        }

        .remote-photo-image:hover {
          transform: translateY(-1px) scale(1.01);
          filter: saturate(1.05) brightness(1.02);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.2),
            0 16px 32px rgba(0, 0, 0, 0.24);
        }

        .remote-photo-image-hero {
          min-height: min(76svh, 860px);
          aspect-ratio: var(--remote-aspect);
          background: rgba(var(--color-fill), 0.58);
          padding: 0.4rem;
        }

        .remote-photo-hero {
          justify-content: center;
        }

        .remote-photo-toggle {
          border-radius: 999px;
          color: rgb(var(--color-text-base));
          font-weight: 600;
          border: 1px solid rgba(var(--color-border), 0.52);
          background: linear-gradient(
            135deg,
            rgba(var(--color-card), 0.85),
            rgba(var(--color-fill), 0.42)
          );
          backdrop-filter: blur(12px) saturate(125%);
          -webkit-backdrop-filter: blur(12px) saturate(125%);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.2),
            0 12px 30px rgba(0, 0, 0, 0.22);
        }

        @media (min-width: 768px) and (max-width: 1366px) {
          .remote-photo-shell {
            --remote-aspect: 4 / 3;
          }
        }

        @media (min-width: 680px) and (max-width: 940px) {
          .remote-photo-shell {
            --remote-aspect: 7 / 9;
          }

          .remote-photo-frame {
            border-radius: 0.92rem;
          }

          .remote-photo-image {
            min-height: 112px;
            border-radius: 0.7rem;
          }

          .remote-photo-image-hero {
            min-height: min(70svh, 640px);
          }

          .remote-photo-toggle {
            font-size: 0.86rem;
            padding: 0.5rem 0.85rem;
          }
        }

        @media (min-width: 941px) and (max-width: 1100px) {
          .remote-photo-shell {
            --remote-aspect: 4 / 5;
          }

          .remote-photo-image-hero {
            min-height: min(74svh, 760px);
          }
        }

        @media (max-width: 767px) and (orientation: landscape) {
          .remote-photo-shell {
            --remote-aspect: 16 / 10;
          }
        }

        @keyframes remote-enter {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.988);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .remote-photo-shell,
          .remote-photo-tile {
            animation: none;
          }

          .remote-photo-image {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}
