export const PHOTO_ACTIVE_INDEX_CHANGE_EVENT = "photo:active-index-change";
export const PHOTO_ACTIVE_INDEX_SYNC_EVENT = "photo:active-index-sync";

export function parseRequestedPhotoIndex(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return Math.max(0, Math.trunc(fallback));
  return Math.max(0, Math.trunc(parsed));
}

export function normalizePhotoIndex(
  value: unknown,
  length: number,
  fallback = 0,
): number {
  const size = Math.max(0, Math.trunc(Number(length)));
  if (size <= 0) return 0;

  const parsed = Number(value);
  const base = Number.isFinite(parsed)
    ? Math.trunc(parsed)
    : Math.trunc(fallback);
  return ((base % size) + size) % size;
}

export function getGalleryPageIndexForPhotoIndex(
  index: number,
  visibleCount: number,
  length: number,
): number {
  const size = Math.max(1, Math.trunc(Number(visibleCount)) || 1);
  const total = Math.max(0, Math.trunc(Number(length)));
  if (total <= 0) return 0;
  const normalized = normalizePhotoIndex(index, total, 0);
  return Math.floor(normalized / size);
}

export function getGalleryStartIndexForPage(
  pageIndex: number,
  visibleCount: number,
  length: number,
): number {
  const size = Math.max(1, Math.trunc(Number(visibleCount)) || 1);
  const total = Math.max(0, Math.trunc(Number(length)));
  if (total <= 0) return 0;
  const pageCount = Math.max(1, Math.ceil(total / size));
  const normalizedPage =
    ((Math.trunc(Number(pageIndex)) % pageCount) + pageCount) % pageCount;
  return normalizedPage * size;
}