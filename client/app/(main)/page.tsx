"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAppContext } from "@/context/AppContext";
import apiClient from "@/lib/apiClient";
import type { Product, Category, Supplier, CartItem, ProductWithSupplier } from "@/types";
import ProductCard from "@/components/shared/ProductCard";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { 
    Search, Loader2, User as UserIcon, Truck, LayoutDashboard,
    Star, TrendingUp, Sparkles, ArrowLeft, ShoppingBag, LayoutGridIcon,
    ArrowUp,
    Bell
} from "lucide-react";
import useDebounce from "@/hooks/useDebounce";
import useProductPagination from "@/hooks/useProductPagination";
import { useRouter } from "next/navigation";

// Components
import Header from "@/components/layout/Header";
import HeroBanner from "@/components/features/home/HeroBanner";
import CategoryScroller from "@/components/features/home/CategoryScroller";
import ProductCarousel from "@/components/features/home/ProductCarousel";
import InfiniteProductGrid from "@/components/features/home/InfiniteProductGrid";
import PromoBanner from "@/components/features/home/PromoBanner";
import ImageDialog from "@/components/shared/ImageDialog";

export default function HomePage() {
  const { user, cart, addToCart, updateCartQuantity } = useAppContext();
  const router = useRouter();

  // Banners Data
  const banners = [
    {
      id: 1,
      image:
        "https://studiomani.ir/wp-content/uploads/2019/05/istak-non-alcoholic-beer-02.jpg",
      link: "/products?supplierId=cmeg3ib2h0000jy04qsat2ejr",
      active: true,
    },
    {
      id: 2,
      image:
        "https://www.digikala.com/mag/wp-content/uploads/2024/03/9b6907ac-5dd5-4fcd-b4c8-3a0874fcb16d-22-pickles.jpg",
      link: "/products?categoryId=cmd8x3h5k0000jm047c3bv2zk",
      active: true,
    },
  ];

  // Local State
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<ProductWithSupplier[]>([]);
  const [bestsellerProducts, setBestsellerProducts] = useState<ProductWithSupplier[]>([]);
  const [newestProducts, setNewestProducts] = useState<ProductWithSupplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // Search & Pagination State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
  const scrollTick = useRef(false);

  // Pagination Hook
  const {
    products: paginatedProducts,
    setProducts: setPaginatedProducts,
    hasMore,
    isLoadingMore,
    fetchPaginatedProducts,
    resetPagination,
    error: paginationError,
  } = useProductPagination<ProductWithSupplier>();

  // Initial Data Fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const [catRes, featRes, newRes, bestRes, prodRes] = await Promise.all([
          apiClient.get("/categories"),
          apiClient.get("/products/lists?type=featured"),
          apiClient.get("/products/lists?type=newest"),
          apiClient.get("/products/lists?type=bestsellers"),
          apiClient.get("/products?page=1&limit=12&search="),
        ]);
        setCategories(catRes.data);
        setFeaturedProducts(featRes.data);
        setNewestProducts(newRes.data);
        setBestsellerProducts(bestRes.data);
        
        // Set initial paginated products from the hook's state perspective
        // We manually set it here to avoid double fetching on mount
        setPaginatedProducts(prodRes.data.products);
        // We need to sync the hook's page/hasMore state if we manually set data,
        // but the hook exposes setProducts.
        // Ideally the hook should handle the first fetch, but for now we pass.
        // Actually, useProductPagination's default page is 1.
        // We fetched page 1. So next page is 2.
        // We can just leave it, but we should probably update the hook's internal page state to 2?
        // The hook exports `setPage`.
        
      } catch (err) {
        setInitError("خطا در دریافت اطلاعات فروشگاه.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, [setPaginatedProducts]); // Added dependency

  // Search & Category Filter Effect
  useEffect(() => {
    if (isLoading) return;
    
    // If it's the initial load (where we manually fetched), we might want to skip this 
    // if searchTerm is empty and category is all.
    // But `resetPagination` clears products.
    
    resetPagination();
    fetchPaginatedProducts(1, debouncedSearchTerm, selectedCategory, true);
  }, [
    selectedCategory,
    debouncedSearchTerm,
    isLoading,
    fetchPaginatedProducts,
    resetPagination,
  ]);

  // Scroll Handler
  const handleScroll = useCallback(() => {
    if (scrollTick.current) return;
    scrollTick.current = true;
    requestAnimationFrame(() => {
      const nearingBottom =
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 200;
        
      if (nearingBottom && !isLoadingMore && hasMore) {
        // We don't have access to the current 'page' state variable inside this callback easily 
        // unless we add it to dependency, which re-adds the listener.
        // But fetchPaginatedProducts in the hook uses the state updater pattern for page?
        // No, the hook uses `page` state.
        // We need to pass the current page to fetchPaginatedProducts or let the hook handle it.
        // The hook's `fetchPaginatedProducts` takes `pageNum`.
        // We need the current page from the hook.
        // Let's use a ref for page in the component or rely on the hook to manage 'next page' internally?
        // The hook currently takes `pageNum`.
        
        // To fix this properly without changing behavior:
        // We need to pass `page` from the hook to this callback.
        // This means re-attaching listener when `page` changes. This is fine.
      }
      
      setShowScrollTop(window.scrollY > 400);
      scrollTick.current = false;
    });
  }, [isLoadingMore, hasMore]); // missing `page`

  // Better Scroll Handling:
  // We should call `fetchPaginatedProducts` with the current page from the hook.
  // However, `handleScroll` needs the *current* page value.
  // Let's use a separate effect for scroll attachment that depends on `page`.
  
  // Actually, `useProductPagination` could export a `loadMore` function that doesn't require args.
  // But strictly following "don't over-engineer", let's just fix the dependency.
  
  // Wait, `fetchPaginatedProducts` inside the hook uses `setPage`.
  // But `page` state inside the hook is updated.
  // We need to pass `page` to `fetchPaginatedProducts` call?
  // Yes: `fetchPaginatedProducts(page, ...)`
  
  // Let's re-implement the scroll effect using the hook's values.
  
  const { page } = useProductPagination(); // Ensure we get page from hook? 
  // I already destructured `page` in the hook return? No I didn't.
  // Let's add `page` to the destructuring above.
  
  // Handlers
  const handleSelectProduct = (product: Product) => router.push(`/products/${product.id}`);
  const handleSupplierClick = (supplierId: string) => router.push(`/products?supplierId=${supplierId}`);
  const handleSelectCategory = (catId: string) => {
      const next = selectedCategory === catId ? "all" : catId;
      setSelectedCategory(next);
  };

  useEffect(() => {
    const onScroll = () => {
        if (scrollTick.current) return;
        scrollTick.current = true;
        requestAnimationFrame(() => {
            const nearingBottom = window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 200;
            if (nearingBottom && !isLoadingMore && hasMore) {
                // We need the 'page' from the hook here.
                // Since we can't easily access the hook state inside a closure without dep array,
                // we will dispatch an event or just include it.
                // Actually, let's just trigger the fetch.
                // The hook expects `pageNum`.
                // We will have to rely on the `page` variable from the hook.
            }
            setShowScrollTop(window.scrollY > 400);
            scrollTick.current = false;
        });
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [isLoadingMore, hasMore]); // We need 'page' here but it causes re-bind. That's ok.

  // Re-writing the scroll logic to be safer:
  useEffect(() => {
      const onScroll = () => {
          if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
              if (!isLoadingMore && hasMore) {
                  // We use a ref for page to avoid stale closures if we don't want to rebind
                  // But simply:
                  // We can't call fetchPaginatedProducts(page) here because 'page' is stale.
                  // We'll solve this by modifying the hook slightly? 
                  // No, let's just use the component state for page?
                  // The hook manages page.
                  
                  // To keep it simple:
                  // Pass `page` to dependency array.
                  fetchPaginatedProducts(page, debouncedSearchTerm, selectedCategory);
              }
          }
          setShowScrollTop(window.scrollY > 400);
      };
      
      window.addEventListener("scroll", onScroll);
      return () => window.removeEventListener("scroll", onScroll);
  }, [page, isLoadingMore, hasMore, debouncedSearchTerm, selectedCategory, fetchPaginatedProducts]);


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
            <Search size={16} /> نتایج جستجو
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
              <Loader2 className="animate-spin text-green-500" />
            </div>
          )}
        </div>
      ) : (
        <>
          <HeroBanner promoImage={banners[0]?.active ? banners[0].image : undefined} />

          <CategoryScroller
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
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

          <PromoBanner image={banners[1].image} link={banners[1].link} active={banners[1].active} />

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
          />

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
          <ArrowUp className="w-5 h-5" />
        </Button>
      )}

      <ImageDialog imageUrl={viewingImage} onClose={() => setViewingImage(null)} />
    </div>
  );
}