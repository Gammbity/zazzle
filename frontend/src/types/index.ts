export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone_number?: string;
  date_of_birth?: string;
  address_line: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  full_address: string;
  avatar?: string;
  bio: string;
  is_seller: boolean;
  store_name: string;
  store_description: string;
  created_at: string;
  updated_at: string;
  profile: UserProfile;
}

export interface UserProfile {
  preferred_language: 'en' | 'uz' | 'ru';
  currency: 'USD' | 'UZS';
  email_notifications: boolean;
  sms_notifications: boolean;
  marketing_emails: boolean;
  last_login_ip?: string;
  login_count: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image?: string;
  parent?: number;
  is_active: boolean;
  sort_order: number;
  children: Category[];
  product_count: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  category: Category;
  product_type: string;
  base_price: string;
  sizes_available: string[];
  colors_available: Array<{ name: string; hex?: string }>;
  material: string;
  image: string;
  mockup_images: string[];
  meta_title: string;
  meta_description: string;
  is_active: boolean;
  is_featured: boolean;
  print_area: {
    width?: number;
    height?: number;
    position?: string;
  };
  variants: ProductVariant[];
  images: ProductImage[];
  reviews: ProductReview[];
  review_count: number;
  average_rating: number;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: number;
  size: string;
  color: string;
  color_hex: string;
  sku: string;
  price_adjustment: string;
  final_price: string;
  stock_quantity: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: number;
  image: string;
  alt_text: string;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

export interface ProductReview {
  id: number;
  rating: number;
  title: string;
  comment: string;
  helpful_count: number;
  is_verified: boolean;
  customer_name: string;
  customer_avatar?: string;
  created_at: string;
  updated_at: string;
}

export interface Design {
  id: number;
  title: string;
  description: string;
  category?: DesignCategory;
  tags: string[];
  creator: {
    id: number;
    username: string;
    full_name: string;
    avatar?: string;
    is_seller: boolean;
  };
  design_type: 'upload' | 'generated' | 'template';
  status: 'pending' | 'approved' | 'rejected' | 'private';
  is_public: boolean;
  is_premium: boolean;
  price: string;
  file_size?: number;
  width?: number;
  height?: number;
  dpi: number;
  download_count: number;
  usage_count: number;
  file_url?: string;
  optimized_url?: string;
  license: DesignLicense;
  created_at: string;
  updated_at: string;
}

export interface DesignCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  is_active: boolean;
  sort_order: number;
  design_count: number;
  created_at: string;
  updated_at: string;
}

export interface DesignLicense {
  license_type: 'personal' | 'commercial' | 'extended' | 'exclusive';
  allows_modification: boolean;
  allows_resale: boolean;
  allows_redistribution: boolean;
  attribution_required: boolean;
  max_usage_count?: number;
  expiry_date?: string;
  created_at: string;
}

export interface Order {
  id: number;
  order_number: string;
  customer: {
    id: number;
    email: string;
    full_name: string;
    phone_number?: string;
  };
  status: string;
  subtotal: string;
  tax_amount: string;
  shipping_cost: string;
  discount_amount: string;
  total_amount: string;
  shipping_name: string;
  shipping_email: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  shipping_country: string;
  customer_notes: string;
  admin_notes: string;
  tracking_number: string;
  carrier: string;
  coupon_code: string;
  shipping_method_info?: ShippingMethod;
  items: OrderItem[];
  payments: Payment[];
  created_at: string;
  updated_at: string;
  shipped_at?: string;
  delivered_at?: string;
}

export interface OrderItem {
  id: number;
  product_name: string;
  product_type: string;
  product_sku: string;
  size: string;
  color: string;
  design_title: string;
  design_file_url: string;
  unit_price: string;
  quantity: number;
  total_price: string;
  production_status: string;
  print_specifications: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: number;
  payment_id: string;
  payment_method: string;
  status: string;
  amount: string;
  currency: string;
  gateway_transaction_id: string;
  created_at: string;
  processed_at?: string;
}

export interface ShippingMethod {
  id: number;
  name: string;
  description: string;
  base_cost: string;
  cost_per_item: string;
  min_delivery_days: number;
  max_delivery_days: number;
  available_countries: string[];
}

export interface Coupon {
  id: number;
  code: string;
  name: string;
  description: string;
  discount_type: 'percentage' | 'fixed' | 'free_shipping';
  discount_value: string;
  usage_limit?: number;
  usage_count: number;
  per_user_limit?: number;
  valid_from: string;
  valid_to: string;
  minimum_amount: string;
  is_active: boolean;
}

// Cart types
export interface CartItem {
  id: string;
  product: Product;
  variant: ProductVariant;
  design?: Design;
  quantity: number;
  print_specifications?: Record<string, any>;
}

export interface Cart {
  items: CartItem[];
  total_items: number;
  subtotal: number;
  shipping_cost: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  coupon_code?: string;
  shipping_method?: ShippingMethod;
}

// API response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
}

export interface CheckoutForm {
  shipping_name: string;
  shipping_email: string;
  shipping_phone?: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  shipping_country: string;
  customer_notes?: string;
  coupon_code?: string;
  shipping_method?: number;
  payment_method: string;
  stripe_token?: string;
}
