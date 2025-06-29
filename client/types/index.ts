// FILE: types/index.ts (Final and Corrected Version)

import type { 
  Order as PrismaOrder, 
  OrderItem as PrismaOrderItem, 
  Product as PrismaProduct 
} from '@prisma/client';

export type CartItem = PrismaProduct & {
  quantity: number;
};

export type OrderWithItems = PrismaOrder & {
  items: PrismaOrderItem[];
};
