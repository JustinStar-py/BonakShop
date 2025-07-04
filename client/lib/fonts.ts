// FILE: lib/fonts.ts
import localFont from "next/font/local";

// Configure the Yekan Bakh font
export const Yekan = localFont({
  src: [
    {
      path: '../public/fonts/Yekan.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../public/fonts/Yekan.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/Yekan.woff2',
      weight: '700',
      style: 'normal',
    },
    {
        path: '../public/fonts/YekanBakh-ExtraBold.woff2',
        weight: '800',
        style: 'normal',
    },
  ],
  variable: '--font-yekan-bakh', // A CSS variable to use the font
});