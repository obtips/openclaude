// GitHub OAuth 回调处理器
export async function onRequest(context) {
  const { request, env } = context
  const url = new URL(request.url)

  try {
    // 从 URL 参数获取授权码和 state
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')

    // 处理用户拒绝授权
    if (error) {
      return new Response(`
        <html>
          <head><title>登录失败</title></head>
          <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1>登录失败</h1>
            <p>原因: ${error === 'access_denied' ? '您取消了授权' : error}</p>
            <a href="/admin">返回</a>
          </body>
        </html>
      `, { status: 400, headers: { 'Content-Type': 'text/html' } })
    }

    if (!code) {
      return new Response('Missing authorization code', { status: 400 })
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
      console.error('GitHub token exchange failed:', errorText)
      throw new Error('Token exchange failed')
    }

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      throw new Error(tokenData.error_description || tokenData.error)
    }

    // 获取用户信息
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'User-Agent': 'OpenClaude-Admin',
      },
    })

    if (!userResponse.ok) {
      throw new Error('Failed to get user info')
    }

    const userData = await userResponse.json()

    // 创建 session
    const sessionId = crypto.randomUUID()
    const sessionData = {
      user: {
        login: userData.login,
        name: userData.name || userData.login,
        avatar: userData.avatar_url,
      },
      accessToken: tokenData.access_token,
      expiresAt: Date.now() + 60 * 24 * 60 * 60 * 1000, // 60 天
    }

    // 存储到 KV (如果配置了)
    if (env.SESSIONS) {
      await env.SESSIONS.put(sessionId, JSON.stringify(sessionData), {
        expirationTtl: 60 * 24 * 60 * 60, // 60 天
      })
    }

    // 重定向到管理后台，设置 session cookie
    const redirectUrl = new URL('/admin', url.origin)
    return Response.redirect(`${redirectUrl.origin}${redirectUrl.pathname}?session=${sessionId}`, 302, {
      headers: {
        'Set-Cookie': `session_id=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 24 * 60 * 60}`,
      },
    })
  } catch (error) {
    console.error('OAuth callback error:', error)
    return new Response(`
      <html>
        <head><title>登录失败</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h1>登录失败</h1>
          <p>错误: ${error.message}</p>
          <a href="/admin">返回</a>
        </body>
      </html>
    `, { status: 500, headers: { 'Content-Type': 'text/html' } })
  }
}
