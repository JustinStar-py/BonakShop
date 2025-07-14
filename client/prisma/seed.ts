// FILE: prisma/seed.ts
// Final Version: This script cleans the database and seeds it with fresh, structured data.
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // --- 1. Deleting all existing data in the correct order ---
  console.log("Deleting existing data to prevent conflicts...");
  await prisma.returnRequestItem.deleteMany({});
  await prisma.returnRequest.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.settlement.deleteMany({});
  await prisma.user.deleteMany({});
  console.log("All previous data deleted successfully.");

  // --- 2. Seeding Categories ---
  console.log("Seeding categories...");
  const categories = await prisma.category.createManyAndReturn({
    data: [
      { name: "سوسیس و کالباس", icon: "🌭" },
      { name: "سبزی خورشتی", icon: "🥬" },
      { name: "خیارشور و ترشی", icon: "🥒" },
      { name: "قارچ", icon: "🍄" },
      { name: "لبنیات", icon: "🧀" },
      { name: "برنج و حبوبات", icon: "🌾" },
    ],
  });
  console.log(`${categories.length} categories seeded.`);
  
  // Create a map for easy category lookup
  const categoryMap = new Map(categories.map(c => [c.name, c.id]));

  // --- 3. Seeding Products ---
  console.log("Seeding products...");
  await prisma.product.createMany({
    data: [
      {
        name: "سوسیس آلمانی درجه یک",
        price: 1250000,
        image: "https://jamkharid.ir/uploads/products/500015.jpg?m=crop&w=500&h=500&q=high",
        categoryId: categoryMap.get("سوسیس و کالباس")!,
        description: "سوسیس آلمانی با کیفیت بالا و طعم عالی",
        available: true,
        discountPercentage: 0,
        unit: "عدد",
        stock: 120
      },
      {
        name: "سبزی خورشت قورمه",
        price: 850000,
        image: "https://sabziman.com/images/%D9%82%D9%88%D8%B1%D9%85%D9%87-%D8%AA%D9%87%D8%B1%D8%A7%D9%86%DB%8C-%D8%AE%D8%B1%D8%AF-%D8%B4%D8%AF%D9%87-1.jpg",
        categoryId: categoryMap.get("سبزی خورشتی")!,
        description: "سبزی تازه و پاک شده برای خورشت قورمه",
        available: true,
        discountPercentage: 10,
        unit: "بسته",
        stock: 50
      },
      {
        name: "خیارشور ممتاز",
        price: 950000,
        image: "https://bamomarket.com/images/1660901452322.jpg",
        categoryId: categoryMap.get("خیارشور و ترشی")!,
        description: "خیارشور ترش و خوشمزه",
        available: true,
        discountPercentage: 0,
        unit: "دبه",
        stock: 30
      },
      {
        name: "قارچ بسته‌ای تازه",
        price: 750000,
        image: "https://amirarsalanmushroom.com/wp-content/uploads/2023/04/%DB%B4%DB%B0%DB%B0-%DA%AF%D8%B1%D9%85%DB%8C-400x400.jpg",
        categoryId: categoryMap.get("قارچ")!,
        description: "قارچ تازه و پاک شده",
        available: false,
        discountPercentage: 0,
        unit: "بسته",
        stock: 0
      },
      {
        name: "پنیر پیتزا موزارلا",
        price: 2100000,
        image: "https://img.beroozmart.com/unsafe/files/shop/product/661c44bfac8045bfb5fcfe380213a0a9.jpg",
        categoryId: categoryMap.get("لبنیات")!,
        description: "پنیر موزارلا مخصوص پیتزا",
        available: true,
        discountPercentage: 5,
        unit: "کیلوگرم",
        stock: 20
      },
      {
        name: "برنج هاشمی درجه یک",
        price: 3200000,
        image: "https://berangeirani.com/wp-content/uploads/2022/10/hashemi-rice.webp",
        categoryId: categoryMap.get("برنج و حبوبات")!,
        description: "برنج هاشمی عطری و باکیفیت",
        available: true,
        discountPercentage: 0,
        unit: "کیلوگرم",
        stock: 200
      },
    ]
  });
  console.log("6 products seeded.");

  // --- 4. Seeding Settlement Options ---
  console.log("Seeding settlement options...");
  const settlements = await prisma.settlement.createManyAndReturn({
    data: [
        { name: "نقدی", description: "تسویه به صورت نقدی هنگام تحویل" },
        { name: "چک ۱ ماهه", description: "تسویه با چک به تاریخ یک ماه بعد" },
        { name: "چک ۲ ماهه", description: "تسویه با چک به تاریخ دو ماه بعد" },
        { name: "چک ۳ ماهه", description: "تسویه با چک به تاریخ سه ماه بعد" },
    ]
  });
  const cashSettlement = settlements.find(s => s.name === "نقدی")!;
  console.log(`${settlements.length} settlement options seeded.`);

  // --- 5. Seeding Users ---
  console.log("Seeding users...");
  const hashedPassword = '$2b$10$e9UmfvfnSvtRxly0dqFlVegEyQ50uQ4tZxLGycXRbYstFpH6V83Cm'; // "password"
  
  const customer = await prisma.user.create({ 
      data: { 
          phone: '09120000000', 
          password: hashedPassword, 
          name: 'مشتری تستی', 
          shopName: 'فروشگاه نمونه', 
          shopAddress: 'تهران، میدان آزادی، پلاک ۱', 
          role: 'CUSTOMER',
          latitude: 35.6997, 
          longitude: 51.3381
      } 
  });

  await prisma.user.createMany({
      data: [
          { phone: '09130027927', password: hashedPassword, name: 'حمیدرضا غنی نسب', shopName: 'مدیریت بنک‌شاپ', role: 'ADMIN' },
          { phone: '09100000000', password: hashedPassword, name: 'پیک نمونه', role: 'WORKER' }
      ]
  });
  console.log("3 users seeded.");

  // --- 6. Seeding sample orders ---
  console.log("Seeding sample orders...");
  // A SHIPPED order for the delivery panel
  await prisma.order.create({
      data: {
          totalPrice: 2500000,
          deliveryDate: new Date(),
          status: 'SHIPPED',
          userId: customer.id,
          settlementId: cashSettlement.id,
          items: {
              create: [{ productName: "سوسیس آلمانی درجه یک", quantity: 2, price: 1250000 }]
          }
      }
  });
  // A PENDING order for the customer to manage
   await prisma.order.create({
      data: {
          totalPrice: 1600000,
          deliveryDate: new Date(Date.now() + 2 * 86400000), // 2 days from now
          status: 'PENDING',
          userId: customer.id,
          settlementId: cashSettlement.id,
          items: {
              create: [{ productName: "برنج هاشمی درجه یک", quantity: 5, price: 3200000 }]
          }
      }
  });
  console.log("2 sample orders seeded.");

  console.log(`\n✅ Seeding finished successfully!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });