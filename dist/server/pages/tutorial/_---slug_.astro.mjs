import { b as createAstro, c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead, f as addAttribute } from '../../chunks/astro/server_CJXfXb6l.mjs';
import 'piccolore';
import { g as getCollection } from '../../chunks/_astro_content_Cjof-IU3.mjs';
import { $ as $$Tutorial } from '../../chunks/Tutorial_B5nHBVtT.mjs';
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro("https://openclau.de");
async function getStaticPaths() {
  const tutorials = await getCollection("tutorial");
  return tutorials.map((entry) => ({
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
  return renderTemplate`${renderComponent($$result, "TutorialLayout", $$Tutorial, { "title": title, "description": description, "lang": "zh" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="mb-8"> <div class="flex items-center gap-2 mb-4"> <span${addAttribute(`text-xs px-2 py-1 rounded-full ${entry.data.difficulty === "beginner" ? "bg-green-100 text-green-700" : entry.data.difficulty === "intermediate" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`, "class")}> ${entry.data.difficulty === "beginner" ? "\u5165\u95E8" : entry.data.difficulty === "intermediate" ? "\u8FDB\u9636" : "\u9AD8\u7EA7"} </span> ${entry.data.date && renderTemplate`<span class="text-sm text-claude-text-light"> ${entry.data.date.toLocaleDateString("zh-CN")} </span>`} </div> <h1 class="text-3xl md:text-4xl font-bold mb-4">${title}</h1> <p class="text-lg text-claude-text-light">${description}</p> ${entry.data.tags && entry.data.tags.length > 0 && renderTemplate`<div class="flex gap-2 mt-4"> ${entry.data.tags.map((tag) => renderTemplate`<span class="text-sm px-2 py-1 rounded bg-claude-warm text-claude-text-light">
#${tag} </span>`)} </div>`} </div> ${renderComponent($$result2, "Content", Content, {})} ` })}`;
}, "/Users/macadmin/Dev/openclaude/src/pages/tutorial/[...slug].astro", void 0);

const $$file = "/Users/macadmin/Dev/openclaude/src/pages/tutorial/[...slug].astro";
const $$url = "/tutorial/[...slug]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$,
  file: $$file,
  getStaticPaths,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
