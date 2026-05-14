// API configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || '/api',
  TIMEOUT: 10000,
} as const;

// Application routes
export const ROUTES = {
  HOME: '/',
  PRODUCTS: '/products',
  PRODUCT_DETAIL: (slug: string) => `/products/${slug}`,
  DESIGNS: '/designs',
  DESIGN_DETAIL: (id: number) => `/designs/${id}`,
  CART: '/cart',
  CHECKOUT: '/checkout',
  ORDERS: '/orders',
  ORDER_DETAIL: (orderNumber: string) => `/orders/${orderNumber}`,
  PROFILE: '/profile',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  ADMIN: '/admin',
} as const;

// Product types
export const PRODUCT_TYPES = [
  'tshirt',
  'hoodie',
  'mug',
  'pen',
  'poster',
  'canvas',
  'sticker',
  'phone_case',
  'tote_bag',
] as const;

// Order statuses
export const ORDER_STATUSES = [
  'pending',
  'paid',
  'processing',
  'printing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
] as const;

// Design statuses
export const DESIGN_STATUSES = [
  'pending',
  'approved',
  'rejected',
  'private',
] as const;

// File upload limits
export const FILE_LIMITS = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/svg+xml',
    'application/pdf',
  ],
  ALLOWED_EXTENSIONS: ['.png', '.jpg', '.jpeg', '.svg', '.pdf'],
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;
