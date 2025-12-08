"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import apiClient from "@/lib/apiClient";
import type { Product, Supplier, Category } from "@prisma/client"; // اطمینان از مسیر درست تایپ‌ها
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    ArrowRight, Plus, Minus, Building2, Layers, 
    Package, Box, User, ShoppingBag, Share2, ShieldCheck
} from "lucide-react";
import Image from "next/image";
import toPersianDigits from "@/utils/numberFormatter";
import { formatToToman } from "@/utils/currencyFormatter";

// تعریف تایپ ترکیبی
type ProductDetails = Product & {
    supplier: Supplier;
    category: Category;
};

export default function ProductDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { cart, addToCart, updateCartQuantity } = useAppContext();

    const [product, setProduct] = useState<ProductDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            const fetchProduct = async () => {
                setIsLoading(true);
                try {
                    const response = await apiClient.get(`/products/${id}`);
                    setProduct(response.data);
                } catch {
                    setError("محصول مورد نظر یافت نشد.");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchProduct();
        }
    }, [id]);

    const cartItem = cart.find(item => item.id === product?.id);
    const quantityInCart = cartItem?.quantity || 0;

    if (isLoading) {
        return <LoadingSpinner message="در حال بارگذاری جزئیات..." />;
    }

    if (error || !product) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <h2 className="text-xl font-bold text-gray-700">{error || "محصولی یافت نشد"}</h2>
                <Button onClick={() => router.back()} variant="outline">بازگشت به فروشگاه</Button>
            </div>
        );
    }
    
    const discountedPrice = product.price * (1 - product.discountPercentage / 100);

    return (
        <div className="min-h-screen bg-gray-50 pb-32">
            
            {/* --- HEADER --- */}
            <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur-md border-b border-gray-100/50">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100" onClick={() => router.back()}>
                    <ArrowRight className="w-6 h-6 text-gray-700"/>
                </Button>
                <span className="font-bold text-sm text-gray-800 truncate max-w-[200px]">{product.name}</span>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100">
                    <Share2 className="w-5 h-5 text-gray-500"/>
                </Button>
            </header>

            <main>
                {/* --- IMAGE SECTION --- */}
                <div className="relative bg-white pb-10 pt-6 rounded-b-[2.5rem] shadow-sm overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#f1f5f9_1px,transparent_1px)] [background-size:16px_16px] opacity-50"></div>
                    
                    <div className="relative z-10 flex justify-center items-center h-56 sm:h-72">
                        <Image 
                            src={product.image || "/placeholder.jpg"} 
                            alt={product.name} 
                            width={300} 
                            height={300} 
                            className="object-contain max-h-full drop-shadow-xl hover:scale-105 transition-transform duration-500"
                        />
                    </div>

                    {/* Badges on Image */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
                        {product.discountPercentage > 0 && (
                            <Badge className="bg-red-500 hover:bg-red-600 text-white border-none px-3 py-1 rounded-full text-xs shadow-md">
                                {toPersianDigits(product.discountPercentage)}% تخفیف
                            </Badge>
                        )}
                        {product.isFeatured && (
                            <Badge className="bg-amber-400 hover:bg-amber-500 text-white border-none px-3 py-1 rounded-full text-xs shadow-md">
                                پیشنهاد ویژه
                            </Badge>
                        )}
                    </div>
                </div>

                {/* --- INFO SECTION --- */}
                <div className="px-5 mt-6 space-y-6">
                    
                    {/* Title & Brand */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2.5 py-1 rounded-lg text-[10px] font-bold">
                                <Building2 size={12}/> {product.supplier.name}
                            </span>
                            {!product.available && (
                                <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 px-2.5 py-1 rounded-lg text-[10px] font-bold">
                                    ناموجود
                                </span>
                            )}
                        </div>
                        <h1 className="text-xl font-black text-gray-800 leading-snug">{product.name}</h1>
                    </div>

                    {/* Price Box */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
                        <span className="text-gray-500 text-sm font-medium">قیمت مصرف‌کننده</span>
                        <div className="flex flex-col items-end">
                            {product.consumerPrice ? (
                                <div className="flex items-center gap-1">
                                    <User size={14} className="text-gray-400"/>
                                    <span className="text-lg font-bold text-gray-700">{formatToToman(product.consumerPrice)}</span>
                                </div>
                            ) : (
                                <span className="text-xs text-gray-400">---</span>
                            )}
                        </div>
                    </div>

                    {/* Attributes Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white p-3 rounded-2xl border border-gray-100 flex flex-col gap-1">
                            <span className="text-[10px] text-gray-400 flex items-center gap-1"><Layers size={12}/> دسته‌بندی</span>
                            <span className="font-bold text-gray-700 text-sm">{product.category.name}</span>
                        </div>
                        <div className="bg-white p-3 rounded-2xl border border-gray-100 flex flex-col gap-1">
                            <span className="text-[10px] text-gray-400 flex items-center gap-1"><Package size={12}/> واحد فروش</span>
                            <span className="font-bold text-gray-700 text-sm">{product.unit}</span>
                        </div>
                        <div className="bg-white p-3 rounded-2xl border border-gray-100 flex flex-col gap-1">
                            <span className="text-[10px] text-gray-400 flex items-center gap-1"><Box size={12}/> موجودی انبار</span>
                            <span className={`font-bold text-sm ${product.stock > 0 ? "text-green-600" : "text-red-500"}`}>
                                {product.stock > 0 ? `${toPersianDigits(product.stock)} عدد` : "تمام شده"}
                            </span>
                        </div>
                        <div className="bg-white p-3 rounded-2xl border border-gray-100 flex flex-col gap-1">
                            <span className="text-[10px] text-gray-400 flex items-center gap-1"><ShieldCheck size={12}/> اصالت کالا</span>
                            <span className="font-bold text-gray-700 text-sm">تایید شده</span>
                        </div>
                    </div>

                    {/* Description */}
                    {product.description && (
                        <div className="bg-white p-4 rounded-2xl border border-gray-100">
                            <h3 className="font-bold text-sm text-gray-800 mb-2">توضیحات محصول</h3>
                            <p className="text-sm text-gray-500 leading-relaxed text-justify">
                                {product.description}
                            </p>
                        </div>
                    )}
                </div>
            </main>

            {/* --- FIXED FOOTER (Action Bar) --- */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 px-6 pb-6 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] rounded-t-[1.5rem]">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-col">
                        {product.discountPercentage > 0 && (
                            <span className="text-xs text-gray-400 line-through decoration-red-400 decoration-2">
                                {formatToToman(product.price)}
                            </span>
                        )}
                        <div className="flex items-center gap-1 text-gray-800">
                            <span className="text-2xl font-black">{formatToToman(discountedPrice)}</span>
                        </div>
                    </div>
                    {product.discountPercentage > 0 && (
                        <Badge variant="destructive" className="rounded-lg px-2">
                            سود شما: {formatToToman(product.price - discountedPrice)}
                        </Badge>
                    )}
                </div>

                {!product.available ? (
                    <Button className="w-full h-12 rounded-xl bg-gray-100 text-gray-400 font-bold text-md hover:bg-gray-200" disabled>
                        ناموجود در انبار
                    </Button>
                ) : quantityInCart === 0 ? (
                    <Button 
                        className="w-full h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-md shadow-lg shadow-green-200 active:scale-[0.98] transition-transform" 
                        onClick={() => addToCart(product)}
                    >
                        <ShoppingBag className="mr-2 h-5 w-5"/> افزودن به سبد خرید
                    </Button>
                ) : (
                    <div className="flex items-center justify-between bg-green-50 rounded-2xl p-1.5 border border-green-100 h-14">
                        <Button 
                            className="w-12 h-full rounded-xl bg-white text-green-700 hover:bg-green-100 shadow-sm border border-green-100" 
                            size="icon" 
                            onClick={() => updateCartQuantity(product.id, quantityInCart + 1)}
                        >
                            <Plus className="h-6 w-6"/>
                        </Button>
                        
                        <div className="flex flex-col items-center">
                            <span className="font-black text-xl text-green-800 leading-none">{toPersianDigits(quantityInCart)}</span>
                            <span className="text-[10px] text-green-600 font-medium">در سبد</span>
                        </div>

                        <Button 
                            className="w-12 h-full rounded-xl bg-white text-red-500 hover:bg-red-50 shadow-sm border border-red-100" 
                            size="icon" 
                            onClick={() => updateCartQuantity(product.id, quantityInCart - 1)}
                        >
                            <Minus className="h-6 w-6"/>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
