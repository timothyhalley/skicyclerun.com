export async function getAlbumPhotos(album: any) {
  const res = await fetch(
    `https://api.skicyclerun.com/getphotosrandom?bucketName=skicyclerun.lib&albumPath=albums/${album}/&numPhotos=50`
  );
  let photos = await res.json();
  if (photos.length == 0) {
    console.log("👎 ERROR: remote API call return zero items for pictures/album");

    // get src images as an alternative (SVG)
    const imageObject = await import.meta.glob<{ default: ImageMetadata }>(
      "./src/images/*.{jpeg,jpg,png,gif,svg}"
    );
    // console.log("DEBUG: LIB - BEFORE: 👉", imageObject)
    const imageArray = Object.keys(imageObject);

    photos = imageArray;

  }
  // console.log("DEBUG: LIB AFTER: 👉", photos)
  return photos;
}

export function getRandomImage(
  imagesObject: Record<string, () => Promise<{ default: ImageMetadata }>>
) {
  const imagePaths = Object.keys(imagesObject);
  const randomIndex = Math.floor(Math.random() * imagePaths.length);
  const randomImagePath = imagePaths[randomIndex];
  // console.log("DEBUG: getRandomImage: 👉", randomImagePath, " -- obj: ", imagesObject[randomImagePath]);
  // return imagesObject[randomImagePath];
  return randomImagePath;
}

export function getFileName(path: string | null): string {
  if (path != null) {
    const matchResult = path.match(/[-_\w]+[.][\w]+$/i);
    if (matchResult) {
      return matchResult[0];
    } else {
      return "imageNotFound";
    }
  } else {
    return "imageNotFound";
  }
}