<script setup lang="ts">
const year = new Date().getFullYear();

const productLinks = [
  { label: 'Futbolka', to: '/products/t-shirt' },
  { label: 'Krujka', to: '/products/mug' },
  { label: 'Vizitka', to: '/products/business-card' },
  { label: 'Stol kalendari', to: '/products/desk-calendar' },
  { label: 'Ruchka', to: '/products/pen' },
  { label: 'Boshqalar', to: '/products' },
];

const companyLinks = [
  { label: 'Biz haqimizda', to: '#' },
  { label: 'Blog', to: '#' },
  { label: 'Karyera', to: '#' },
  { label: 'Hamkorlik', to: '#' },
];

const supportLinks = [
  { label: 'FAQ', to: '#faq' },
  { label: 'Yetkazib berish', to: '#' },
  { label: 'To\'lov usullari', to: '#' },
  { label: 'Qaytarish va almashtirish', to: '#' },
];

const socials = [
  { icon: 'lucide:instagram', href: '#', label: 'Instagram' },
  { icon: 'lucide:send', href: '#', label: 'Telegram' },
  { icon: 'lucide:facebook', href: '#', label: 'Facebook' },
  { icon: 'lucide:youtube', href: '#', label: 'YouTube' },
];
</script>

<template>
  <footer class="border-t border-brand-border/40 bg-brand-surface-low">
    <div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div class="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
        <div class="lg:col-span-1">
          <NuxtLink
            to="/"
            class="flex items-center gap-2"
          >
            <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-sm font-black text-white">Z</span>
            <span class="text-lg font-extrabold text-brand">Zazzle</span>
          </NuxtLink>
          <p class="mt-3 text-sm text-brand-muted">
            &copy; {{ year }} Zazzle Uzbekistan.<br>Barcha huquqlar himoyalangan.
          </p>
          <div class="mt-4 flex items-center gap-3">
            <a
              v-for="social in socials"
              :key="social.label"
              :href="social.href"
              :aria-label="social.label"
              class="flex h-8 w-8 items-center justify-center rounded-full border border-brand-border/60 text-brand-muted transition hover:bg-white hover:text-secondary-700"
            >
              <Icon
                :name="social.icon"
                class="h-4 w-4"
              />
            </a>
          </div>
        </div>

        <div>
          <p class="text-sm font-semibold text-slate-900">
            Mahsulotlar
          </p>
          <ul class="mt-3 space-y-2 text-sm text-brand-muted">
            <li
              v-for="link in productLinks"
              :key="link.label"
            >
              <NuxtLink
                :to="link.to"
                class="hover:text-secondary-700"
              >{{ link.label }}</NuxtLink>
            </li>
          </ul>
        </div>

        <div>
          <p class="text-sm font-semibold text-slate-900">
            Kompaniya
          </p>
          <ul class="mt-3 space-y-2 text-sm text-brand-muted">
            <li
              v-for="link in companyLinks"
              :key="link.label"
            >
              <a
                :href="link.to"
                class="hover:text-secondary-700"
              >{{ link.label }}</a>
            </li>
          </ul>
        </div>

        <div>
          <p class="text-sm font-semibold text-slate-900">
            Yordam
          </p>
          <ul class="mt-3 space-y-2 text-sm text-brand-muted">
            <li
              v-for="link in supportLinks"
              :key="link.label"
            >
              <a
                :href="link.to"
                class="hover:text-secondary-700"
              >{{ link.label }}</a>
            </li>
          </ul>
        </div>

        <div>
          <p class="text-sm font-semibold text-slate-900">
            Aloqa
          </p>
          <ul class="mt-3 space-y-2.5 text-sm text-brand-muted">
            <li class="flex items-center gap-2">
              <Icon
                name="lucide:phone"
                class="h-4 w-4 shrink-0 text-secondary-600"
              />
              +998 90 123 45 67
            </li>
            <li class="flex items-center gap-2">
              <Icon
                name="lucide:mail"
                class="h-4 w-4 shrink-0 text-secondary-600"
              />
              info@zazzle.uz
            </li>
            <li class="flex items-center gap-2">
              <Icon
                name="lucide:map-pin"
                class="h-4 w-4 shrink-0 text-secondary-600"
              />
              Toshkent, O'zbekiston
            </li>
          </ul>
        </div>
      </div>
    </div>
  </footer>
</template>
