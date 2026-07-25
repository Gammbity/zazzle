import { getApiErrorMessage } from '~/composables/useApi';

export interface OAuthProviderConfig {
  enabled: boolean;
  client_id?: string;
  app_id?: string;
  bot_username?: string;
}

export interface OAuthConfigResponse {
  google: OAuthProviderConfig;
  facebook: OAuthProviderConfig;
  telegram: OAuthProviderConfig;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
          prompt: () => void;
        };
      };
    };
    FB?: {
      init: (config: { appId: string; version: string; xfbml: boolean }) => void;
      login: (
        callback: (response: { authResponse?: { accessToken: string } }) => void,
        options: { scope: string },
      ) => void;
    };
  }
}

const oauthConfig = ref<OAuthConfigResponse | null>(null);
let configPromise: Promise<OAuthConfigResponse> | null = null;

const loadedScripts = new Set<string>();
function loadScript(src: string) {
  if (loadedScripts.has(src)) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => {
      loadedScripts.add(src);
      resolve();
    };
    script.onerror = () => reject(new Error(`Skript yuklanmadi: ${src}`));
    document.head.appendChild(script);
  });
}

function redirectAfterLogin() {
  const route = useRoute();
  const redirect = route.query.redirect;
  return navigateTo(typeof redirect === 'string' && redirect.startsWith('/') ? redirect : '/');
}

export function useOAuth() {
  const api = useApi();
  const googleLogin = useGoogleLogin();
  const facebookLogin = useFacebookLogin();
  const error = ref<string | null>(null);

  async function ensureConfig(): Promise<OAuthConfigResponse> {
    if (oauthConfig.value) return oauthConfig.value;
    configPromise ??= api.get<OAuthConfigResponse>('/auth/oauth/config/');
    oauthConfig.value = await configPromise;
    return oauthConfig.value;
  }

  async function startGoogle() {
    const config = await ensureConfig();
    if (!config.google.enabled || !config.google.client_id) {
      error.value = 'Google orqali kirish hozircha sozlanmagan.';
      return;
    }

    await loadScript('https://accounts.google.com/gsi/client');
    window.google!.accounts.id.initialize({
      client_id: config.google.client_id,
      callback: async (response) => {
        try {
          await googleLogin.mutateAsync(response.credential);
          await redirectAfterLogin();
        }
        catch (err) {
          error.value = getApiErrorMessage(err, 'Google orqali kirishda xatolik.');
        }
      },
    });
    window.google!.accounts.id.prompt();
  }

  async function startFacebook() {
    const config = await ensureConfig();
    if (!config.facebook.enabled || !config.facebook.app_id) {
      error.value = 'Facebook orqali kirish hozircha sozlanmagan.';
      return;
    }

    await loadScript('https://connect.facebook.net/en_US/sdk.js');
    window.FB!.init({ appId: config.facebook.app_id, version: 'v19.0', xfbml: false });
    window.FB!.login(async (response) => {
      const accessToken = response.authResponse?.accessToken;
      if (!accessToken) return;
      try {
        await facebookLogin.mutateAsync(accessToken);
        await redirectAfterLogin();
      }
      catch (err) {
        error.value = getApiErrorMessage(err, 'Facebook orqali kirishda xatolik.');
      }
    }, { scope: 'email' });
  }

  async function startOAuth(provider: 'google' | 'facebook' | 'telegram') {
    error.value = null;
    if (provider === 'google') return startGoogle();
    if (provider === 'facebook') return startFacebook();
    error.value = 'Telegram orqali kirish uchun pastdagi tugmadan foydalaning.';
  }

  return { startOAuth, error, ensureConfig, loadScript, redirectAfterLogin };
}
