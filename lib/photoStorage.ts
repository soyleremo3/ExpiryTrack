// Copies picked photos into an app-managed, permanent directory (rather than
// keeping expo-image-picker's own cache/temp URI) so they survive
// independently and give us a stable path to clean up later. Uses
// expo-file-system's synchronous File/Directory API (the SDK 54 default
// export), not the older Promise-based `documentDirectory`/`copyAsync` API.
import { Directory, File, Paths } from 'expo-file-system';

function photosDirectory(): Directory {
  const dir = new Directory(Paths.document, 'photos');
  if (!dir.exists) {
    dir.create({ intermediates: true, idempotent: true });
  }
  return dir;
}

// Copies `sourceUri` (e.g. an image-picker result) into our photos
// directory, named after the item so re-saving the same item's photo
// overwrites cleanly. Does NOT delete a previous photo at a different
// filename (different extension) — callers replacing a photo should call
// deletePhoto() with the item's previous photoUri first.
export function copyPhoto(sourceUri: string, itemId: string): string {
  const dir = photosDirectory();
  const source = new File(sourceUri);
  const extension = source.extension || '.jpg';
  const dest = new File(dir, `${itemId}${extension}`);
  if (dest.exists) {
    dest.delete();
  }
  source.copy(dest);
  return dest.uri;
}

export function deletePhoto(photoUri: string | undefined): void {
  if (!photoUri) return;
  try {
    const file = new File(photoUri);
    if (file.exists) file.delete();
  } catch {
    // best effort — a missing/inaccessible file is not worth surfacing
  }
}

// Nukes the entire app-managed photos directory (used by Settings' "clear
// all data") rather than deleting photos one by one, so nothing orphaned is
// left behind even if an item's record and its file had drifted apart.
export function clearAllPhotos(): void {
  try {
    const dir = photosDirectory();
    if (dir.exists) dir.delete();
  } catch {
    // best effort
  }
}
