import { verifySession } from '../../../lib/auth-cloudflare'

export async function onRequest(context) {
  const { request, env, params } = context

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  const session = await verifySession(request, env)
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { id: slug } = params
  const method = request.method
  const { GITHUB_TOKEN, GITHUB_REPO_OWNER, GITHUB_REPO_NAME } = env

  try {
    // GET /functions/api/posts/[id] - 获取单篇文章
    if (method === 'GET') {
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/src/content/blog/${slug}.md`,
        {
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'User-Agent': 'OpenClaude-Admin',
            'Accept': 'application/vnd.github.v3.raw',
          },
        }
      )

      if (!response.ok) {
        if (response.status === 404) {
          return new Response(JSON.stringify({ error: 'Post not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        throw new Error('Failed to fetch post')
      }

      const content = await response.text()
      const { frontmatter, markdown } = parseMarkdown(content)

      return new Response(JSON.stringify({
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
      }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // PUT /functions/api/posts/[id] - 更新文章
    if (method === 'PUT') {
      const body = await request.json()
      const { title, description, content, author, tags, category, draft, featured, image, sha, newSlug } = body

      if (!sha) {
        return new Response(JSON.stringify({ error: 'SHA is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }

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
      const contentBase64 = btoa(unescape(encodeURIComponent(fullContent)))

      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/src/content/blog/${targetSlug}.md`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'User-Agent': 'OpenClaude-Admin',
            'Content-Type': 'application/vnd.github.v3+json',
          },
          body: JSON.stringify({
            message: `Update blog post: ${title}`,
            content: contentBase64,
            sha,
          }),
        }
      )

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Failed to update post: ${error}`)
      }

      return new Response(JSON.stringify({ success: true, slug: targetSlug }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // DELETE /functions/api/posts/[id] - 删除文章
    if (method === 'DELETE') {
      const body = await request.json()
      const { sha } = body

      if (!sha) {
        return new Response(JSON.stringify({ error: 'SHA is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/src/content/blog/${slug}.md`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'User-Agent': 'OpenClaude-Admin',
            'Content-Type': 'application/vnd.github.v3+json',
          },
          body: JSON.stringify({
            message: `Delete blog post: ${slug}`,
            sha,
          }),
        }
      )

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Failed to delete post: ${error}`)
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response('Method not allowed', { status: 405 })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

function parseMarkdown(content) {
  const frontmatterRegex = /^---\n([\s\S]+?)\n---\n([\s\S]*)$/
  const match = content.match(frontmatterRegex)

  if (!match) {
    return { frontmatter: {}, markdown: content }
  }

  const frontmatterLines = match[1].split('\n')
  const frontmatter = {}

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
        value = value.slice(1, -1).split(',').map(v => v.trim().replace(/['"]/g, '')).filter(v => v)
      }

      frontmatter[key] = value
    }
  }

  return { frontmatter, markdown: match[2] }
}

function generateFrontmatter(post) {
  const tags = (post.tags || []).map(t => `'${t}'`).join(', ')
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
