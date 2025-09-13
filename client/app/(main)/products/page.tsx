// FILE: app/(main)/products/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAppContext } from "@/context/AppContext";
import apiClient from "@/lib/apiClient";
import type { Product, Category, Supplier } from "@prisma/client";
import ProductCard from "@/components/shared/ProductCard";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2 } from "lucide-react";
import useDebounce from "@/hooks/useDebounce";
import { useRouter, useSearchParams } from "next/navigation"; // <-- CHANGE: useSearchParams اضافه شد

export default function ProductsPage() {
  const { cart, addToCart, updateCartQuantity } = useAppContext();
  const router = useRouter();
  const searchParams = useSearchParams(); // <-- CHANGE: هوک برای خواندن پارامترهای URL

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allSuppliers, setAllSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);

  // Control states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Filter & Search states
  // v-- CHANGE: مقدار اولیه فیلترها از URL خوانده می‌شود
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('categoryId') || 'all');
  const [selectedSupplier, setSelectedSupplier] = useState<string>(searchParams.get('supplierId') || 'all');
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [isSearching, setIsSearching] = useState(false);

  const fetchProducts = useCallback(async (pageNum: number, category: string, supplier: string, search: string, isNewFilter = false) => {
    if (!isNewFilter && isLoadingMore) return;
    setIsLoadingMore(true);
    if (isNewFilter) setIsSearching(true);

    const categoryQuery = category === "all" ? "" : `&categoryId=${category}`;
    const supplierQuery = supplier === "all" ? "" : `&supplierId=${supplier}`;
    
    try {
      const response = await apiClient.get(`/products?page=${pageNum}&limit=12&search=${search}${categoryQuery}${supplierQuery}`);
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
            // v-- CHANGE: مقدار اولیه فیلترها از پارامترهای URL خوانده می‌شود
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
            setFilteredSuppliers(suppliersRes.data);
            
            // v-- CHANGE: اولین فراخوانی با فیلترهای اولیه انجام می‌شود
            await fetchProducts(1, initialCategory, initialSupplier, "", true);

        } catch (err) {
            setError("خطا در دریافت اطلاعات.");
        } finally {
            setIsLoading(false);
        }
    }
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // <-- CHANGE: وابستگی به searchParams حذف شد تا فقط یک بار اجرا شود
  
  // Update suppliers based on category
  useEffect(() => {
    const updateSuppliers = async () => {
        if (selectedCategory === 'all') {
            setFilteredSuppliers(allSuppliers);
            // اگر شرکتی از قبل انتخاب شده که در لیست جدید نیست، آن را ریست کن
            if (!allSuppliers.some((s: Supplier) => s.id === selectedSupplier)) {
                setSelectedSupplier("all");
            }
        } else {
            const response = await apiClient.get(`/suppliers?categoryId=${selectedCategory}`);
            setFilteredSuppliers(response.data);
            // اگر شرکتی از قبل انتخاب شده که در لیست جدید نیست، آن را ریست کن
            if (!response.data.some((s: Supplier) => s.id === selectedSupplier)) {
                setSelectedSupplier("all");
            }
        }
    };
    if (!isLoading) {
      updateSuppliers();
    }
  }, [selectedCategory, allSuppliers, isLoading]);

  // Handle filter/search changes
  useEffect(() => {
    if (!isLoading) {
        fetchProducts(1, selectedCategory, selectedSupplier, debouncedSearchTerm, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedSupplier, debouncedSearchTerm]);

  // Infinite scroll
  const handleScroll = useCallback(() => {
    if (window.innerHeight + document.documentElement.scrollTop < document.documentElement.offsetHeight - 150 || isLoadingMore || !hasMore) {
      return;
    }
    fetchProducts(page, selectedCategory, selectedSupplier, debouncedSearchTerm);
  }, [page, hasMore, isLoadingMore, selectedCategory, selectedSupplier, debouncedSearchTerm, fetchProducts]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleSelectProduct = (product: Product) => {
    router.push(`/products/${product.id}`);
  };

  // <-- CHANGE: این تابع جدید برای مدیریت کلیک روی برند اضافه شد
  const handleSupplierClick = (supplierId: string) => {
    setSelectedCategory("all"); // ریست کردن فیلتر دسته‌بندی
    setSelectedSupplier(supplierId);
  };

  if (isLoading) {
    return <LoadingSpinner message="در حال بارگذاری محصولات..." />;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-right mb-4">همه محصولات</h1>
      <div className="space-y-4 mb-6 sticky top-0 bg-white/80 backdrop-blur-sm z-10 py-2">
        <div className="relative">
          {isSearching ? (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5 animate-spin" />
          ) : (
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
          )}
          <Input 
            placeholder="جستجو..." 
            className="pr-10" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="انتخاب دسته‌بندی" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه دسته‌بندی‌ها</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
              <SelectTrigger>
                <SelectValue placeholder="انتخاب شرکت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه شرکت‌ها</SelectItem>
                {filteredSuppliers.map(sup => (
                  <SelectItem key={sup.id} value={sup.id}>{sup.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
        </div>
      </div>

      {error && <div className="text-center text-red-500 p-4">{error}</div>}
      
      <div className="grid grid-cols-2 gap-4">
        {products.map(p => (
          <ProductCard
            key={p.id}
            product={p as any}
            cartItem={cart.find(item => item.id === p.id)}
            onAddToCart={addToCart}
            onUpdateQuantity={updateCartQuantity}
            onSelectProduct={handleSelectProduct}
            onImageClick={() => {}}
            onSupplierClick={handleSupplierClick} // <-- CHANGE: تابع جدید پاس داده شد
          />
        ))}
      </div>
      
      {isLoadingMore && <div className="text-center py-4"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>}
      {!hasMore && products.length > 0 && <p className="text-center text-gray-500 py-4">به پایان لیست رسیدید.</p>}
      {!isLoading && !isLoadingMore && products.length === 0 && <p className="text-center text-gray-500 py-4">محصولی با این مشخصات یافت نشد.</p>}
    </div>
  );
}