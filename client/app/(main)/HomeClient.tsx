"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import type { ElementType } from "react";
import { useAppContext } from "@/context/AppContext";
import useDebounce from "@/hooks/useDebounce";
import useProductPagination from "@/hooks/useProductPagination";
import type { Product, Category, ProductWithSupplier } from "@/types";
import { Button } from "@/components/ui/button";
import {
  MagniferLinear,
  RestartLinear,
  StarLinear as Star,
  GraphUpLinear as TrendingUp,
  StarsLinear as Sparkles,
  AltArrowUpLinear,
  WaterdropsLinear as Droplets,
  BottleLinear as Milk,
  DonutLinear as Cookie,
  DonutLinear as Cake,
  BoneLinear as Drumstick,
  CupLinear as Coffee,
  CosmeticLinear as SprayCan,
  ChefHatLinear as Utensils,
  WaterLinear as Fish,
  BoxLinear as Bean,
} from "@solar-icons/react-perf";

import Header from "@/components/layout/Header";
import HeroBanner from "@/components/features/home/HeroBanner";
import CategoryScroller from "@/components/features/home/CategoryScroller";
import ProductCarousel from "@/components/features/home/ProductCarousel";
import InfiniteProductGrid from "@/components/features/home/InfiniteProductGrid";
import PromoBanner from "@/components/features/home/PromoBanner";
import ImageDialog from "@/components/shared/ImageDialog";
import ProductCard from "@/components/shared/ProductCard";

export type Banner = {
  id: string;
  title?: string | null;
  image: string;
  link?: string | null;
};

export type CategoryRowData = {
  id: string;
  title: string;
  iconKey: string;
  products: ProductWithSupplier[];
};

type HomeClientProps = {
  banners: Banner[];
  categories: Pick<Category, 'id' | 'name' | 'icon' | 'image'>[];
  featuredProducts: ProductWithSupplier[];
  bestsellerProducts: ProductWithSupplier[];
  newestProducts: ProductWithSupplier[];
  categoryRows: CategoryRowData[];
  initialProducts: ProductWithSupplier[];
  initialTotalPages: number;
  initialError?: string | null;
};

const categoryIconMap: Record<string, ElementType> = {
  droplets: Droplets,
  coffee: Coffee,
  spray: SprayCan,
  milk: Milk,
  utensils: Utensils,
  cookie: Cookie,
  fish: Fish,
  drumstick: Drumstick,
  cake: Cake,
  bean: Bean,
};

