// GitHub OAuth 登录入口
import type { APIRoute } from 'astro'

export const prerender = false

export const GET: APIRoute = async () => {
  // 暂时硬编码 GitHub Client ID 用于测试
  // TODO: 需要从环境变量读取
  const githubClientId = 'Iv23fd7f00000000' // 替换为实际的 Client ID

  const origin = 'https://openclaude.pages.dev'
  const redirectUri = `${origin}/api/auth/callback`

  const params = new URLSearchParams({
    client_id: githubClientId,
    redirect_uri: redirectUri,
    scope: 'read:user user:email',
    state: crypto.randomUUID(),
  })

  const githubUrl = `https://github.com/login/oauth/authorize?${params}`

  return new Response(null, {
    status: 302,
    headers: {
      'Location': githubUrl
    }
  })
}

export const POST: APIRoute = async () => {
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
