'use client';

import { useCallback, useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Gallery grid with a lightbox.
 *
 * The original /gallery page rendered a grid of empty gray squares and never
 * displayed any of the 36 real photos in /public/photo. This shows them, with
 * keyboard-navigable full-size viewing.
 */
export default function GalleryGrid({ images = [] }) {
  const [index, setIndex] = useState(null);
  const open = index !== null;

  const close = useCallback(() => setIndex(null), []);
  const prev = useCallback(
    () => setIndex((i) => (i === null ? i : (i - 1 + images.length) % images.length)),
    [images.length]
  );
  const next = useCallback(
    () => setIndex((i) => (i === null ? i : (i + 1) % images.length)),
    [images.length]
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, prev, next]);

  const current = open ? images[index] : null;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((img, i) => (
          <button
            key={img.id ?? img.file}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={img.caption || `Open photo ${i + 1}`}
            className="group aspect-square bg-gray-200 rounded-md shadow-md hover:shadow-lg transition-all overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <img
              src={img.file}
              alt={img.caption || `Dhaka Bypass Expressway photo ${i + 1}`}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      <Dialog.Root open={open} onOpenChange={(o) => !o && close()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80" />
          <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center p-4 focus:outline-none">
            <Dialog.Title className="sr-only">
              {current?.caption || 'Gallery photo'}
            </Dialog.Title>
            <Dialog.Description className="sr-only">
              Photo {open ? index + 1 : 0} of {images.length}
            </Dialog.Description>

            {current && (
              <figure className="relative max-w-5xl w-full">
                <img
                  src={current.file}
                  alt={current.caption || `Dhaka Bypass Expressway photo ${index + 1}`}
                  className="w-full max-h-[80vh] object-contain rounded-lg"
                />
                {current.caption && (
                  <figcaption className="mt-3 text-center text-white/90 text-sm">
                    {current.caption}
                  </figcaption>
                )}
                <div className="mt-2 text-center text-white/60 text-xs">
                  {index + 1} / {images.length}
                </div>
              </figure>
            )}

            <button
              type="button"
              onClick={prev}
              aria-label="Previous photo"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/40 hover:bg-black/60 rounded-full p-3 transition-all"
            >
              <ChevronLeft />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next photo"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/40 hover:bg-black/60 rounded-full p-3 transition-all"
            >
              <ChevronRight />
            </button>

            <Dialog.Close
              aria-label="Close"
              className="absolute top-4 right-4 text-white bg-black/40 hover:bg-black/60 rounded-full p-2 transition-all"
            >
              <X />
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
