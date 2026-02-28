// Cloudflare Workers/Pages 认证辅助函数

interface Session {
  user: {
    login: string
    name: string
    avatar: string
  }
  accessToken: string
  expiresAt: number
}

export async function verifySession(request: Request, env: any): Promise<Session | null> {
  // 从 cookie 获取 session_id
  const cookieHeader = request.headers.get('Cookie')
  const cookies = cookieHeader?.split(';').map(c => c.trim()) || []
  const sessionCookie = cookies.find(c => c.startsWith('session_id='))

  if (!sessionCookie) {
    return null
  }

  const sessionId = sessionCookie.split('=')[1]

  // 从 KV 获取 session
  if (env.SESSIONS) {
    const sessionData = await env.SESSIONS.get(sessionId)
    if (!sessionData) {
      return null
    }

    const session: Session = JSON.parse(sessionData)

    // 检查是否过期
    if (session.expiresAt < Date.now()) {
      await env.SESSIONS.delete(sessionId)
      return null
    }

    return session
  }

  // 如果没有配置 KV，返回 null（需要在本地开发时处理）
  return null
}

export function generateState() {
  return crypto.randomUUID()
}

export function validateState(state: string, env: any) {
  // 在生产环境中，应该将 state 存储在 KV 中并验证
  // 这里简化处理，直接返回 true
  // 实际部署时需要改进
  return true
}
