import Link from "next/link";
import prisma from "@/lib/prisma";
import { cacheKeys, getCached } from "@/lib/redis";
import ProductDetailClient, { type ProductDetailData } from "./ProductDetailClient";
import { Button } from "@/components/ui/button";

type ProductDetailRecord = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  consumerPrice: number | null;
  image: string | null;
  available: boolean;
  discountPercentage: number;
  unit: string;
  stock: number;
  isFeatured: boolean;
  categoryId: string;
  supplierId: string;
  distributorId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  supplier: { name: string };
  category: { name: string };
};

export default async function ProductDetailPage({
  params,
}: {
  params?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = params ? await params : undefined;
  const rawId = resolvedParams?.id;
  const productId = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!productId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h2 className="text-xl font-bold text-gray-700">محصولی یافت نشد</h2>
        <Button asChild variant="outline">
          <Link href="/">بازگشت به فروشگاه</Link>
        </Button>
      </div>
    );
  }

  const cacheKey = cacheKeys.products.detail(productId);
  const product = await getCached<ProductDetailRecord | null>(
    cacheKey,
    () =>
      prisma.product.findUnique({
        where: { id: productId },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          consumerPrice: true,
          image: true,
          available: true,
          discountPercentage: true,
          unit: true,
          stock: true,
          isFeatured: true,
          categoryId: true,
          supplierId: true,
          distributorId: true,
          createdAt: true,
          updatedAt: true,
          supplier: { select: { name: true } },
          category: { select: { name: true } },
        },
      }),
    300
  );

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h2 className="text-xl font-bold text-gray-700">محصول مورد نظر یافت نشد.</h2>
        <Button asChild variant="outline">
          <Link href="/">بازگشت به فروشگاه</Link>
        </Button>
      </div>
    );
  }

  const createdAt =
    typeof product.createdAt === "string" ? product.createdAt : product.createdAt.toISOString();
  const updatedAt =
    typeof product.updatedAt === "string" ? product.updatedAt : product.updatedAt.toISOString();

  const productData: ProductDetailData = {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    consumerPrice: product.consumerPrice,
    image: product.image,
    available: product.available,
    discountPercentage: product.discountPercentage,
    unit: product.unit,
    stock: product.stock,
    isFeatured: product.isFeatured,
    categoryId: product.categoryId,
    supplierId: product.supplierId,
    distributorId: product.distributorId,
    supplierName: product.supplier.name,
    categoryName: product.category.name,
    createdAt,
    updatedAt,
  };

  return <ProductDetailClient product={productData} />;
}
