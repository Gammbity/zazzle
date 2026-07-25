<script setup lang="ts">
const { data: cart } = useCart();
const { data: currentUser } = useCurrentUser();
const logoutMutation = useLogout();
const mobileOpen = ref(false);

const cartCount = computed(() => cart.value?.total_items ?? 0);
const showCartBadge = computed(() => Boolean(currentUser.value) && cartCount.value > 0);

const navLinks = [
  { to: '/#how-it-works', label: 'Qanday ishlaydi' },
  { to: '/#customers', label: 'Mijozlar' },
  { to: '/#faq', label: 'FAQ' },
];
</script>

<template>
  <header class="sticky top-0 z-50 border-b border-brand-border/40 bg-white">
    <div class="mx-auto flex h-[74px] max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
      <NuxtLink
        to="/"
        class="flex shrink-0 items-center gap-2.5"
      >
        <span class="flex h-10 w-10 items-center justify-center rounded-[10px] bg-brand text-[21px] font-black text-white shadow-[0_8px_17px_-11px_#743400]">Z</span>
        <span class="text-xl font-extrabold tracking-tight text-slate-900">Zazzle</span>
      </NuxtLink>

      <nav
        class="hidden flex-1 items-center justify-center gap-8 text-sm font-semibold text-slate-700 lg:flex"
        aria-label="Asosiy navigatsiya"
      >
        <a
          v-for="link in navLinks"
          :key="link.to"
          :href="link.to"
          class="transition hover:text-secondary-700"
        >
          {{ link.label }}
        </a>
      </nav>

      <div class="ml-auto flex items-center gap-3">
        <NuxtLink
          to="/cart"
          class="relative flex h-10 w-10 items-center justify-center rounded-[11px] bg-white text-secondary-700 shadow-[0_5px_17px_rgba(75,42,19,.08)] ring-1 ring-brand-border/40"
          :aria-label="`Savatcha${cartCount ? ` (${cartCount} ta mahsulot)` : ''}`"
        >
          <Icon
            name="lucide:shopping-cart"
            class="h-[18px] w-[18px]"
          />
          <span
            v-if="showCartBadge"
            class="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-secondary-600 text-[10px] font-bold text-white"
          >
            {{ cartCount > 9 ? '9+' : cartCount }}
          </span>
        </NuxtLink>

        <NuxtLink
          to="/#products"
          class="hidden h-10 items-center justify-center rounded-[11px] bg-secondary-600 px-5 text-[13px] font-bold text-white shadow-[0_10px_23px_-13px_#7f3900] transition hover:bg-secondary-700 sm:inline-flex"
        >
          Dizayn yaratish
        </NuxtLink>

        <NuxtLink
          v-if="currentUser"
          to="/orders"
          class="hidden items-center gap-1.5 rounded-[11px] px-3 text-[13px] font-semibold text-slate-700 transition hover:text-secondary-700 sm:flex"
        >
          <Icon
            name="lucide:user"
            class="h-4 w-4"
          />
          {{ currentUser.first_name || currentUser.full_name }}
        </NuxtLink>
        <button
          v-if="currentUser"
          type="button"
          class="hidden h-10 items-center justify-center rounded-[11px] px-3 text-[13px] font-semibold text-brand-muted transition hover:text-secondary-700 sm:flex"
          @click="logoutMutation.mutate()"
        >
          Chiqish
        </button>
        <NuxtLink
          v-else
          to="/login"
          class="hidden h-10 items-center justify-center rounded-[11px] px-3 text-[13px] font-semibold text-slate-700 transition hover:text-secondary-700 sm:flex"
        >
          Kirish
        </NuxtLink>

        <button
          type="button"
          class="flex h-10 w-10 items-center justify-center rounded-[11px] text-secondary-700 ring-1 ring-brand-border/40 lg:hidden"
          :aria-label="mobileOpen ? 'Menyuni yopish' : 'Menyuni ochish'"
          :aria-expanded="mobileOpen"
          @click="mobileOpen = !mobileOpen"
        >
          <Icon
            :name="mobileOpen ? 'lucide:x' : 'lucide:menu'"
            class="h-5 w-5"
          />
        </button>
      </div>
    </div>

    <nav
      v-show="mobileOpen"
      class="border-t border-brand-border/40 bg-white px-4 py-2 lg:hidden"
      aria-label="Mobil navigatsiya"
    >
      <a
        v-for="link in navLinks"
        :key="link.to"
        :href="link.to"
        class="block rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-secondary-50/60"
        @click="mobileOpen = false"
      >
        {{ link.label }}
      </a>
    </nav>
  </header>
</template>
