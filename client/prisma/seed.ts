// FILE: prisma/seed.ts
// Final Version: This script cleans the database and seeds it with fresh, structured data,
// including sample orders for a more realistic development environment.

import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log(`🌱 Start seeding ...`);

  // --- 1. Deleting all existing data in the correct order ---
  console.log("🔥 Deleting existing data to prevent conflicts...");
  await prisma.returnRequestItem.deleteMany({});
  await prisma.returnRequest.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.settlement.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.distributor.deleteMany({});
  await prisma.user.deleteMany({});
  console.log("✅ All previous data deleted successfully.");

  // --- 2. Seeding Categories, Suppliers, and Distributors ---
  console.log("🏭 Seeding core business models...");
  const categories = await prisma.category.createManyAndReturn({
    data: [
      { name: "سوسیس و کالباس", icon: "🌭" },
      { name: "لبنیات", icon: "🧀" },
      { name: "تخم مرغ", icon: "🥚" },
      { name: "نوشیدنی", icon: "🥤" },
    ],
  });
  const categoryMap = new Map(categories.map(c => [c.name, c.id]));

  const suppliers = await prisma.supplier.createManyAndReturn({
    data: [
      { name: "کاله", logo: "https://www.kalleh.com/template/img/logo.png" },
      { name: "میهن", logo: "https://www.mihan-food.com/images/logo-fa.png" },
      { name: "سیمرغ", logo: "https://simorgh.com/wp-content/uploads/2020/06/logo.png" },
      { name: "آندره", logo: "https://andre.ir/wp-content/uploads/2021/01/logo-andre.png" },
      { name: "پگاه", logo: "https://pegah.ir/wp-content/uploads/2019/07/logo-pegah.png" },
    ],
  });
  const supplierMap = new Map(suppliers.map(s => [s.name, s.id]));

  const distributors = await prisma.distributor.createManyAndReturn({
    data: [
      { name: "پخش الغدیر" },
      { name: "پخش مرکزی" },
      { name: "پخش البرز" },
    ],
  });
  const distributorMap = new Map(distributors.map(d => [d.name, d.id]));
  console.log("✅ Categories, Suppliers, and Distributors seeded.");

  // --- 3. Seeding Products ---
  console.log("📦 Seeding products...");
  const products = await prisma.product.createManyAndReturn({
    data: [
      {
        name: "هات داگ پنیری آندره", price: 1500000,
        image: "https://api.snapp.market/media/cache/product-image/1687259469_247343_1_260x260.jpg",
        categoryId: categoryMap.get("سوسیس و کالباس")!,
        supplierId: supplierMap.get("آندره")!,
        distributorId: distributorMap.get("پخش مرکزی")!,
        stock: 100, unit: "بسته"
      },
      {
        name: "کالباس خشک کاله", price: 2200000,
        image: "https://api.snapp.market/media/cache/product-image/1608722744_419208_1_260x260.jpg",
        categoryId: categoryMap.get("سوسیس و کالباس")!,
        supplierId: supplierMap.get("کاله")!,
        distributorId: distributorMap.get("پخش البرز")!,
        stock: 50, unit: "کیلوگرم"
      },
      {
        name: "تخم مرغ ۲۰ عددی سیمرغ", price: 980000,
        image: "https://api.snapp.market/media/cache/product-image/1608722744_419208_1_260x260.jpg",
        categoryId: categoryMap.get("تخم مرغ")!,
        supplierId: supplierMap.get("سیمرغ")!,
        distributorId: distributorMap.get("پخش الغدیر")!,
        stock: 200, unit: "بسته", discountPercentage: 10
      },
      {
        name: "پنیر پیتزا موزارلا کاله", price: 2100000,
        image: "https://img.beroozmart.com/unsafe/files/shop/product/661c44bfac8045bfb5fcfe380213a0a9.jpg",
        categoryId: categoryMap.get("لبنیات")!,
        supplierId: supplierMap.get("کاله")!,
        distributorId: distributorMap.get("پخش مرکزی")!,
        stock: 80, unit: "کیلوگرم"
      },
      {
        name: "شیر کم چرب ۱ لیتری میهن", price: 450000,
        image: "https://api.snapp.market/media/cache/product-image/1687259469_247343_1_260x260.jpg",
        categoryId: categoryMap.get("لبنیات")!,
        supplierId: supplierMap.get("میهن")!,
        distributorId: distributorMap.get("پخش الغدیر")!,
        stock: 150, unit: "عدد"
      },
    ]
  });
  const productMap = new Map(products.map(p => [p.name, p]));
  console.log("✅ Products seeded.");

  // --- 4. Seeding Users and Settlements ---
  console.log("👤 Seeding users and settlements...");
  const settlements = await prisma.settlement.createManyAndReturn({
    data: [{ name: "نقدی" }, { name: "چک ۱ ماهه" }],
  });
  const cashSettlementId = settlements.find(s => s.name === "نقدی")!.id;

  const hashedPassword = '$2b$10$e9UmfvfnSvtRxly0dqFlVegEyQ50uQ4tZxLGycXRbYstFpH6V83Cm'; // "password"
  const customer = await prisma.user.create({
    data: {
      phone: '09120000000',
      password: hashedPassword,
      name: 'مشتری تستی',
      shopName: 'فروشگاه نمونه',
      role: 'CUSTOMER'
    }
  });
  await prisma.user.createMany({
    data: [
      { phone: '09130027927', password: hashedPassword, name: 'حمیدرضا غنی نسب', role: 'ADMIN' },
      { phone: '09100000000', password: hashedPassword, name: 'پیک نمونه', role: 'WORKER' },
    ]
  });
  console.log("✅ Users and settlements seeded.");

  // --- 5. Seeding Sample Orders ---
  console.log("🛒 Seeding sample orders...");
  const hotdog = productMap.get("هات داگ پنیری آندره")!;
  const milk = productMap.get("شیر کم چرب ۱ لیتری میهن")!;
  const egg = productMap.get("تخم مرغ ۲۰ عددی سیمرغ")!;

  // Order 1: Pending
  await prisma.order.create({
    data: {
      userId: customer.id,
      settlementId: cashSettlementId,
      deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      status: 'PENDING',
      totalPrice: (hotdog.price * 2) + milk.price,
      items: {
        create: [
          { productName: hotdog.name, quantity: 2, price: hotdog.price },
          { productName: milk.name, quantity: 1, price: milk.price },
        ]
      }
    }
  });

  // Order 2: Delivered
  const eggPriceWithDiscount = egg.price * (1 - egg.discountPercentage / 100);
  await prisma.order.create({
    data: {
      userId: customer.id,
      settlementId: cashSettlementId,
      deliveryDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      status: 'DELIVERED',
      totalPrice: eggPriceWithDiscount * 5,
      items: {
        create: [
          { productName: egg.name, quantity: 5, price: eggPriceWithDiscount },
        ]
      }
    }
  });
  console.log("✅ Sample orders seeded.");

  console.log(`\n🎉 Seeding finished successfully!`);
}

main()
  .catch((e) => {
    console.error("❌ An error occurred during seeding:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });