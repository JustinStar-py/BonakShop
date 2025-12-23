"use client";

import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Button } from "@/components/ui/button";
import { CartLinear, AltArrowRightLinear, AltArrowLeftLinear } from "@solar-icons/react-perf";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Banner {
  id: string;
  title?: string | null;
  image: string;
  link?: string | null;
}

interface HeroBannerProps {
  banners: Banner[];
}

export default function HeroBanner({ banners }: HeroBannerProps) {
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Embla hook
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      direction: "rtl",
      align: "center",
      containScroll: false,
      skipSnaps: false,
      slidesToScroll: 1
    },
    [Autoplay({ delay: 5000, stopOnInteraction: false })]
  );

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  if (!banners || banners.length === 0) {
    return (
      <div className="px-4 mt-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-stone-500 to-green-400 text-white shadow-xl min-h-[200px] flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-xl font-black mb-2">بهار نارون</h1>
            <p>خرید سریع و آسان</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group">
      {/* Embla Viewport */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex touch-pan-y">
          {banners.map((banner, index) => {
            const isActive = index === selectedIndex;
            return (
              <div
                key={banner.id}
                className="flex-[0_0_90%] md:flex-[0_0_80%] min-w-0 relative py-4 transition-all duration-500 ease-out"
                style={{
                  transform: isActive ? "scale(1)" : "scale(0.9)",
                  opacity: isActive ? 1 : 0.7,
                  zIndex: isActive ? 10 : 1
                }}
              >
                <div
                  className={cn(
                    "relative overflow-hidden rounded-3xl aspect-[2/1] md:aspect-[2.4/1] max-h-[450px] w-full duration-300",
                    isActive ? "ring-4 ring-stone-500/20" : ""
                  )}
                >
                  {/* Background Image */}
                  <Image
                    src={banner.image}
                    alt={banner.title || "Banner"}
                    fill
                    className="object-cover"
                    priority={index === 0}
                    sizes="(max-width: 768px) 90vw, (max-width: 1024px) 80vw, 70vw"
                  />

                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent md:bg-gradient-to-r md:from-black/60 md:via-black/30 md:to-transparent" />

                  {/* Content */}
                  <div
                    className={cn(
                      "absolute bottom-0 right-0 p-6 md:p-10 md:top-0 md:bottom-0 md:left-1/2 flex flex-col justify-end md:justify-center text-right text-white z-20 max-w-lg transition-all duration-700 delay-100",
                      isActive
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-8"
                    )}
                  >
                    {banner.title && (
                      <h2 className="text-xl md:text-3xl lg:text-4xl font-black mb-3 leading-tight">
                        {banner.title}
                      </h2>
                    )}
                    {banner.link && (
                      <div className="mt-4">
                        <Button
                          onClick={() => router.push(banner.link!)}
                          className="bg-white text-black hover:bg-white/90 rounded-full px-6 font-bold transform transition hover:scale-105"
                          size="sm"
                        >
                          <CartLinear size={18} className="ml-2" />
                          مشاهده کنید
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Buttons */}
      <button
        onClick={scrollPrev}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/30 backdrop-blur-md hover:bg-white/50 flex items-center justify-center text-white shadow-md transition-all z-20 hidden md:flex opacity-0 group-hover:opacity-100"
      >
        <AltArrowRightLinear size={32} />
      </button>
      <button
        onClick={scrollNext}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/30 backdrop-blur-md hover:bg-white/50 flex items-center justify-center text-white shadow-md transition-all z-20 hidden md:flex opacity-0 group-hover:opacity-100"
      >
        <AltArrowLeftLinear size={32} />
      </button>

      {/* Pagination */}
      {banners.length > 1 && (
        <div className="absolute bottom-3 md:bottom-5 left-1/2 -translate-x-1/2 z-20">
          <div className="flex items-center gap-1.5 rounded-full bg-black/25 backdrop-blur-md px-2 py-1.5 border border-white/15 shadow-lg">
            {banners.map((_, idx) => {
              const isActive = idx === selectedIndex;
              return (
                <button
                  key={idx}
                  onClick={() => scrollTo(idx)}
                  type="button"
                  aria-label={`رفتن به اسلاید ${idx + 1}`}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    // Override global mobile touch-target min sizes (some global CSS sets 44px)
                    "!min-h-0 !min-w-0 p-0 h-1.5 rounded-full transition-all duration-300",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black/30",
                    isActive
                      ? "w-6 bg-white shadow-sm"
                      : "w-1.5 bg-white/40 hover:bg-white/65"
                  )}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
