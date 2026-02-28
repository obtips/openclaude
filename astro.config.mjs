import react from '@astrojs/react'
import tailwind from '@astrojs/tailwind'
import cloudflare from '@astrojs/cloudflare'

export default {
  site: 'https://openclau.de',
  output: 'server',
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
  ],
  adapter: cloudflare({
    // 排除 /api/* 和 /auth/* 路由，让 Cloudflare Functions 处理
    routes: {
      include: ['/*'],
      exclude: ['/api/*', '/auth/*'],
    },
  }),
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor'
            }
          },
        },
      },
    },
  },
}
