<script setup lang="ts">
import { getApiErrorMessage } from '~/composables/useApi';

const route = useRoute();
const loginMutation = useLogin();
const form = reactive({ email: '', password: '' });
const error = ref<string | null>(null);

const redirectTo = computed(() => {
  const value = route.query.redirect;
  return typeof value === 'string' && value.startsWith('/') ? value : '/';
});

async function handleLogin() {
  error.value = null;
  try {
    await loginMutation.mutateAsync({ ...form });
    await navigateTo(redirectTo.value);
  }
  catch (authError) {
    error.value = getApiErrorMessage(authError, 'Kirishda xatolik yuz berdi.');
  }
}
</script>

<template>
  <div class="mx-auto flex min-h-[calc(100vh-74px)] max-w-md flex-col justify-center px-4 py-12 sm:px-6">
    <div class="text-center">
      <span class="mx-auto flex h-11 w-11 items-center justify-center rounded-[10px] bg-brand text-lg font-black text-white">Z</span>
      <h1 class="mt-4 text-2xl font-extrabold tracking-tight text-slate-900">
        Hisobga kirish
      </h1>
      <p class="mt-1 text-sm text-brand-muted">
        Davom etish uchun email va parolingizni kiriting.
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
      class="space-y-4"
      @submit.prevent="handleLogin"
    >
      <label class="block">
        <span class="mb-1 block text-sm font-medium text-slate-700">Email</span>
        <input
          v-model="form.email"
          type="email"
          required
          class="w-full rounded-2xl border border-brand-border/60 px-4 py-3 text-sm outline-none transition focus:border-secondary-400"
        >
      </label>
      <label class="block">
        <span class="mb-1 block text-sm font-medium text-slate-700">Parol</span>
        <input
          v-model="form.password"
          type="password"
          required
          class="w-full rounded-2xl border border-brand-border/60 px-4 py-3 text-sm outline-none transition focus:border-secondary-400"
        >
      </label>
      <button
        type="submit"
        :disabled="loginMutation.isPending.value"
        class="w-full rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {{ loginMutation.isPending.value ? 'Tekshirilmoqda...' : 'Hisobga kirish' }}
      </button>
    </form>

    <p class="mt-6 text-center text-sm text-brand-muted">
      Hisobingiz yo'qmi?
      <NuxtLink
        :to="`/register${redirectTo !== '/' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`"
        class="font-semibold text-secondary-700 hover:text-secondary-800"
      >
        Ro'yxatdan o'ting
      </NuxtLink>
    </p>
  </div>
</template>
