import type { APIRoute } from 'astro'
import { getPost, updatePost, deletePost } from '../../../../lib/github-api'

export const prerender = false

export const GET: APIRoute = async ({ request, params }) => {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  const owner = request.headers.get('X-GitHub-Owner') || import.meta.env.GITHUB_REPO_OWNER
  const repo = request.headers.get('X-GitHub-Repo') || import.meta.env.GITHUB_REPO_NAME
  const slug = params.id

  if (!token || !owner || !repo || !slug) {
    return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400 })
  }

  const post = await getPost(token, owner, repo, slug)

  if (!post) {
    return new Response(JSON.stringify({ error: 'Post not found' }), { status: 404 })
  }

  return new Response(JSON.stringify(post), {
    headers: { 'Content-Type': 'application/json' },
  })
}

export const PUT: APIRoute = async ({ request, params }) => {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  const owner = request.headers.get('X-GitHub-Owner') || import.meta.env.GITHUB_REPO_OWNER
  const repo = request.headers.get('X-GitHub-Repo') || import.meta.env.GITHUB_REPO_NAME
  const slug = params.id

  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  if (!owner || !repo) {
    return new Response(JSON.stringify({ error: 'Repository not configured' }), { status: 400 })
  }

  try {
    const body = await request.json()
    const { title, description, content, author, tags, category, draft, featured, image, sha, newSlug } = body

    if (!sha) {
      return new Response(JSON.stringify({ error: 'SHA is required for updates' }), { status: 400 })
    }

    const targetSlug = newSlug || slug

    const success = await updatePost(
      token,
      owner,
      repo,
      targetSlug,
      {
        title,
        description,
        date: body.date || new Date().toISOString(),
        author: author || 'OpenClaude Team',
        tags: tags || [],
        category: category || '技术',
        draft,
        featured,
        image,
      },
      content || '',
      sha
    )

    if (success) {
      return new Response(JSON.stringify({ success: true, slug: targetSlug }), {
        headers: { 'Content-Type': 'application/json' },
      })
    } else {
      return new Response(JSON.stringify({ error: 'Failed to update post' }), { status: 500 })
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400 })
  }
}

export const DELETE: APIRoute = async ({ request, params }) => {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  const owner = request.headers.get('X-GitHub-Owner') || import.meta.env.GITHUB_REPO_OWNER
  const repo = request.headers.get('X-GitHub-Repo') || import.meta.env.GITHUB_REPO_NAME
  const slug = params.id

  if (!token || !owner || !repo || !slug) {
    return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400 })
  }

  try {
    const body = await request.json()
    const { sha } = body

    if (!sha) {
      return new Response(JSON.stringify({ error: 'SHA is required for deletion' }), { status: 400 })
    }

    const success = await deletePost(token, owner, repo, slug, sha)

    if (success) {
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      })
    } else {
      return new Response(JSON.stringify({ error: 'Failed to delete post' }), { status: 500 })
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400 })
  }
}
