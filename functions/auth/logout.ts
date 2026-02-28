export async function onRequest(_context: any) {
  // 登出，清除 cookie
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': 'session_id=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
    },
  })
}
