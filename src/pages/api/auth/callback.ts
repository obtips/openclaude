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
    const clientId = import.meta.env.GITHUB_CLIENT_ID || 'Ov23liyYAZ0eXDPO9eKd'
    const clientSecret = import.meta.env.GITHUB_CLIENT_SECRET || '61561f648dcd7b16438aa04f4ce2f189712b004f'

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

    // 创建 session
    const sessionId = crypto.randomUUID()
    const sessionData = {
      user: {
        login: userData.login,
        name: userData.name || userData.login,
        avatar: userData.avatar_url,
      },
      expiresAt: Date.now() + 60 * 24 * 60 * 60 * 1000,
    }

    // 将用户信息编码到 cookie（暂时不使用 KV）
    const sessionCookie = `session=${encodeURIComponent(JSON.stringify(sessionData))}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 24 * 60 * 60}`
    const idCookie = `session_id=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 24 * 60 * 60}`

    // 重定向到管理后台
    const headers = new Headers({
      'Location': `/admin`,
      'Set-Cookie': `${sessionCookie}\n${idCookie}`,
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
