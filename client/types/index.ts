// FILE: types/index.ts (FIXED)
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

export type CartItem = PrismaProduct & {
  quantity: number;
};

export type ProductWithSupplier = PrismaProduct & {
  supplier: PrismaSupplier;
};

// An order with its associated items included
export type OrderWithItems = PrismaOrder & {
  items: PrismaOrderItem[];
  total: number;
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