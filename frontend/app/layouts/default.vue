<template>
  <div class="flex min-h-screen flex-col">
    <AppNavbar />
    <main
      id="main-content"
      class="flex-1"
    >
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
