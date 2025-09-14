// FILE: app/(main)/page.tsx (FINAL VERSION WITH BANNERS & ICONS)
"use client";

import { useState, useEffect, useCallback, ElementType } from "react";
import { useAppContext } from "@/context/AppContext";
import apiClient from "@/lib/apiClient";
import type { Product, Category, Supplier, CartItem } from "@/types";
import ProductCard from "@/components/shared/ProductCard";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
// --- NEW: Import desired icons ---
import { 
    Search, Loader2, User as UserIcon, LayoutDashboard, Truck, LogOut, ArrowLeft,
    Star, TrendingUp, Sparkles,
    LayoutGridIcon
} from "lucide-react";
import useDebounce from "@/hooks/useDebounce";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

// --- Type Definitions ---
type ProductWithRelations = Product & { supplier: Supplier };

// --- Reusable Product Carousel Component (Updated) ---
function ProductCarousel({ 
    title, 
    icon: Icon, // <-- FIX: Destructure the new icon prop
    products, 
    cart,
    onAddToCart,
    onUpdateQuantity,
    onSelectProduct,
    onImageClick,
    onSupplierClick 
}: { 
    title: string;
    icon?: ElementType; // <-- FIX: Add optional icon prop
    products: ProductWithRelations[];
    cart: CartItem[];
    onAddToCart: (product: Product) => void;
    onUpdateQuantity: (productId: string, newQuantity: number) => void;
    onSelectProduct: (product: Product) => void;
    onImageClick: (imageUrl: string) => void;
    onSupplierClick: (supplierId: string) => void;
}) {
    if (!products || products.length === 0) return null;
    return (
        <div className="py-2">
            {/* --- FIX: Title section now supports an icon --- */}
            <div className="flex items-center gap-2 mb-4 px-4">
                {Icon && <Icon className="h-6 w-6 text-teal-500" />}
                <h2 className="text-lg font-semibold text-teal-500">{title}</h2>
            </div>

            <div className="flex space-x-4 space-x-reverse overflow-x-auto px-2 pb-4">
                {products.map(product => (
                    <div key={product.id} className="flex-shrink-0 w-44">
                        <ProductCard 
                            product={product}
                            cartItem={cart.find(ci => ci.id === product.id)}
                            onAddToCart={onAddToCart}
                            onUpdateQuantity={onUpdateQuantity}
                            onSelectProduct={onSelectProduct}
                            onImageClick={onImageClick}
                            onSupplierClick={onSupplierClick}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- Dialog component for viewing images ---
function ImageDialog({ imageUrl, onClose }: { imageUrl: string | null; onClose: () => void }) {
    if (!imageUrl) return null;
    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="p-2 bg-white shadow-lg rounded-lg max-w-lg w-full">
                <img src={imageUrl} alt="نمایش بزرگتر محصول" className="w-full h-auto rounded-lg object-contain" />
            </DialogContent>
        </Dialog>
    );
}

// --- Main Home Page Component ---
export default function HomePage() {
  const { user, cart, addToCart, updateCartQuantity, logout } = useAppContext();
  const router = useRouter();

  // --- BANNER CONTROLS ---
 const banners = [
  {
    id: 1,
    image: "https://studiomani.ir/wp-content/uploads/2019/05/istak-non-alcoholic-beer-02.jpg",
    link: "/products?supplierId=cmeg3ib2h0000jy04qsat2ejr",
    active: true,
  },
  {
    id: 2,
    image: "https://www.digikala.com/mag/wp-content/uploads/2024/03/9b6907ac-5dd5-4fcd-b4c8-3a0874fcb16d-22-pickles.jpg",
    link: "/products?categoryId=cmd8x3h5k0000jm047c3bv2zk",
    active: true,
  },
  {
    id: 3,
    image: "/assets/banners/banner3.jpg",
    link: "https://example.com/page3",
    active: false, // This banner will not be shown
  },
];
  // --- END OF BANNER CONTROLS ---

  // Data states
  const [paginatedProducts, setPaginatedProducts] = useState<ProductWithRelations[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<ProductWithRelations[]>([]);
  const [bestsellerProducts, setBestsellerProducts] = useState<ProductWithRelations[]>([]);
  const [newestProducts, setNewestProducts] = useState<ProductWithRelations[]>([]);
  
  // Control states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Search states
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [isSearching, setIsSearching] = useState(false);

  const fetchPaginatedProducts = useCallback(async (pageNum: number, search: string, isNewSearch = false) => {
    setIsLoadingMore(true);
    if (isNewSearch) setIsSearching(true);
    
    try {
      const response = await apiClient.get(`/products?page=${pageNum}&limit=12&search=${search}`);
      const newProducts = response.data.products;

      setPaginatedProducts(prev => {
        if (isNewSearch) return newProducts;
        const existingIds = new Set(prev.map(p => p.id));
        return [...prev, ...newProducts.filter((p: Product) => !existingIds.has(p.id))];
      });

      setHasMore(newProducts.length > 0);
      setPage(isNewSearch ? 2 : p => p + 1);

    } catch (err) {
      setError("خطا در بارگذاری محصولات.");
    } finally {
      setIsLoadingMore(false);
      if (isNewSearch) setIsSearching(false);
    }
  }, []);

  // Initial data load effect
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const [categoriesRes, featuredRes, newestRes, bestsellersRes, initialProductsRes] = await Promise.all([
          apiClient.get('/categories'),
          apiClient.get('/products/lists?type=featured'),
          apiClient.get('/products/lists?type=newest'),
          apiClient.get('/products/lists?type=bestsellers'),
          apiClient.get('/products?page=1&limit=12&search=')
        ]);
        
        setCategories(categoriesRes.data);
        setFeaturedProducts(featuredRes.data);
        setNewestProducts(newestRes.data);
        setBestsellerProducts(bestsellersRes.data);
        setPaginatedProducts(initialProductsRes.data.products);
        setHasMore(initialProductsRes.data.products.length > 0);
        setPage(2);

      } catch (err) {
        setError("خطا در دریافت اطلاعات فروشگاه.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // Search effect
  useEffect(() => {
    if (isLoading) return;
    fetchPaginatedProducts(1, debouncedSearchTerm, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm]);

  const handleSelectProduct = (product: Product) => {
    router.push(`/products/${product.id}`);
  };
  
  const handleSupplierClick = (supplierId: string) => {
    router.push(`/products?supplierId=${supplierId}`);
  };

  const handleScroll = useCallback(() => {
    if (window.innerHeight + document.documentElement.scrollTop < document.documentElement.offsetHeight - 200 || isLoadingMore || !hasMore) {
      return;
    }
    if (!debouncedSearchTerm) {
        fetchPaginatedProducts(page, "");
    }
  }, [page, hasMore, isLoadingMore, debouncedSearchTerm, fetchPaginatedProducts]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  if (isLoading) {
    return <LoadingSpinner message="در حال بارگذاری فروشگاه..." />;
  }

  if (error) {
    return <div className="text-center text-red-500 p-4">{error}</div>;
  }

  return (
    <div className="pb-24">
      <div className="p-4 flex justify-between items-center bg-gray-50 border-b sticky top-0 z-20">
        <h1 className="font-bold text-sm text-gray-700">سلام، {user?.name}!</h1>
        <div className="flex items-center">
          {user?.role === 'ADMIN' && <Button className="text-teal-500" variant="ghost" size="icon" onClick={() => router.push('/admin/dashboard')}><LayoutDashboard className="h-7 w-7" strokeWidth={2.5} /></Button>}
          {user?.role === 'WORKER' && <Button className="text-teal-500" variant="ghost" size="icon" onClick={() => router.push('/delivery')}><Truck className="h-7 w-7" strokeWidth={2.5} /></Button>}
          <Button className="text-teal-500" variant="ghost" size="icon" onClick={() => router.push('/profile')}><UserIcon className="h-7 w-7" strokeWidth={2.75} /></Button>
          <Button variant="ghost" size="icon" onClick={logout} className="text-red-500"><LogOut className="h-7 w-7"strokeWidth={2.5} /></Button>
        </div>
      </div>

      <div className="p-4">
        <div className="relative">
          {isSearching ? (
            <Loader2 className="absolute right-4 top-3 h-5 w-5 text-gray-400 animate-spin" />
          ) : (
            <Search className="absolute right-4 top-3 h-5 w-5 text-gray-400" />
          )}
          <Input 
            placeholder="جستجوی محصولات..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="pr-12 pl-4 h-12 text-lg rounded-2xl" 
          />
        </div>
      </div>

      {debouncedSearchTerm ? (
        <div className="p-4">
          <h2 className="text-md font-bold text-gray-700 mb-4">نتایج جستجو</h2>
          <div className="grid grid-cols-2 gap-4">
            {paginatedProducts.map(p => <ProductCard key={p.id} product={p} cartItem={cart.find(ci => ci.id === p.id)} onAddToCart={addToCart} onUpdateQuantity={updateCartQuantity} onSelectProduct={handleSelectProduct} onImageClick={setViewingImage} onSupplierClick={handleSupplierClick}/>)}
          </div>
          {isLoadingMore && paginatedProducts.length === 0 && <div className="text-center py-4"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>}
        </div>
      ) : (
        <>
          {banners[0].active && (
            <div className="px-4 pb-4">
             <Link href={banners[0].link} passHref>
                <div className="relative w-full h-24 sm:h-32 rounded-lg overflow-hidden shadow-md cursor-pointer">
                  <Image
                    src={banners[0].image}
                    alt="Banner 1"
                    layout="fill"
                    objectFit="cover"
                    className="w-full h-full"
                  />
              </div>
            </Link>
            </div>
          )}
          
          <div className="py-4">
            <div className="flex items-center gap-2 mb-4 px-4 items-stretch">
              <LayoutGridIcon className="h-6 w-6 text-teal-500" />
                <h2 className="flex text-lg font-semibold text-teal-500 mb-4">
                   دسته‌بندی‌ها
                </h2>
            </div>
            <div className="flex space-x-4 space-x-reverse overflow-x-auto px-4 pb-4">
              {categories.map(c => (
                <div
                  key={c.id}
                  className="flex flex-col items-center justify-start flex-shrink-0 w-20 cursor-pointer group"
                  onClick={() => router.push(`/products?categoryId=${c.id}`)}
                >
                  <div className="h-20 w-20 rounded-full flex items-center justify-center mb-2 border-2 border-teal-600 group-hover:border-green-500 transition-colors">
                    <div className="h-18 w-18 rounded-full flex items-center justify-center border-2 border-gray-200 group-hover:border-green-400 overflow-hidden">
                      {c.image ? (
                        <Image
                          src={c.image}
                          alt={c.name}
                          width={64}
                          height={64}
                          loading="lazy"
                          className="h-full w-full object-cover rounded-full"
                        />
                      ) : (
                        <span className="text-3xl">{c.icon}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-center font-medium text-gray-700 group-hover:text-green-600 transition-colors">
                    {c.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <ProductCarousel 
            title="پیشنهاد ما"
            icon={Star}
            products={featuredProducts} 
            cart={cart}
            onAddToCart={addToCart}
            onUpdateQuantity={updateCartQuantity}
            onSelectProduct={handleSelectProduct}
            onImageClick={setViewingImage}
            onSupplierClick={handleSupplierClick}
          />

          {banners[1].active && (
            <div className="px-4 pb-4">
             <Link href={banners[1].link} passHref>
                <div className="relative w-full h-24 sm:h-32 rounded-lg overflow-hidden shadow-md cursor-pointer">
                  <Image
                    src={banners[1].image}
                    alt="Banner 2"
                    layout="fill"
                    objectFit="cover"
                    className="w-full h-full"
                  />
              </div>
            </Link>
            </div>
          )}

          <ProductCarousel 
            title="پرفروش‌ترین‌ها" 
            icon={TrendingUp}
            products={bestsellerProducts} 
            cart={cart}
            onAddToCart={addToCart}
            onUpdateQuantity={updateCartQuantity}
            onSelectProduct={handleSelectProduct}
            onImageClick={setViewingImage}
            onSupplierClick={handleSupplierClick}
          />
          <ProductCarousel 
            title="جدیدترین‌ها" 
            icon={Sparkles}
            products={newestProducts} 
            cart={cart}
            onAddToCart={addToCart}
            onUpdateQuantity={updateCartQuantity}
            onSelectProduct={handleSelectProduct}
            onImageClick={setViewingImage}
            onSupplierClick={handleSupplierClick}
          />
          
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-md font-semibold text-teal-500">همه محصولات</h2>
              <Button variant="ghost" className="text-green-600" onClick={() => router.push('/products')}>
                مشاهده همه
               <ArrowLeft className="mr-2 h-4 w-4" /></Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {paginatedProducts.map(p => <ProductCard key={p.id} product={p} cartItem={cart.find(ci => ci.id === p.id)} onAddToCart={addToCart} onUpdateQuantity={updateCartQuantity} onSelectProduct={handleSelectProduct} onImageClick={setViewingImage} onSupplierClick={handleSupplierClick} />)}
            </div>
            {isLoadingMore && <div className="text-center py-4"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>}
            {!hasMore && paginatedProducts.length > 0 && <p className="text-center text-gray-500 py-4">به پایان لیست رسیدید.</p>}
          </div>
        </>
      )}
      <ImageDialog imageUrl={viewingImage} onClose={() => setViewingImage(null)} />
    </div>
  );
}