import { c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead, f as addAttribute } from '../chunks/astro/server_CJXfXb6l.mjs';
import 'piccolore';
import { $ as $$Layout } from '../chunks/Layout_DNplPzMT.mjs';
import { g as getCollection } from '../chunks/_astro_content_Cjof-IU3.mjs';
import { $ as $$TutorialCard } from '../chunks/TutorialCard_EeTDY2xa.mjs';
export { renderers } from '../renderers.mjs';

const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const allTutorials = await getCollection("tutorial", ({ data }) => data.draft !== true);
  const byDifficulty = allTutorials.reduce((acc, tutorial) => {
    const diff = tutorial.data.difficulty || "beginner";
    if (!acc[diff]) acc[diff] = [];
    acc[diff].push(tutorial);
    return acc;
  }, {});
  const difficultyOrder = ["beginner", "intermediate", "advanced"];
  const difficultyLabels = {
    beginner: "\u5165\u95E8\u6559\u7A0B",
    intermediate: "\u8FDB\u9636\u6559\u7A0B",
    advanced: "\u9AD8\u7EA7\u6559\u7A0B"
  };
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "\u6559\u7A0B\u5217\u8868 - OpenClaude", "description": "\u6D4F\u89C8\u6240\u6709 Claude AI \u6559\u7A0B" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="max-w-6xl mx-auto px-4 py-12"> <div class="text-center mb-12"> <h1 class="text-4xl md:text-5xl font-bold mb-4">Claude 教程</h1> <p class="text-xl text-claude-text-light">
系统学习 Claude AI 的使用技巧和最佳实践
</p> </div> ${difficultyOrder.map((difficulty) => {
    const items = byDifficulty[difficulty];
    if (!items || items.length === 0) return null;
    return renderTemplate`<section class="mb-16"> <h2 class="text-2xl font-bold mb-6 flex items-center gap-2"> <span${addAttribute(`w-3 h-3 rounded-full ${difficulty === "beginner" ? "bg-green-400" : difficulty === "intermediate" ? "bg-yellow-400" : "bg-red-400"}`, "class")}></span> ${difficultyLabels[difficulty]} </h2> <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6"> ${items.map((tutorial) => renderTemplate`${renderComponent($$result2, "TutorialCard", $$TutorialCard, { "title": tutorial.data.title, "description": tutorial.data.description, "difficulty": tutorial.data.difficulty, "tags": tutorial.data.tags, "slug": tutorial.slug, "lang": "zh" })}`)} </div> </section>`;
  })} </div> ` })}`;
}, "/Users/macadmin/Dev/openclaude/src/pages/tutorial/index.astro", void 0);

const $$file = "/Users/macadmin/Dev/openclaude/src/pages/tutorial/index.astro";
const $$url = "/tutorial";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
