// FILE: app/(main)/products/[id]/page.tsx (FIXED)
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import apiClient from "@/lib/apiClient";
import type { Product, Supplier, Category } from "@prisma/client";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, Plus, Minus, Building, Tag, Package, Box, User } from "lucide-react";
import Image from "next/image";
import toPersianDigits from "@/utils/persianNum";

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
                } catch (err) {
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
        return <LoadingSpinner message="در حال بارگذاری جزئیات محصول..." />;
    }

    if (error || !product) {
        return (
            <div className="text-center p-8">
                <h2 className="text-2xl font-bold mb-4">{error || "محصولی یافت نشد"}</h2>
                <Button onClick={() => router.back()}>بازگشت</Button>
            </div>
        );
    }
    
    const discountedPrice = product.price * (1 - product.discountPercentage / 100);

    return (
        // v-- CHANGE: یک پدینگ پایین به اندازه ارتفاع نوار سبد خرید اضافه شد
        <div className="max-w-4xl mx-auto pb-24">
            <header className="p-4 flex items-center border-b">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowRight />
                </Button>
                <h1 className="font-bold text-md mr-4">{product.name}</h1>
            </header>

            <main className="p-4">
                <div className="bg-white rounded-lg shadow-sm p-4">
                    <div className="flex justify-center items-center h-48 mb-6">
                        <Image src={product.image || "/placeholder.jpg"} alt={product.name} width={200} height={200} className="object-contain max-h-full"/>
                    </div>

                    <div className="space-y-4 text-right">
                        <h2 className="text-lg font-semibold">{product.name}</h2>
                        <p className="text-muted-foreground">{product.description}</p>
                        
                        <Separator />
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                                <Building size={16} className="text-gray-500"/>
                                <strong>شرکت:</strong> {product.supplier.name}
                            </div>
                            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                                <Tag size={16} className="text-gray-500"/>
                                <strong>دسته:</strong> {product.category.name}
                            </div>
                            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                                <Package size={16} className="text-gray-500"/>
                                <strong>واحد:</strong> {product.unit}
                            </div>
                            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                                <Box size={16} className="text-gray-500"/>
                                <strong>موجودی:</strong> {product.stock > 0 ? `${product.stock} عدد` : "ناموجود"}
                            </div>
                        </div>
                                                
                       {product.consumerPrice && (
                           <div className="flex justify-between items-center border-t pt-3">
                                 <p className="text-sm text-muted-foreground flex items-center gap-1"><User size={14}/> قیمت مصرف‌کننده</p>
                                 <p className="text-md font-bold text-gray-700">{toPersianDigits(product.consumerPrice)} ریال</p>
                             </div>
                        )}

                        <Separator />

                        <div className="flex justify-between items-center pt-2">
                            <p className="text-sm text-muted-foreground">قیمت</p>
                            <div className="text-left">
                                {product.discountPercentage > 0 && (
                                    <div className="flex items-center gap-2 justify-end">
                                        <Badge variant="destructive">%{toPersianDigits(product.discountPercentage)}</Badge>
                                        <p className="text-lg text-gray-400 line-through">{toPersianDigits(product.price)} ریال</p>
                                    </div>
                                )}
                                <p className="text-lg font-extrabold text-blue-500">{toPersianDigits(discountedPrice)} ریال</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Add to Cart Section */}
                {/* v-- CHANGE: موقعیت از bottom-0 به bottom-20 تغییر کرد */}
                <div className="fixed bottom-20 left-0 right-0 p-4 bg-white border-t shadow-lg max-w-4xl mx-auto z-40">
                    {!product.available ? (
                        <Button className="w-full" size="lg" disabled>ناموجود</Button>
                    ) : quantityInCart === 0 ? (
                        <Button className="w-full bg-blue-500 text-white" size="lg" onClick={() => addToCart(product)}>افزودن به سبد خرید</Button>
                    ) : (
                        <div className="flex items-center justify-between">
                            <p className="font-semibold">در سبد خرید</p>
                            <div className="flex items-center gap-3">
                                <Button className="bg-teal-500 text-white" size="icon" onClick={() => updateCartQuantity(product.id, quantityInCart + 1)}><Plus /></Button>
                                <span className="text-xl font-bold w-10 text-center">{quantityInCart}</span>
                                <Button variant="outline" size="icon" onClick={() => updateCartQuantity(product.id, quantityInCart - 1)}><Minus /></Button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}