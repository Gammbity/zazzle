// Shared commerce types — mirrors the shape of the Django REST API responses.
// Ported from the old Next.js frontend's `lib/commerce.ts`, which was
// validated against the real backend; keep this the single source of truth
// instead of redeclaring shapes ad hoc in components.

export type DeliveryMethod = 'DELIVERY' | 'PICKUP';

export type UserRole
  = | 'customer'
    | 'production_manager'
    | 'production_admin'
    | 'super_admin'
    | 'support';

export type ProductionCenterType = 'PARTNER' | 'OWN';

export interface CurrentUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  is_staff?: boolean;
  is_active?: boolean;
  role?: UserRole;
  role_display?: string;
  is_super_admin?: boolean;
  is_production_admin?: boolean;
  is_production_manager?: boolean;
  production_center?: number | null;
  production_center_name?: string | null;
  production_center_slug?: string | null;
  profile?: {
    phone_number?: string;
    display_name?: string;
  };
}

export interface ProductionCenter {
  id: number;
  name: string;
  slug: string;
  type: ProductionCenterType;
  address: string;
  latitude: string | number | null;
  longitude: string | number | null;
  phone: string;
  email: string;
  is_active: boolean;
  supports_pickup: boolean;
  supports_delivery: boolean;
  sort_order: number;
  distance_km?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface CommerceVariant {
  id: number;
  size: string;
  color: string;
  color_hex: string;
  sku: string;
  sale_price: string;
  variant_name: string;
  is_default: boolean;
  is_active: boolean;
  production_cost?: string;
  profit_margin?: string;
  profit_percentage?: string;
  stock_quantity?: number;
}

export interface CommerceProductType {
  id: number;
  name: string;
  slug: string;
  category: string;
  description: string;
  available_sizes: string[];
  available_colors: Array<{ name: string; hex?: string }>;
  has_size_variants: boolean;
  has_color_variants: boolean;
  variants: CommerceVariant[];
  is_active?: boolean;
  sort_order?: number;
  variant_count?: number;
  created_at?: string;
  updated_at?: string;
}

// Shape of `/api/products/` list items — the backend only has an id-based
// detail route, no slug lookup, so the customizer resolves price by
// filtering this list client-side instead of fetching a single product.
export interface ProductListItem {
  id: number;
  name: string;
  slug: string;
  category: string;
  price_range: { min_price: number; max_price: number; currency: string };
}

export interface ProductListResponse {
  count: number;
  results: ProductListItem[];
}

export interface CommerceDraft {
  uuid: string;
  name: string;
  status: string;
}

export interface CartItem {
  uuid: string;
  draft_uuid: string;
  draft_name: string;
  product_name: string;
  product_category: string;
  product_type_name: string;
  variant_display: string;
  quantity: number;
  unit_price: string;
  total_price: string;
}

export interface Cart {
  uuid: string;
  total_items: number;
  subtotal: string;
  shipping_cost: string;
  tax_amount: string;
  discount_amount: string;
  total_amount: string;
  is_empty: boolean;
  items: CartItem[];
}

export type OrderStatus
  = | 'NEW'
    | 'PAYMENT_PENDING'
    | 'PAID'
    | 'READY_FOR_PRODUCTION'
    | 'IN_PRODUCTION'
    | 'QUALITY_CHECK'
    | 'READY_FOR_PICKUP'
    | 'READY_FOR_DELIVERY'
    | 'COMPLETED'
    | 'CANCELLED';

export interface OrderSummary {
  id: number;
  order_number: string;
  customer_name?: string;
  status: OrderStatus;
  delivery_method?: DeliveryMethod;
  production_center?: number | null;
  production_center_name?: string | null;
  total_amount: string;
  item_count: number;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  product_name: string;
  product_type: string;
  product_sku: string;
  size: string;
  color: string;
  design_title: string;
  unit_price: string;
  quantity: number;
  total_price: string;
  production_status: string;
  print_specifications: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface OrderDetail {
  id: number;
  order_number: string;
  customer: {
    id: number;
    email: string;
    full_name: string;
    phone_number?: string;
  };
  status: OrderStatus;
  subtotal: string;
  tax_amount: string;
  shipping_cost: string;
  discount_amount: string;
  total_amount: string;
  delivery_method: DeliveryMethod;
  latitude?: string | number | null;
  longitude?: string | number | null;
  production_center?: ProductionCenter | null;
  shipping_name: string;
  shipping_email: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  shipping_country: string;
  customer_notes: string;
  admin_notes?: string;
  tracking_number?: string;
  carrier?: string;
  items: OrderItem[];
  payments: Array<{
    id: number;
    payment_id: string;
    payment_method: string;
    status: string;
    amount: string;
    currency: string;
    created_at: string;
    processed_at?: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface OrderStats {
  total_orders: number;
  new_orders: number;
  payment_pending_orders: number;
  paid_orders: number;
  in_production_orders: number;
  done_orders: number;
  total_spent?: string;
  total_revenue?: string;
}

export interface OrderAnalytics {
  revenue_by_day: Array<{
    date: string;
    orders: number;
    revenue: string;
  }>;
  orders_by_status: Array<{
    status: string;
    label: string;
    count: number;
  }>;
  orders_by_delivery_method: Array<{
    method: string;
    label: string;
    count: number;
  }>;
  orders_by_center: Array<{
    center: string;
    count: number;
  }>;
  top_products: Array<{
    product_name: string;
    units_sold: number;
    revenue: string;
  }>;
}

export interface CheckoutInput {
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  delivery_method?: DeliveryMethod;
  latitude?: number | null;
  longitude?: number | null;
  production_center?: number | null;
  auto_select?: boolean;
  shipping_name?: string;
  shipping_email?: string;
  shipping_phone?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_postal_code?: string;
  shipping_country?: string;
  customer_notes?: string;
  note?: string;
}

export interface CheckoutResult {
  order: OrderDetail;
  order_number: string;
  order_id: number;
  total_amount: string;
  status: string;
}

export interface PaymentInitResult {
  transaction: {
    id: number;
    status: string;
    provider: string;
    amount_uzs: number;
  };
  provider_payload: {
    redirect_url?: string;
    payment_params?: Record<string, string>;
    [key: string]: unknown;
  };
}

export interface AuthPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends AuthPayload {
  username?: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  display_name?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type ListResponse<T> = PaginatedResponse<T> | T[];
