<script setup lang="ts">
const trustBadges = [
  { icon: 'lucide:eye', label: 'Jonli preview' },
  { icon: 'lucide:award', label: 'Yuqori sifat' },
  { icon: 'lucide:truck', label: 'Tez yetkazib berish' },
  { icon: 'lucide:shield-check', label: 'Xavfsiz to\'lov' },
];

const avatarPositions = ['0% center', '50% center', '100% center'];
</script>

<template>
  <section class="mx-auto max-w-7xl px-4 pb-6 pt-10 sm:px-6 lg:px-8 lg:pt-10">
    <div class="grid gap-10 lg:grid-cols-2 lg:items-stretch lg:gap-6">
      <div
        v-motion
        :initial="{ opacity: 0, y: 24 }"
        :enter="{ opacity: 1, y: 0, transition: { duration: 500 } }"
        class="flex flex-col justify-center"
      >
        <h1 class="text-4xl font-extrabold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl">
          Rasmingizni yuklang.<br>
          Dizaynni yarating.<br>
          <span class="text-secondary-600">Buyurtma bering.</span>
        </h1>

        <!-- <p class="mt-5 max-w-md text-base leading-7 text-brand-muted">
          Futbolka, krujka, vizitka va boshqa mahsulotlarda dizayningizni jonli ko'rinishini oldindan ko'ring.
        </p> -->

        <ul class="mt-5 flex flex-wrap gap-x-5 gap-y-2">
          <li
            v-for="badge in trustBadges"
            :key="badge.label"
            class="flex items-center gap-1.5 text-xs font-medium text-brand-muted"
          >
            <Icon
              :name="badge.icon"
              class="h-3.5 w-3.5 text-secondary-600"
            />
            {{ badge.label }}
          </li>
        </ul>

        <div class="mt-6 flex flex-col gap-3 sm:flex-row">
          <NuxtLink
            to="/#products"
            class="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-secondary-600 px-6 text-sm font-bold text-white shadow-lg shadow-secondary-600/25 transition hover:bg-secondary-700"
          >
            Dizayn yaratishni boshlash
            <Icon
              name="lucide:arrow-right"
              class="h-4 w-4"
            />
          </NuxtLink>
          <a
            href="#customers"
            class="inline-flex h-12 items-center justify-center rounded-xl border border-brand-border bg-white px-6 text-sm font-bold text-secondary-700 transition hover:bg-brand-surface-low"
          >
            Namunalarni ko'rish
          </a>
        </div>

        <div
          v-motion
          :initial="{ opacity: 0, y: 10 }"
          :enter="{ opacity: 1, y: 0, transition: { duration: 400, delay: 350 } }"
          class="mt-6 flex flex-wrap items-center gap-4"
        >
          <div class="flex -space-x-3">
            <span
              v-for="pos in avatarPositions"
              :key="pos"
              class="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-cover bg-no-repeat ring-2 ring-white"
              :style="{ backgroundImage: `url('/generated/activity-avatars.png')`, backgroundPosition: pos, backgroundSize: '300% 100%' }"
            />
            <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-50 text-[11px] font-bold text-secondary-700 ring-2 ring-white">
              5K+
            </span>
          </div>
          <div class="text-sm leading-tight">
            <div class="flex items-center gap-1 font-bold text-slate-900">
              <Icon
                name="lucide:star"
                class="h-4 w-4 fill-amber-400 text-amber-400"
              />
              4.9/5
              <span class="font-medium text-brand-muted">— 5,000+ mijoz</span>
            </div>
            <p class="mt-0.5 text-brand-muted">
              O'zbekiston bo'ylab bizga ishonch bildirmoqda
            </p>
          </div>
        </div>
      </div>

      <div
        v-motion
        :initial="{ opacity: 0, scale: 0.94 }"
        :enter="{ opacity: 1, scale: 1, transition: { duration: 600, delay: 150 } }"
        class="relative flex items-center justify-center overflow-hidden rounded-[3rem] bg-gradient-to-br from-secondary-100 via-amber-50 to-brand-surface-low p-8 lg:min-h-0"
      >
        <NuxtImg
          src="/generated/adventure-composite.png"
          alt="Futbolka, krujka va telefon mockup — Adventure Awaits dizayni"
          width="1536"
          height="1024"
          class="mx-auto w-full max-w-lg object-contain drop-shadow-2xl"
          format="webp"
          loading="eager"
        />
      </div>
    </div>
  </section>
</template>
