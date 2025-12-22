"use client";

import { useState, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import apiClient from "@/lib/apiClient";
import type { Product, Category, ProductWithSupplier } from "@/types";
import ProductCard from "@/components/shared/ProductCard";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import {
  MagniferLinear, RestartLinear,
  StarLinear as Star, GraphUpLinear as TrendingUp, StarsLinear as Sparkles,
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
  BoxLinear as Bean
} from "@solar-icons/react-perf";
import useDebounce from "@/hooks/useDebounce";
import useProductPagination from "@/hooks/useProductPagination";
import { useRouter } from "next/navigation";
import type { ElementType } from "react";

// Components
import Header from "@/components/layout/Header";
import HeroBanner from "@/components/features/home/HeroBanner";
import CategoryScroller from "@/components/features/home/CategoryScroller";
import ProductCarousel from "@/components/features/home/ProductCarousel";
import InfiniteProductGrid from "@/components/features/home/InfiniteProductGrid";
import PromoBanner from "@/components/features/home/PromoBanner";
import ImageDialog from "@/components/shared/ImageDialog";

type Banner = {
  id: string;
  title?: string | null;
  image: string;
  link?: string | null;
};

interface CategoryRow {
  id: string;
  title: string;
  icon: ElementType;
  products: ProductWithSupplier[];
}

export default function HomePage() {
  const { user, cart, addToCart, updateCartQuantity } = useAppContext();
  const router = useRouter();

  // Local State
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<ProductWithSupplier[]>([]);
  const [bestsellerProducts, setBestsellerProducts] = useState<ProductWithSupplier[]>([]);
  const [newestProducts, setNewestProducts] = useState<ProductWithSupplier[]>([]);
  const [categoryRows, setCategoryRows] = useState<CategoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Static Promo Data
  const promoBanner = {
    image: "https://www.digikala.com/mag/wp-content/uploads/2024/03/9b6907ac-5dd5-4fcd-b4c8-3a0874fcb16d-22-pickles.jpg",
    link: "/products?categoryId=cmd8x3h5k0000jm047c3bv2zk",
    active: true,
  };

  // Search & Pagination State
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Pagination Hook
  const {
    products: paginatedProducts,
    setProducts: setPaginatedProducts,
    hasMore,
    isLoadingMore,
    fetchPaginatedProducts,
    resetPagination,
    setPage,
    page,
  } = useProductPagination<ProductWithSupplier>();

  // Initial Data Fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        // Define category configurations
        const categoryConfigs = [
          { title: "روغن ها", id: "cmi38m6es0000i904lhdyg63o", icon: Droplets },
          { title: "نوشیدنی", id: "cmd2y7w9q0003la4b92oozlad", icon: Coffee }, // Using Coffee as proxy for Beverages
          { title: "شوینده و بهداشتی", id: "cmi63heqt0000l504r212znxi", icon: SprayCan },
          { title: "لبنیات", id: "cmd2y7w9q0001la4b8nr7voq0", icon: Milk },
          { title: "سوسیس و کالباس", id: "cmd2y7w9q0000la4bm0vggyle", icon: Utensils },
          { title: "تنقلات", id: "cmi7aap5g0000jr04qzsgwuqg", icon: Cookie },
          { title: "کنسرویجات", id: "cmi1hep5q0000jl04wbs8jj9s", icon: Fish }, // Using Fish for Canned/Tuna
          { title: "پروتئین", id: "cmia6di3k0000ig045be1ihv4", icon: Drumstick },
          { title: "کیک و بیسکوییت", id: "cmefyon9q0000jr04d1hv14dq", icon: Cake },
          { title: "حبوبات", id: "cmi653u260000l804nq41jqqz", icon: Bean },
        ];

        const categoryPromises = categoryConfigs.map(c =>
          apiClient.get(`/products?categoryId=${c.id}&limit=10`).catch(() => ({ data: { products: [] } }))
        );

        const [catRes, featRes, newRes, bestRes, prodRes, bannersRes, ...catRowsRes] = await Promise.all([
          apiClient.get("/categories"),
          apiClient.get("/products/lists?type=featured"),
          apiClient.get("/products/lists?type=newest"),
          apiClient.get("/products/lists?type=bestsellers"),
          apiClient.get("/products?page=1&limit=12&search="),
          apiClient.get("/banners").catch(() => ({ data: [] })),
          ...categoryPromises
        ]);

        setCategories(catRes.data);
        setFeaturedProducts(featRes.data);
        setNewestProducts(newRes.data);
        setBestsellerProducts(bestRes.data);
        setBanners(bannersRes.data || []);

        // Process category rows
        const rows = categoryConfigs.map((c, i) => ({
          id: c.id,
          title: c.title,
          icon: c.icon,
          products: catRowsRes[i]?.data?.products || []
        })).filter(row => row.products.length > 0);

        setCategoryRows(rows);

        // Set initial paginated products from the hook's state perspective
        setPaginatedProducts(prodRes.data.products);

        // Fix for scroll issue: Start from page 2 since page 1 is already loaded
        setPage(2);

      } catch (err) {
        setInitError("خطا در دریافت اطلاعات فروشگاه.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, [setPaginatedProducts, setPage]);

  // Search & Category Filter Effect
  useEffect(() => {
    if (isLoading) return;

    resetPagination();
    // Ensure we pass "all" explicitly for category when searching/resetting on home
    fetchPaginatedProducts(1, debouncedSearchTerm, "all", true);
  }, [
    debouncedSearchTerm,
    isLoading,
    fetchPaginatedProducts,
    resetPagination,
  ]);

  // Handlers
  const handleSelectProduct = (product: Product) => router.push(`/products/${product.id}`);
  const handleSupplierClick = (supplierId: string) => router.push(`/products?supplierId=${supplierId}`);

  // Scroll Handler (Infinite Scroll)
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


  if (isLoading) return <LoadingSpinner message="در حال چیدن قفسه‌ها..." />;
  if (initError)
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-red-500 gap-2">
        <div className="text-lg font-bold">خطا</div>
        {initError}
        <Button onClick={() => window.location.reload()} variant="outline">
          تلاش مجدد
        </Button>
      </div>
    );

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

          <CategoryScroller
            categories={categories}
          />

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

          {categoryRows.map((row) => (
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
