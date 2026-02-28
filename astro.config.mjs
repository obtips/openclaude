import react from '@astrojs/react'
import tailwind from '@astrojs/tailwind'
import node from '@astrojs/node'

// 检测是否在 Cloudflare Pages 环境中构建
const isCloudflare = process.env.CF_PAGES || process.env.CF_PAGES_BRANCH

export default {
  site: 'https://openclau.de',
  // Cloudflare: static (API 由 functions/ 处理)
  // 本地: server (所有路由由 node 处理)
  output: isCloudflare ? 'static' : 'server',
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
  ],
  adapter: isCloudflare ? undefined : node({ mode: 'standalone' }),
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
