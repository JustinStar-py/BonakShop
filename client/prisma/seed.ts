// FILE: prisma/seed.ts
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Create a sample customer if it doesn't exist
  let customer = await prisma.user.findUnique({ where: { phone: '09120000000' } });
  if (!customer) {
    customer = await prisma.user.create({
      data: {
        phone: '09120000000',
        password: 'hashed_password_placeholder', // In a real scenario, hash this
        name: 'مشتری تستی',
        shopName: 'فروشگاه نمونه',
        shopAddress: 'آدرس تستی',
        role: Role.CUSTOMER,
      },
    });
    console.log('Created sample customer:', customer.shopName);
  }

  // Create 20 fake orders for the last 30 days
  for (let i = 0; i < 20; i++) {
    const randomDaysAgo = Math.floor(Math.random() * 30);
    const orderDate = new Date();
    orderDate.setDate(orderDate.getDate() - randomDaysAgo);

    const totalPrice = Math.random() * 5000000 + 1000000; // Random price between 1M and 6M

    await prisma.order.create({
      data: {
        totalPrice: totalPrice,
        createdAt: orderDate,
        deliverySlot: 'فردا - صبح',
        status: Math.random() > 0.5 ? 'SHIPPED' : 'PENDING',
        userId: customer.id, // Link to the sample customer
        items: {
          create: [
            { productName: 'سوسیس آلمانی درجه یک', quantity: Math.floor(Math.random() * 5) + 1, price: 1250000 },
            { productName: 'پنیر پیتزا موزارلا', quantity: Math.floor(Math.random() * 3) + 1, price: 2100000 },
          ],
        },
      },
    });
  }
  console.log('Seeding finished. 20 fake orders created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });