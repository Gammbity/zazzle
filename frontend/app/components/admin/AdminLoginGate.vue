<script setup lang="ts">
import { getApiErrorMessage } from '~/composables/useApi';

const loginMutation = useLogin();
const form = reactive({ email: '', password: '' });
const error = ref<string | null>(null);

async function handleSubmit() {
  error.value = null;
  try {
    await loginMutation.mutateAsync({ ...form });
  }
  catch (loginError) {
    error.value = getApiErrorMessage(loginError, 'Kirishda xatolik yuz berdi.');
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-brand-surface-low p-4">
    <div class="w-full max-w-sm rounded-3xl border border-brand-border/50 bg-white p-8 shadow-sm">
      <div class="text-center">
        <span class="mx-auto flex h-11 w-11 items-center justify-center rounded-[10px] bg-brand text-lg font-black text-white">Z</span>
        <h1 class="mt-4 text-lg font-extrabold text-slate-900">
          Admin panel
        </h1>
        <p class="mt-1 text-sm text-brand-muted">
          Davom etish uchun hisobga kiring.
        </p>
      </div>

      <p
        v-if="error"
        class="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
      >
        {{ error }}
      </p>

      <form
        class="mt-6 space-y-4"
        @submit.prevent="handleSubmit"
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
    </div>
  </div>
</template>
