import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { listGallery } from './repo.js';
import { MEDIA_TAG } from '../revalidate.js';

/**
 * The cached gallery reader. Same double wrap and same 300-second recovery
 * floor as every other public reader here — the reasoning is in
 * lib/content/cache.js and it applies unchanged: `unstable_cache` alone does
 * not dedupe on a cold entry, and an entry warmed against a developer's
 * database can otherwise be baked into .next/cache and shipped.
 */
const RECOVERY_FLOOR_SECONDS = 300;

export const listGalleryCached = cache((locale, limit) =>
  unstable_cache(
    () => listGallery({ locale, limit }),
    ['gallery', String(locale), String(limit)],
    { tags: [MEDIA_TAG], revalidate: RECOVERY_FLOOR_SECONDS },
  )(),
);
