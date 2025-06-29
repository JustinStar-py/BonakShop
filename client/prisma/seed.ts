// FILE: prisma/seed.ts (Final version with your complete data)
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

const categoriesData = [
  { name: "سوسیس و کالباس", icon: "🌭" },
  { name: "سبزی خورشتی", icon: "🥬" },
  { name: "خیارشور و ترشی", icon: "🥒" },
  { name: "قارچ", icon: "🍄" },
  { name: "لبنیات", icon: "🧀" },
  { name: "برنج و حبوبات", icon: "🌾" },
];

const productsData = [
  {
    name: "سوسیس آلمانی درجه یک",
    price: 1250000,
    image: "https://jamkharid.ir/uploads/products/500015.jpg?m=crop&w=500&h=500&q=high",
    categoryName: "سوسیس و کالباس",
    description: "سوسیس آلمانی با کیفیت بالا و طعم عالی",
    available: true,
  },
  {
    name: "سبزی خورشت قورمه",
    price: 850000,
    image: "https://sabziman.com/images/%D9%82%D9%88%D8%B1%D9%85%D9%87-%D8%AA%D9%87%D8%B1%D8%A7%D9%86%DB%8C-%D8%AE%D8%B1%D8%AF-%D8%B4%D8%AF%D9%87-1.jpg",
    categoryName: "سبزی خورشتی",
    description: "سبزی تازه و پاک شده برای خورشت قورمه",
    available: true,
  },
  {
    name: "خیارشور ممتاز",
    price: 950000,
    image: "https://bamomarket.com/images/1660901452322.jpg",
    categoryName: "خیارشور و ترشی",
    description: "خیارشور ترش و خوشمزه",
    available: true,
  },
  {
    name: "قارچ بسته‌ای تازه",
    price: 750000,
    image: "https://amirarsalanmushroom.com/wp-content/uploads/2023/04/%DB%B4%DB%B0%DB%B0-%DA%AF%D8%B1%D9%85%DB%8C-400x400.jpg",
    categoryName: "قارچ",
    description: "قارچ تازه و پاک شده",
    available: false,
  },
  {
    name: "پنیر پیتزا موزارلا",
    price: 2100000,
    image: "https://img.beroozmart.com/unsafe/files/shop/product/661c44bfac8045bfb5fcfe380213a0a9.jpg",
    categoryName: "لبنیات",
    description: "پنیر موزارلا مخصوص پیتزا",
    available: true,
  },
  {
    name: "برنج هاشمی درجه یک",
    price: 3200000,
    image: "https://berangeirani.com/wp-content/uploads/2022/10/hashemi-rice.webp",
    categoryName: "برنج و حبوبات",
    description: "برنج هاشمی عطری و باکیفیت",
    available: true,
  },
];

async function main() {
  console.log(`Start seeding ...`);

  // 1. Seed Categories
  for (const cat of categoriesData) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }
  console.log(`Seeded ${categoriesData.length} categories.`);

  // 2. Seed Products
  for (const prod of productsData) {
    const category = await prisma.category.findUnique({
      where: { name: prod.categoryName },
    });
    if (category) {
      await prisma.product.upsert({
        where: { name: prod.name },
        update: {},
        create: {
          name: prod.name,
          price: prod.price,
          image: prod.image,
          description: prod.description,
          available: prod.available,
          categoryId: category.id,
        },
      });
    }
  }
  console.log(`Seeded ${productsData.length} products.`);

  // 3. Create a sample customer and ensure the admin user exists and has the ADMIN role
  const customer = await prisma.user.upsert({ where: { phone: '09120000000' }, update: {}, create: { phone: '09120000000', password: 'hashed_password_placeholder', name: 'مشتری تستی', shopName: 'فروشگاه نمونه', shopAddress: 'آدرس تستی', role: 'CUSTOMER' } });
  await prisma.user.upsert({ where: { phone: '09130027927' }, update: { role: 'ADMIN' }, create: { phone: '09130027927', password: '$2b$10$e9UmfvfnSvtRxly0dqFlVegEyQ50uQ4tZxLGycXRbYstFpH6V83Cm', name: 'حمیدرضا غنی نسب', shopName: 'مدیریت بنک‌شاپ', shopAddress: 'آدرس مدیریت', role: 'ADMIN' } });
  console.log(`Upserted customer and admin users.`);

  // 4. Create 30 fake orders for the customer to make charts look realistic
  for (let i = 0; i < 30; i++) {
    const randomDaysAgo = Math.floor(Math.random() * 30);
    const orderDate = new Date();
    orderDate.setDate(orderDate.getDate() - randomDaysAgo);
    const randomProduct = productsData[i % productsData.length];
    const quantity = Math.floor(Math.random() * 5) + 1;
    const totalPrice = randomProduct.price * quantity;
    
    await prisma.order.create({
      data: {
        totalPrice,
        createdAt: orderDate,
        deliverySlot: 'فردا - صبح',
        status: Math.random() > 0.6 ? 'SHIPPED' : 'PENDING',
        userId: customer.id,
        items: {
          create: [{
            productName: randomProduct.name,
            quantity: quantity,
            price: randomProduct.price
          }]
        }
      },
    });
  }
  console.log(`Seeding finished. 30 fake orders created.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
