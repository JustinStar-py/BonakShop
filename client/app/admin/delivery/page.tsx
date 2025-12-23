import prisma from "@/lib/prisma";
import AdminDeliveryClient from "./AdminDeliveryClient";
import { getUserFromRefreshToken } from "@/lib/serverAuth";

export default async function DeliveryManagementPage() {
  const user = await getUserFromRefreshToken();

  if (!user || (user.role !== "ADMIN" && user.role !== "WORKER")) {
    return <AdminDeliveryClient initialOrders={[]} initialReturns={[]} />;
  }

  const [orders, returnRequests] = await Promise.all([
    prisma.order.findMany({
      select: {
        id: true,
        status: true,
        totalPrice: true,
        createdAt: true,
        deliveryDate: true,
        user: {
          select: {
            name: true,
            shopName: true,
            shopAddress: true,
            phone: true,
            latitude: true,
            longitude: true,
          },
        },
        items: {
          select: {
            id: true,
            productName: true,
            quantity: true,
            price: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.returnRequest.findMany({
      select: {
        id: true,
        status: true,
        reason: true,
        createdAt: true,
        order: {
          select: {
            user: {
              select: {
                name: true,
                shopName: true,
                shopAddress: true,
                phone: true,
              },
            },
          },
        },
        items: {
          select: {
            id: true,
            quantity: true,
            orderItem: { select: { productName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const serializedOrders = orders.map((order) => ({
    ...order,
    createdAt: order.createdAt.toISOString(),
    deliveryDate: order.deliveryDate.toISOString(),
  }));

  const serializedReturns = returnRequests.map((ret) => ({
    ...ret,
    createdAt: ret.createdAt.toISOString(),
  }));

  return <AdminDeliveryClient initialOrders={serializedOrders} initialReturns={serializedReturns} />;
}
