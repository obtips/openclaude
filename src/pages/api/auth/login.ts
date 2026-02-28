import type { APIRoute } from 'astro'

export const prerender = false


export const POST: APIRoute = async () => {
  // 本地开发：简单设置 session cookie
  const sessionId = 'local-session-' + Date.now()

  return new Response(JSON.stringify({
    user: { name: '本地用户', login: 'local' },
    sessionId: sessionId,
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': `session_id=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 24 * 60 * 60}`,
    },
  })
}
