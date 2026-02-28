import { Octokit } from '@octokit/rest'

// 博客文章 frontmatter 类型
export interface BlogPost {
  title: string
  description: string
  date: string
  author: string
  tags: string[]
  category: string
  draft?: boolean
  featured?: boolean
  image?: string
}

export interface BlogPostWithContent extends BlogPost {
  slug: string
  content: string
  sha?: string // GitHub 文件 SHA，用于更新
}

// Base64 编解码辅助函数（浏览器和服务器端兼容）
function base64Encode(str: string): string {
  // 浏览器环境
  if (typeof window !== 'undefined' && typeof btoa !== 'undefined') {
    // 处理 UTF-8 字符串
    const encoder = new TextEncoder()
    const bytes = encoder.encode(str)
    let binary = ''
    bytes.forEach(b => binary += String.fromCharCode(b))
    return btoa(binary)
  }
  // Node.js 环境
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'utf-8').toString('base64')
  }
  throw new Error('No base64 encoding available')
}

function base64Decode(str: string): string {
  // 浏览器环境
  if (typeof window !== 'undefined' && typeof atob !== 'undefined') {
    const binary = atob(str)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    const decoder = new TextDecoder()
    return decoder.decode(bytes)
  }
  // Node.js 环境
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'base64').toString('utf-8')
  }
  throw new Error('No base64 decoding available')
}

// 从文件名解析 slug
function getSlugFromPath(path: string): string {
  const match = path.match(/src\/content\/blog\/(.+)\.md/)
  return match ? match[1] : ''
}

// 解析 frontmatter
function parseFrontmatter(content: string): { frontmatter: BlogPost, content: string } {
  const frontmatterRegex = /^---\n([\s\S]+?)\n---\n([\s\S]*)$/
  const match = content.match(frontmatterRegex)

  if (!match) {
    return {
      frontmatter: {
        title: '',
        description: '',
        date: new Date().toISOString(),
        author: 'OpenClaude Team',
        tags: [],
        category: '技术',
        draft: false,
        featured: false,
      },
      content,
    }
  }

  // 简单解析 YAML frontmatter
  const frontmatterLines = match[1].split('\n')
  const frontmatter: any = {}

  for (const line of frontmatterLines) {
    const colonIndex = line.indexOf(':')
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim()
      let value: any = line.slice(colonIndex + 1).trim()

      // 处理引号包裹的字符串
      if (value.startsWith("'") && value.endsWith("'")) {
        value = value.slice(1, -1)
      } else if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1)
      }
      // 处理布尔值
      else if (value === 'true') {
        value = true
      } else if (value === 'false') {
        value = false
      }
      // 处理数组
      else if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map((v: string) => v.trim().replace(/['"]/g, '')).filter((v: string) => v)
      }

      frontmatter[key] = value
    }
  }

  return {
    frontmatter: frontmatter as BlogPost,
    content: match[2],
  }
}

// 生成 frontmatter
function generateFrontmatter(post: BlogPost): string {
  const tags = post.tags.map(t => `'${t}'`).join(', ')
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

// GitHub API 客户端
export function createGitHubClient(token: string) {
  return new Octokit({
    auth: token,
  })
}

// 获取所有博客文章
export async function getAllPosts(token: string, owner: string, repo: string): Promise<BlogPostWithContent[]> {
  const octokit = createGitHubClient(token)

  try {
    const response = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: 'src/content/blog',
    })

    const data = response.data
    if (!Array.isArray(data)) {
      return []
    }

    const posts: BlogPostWithContent[] = []

    for (const file of data) {
      if (file.type !== 'file' || !file.name.endsWith('.md')) continue

      try {
        const fileResponse = await octokit.rest.repos.getContent({
          owner,
          repo,
          path: file.path!,
        })

        const fileData = fileResponse.data
        if ('content' in fileData && fileData.content) {
          const content = base64Decode(fileData.content)
          const { frontmatter, content: markdown } = parseFrontmatter(content)

          posts.push({
            ...frontmatter,
            slug: getSlugFromPath(file.path!),
            content: markdown,
            sha: fileData.sha,
          })
        }
      } catch (err) {
        console.error(`Error reading file ${file.path}:`, err)
      }
    }

    return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  } catch (error) {
    console.error('Error fetching posts:', error)
    return []
  }
}

// 获取单篇文章
export async function getPost(token: string, owner: string, repo: string, slug: string): Promise<BlogPostWithContent | null> {
  const octokit = createGitHubClient(token)

  try {
    const response = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: `src/content/blog/${slug}.md`,
    })

    const data = response.data
    if ('content' in data && data.content) {
      const content = base64Decode(data.content)
      const { frontmatter, content: markdown } = parseFrontmatter(content)

      return {
        ...frontmatter,
        slug,
        content: markdown,
        sha: data.sha,
      }
    }

    return null
  } catch (error) {
    console.error('Error fetching post:', error)
    return null
  }
}

// 创建文章
export async function createPost(
  token: string,
  owner: string,
  repo: string,
  slug: string,
  post: BlogPost,
  content: string
): Promise<boolean> {
  const octokit = createGitHubClient(token)

  try {
    const fullContent = generateFrontmatter(post) + content

    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: `src/content/blog/${slug}.md`,
      message: `Create blog post: ${post.title}`,
      content: base64Encode(fullContent),
    })

    return true
  } catch (error) {
    console.error('Error creating post:', error)
    return false
  }
}

// 更新文章
export async function updatePost(
  token: string,
  owner: string,
  repo: string,
  slug: string,
  post: BlogPost,
  content: string,
  sha: string
): Promise<boolean> {
  const octokit = createGitHubClient(token)

  try {
    const fullContent = generateFrontmatter(post) + content

    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: `src/content/blog/${slug}.md`,
      message: `Update blog post: ${post.title}`,
      content: base64Encode(fullContent),
      sha,
    })

    return true
  } catch (error) {
    console.error('Error updating post:', error)
    return false
  }
}

// 删除文章
export async function deletePost(
  token: string,
  owner: string,
  repo: string,
  slug: string,
  sha: string
): Promise<boolean> {
  const octokit = createGitHubClient(token)

  try {
    await octokit.rest.repos.deleteFile({
      owner,
      repo,
      path: `src/content/blog/${slug}.md`,
      message: `Delete blog post: ${slug}`,
      sha,
    })

    return true
  } catch (error) {
    console.error('Error deleting post:', error)
    return false
  }
}

// 生成 slug（从标题）
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
