<script setup lang="ts">
const testimonials = [
  { name: 'Aziza', city: 'Toshkent', text: 'Dizayn qilish juda oson va natija ajoyib bo\'ldi', rating: 5.0, pos: '50% center' },
  { name: 'Bekzod', city: 'Samarqand', text: 'Krujka sifati zo\'r, rasm tiniq chiqdi', rating: 5.0, pos: '0% center' },
  { name: 'Dilshod', city: 'Buxoro', text: 'Yetkazib berish tez va mahsulot sifati a\'lo!', rating: 4.9, pos: '0% center' },
  { name: 'Madina', city: 'Farg\'ona', text: 'Sovg\'a uchun ajoyib tanlov bo\'ldi', rating: 5.0, pos: '50% center' },
];
</script>

<template>
  <section class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
    <h2 class="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
      Mijozlarimiz fikri
    </h2>

    <div class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div
        v-for="testimonial in testimonials"
        :key="testimonial.name"
        class="flex flex-col rounded-2xl border border-brand-border/50 bg-white p-5 shadow-sm"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-2.5">
            <span
              class="h-9 w-9 shrink-0 rounded-full bg-cover bg-no-repeat"
              :style="{ backgroundImage: `url('/generated/activity-avatars.png')`, backgroundPosition: testimonial.pos, backgroundSize: '300% 100%' }"
            />
            <div>
              <p class="text-sm font-semibold text-slate-900">
                {{ testimonial.name }}
              </p>
              <p class="text-xs text-brand-muted">
                {{ testimonial.city }}
              </p>
            </div>
          </div>
          <Icon
            name="lucide:quote"
            class="h-5 w-5 text-brand-border"
          />
        </div>
        <p class="mt-3 text-sm leading-6 text-slate-700">
          {{ testimonial.text }}
        </p>
        <div class="mt-auto flex items-center gap-1 text-xs font-semibold text-slate-700">
          <Icon
            name="lucide:star"
            class="h-3.5 w-3.5 fill-amber-400 text-amber-400"
          />
          {{ testimonial.rating }}
        </div>
      </div>
    </div>
  </section>
</template>
