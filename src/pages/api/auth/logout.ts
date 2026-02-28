import type { APIRoute } from 'astro'

export const prerender = false


export const POST: APIRoute = () => {
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': 'session_id=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
    },
  })
}
