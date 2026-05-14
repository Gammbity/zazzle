import type { SurfaceState } from '@/types/editor';
import type { TextLayer } from '@/types/layer';
import { apiClient } from '@/lib/api-client';

export interface CommerceUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  profile?: {
    phone_number?: string;
    display_name?: string;
  };
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
}

export interface CommerceDraft {
  uuid: string;
  name: string;
  status: string;
}

export interface ProductColorSelection {
  name: string;
  hex: string;
}

export interface CommerceCartItem {
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

export interface CommerceCart {
  uuid: string;
  total_items: number;
  subtotal: string;
  shipping_cost: string;
  tax_amount: string;
  discount_amount: string;
  total_amount: string;
  is_empty: boolean;
  items: CommerceCartItem[];
}

export interface CommerceOrderSummary {
  id: number;
  order_number: string;
  customer_name?: string;
  status: string;
  total_amount: string;
  item_count: number;
  created_at: string;
  updated_at: string;
}

export interface CommerceOrderItem {
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

export interface CommerceOrderDetail {
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
  items: CommerceOrderItem[];
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

export interface CommerceOrderStats {
  total_orders: number;
  new_orders: number;
  payment_pending_orders: number;
  paid_orders: number;
  in_production_orders: number;
  done_orders: number;
  total_spent?: string;
  total_revenue?: string;
}

export interface CheckoutInput {
  contact_name: string;
  contact_email: string;
  contact_phone: string;
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
  order: CommerceOrderDetail;
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

interface AuthResponse {
  access: string;
  refresh: string;
  user: CommerceUser;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

type ListResponse<T> = PaginatedResponse<T> | T[];

interface ApiErrorPayload {
  detail?: string;
  error?: string;
  non_field_errors?: string[];
  [key: string]: unknown;
}

interface ApiErrorLike {
  response?: {
    data?: ApiErrorPayload;
  };
}

const PRODUCT_SLUG_TO_CATEGORY: Record<string, string> = {
  't-shirt': 'tshirt',
  mug: 'mug',
  'business-card': 'business_card',
  'desk-calendar': 'desk_calendar',
  pen: 'pen',
};

function isApiErrorLike(error: unknown): error is ApiErrorLike {
  return typeof error === 'object' && error !== null && 'response' in error;
}

export function getCommerceErrorMessage(
  error: unknown,
  fallback: string,
  fields: string[] = []
): string {
  if (!isApiErrorLike(error)) {
    return fallback;
  }

  const data = error.response?.data;

  if (!data) {
    return fallback;
  }

  for (const field of fields) {
    const value = data[field];

    if (typeof value === 'string' && value.trim()) {
      return value;
    }

    if (
      Array.isArray(value) &&
      typeof value[0] === 'string' &&
      value[0].trim()
    ) {
      return value[0];
    }
  }

  if (Array.isArray(data.non_field_errors) && data.non_field_errors[0]) {
    return data.non_field_errors[0];
  }

  if (typeof data.error === 'string' && data.error.trim()) {
    return data.error;
  }

  if (typeof data.detail === 'string' && data.detail.trim()) {
    return data.detail;
  }

  return fallback;
}

const CATEGORY_TO_ROUTE_SLUG: Record<string, string> = {
  tshirt: 't-shirt',
  mug: 'mug',
  business_card: 'business-card',
  desk_calendar: 'desk-calendar',
  pen: 'pen',
};

export function formatMoney(value: string | number): string {
  const numeric =
    typeof value === 'number'
      ? value
      : Number.parseFloat(String(value).replace(/,/g, ''));

  if (!Number.isFinite(numeric)) {
    return String(value);
  }

  return `${new Intl.NumberFormat('uz-UZ', {
    maximumFractionDigits: 0,
  }).format(numeric)} UZS`;
}

export function getRouteSlugForCategory(category: string): string | null {
  return CATEGORY_TO_ROUTE_SLUG[category] ?? null;
}

export function getProductCategoryForSlug(slug: string): string | null {
  return PRODUCT_SLUG_TO_CATEGORY[slug] ?? null;
}

export function getOrderStatusMeta(status: string): {
  label: string;
  className: string;
} {
  const map: Record<string, { label: string; className: string }> = {
    NEW: {
      label: 'Yangi',
      className: 'bg-slate-100 text-slate-700 border-slate-200',
    },
    PAYMENT_PENDING: {
      label: "To'lov kutilmoqda",
      className: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    PAID: {
      label: "To'langan",
      className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    READY_FOR_PRODUCTION: {
      label: 'Ishlab chiqarishga tayyor',
      className: 'bg-sky-100 text-sky-800 border-sky-200',
    },
    IN_PRODUCTION: {
      label: 'Ishlab chiqarilmoqda',
      className: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    },
    DONE: {
      label: 'Tayyor',
      className: 'bg-violet-100 text-violet-800 border-violet-200',
    },
    CANCELLED: {
      label: 'Bekor qilingan',
      className: 'bg-rose-100 text-rose-800 border-rose-200',
    },
  };

  return (
    map[status] ?? {
      label: status,
      className: 'bg-slate-100 text-slate-700 border-slate-200',
    }
  );
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return document.cookie.split('; ').some(cookie => cookie === 'zazzle_session=1');
}

async function ensureSessionCookie(): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  if (!isAuthenticated()) {
    await apiClient.post('/auth/token/refresh/', {});
  }
}

export async function loginCustomer(
  payload: AuthPayload
): Promise<CommerceUser> {
  const response = await apiClient.post<{ user: CommerceUser }>(
    '/auth/login/',
    payload
  );
  return response.data.user;
}

export async function registerCustomer(
  payload: RegisterPayload
): Promise<CommerceUser> {
  const firstName = payload.first_name.trim();
  const lastName = payload.last_name.trim();
  const displayName =
    payload.display_name?.trim() ||
    [firstName, lastName].filter(Boolean).join(' ');
  const usernameBase = (
    payload.username?.trim() ||
    payload.email.split('@')[0] ||
    `${firstName}.${lastName}`
  )
    .toLowerCase()
    .replace(/[^a-z0-9@.+_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
  const usernameSuffix = Math.random().toString(36).slice(2, 8);
  const username = `${usernameBase || 'user'}-${usernameSuffix}`;

  const response = await apiClient.post<{ user: CommerceUser }>(
    '/auth/register/',
    {
      ...payload,
      username,
      display_name: displayName,
      password_confirm: payload.password,
    }
  );

  return response.data.user;
}

export async function loadCurrentUser(): Promise<CommerceUser | null> {
  if (!isAuthenticated()) {
    return null;
  }

  try {
    await ensureSessionCookie();
    const response = await apiClient.get<CommerceUser>('/users/profile/me/');
    return response.data;
  } catch {
    return null;
  }
}

export async function logoutCustomer() {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    await apiClient.post('/auth/logout/', {});
  } finally {
    window.localStorage.removeItem('access_token');
    window.localStorage.removeItem('refresh_token');
  }
}

interface ProductLookupEntry {
  id: number;
  name?: string;
  slug?: string;
  category?: string;
  description?: string;
  available_sizes?: string[];
  available_colors?: Array<{ name: string; hex?: string }>;
  has_size_variants?: boolean;
  has_color_variants?: boolean;
}

export async function fetchCommerceProductBySlug(
  slug: string
): Promise<CommerceProductType | null> {
  const toResults = <T>(payload: ListResponse<T>): T[] => {
    if (Array.isArray(payload)) {
      return payload;
    }

    return payload.results ?? [];
  };

  const category = getProductCategoryForSlug(slug);
  const cacheBust = Date.now();

  let product: ProductLookupEntry | null = null;

  if (category) {
    try {
      const categoryResponse = await apiClient.get<
        ListResponse<ProductLookupEntry>
      >('/products/', {
        params: {
          category,
          page_size: 20,
          _ts: cacheBust,
        },
      });

      product = toResults(categoryResponse.data)[0] ?? null;
    } catch {
      product = null;
    }
  }

  if (!product) {
    const listResponse = await apiClient.get<ListResponse<ProductLookupEntry>>(
      '/products/',
      {
        params: {
          page_size: 100,
          _ts: cacheBust,
        },
      }
    );

    const products = toResults(listResponse.data);

    product =
      products.find(
        candidate => candidate.slug?.toLowerCase() === slug.toLowerCase()
      ) ??
      (category
        ? (products.find(candidate => candidate.category === category) ?? null)
        : null);
  }

  if (!product) {
    return null;
  }

  try {
    const detailResponse = await apiClient.get<CommerceProductType>(
      `/products/${product.id}/`
    );
    return detailResponse.data;
  } catch {
    const variantResponse = await apiClient.get<ListResponse<CommerceVariant>>(
      `/products/${product.id}/variants/`,
      {
        params: {
          _ts: cacheBust,
        },
      }
    );

    const variants = toResults(variantResponse.data);

    return {
      id: product.id,
      name: product.name || slug,
      slug: product.slug || slug,
      category: product.category || category || '',
      description: product.description || '',
      available_sizes: product.available_sizes || [],
      available_colors: product.available_colors || [],
      has_size_variants: product.has_size_variants || false,
      has_color_variants: product.has_color_variants || false,
      variants,
    };
  }
}

function flattenTextLayers(surfaces: SurfaceState[]) {
  return surfaces.flatMap(surface =>
    surface.layers
      .filter(layer => layer.type === 'text')
      .map(layer => {
        const textLayer = layer as TextLayer;
        return {
          id: textLayer.id,
          surface_id: surface.id,
          text: textLayer.text,
          x: textLayer.x,
          y: textLayer.y,
          width: textLayer.width,
          height: textLayer.height,
          font_size: textLayer.fontSize,
          color: textLayer.fill,
          font_family: textLayer.fontFamily,
          rotation: textLayer.rotation,
          opacity: textLayer.opacity,
          align: textLayer.align,
          font_style: textLayer.fontStyle,
        };
      })
  );
}

export async function createDraftForCart(input: {
  productTypeId: number;
  variantId: number;
  productName: string;
  productSlug: string;
  productColor?: ProductColorSelection | null;
  activeSurfaceId: string;
  surfaces: SurfaceState[];
  previewDataUrl?: string | null;
}): Promise<CommerceDraft> {
  const response = await apiClient.post<CommerceDraft>('/designs/drafts/', {
    product_type: input.productTypeId,
    product_variant: input.variantId,
    name: `${input.productName} dizayni`,
    text_layers: flattenTextLayers(input.surfaces),
    editor_state: {
      product_slug: input.productSlug,
      product_color: input.productColor ?? null,
      active_surface_id: input.activeSurfaceId,
      surfaces: input.surfaces,
      preview_data_url: input.previewDataUrl || '',
      saved_from: 'vite_spa_checkout_flow',
    },
  });

  return response.data;
}

export async function createLegacyDraftForCart(input: {
  productTypeId: number;
  variantId: number;
  productName: string;
  productSlug: string;
  textLayers?: Array<Record<string, unknown>>;
  editorState: Record<string, unknown>;
}): Promise<CommerceDraft> {
  const response = await apiClient.post<CommerceDraft>('/designs/drafts/', {
    product_type: input.productTypeId,
    product_variant: input.variantId,
    name: `${input.productName} dizayni`,
    text_layers: input.textLayers ?? [],
    editor_state: {
      ...input.editorState,
      product_slug: input.productSlug,
      saved_from: 'legacy_mug_customizer',
    },
  });

  return response.data;
}

export async function getCart(): Promise<CommerceCart> {
  const response = await apiClient.get<CommerceCart>('/cart/');
  return response.data;
}

export async function addCartItem(
  draftUuid: string,
  quantity: number
): Promise<CommerceCartItem> {
  const response = await apiClient.post<CommerceCartItem>('/cart/items/', {
    draft_uuid: draftUuid,
    quantity,
  });
  return response.data;
}

export async function updateCartItem(
  itemUuid: string,
  quantity: number
): Promise<void> {
  await apiClient.patch(`/cart/items/${itemUuid}/`, { quantity });
}

export async function removeCartItem(itemUuid: string): Promise<void> {
  await apiClient.delete(`/cart/items/${itemUuid}/`);
}

export async function clearCart(): Promise<void> {
  await apiClient.delete('/cart/clear/');
}

export async function checkoutCart(
  payload: CheckoutInput
): Promise<CheckoutResult> {
  const response = await apiClient.post<CheckoutResult>('/checkout/', payload);
  return response.data;
}

export async function initPayment(
  orderId: number,
  provider: 'payme' | 'click' | 'uzcard_humo',
  idempotencyKey: string
): Promise<PaymentInitResult> {
  const response = await apiClient.post<PaymentInitResult>('/payments/init/', {
    order_id: orderId,
    provider,
    idempotency_key: idempotencyKey,
  });
  return response.data;
}

export async function getOrders(): Promise<CommerceOrderSummary[]> {
  const response =
    await apiClient.get<PaginatedResponse<CommerceOrderSummary>>('/orders/');
  return response.data.results;
}

export async function getOrder(
  orderLookup: string
): Promise<CommerceOrderDetail> {
  const response = await apiClient.get<CommerceOrderDetail>(
    `/orders/${orderLookup}/`
  );
  return response.data;
}

export async function cancelOrder(orderId: number): Promise<void> {
  await apiClient.post(`/orders/${orderId}/cancel/`);
}

export async function getOrderStats(): Promise<CommerceOrderStats> {
  const response = await apiClient.get<CommerceOrderStats>('/orders/stats/');
  return response.data;
}
