import { useState } from 'react'

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
}

interface PostListProps {
  posts: BlogPost[]
  onEdit: (slug: string) => void
  onNew: () => void
  onDelete: (slug: string, sha: string) => Promise<void>
  loading?: boolean
}

export default function PostList({ posts, onEdit, onNew, onDelete, loading }: PostListProps) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('全部')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const categories = ['全部', ...Array.from(new Set(posts.map(p => p.category)))]

  const filteredPosts = posts.filter(post => {
    const matchesSearch =
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.description.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === '全部' || post.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const handleDelete = async (slug: string, sha: string) => {
    if (deleteConfirm === slug) {
      await onDelete(slug, sha)
      setDeleteConfirm(null)
    } else {
      setDeleteConfirm(slug)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">文章管理</h1>
        <button
          onClick={onNew}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          新建文章
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex gap-4">
        <input
          type="text"
          placeholder="搜索文章..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Post List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {posts.length === 0 ? '暂无文章，点击上方按钮创建第一篇文章' : '没有匹配的文章'}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  文章
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  分类
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  日期
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPosts.map((post) => (
                <tr key={post.slug} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">{post.title}</span>
                      <span className="text-sm text-gray-500 truncate max-w-md">{post.description}</span>
                      <span className="text-xs text-gray-400 mt-1">/{post.slug}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                      {post.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-1">
                      {post.draft && (
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                          草稿
                        </span>
                      )}
                      {post.featured && (
                        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">
                          精选
                        </span>
                      )}
                      {!post.draft && (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                          已发布
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(post.date).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button
                      onClick={() => onEdit(post.slug)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => post.sha && handleDelete(post.slug, post.sha)}
                      className={
                        deleteConfirm === post.slug
                          ? 'text-red-600 hover:text-red-800'
                          : 'text-gray-600 hover:text-gray-800'
                      }
                    >
                      {deleteConfirm === post.slug ? '确认删除?' : '删除'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
