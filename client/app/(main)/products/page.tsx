"use client";

import { useState, useEffect, useCallback } from "react";
import { useAppContext } from "@/context/AppContext";
import apiClient from "@/lib/apiClient";
import type { Product, Category, Supplier } from "@/types"; // تایپ‌های خودتان را ایمپورت کنید
import ProductCard from "@/components/shared/ProductCard";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Search, Loader2, SlidersHorizontal, X, 
  ArrowUpDown, Check, Tag, Filter 
} from "lucide-react";
import useDebounce from "@/hooks/useDebounce";
import { useRouter, useSearchParams } from "next/navigation";

type SortOption = 'newest' | 'priceAsc' | 'priceDesc' | 'bestselling';

export default function ProductsPage() {
  const { cart, addToCart, updateCartQuantity } = useAppContext();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allSuppliers, setAllSuppliers] = useState<Supplier[]>([]);
  
  // Control states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Filter & Search states
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('categoryId') || 'all');
  const [selectedSupplier, setSelectedSupplier] = useState<string>(searchParams.get('supplierId') || 'all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [isSearching, setIsSearching] = useState(false);

  // تعداد فیلترهای فعال (برای نمایش بج روی دکمه فیلتر)
  const activeFiltersCount = (selectedCategory !== 'all' ? 1 : 0) + (selectedSupplier !== 'all' ? 1 : 0);

  const fetchProducts = useCallback(async (pageNum: number, category: string, supplier: string, search: string, sort: SortOption, isNewFilter = false) => {
    if (!isNewFilter && isLoadingMore) return;
    setIsLoadingMore(true);
    if (isNewFilter) setIsSearching(true);

    const categoryQuery = category === "all" ? "" : `&categoryId=${category}`;
    const supplierQuery = supplier === "all" ? "" : `&supplierId=${supplier}`;
    
    // تبدیل گزینه مرتب‌سازی به پارامتر API (فرض بر این است که API شما این پارامترها را می‌پذیرد)
    // اگر API هنوز مرتب‌سازی ندارد، این بخش را نادیده می‌گیرد
    let sortQuery = "";
    switch (sort) {
        case 'priceAsc': sortQuery = "&sortBy=price&order=asc"; break;
        case 'priceDesc': sortQuery = "&sortBy=price&order=desc"; break;
        case 'bestselling': sortQuery = "&sortBy=sales&order=desc"; break;
        default: sortQuery = "&sortBy=createdAt&order=desc"; // newest
    }
    
    try {
      const response = await apiClient.get(`/products?page=${pageNum}&limit=12&search=${search}${categoryQuery}${supplierQuery}${sortQuery}`);
      const newProducts: Product[] = response.data.products;
      
      setProducts(prev => {
        if (isNewFilter) return newProducts;
        const existingIds = new Set(prev.map(p => p.id));
        return [...prev, ...newProducts.filter(p => !existingIds.has(p.id))];
      });

      setHasMore(newProducts.length > 0);
      setPage(isNewFilter ? 2 : p => p + 1);

    } catch (err) {
      setError("خطا در بارگذاری محصولات.");
    } finally {
      setIsLoadingMore(false);
      if (isNewFilter) setIsSearching(false);
    }
  }, [isLoadingMore]);

  // Initial load
  useEffect(() => {
    const loadInitialData = async () => {
        setIsLoading(true);
        try {
            const initialCategory = searchParams.get('categoryId') || 'all';
            const initialSupplier = searchParams.get('supplierId') || 'all';
            setSelectedCategory(initialCategory);
            setSelectedSupplier(initialSupplier);

            const [categoriesRes, suppliersRes] = await Promise.all([
                apiClient.get("/categories"),
                apiClient.get("/suppliers")
            ]);
            setCategories(categoriesRes.data);
            setAllSuppliers(suppliersRes.data);
            
            await fetchProducts(1, initialCategory, initialSupplier, "", 'newest', true);

        } catch (err) {
            setError("خطا در دریافت اطلاعات.");
        } finally {
            setIsLoading(false);
        }
    }
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle filter/search/sort changes
  useEffect(() => {
    if (!isLoading) {
        fetchProducts(1, selectedCategory, selectedSupplier, debouncedSearchTerm, sortOption, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedSupplier, debouncedSearchTerm, sortOption]);

  // Infinite scroll
  const handleScroll = useCallback(() => {
    if (window.innerHeight + document.documentElement.scrollTop < document.documentElement.offsetHeight - 250 || isLoadingMore || !hasMore) {
      return;
    }
    fetchProducts(page, selectedCategory, selectedSupplier, debouncedSearchTerm, sortOption);
  }, [page, hasMore, isLoadingMore, selectedCategory, selectedSupplier, debouncedSearchTerm, sortOption, fetchProducts]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleSelectProduct = (product: Product) => {
    router.push(`/products/${product.id}`);
  };

  const handleSupplierClick = (supplierId: string) => {
    setSelectedCategory("all");
    setSelectedSupplier(supplierId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
      setSelectedCategory("all");
      setSelectedSupplier("all");
      setSearchTerm("");
      setIsFilterOpen(false);
  };

  if (isLoading) return <LoadingSpinner message="در حال بارگذاری محصولات..." />;

  return (
    <div className="pb-24 min-h-screen bg-gray-50">
      
      {/* --- Header & Search & Filter Bar --- */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm px-4 py-3">
        <div className="flex gap-3 mb-3">
            <div className="relative flex-grow group">
                {isSearching ? (
                    <Loader2 className="absolute right-3 top-3 h-5 w-5 text-teal-500 animate-spin" />
                ) : (
                    <Search className="absolute right-3 top-3 h-5 w-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                )}
                <Input 
                    placeholder="جستجوی محصول..." 
                    className="pr-10 h-11 rounded-xl bg-gray-100 border-transparent focus:bg-white focus:border-teal-500 transition-all text-sm" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            {/* Filter Button (Opens Sheet) */}
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetTrigger asChild>
                    <Button variant="outline" className="h-11 px-3 rounded-xl border-gray-200 bg-white hover:bg-gray-50 relative">
                        <SlidersHorizontal size={20} className="text-gray-600"/>
                        {activeFiltersCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-teal-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                                {activeFiltersCount}
                            </span>
                        )}
                    </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-[2rem] p-0 max-h-[85vh] overflow-y-auto">
                    <SheetHeader className="p-5 border-b sticky top-0 bg-white z-10">
                        <div className="flex justify-between items-center">
                            <SheetTitle className="text-right flex items-center gap-2 text-gray-800"><Filter size={18}/> فیلتر محصولات</SheetTitle>
                            {activeFiltersCount > 0 && (
                                <Button variant="ghost" size="sm" className="text-red-500 h-8 text-xs" onClick={clearFilters}>
                                    حذف همه
                                </Button>
                            )}
                        </div>
                    </SheetHeader>
                    
                    <div className="p-5 space-y-6">
                        {/* Category Filter */}
                        <div>
                            <h3 className="font-bold text-sm mb-3 text-gray-700 flex items-center gap-2"><Tag size={16}/> دسته‌بندی</h3>
                            <div className="flex flex-wrap gap-2">
                                <Badge 
                                    variant={selectedCategory === 'all' ? "default" : "outline"} 
                                    className={`cursor-pointer h-9 px-4 rounded-lg ${selectedCategory === 'all' ? 'bg-teal-500 hover:bg-teal-600' : 'hover:bg-gray-100'}`}
                                    onClick={() => setSelectedCategory('all')}
                                >
                                    همه
                                </Badge>
                                {categories.map(cat => (
                                    <Badge 
                                        key={cat.id}
                                        variant={selectedCategory === cat.id ? "default" : "outline"} 
                                        className={`cursor-pointer h-9 px-4 rounded-lg ${selectedCategory === cat.id ? 'bg-teal-500 hover:bg-teal-600' : 'hover:bg-gray-100'}`}
                                        onClick={() => setSelectedCategory(cat.id)}
                                    >
                                        {cat.name}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        <Separator />

                        {/* Supplier Filter */}
                        <div>
                            <h3 className="font-bold text-sm mb-3 text-gray-700">تامین‌کننده / برند</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <div 
                                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${selectedSupplier === 'all' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-gray-200 hover:border-gray-300'}`}
                                    onClick={() => setSelectedSupplier('all')}
                                >
                                    <span className="text-sm">همه برندها</span>
                                    {selectedSupplier === 'all' && <Check size={16}/>}
                                </div>
                                {allSuppliers.map(sup => (
                                    <div 
                                        key={sup.id}
                                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${selectedSupplier === sup.id ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-gray-200 hover:border-gray-300'}`}
                                        onClick={() => setSelectedSupplier(sup.id)}
                                    >
                                        <span className="text-sm truncate">{sup.name}</span>
                                        {selectedSupplier === sup.id && <Check size={16}/>}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="sticky bottom-0 bg-white pt-4 pb-8 border-t mt-8">
                             <Button className="w-full bg-teal-600 hover:bg-teal-700 h-12 text-lg rounded-xl shadow-lg shadow-teal-100" onClick={() => setIsFilterOpen(false)}>
                                 مشاهده نتایج
                             </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>

        {/* Quick Sort Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <span className="text-xs text-gray-400 whitespace-nowrap flex items-center gap-1"><ArrowUpDown size={12}/> مرتب‌سازی:</span>
            <button 
                onClick={() => setSortOption('newest')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${sortOption === 'newest' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
                جدیدترین
            </button>
            <button 
                onClick={() => setSortOption('bestselling')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${sortOption === 'bestselling' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
                پرفروش‌ترین
            </button>
            <button 
                onClick={() => setSortOption('priceAsc')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${sortOption === 'priceAsc' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
                ارزان‌ترین
            </button>
            <button 
                onClick={() => setSortOption('priceDesc')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${sortOption === 'priceDesc' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
                گران‌ترین
            </button>
        </div>

        {/* Active Filters Chips */}
        {(selectedCategory !== 'all' || selectedSupplier !== 'all' || searchTerm) && (
            <div className="flex flex-wrap gap-2 mt-3">
                {searchTerm && (
                    <div className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded-md text-[10px]">
                        <span>جستجو: {searchTerm}</span>
                        <X size={12} className="cursor-pointer" onClick={() => setSearchTerm("")}/>
                    </div>
                )}
                {selectedCategory !== 'all' && (
                    <div className="flex items-center gap-1 bg-teal-50 text-teal-600 px-2 py-1 rounded-md text-[10px]">
                        <span>{categories.find(c => c.id === selectedCategory)?.name}</span>
                        <X size={12} className="cursor-pointer" onClick={() => setSelectedCategory('all')}/>
                    </div>
                )}
                 {selectedSupplier !== 'all' && (
                    <div className="flex items-center gap-1 bg-purple-50 text-purple-600 px-2 py-1 rounded-md text-[10px]">
                        <span>{allSuppliers.find(s => s.id === selectedSupplier)?.name}</span>
                        <X size={12} className="cursor-pointer" onClick={() => setSelectedSupplier('all')}/>
                    </div>
                )}
            </div>
        )}
      </div>

      {/* --- Product Grid --- */}
      {error ? (
          <div className="text-center text-red-500 p-8 flex flex-col items-center gap-2">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>تلاش مجدد</Button>
          </div>
      ) : (
        <div className="p-4 grid grid-cols-2 gap-3">
            {products.map(p => (
            <ProductCard
                key={p.id}
                product={p as any}
                cartItem={cart.find(item => item.id === p.id)}
                onAddToCart={addToCart}
                onUpdateQuantity={updateCartQuantity}
                onSelectProduct={handleSelectProduct}
                onImageClick={() => {}}
                onSupplierClick={handleSupplierClick}
            />
            ))}
        </div>
      )}
      
      {/* --- Loading & Empty States --- */}
      {isLoadingMore && <div className="text-center py-6 flex justify-center"><Loader2 className="h-8 w-8 text-teal-500 animate-spin" /></div>}
      
      {!hasMore && products.length > 0 && (
          <div className="text-center text-gray-400 py-8 text-xs flex flex-col items-center gap-2">
               <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
               <span>پایان لیست محصولات</span>
          </div>
      )}
      
      {!isLoading && !isLoadingMore && products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Search size={48} className="mb-4 text-gray-200"/>
              <p className="font-medium">محصولی یافت نشد!</p>
              <p className="text-xs mt-1">فیلترها را تغییر دهید یا عبارت دیگری جستجو کنید.</p>
              <Button variant="link" className="text-teal-500 mt-2" onClick={clearFilters}>پاک کردن فیلترها</Button>
          </div>
      )}
    </div>
  );
}