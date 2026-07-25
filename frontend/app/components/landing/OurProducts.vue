<script setup lang="ts">
interface ProductCard {
  slug: string;
  name: string;
  image: string;
  price: number;
  rating: number;
  reviews: number;
}

const products: ProductCard[] = [
  { slug: 't-shirt', name: 'Futbolka', image: '/generated/tshirt-blank.png', price: 85_000, rating: 4.8, reviews: 128 },
  { slug: 'mug', name: 'Krujka', image: '/generated/mug-blank.png', price: 65_000, rating: 4.8, reviews: 96 },
  { slug: 'business-card', name: 'Vizitka', image: '/generated/business-card.png', price: 75_000, rating: 4.9, reviews: 74 },
  { slug: 'desk-calendar', name: 'Stol kalendari', image: '/generated/calendar.png', price: 120_000, rating: 4.9, reviews: 58 },
  { slug: 'hoodie', name: 'Hoodie', image: '/generated/hoodie.png', price: 160_000, rating: 4.8, reviews: 41 },
];
</script>

<template>
  <section
    id="products"
    class="mx-auto max-w-7xl px-4 pb-6 pt-8 sm:px-6 lg:px-8"
  >
    <div class="flex items-end justify-between">
      <h2 class="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
        Bizning mahsulotlarimiz
      </h2>
    </div>

    <div class="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      <NuxtLink
        v-for="product in products"
        :key="product.slug"
        :to="`/products/${product.slug}`"
        class="group flex flex-col overflow-hidden rounded-2xl border border-brand-border/50 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
      >
        <div class="relative aspect-[4/3] bg-brand-surface-low">
          <NuxtImg
            :src="product.image"
            :alt="product.name"
            width="1254"
            height="1254"
            class="h-[calc(100%-2rem)] w-[calc(100%-2rem)] object-contain transition duration-300 group-hover:scale-105"
            format="webp"
          />
        </div>
        <div class="flex flex-1 flex-col gap-1.5 p-3.5">
          <p class="text-sm font-semibold text-slate-900">{{ product.name }}</p>
          <div class="flex items-center gap-1 text-xs text-brand-muted">
            <Icon
              name="lucide:star"
              class="h-3.5 w-3.5 fill-amber-400 text-amber-400"
            />
            {{ product.rating }} <span class="text-brand-muted/70">({{ product.reviews }})</span>
          </div>
          <div class="mt-auto flex items-center justify-between pt-1.5">
            <span class="text-sm font-bold text-slate-900">{{ formatMoney(product.price) }}</span>
            <span class="flex h-8 w-8 items-center justify-center rounded-full bg-secondary-50 text-secondary-700 transition group-hover:bg-secondary-600 group-hover:text-white">
              <Icon
                name="lucide:shopping-cart"
                class="h-4 w-4"
              />
            </span>
          </div>
        </div>
      </NuxtLink>
    </div>
  </section>
</template>
