/**
 * Shared client-side store for the active photo state.
 *
 * Because inline ↔ full-page transitions use window.location.assign() (a full
 * page reload), a plain JS module singleton is re-initialised on each load.
 * We back the store with sessionStorage so the state survives navigation within
 * the same tab while being automatically scoped per-tab and per-album.
 *
 * Priority when reading the initial state:
 *   1. URL ?index / ?src params (explicit handoff from the other mode)
 *   2. sessionStorage entry for this album
 *   3. Defaults (index 0, src "")
 */

const KEY_PREFIX = "photo-active-state-v1:";

export interface PhotoActiveState {
  index: number;
  src: string;
}

export type PhotoViewType = "hero" | "gallery" | "carousel";

const DEFAULT_VIEW: PhotoViewType = "hero";

function isPhotoViewType(value: string): value is PhotoViewType {
  return value === "hero" || value === "gallery" || value === "carousel";
}

function storeKey(album: string): string {
  return `${KEY_PREFIX}${album}`;
}

/** Read the persisted active state for an album. Returns defaults if nothing stored. */
export function getActivePhotoState(album: string): PhotoActiveState {
  if (!album) return { index: 0, src: "" };
  try {
    const raw = sessionStorage.getItem(storeKey(album));
    if (raw) {
      const parsed = JSON.parse(raw);
      const index = Number(parsed?.index);
      const src = typeof parsed?.src === "string" ? parsed.src : "";
      if (Number.isFinite(index) && index >= 0) {
        return { index, src };
      }
    }
  } catch {
    // sessionStorage may be unavailable (private mode restrictions etc.)
  }
  return { index: 0, src: "" };
}

/** Persist the active state for an album. */
export function setActivePhotoState(
  album: string,
  index: number,
  src: string,
): void {
  if (!album) return;
  const view = getPhotoViewState(album);
  try {
    sessionStorage.setItem(storeKey(album), JSON.stringify({ index, src, view }));
  } catch {
    // ignore write failures
  }
}

/** Remove the active state entry for an album (e.g. on album change). */
export function clearActivePhotoState(album: string): void {
  if (!album) return;
  try {
    sessionStorage.removeItem(storeKey(album));
  } catch {
    // ignore
  }
}

/**
 * Resolve the initial active state from URL params (highest priority) falling
 * back to the sessionStorage store, then to defaults.
 *
 * Call this once at page-init time before any other state mutations.
 */
export function resolveInitialPhotoState(album: string): PhotoActiveState {
  const url = new URL(window.location.href);
  const urlIndex = Number(url.searchParams.get("index") ?? "-1");
  const urlSrc = url.searchParams.get("src") || "";

  const stored = getActivePhotoState(album);

  const index =
    Number.isFinite(urlIndex) && urlIndex >= 0 ? urlIndex : stored.index;
  const src = urlSrc || stored.src;

  return { index, src };
}

/** Read the persisted selected view for an album. */
export function getPhotoViewState(album: string): PhotoViewType {
  if (!album) return DEFAULT_VIEW;
  try {
    const raw = sessionStorage.getItem(storeKey(album));
    if (raw) {
      const parsed = JSON.parse(raw);
      const view = typeof parsed?.view === "string" ? parsed.view : "";
      if (isPhotoViewType(view)) {
        return view;
      }
    }
  } catch {
    // ignore read failures
  }
  return DEFAULT_VIEW;
}

/** Persist selected view for an album while preserving index/src. */
export function setPhotoViewState(album: string, view: PhotoViewType): void {
  if (!album) return;
  const prev = getActivePhotoState(album);
  try {
    sessionStorage.setItem(
      storeKey(album),
      JSON.stringify({
        index: prev.index,
        src: prev.src,
        view,
      }),
    );
  } catch {
    // ignore write failures
  }
}

/**
 * Resolve initial selected view from URL (highest priority), then store,
 * then default.
 */
export function resolveInitialPhotoView(
  album: string,
  urlView: string | null,
): PhotoViewType {
  if (urlView && isPhotoViewType(urlView)) {
    return urlView;
  }
  return getPhotoViewState(album);
}
