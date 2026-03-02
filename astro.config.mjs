import react from '@astrojs/react'
import tailwind from '@astrojs/tailwind'
import cloudflare from '@astrojs/cloudflare'

// 混合渲染模式：主要页面静态预渲染 + API 路由动态处理
// - output: 'server' + adapter: cloudflare() 部署到 Cloudflare Pages
// - 设置 prerender = true 的页面会在构建时预渲染为静态 HTML
// - API 路由保持动态运行
export default {
  site: 'https://openclau.de',
  output: 'server',
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
  ],
  adapter: cloudflare(),
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
