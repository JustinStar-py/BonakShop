import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { cacheKeys, getCached } from "@/lib/redis";
import HomeClient, { type Banner, type CategoryRowData } from "./HomeClient";
import type { Category, ProductWithSupplier } from "@/types";

const categoryConfigs = [
  { title: "روغن ها", id: "cmi38m6es0000i904lhdyg63o", iconKey: "droplets" },
  { title: "نوشیدنی", id: "cmd2y7w9q0003la4b92oozlad", iconKey: "coffee" },
  { title: "شوینده و بهداشتی", id: "cmi63heqt0000l504r212znxi", iconKey: "spray" },
  { title: "لبنیات", id: "cmd2y7w9q0001la4b8nr7voq0", iconKey: "milk" },
  { title: "سوسیس و کالباس", id: "cmd2y7w9q0000la4bm0vggyle", iconKey: "utensils" },
  { title: "تنقلات", id: "cmi7aap5g0000jr04qzsgwuqg", iconKey: "cookie" },
  { title: "کنسرویجات", id: "cmi1hep5q0000jl04wbs8jj9s", iconKey: "fish" },
  { title: "پروتئین", id: "cmia6di3k0000ig045be1ihv4", iconKey: "drumstick" },
  { title: "کیک و بیسکوییت", id: "cmefyon9q0000jr04d1hv14dq", iconKey: "cake" },
  { title: "حبوبات", id: "cmi653u260000l804nq41jqqz", iconKey: "bean" },
];

