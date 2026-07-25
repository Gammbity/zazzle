import tailwindcss from '@tailwindcss/vite';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  modules: [
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxt/image',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@vueuse/motion/nuxt',
  ],

  components: [
    '~/components',
    { path: '~/components/layout', pathPrefix: false },
    { path: '~/components/auth', pathPrefix: false },
    { path: '~/components/admin', pathPrefix: false },
    { path: '~/components/admin/charts', pathPrefix: false },
    { path: '~/components/ui', pathPrefix: false },
    { path: '~/components/landing', pathPrefix: false },
    { path: '~/components/customizer', pathPrefix: false },
    { path: '~/components/customizer/preview3d', pathPrefix: false },
  ],

  imports: {
    // Nuxt only auto-scans the top level of `composables/` by default —
    // opt in to the `queries/` subfolder too so `useCart`, `useCurrentUser`
    // etc. stay auto-imported like everything else.
    dirs: ['composables/queries'],
  },

  devtools: { enabled: true },

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      htmlAttrs: { lang: 'uz' },
      title: 'Zazzle Uzbekistan',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'Rasm yuklang, mahsulotingizni dizayn qiling va O‘zbekiston bo‘ylab buyurtma bering.',
        },
      ],
    },
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    // Server-only: reachable inside the docker network via the compose
    // service name. Never exposed to the client bundle.
    backendUrl: process.env.BACKEND_URL || 'http://localhost:8000',

    public: {
      // Client-side calls stay same-origin and go through the `/api/**`
      // proxy defined in routeRules below — mirrors how the Next.js
      // frontend proxied through next.config.mjs rewrites.
      apiBase: '/api',
      mediaUrl: process.env.NUXT_PUBLIC_MEDIA_URL || 'http://localhost:8000/media',
      staticUrl: process.env.NUXT_PUBLIC_STATIC_URL || 'http://localhost:8000/static',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    },
  },

  routeRules: {
    // SSR/server-side proxy to the Django backend — resolved with
    // `backendUrl` (private runtimeConfig) at request time.
    '/api/**': { proxy: `${process.env.BACKEND_URL || 'http://localhost:8000'}/api/**` },
    '/media/**': { proxy: `${process.env.BACKEND_URL || 'http://localhost:8000'}/media/**` },
    '/static/**': { proxy: `${process.env.BACKEND_URL || 'http://localhost:8000'}/static/**` },
  },

  future: { compatibilityVersion: 4 },
  compatibilityDate: '2025-07-15',

  vite: {
    plugins: [tailwindcss()],
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },

  eslint: {
    config: { stylistic: { indent: 2, quotes: 'single', semi: true } },
  },

  fonts: {
    families: [{ name: 'Plus Jakarta Sans', provider: 'google', weights: [400, 500, 600, 700, 800] }],
  },

  icon: {
    // Matches the lucide-react icon set used by the previous frontend, so
    // reference designs translate 1:1 by icon name (`i-lucide-<name>`).
    provider: 'iconify',
    serverBundle: { collections: ['lucide'] },
  },

  image: {
    // Backend media/static hosts — extend as real image domains are known.
    domains: ['localhost'],
  },
});
