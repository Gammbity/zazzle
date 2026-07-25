<script setup lang="ts">
const faqs = [
  { q: 'Buyurtma qancha vaqtda tayyor bo\'ladi?', a: 'O\'rtacha 2-4 ish kuni ichida tayyor bo\'ladi, mahsulot turiga qarab farqlanishi mumkin.' },
  { q: 'Yetkazib berish bormi?', a: 'Ha, O\'zbekiston bo\'ylab yetkazib berish xizmati mavjud.' },
  { q: 'Qanday to\'lov usullari mavjud?', a: 'Payme, Click va Uzcard/Humo kartalari orqali to\'lov qilishingiz mumkin.' },
  { q: 'Dizaynni keyin o\'zgartirsam bo\'ladimi?', a: 'Buyurtma tasdiqlanmaguncha dizaynni istalgancha tahrirlashingiz mumkin.' },
  { q: 'Dizaynni saqlab qo\'yish mumkinmi?', a: 'Ha, dizaynlaringiz hisobingizda avtomatik saqlanadi.' },
];

const openIndex = ref<number | null>(0);

function toggle(index: number) {
  openIndex.value = openIndex.value === index ? null : index;
}
</script>

<template>
  <section class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
    <div class="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div class="rounded-2xl border border-brand-border/50 bg-white p-5 shadow-sm sm:p-6">
        <h2 class="text-xl font-extrabold tracking-tight text-slate-900">
          Ko'p beriladigan savollar
        </h2>

        <div class="mt-4 divide-y divide-brand-border/50">
          <div
            v-for="(faq, index) in faqs"
            :key="faq.q"
            class="py-1"
          >
            <button
              type="button"
              class="flex w-full items-center justify-between gap-4 py-3 text-left text-sm font-semibold text-slate-800"
              :aria-expanded="openIndex === index"
              @click="toggle(index)"
            >
              {{ faq.q }}
              <Icon
                name="lucide:chevron-down"
                class="h-4 w-4 shrink-0 text-brand-muted transition-transform"
                :class="{ 'rotate-180': openIndex === index }"
              />
            </button>
            <div
              v-show="openIndex === index"
              class="pb-3 pr-8 text-sm leading-6 text-brand-muted"
            >
              {{ faq.a }}
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-col items-start relative overflow-hidden rounded-2xl bg-gradient-to-br from-secondary-700 to-brand-dim p-6 text-white sm:p-8">
        <h2 class="max-w-[16rem] text-xl font-extrabold leading-snug sm:text-2xl">
          Bugunoq o'zingizning birinchi dizayningizni yarating!
        </h2>
        <p class="mt-2 max-w-[15rem] text-sm text-white/80">
          Noyob mahsulotlar siz kutmoqda.
        </p>

        <NuxtLink
          to="/#products"
          class="mt-4 sm:mt-auto inline-flex h-11 items-center justify-center rounded-xl bg-white px-5 text-sm font-bold text-secondary-700 transition hover:bg-amber-50"
        >
          Dizayn yaratishni boshlash
        </NuxtLink>

        <div class="pointer-events-none absolute -bottom-6 -right-6 h-40 w-40 opacity-90 sm:h-48 sm:w-48">
          <NuxtImg
            src="/generated/tshirt.png"
            alt=""
            width="1064"
            height="1481"
            class="h-full w-full object-contain"
            format="webp"
          />
        </div>
      </div>
    </div>
  </section>
</template>
