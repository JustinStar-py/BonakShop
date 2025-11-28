// FILE: app/(main)/page.tsx (FIXED)
"use client";

import { useState, useEffect, useCallback, ElementType, useRef } from "react";
import { useAppContext } from "@/context/AppContext";
import apiClient from "@/lib/apiClient";
import type { Product, Category, Supplier, CartItem } from "@/types";
import ProductCard from "@/components/shared/ProductCard";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { 
    Search, Loader2, User as UserIcon, Truck, LayoutDashboard,
    Star, TrendingUp, Sparkles, ArrowLeft, ShoppingBag, LayoutGridIcon,
    ArrowUp
} from "lucide-react";
import useDebounce from "@/hooks/useDebounce";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

type ProductWithRelations = Product & { supplier: Supplier };

// --- Carousel Component ---
function ProductCarousel({ 
    title, icon: Icon, products, cart, onAddToCart, onUpdateQuantity, onSelectProduct, onImageClick, onSupplierClick, onViewAll 
}: any) {
    if (!products || products.length === 0) return null;
    return (
        <div className="py-4 my-2 border-t border-b border-gray-300">
            <div className="flex items-center justify-between px-4 mb-4">
                <div className="flex items-center gap-2">
                    {Icon && <div className="p-1.5 bg-teal-50 rounded-lg text-teal-600"><Icon className="h-5 w-5" /></div>}
                    <h2 className="text-md font-bold text-gray-800">{title}</h2>
                </div>
                <Button variant="ghost" size="sm" className="text-xs text-teal-600 h-8 px-2 hover:bg-teal-50 hover:text-teal-700" onClick={onViewAll}>
                  مشاهده همه <ArrowLeft className="w-3 h-3 mr-1"/>
                </Button>
            </div>
            <div className="flex gap-x-4 overflow-x-auto px-2 pb-6 -mb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {products.map((product: any) => (
                    <div key={product.id} className="flex-shrink-0 w-[160px]">
                        <ProductCard 
                            product={product}
                            cartItem={cart.find((ci:any) => ci.id === product.id)}
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

function ImageDialog({ imageUrl, onClose }: { imageUrl: string | null; onClose: () => void }) {
    if (!imageUrl) return null;
    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="p-0 bg-transparent border-none shadow-none max-w-sm w-full flex justify-center outline-none">
                <div className="relative bg-white p-2 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200">
                     <img src={imageUrl} alt="Product" className="w-full h-auto rounded-2xl object-contain max-h-[60vh]" />
                     <button onClick={onClose} className="absolute -top-3 -right-3 bg-white text-gray-800 rounded-full w-8 h-8 flex items-center justify-center shadow-lg font-bold border border-gray-100 hover:bg-gray-100 transition-colors">✕</button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function HomePage() {
  const { user, cart, addToCart, updateCartQuantity, logout } = useAppContext();
  const router = useRouter();

  const banners = [
    { id: 1, image: "https://studiomani.ir/wp-content/uploads/2019/05/istak-non-alcoholic-beer-02.jpg", link: "/products?supplierId=cmeg3ib2h0000jy04qsat2ejr", active: true },
    { id: 2, image: "https://www.digikala.com/mag/wp-content/uploads/2024/03/9b6907ac-5dd5-4fcd-b4c8-3a0874fcb16d-22-pickles.jpg", link: "/products?categoryId=cmd8x3h5k0000jm047c3bv2zk", active: true },
  ];

  // States
  const [paginatedProducts, setPaginatedProducts] = useState<ProductWithRelations[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<ProductWithRelations[]>([]);
  const [bestsellerProducts, setBestsellerProducts] = useState<ProductWithRelations[]>([]);
  const [newestProducts, setNewestProducts] = useState<ProductWithRelations[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  // Search & Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const debouncedSearchTerm = useDebounce("", 500);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollTick = useRef(false);

  const fetchPaginatedProducts = useCallback(async (pageNum: number, search: string, categoryId = "all", isNewSearch = false) => {
    setIsLoadingMore(true);
    try {
      const response = await apiClient.get(`/products?page=${pageNum}&limit=12&search=${search}&categoryId=${categoryId === "all" ? "" : categoryId}`);
      const newProducts = response.data.products;
      setPaginatedProducts(prev => {
        if (isNewSearch) return newProducts;
        const existingIds = new Set(prev.map(p => p.id));
        return [...prev, ...newProducts.filter((p: Product) => !existingIds.has(p.id))];
      });
      setHasMore(newProducts.length > 0);
      setPage(isNewSearch ? 2 : p => p + 1);
    } catch (err) { setError("خطا در بارگذاری محصولات."); } 
    finally { setIsLoadingMore(false); }
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const [catRes, featRes, newRes, bestRes, prodRes] = await Promise.all([
          apiClient.get('/categories'),
          apiClient.get('/products/lists?type=featured'),
          apiClient.get('/products/lists?type=newest'),
          apiClient.get('/products/lists?type=bestsellers'),
          apiClient.get('/products?page=1&limit=12&search=')
        ]);
        setCategories(catRes.data);
        setFeaturedProducts(featRes.data);
        setNewestProducts(newRes.data);
        setBestsellerProducts(bestRes.data);
        setPaginatedProducts(prodRes.data.products);
        setHasMore(prodRes.data.products.length > 0);
        setPage(2);
      } catch (err) { setError("خطا در دریافت اطلاعات فروشگاه."); } 
      finally { setIsLoading(false); }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    fetchPaginatedProducts(1, "", selectedCategory, true);
  }, [selectedCategory, isLoading, fetchPaginatedProducts]);

  const handleSelectProduct = (product: Product) => router.push(`/products/${product.id}`);
  const handleSupplierClick = (supplierId: string) => router.push(`/products?supplierId=${supplierId}`);

  const handleScroll = useCallback(() => {
    if (scrollTick.current) return;
    scrollTick.current = true;
    requestAnimationFrame(() => {
      const nearingBottom = window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 200;
      if (nearingBottom && !isLoadingMore && hasMore) {
        fetchPaginatedProducts(page, "", selectedCategory);
      }
      setShowScrollTop(window.scrollY > 400);
      scrollTick.current = false;
    });
  }, [page, hasMore, isLoadingMore, selectedCategory, fetchPaginatedProducts]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  if (isLoading) return <LoadingSpinner message="در حال چیدن قفسه‌ها..." />;
  if (error) return <div className="flex flex-col items-center justify-center h-[80vh] text-red-500 gap-2"><div className="text-lg font-bold">خطا</div>{error}<Button onClick={() => window.location.reload()} variant="outline">تلاش مجدد</Button></div>;

  const userName = user?.name ? user.name.trim().split(" ")[0] : "کاربر";

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      
      {/* --- STICKY HEADER SECTION --- */}
      <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-gray-200 shadow-sm transition-all">
        <div className="flex justify-between items-center px-4 pt-3 pb-2">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-md border border-gray-200 overflow-hidden flex items-center justify-center">
                    <Image src="/logo.png" alt="بهار نارون" width={40} height={40} className="object-contain" priority />
                </div>
                <div className="flex flex-col leading-tight">
                    <span className="text-[10px] text-gray-500">خوش آمدید</span>
                    <span className="text-sm font-bold text-gray-800">{userName}</span>
                </div>
            </div>
            <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100" onClick={() => router.push('/products')}>
                    <Search className="h-5 w-5 text-gray-600" />
                </Button>
                {user?.role === 'ADMIN' && <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100" onClick={() => router.push('/admin/dashboard')}><LayoutDashboard className="h-5 w-5 text-gray-600" /></Button>}
                {user?.role === 'WORKER' && <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100" onClick={() => router.push('/delivery')}><Truck className="h-5 w-5 text-gray-600" /></Button>}
                <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-gray-100" onClick={() => router.push('/profile')}><UserIcon className="h-6 w-6 text-gray-700" /></Button>
                <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-gray-100" onClick={() => router.push('/cart')}>
                    <ShoppingBag className="h-6 w-6 text-gray-700" />
                    {cart.length > 0 && <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span></span>}
                </Button>
            </div>
        </div>
        <div className="px-4 pb-3"></div>
      </div>

      {debouncedSearchTerm ? (
        <div className="p-4 animate-in fade-in slide-in-from-bottom-2">
          <h2 className="text-sm font-bold text-gray-500 mb-4 flex items-center gap-2"><Search size={16}/> نتایج جستجو</h2>
          <div className="grid grid-cols-2 gap-3">
            {paginatedProducts.map(p => <ProductCard key={p.id} product={p} cartItem={cart.find(ci => ci.id === p.id)} onAddToCart={addToCart} onUpdateQuantity={updateCartQuantity} onSelectProduct={handleSelectProduct} onImageClick={setViewingImage} onSupplierClick={handleSupplierClick}/>)}
          </div>
          {isLoadingMore && <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-teal-500"/></div>}
        </div>
      ) : (
        <>
         {/* HERO / BANNER */}
          <div className="px-4 mt-6">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-400 text-white shadow-xl">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white,transparent_35%),radial-gradient(circle_at_80%_0%,white,transparent_25%),radial-gradient(circle_at_40%_60%,white,transparent_25%)]" />
              <div className="relative p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] mb-1 text-white/80">بهار نارون</p>
                  <h1 className="text-xl font-black leading-tight mb-2">خرید سریع، قیمت به‌روز</h1>
                  <p className="text-sm text-white/85 mb-4">دسته‌بندی دلخواهت را انتخاب کن و در چند کلیک سفارش بده.</p>
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" variant="secondary" className="rounded-full bg-white text-teal-700 hover:bg-white/90" onClick={() => router.push('/products')}>
                      <ShoppingBag className="w-4 h-4 ml-1" /> شروع خرید
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-full border-white/70 text-teal-700 hover:bg-white/10" onClick={() => router.push('/orders')}>
                      سفارش‌های من
                    </Button>
                  </div>
                </div>
                {banners[0]?.active && (
                  <div className="hidden sm:block w-40 h-28 relative">
                    <Image src={banners[0].image} alt="promo" fill className="object-cover rounded-2xl shadow-lg" loading="lazy" />
                  </div>
                )}
              </div>
            </div>
          </div>

         {/* CATEGORIES */}
        <div className="py-4 mb-2 border-b border-gray-300">
          <div className="flex gap-5 overflow-x-auto px-4 pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {categories.map(c => (
              <div 
                key={c.id} 
                className={`flex flex-col items-center flex-shrink-0 gap-2 cursor-pointer group ${selectedCategory === c.id ? "opacity-100" : "opacity-80 hover:opacity-100"}`} 
                onClick={() => {
                  const next = selectedCategory === c.id ? "all" : c.id;
                  setSelectedCategory(next);
                  setPaginatedProducts([]);
                  setPage(1);
                  fetchPaginatedProducts(1, debouncedSearchTerm, next, true);
                }}
              >
                
                {/* کانتینر حلقه‌ها */}
                <div className="relative">
                  {/* حلقه گرادینت (خارجی‌ترین) */}
                  <div className="p-[3px] rounded-full bg-gradient-to-tr from-teal-400 to-stone-600 group-hover:from-teal-500 group-hover:to-blue-500 transition-all duration-300 shadow-md group-hover:shadow-lg">
                    {/* فاصله بین گرادینت و فیلی */}
                    <div className="bg-white p-[2px] rounded-full">
                      {/* حلقه فیلی نازک‌تر */}
                      <div className="border-[2px] border-gray-300 rounded-full p-[1px] group-hover:border-teal-500 transition-all duration-300">
                        {/* حلقه سفید داخلی */}
                        <div className="bg-white p-[2px] rounded-full">
                          {/* تصویر */}
                          <div className="h-14 w-14 rounded-full overflow-hidden bg-gray-50 relative">
                            {c.image ? (
                              <Image 
                                src={c.image} 
                                alt={c.name} 
                                fill 
                                className="object-cover transform group-hover:scale-110 transition-transform duration-500" 
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xl text-gray-400">
                                {c.icon || "📦"}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <span className="text-[11px] font-semibold text-gray-600 truncate w-16 text-center group-hover:text-teal-600 transition-colors">
                  {c.name}
                </span>
              </div>
            ))}
          </div>
        </div>
          
          {/* --- CAROUSELS WITH CORRECTED PROPS --- */}
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
            onViewAll={() => router.push('/products?sort=bestselling')}
          />

           {banners[1].active && (
            <div className="px-4 mb-5">
             <Link href={banners[1].link} passHref>
                <div className="relative w-full aspect-[3/1] rounded-2xl overflow-hidden shadow-md cursor-pointer hover:shadow-lg transition-all duration-300 active:scale-[0.98]">
                  <Image src={banners[1].image} alt="Banner 2" fill className="object-cover" />
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
            onSupplierClick={handleSupplierClick}
            onImageClick={setViewingImage}
            onViewAll={() => router.push('/products?sort=bestselling')}
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
            onViewAll={() => router.push('/products?sort=newest')}
          />
          
          {/* --- INFINITE GRID --- */}
          <div className="bg-white rounded-t-[2rem] shadow-[0_-10px_30px_rgba(0,0,0,0.03)] border-t border-gray-100 mt-2">
            <div className="p-4">
                <div className="flex justify-between items-center mb-5 mt-2">
                  <h2 className="text-md font-bold text-gray-800 flex items-center gap-2"><LayoutGridIcon className="text-teal-500" size={18}/> همه محصولات</h2>
                  <Button variant="ghost" className="text-teal-600 text-xs hover:bg-teal-50" onClick={() => router.push('/products')}>
                    مشاهده لیست کامل <ArrowLeft className="mr-1 h-3 w-3" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {paginatedProducts.map(p => <ProductCard key={p.id} product={p} cartItem={cart.find(ci => ci.id === p.id)} onAddToCart={addToCart} onUpdateQuantity={updateCartQuantity} onSelectProduct={handleSelectProduct} onImageClick={setViewingImage} onSupplierClick={handleSupplierClick} />)}
                </div>
                {isLoadingMore && <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-teal-500 w-8 h-8"/></div>}
                {!hasMore && paginatedProducts.length > 0 && (
                    <div className="text-center py-10 text-gray-400 text-xs flex flex-col items-center gap-2">
                        <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                        <p>تمام محصولات نمایش داده شدند</p>
                    </div>
                )}
            </div>
          </div>
        </>
      )}
      {showScrollTop && (
        <Button
          size="icon"
          className="fixed bottom-24 right-4 rounded-full bg-white text-teal-600 hover:bg-teal-50 border border-teal-100"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <ArrowUp className="w-5 h-5" />
        </Button>
      )}
      <ImageDialog imageUrl={viewingImage} onClose={() => setViewingImage(null)} />
    </div>
  );
}
