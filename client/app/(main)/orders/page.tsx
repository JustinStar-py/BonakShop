import prisma from "@/lib/prisma";
import OrdersClient from "./OrdersClient";
import { getUserFromRefreshToken } from "@/lib/serverAuth";

export default async function OrdersPage() {
  const user = await getUserFromRefreshToken();

  if (!user) {
    return <OrdersClient initialError="برای مشاهده سفارشات ابتدا وارد شوید." />;
  }

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      totalPrice: true,
      deliveryDate: true,
      status: true,
      notes: true,
      createdAt: true,
      paymentStatus: true,
      items: {
        select: {
          id: true,
          productName: true,
          quantity: true,
          price: true,
        },
      },
      returnRequest: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const serializedOrders = orders.map((order) => ({
    ...order,
    createdAt: order.createdAt.toISOString(),
    deliveryDate: order.deliveryDate.toISOString(),
  }));

  return <OrdersClient initialOrders={serializedOrders} />;
}
