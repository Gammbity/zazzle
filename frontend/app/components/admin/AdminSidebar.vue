<script setup lang="ts">
const route = useRoute();
const isSuperAdmin = useIsSuperAdmin();
const isProductionStaff = useIsProductionStaff();
const logoutMutation = useLogout();

interface NavLink {
  to: string;
  label: string;
  icon: string;
  exact?: boolean;
}

const links = computed<NavLink[]>(() => {
  const items: NavLink[] = [
    { to: '/admin', label: 'Dashboard', icon: 'lucide:layout-dashboard', exact: true },
  ];
  if (isProductionStaff.value) {
    items.push({ to: '/admin/orders', label: 'Buyurtmalar', icon: 'lucide:clipboard-list' });
  }
  if (isSuperAdmin.value) {
    items.push(
      { to: '/admin/products', label: 'Mahsulotlar', icon: 'lucide:package' },
      { to: '/admin/production-centers', label: 'Ishlab chiqarish markazlari', icon: 'lucide:map-pin' },
      { to: '/admin/users', label: 'Foydalanuvchilar', icon: 'lucide:users' },
    );
  }
  return items;
});

function isActive(link: NavLink) {
  return link.exact ? route.path === link.to : route.path.startsWith(link.to);
}
</script>

<template>
  <aside class="hidden w-64 shrink-0 flex-col border-r border-brand-border/50 bg-white md:flex">
    <div class="border-b border-brand-border/50 p-5">
      <NuxtLink
        to="/"
        class="flex items-center gap-2.5"
      >
        <span class="flex h-9 w-9 items-center justify-center rounded-[10px] bg-brand text-base font-black text-white">Z</span>
        <span>
          <span class="block text-sm font-extrabold text-slate-900">Zazzle</span>
          <span class="block text-xs text-brand-muted">Admin panel</span>
        </span>
      </NuxtLink>
    </div>

    <nav class="flex-1 space-y-1 p-3">
      <NuxtLink
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        class="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition"
        :class="isActive(link) ? 'bg-secondary-50 text-secondary-700' : 'text-slate-600 hover:bg-brand-surface-low'"
      >
        <Icon
          :name="link.icon"
          class="h-4 w-4"
        />
        {{ link.label }}
      </NuxtLink>
    </nav>

    <div class="space-y-1 border-t border-brand-border/50 p-3">
      <NuxtLink
        to="/"
        class="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-brand-surface-low"
      >
        <Icon
          name="lucide:arrow-left"
          class="h-4 w-4"
        />
        Do'konga qaytish
      </NuxtLink>
      <button
        type="button"
        class="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
        @click="logoutMutation.mutate()"
      >
        <Icon
          name="lucide:log-out"
          class="h-4 w-4"
        />
        Chiqish
      </button>
    </div>
  </aside>
</template>
