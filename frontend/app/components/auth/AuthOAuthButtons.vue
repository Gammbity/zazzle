<script setup lang="ts">
const PROVIDERS = [
  { id: 'google', label: 'Google', icon: 'lucide:chrome' },
  { id: 'facebook', label: 'Facebook', icon: 'lucide:facebook' },
] as const;

const { startOAuth, error } = useOAuth();

function handleTelegramError(message: string) {
  error.value = message;
}
</script>

<template>
  <div class="grid gap-2.5">
    <button
      v-for="provider in PROVIDERS"
      :key="provider.id"
      type="button"
      class="flex h-11 items-center justify-center gap-2.5 rounded-2xl border border-brand-border/60 bg-white text-sm font-semibold text-slate-700 transition hover:bg-brand-surface-low"
      @click="startOAuth(provider.id)"
    >
      <Icon
        :name="provider.icon"
        class="h-4 w-4"
      />
      {{ provider.label }} orqali davom etish
    </button>

    <AuthTelegramButton @error="handleTelegramError" />

    <p
      v-if="error"
      class="text-center text-xs font-medium text-rose-600"
    >
      {{ error }}
    </p>
  </div>
</template>
