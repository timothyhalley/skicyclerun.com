import { useState, useEffect } from "react";
import type { ImageMetadata } from "astro";

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
        console.log("✅ API Response Data:", data);

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
          console.warn(
            "⚠️ Unexpected response format from photo API, falling back to local images",
          );
          const local = await getLocalPhotos();
          setPhotos(local);
        }
      } catch (error) {
        console.warn(
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
    console.log(
      `🔄 Cycling photos, new offset: ${(cycleOffset + 1) % photos.length}`,
    );
  };

  const toggleView = () => {
    setViewMode((prev) => (prev === "gallery" ? "hero" : "gallery"));
    console.log(
      `🧨 Toggled view to: ${viewMode === "gallery" ? "hero" : "gallery"}`,
    );
  };

  if (loading) {
    return <div className="p-4 text-center">Loading photos...</div>;
  }

  if (photos.length === 0) {
    return <div className="p-4 text-center">No photos available</div>;
  }

  console.log(`📸 Rendering ${photos.length} photos in ${viewMode} mode`);

  // Calculate which photos to display based on cycle offset
  const getPhotoAtIndex = (index: number) =>
    photos[(cycleOffset + index) % photos.length];

  return (
    <div className="photo-gallery-container">
      {/* Gallery View - 6 photos in grid */}
      {viewMode === "gallery" && (
        <div className="lg:px-32 lg:pt-24 container mx-auto px-5 py-2">
          <div className="md:-m-2 -m-1 flex flex-wrap">
            {/* Left column - 3 photos */}
            <div className="flex w-1/2 flex-wrap">
              {[0, 1, 2].map((index) => {
                const photo = getPhotoAtIndex(index);
                return (
                  <div
                    key={index}
                    className={`md:p-2 ${index === 2 ? "w-full" : "w-1/2"} p-1 cursor-pointer`}
                    onClick={handleImageClick}
                  >
                    {photo?.src && (
                      <img
                        src={photo.src}
                        alt={photo.altText}
                        className="block h-full w-full rounded-lg object-cover object-center"
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
                    className={`md:p-2 ${index === 3 ? "w-full" : "w-1/2"} p-1 cursor-pointer`}
                    onClick={handleImageClick}
                  >
                    {photo?.src && (
                      <img
                        src={photo.src}
                        alt={photo.altText}
                        className="block h-full w-full rounded-lg object-cover object-center"
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
        <div className="lg:px-32 lg:pt-24 container mx-auto px-5 py-2">
          <div
            className="md:-m-2 -m-1 flex flex-wrap cursor-pointer"
            onClick={handleImageClick}
          >
            {getPhotoAtIndex(0)?.src && (
              <img
                src={getPhotoAtIndex(0).src}
                alt={getPhotoAtIndex(0).altText}
                className="block h-full w-full rounded-lg object-cover object-center"
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
          className="mt-4 rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700 transition-colors"
        >
          {viewMode === "gallery" ? "Hero View" : "Gallery View"}
        </button>
      </div>
    </div>
  );
}
