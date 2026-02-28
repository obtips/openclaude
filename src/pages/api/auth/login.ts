import type { APIRoute } from 'astro'

export const prerender = false

// GET 请求：本地开发不需要 GitHub OAuth
export const GET: APIRoute = () => {
  return new Response(`
    <!DOCTYPE html>
    <html>
      <head><title>本地开发</title></head>
      <body style="font-family: sans-serif; text-align: center; padding: 50px;">
        <h1>本地开发环境</h1>
        <p>请返回 <a href="/admin">管理后台</a> 使用本地登录</p>
      </body>
    </html>
  `, { status: 200, headers: { 'Content-Type': 'text/html' } })
}

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
