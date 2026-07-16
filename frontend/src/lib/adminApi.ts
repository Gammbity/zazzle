import { apiClient } from '@/lib/api-client';
import type {
  CommerceOrderDetail,
  CommerceOrderSummary,
  CommerceProductType,
  CommerceUser,
  DeliveryMethod,
  ProductionCenter,
  ProductionCenterType,
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
// on the backend) — use this for the READY_FOR_PRODUCTION -> ... -> COMPLETED
// pipeline instead of updateAdminOrder's free-form status field.
export async function updateOrderProductionStatus(
  orderId: number | string,
  status: string
): Promise<void> {
  await apiClient.post(`/orders/${orderId}/status`, { status });
}

export async function assignOrder(
  orderId: number | string,
  managerId: number
): Promise<void> {
  await apiClient.post(`/orders/${orderId}/assign`, {
    manager_id: managerId,
  });
}

export interface AdminOperator {
  id: number;
  email: string;
  full_name: string;
}

// Production managers of the order's own center — the assign-order picker
// should be scoped per-order, not global; see useCenterEmployees.
export async function getCenterEmployees(
  centerId: number | string
): Promise<AdminOperator[]> {
  const response = await apiClient.get<
    PaginatedResponse<AdminOperator> | AdminOperator[]
  >(`/admin/production-centers/${centerId}/employees/`);
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

// ---- Production centers (super-admin only) ----

export type ProductionCenterPayload = Partial<{
  name: string;
  type: ProductionCenterType;
  address: string;
  latitude: number | string | null;
  longitude: number | string | null;
  phone: string;
  email: string;
  is_active: boolean;
  supports_pickup: boolean;
  supports_delivery: boolean;
  sort_order: number;
}>;

export async function getAdminProductionCenters(): Promise<
  PaginatedResponse<ProductionCenter> | ProductionCenter[]
> {
  const response = await apiClient.get<
    PaginatedResponse<ProductionCenter> | ProductionCenter[]
  >('/admin/production-centers/');
  return response.data;
}

export async function createAdminProductionCenter(
  payload: ProductionCenterPayload
): Promise<ProductionCenter> {
  const response = await apiClient.post<ProductionCenter>(
    '/admin/production-centers/',
    payload
  );
  return response.data;
}

export async function updateAdminProductionCenter(
  id: number | string,
  payload: ProductionCenterPayload
): Promise<ProductionCenter> {
  const response = await apiClient.patch<ProductionCenter>(
    `/admin/production-centers/${id}/`,
    payload
  );
  return response.data;
}

export async function deleteAdminProductionCenter(
  id: number | string
): Promise<void> {
  await apiClient.delete(`/admin/production-centers/${id}/`);
}

// ---- Production center employees (super-admin, or that center's production_admin) ----

export interface CreateCenterEmployeePayload {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export async function createCenterEmployee(
  centerId: number | string,
  payload: CreateCenterEmployeePayload
): Promise<CommerceUser> {
  const response = await apiClient.post<CommerceUser>(
    `/admin/production-centers/${centerId}/employees/`,
    payload
  );
  return response.data;
}

export async function updateCenterEmployee(
  centerId: number | string,
  employeeId: number | string,
  payload: { is_active: boolean }
): Promise<CommerceUser> {
  const response = await apiClient.patch<CommerceUser>(
    `/admin/production-centers/${centerId}/employees/${employeeId}/`,
    payload
  );
  return response.data;
}

// ---- Users (super-admin-only role management) ----

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
  production_center: number | null;
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
  production_center?: number | null;
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
