<script setup lang="ts">
import { getApiErrorMessage } from '~/composables/useApi';

const route = useRoute();
const registerMutation = useRegister();
const form = reactive({ first_name: '', last_name: '', phone_number: '', email: '', password: '' });
const error = ref<string | null>(null);

const redirectTo = computed(() => {
  const value = route.query.redirect;
  return typeof value === 'string' && value.startsWith('/') ? value : '/';
});

async function handleRegister() {
  error.value = null;
  try {
    await registerMutation.mutateAsync({ ...form });
    await navigateTo(redirectTo.value);
  }
  catch (authError) {
    error.value = getApiErrorMessage(authError, 'Ro\'yxatdan o\'tishda xatolik yuz berdi.', ['email', 'password']);
  }
}
</script>

<template>
  <div class="mx-auto flex min-h-[calc(100vh-74px)] max-w-lg flex-col justify-center px-4 py-12 sm:px-6">
    <div class="text-center">
      <span class="mx-auto flex h-11 w-11 items-center justify-center rounded-[10px] bg-brand text-lg font-black text-white">Z</span>
      <h1 class="mt-4 text-2xl font-extrabold tracking-tight text-slate-900">
        Ro'yxatdan o'tish
      </h1>
      <p class="mt-1 text-sm text-brand-muted">
        Buyurtmalaringizni saqlash uchun hisob yarating.
      </p>
    </div>

    <p
      v-if="error"
      class="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
    >
      {{ error }}
    </p>

    <AuthOAuthButtons class="mt-6" />

    <div class="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-brand-muted">
      <span class="h-px flex-1 bg-brand-border/60" />
      yoki email bilan
      <span class="h-px flex-1 bg-brand-border/60" />
    </div>

    <form
      class="grid gap-4 sm:grid-cols-2"
      @submit.prevent="handleRegister"
    >
      <label class="block">
        <span class="mb-1 block text-sm font-medium text-slate-700">Ism</span>
        <input
          v-model="form.first_name"
          required
          class="w-full rounded-2xl border border-brand-border/60 px-4 py-3 text-sm outline-none transition focus:border-secondary-400"
        >
      </label>
      <label class="block">
        <span class="mb-1 block text-sm font-medium text-slate-700">Familiya</span>
        <input
          v-model="form.last_name"
          required
          class="w-full rounded-2xl border border-brand-border/60 px-4 py-3 text-sm outline-none transition focus:border-secondary-400"
        >
      </label>
      <label class="block">
        <span class="mb-1 block text-sm font-medium text-slate-700">Telefon</span>
        <input
          v-model="form.phone_number"
          placeholder="+998 90 123 45 67"
          required
          class="w-full rounded-2xl border border-brand-border/60 px-4 py-3 text-sm outline-none transition focus:border-secondary-400"
        >
      </label>
      <label class="block">
        <span class="mb-1 block text-sm font-medium text-slate-700">Email</span>
        <input
          v-model="form.email"
          type="email"
          required
          class="w-full rounded-2xl border border-brand-border/60 px-4 py-3 text-sm outline-none transition focus:border-secondary-400"
        >
      </label>
      <label class="block sm:col-span-2">
        <span class="mb-1 block text-sm font-medium text-slate-700">Parol</span>
        <input
          v-model="form.password"
          type="password"
          minlength="8"
          required
          class="w-full rounded-2xl border border-brand-border/60 px-4 py-3 text-sm outline-none transition focus:border-secondary-400"
        >
      </label>
      <button
        type="submit"
        :disabled="registerMutation.isPending.value"
        class="w-full rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2"
      >
        {{ registerMutation.isPending.value ? 'Yuborilmoqda...' : 'Hisob yaratish' }}
      </button>
    </form>

    <p class="mt-6 text-center text-sm text-brand-muted">
      Hisobingiz bormi?
      <NuxtLink
        :to="`/login${redirectTo !== '/' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`"
        class="font-semibold text-secondary-700 hover:text-secondary-800"
      >
        Kirish
      </NuxtLink>
    </p>
  </div>
</template>
