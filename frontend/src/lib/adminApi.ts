import { apiClient } from '@/lib/api-client';
import type {
  CommerceOrderDetail,
  CommerceOrderSummary,
  CommerceProductType,
  CommerceUser,
  DeliveryMethod,
  PickupLocation,
  UserRole,
} from '@/lib/commerce';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ---- Orders ----

export interface AdminOrderFilters {
  status?: string;
  delivery_method?: DeliveryMethod;
  search?: string;
  ordering?: string;
  page?: number;
}

export async function getAdminOrders(
  filters: AdminOrderFilters = {}
): Promise<PaginatedResponse<CommerceOrderSummary>> {
  const response = await apiClient.get<PaginatedResponse<CommerceOrderSummary>>(
    '/orders/admin/orders/',
    { params: filters }
  );
  return response.data;
}

export async function getAdminOrder(
  id: number | string
): Promise<CommerceOrderDetail> {
  const response = await apiClient.get<CommerceOrderDetail>(
    `/orders/admin/orders/${id}/`
  );
  return response.data;
}

export interface UpdateAdminOrderPayload {
  status?: string;
  admin_notes?: string;
  tracking_number?: string;
  carrier?: string;
}

export async function updateAdminOrder(
  id: number | string,
  payload: UpdateAdminOrderPayload
): Promise<CommerceOrderDetail> {
  const response = await apiClient.patch<CommerceOrderDetail>(
    `/orders/admin/orders/${id}/`,
    payload
  );
  return response.data;
}

// Enforces the production state-machine transitions (validate_status_transition
// on the backend) — use this for the READY_FOR_PRODUCTION/IN_PRODUCTION/DONE
// pipeline instead of updateAdminOrder's free-form status field.
export async function updateOrderProductionStatus(
  orderId: number | string,
  status: string
): Promise<void> {
  await apiClient.post(`/orders/${orderId}/status`, { status });
}

export async function assignOrder(
  orderId: number | string,
  operatorId: number
): Promise<void> {
  await apiClient.post(`/orders/${orderId}/assign`, {
    operator_id: operatorId,
  });
}

export interface AdminOperator {
  id: number;
  email: string;
  full_name: string;
}

// Requires the requesting user to have role=admin (or be a superuser) — a
// separate, narrower gate than the is_staff check used elsewhere in the admin
// panel. Callers should tolerate this failing for a staff-but-not-role-admin
// user rather than treating it as fatal.
export async function getOperators(): Promise<AdminOperator[]> {
  const response = await apiClient.get<
    PaginatedResponse<AdminOperator> | AdminOperator[]
  >('/users/admin/list/', { params: { role: 'print_operator' } });
  const data = response.data;
  return Array.isArray(data) ? data : data.results;
}

// ---- Products ----

export interface AdminProductFilters {
  category?: string;
  is_active?: boolean;
  search?: string;
}

export async function getAdminProducts(
  filters: AdminProductFilters = {}
): Promise<PaginatedResponse<CommerceProductType> | CommerceProductType[]> {
  const response = await apiClient.get<
    PaginatedResponse<CommerceProductType> | CommerceProductType[]
  >('/products/admin/list/', { params: filters });
  return response.data;
}

export async function getAdminProduct(
  id: number | string
): Promise<CommerceProductType> {
  const response = await apiClient.get<CommerceProductType>(
    `/products/admin/${id}/`
  );
  return response.data;
}

export type UpdateAdminProductPayload = Partial<{
  name: string;
  description: string;
  is_active: boolean;
  sort_order: number;
  has_size_variants: boolean;
  has_color_variants: boolean;
  available_sizes: string[];
  available_colors: Array<{ name: string; hex?: string }>;
}>;

export async function updateAdminProduct(
  id: number | string,
  payload: UpdateAdminProductPayload
): Promise<CommerceProductType> {
  const response = await apiClient.patch<CommerceProductType>(
    `/products/admin/${id}/`,
    payload
  );
  return response.data;
}

export async function deleteAdminProduct(id: number | string): Promise<void> {
  await apiClient.delete(`/products/admin/${id}/`);
}

export interface AdminVariantPayload {
  size?: string;
  color?: string;
  color_hex?: string;
  sale_price?: string | number;
  production_cost?: string | number;
  is_active?: boolean;
  is_default?: boolean;
  stock_quantity?: number;
}

export async function createAdminVariant(
  productId: number | string,
  payload: AdminVariantPayload
) {
  const response = await apiClient.post(
    `/products/admin/${productId}/variants/create/`,
    payload
  );
  return response.data;
}

export async function updateAdminVariant(
  productId: number | string,
  variantId: number | string,
  payload: AdminVariantPayload
) {
  const response = await apiClient.patch(
    `/products/admin/${productId}/variants/${variantId}/`,
    payload
  );
  return response.data;
}

export async function deleteAdminVariant(
  productId: number | string,
  variantId: number | string
): Promise<void> {
  await apiClient.delete(`/products/admin/${productId}/variants/${variantId}/`);
}

// ---- Pickup locations ----

export type PickupLocationPayload = Partial<{
  name: string;
  address: string;
  city: string;
  latitude: number | string | null;
  longitude: number | string | null;
  working_hours: string;
  is_active: boolean;
  sort_order: number;
}>;

export async function getAdminPickupLocations(): Promise<
  PaginatedResponse<PickupLocation> | PickupLocation[]
> {
  const response = await apiClient.get<
    PaginatedResponse<PickupLocation> | PickupLocation[]
  >('/orders/admin/pickup-locations/');
  return response.data;
}

export async function createAdminPickupLocation(
  payload: PickupLocationPayload
): Promise<PickupLocation> {
  const response = await apiClient.post<PickupLocation>(
    '/orders/admin/pickup-locations/',
    payload
  );
  return response.data;
}

export async function updateAdminPickupLocation(
  id: number | string,
  payload: PickupLocationPayload
): Promise<PickupLocation> {
  const response = await apiClient.patch<PickupLocation>(
    `/orders/admin/pickup-locations/${id}/`,
    payload
  );
  return response.data;
}

export async function deleteAdminPickupLocation(
  id: number | string
): Promise<void> {
  await apiClient.delete(`/orders/admin/pickup-locations/${id}/`);
}

// ---- Users (admin-only role/permission management) ----

export interface AdminUserFilters {
  role?: UserRole;
  search?: string;
  page?: number;
}

export async function getAdminUsers(
  filters: AdminUserFilters = {}
): Promise<PaginatedResponse<CommerceUser> | CommerceUser[]> {
  const response = await apiClient.get<
    PaginatedResponse<CommerceUser> | CommerceUser[]
  >('/users/admin/list/', { params: filters });
  return response.data;
}

export type UpdateUserRolePayload = Partial<{
  role: UserRole;
  can_manage_orders: boolean;
  can_manage_products: boolean;
  can_manage_pickup_locations: boolean;
}>;

export async function updateUserRole(
  id: number | string,
  payload: UpdateUserRolePayload
): Promise<CommerceUser> {
  const response = await apiClient.patch<CommerceUser>(
    `/users/admin/${id}/role/`,
    payload
  );
  return response.data;
}

export interface CreateAdminUserPayload {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  role: UserRole;
  can_manage_orders?: boolean;
  can_manage_products?: boolean;
  can_manage_pickup_locations?: boolean;
}

export async function createAdminUser(
  payload: CreateAdminUserPayload
): Promise<CommerceUser> {
  const response = await apiClient.post<CommerceUser>(
    '/users/admin/create/',
    payload
  );
  return response.data;
}
