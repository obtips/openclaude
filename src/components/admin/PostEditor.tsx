import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface BlogPost {
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

interface PostEditorProps {
  initialPost?: BlogPost & { content: string; slug: string; sha?: string }
  onSave: (post: BlogPost & { content: string; newSlug?: string }, sha?: string) => Promise<boolean>
  onCancel: () => void
  isNew?: boolean
}

export default function PostEditor({ initialPost, onSave, onCancel, isNew = false }: PostEditorProps) {
  const [title, setTitle] = useState(initialPost?.title || '')
  const [description, setDescription] = useState(initialPost?.description || '')
  const [content, setContent] = useState(initialPost?.content || '')
  const [author, setAuthor] = useState(initialPost?.author || 'OpenClaude Team')
  const [tags, setTags] = useState(initialPost?.tags?.join(', ') || '')
  const [category, setCategory] = useState(initialPost?.category || '技术')
  const [draft, setDraft] = useState(initialPost?.draft || false)
  const [featured, setFeatured] = useState(initialPost?.featured || false)
  const [image, setImage] = useState(initialPost?.image || '')
  const [slug, setSlug] = useState(initialPost?.slug || '')
  const [preview, setPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const categories = ['技术', '公告', '教程', '产品', '社区']

  const handleSave = async () => {
    if (!title.trim() || !description.trim()) {
      setError('标题和描述不能为空')
      return
    }

    setSaving(true)
    setError('')

    const post: BlogPost & { content: string; newSlug?: string } = {
      title,
      description,
      date: initialPost?.date || new Date().toISOString(),
      content,
      author,
      tags: tags.split(',').map(t => t.trim()).filter(t => t),
      category,
      draft,
      featured,
      image: image || undefined,
    }

    if (isNew && slug) {
      post.newSlug = slug
    } else if (!isNew && slug !== initialPost?.slug) {
      post.newSlug = slug
    }

    const success = await onSave(post, initialPost?.sha)

    if (!success) {
      setError('保存失败，请重试')
    }

    setSaving(false)
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{isNew ? '新建文章' : '编辑文章'}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setPreview(!preview)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {preview ? '编辑' : '预览'}
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      {preview ? (
        <div className="bg-white rounded-lg shadow-sm p-8 prose max-w-none">
          <h1>{title}</h1>
          <p className="text-xl text-gray-600">{description}</p>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL Slug <span className="text-gray-400">(留空自动生成)</span>
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="your-post-slug"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="文章标题"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                描述 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="简短描述文章内容"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                作者
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  分类
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  标签 <span className="text-gray-400">(逗号分隔)</span>
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="React, JavaScript, 教程"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                封面图 URL
              </label>
              <input
                type="text"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={draft}
                  onChange={(e) => setDraft(e.target.checked)}
                  className="mr-2"
                />
                草稿（不发布）
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="mr-2"
                />
                精选文章
              </label>
            </div>
          </div>

          {/* Content Editor */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              文章内容 (Markdown)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="# 开始写作...&#10;&#10;支持 **Markdown** 语法"
              rows={20}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            />
          </div>
        </div>
      )}
    </div>
  )
}
