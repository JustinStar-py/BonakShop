"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ChevronRight, ChevronLeft } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Banner {
  id: string;
  title?: string;
  image: string;
  link?: string;
}

interface HeroBannerProps {
  banners: Banner[];
}

export default function HeroBanner({ banners }: HeroBannerProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;
    
    const interval = setInterval(nextSlide, 5000); // 5 seconds
    return () => clearInterval(interval);
  }, [nextSlide, isPaused, banners.length]);

  if (!banners || banners.length === 0) {
      // Fallback if no banners
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
    <div 
        className="relative px-4 mt-6 group" 
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slider Container */}
      <div className="relative overflow-hidden rounded-3xl bg-gray-100 shadow-lg aspect-[2/1] md:aspect-[3/1] max-h-[400px]">
        {banners.map((banner, index) => (
            <div 
                key={banner.id}
                className={cn(
                    "absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out",
                    index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                )}
            >
                {/* Background Image */}
                <Image
                    src={banner.image}
                    alt={banner.title || "Banner"}
                    fill
                    className="object-cover"
                    priority={index === 0}
                    unoptimized
                />
                
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:bg-gradient-to-r md:from-black/50 md:via-black/20 md:to-transparent" />

                {/* Content */}
                <div className="absolute bottom-0 right-0 p-6 md:p-10 md:top-0 md:bottom-0 md:left-1/2 flex flex-col justify-end md:justify-center text-right text-white z-20 max-w-lg">
                    {banner.title && (
                        <h2 className="text-xl md:text-3xl font-black mb-3 drop-shadow-md animate-in slide-in-from-right-4 duration-700 delay-100">
                            {banner.title}
                        </h2>
                    )}
                    {banner.link && (
                        <div className="mt-4 animate-in fade-in slide-in-from-bottom-3 duration-700 delay-200">
                            <Button 
                                onClick={() => router.push(banner.link!)}
                                className="bg-white text-black hover:bg-white/90 rounded-full px-6 font-bold"
                                size="sm"
                            >
                                <ShoppingBag size={16} className="ml-2" />
                                مشاهده کنید
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        ))}
      </div>

      {/* Indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {banners.map((_, idx) => (
                <button
                    key={idx}
                    className={cn(
                        "w-2 h-2 rounded-full transition-all duration-300 shadow-sm",
                        idx === currentIndex ? "bg-white w-6" : "bg-white/50 hover:bg-white/80"
                    )}
                    onClick={() => setCurrentIndex(idx)}
                />
            ))}
        </div>
      )}
      
      {/* Navigation Buttons (Visible on Hover) */}
      {banners.length > 1 && (
        <>
            <button 
                onClick={prevSlide}
                className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity z-20 hidden md:flex"
            >
                <ChevronRight size={24} />
            </button>
            <button 
                onClick={nextSlide}
                className="absolute left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity z-20 hidden md:flex"
            >
                <ChevronLeft size={24} />
            </button>
        </>
      )}
    </div>
  );
}