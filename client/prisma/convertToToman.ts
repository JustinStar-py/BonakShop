import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Converting currency fields from Rial to Toman (÷10)...");

  // Helpers to avoid repeating division logic.
  const divideByTen = (value: number | null) =>
    value === null ? null : value / 10;

  // 1) Products: price + consumerPrice
  const products = await prisma.product.findMany({
    select: { id: true, price: true, consumerPrice: true },
  });

  for (const product of products) {
    await prisma.product.update({
      where: { id: product.id },
      data: {
        price: divideByTen(product.price)!,
        consumerPrice: divideByTen(product.consumerPrice),
      },
    });
  }
  console.log(`✅ Updated ${products.length} products.`);

  // 2) OrderItems: price
  const orderItems = await prisma.orderItem.findMany({
    select: { id: true, price: true },
  });

  for (const item of orderItems) {
    await prisma.orderItem.update({
      where: { id: item.id },
      data: { price: divideByTen(item.price)! },
    });
  }
  console.log(`✅ Updated ${orderItems.length} order items.`);

  // 3) Orders: totalPrice (divide as well to keep consistency)
  const orders = await prisma.order.findMany({
    select: { id: true, totalPrice: true },
  });

  for (const order of orders) {
    await prisma.order.update({
      where: { id: order.id },
      data: { totalPrice: divideByTen(order.totalPrice)! },
    });
  }
  console.log(`✅ Updated ${orders.length} orders.`);

  console.log("🎉 Conversion complete.");
}

main()
  .catch((err) => {
    console.error("❌ Conversion failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
