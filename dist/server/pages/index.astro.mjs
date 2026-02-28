import { c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead, f as addAttribute } from '../chunks/astro/server_CJXfXb6l.mjs';
import 'piccolore';
import { $ as $$Layout } from '../chunks/Layout_DNplPzMT.mjs';
import { g as getCollection } from '../chunks/_astro_content_Cjof-IU3.mjs';
import { $ as $$TutorialCard } from '../chunks/TutorialCard_EeTDY2xa.mjs';
import { $ as $$BlogCard } from '../chunks/BlogCard_DnmbTWGj.mjs';
export { renderers } from '../renderers.mjs';

const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const zhTutorials = await getCollection("tutorial", ({ data }) => data.draft !== true);
  const latestTutorials = [...zhTutorials].sort((a, b) => (b.data.date?.getTime() || 0) - (a.data.date?.getTime() || 0)).slice(0, 6);
  const blogPosts = await getCollection("blog", ({ data }) => data.draft !== true);
  const latestBlogs = [...blogPosts].sort((a, b) => b.data.date.getTime() - a.data.date.getTime()).slice(0, 3);
  const features = [
    {
      icon: "\u{1F4DA}",
      title: "\u7CFB\u7EDF\u6559\u7A0B",
      description: "\u4ECE\u5165\u95E8\u5230\u7CBE\u901A\uFF0C\u5168\u9762\u638C\u63E1 Claude AI \u7684\u4F7F\u7528\u6280\u5DE7",
      link: "/tutorial/"
    },
    {
      icon: "\u{1F4DD}",
      title: "\u535A\u5BA2\u6587\u7AE0",
      description: "\u6DF1\u5EA6\u6280\u672F\u6587\u7AE0\u548C\u4EA7\u54C1\u66F4\u65B0\u5206\u4EAB",
      link: "/blog/"
    },
    {
      icon: "\u{1F4AC}",
      title: "\u4E92\u52A8\u8BA8\u8BBA",
      description: "\u4E0E\u5176\u4ED6\u5F00\u53D1\u8005\u4EA4\u6D41\u5FC3\u5F97\uFF0C\u5171\u540C\u6210\u957F",
      link: "https://github.com/openclaude"
    }
  ];
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, {}, { "default": async ($$result2) => renderTemplate`  ${maybeRenderHead()}<section class="bg-claude-warm"> <div class="max-w-6xl mx-auto px-4 py-20 md:py-32"> <div class="text-center"> <h1 class="text-4xl md:text-6xl font-bold mb-6 text-claude-text">
OpenClaude
</h1> <p class="text-xl md:text-2xl text-claude-text-light max-w-2xl mx-auto">
Claude AI 教程与分享社区
</p> <p class="mt-4 text-claude-text-light">
探索 Claude 的无限可能，学习最佳实践，分享你的创意
</p> <div class="mt-8 flex justify-center gap-4"> <a href="/tutorial/" class="btn-primary">
开始学习
</a> <a href="https://github.com/openclaude" target="_blank" class="btn-secondary">
GitHub
</a> </div> </div> </div> </section>  <section class="py-16 md:py-24"> <div class="max-w-6xl mx-auto px-4"> <div class="grid md:grid-cols-3 gap-8"> ${features.map((feature) => renderTemplate`<a${addAttribute(feature.link, "href")} class="card text-center block hover:scale-105 transition-transform"> <div class="text-4xl mb-4">${feature.icon}</div> <h3 class="text-xl font-semibold mb-2">${feature.title}</h3> <p class="text-claude-text-light">${feature.description}</p> </a>`)} </div> </div> </section>  <section class="py-16 md:py-24 bg-claude-warm"> <div class="max-w-6xl mx-auto px-4"> <div class="text-center mb-12"> <h2 class="text-3xl md:text-4xl font-bold mb-4">最新教程</h2> <p class="text-claude-text-light">探索最新的 Claude 教程和指南</p> </div> <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6"> ${latestTutorials.map((tutorial) => renderTemplate`${renderComponent($$result2, "TutorialCard", $$TutorialCard, { "title": tutorial.data.title, "description": tutorial.data.description, "difficulty": tutorial.data.difficulty, "tags": tutorial.data.tags, "slug": tutorial.slug, "lang": "zh" })}`)} </div> <div class="text-center mt-12"> <a href="/tutorial/" class="btn-secondary">
查看全部教程 →
</a> </div> </div> </section>  <section class="py-16 md:py-24"> <div class="max-w-6xl mx-auto px-4"> <div class="text-center mb-12"> <h2 class="text-3xl md:text-4xl font-bold mb-4">最新博客</h2> <p class="text-claude-text-light">阅读最新的技术文章和见解</p> </div> <div class="grid md:grid-cols-3 gap-6"> ${latestBlogs.map((post) => renderTemplate`${renderComponent($$result2, "BlogCard", $$BlogCard, { "title": post.data.title, "description": post.data.description, "date": post.data.date, "author": post.data.author, "tags": post.data.tags, "category": post.data.category, "slug": post.slug, "featured": post.data.featured })}`)} </div> <div class="text-center mt-12"> <a href="/blog/" class="btn-secondary">
查看全部文章 →
</a> </div> </div> </section>  <section class="py-16 md:py-24"> <div class="max-w-4xl mx-auto px-4 text-center"> <h2 class="text-3xl md:text-4xl font-bold mb-6">加入我们的社区</h2> <p class="text-xl text-claude-text-light mb-8">
在 GitHub 上贡献内容，或在 X 上关注我们获取最新动态
</p> <div class="flex justify-center gap-4"> <a href="https://github.com/openclaude" target="_blank" rel="noopener noreferrer" class="btn-primary">
GitHub
</a> <a href="https://x.com/openclaude" target="_blank" rel="noopener noreferrer" class="btn-secondary">
X (Twitter)
</a> </div> </div> </section> ` })}`;
}, "/Users/macadmin/Dev/openclaude/src/pages/index.astro", void 0);

const $$file = "/Users/macadmin/Dev/openclaude/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
