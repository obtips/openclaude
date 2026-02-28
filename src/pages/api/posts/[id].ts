// 本地开发 API - 单篇文章操作
import type { APIRoute } from 'astro'

export const prerender = false

export const GET: APIRoute = async ({ params, request }) => {
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
    const post = await getPost(slug)
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

export const PUT: APIRoute = async ({ params, request }) => {
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
    const result = await updatePost(slug, body)
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

export const DELETE: APIRoute = async ({ params, request }) => {
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
    await deletePost(slug)
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

  const cookies = cookieHeader.split(';').map(c => c.trim())
  const sessionCookie = cookies.find(c => c.startsWith('session_id='))
  if (!sessionCookie) return null

  return { user: { name: '本地用户' } }
}

async function getPost(slug: string) {
  const fs = await import('fs/promises')
  const path = await import('path')
  const filepath = path.join(process.cwd(), 'src', 'content', 'blog', `${slug}.md`)

  try {
    const content = await fs.readFile(filepath, 'utf-8')
    const { frontmatter, markdown } = parseMarkdown(content)

    return {
      slug,
      title: frontmatter.title || slug,
      description: frontmatter.description || '',
      date: frontmatter.date || new Date().toISOString(),
      author: frontmatter.author || 'OpenClaude Team',
      tags: frontmatter.tags || [],
      category: frontmatter.category || '技术',
      draft: frontmatter.draft || false,
      featured: frontmatter.featured || false,
      image: frontmatter.image,
      content: markdown,
      sha: 'local-' + Date.now(),
    }
  } catch (error) {
    return null
  }
}

async function updatePost(slug: string, body: any) {
  const fs = await import('fs/promises')
  const path = await import('path')
  const blogDir = path.join(process.cwd(), 'src', 'content', 'blog')

  const { title, description, content, author, tags, category, draft, featured, image, newSlug } = body
  const targetSlug = newSlug || slug

  const frontmatter = generateFrontmatter({
    title,
    description,
    date: body.date || new Date().toISOString(),
    author: author || 'OpenClaude Team',
    tags: tags || [],
    category: category || '技术',
    draft,
    featured,
    image,
  })

  const fullContent = frontmatter + content
  const filepath = path.join(blogDir, `${targetSlug}.md`)

  await fs.writeFile(filepath, fullContent, 'utf-8')

  return { success: true, slug: targetSlug }
}

async function deletePost(slug: string) {
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
