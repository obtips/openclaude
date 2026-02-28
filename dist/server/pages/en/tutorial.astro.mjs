import { c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead, f as addAttribute } from '../../chunks/astro/server_CJXfXb6l.mjs';
import 'piccolore';
import { $ as $$Layout } from '../../chunks/Layout_DNplPzMT.mjs';
import { g as getCollection } from '../../chunks/_astro_content_Cjof-IU3.mjs';
import { $ as $$TutorialCard } from '../../chunks/TutorialCard_EeTDY2xa.mjs';
export { renderers } from '../../renderers.mjs';

const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const allTutorials = await getCollection("tutorial-en", ({ data }) => data.draft !== true);
  const byDifficulty = allTutorials.reduce((acc, tutorial) => {
    const diff = tutorial.data.difficulty || "beginner";
    if (!acc[diff]) acc[diff] = [];
    acc[diff].push(tutorial);
    return acc;
  }, {});
  const difficultyOrder = ["beginner", "intermediate", "advanced"];
  const difficultyLabels = {
    beginner: "Beginner Tutorials",
    intermediate: "Intermediate Tutorials",
    advanced: "Advanced Tutorials"
  };
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Tutorials - OpenClaude", "description": "Browse all Claude AI tutorials", "lang": "en" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="max-w-6xl mx-auto px-4 py-12"> <div class="text-center mb-12"> <h1 class="text-4xl md:text-5xl font-bold mb-4">Claude Tutorials</h1> <p class="text-xl text-claude-text-light">
Systematically learn Claude AI techniques and best practices
</p> </div> ${difficultyOrder.map((difficulty) => {
    const items = byDifficulty[difficulty];
    if (!items || items.length === 0) return null;
    return renderTemplate`<section class="mb-16"> <h2 class="text-2xl font-bold mb-6 flex items-center gap-2"> <span${addAttribute(`w-3 h-3 rounded-full ${difficulty === "beginner" ? "bg-green-400" : difficulty === "intermediate" ? "bg-yellow-400" : "bg-red-400"}`, "class")}></span> ${difficultyLabels[difficulty]} </h2> <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6"> ${items.map((tutorial) => renderTemplate`${renderComponent($$result2, "TutorialCard", $$TutorialCard, { "title": tutorial.data.title, "description": tutorial.data.description, "difficulty": tutorial.data.difficulty, "tags": tutorial.data.tags, "slug": tutorial.slug, "lang": "en" })}`)} </div> </section>`;
  })} </div> ` })}`;
}, "/Users/macadmin/Dev/openclaude/src/pages/en/tutorial/index.astro", void 0);

const $$file = "/Users/macadmin/Dev/openclaude/src/pages/en/tutorial/index.astro";
const $$url = "/en/tutorial";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
