<script setup lang="ts">
defineProps<{
  canUndo: boolean;
  canRedo: boolean;
  busy: 'preview' | 'export' | null;
  title?: string;
  showPreview?: boolean;
}>();

const emit = defineEmits<{
  undo: [];
  redo: [];
  preview: [];
  export: [];
}>();
</script>

<template>
  <header class="flex min-h-16 w-full items-center justify-between gap-3 border-b border-brand-border/50 bg-white px-4 py-3 shadow-sm sm:px-6">
    <NuxtLink
      to="/#products"
      class="flex items-center gap-1.5 text-sm font-semibold text-brand-muted transition hover:text-slate-900"
    >
      <Icon
        name="lucide:chevron-left"
        class="h-4 w-4"
      />
      Mahsulotlar
    </NuxtLink>

    <p class="absolute left-1/2 -translate-x-1/2 text-sm font-bold text-slate-900 sm:text-base">
      {{ title ?? 'Editor' }}
    </p>

    <div class="flex items-center gap-2">
      <button
        type="button"
        class="flex h-9 w-9 items-center justify-center rounded-full border border-brand-border/50 bg-white text-brand-muted transition hover:bg-brand-surface-low disabled:opacity-30"
        :disabled="!canUndo"
        title="Ortga qaytarish"
        @click="emit('undo')"
      >
        <Icon
          name="lucide:undo-2"
          class="h-4 w-4"
        />
      </button>
      <button
        type="button"
        class="flex h-9 w-9 items-center justify-center rounded-full border border-brand-border/50 bg-white text-brand-muted transition hover:bg-brand-surface-low disabled:opacity-30"
        :disabled="!canRedo"
        title="Qaytadan bajarish"
        @click="emit('redo')"
      >
        <Icon
          name="lucide:redo-2"
          class="h-4 w-4"
        />
      </button>

      <button
        v-if="showPreview !== false"
        type="button"
        class="flex h-9 items-center gap-1.5 rounded-full border border-brand-border/50 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-brand-surface-low disabled:opacity-60"
        :disabled="busy === 'preview'"
        @click="emit('preview')"
      >
        <Icon
          name="lucide:eye"
          class="h-4 w-4"
        /> Preview
      </button>
      <button
        type="button"
        class="flex h-9 items-center gap-1.5 rounded-full bg-secondary-600 px-4 text-sm font-semibold text-white transition hover:bg-secondary-700 disabled:opacity-60"
        :disabled="busy === 'export'"
        @click="emit('export')"
      >
        <Icon
          name="lucide:download"
          class="h-4 w-4"
        /> Eksport
      </button>
    </div>
  </header>
</template>
