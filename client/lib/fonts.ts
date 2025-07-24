// FILE: lib/fonts.ts
import localFont from "next/font/local";

// Configure the Yekan Bakh font
export const Yekan = localFont({
  src: [
    {
      path: '/../public/fonts/Yekan.ttf',
      weight: '700',
      style: 'bold',
    }
  ],
  variable: '--font-yekan', // A CSS variable to use the font
});

// BYekan is a variable font, so you can use it in your CSS like this:
export const BYekan = localFont({
  src: [
    {
      path: '/../public/fonts/BYekan.ttf',
      weight: '700',
      style: 'bolder',
    }
  ],
  variable: '--font-yekan-bakh', // A CSS variable to use the font
});

// Parastoo is a variable font, so you can use it in your CSS like this:
export const Samim = localFont({
  src: [
    {
      path: '/../public/fonts/Samim.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '/../public/fonts/Samim-Bold.ttf',
      weight: '800',
      style: 'bold',
    }
  ],
  variable: '--font-samim', // A CSS variable to use the font
});