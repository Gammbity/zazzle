<script setup lang="ts">
// NOTE: images below are placeholders — see the generation prompts in
// public/generated/customers/README.md. Drop the generated files in with
// these exact names and the gallery fills in automatically; until then,
// `failedImages` below keeps the missing files from showing as broken-image
// glitches.
const gallery = [
  { name: 'Dilshod', rating: 5.0, image: '/generated/customers/tshirt-mountain.jpg', avatarPos: '0% center' },
  { name: 'Aziza', rating: 4.9, image: '/generated/customers/mug-love.jpg', avatarPos: '50% center' },
  { name: 'Bekzod', rating: 5.0, image: '/generated/customers/tote-leaf.jpg', avatarPos: '100% center' },
  { name: 'Madina', rating: 4.8, image: '/generated/customers/hoodie-leaf.jpg', avatarPos: '0% center' },
  { name: 'Sardor', rating: 4.9, image: '/generated/customers/notebook-believe.jpg', avatarPos: '50% center' },
  { name: 'Jamshud', rating: 5.0, image: '/generated/customers/mug-workhard.jpg', avatarPos: '100% center' },
];

const failedImages = ref(new Set<string>());
function markFailed(src: string) {
  failedImages.value.add(src);
}
</script>

<template>
  <section
    id="customers"
    class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"
  >
    <div class="flex items-end justify-between">
      <h2 class="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
        Mijozlar yaratgan mahsulotlar
      </h2>
      <NuxtLink
        to="/#products"
        class="hidden items-center gap-1 text-sm font-bold text-secondary-700 sm:inline-flex"
      >
        Barchasini ko'rish
        <Icon
          name="lucide:arrow-right"
          class="h-4 w-4"
        />
      </NuxtLink>
    </div>

    <div class="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      <div
        v-for="item in gallery"
        :key="item.name"
        class="group"
      >
        <div class="flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-brand-surface-low">
          <Icon
            v-if="failedImages.has(item.image)"
            name="lucide:image"
            class="h-8 w-8 text-brand-muted/40"
          />
          <NuxtImg
            v-else
            :src="item.image"
            :alt="`${item.name} tomonidan yaratilgan dizayn`"
            width="400"
            height="400"
            class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            format="webp"
            @error="markFailed(item.image)"
          />
        </div>
        <div class="mt-2 flex items-center justify-between px-0.5">
          <span class="flex items-center gap-1.5 text-xs font-medium text-slate-700">
            <span
              class="h-4 w-4 shrink-0 rounded-full bg-cover bg-no-repeat"
              :style="{ backgroundImage: `url('/generated/activity-avatars.png')`, backgroundPosition: item.avatarPos, backgroundSize: '300% 100%' }"
            />
            {{ item.name }}
          </span>
          <span class="flex items-center gap-0.5 text-xs font-semibold text-slate-700">
            <Icon
              name="lucide:star"
              class="h-3 w-3 fill-amber-400 text-amber-400"
            />
            {{ item.rating }}
          </span>
        </div>
      </div>
    </div>
  </section>
</template>
