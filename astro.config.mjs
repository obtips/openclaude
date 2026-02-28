import react from '@astrojs/react'
import tailwind from '@astrojs/tailwind'

// 本地开发使用 Node.js adapter，Cloudflare Pages 使用静态构建
const adapter = process.env.CF_PAGES ? undefined : await import('@astrojs/node').then(m => m.default({ mode: 'standalone' }))

export default {
  site: 'https://openclau.de',
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
  ],
  ...(adapter && { adapter }),
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
