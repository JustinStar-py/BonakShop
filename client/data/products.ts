// FILE: data/products.ts
type LocalProduct = {
  id: number;
  name: string;
  price: string;
  priceNumber: number;
  image: string;
  category: string;
  description: string;
  ingredients: string;
  storage: string;
  available: boolean;
}

export const products: LocalProduct[] = [
  {
    id: 1,
    name: "سوسیس آلمانی درجه یک",
    price: "۱۲۵,۰۰۰",
    priceNumber: 125000,
    image: "https://jamkharid.ir/uploads/products/500015.jpg?m=crop&w=500&h=500&q=high",
    category: "sausage",
    description: "سوسیس آلمانی با کیفیت بالا و طعم عالی",
    ingredients: "گوشت گاو، گوشت خوک، نمک، ادویه",
    storage: "در یخچال نگهداری شود",
    available: true,
  },
  {
    id: 2,
    name: "سبزی خورشت قورمه",
    price: "۸۵,۰۰۰",
    priceNumber: 85000,
    image: "https://sabziman.com/images/%D9%82%D9%88%D8%B1%D9%85%D9%87-%D8%AA%D9%87%D8%B1%D8%A7%D9%86%DB%8C-%D8%AE%D8%B1%D8%AF-%D8%B4%D8%AF%D9%87-1.jpg",
    category: "vegetables",
    description: "سبزی تازه و پاک شده برای خورشت قورمه",
    ingredients: "جعفری، تره، شنبلیله",
    storage: "در یخچال نگهداری شود",
    available: true,
  },
  {
    id: 3,
    name: "خیارشور ممتاز",
    price: "۹۵,۰۰۰",
    priceNumber: 95000,
    image: "https://bamomarket.com/images/1660901452322.jpg",
    category: "pickles",
    description: "خیارشور ترش و خوشمزه",
    ingredients: "خیار، سرکه، نمک، ادویه",
    storage: "در دمای اتاق نگهداری شود",
    available: true,
  },
  {
    id: 4,
    name: "قارچ بسته‌ای تازه",
    price: "۷۵,۰۰۰",
    priceNumber: 75000,
    image: "https://amirarsalanmushroom.com/wp-content/uploads/2023/04/%DB%B4%DB%B0%DB%B0-%DA%AF%D8%B1%D9%85%DB%8C-400x400.jpg",
    category: "mushrooms",
    description: "قارچ تازه و پاک شده",
    ingredients: "قارچ طبیعی",
    storage: "در یخچال نگهداری شود",
    available: false,
  },
  {
    id: 5,
    name: "پنیر پیتزا موزارلا",
    price: "۲۱۰,۰۰۰",
    priceNumber: 210000,
    image: "https://img.beroozmart.com/unsafe/files/shop/product/661c44bfac8045bfb5fcfe380213a0a9.jpg",
    category: "dairy",
    description: "پنیر موزارلا مخصوص پیتزا",
    ingredients: "شیر، مایه پنیر، نمک",
    storage: "در یخچال نگهداری شود",
    available: true,
  },
  {
    id: 6,
    name: "برنج هاشمی درجه یک",
    price: "۳۲۰,۰۰۰",
    priceNumber: 320000,
    image: "/placeholder.svg?height=120&width=120",
    category: "rice",
    description: "برنج هاشمی عطری و باکیفیت",
    ingredients: "برنج هاشمی",
    storage: "در جای خشک نگهداری شود",
    available: true,
  },
]
