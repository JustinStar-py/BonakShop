// Centralized TypeScript type definitions for BonakShop

import { Prisma } from '@prisma/client';

// ============================================
// USER TYPES
// ============================================

export interface User {
  id: string;
  phone: string;
  name: string | null;
  shopName: string | null;
  userType: 'SHOP_OWNER' | 'INDIVIDUAL';
  role: 'ADMIN' | 'CUSTOMER' | 'WORKER';
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithOrders extends User {
  orders: Order[];
}

// ============================================
// PRODUCT TYPES
// ============================================

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  image: string | null;
  stock: number;
  categoryId: string;
  supplierId: string | null;
  discountPercentage: number;
  tags: string[];
  isFeatured: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductWithRelations extends Product {
  category: Category;
  supplier?: Supplier;
}

export interface ProductFormData {
  name: string;
  description?: string;
  price: number;
  stock: number;
  categoryId: string;
  supplierId?: string;
  discountPercentage?: number;
  tags?: string[];
  isFeatured?: boolean;
  isActive?: boolean;
  image?: string;
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'createdAt' | 'price' | 'name' | 'stock';
  order?: 'asc' | 'desc';
  isFeatured?: boolean;
  discountOnly?: boolean;
}

export type ProductWhereInput = {
  id?: { in?: string[] };
  name?: { contains?: string; mode?: 'insensitive' };
  categoryId?: string;
  price?: { gte?: number; lte?: number };
  isFeatured?: boolean;
  discountPercentage?: { gt?: number };
  isActive?: boolean;
};

export type ProductOrderByInput = {
  createdAt?: 'asc' | 'desc';
  price?: 'asc' | 'desc';
  name?: 'asc' | 'desc';
  stock?: 'asc' | 'desc';
};

// ============================================
// CATEGORY TYPES
// ============================================

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryWithProducts extends Category {
  products: Product[];
  _count: { products: number };
}

export interface CategoryFormData {
  name: string;
  description?: string;
  image?: string;
}

// ============================================
// ORDER TYPES
// ============================================

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  createdAt: Date;
}

export interface OrderItemWithProduct extends OrderItem {
  product: Product;
}

export interface Order {
  id: string;
  userId: string;
  totalPrice: number;
  status: OrderStatus;
  deliveryDate: string | null;
  settlementId: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderWithRelations extends Order {
  user: User;
  items: OrderItemWithProduct[];
  settlement: Settlement;
}

export interface CreateOrderData {
  items: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }[];
  totalPrice: number;
  deliveryDate: string;
  settlementId: string;
  notes?: string;
}

// ============================================
// SETTLEMENT TYPES
// ============================================

export interface Settlement {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
}

// ============================================
// CHAT TYPES
// ============================================

export type ChatStatus = 'OPEN' | 'CLOSED';

export interface ChatMessage {
  id: string;
  sessionId: string;
  senderId: string;
  content: string;
  createdAt: string;
  read: boolean;
  sender: {
    id?: string;
    name: string | null;
    role: string;
  };
}

export interface ChatSession {
  id: string;
  userId: string;
  status: ChatStatus;
  createdAt: string;
  updatedAt: string;
  user: {
    name: string | null;
    phone: string;
  };
  messages: ChatMessage[];
  _count: { messages: number };
  lastMessage?: {
    content: string;
    createdAt: string;
  };
}

// ============================================
// SUPPLIER & COMPANY TYPES
// ============================================

export interface Supplier {
  id: string;
  name: string;
  contactInfo: string | null;
  createdAt: Date;
}

export interface Company {
  id: string;
  name: string;
  contactInfo: string | null;
  createdAt: Date;
}

export interface SupplierFormData {
  name: string;
  contactInfo?: string;
}

export interface CompanyFormData {
  name: string;
  contactInfo?: string;
}

// ============================================
// DASHBOARD & ANALYTICS TYPES
// ============================================

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  recentOrders: OrderWithRelations[];
  topProducts: ProductWithRelations[];
  lowStockProducts: Product[];
  customerStats?: {
    segment: string;
    count: number;
    totalRevenue: number;
  }[];
}

export interface CustomerSegment {
  userId: string;
  recency: number;
  frequency: number;
  monetary: number;
  rfmScore: number;
  segment: 'Champions' | 'Loyal' | 'At Risk' | 'Lost';
}

export interface InventoryRecommendation {
  productId: string;
  productName: string;
  currentStock: number;
  recommendedOrder: number;
  reason: string;
}

// ============================================
// DELIVERY & ROUTE TYPES
// ============================================

export interface Location {
  lat: number;
  lng: number;
}

export interface DeliveryStop {
  orderId: string;
  location: Location;
  address?: string;
  customerName?: string;
}

export interface OptimizedRoute {
  stops: DeliveryStop[];
  totalDistance: number;
  estimatedTime: number;
}

export interface DeliveryZone {
  id: string;
  name: string;
  coordinates: Location[];
}

// ============================================
// FORM & VALIDATION TYPES
// ============================================

export interface FormField<T = string> {
  value: T;
  error?: string;
  touched?: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

// ============================================
// CART TYPES
// ============================================

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string | null;
  discountPercentage: number;
  stock: number;
}

// ============================================
// AUTH TYPES
// ============================================

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface OTPCredential {
  code: string;
}

// ============================================
// WALLET TYPES
// ============================================

export type WalletOperation = 'increase' | 'decrease';

export interface WalletTransaction {
  amount: number;
  operation: WalletOperation;
  userId: string;
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export interface Notification {
  id: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// ============================================
// COMPONENT PROP TYPES
// ============================================

export interface NavItemProps {
  href: string;
  activePath: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
  onClick?: () => void;
}

export interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  className?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export interface DialogFormProps<T> {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: T) => void | Promise<void>;
  initialData?: Partial<T>;
  title: string;
}

// ============================================
// EXPORT PRISMA TYPES (for advanced use)
// ============================================

export type {
  Prisma,
};