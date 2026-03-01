// 单篇文章操作 API - 生产环境通过 GitHub API 读取
export const prerender = false
import type { APIRoute } from 'astro'

export const GET: APIRoute = async (context) => {
  const { params, request, locals } = context
  const env = (locals as any).runtime?.env || import.meta.env

  const session = await verifySession(request)
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { id: slug } = params
  if (!slug) {
    return new Response(JSON.stringify({ error: 'Missing slug' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const post = await getPost(request, env, slug)
    if (!post) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    return new Response(JSON.stringify(post), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error?.message || 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export const PUT: APIRoute = async (context) => {
  const { params, request, locals } = context
  const env = (locals as any).runtime?.env || import.meta.env

  const session = await verifySession(request)
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { id: slug } = params
  if (!slug) {
    return new Response(JSON.stringify({ error: 'Missing slug' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await request.json()
    const result = await updatePost(request, env, slug, body)
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error?.message || 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export const DELETE: APIRoute = async (context) => {
  const { params, request, locals } = context
  const env = (locals as any).runtime?.env || import.meta.env

  const session = await verifySession(request)
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { id: slug } = params
  if (!slug) {
    return new Response(JSON.stringify({ error: 'Missing slug' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    // 这里需要根据请求体获取 sha，如果是从 GitHub 删除需要 sha
    const bodyText = await request.text()
    const body = bodyText ? JSON.parse(bodyText) : {}
    await deletePost(request, env, slug, body.sha)

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error?.message || 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

async function verifySession(request: Request): Promise<{ user: any } | null> {
  const cookieHeader = request.headers.get('Cookie')
  if (!cookieHeader) return null

  const sessionIdMatch = cookieHeader.match(/session_id=([^;]+)/)
  if (sessionIdMatch) {
    const sessionId = sessionIdMatch[1]
    if (sessionId.startsWith('local-session-')) {
      return { user: { name: '本地用户' } }
    }
    // 生产环境：session_id 存在即代表已通过 OAuth
    return { user: { name: 'GitHub User' } }
  }

  return null
}

function isLocalDev(request: Request): boolean {
  const host = request.headers.get('host') || ''
  return host.includes('localhost') || host.includes('127.0.0.1')
}

// ==========================================
// GET POST
// ==========================================

async function getPost(request: Request, env: any, slug: string) {
  if (isLocalDev(request)) {
    return getPostFromFS(slug)
  }
  return getPostFromGitHub(env, slug)
}

async function getPostFromGitHub(env: any, slug: string) {
  const token = env?.GITHUB_TOKEN || import.meta.env.GITHUB_TOKEN
  const owner = env?.GITHUB_REPO_OWNER || import.meta.env.GITHUB_REPO_OWNER
  const repo = env?.GITHUB_REPO_NAME || import.meta.env.GITHUB_REPO_NAME

  if (!token || !owner || !repo) {
    throw new Error('Missing GitHub env vars')
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/src/content/blog/${slug}.md`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'OpenClaude-Admin',
        'Accept': 'application/vnd.github.v3.raw',
      },
    }
  )

  if (!response.ok) {
    if (response.status === 404) return null
    throw new Error('Failed to fetch post from GitHub')
  }

  const content = await response.text()
  const { frontmatter, markdown } = parseMarkdown(content)

  return {
    slug,
    title: (frontmatter as any).title || slug,
    description: (frontmatter as any).description || '',
    date: (frontmatter as any).date || new Date().toISOString(),
    author: (frontmatter as any).author || 'OpenClaude Team',
    tags: (frontmatter as any).tags || [],
    category: (frontmatter as any).category || '技术',
    draft: (frontmatter as any).draft || false,
    featured: (frontmatter as any).featured || false,
    image: (frontmatter as any).image,
    content: markdown,
    // GitHub API 对于单文件请求通常不会直接返回 raw content 里面的 sha（除非用 +json，但我们用了 .raw）
    // 为了编辑功能，我们需要它的 sha（在列表里其实前端拿到了）
    // 为了稳妥，如果用到，前端会在 PUT 传回来。这里不再强求提取 sha 传给前端（前端列表带了 sha）
  }
}

async function getPostFromFS(slug: string) {
  const fs = await import('fs/promises')
  const path = await import('path')
  const filepath = path.join(process.cwd(), 'src', 'content', 'blog', `${slug}.md`)

  try {
    const content = await fs.readFile(filepath, 'utf-8')
    const { frontmatter, markdown } = parseMarkdown(content)

    return {
      slug,
      title: (frontmatter as any).title || slug,
      description: (frontmatter as any).description || '',
      date: (frontmatter as any).date || new Date().toISOString(),
      author: (frontmatter as any).author || 'OpenClaude Team',
      tags: (frontmatter as any).tags || [],
      category: (frontmatter as any).category || '技术',
      draft: (frontmatter as any).draft || false,
      featured: (frontmatter as any).featured || false,
      image: (frontmatter as any).image,
      content: markdown,
      sha: 'local-' + Date.now(),
    }
  } catch (error) {
    return null
  }
}

// ==========================================
// UPDATE POST
// ==========================================

async function updatePost(request: Request, env: any, slug: string, body: any) {
  if (isLocalDev(request)) {
    return updatePostToFS(slug, body)
  }
  return updatePostToGitHub(env, slug, body)
}

async function updatePostToGitHub(env: any, slug: string, body: any) {
  const token = env?.GITHUB_TOKEN || import.meta.env.GITHUB_TOKEN
  const owner = env?.GITHUB_REPO_OWNER || import.meta.env.GITHUB_REPO_OWNER
  const repo = env?.GITHUB_REPO_NAME || import.meta.env.GITHUB_REPO_NAME

  const { title, description, content, author, tags, category, draft, featured, image, newSlug, sha } = body

  if (!sha) {
    throw new Error('SHA is required to update a file on GitHub')
  }

  const targetSlug = newSlug || slug
  const frontmatter = generateFrontmatter({
    title, description, date: body.date || new Date().toISOString(),
    author: author || 'OpenClaude Team',
    tags: tags || [], category: category || '技术',
    draft, featured, image,
  })

  const fullContent = frontmatter + content
  const contentBase64 = btoa(unescape(encodeURIComponent(fullContent)))

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/src/content/blog/${targetSlug}.md`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'OpenClaude-Admin',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Update blog post: ${title}`,
        content: contentBase64,
        sha,
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to update post: ${errorText}`)
  }

  return { success: true, slug: targetSlug }
}

async function updatePostToFS(slug: string, body: any) {
  const fs = await import('fs/promises')
  const path = await import('path')
  const blogDir = path.join(process.cwd(), 'src', 'content', 'blog')

  const { title, description, content, author, tags, category, draft, featured, image, newSlug } = body
  const targetSlug = newSlug || slug

  const frontmatter = generateFrontmatter({
    title, description, date: body.date || new Date().toISOString(),
    author: author || 'OpenClaude Team',
    tags: tags || [], category: category || '技术',
    draft, featured, image,
  })

  const fullContent = frontmatter + content
  const filepath = path.join(blogDir, `${targetSlug}.md`)

  await fs.writeFile(filepath, fullContent, 'utf-8')

  return { success: true, slug: targetSlug }
}

// ==========================================
// DELETE POST
// ==========================================

async function deletePost(request: Request, env: any, slug: string, sha?: string) {
  if (isLocalDev(request)) {
    return deletePostFromFS(slug)
  }
  return deletePostFromGitHub(env, slug, sha)
}

async function deletePostFromGitHub(env: any, slug: string, sha?: string) {
  const token = env?.GITHUB_TOKEN || import.meta.env.GITHUB_TOKEN
  const owner = env?.GITHUB_REPO_OWNER || import.meta.env.GITHUB_REPO_OWNER
  const repo = env?.GITHUB_REPO_NAME || import.meta.env.GITHUB_REPO_NAME

  if (!sha) {
    throw new Error('SHA is required to delete a file on GitHub')
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/src/content/blog/${slug}.md`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'OpenClaude-Admin',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Delete blog post: ${slug}`,
        sha,
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to delete post: ${errorText}`)
  }
}

async function deletePostFromFS(slug: string) {
  const fs = await import('fs/promises')
  const path = await import('path')
  const filepath = path.join(process.cwd(), 'src', 'content', 'blog', `${slug}.md`)

  await fs.unlink(filepath)
}

function parseMarkdown(content: string) {
  const frontmatterRegex = /^---\n([\s\S]+?)\n---\n([\s\S]*)$/
  const match = content.match(frontmatterRegex)

  if (!match) {
    return { frontmatter: {}, markdown: content }
  }

  const frontmatterLines = match[1].split('\n')
  const frontmatter: any = {}

  for (const line of frontmatterLines) {
    const colonIndex = line.indexOf(':')
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim()
      let value: any = line.slice(colonIndex + 1).trim()

      if (value.startsWith("'") && value.endsWith("'")) {
        value = value.slice(1, -1)
      } else if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1)
      } else if (value === 'true') {
        value = true
      } else if (value === 'false') {
        value = false
      } else if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map((v: string) => v.trim().replace(/['"]/g, '')).filter((v: string) => v)
      }

      frontmatter[key] = value
    }
  }

  return { frontmatter, markdown: match[2] }
}

function generateFrontmatter(post: any) {
  const tags = (post.tags || []).map((t: string) => `'${t}'`).join(', ')
  return `---
title: '${post.title}'
description: '${post.description}'
date: ${post.date}
author: '${post.author}'
tags: [${tags}]
category: '${post.category}'
${post.draft !== undefined ? `draft: ${post.draft}` : ''}
${post.featured ? 'featured: true' : ''}
${post.image ? `image: '${post.image}'` : ''}
---

`
}
