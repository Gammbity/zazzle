<script setup lang="ts">
import type { UserRole } from '~/types/commerce';

definePageMeta({ layout: 'admin' });

const ROLE_OPTIONS: Array<{ value: UserRole; label: string }> = [
  { value: 'customer', label: 'Mijoz' },
  { value: 'support', label: 'Qo\'llab-quvvatlash' },
  { value: 'production_manager', label: 'Ishlab chiqarish menejeri' },
  { value: 'production_admin', label: 'Ishlab chiqarish admini' },
  { value: 'super_admin', label: 'Super Admin' },
];

const ROLES_REQUIRING_CENTER: UserRole[] = ['production_admin', 'production_manager'];

interface NewUserForm {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  production_center: number | null;
}

const EMPTY_NEW_USER: NewUserForm = {
  username: '',
  email: '',
  password: '',
  first_name: '',
  last_name: '',
  role: 'production_manager',
  production_center: null,
};

const usersQuery = useAdminUsers();
const createUser = useCreateAdminUser();

const showCreate = ref(false);
const form = reactive<NewUserForm>({ ...EMPTY_NEW_USER });

const users = computed(() => {
  const data = usersQuery.data.value;
  if (!data) return [];
  return Array.isArray(data) ? data : data.results;
});

const canSubmit = computed(() => !(ROLES_REQUIRING_CENTER.includes(form.role) && !form.production_center));

watch(() => form.role, (role) => {
  if (!ROLES_REQUIRING_CENTER.includes(role)) form.production_center = null;
});

function handleCreate() {
  createUser.mutate({ ...form }, {
    onSuccess: () => {
      Object.assign(form, EMPTY_NEW_USER);
      showCreate.value = false;
    },
  });
}
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="text-sm font-semibold uppercase tracking-[0.3em] text-secondary-700">
          Admin
        </p>
        <h1 class="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
          Foydalanuvchilar
        </h1>
        <p class="mt-2 max-w-2xl text-sm leading-6 text-brand-muted">
          Rollarni va ishlab chiqarish markaziga tayinlashni boshqaring. Faqat super admin bu sahifaga kira oladi.
        </p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-2xl bg-secondary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-secondary-700"
        @click="showCreate = true"
      >
        <Icon
          name="lucide:plus"
          class="h-4 w-4"
        />
        Yangi foydalanuvchi
      </button>
    </div>

    <form
      v-if="showCreate"
      class="mt-6 rounded-3xl border border-secondary-200 bg-secondary-50/40 p-6"
      @submit.prevent="handleCreate"
    >
      <div class="flex items-center justify-between">
        <h2 class="flex items-center gap-2 text-lg font-bold text-slate-900">
          <Icon
            name="lucide:user-cog"
            class="h-4 w-4"
          />
          Yangi foydalanuvchi
        </h2>
        <button
          type="button"
          class="rounded-full p-1.5 text-brand-muted hover:bg-white"
          @click="showCreate = false"
        >
          <Icon
            name="lucide:x"
            class="h-4 w-4"
          />
        </button>
      </div>

      <div class="mt-4 grid gap-4 sm:grid-cols-2">
        <label class="block">
          <span class="mb-1.5 block text-sm font-medium text-slate-700">Ism</span>
          <input
            v-model="form.first_name"
            required
            class="w-full rounded-2xl border border-brand-border/60 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-secondary-400"
          >
        </label>
        <label class="block">
          <span class="mb-1.5 block text-sm font-medium text-slate-700">Familiya</span>
          <input
            v-model="form.last_name"
            required
            class="w-full rounded-2xl border border-brand-border/60 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-secondary-400"
          >
        </label>
        <label class="block">
          <span class="mb-1.5 block text-sm font-medium text-slate-700">Username</span>
          <input
            v-model="form.username"
            required
            class="w-full rounded-2xl border border-brand-border/60 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-secondary-400"
          >
        </label>
        <label class="block">
          <span class="mb-1.5 block text-sm font-medium text-slate-700">Email</span>
          <input
            v-model="form.email"
            type="email"
            required
            class="w-full rounded-2xl border border-brand-border/60 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-secondary-400"
          >
        </label>
        <label class="block">
          <span class="mb-1.5 block text-sm font-medium text-slate-700">Parol</span>
          <input
            v-model="form.password"
            type="password"
            minlength="8"
            required
            class="w-full rounded-2xl border border-brand-border/60 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-secondary-400"
          >
        </label>
        <label class="block">
          <span class="mb-1.5 block text-sm font-medium text-slate-700">Rol</span>
          <select
            v-model="form.role"
            class="w-full rounded-2xl border border-brand-border/60 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-secondary-400"
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
        <label
          v-if="ROLES_REQUIRING_CENTER.includes(form.role)"
          class="block"
        >
          <span class="mb-1.5 block text-sm font-medium text-slate-700">Ishlab chiqarish markazi <span class="text-secondary-600">*</span></span>
          <AdminCenterSelect v-model="form.production_center" />
        </label>
      </div>

      <div class="mt-5 flex items-center gap-3">
        <button
          type="submit"
          :disabled="createUser.isPending.value || !canSubmit"
          class="rounded-2xl bg-secondary-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-secondary-700 disabled:opacity-50"
        >
          {{ createUser.isPending.value ? 'Yaratilmoqda...' : 'Yaratish' }}
        </button>
        <button
          type="button"
          class="rounded-2xl px-5 py-2.5 text-sm font-semibold text-brand-muted hover:bg-white"
          @click="showCreate = false"
        >
          Bekor qilish
        </button>
      </div>
    </form>

    <div
      v-if="usersQuery.isLoading.value"
      class="mt-8 h-64 animate-pulse rounded-3xl bg-brand-surface-low"
    />
    <div
      v-else-if="users.length === 0"
      class="mt-8 rounded-3xl border border-dashed border-brand-border bg-brand-surface-low/40 p-10 text-center"
    >
      <p class="text-base text-brand-muted">
        Foydalanuvchi topilmadi.
      </p>
    </div>
    <div
      v-else
      class="mt-6 grid gap-3"
    >
      <AdminUserRow
        v-for="user in users"
        :key="user.id"
        :user="user"
      />
    </div>
  </div>
</template>