const buildProductQuery = (options: {
  page: number;
  limit: number;
  search: string;
  categoryId?: string;
  supplierId?: string;
  sort?: string;
  status?: string | null;
}) => {
  const { page, limit, search, categoryId, supplierId, sort = "newest", status = null } = options;
  const skip = (page - 1) * limit;
  const where: Prisma.ProductWhereInput = {};

  if (!status) {
    where.available = true;
  } else if (status === "available") {
    where.available = true;
  } else if (status === "unavailable") {
    where.available = false;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  if (categoryId && categoryId !== "all") {
    where.categoryId = categoryId;
  }

  if (supplierId && supplierId !== "all") {
    where.supplierId = supplierId;
  }

  let orderBy: Prisma.ProductOrderByWithRelationInput = {};
  switch (sort) {
    case "bestselling":
      orderBy = { isFeatured: "desc" };
      break;
    case "cheapest":
      orderBy = { price: "asc" };
      break;
    case "expensive":
      orderBy = { price: "desc" };
      break;
    case "newest":
    default:
      orderBy = { createdAt: "desc" };
  }

  return { skip, where, orderBy };
};

const getListProducts = async (type: "featured" | "newest" | "bestsellers") => {
  const cacheKey = cacheKeys.products.listType(type);

  return getCached<ProductWithSupplier[]>(
    cacheKey,
    async () => {
      const take = 10;

      switch (type) {
        case "featured":
          return prisma.product.findMany({
            where: { isFeatured: true },
            include: {
              category: { select: { id: true, name: true, icon: true, image: true } },
              supplier: true,
              distributor: true
            },
            take,
          }) as any;
        case "newest":
          return prisma.product.findMany({
            orderBy: { createdAt: "desc" },
            include: {
              category: { select: { id: true, name: true, icon: true, image: true } },
              supplier: true,
              distributor: true
            },
            take,
          }) as any;
        case "bestsellers": {
          const popularItems = await prisma.orderItem.groupBy({
            by: ["productName"],
            _sum: { quantity: true },
            orderBy: { _sum: { quantity: "desc" } },
            take,
          });

          const productNames = popularItems.map((item) => item.productName);
          const list = await prisma.product.findMany({
            where: { name: { in: productNames } },
            include: {
              category: { select: { id: true, name: true, icon: true, image: true } },
              supplier: true,
              distributor: true
            },
          }) as any;

          list.sort((a: any, b: any) => productNames.indexOf(a.name) - productNames.indexOf(b.name));
          return list;
        }
        default:
          return [];
      }
    },
    300
  );
};

export default async function HomePage() {
  try {
    const page = 1;
    const limit = 12;
    const search = "";
    const sort = "newest";
    const status = null;

    const baseCacheKey = cacheKeys.products.list({
      page,
      limit,
      search,
      sort,
      status,
      categoryId: undefined,
      supplierId: undefined,
    });

    const categoryRowPromises = categoryConfigs.map((category) => {
      const listCacheKey = cacheKeys.products.list({
        page: 1,
        limit: 10,
        search: "",
        sort: "newest",
        status: null,
        categoryId: category.id,
        supplierId: undefined,
      });

      const { skip, where, orderBy } = buildProductQuery({
        page: 1,
        limit: 10,
        search: "",
        categoryId: category.id,
        sort: "newest",
        status: null,
      });

      return getCached<{ products: ProductWithSupplier[]; total: number }>(
        listCacheKey,
        async () => {
          const [products, total] = await prisma.$transaction([
            prisma.product.findMany({
              where,
              include: {
                category: { select: { id: true, name: true, icon: true, image: true } },
                supplier: true,
                distributor: true,
              },
              orderBy,
              skip,
              take: 10,
            }),
            prisma.product.count({ where }),
          ]);

          return { products: products as any, total };
        },
        60
      );
    });

    const { skip, where, orderBy } = buildProductQuery({
      page,
      limit,
      search,
      sort,
      status,
    });

    const [
      categories,
      featuredProducts,
      newestProducts,
      bestsellerProducts,
      productPage,
      banners,
      ...categoryRowsResults
    ] = await Promise.all([
      getCached<Pick<Category, 'id' | 'name' | 'icon' | 'image'>[]>(
        cacheKeys.categories.all(),
        () =>
          prisma.category.findMany({
            select: {
              id: true,
              name: true,
              icon: true,
              image: true,
            },
            orderBy: { name: "asc" },
          }),
        3600
      ),
      getListProducts("featured"),
      getListProducts("newest"),
      getListProducts("bestsellers"),
      getCached<{ products: ProductWithSupplier[]; total: number }>(
        baseCacheKey,
        async () => {
          const [products, total] = await prisma.$transaction([
            prisma.product.findMany({
              where,
              include: {
                category: { select: { id: true, name: true, icon: true, image: true } },
                supplier: true,
                distributor: true,
              },
              orderBy,
              skip,
              take: limit,
            }),
            prisma.product.count({ where }),
          ]);

          return { products: products as any, total };
        },
        60
      ),
      getCached<Banner[]>(
        cacheKeys.banners.active(),
        () =>
          prisma.banner.findMany({
            where: { isActive: true },
            orderBy: { priority: "desc" },
            select: {
              id: true,
              title: true,
              image: true,
              link: true,
            },
          }),
        600
      ),
      ...categoryRowPromises,
    ]);

    const categoryRows: CategoryRowData[] = categoryConfigs
      .map((category, index) => ({
        id: category.id,
        title: category.title,
        iconKey: category.iconKey,
        products: categoryRowsResults[index]?.products || [],
      }))
      .filter((row) => row.products.length > 0);

    const initialTotalPages = Math.ceil(productPage.total / limit) || 1;

    return (
      <HomeClient
        banners={banners}
        categories={categories}
        featuredProducts={featuredProducts}
        newestProducts={newestProducts}
        bestsellerProducts={bestsellerProducts}
        categoryRows={categoryRows}
        initialProducts={productPage.products}
        initialTotalPages={initialTotalPages}
      />
    );
  } catch (error) {
    console.error("HomePage error:", error);
    return (
      <HomeClient
        banners={[]}
        categories={[]}
        featuredProducts={[]}
        newestProducts={[]}
        bestsellerProducts={[]}
        categoryRows={[]}
        initialProducts={[]}
        initialTotalPages={1}
        initialError="خطا در دریافت اطلاعات فروشگاه."
      />
    );
  }
}
