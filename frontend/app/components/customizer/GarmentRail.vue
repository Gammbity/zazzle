<script setup lang="ts">
import type { GarmentTab } from '~/types/garment';

defineProps<{ activeTab: GarmentTab }>();
const emit = defineEmits<{ change: [tab: GarmentTab] }>();

const tabs: Array<{ id: GarmentTab; label: string; icon: string }> = [
  { id: 'image', label: 'Rasm', icon: 'lucide:image' },
  { id: 'text', label: 'Matn', icon: 'lucide:type' },
  { id: 'stickers', label: 'Emoji', icon: 'lucide:smile' },
  { id: 'product', label: 'Mahsulot', icon: 'lucide:package' },
];
</script>

<template>
  <div class="flex w-full shrink-0 items-center gap-1 border-b border-brand-border/50 bg-white p-2">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      type="button"
      class="flex flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium text-brand-muted transition"
      :class="activeTab === tab.id ? 'bg-secondary-50 text-secondary-700' : 'hover:bg-brand-surface-low hover:text-slate-900'"
      @click="emit('change', tab.id)"
    >
      <Icon
        :name="tab.icon"
        class="h-5 w-5"
      />
      {{ tab.label }}
    </button>
  </div>
</template>
