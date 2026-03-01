import { defineCollection, z } from 'astro:content'

const tutorialSchema = z.object({
  title: z.string(),
  description: z.string(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
  date: z.coerce.date().optional(),
  author: z.string().optional(),
})

const tutorial = defineCollection({
  schema: tutorialSchema,
})

// 博客文章 Schema
const blogSchema = z.object({
  title: z.string(),
  description: z.string(),
  date: z.coerce.date(),
  author: z.string().default('OpenClaude Team'),
  tags: z.array(z.string()).default([]),
  category: z.string().default('技术'),
  draft: z.boolean().default(false),
  featured: z.boolean().default(false),
  image: z.string().optional(),
})

const blog = defineCollection({
  schema: blogSchema,
})

const tutorialEn = defineCollection({
  schema: tutorialSchema,
})

const pageSchema = z.object({
  title: z.string(),
  description: z.string(),
  date: z.coerce.date().optional(),
})

const pages = defineCollection({
  schema: pageSchema,
})

const blogEn = defineCollection({
  schema: blogSchema,
})

const pagesEn = defineCollection({
  schema: pageSchema,
})

export const collections = {
  blog,
  'blog-en': blogEn,
  tutorial,
  'tutorial-en': tutorialEn,
  pages,
  'pages-en': pagesEn,
}
