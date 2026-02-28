// 本地开发 API - 文章列表
import type { APIRoute } from 'astro'

export const prerender = false

export const GET: APIRoute = async ({ request }) => {
  // 检查 session
  const session = await verifySession(request)
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const posts = await getAllPosts()
    return new Response(JSON.stringify(posts), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export const POST: APIRoute = async ({ request }) => {
  const session = await verifySession(request)
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await request.json()
    const post = await createPost(body)
    return new Response(JSON.stringify(post), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// 辅助函数
async function verifySession(request: Request): Promise<{ user: any } | null> {
  const cookieHeader = request.headers.get('Cookie')
  if (!cookieHeader) return null

  // 简化：本地开发时检查 cookie 中是否有 session_id
  const cookies = cookieHeader.split(';').map(c => c.trim())
  const sessionCookie = cookies.find(c => c.startsWith('session_id='))
  if (!sessionCookie) return null

  // 本地开发：简单返回 true（实际应该从 session 存储验证）
  return { user: { name: '本地用户' } }
}

async function getAllPosts() {
  // 本地开发：从文件系统读取所有内容
  const fs = await import('fs/promises')
  const path = await import('path')

  const contentDirs = [
    { dir: 'blog', type: 'blog' },
    { dir: 'tutorial', type: 'tutorial' },
  ]

  const allPosts = []

  for (const { dir, type } of contentDirs) {
    const contentDir = path.join(process.cwd(), 'src', 'content', dir)

    try {
      const files = await fs.readdir(contentDir)

      for (const file of files) {
        if (!file.endsWith('.md')) continue

        const content = await fs.readFile(path.join(contentDir, file), 'utf-8')
        const { frontmatter, markdown } = parseMarkdown(content)

        allPosts.push({
          slug: file.replace('.md', ''),
          title: frontmatter.title || file,
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
          contentType: type,
        })
      }
    } catch (error) {
      console.error(`Error reading ${dir}:`, error)
    }
  }

  return allPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

async function createPost(body: any) {
  // 本地开发：写入文件系统
  const fs = await import('fs/promises')
  const path = await import('path')
  const blogDir = path.join(process.cwd(), 'src', 'content', 'blog')

  const { title, description, content, author, tags, category, draft, featured, image, slug } = body

  if (!title || !description || !content) {
    throw new Error('Missing required fields')
  }

  const finalSlug = slug || generateSlug(title)
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
  const filepath = path.join(blogDir, `${finalSlug}.md`)

  await fs.writeFile(filepath, fullContent, 'utf-8')

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
      let value = line.slice(colonIndex + 1).trim()

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
