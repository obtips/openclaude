// GitHub OAuth 回调处理
import type { APIRoute } from 'astro'

export const prerender = false

export const GET: APIRoute = async ({ url }) => {
  const code = url.searchParams.get('code')
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

  try {
    // GitHub OAuth 凭据
    const clientId = 'Ov23liyYAZ0eXDPO9eKd'
    const clientSecret = '61561f648dcd7b16438aa04f4ce2f189712b004f'

    // 交换 access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      return new Response(`Token exchange failed: ${errorText}`, { status: 500 })
    }

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      return new Response(`OAuth error: ${tokenData.error_description || tokenData.error}`, { status: 500 })
    }

    // 获取用户信息
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'User-Agent': 'OpenClaude-Admin',
      },
    })

    if (!userResponse.ok) {
      return new Response('Failed to get user info', { status: 500 })
    }

    const userData = await userResponse.json()

    // 创建 session（注意：需要配置 KV Namespace 才能持久化）
    const sessionId = crypto.randomUUID()
    const sessionData = {
      user: {
        login: userData.login,
        name: userData.name || userData.login,
        avatar: userData.avatar_url,
      },
      accessToken: tokenData.access_token,
      expiresAt: Date.now() + 60 * 24 * 60 * 60 * 1000,
    }

    // TODO: 存储到 KV Namespace (需要在 Cloudflare Pages 配置)
    // await env.SESSIONS.put(sessionId, JSON.stringify(sessionData), {
    //   expirationTtl: 60 * 24 * 60 * 60,
    // })

    // 重定向到管理后台，设置 session cookie
    const headers = new Headers({
      'Location': `/admin?session=${sessionId}`,
      'Set-Cookie': `session_id=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 24 * 60 * 60}`,
    })

    return new Response(null, { status: 302, headers })
  } catch (err: any) {
    return new Response(`
      <html>
        <head><title>登录失败</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h1>登录失败</h1>
          <p>错误: ${err?.message || '未知错误'}</p>
          <a href="/admin">返回</a>
        </body>
      </html>
    `, { status: 500, headers: { 'Content-Type': 'text/html' } })
  }
}
