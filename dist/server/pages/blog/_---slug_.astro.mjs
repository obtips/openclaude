import { b as createAstro, c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead, f as addAttribute, e as renderSlot } from '../../chunks/astro/server_CJXfXb6l.mjs';
import 'piccolore';
import { g as getCollection } from '../../chunks/_astro_content_Cjof-IU3.mjs';
import { $ as $$Layout } from '../../chunks/Layout_DNplPzMT.mjs';
import { $ as $$Giscus } from '../../chunks/Giscus_CRK8lmma.mjs';
/* empty css                                     */
export { renderers } from '../../renderers.mjs';

const $$Astro$1 = createAstro("https://openclau.de");
const $$BlogLayout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$BlogLayout;
  const {
    title,
    description,
    date,
    author = "OpenClaude Team",
    tags = [],
    category = "\u6280\u672F",
    image
  } = Astro2.props;
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": title, "description": description, "data-astro-cid-4dqtj3le": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<article class="max-w-3xl mx-auto px-4 py-12" data-astro-cid-4dqtj3le> <!-- 文章头部 --> <header class="mb-10" data-astro-cid-4dqtj3le> <!-- 分类 --> <div class="mb-4" data-astro-cid-4dqtj3le> <span class="text-xs px-3 py-1 rounded-full bg-claude-accent text-white" data-astro-cid-4dqtj3le> ${category} </span> </div> <!-- 标题 --> <h1 class="text-4xl md:text-5xl font-bold mb-6" data-astro-cid-4dqtj3le> ${title} </h1> <!-- 描述 --> <p class="text-xl text-claude-text-light mb-6" data-astro-cid-4dqtj3le> ${description} </p> <!-- 封面图 --> ${image && renderTemplate`<div class="mb-6 rounded-xl overflow-hidden shadow-soft" data-astro-cid-4dqtj3le> <img${addAttribute(image, "src")}${addAttribute(title, "alt")} class="w-full" data-astro-cid-4dqtj3le> </div>`} <!-- 元信息 --> <div class="flex items-center gap-4 text-claude-text-light" data-astro-cid-4dqtj3le> <span class="font-medium" data-astro-cid-4dqtj3le>${author}</span> <span data-astro-cid-4dqtj3le>·</span> <time${addAttribute(date?.toISOString(), "datetime")} data-astro-cid-4dqtj3le> ${date?.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric"
  })} </time> </div> <!-- 标签 --> ${tags && tags.length > 0 && renderTemplate`<div class="flex flex-wrap gap-2 mt-4" data-astro-cid-4dqtj3le> ${tags.map((tag) => renderTemplate`<span class="text-sm px-3 py-1 rounded-full bg-claude-warm text-claude-text-light" data-astro-cid-4dqtj3le>
#${tag} </span>`)} </div>`} </header> <!-- 文章正文 --> <div class="prose prose-lg max-w-none" data-astro-cid-4dqtj3le> ${renderSlot($$result2, $$slots["default"])} </div> <!-- 文章底部 --> <footer class="mt-12 pt-8 border-t border-claude-border" data-astro-cid-4dqtj3le> <div class="text-center text-claude-text-light" data-astro-cid-4dqtj3le> <p data-astro-cid-4dqtj3le>
感谢阅读！欢迎在下方留言讨论
</p> </div> </footer> <!-- 评论区 --> <div class="mt-12" data-astro-cid-4dqtj3le> ${renderComponent($$result2, "Giscus", $$Giscus, { "data-astro-cid-4dqtj3le": true })} </div> </article>  <div class="max-w-3xl mx-auto px-4 pb-12" data-astro-cid-4dqtj3le> <a href="/blog/" class="inline-flex items-center gap-2 text-claude-accent hover:underline" data-astro-cid-4dqtj3le> <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-astro-cid-4dqtj3le> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" data-astro-cid-4dqtj3le></path> </svg>
返回博客列表
</a> </div> ` })} `;
}, "/Users/macadmin/Dev/openclaude/src/layouts/BlogLayout.astro", void 0);

const $$Astro = createAstro("https://openclau.de");
async function getStaticPaths() {
  const posts = await getCollection("blog");
  return posts.map((entry) => ({
    params: { slug: entry.slug },
    props: { entry }
  }));
}
const $$ = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$;
  const { entry } = Astro2.props;
  const { Content } = await entry.render();
  const title = entry.data.title;
  const description = entry.data.description;
  return renderTemplate`${renderComponent($$result, "BlogLayout", $$BlogLayout, { "title": title, "description": description, "date": entry.data.date, "author": entry.data.author, "tags": entry.data.tags, "category": entry.data.category, "image": entry.data.image }, { "default": async ($$result2) => renderTemplate` ${renderComponent($$result2, "Content", Content, {})} ` })}`;
}, "/Users/macadmin/Dev/openclaude/src/pages/blog/[...slug].astro", void 0);

const $$file = "/Users/macadmin/Dev/openclaude/src/pages/blog/[...slug].astro";
const $$url = "/blog/[...slug]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$,
  file: $$file,
  getStaticPaths,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
