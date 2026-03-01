// 文章列表 API - 生产环境通过 GitHub API 读取
export const prerender = false
import type { APIRoute } from 'astro'

export const GET: APIRoute = async (context) => {
  const { request, locals } = context
  // 从 Cloudflare locals runtime 获取环境变量，回退到 import.meta.env（用于本地开发）
  const env = (locals as any).runtime?.env || import.meta.env

  // 检查 session
  const session = await verifySession(request)
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const posts = await getAllPosts(request, env)
    return new Response(JSON.stringify(posts), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error?.message || 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export const POST: APIRoute = async (context) => {
  const { request, locals } = context
  // 从 Cloudflare locals runtime 获取环境变量，回退到 import.meta.env
  const env = (locals as any).runtime?.env || import.meta.env

  const session = await verifySession(request)
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await request.json()
    const post = await createPost(request, env, body)
    return new Response(JSON.stringify(post), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error?.message || 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// session 验证：检查 session_id cookie 或 session cookie（GitHub OAuth 回调写入的）
async function verifySession(request: Request): Promise<{ user: any } | null> {
  const cookieHeader = request.headers.get('Cookie')
  if (!cookieHeader) return null

  // 本地开发 session
  const sessionIdMatch = cookieHeader.match(/session_id=([^;]+)/)
  if (sessionIdMatch) {
    const sessionId = sessionIdMatch[1]
    if (sessionId.startsWith('local-session-')) {
      return { user: { name: '本地用户' } }
    }
  }

  // 生产环境：检查 session 数据，确保不过期
  const sessionDataMatch = cookieHeader.match(/session=([^;]+)/)
  if (sessionDataMatch) {
    try {
      const sessionData = JSON.parse(decodeURIComponent(sessionDataMatch[1]))
      if (sessionData.expiresAt && sessionData.expiresAt > Date.now()) {
        return { user: sessionData.user }
      }
    } catch (e) {
      // 解析失败
    }
  }

  return null
}

// 判断是否为本地开发环境
function isLocalDev(request: Request): boolean {
  const host = request.headers.get('host') || ''
  return host.includes('localhost') || host.includes('127.0.0.1')
}

async function getAllPosts(request: Request, env: any) {
  // 本地开发：从文件系统读取
  if (isLocalDev(request)) {
    return getAllPostsFromFS()
  }
  // 生产环境：从 GitHub API 读取
  return getAllPostsFromGitHub(env)
}

async function getAllPostsFromGitHub(env: any) {
  const token = env?.GITHUB_TOKEN || import.meta.env.GITHUB_TOKEN
  const owner = env?.GITHUB_REPO_OWNER || import.meta.env.GITHUB_REPO_OWNER
  const repo = env?.GITHUB_REPO_NAME || import.meta.env.GITHUB_REPO_NAME

  if (!token || !owner || !repo) {
    throw new Error('Missing GitHub env vars: GITHUB_TOKEN, GITHUB_REPO_OWNER, GITHUB_REPO_NAME')
  }

  const contentTypes = ['blog', 'tutorial', 'tutorial-en', 'pages']
  const allPosts: any[] = []

  // 并发获取各个 content 类型的目录列表
  const typePromises = contentTypes.map(async (type) => {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/src/content/${type}?t=${Date.now()}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'OpenClaude-Admin',
          'Accept': 'application/vnd.github.v3+json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      }
    )

    if (!response.ok) return []

    const data = await response.json()
    if (!Array.isArray(data)) return []

    // 筛选出 Markdown 文件
    const files = data.filter((file: any) => file.type === 'file' && file.name.endsWith('.md'))

    // 并发拉取对应 Markdown 文件的具体内容
    const filePromises = files.map(async (file: any) => {
      const fileResponse = await fetch(`${file.url}&t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'OpenClaude-Admin',
          'Accept': 'application/vnd.github.v3.raw',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      })

      if (!fileResponse.ok) return null

      const content = await fileResponse.text()
      try {
        const { frontmatter, markdown } = parseMarkdown(content)
        const slug = file.name.replace(/\.md$/, '')
        return {
          slug,
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
        }
      } catch (e) {
        return null
      }
    })

    const parsedFiles = await Promise.all(filePromises)
    return parsedFiles.filter(Boolean)
  })

  const results = await Promise.all(typePromises)
  // 将所有结果打平装入 allPosts
  results.forEach(posts => allPosts.push(...posts))

  return allPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

async function getAllPostsFromFS() {
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
          title: (frontmatter as any).title || file,
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
          contentType: type,
        })
      }
    } catch (error) {
      console.error(`Error reading ${dir}:`, error)
    }
  }

  return allPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

async function createPost(request: Request, env: any, body: any) {
  if (isLocalDev(request)) {
    return createPostToFS(body)
  }
  return createPostToGitHub(env, body)
}

async function createPostToGitHub(env: any, body: any) {
  const token = env?.GITHUB_TOKEN || import.meta.env.GITHUB_TOKEN
  const owner = env?.GITHUB_REPO_OWNER || import.meta.env.GITHUB_REPO_OWNER
  const repo = env?.GITHUB_REPO_NAME || import.meta.env.GITHUB_REPO_NAME

  const { title, description, content, author, tags, category, draft, featured, image, slug, contentType } = body

  if (!title || !description || !content) {
    throw new Error('Missing required fields')
  }

  const finalSlug = slug || generateSlug(title)
  const targetType = contentType || 'blog'
  const frontmatter = generateFrontmatter({
    title, description, date: new Date().toISOString(),
    author: author || 'OpenClaude Team',
    tags: tags || [], category: category || '技术',
    draft, featured, image,
  })

  const fullContent = frontmatter + content
  const contentBase64 = btoa(unescape(encodeURIComponent(fullContent)))

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/src/content/${targetType}/${finalSlug}.md`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'OpenClaude-Admin',
        'Content-Type': 'application/json',
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

async function createPostToFS(body: any) {
  const fs = await import('fs/promises')
  const path = await import('path')
  const blogDir = path.join(process.cwd(), 'src', 'content', 'blog')

  const { title, description, content, author, tags, category, draft, featured, image, slug } = body

  if (!title || !description || !content) {
    throw new Error('Missing required fields')
  }

  const finalSlug = slug || generateSlug(title)
  const frontmatter = generateFrontmatter({
    title, description, date: new Date().toISOString(),
    author: author || 'OpenClaude Team',
    tags: tags || [], category: category || '技术',
    draft, featured, image,
  })

  const fullContent = frontmatter + content
  await fs.writeFile(path.join(blogDir, `${finalSlug}.md`), fullContent, 'utf-8')

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
