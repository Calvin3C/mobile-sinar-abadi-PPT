// ===== PRODUCT =====
export interface ProductVariant {
  id: number;
  productId: string;
  name: string;
  price: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  category: string;
  name: string;
  brand: string;
  weight: number;
  length: number;
  width: number;
  height: number;
  unit: string;
  minPurchase: number;
  price: number;
  sold: number;
  isLarge: boolean;
  img: string;
  variants: ProductVariant[];
  stock: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductsResponse {
  products: Product[];
  totalPages: number;
  currentPage: number;
  totalProducts: number;
}

// ===== USER =====
export interface User {
  id: number;
  username: string;
  name: string;
  phone: string;
  email: string;
  role: 'customer' | 'admin' | 'owner';
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterResponse {
  message: string;
  user: { username: string; role: string; name: string };
}

// ===== ADDRESS =====
export interface CustomerAddress {
  id: number;
  customerId: number;
  label: string;
  name: string;
  phone: string;
  kota: string;
  address: string;
  catatan: string;
  postalCode: string;
  biteshipAreaId: string;
  isMain: boolean;
  pinpoint: boolean;
}

// ===== ORDER =====
export interface OrderItem {
  id: number;
  orderId: string;
  productId: string;
  name: string;
  qty: number;
  price: number;
  weight: number;
  length: number;
  width: number;
  height: number;
  color: string;
}

export interface Shipping {
  id: number;
  orderId: string;
  shippingMethodName: string;
  trackingNumber: string;
  shippingCost: number;
  destinationAddress: string;
  biteshipAreaId: string;
  courierCode: string;
  courierServiceCode: string;
  biteshipOrderId: string;
  waybillId: string;
}

export interface Payment {
  id: number;
  orderId: string;
  paymentMethod: string;
  amountPaid: number;
  paymentStatus: 'Pending' | 'Success' | 'Failed';
  snapToken: string;
  midtransTransId: string;
  paidAt: string;
}

export type OrderStatus = 'pending' | 'success' | 'shipping' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  date: string;
  customerId: number;
  customer: string;
  phone: string;
  address: string;
  shippingMethod: string;
  total: number;
  status: OrderStatus;
  shippingStatus: string;
  proofUploaded: boolean;
  proofUrl: string;
  items: OrderItem[];
  shipping: Shipping;
  payment: Payment;
}

// ===== CART (Local) =====
export interface CartItem {
  id: string;            // productId
  name: string;
  price: number;
  img: string;
  isLarge: boolean;
  weight: number;
  length: number;
  width: number;
  height: number;
  stock: number;
  qty: number;
  minPurchase: number;
  unit: string;
  color: string | null;  // selected variant color
}

// ===== BITESHIP =====
export interface BiteshipArea {
  id: string;
  name: string;
  country_name: string;
  country_code: string;
  administrative_division_level_1_name: string;
  administrative_division_level_1_type: string;
  administrative_division_level_2_name: string;
  administrative_division_level_2_type: string;
  administrative_division_level_3_name: string;
  administrative_division_level_3_type: string;
  postal_code: number;
}

export interface CourierRate {
  courier_name: string;
  courier_code: string;
  courier_service_name: string;
  courier_service_code: string;
  price: number;
  duration: string;
  description: string;
}

export interface RatesResponse {
  pricing: CourierRate[];
}

// ===== TRACKING =====
export interface TrackingStep {
  title: string;
  time: string;
  status: string;
  description?: string;
}

export interface TrackingResponse {
  success: boolean;
  orderId: string;
  steps: TrackingStep[];
  currentStatus: string;
  items: OrderItem[];
}
