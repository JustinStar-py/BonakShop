"use client";

import Image from "next/image";
import Link from "next/link";

interface PromoBannerProps {
  image: string;
  link: string;
  active?: boolean;
}

export default function PromoBanner({ image, link, active = true }: PromoBannerProps) {
  if (!active) return null;

  return (
    <div className="px-4 mb-5">
      <Link href={link} passHref>
        <div className="relative w-full aspect-[3/1] rounded-2xl overflow-hidden shadow-md cursor-pointer hover:shadow-lg transition-all duration-300 active:scale-[0.98]">
          <Image src={image} alt="Banner" fill className="object-cover" />
        </div>
      </Link>
    </div>
  );
}