export default function HomeClient({
  banners,
  categories,
  featuredProducts,
  bestsellerProducts,
  newestProducts,
  categoryRows,
  initialProducts,
  initialTotalPages,
  initialError = null,
}: HomeClientProps) {
  const { user, cart, addToCart, updateCartQuantity } = useAppContext();
  const router = useRouter();

  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const promoBanner = {
    image: "https://www.digikala.com/mag/wp-content/uploads/2024/03/9b6907ac-5dd5-4fcd-b4c8-3a0874fcb16d-22-pickles.jpg",
    link: "/products?categoryId=cmd8x3h5k0000jm047c3bv2zk",
    active: true,
  };

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const initialHasMore = initialTotalPages > 1;
  const initialPage = initialProducts.length > 0 ? 2 : 1;

  const {
    products: paginatedProducts,
    setProducts: setPaginatedProducts,
    setHasMore,
    hasMore,
    isLoadingMore,
    fetchPaginatedProducts,
    resetPagination,
    setPage,
    page,
  } = useProductPagination<ProductWithSupplier>(initialProducts, initialPage, initialHasMore);

  const skipSearchRef = useRef(true);

  useEffect(() => {
    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      return;
    }

    if (!debouncedSearchTerm.trim()) {
      resetPagination();
      setPaginatedProducts(initialProducts);
      setHasMore(initialHasMore);
      setPage(initialPage);
      return;
    }

    resetPagination();
    fetchPaginatedProducts(1, debouncedSearchTerm, "all", true);
  }, [
    debouncedSearchTerm,
    fetchPaginatedProducts,
    initialProducts,
    resetPagination,
    setHasMore,
    setPage,
    setPaginatedProducts,
    initialHasMore,
    initialPage,
  ]);

  useEffect(() => {
    const onScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
        if (!isLoadingMore && hasMore) {
          fetchPaginatedProducts(page, debouncedSearchTerm, "all");
        }
      }
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [page, isLoadingMore, hasMore, debouncedSearchTerm, fetchPaginatedProducts]);

  const handleSelectProduct = (product: Product) => router.push(`/products/${product.id}`);
  const handleSupplierClick = (supplierId: string) => router.push(`/products?supplierId=${supplierId}`);

  const rowsWithIcons = useMemo(
    () =>
      categoryRows.map((row) => ({
        ...row,
        icon: categoryIconMap[row.iconKey],
      })),
    [categoryRows]
  );

  if (initialError) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-red-500 gap-2">
        <div className="text-lg font-bold">خطا</div>
        {initialError}
        <Button onClick={() => window.location.reload()} variant="outline">
          تلاش مجدد
        </Button>
      </div>
    );
  }

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      <Header
        user={user}
        cartItemCount={cart.length}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {debouncedSearchTerm ? (
        <div className="p-4 animate-in fade-in slide-in-from-bottom-2">
          <h2 className="text-sm font-bold text-gray-500 mb-4 flex items-center gap-2">
            <MagniferLinear size={18} /> نتایج جستجو
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {paginatedProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                cartItem={cart.find((ci) => ci.id === p.id)}
                onAddToCart={addToCart}
                onUpdateQuantity={updateCartQuantity}
                onSelectProduct={handleSelectProduct}
                onImageClick={setViewingImage}
                onSupplierClick={handleSupplierClick}
              />
            ))}
          </div>
          {isLoadingMore && (
            <div className="py-8 flex justify-center">
              <RestartLinear className="animate-spin text-green-500" />
            </div>
          )}
        </div>
      ) : (
        <>
          <HeroBanner banners={banners} />

          <CategoryScroller categories={categories} />

          <ProductCarousel
            title="پیشنهاد ویژه"
            icon={Star}
            products={featuredProducts}
            cart={cart}
            onAddToCart={addToCart}
            onUpdateQuantity={updateCartQuantity}
            onSelectProduct={handleSelectProduct}
            onSupplierClick={handleSupplierClick}
            onImageClick={setViewingImage}
            onViewAll={() => router.push("/products?sort=bestselling")}
          />

          <PromoBanner image={promoBanner.image} link={promoBanner.link} active={promoBanner.active} />

          <ProductCarousel
            title="پرفروش‌ترین‌ها"
            icon={TrendingUp}
            products={bestsellerProducts}
            cart={cart}
            onAddToCart={addToCart}
            onUpdateQuantity={updateCartQuantity}
            onSelectProduct={handleSelectProduct}
            onSupplierClick={handleSupplierClick}
            onImageClick={setViewingImage}
            onViewAll={() => router.push("/products?sort=bestselling")}
            accentColorClass="bg-blue-500"
          />

          <ProductCarousel
            title="تازه رسیده"
            icon={Sparkles}
            products={newestProducts}
            cart={cart}
            onAddToCart={addToCart}
            onUpdateQuantity={updateCartQuantity}
            onSelectProduct={handleSelectProduct}
            onSupplierClick={handleSupplierClick}
            onImageClick={setViewingImage}
            onViewAll={() => router.push("/products?sort=newest")}
            accentColorClass="bg-green-500"
          />

          {rowsWithIcons.map((row) => (
            <ProductCarousel
              key={row.id}
              title={row.title}
              icon={row.icon}
              products={row.products}
              cart={cart}
              onAddToCart={addToCart}
              onUpdateQuantity={updateCartQuantity}
              onSelectProduct={handleSelectProduct}
              onSupplierClick={handleSupplierClick}
              onImageClick={setViewingImage}
              onViewAll={() => router.push(`/products?categoryId=${row.id}`)}
              showStrip={false}
            />
          ))}

          <InfiniteProductGrid
            products={paginatedProducts}
            cart={cart}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            onAddToCart={addToCart}
            onUpdateQuantity={updateCartQuantity}
            onSelectProduct={handleSelectProduct}
            onImageClick={setViewingImage}
            onSupplierClick={handleSupplierClick}
          />
        </>
      )}

      {showScrollTop && (
        <Button
          size="icon"
          className="fixed bottom-24 right-4 rounded-full bg-white text-green-600 hover:bg-green-50 border border-green-100"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <AltArrowUpLinear className="w-5 h-5" />
        </Button>
      )}

      <ImageDialog imageUrl={viewingImage} onClose={() => setViewingImage(null)} />
    </div>
  );
}
