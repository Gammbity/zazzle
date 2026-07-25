<script setup lang="ts">
// Telegram's Login Widget renders its own iframe button — it can't be
// triggered from a custom button the way Google/Facebook can, so it gets
// its own mount point instead of living in AuthOAuthButtons' shared list.
declare global {
  interface Window {
    onTelegramAuth?: (user: Record<string, unknown>) => void;
  }
}

const emit = defineEmits<{ error: [message: string] }>();

const container = ref<HTMLElement | null>(null);
const visible = ref(false);
const { ensureConfig, redirectAfterLogin } = useOAuth();
const telegramLogin = useTelegramLogin();

onMounted(async () => {
  const config = await ensureConfig();
  if (!config.telegram.enabled || !config.telegram.bot_username) return;

  window.onTelegramAuth = async (user) => {
    try {
      await telegramLogin.mutateAsync(user);
      await redirectAfterLogin();
    }
    catch {
      emit('error', 'Telegram orqali kirishda xatolik.');
    }
  };

  visible.value = true;
  await nextTick();

  const script = document.createElement('script');
  script.src = 'https://telegram.org/js/telegram-widget.js?22';
  script.async = true;
  script.setAttribute('data-telegram-login', config.telegram.bot_username);
  script.setAttribute('data-size', 'large');
  script.setAttribute('data-radius', '12');
  script.setAttribute('data-onauth', 'onTelegramAuth(user)');
  script.setAttribute('data-request-access', 'write');
  container.value?.appendChild(script);
});
</script>

<template>
  <div
    v-if="visible"
    ref="container"
    class="flex justify-center"
  />
</template>
