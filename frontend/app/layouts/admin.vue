<script setup lang="ts">
const { data: currentUser, isLoading } = useCurrentUser();
const isAdmin = useIsAdmin();
const authState = useAuthState();

watch([isLoading, isAdmin, currentUser], ([loading, admin, user]) => {
  if (!loading && user && !admin) {
    navigateTo('/');
  }
}, { immediate: true });
</script>

<template>
  <div
    v-if="isLoading"
    class="flex min-h-screen items-center justify-center bg-brand-surface-low"
  >
    <Icon
      name="lucide:loader-2"
      class="h-6 w-6 animate-spin text-secondary-600"
    />
  </div>

  <AdminLoginGate v-else-if="!authState" />

  <div
    v-else-if="!isAdmin"
    class="flex min-h-screen items-center justify-center bg-brand-surface-low"
  >
    <Icon
      name="lucide:loader-2"
      class="h-6 w-6 animate-spin text-secondary-600"
    />
  </div>

  <div
    v-else
    class="flex min-h-screen bg-brand-surface-low"
  >
    <AdminSidebar />

    <div class="flex flex-1 flex-col">
      <header class="border-b border-brand-border/50 bg-white px-4 py-3 md:px-8">
        <div class="flex items-center justify-between">
          <span class="text-sm font-semibold text-slate-900">Admin panel</span>
          <span class="text-sm text-brand-muted">{{ currentUser?.email }}</span>
        </div>
      </header>

      <main class="flex-1 px-4 py-6 md:px-8 md:py-8">
        <slot />
      </main>
    </div>
  </div>
</template>
