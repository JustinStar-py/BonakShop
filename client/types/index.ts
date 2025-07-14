// justinstar-py/bonakshop/BonakShop-e6b838d87bef95729686f4e3b951e4072eed623d/client/types/index.ts
// FILE: types/index.ts
// Contains all custom TypeScript types for the application.

import type {
  Order as PrismaOrder,
  OrderItem as PrismaOrderItem,
  Product as PrismaProduct,
  Category as PrismaCategory,
  User as PrismaUser,
  Settlement as PrismaSettlement,
  ReturnRequest as PrismaReturnRequest,
  ReturnRequestItem as PrismaReturnRequestItem,
  Supplier as PrismaSupplier,
  Distributor as PrismaDistributor
} from '@prisma/client';

// A product item in the shopping cart, extending the base product with quantity
export type CartItem = PrismaProduct & {
  quantity: number;
};

// An order with its associated items included
export type OrderWithItems = PrismaOrder & {
  items: PrismaOrderItem[];
};

// An order with its associated items and the customer's info
export type OrderWithItemsAndUser = PrismaOrder & {
  items: PrismaOrderItem[];
  user: {
      name: string | null;
      shopName: string | null;
  };
};

// A full return request, including its items and the related order details
export type FullReturnRequest = PrismaReturnRequest & {
  items: (PrismaReturnRequestItem & {
    orderItem: PrismaOrderItem;
  })[];
  order: OrderWithItems;
};

// Exporting all Prisma types for easy access across the app
export type {
  PrismaProduct as Product,
  PrismaCategory as Category,
  PrismaUser as User,
  PrismaSettlement as Settlement,
  PrismaReturnRequest as ReturnRequest,
  PrismaReturnRequestItem as ReturnRequestItem,
  PrismaSupplier as Supplier,
  PrismaDistributor as Distributor
}