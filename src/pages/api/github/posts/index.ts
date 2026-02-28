import type { APIRoute } from 'astro'
import { getAllPosts, createPost, generateSlug } from '../../../../lib/github-api'

export const prerender = false

export const GET: APIRoute = async ({ request }) => {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  const owner = request.headers.get('X-GitHub-Owner') || import.meta.env.GITHUB_REPO_OWNER
  const repo = request.headers.get('X-GitHub-Repo') || import.meta.env.GITHUB_REPO_NAME

  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  if (!owner || !repo) {
    return new Response(JSON.stringify({ error: 'Repository not configured' }), { status: 400 })
  }

  const posts = await getAllPosts(token, owner, repo)
  return new Response(JSON.stringify(posts), {
    headers: { 'Content-Type': 'application/json' },
  })
}

export const POST: APIRoute = async ({ request }) => {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  const owner = request.headers.get('X-GitHub-Owner') || import.meta.env.GITHUB_REPO_OWNER
  const repo = request.headers.get('X-GitHub-Repo') || import.meta.env.GITHUB_REPO_NAME

  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  if (!owner || !repo) {
    return new Response(JSON.stringify({ error: 'Repository not configured' }), { status: 400 })
  }

  try {
    const body = await request.json()
    const { title, description, content, author, tags, category, draft, featured, image, slug } = body

    if (!title || !description) {
      return new Response(JSON.stringify({ error: 'Title and description are required' }), {
        status: 400,
      })
    }

    const finalSlug = slug || generateSlug(title)
    const success = await createPost(
      token,
      owner,
      repo,
      finalSlug,
      {
        title,
        description,
        date: new Date().toISOString(),
        author: author || 'OpenClaude Team',
        tags: tags || [],
        category: category || '技术',
        draft,
        featured,
        image,
      },
      content || ''
    )

    if (success) {
      return new Response(JSON.stringify({ success: true, slug: finalSlug }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      })
    } else {
      return new Response(JSON.stringify({ error: 'Failed to create post' }), { status: 500 })
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400 })
  }
}
