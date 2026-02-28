import React from 'react'
import { createRoot } from 'react-dom/client'
import Login from '../components/admin/Login'
import PostList from '../components/admin/PostList'
import PostEditor from '../components/admin/PostEditor'

interface BlogPost {
  slug: string
  title: string
  description: string
  date: string
  author: string
  tags: string[]
  category: string
  draft?: boolean
  featured?: boolean
  sha?: string
  content: string
}

interface AppState {
  view: 'login' | 'list' | 'new' | 'edit'
  posts: BlogPost[]
  error: string
  currentPost?: BlogPost
  token: string
  owner: string
  repo: string
}

const initialState: AppState = {
  view: 'login',
  posts: [],
  error: '',
  token: '',
  owner: '',
  repo: '',
}

function AdminApp() {
  const [state, setState] = React.useState<AppState>(initialState)

  // 从 sessionStorage 恢复登录状态
  React.useEffect(() => {
    const token = sessionStorage.getItem('github_token')
    const owner = sessionStorage.getItem('github_owner')
    const repo = sessionStorage.getItem('github_repo')

    if (token && owner && repo) {
      loadPosts(token, owner, repo)
    }
  }, [])

  const loadPosts = async (token: string, owner: string, repo: string) => {
    try {
      const response = await fetch('/api/github/posts', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-GitHub-Owner': owner,
          'X-GitHub-Repo': repo,
        },
      })

      if (response.ok) {
        const posts = await response.json()
        setState({
          view: 'list',
          posts,
          error: '',
          token,
          owner,
          repo,
        })
      } else {
        setState({
          ...initialState,
          error: '登录失效，请重新登录',
        })
      }
    } catch (e) {
      setState({
        ...initialState,
        error: '无法连接到服务器',
      })
    }
  }

  const handleLogin = async (token: string, owner: string, repo: string) => {
    await loadPosts(token, owner, repo)
  }

  const handleNew = () => {
    setState({
      ...state,
      view: 'new',
      currentPost: undefined,
    })
  }

  const handleEdit = async (slug: string) => {
    try {
      const response = await fetch(`/api/github/posts/${slug}`, {
        headers: {
          'Authorization': `Bearer ${state.token}`,
          'X-GitHub-Owner': state.owner,
          'X-GitHub-Repo': state.repo,
        },
      })

      if (response.ok) {
        const post = await response.json()
        setState({
          ...state,
          view: 'edit',
          currentPost: post,
        })
      } else {
        setState({ ...state, error: '加载文章失败' })
      }
    } catch (e) {
      setState({ ...state, error: '加载文章失败' })
    }
  }

  const handleSave = async (post: any, sha?: string) => {
    const isNew = state.view === 'new'

    try {
      const slug = isNew
        ? post.newSlug || undefined
        : state.currentPost?.slug

      const url = isNew
        ? '/api/github/posts'
        : `/api/github/posts/${slug}`

      const response = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: {
          'Authorization': `Bearer ${state.token}`,
          'X-GitHub-Owner': state.owner,
          'X-GitHub-Repo': state.repo,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...post, sha: sha || state.currentPost?.sha }),
      })

      if (response.ok) {
        await loadPosts(state.token, state.owner, state.repo)
        return true
      } else {
        setState({ ...state, error: '保存失败' })
        return false
      }
    } catch (e) {
      setState({ ...state, error: '保存失败' })
      return false
    }
  }

  const handleDelete = async (slug: string, sha: string) => {
    try {
      const response = await fetch(`/api/github/posts/${slug}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${state.token}`,
          'X-GitHub-Owner': state.owner,
          'X-GitHub-Repo': state.repo,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sha }),
      })

      if (response.ok) {
        setState({
          ...state,
          posts: state.posts.filter(p => p.slug !== slug),
        })
      } else {
        setState({ ...state, error: '删除失败' })
      }
    } catch (e) {
      setState({ ...state, error: '删除失败' })
    }
  }

  const handleCancel = () => {
    setState({ ...state, view: 'list' })
  }

  if (state.view === 'login') {
    return React.createElement(Login, {
      onLogin: handleLogin,
      error: state.error,
    })
  }

  if (state.view === 'list') {
    return React.createElement(PostList, {
      posts: state.posts,
      onNew: handleNew,
      onEdit: handleEdit,
      onDelete: handleDelete,
    })
  }

  return React.createElement(PostEditor, {
    initialPost: state.currentPost,
    isNew: state.view === 'new',
    onSave: handleSave,
    onCancel: handleCancel,
  })
}

export function mountAdminApp(containerId: string) {
  const container = document.getElementById(containerId)
  if (container) {
    const root = createRoot(container)
    root.render(React.createElement(AdminApp))
  }
}
