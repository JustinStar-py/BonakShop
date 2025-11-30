import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type CartItemPayload = {
  id: string;
  quantity: number;
  price: number;
  discountPercentage: number | undefined;
};

type CartChange =
  | {
      productId: string;
      productName?: string;
      type: "REMOVED" | "UNAVAILABLE" | "OUT_OF_STOCK";
      message: string;
      action: "remove";
      newStock?: number;
    }
  | {
      productId: string;
      productName?: string;
      type: "INSUFFICIENT_STOCK";
      message: string;
      action: "update_quantity";
      newStock: number;
    }
  | {
      productId: string;
      productName?: string;
      type: "PRICE_CHANGED";
      message: string;
      action: "update_price";
      newPrice: number;
      newDiscountPercentage: number;
      newFinalPrice: number;
    };

const formatToman = (value: number) =>
  new Intl.NumberFormat("fa-IR").format(Math.round(value));

const normalizeItems = (items: unknown): CartItemPayload[] => {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => {
      if (
        !item ||
        typeof item !== "object" ||
        typeof (item as any).id !== "string"
      ) {
        return null;
      }

      const quantity = Number((item as any).quantity);
      const price = Number((item as any).price);
      const discountPercentage =
        (item as any).discountPercentage === undefined
          ? undefined
          : Number((item as any).discountPercentage);

      if (!Number.isFinite(quantity) || quantity <= 0) return null;
      if (!Number.isFinite(price) || price < 0) return null;

      return {
        id: (item as any).id,
        quantity,
        price,
        discountPercentage: Number.isFinite(discountPercentage)
          ? discountPercentage
          : undefined,
      };
    })
    .filter((item): item is CartItemPayload => Boolean(item));
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const items = normalizeItems(body?.items);

    if (items.length === 0) {
      return NextResponse.json({ valid: true, changes: [] });
    }

    const products = await prisma.product.findMany({
      where: {
        id: { in: items.map((item) => item.id) },
      },
      select: {
        id: true,
        name: true,
        price: true,
        stock: true,
        available: true,
        discountPercentage: true,
      },
    });

    const productMap = new Map(products.map((product) => [product.id, product]));
    const changes: CartChange[] = [];

    for (const cartItem of items) {
      const product = productMap.get(cartItem.id);

      if (!product) {
        changes.push({
          productId: cartItem.id,
          type: "REMOVED",
          message: "محصول از فروشگاه حذف شده است.",
          action: "remove",
        });
        continue;
      }

      if (!product.available) {
        changes.push({
          productId: product.id,
          productName: product.name,
          type: "UNAVAILABLE",
          message: `محصول "${product.name}" دیگر در دسترس نیست.`,
          action: "remove",
        });
        continue;
      }

      if (product.stock < cartItem.quantity) {
        if (product.stock === 0) {
          changes.push({
            productId: product.id,
            productName: product.name,
            type: "OUT_OF_STOCK",
            message: `موجودی محصول "${product.name}" به پایان رسید.`,
            action: "remove",
            newStock: 0,
          });
        } else {
          changes.push({
            productId: product.id,
            productName: product.name,
            type: "INSUFFICIENT_STOCK",
            message: `موجودی محصول "${product.name}" کافی نیست (موجودی فعلی: ${product.stock} عدد).`,
            action: "update_quantity",
            newStock: product.stock,
          });
        }
      }

      const liveDiscount = product.discountPercentage ?? 0;
      const cartDiscount = cartItem.discountPercentage ?? 0;
      const liveBasePrice = product.price ?? 0;
      const liveFinalPrice = liveBasePrice * (1 - liveDiscount / 100);
      const cartFinalPrice = cartItem.price * (1 - cartDiscount / 100);

      const priceChanged =
        Math.round(liveFinalPrice * 100) !== Math.round(cartFinalPrice * 100) ||
        liveBasePrice !== cartItem.price ||
        liveDiscount !== cartDiscount;

      if (priceChanged) {
        const formattedFinalPrice = formatToman(liveFinalPrice);
        changes.push({
          productId: product.id,
          productName: product.name,
          type: "PRICE_CHANGED",
          message: `قیمت محصول "${product.name}" تغییر کرده است (قیمت جدید: ${formattedFinalPrice} تومان).`,
          action: "update_price",
          newPrice: liveBasePrice,
          newDiscountPercentage: liveDiscount,
          newFinalPrice: liveFinalPrice,
        });
      }
    }

    return NextResponse.json({
      valid: changes.length === 0,
      changes,
    });
  } catch (error) {
    console.error("Cart validation error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
