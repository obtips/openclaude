// Session 验证端点
import type { APIRoute } from 'astro'

export const prerender = false

export const GET: APIRoute = async ({ request }) => {
  // 从 cookie 获取 session_id
  const cookieHeader = request.headers.get('cookie')
  const sessionMatch = cookieHeader?.match(/session_id=([^;]+)/)

  if (!sessionMatch) {
    return new Response(JSON.stringify({ authenticated: false }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const sessionId = sessionMatch[1]

  // 本地开发环境直接返回成功
  if (sessionId.startsWith('local-session-')) {
    return new Response(JSON.stringify({
      authenticated: true,
      user: { name: '本地用户', login: 'local' },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // 生产环境从 KV 读取 session
  const env = (globalThis as any).cloudflare?.env

  if (env?.SESSIONS) {
    try {
      const sessionData = await env.SESSIONS.get(sessionId, 'json')

      if (!sessionData) {
        return new Response(JSON.stringify({ authenticated: false }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({
        authenticated: true,
        user: (sessionData as any).user,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (err) {
      return new Response(JSON.stringify({ authenticated: false }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }

  // 没有 KV 绑定，返回未认证
  return new Response(JSON.stringify({ authenticated: false }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  })
}
