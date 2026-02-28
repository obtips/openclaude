export async function onRequest(context: any) {
  const { request, env } = context

  // 处理预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  // GET 请求：重定向到 GitHub OAuth
  if (request.method === 'GET') {
    const state = crypto.randomUUID()
    const params = new URLSearchParams({
      client_id: env.GITHUB_CLIENT_ID,
      redirect_uri: `${new URL(request.url).origin}/api/auth/callback`,
      scope: 'read:user user:email',
      state: state,
    })

    return Response.redirect(`https://github.com/login/oauth/authorize?${params}`, 302)
  }

  // POST 请求：本地开发用的简单登录
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  // 本地开发简单登录
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
