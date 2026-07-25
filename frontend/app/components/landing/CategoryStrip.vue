<script setup lang="ts">
const categories = [
  { label: 'Futbolka', slug: 't-shirt', icon: 'lucide:shirt' },
  { label: 'Krujka', slug: 'mug', icon: 'lucide:coffee' },
  { label: 'Vizitka', slug: 'business-card', icon: 'lucide:credit-card' },
  { label: 'Ruchka', slug: 'pen', icon: 'lucide:pen-line' },
  { label: 'Stol kalendari', slug: 'desk-calendar', icon: 'lucide:calendar-days' },
  { label: 'Hoodie', slug: 'hoodie', icon: 'lucide:shirt' },
];
</script>

<template>
  <section
    aria-label="Mahsulot kategoriyalari"
    class="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8"
  >
    <div class="scrollbar-none flex divide-x divide-brand-border/50 overflow-x-auto rounded-[20px] bg-white shadow-[0_13px_30px_-20px_rgba(68,37,17,.35)]">
      <NuxtLink
        v-for="category in categories"
        :key="category.slug"
        :to="`/products/${category.slug}`"
        class="group flex flex-1 flex-col items-center justify-center gap-1.5 p-4 transition hover:bg-secondary-50/40"
      >
        <Icon
          :name="category.icon"
          class="h-6 w-6 text-secondary-600 transition group-hover:scale-110"
        />
        <span class="text-xs font-semibold text-slate-700">{{ category.label }}</span>
      </NuxtLink>
    </div>
  </section>
</template>
