export async function onRequest(context) {
  const { request, env } = context
  const url = new URL(request.url)

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

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    // 获取 GitHub 访问令牌
    const body = await request.json()
    const { code } = body

    if (!code) {
      return new Response(JSON.stringify({ error: 'Missing code' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 交换 access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code: code,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      return new Response(JSON.stringify({ error: 'GitHub token exchange failed', details: errorText }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const tokenData = await tokenResponse.json()

    // 获取用户信息
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'User-Agent': 'OpenClaude-Admin',
      },
    })

    if (!userResponse.ok) {
      return new Response(JSON.stringify({ error: 'Failed to get user info' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const userData = await userResponse.json()

    // 创建 session
    const sessionId = crypto.randomUUID()
    const sessionData = {
      user: {
        login: userData.login,
        name: userData.name,
        avatar: userData.avatar_url,
      },
      accessToken: tokenData.access_token,
      expiresAt: Date.now() + tokenData.expires_in * 1000,
    }

    // 存储到 KV (如果配置了)
    if (env.SESSIONS) {
      await env.SESSIONS.put(sessionId, JSON.stringify(sessionData), {
        expirationTtl: 60 * 24 * 60 * 60, // 60 天
      })
    }

    // 返回 session cookie 和用户信息
    return new Response(JSON.stringify({
      user: sessionData.user,
      sessionId: sessionId,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `session_id=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 24 * 60 * 60}`,
      },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
