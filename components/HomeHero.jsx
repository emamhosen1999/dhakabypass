'use client';

import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowRight, MapPin, ChevronDown, X } from 'lucide-react';

/**
 * Hero + route-map dialog. Client component because the original had a scroll
 * parallax on the background, a mount fade-in, and a Radix dialog for the map.
 */
export default function HomeHero({ content }) {
  const [offset, setOffset] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
    const onScroll = () => setOffset(window.scrollY * 0.5);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const {
    logo,
    backgroundImage,
    headline,
    subheadline,
    primaryCta = {},
    routeMapButton,
    routeMapImage,
  } = content || {};

  return (
    <div className="relative h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-blue-800/90" />
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('${backgroundImage}')`,
          transform: `translateY(${offset}px)`,
          opacity: 0.3,
        }}
      />

      <div className="container mx-auto px-4 z-10 text-center">
        <div
          className="text-white transform transition-all duration-1000"
          style={{ opacity: loaded ? 1 : 0 }}
        >
          <div className="w-32 h-32 mx-auto mb-8 bg-white rounded-xl flex items-center justify-center">
            <img src={logo} alt="Logo" className="w-24 h-24" />
          </div>
          <h1 className="text-4xl lg:text-6xl font-bold mb-4 text-shadow-lg uppercase">
            {headline}
          </h1>
          <p className="text-xl lg:text-2xl mb-8 max-w-3xl mx-auto text-shadow">{subheadline}</p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href={primaryCta.href || '#overview'}
              className="bg-blue-700 hover:bg-blue-600 text-white px-8 py-3 rounded-md transition-all flex items-center justify-center shadow-lg"
            >
              {primaryCta.label} <ArrowRight width={18} height={18} className="ml-2" />
            </a>

            <Dialog.Root>
              <Dialog.Trigger asChild>
                <button
                  type="button"
                  className="bg-orange-500 hover:bg-orange-400 text-white px-8 py-3 rounded-md transition-all flex items-center justify-center shadow-lg cursor-pointer"
                >
                  {routeMapButton} <MapPin width={18} height={18} className="ml-2" />
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
                <Dialog.Content className="bg-white fixed top-[50%] left-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border shadow-lg duration-200 sm:max-w-lg max-w-4xl p-0">
                  <Dialog.Title className="sr-only">Dhaka Bypass Route Map</Dialog.Title>
                  <Dialog.Description className="sr-only">
                    Route map of the Dhaka Bypass Expressway
                  </Dialog.Description>
                  <div className="relative w-full h-full">
                    <img
                      alt="Dhaka Bypass Route Map"
                      width={1200}
                      height={800}
                      className="w-full h-auto rounded-lg"
                      src={routeMapImage}
                    />
                  </div>
                  <Dialog.Close className="absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2">
                    <X />
                    <span className="sr-only">Close</span>
                  </Dialog.Close>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </div>
      </div>

      <div className="absolute bottom-10 left-0 right-0 flex justify-center animate-bounce">
        <a
          href="#overview"
          className="text-white bg-black/20 p-2 rounded-full backdrop-blur-sm"
        >
          <ChevronDown width={36} height={36} />
        </a>
      </div>
    </div>
  );
}
