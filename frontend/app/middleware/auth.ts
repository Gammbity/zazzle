// Route guard for pages that require a logged-in user (checkout, orders).
// Usage: `definePageMeta({ middleware: 'auth' })`
export default defineNuxtRouteMiddleware(async () => {
  if (!isAuthenticated()) {
    return navigateTo('/');
  }

  const { data, suspense } = useCurrentUser();
  await suspense();

  if (!data.value) {
    return navigateTo('/');
  }
});
