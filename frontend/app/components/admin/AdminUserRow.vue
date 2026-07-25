<script setup lang="ts">
import { getApiErrorMessage } from '~/composables/useApi';
import type { CurrentUser, UserRole } from '~/types/commerce';

const props = defineProps<{ user: CurrentUser }>();

const ROLE_OPTIONS: Array<{ value: UserRole; label: string }> = [
  { value: 'customer', label: 'Mijoz' },
  { value: 'support', label: 'Qo\'llab-quvvatlash' },
  { value: 'production_manager', label: 'Ishlab chiqarish menejeri' },
  { value: 'production_admin', label: 'Ishlab chiqarish admini' },
  { value: 'super_admin', label: 'Super Admin' },
];

const ROLES_REQUIRING_CENTER: UserRole[] = ['production_admin', 'production_manager'];

const updateRole = useUpdateUserRole();
const error = ref<string | null>(null);

// Selected role tracked locally so the center picker can appear *before*
// submitting — the backend requires production_center in the same request
// when switching to a center-scoped role, so we can't fire the mutation
// until both are chosen.
const selectedRole = ref<UserRole>(props.user.role ?? 'customer');
watch(() => props.user.role, (role) => {
  selectedRole.value = role ?? 'customer';
});

const needsCenter = computed(() => ROLES_REQUIRING_CENTER.includes(selectedRole.value));

function handleRoleChange(event: Event) {
  const role = (event.target as HTMLSelectElement).value as UserRole;
  selectedRole.value = role;
  error.value = null;
  if (ROLES_REQUIRING_CENTER.includes(role)) return;
  updateRole.mutate({ id: props.user.id, payload: { role, production_center: null } }, {
    onError: (err) => { error.value = getApiErrorMessage(err, 'Rolni o\'zgartirib bo\'lmadi.'); },
  });
}

function handleCenterChange(production_center: number | null) {
  error.value = null;
  updateRole.mutate({ id: props.user.id, payload: { role: selectedRole.value, production_center } }, {
    onError: (err) => { error.value = getApiErrorMessage(err, 'Rolni o\'zgartirib bo\'lmadi.'); },
  });
}
</script>

<template>
  <article class="rounded-2xl border border-brand-border/50 bg-white p-5 shadow-sm">
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="text-base font-semibold text-slate-950">
          {{ user.full_name || user.email }}
        </p>
        <p class="text-sm text-brand-muted">
          {{ user.email }}
        </p>
      </div>

      <div class="flex items-center gap-3">
        <label class="flex items-center gap-2">
          <span class="text-xs font-medium text-brand-muted">Rol</span>
          <select
            :value="selectedRole"
            :disabled="updateRole.isPending.value"
            class="rounded-xl border border-brand-border/60 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-secondary-400"
            @change="handleRoleChange"
          >
            <option
              v-for="option in ROLE_OPTIONS"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </label>

        <AdminCenterSelect
          v-if="needsCenter"
          :model-value="user.production_center ?? null"
          @update:model-value="handleCenterChange"
        />
      </div>
    </div>

    <p
      v-if="needsCenter && !user.production_center"
      class="mt-3 text-xs font-medium text-rose-600"
    >
      Markaz tanlanmaguncha bu foydalanuvchi ishlay olmaydi.
    </p>
    <p
      v-if="error"
      class="mt-3 text-xs font-medium text-rose-600"
    >
      {{ error }}
    </p>
  </article>
</template>
