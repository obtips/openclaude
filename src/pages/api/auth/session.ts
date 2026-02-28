// Session 验证端点
import type { APIRoute } from 'astro'

export const prerender = false

export const GET: APIRoute = async ({ request }) => {
  // 从 cookie 获取 session
  const cookieHeader = request.headers.get('cookie')

  // 检查 local-session
  const sessionMatch = cookieHeader?.match(/session_id=([^;]+)/)

  if (!sessionMatch) {
    return new Response(JSON.stringify({ authenticated: false }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const sessionId = sessionMatch[1]

  // 本地开发环境
  if (sessionId.startsWith('local-session-')) {
    return new Response(JSON.stringify({
      authenticated: true,
      user: { name: '本地用户', login: 'local' },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // 从 session cookie 获取用户数据
  const sessionDataMatch = cookieHeader?.match(/session=([^;]+)/)

  if (sessionDataMatch) {
    try {
      const sessionData = JSON.parse(decodeURIComponent(sessionDataMatch[1]))

      // 检查是否过期
      if (sessionData.expiresAt && sessionData.expiresAt > Date.now()) {
        return new Response(JSON.stringify({
          authenticated: true,
          user: sessionData.user,
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    } catch (e) {
      // 解析失败，返回未认证
    }
  }

  return new Response(JSON.stringify({ authenticated: false }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  })
}
