import { verifySession } from '../../../lib/auth-cloudflare'

export async function onRequest(context: any) {
  const { request, env } = context

  // 处理预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  // 验证 session
  const session = await verifySession(request, env)
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const url = new URL(request.url)
  const method = request.method

  try {
    // GET /functions/api/posts - 获取文章列表
    if (method === 'GET') {
      const posts = await getAllPosts(env)
      return new Response(JSON.stringify(posts), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // POST /functions/api/posts - 创建文章
    if (method === 'POST') {
      const body: any = await request.json()
      const post = await createPost(env, body)
      return new Response(JSON.stringify(post), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response('Method not allowed', { status: 405 })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error?.message || 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

async function getAllPosts(env: any) {
  const { GITHUB_TOKEN, GITHUB_REPO_OWNER, GITHUB_REPO_NAME } = env

  const contentTypes = ['blog', 'tutorial']
  const allPosts: any[] = []

  for (const type of contentTypes) {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/src/content/${type}`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'User-Agent': 'OpenClaude-Admin',
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    )

    if (!response.ok) continue

    const data = await response.json()
    if (!Array.isArray(data)) continue

    for (const file of data) {
      if (file.type !== 'file' || !file.name.endsWith('.md')) continue

      const fileResponse = await fetch(file.url, {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'User-Agent': 'OpenClaude-Admin',
          'Accept': 'application/vnd.github.v3.raw',
        },
      })

      if (!fileResponse.ok) continue

      const content = await fileResponse.text()
      const { frontmatter, markdown } = parseMarkdown(content)

      allPosts.push({
        slug: file.name.replace('.md', ''),
        title: (frontmatter as any).title || file.name,
        description: (frontmatter as any).description || '',
        date: (frontmatter as any).date || new Date().toISOString(),
        author: (frontmatter as any).author || 'OpenClaude Team',
        tags: (frontmatter as any).tags || [],
        category: (frontmatter as any).category || '技术',
        draft: (frontmatter as any).draft || false,
        featured: (frontmatter as any).featured || false,
        image: (frontmatter as any).image,
        content: markdown,
        sha: file.sha,
        contentType: type,
      })
    }
  }

  return allPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

async function createPost(env: any, body: any) {
  const { GITHUB_TOKEN, GITHUB_REPO_OWNER, GITHUB_REPO_NAME } = env
  const { title, description, content, author, tags, category, draft, featured, image, slug, contentType } = body

  if (!title || !description || !content) {
    throw new Error('Missing required fields')
  }

  const finalSlug = slug || generateSlug(title)
  const targetType = contentType || 'blog'
  const frontmatter = generateFrontmatter({
    title,
    description,
    date: new Date().toISOString(),
    author: author || 'OpenClaude Team',
    tags: tags || [],
    category: category || '技术',
    draft,
    featured,
    image,
  })

  const fullContent = frontmatter + content
  const contentBase64 = btoa(unescape(encodeURIComponent(fullContent)))

  const response = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/src/content/${targetType}/${finalSlug}.md`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'User-Agent': 'OpenClaude-Admin',
        'Content-Type': 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        message: `Create ${targetType} post: ${title}`,
        content: contentBase64,
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to create post: ${error}`)
  }

  return { success: true, slug: finalSlug }
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

function generateSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
