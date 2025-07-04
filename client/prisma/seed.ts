// FILE: prisma/seed.ts
// Seeds the database with initial data, including specific product images.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- Static Data Definitions ---

const categoriesData = [
  { name: "سوسیس و کالباس", icon: "🌭" },
  { name: "سبزی خورشتی", icon: "🥬" },
  { name: "خیارشور و ترشی", icon: "🥒" },
  { name: "قارچ", icon: "🍄" },
  { name: "لبنیات", icon: "🧀" },
  { name: "برنج و حبوبات", icon: "🌾" },
];

const settlementsData = [
    { name: "نقدی", description: "تسویه به صورت نقدی هنگام تحویل" },
    { name: "چک ۱ ماهه", description: "تسویه با چک به تاریخ یک ماه بعد" },
    { name: "چک ۲ ماهه", description: "تسویه با چک به تاریخ دو ماه بعد" },
    { name: "چک ۳ ماهه", description: "تسویه با چک به تاریخ سه ماه بعد" },
];

// Using the product data with original image URLs from the user's file
const productsData = [
  { name: "سوسیس آلمانی درجه یک", price: 1250000, image: "https://jamkharid.ir/uploads/products/500015.jpg?m=crop&w=500&h=500&q=high", categoryName: "سوسیس و کالباس", description: "سوسیس آلمانی با کیفیت بالا و طعم عالی", available: true, discountPercentage: 0 },
  { name: "سبزی خورشت قورمه", price: 850000, image: "https://sabziman.com/images/%D9%82%D9%88%D8%B1%D9%85%D9%87-%D8%AA%D9%87%D8%B1%D8%A7%D9%86%DB%8C-%D8%AE%D8%B1%D8%AF-%D8%B4%D8%AF%D9%87-1.jpg", categoryName: "سبزی خورشتی", description: "سبزی تازه و پاک شده برای خورشت قورمه", available: true, discountPercentage: 10 },
  { name: "خیارشور ممتاز", price: 950000, image: "https://bamomarket.com/images/1660901452322.jpg", categoryName: "خیارشور و ترشی", description: "خیارشور ترش و خوشمزه", available: true, discountPercentage: 0 },
  { name: "قارچ بسته‌ای تازه", price: 750000, image: "https://amirarsalanmushroom.com/wp-content/uploads/2023/04/%DB%B4%DB%B0%DB%B0-%DA%AF%D8%B1%D9%85%DB%8C-400x400.jpg", categoryName: "قارچ", description: "قارچ تازه و پاک شده", available: false, discountPercentage: 0 },
  { name: "پنیر پیتزا موزارلا", price: 2100000, image: "https://img.beroozmart.com/unsafe/files/shop/product/661c44bfac8045bfb5fcfe380213a0a9.jpg", categoryName: "لبنیات", description: "پنیر موزارلا مخصوص پیتزا", available: true, discountPercentage: 5 },
  { name: "برنج هاشمی درجه یک", price: 3200000, image: "https://berangeirani.com/wp-content/uploads/2022/10/hashemi-rice.webp", categoryName: "برنج و حبوبات", description: "برنج هاشمی عطری و باکیفیت", available: true, discountPercentage: 0 },
];

async function main() {
  console.log(`Start seeding ...`);

  // 1. Seed Settlements
  console.log(`Seeding ${settlementsData.length} settlements...`);
  await prisma.settlement.createMany({ data: settlementsData });
  console.log("Settlements seeded successfully.");

  // 2. Seed Categories
  console.log(`Seeding ${categoriesData.length} categories...`);
  await prisma.category.createMany({ data: categoriesData });
  console.log("Categories seeded successfully.");

  // 3. Seed Products
  console.log(`Seeding ${productsData.length} products...`);
  for (const prod of productsData) {
    const category = await prisma.category.findUnique({ where: { name: prod.categoryName } });
    if (category) {
      await prisma.product.create({
        data: {
          name: prod.name,
          price: prod.price,
          description: prod.description,
          available: prod.available,
          discountPercentage: prod.discountPercentage || 0,
          categoryId: category.id,
          image: prod.image // Using original image URL
        },
      });
    }
  }
  console.log("Products seeded successfully.");

  // 4. Create Users
  console.log("Seeding users...");
  const hashedPassword = '$2b$10$e9UmfvfnSvtRxly0dqFlVegEyQ50uQ4tZxLGycXRbYstFpH6V83Cm'; 
  await prisma.user.createMany({
      data: [
          { phone: '09130027927', password: hashedPassword, name: 'حمیدرضا غنی نسب', shopName: 'مدیریت بنک‌شاپ', role: 'ADMIN' },
          { phone: '09120000000', password: hashedPassword, name: 'مشتری تستی', shopName: 'فروشگاه نمونه', role: 'CUSTOMER' },
          { phone: '09100000000', password: hashedPassword, name: 'پیک نمونه', role: 'WORKER' }
      ]
  });
  console.log("Users seeded successfully.");

  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });