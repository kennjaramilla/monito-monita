import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  css: ['~/assets/main.css'],
  vite: { plugins: [tailwindcss()] },
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'Monito Monita',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Free monito monita draw. Add names, share the links, and everyone picks who they give a gift to. No sign-up.' },
        { name: 'theme-color', content: '#b91c1c' },
      ],
      link: [
        { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@400;600;700&display=swap' },
      ],
    },
  },
  routeRules: {
    // These pages read their secret from the URL #fragment, which only the browser sees.
    '/o/**': { ssr: false, headers: { 'x-robots-tag': 'noindex' } },
    '/p/**': { ssr: false, headers: { 'x-robots-tag': 'noindex' } },
    '/**': {
      headers: {
        'x-frame-options': 'DENY',
        'x-content-type-options': 'nosniff',
        'referrer-policy': 'no-referrer',
      },
    },
    '/api/**': { headers: { 'cache-control': 'no-store' } },
  },
})
