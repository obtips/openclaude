import { c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_CJXfXb6l.mjs';
import 'piccolore';
import { $ as $$Layout } from '../chunks/Layout_DNplPzMT.mjs';
import { g as getCollection } from '../chunks/_astro_content_Cjof-IU3.mjs';
import { $ as $$TutorialCard } from '../chunks/TutorialCard_EeTDY2xa.mjs';
export { renderers } from '../renderers.mjs';

const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const enTutorials = await getCollection("tutorial-en", ({ data }) => data.draft !== true);
  const latestTutorials = [...enTutorials].sort((a, b) => (b.data.date?.getTime() || 0) - (a.data.date?.getTime() || 0)).slice(0, 6);
  const features = [
    {
      icon: "\u{1F4DA}",
      title: "Systematic Tutorials",
      description: "Master Claude AI from basics to advanced techniques"
    },
    {
      icon: "\u{1F680}",
      title: "Best Practices",
      description: "Real-world experiences and workflows from the community"
    },
    {
      icon: "\u{1F4AC}",
      title: "Interactive Discussions",
      description: "Connect with other developers and grow together"
    }
  ];
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "OpenClaude - Claude Tutorials & Community", "description": "Explore the infinite possibilities of Claude, learn best practices, and share your creativity", "lang": "en" }, { "default": async ($$result2) => renderTemplate`  ${maybeRenderHead()}<section class="bg-claude-warm"> <div class="max-w-6xl mx-auto px-4 py-20 md:py-32"> <div class="text-center"> <h1 class="text-4xl md:text-6xl font-bold mb-6 text-claude-text">
OpenClaude
</h1> <p class="text-xl md:text-2xl text-claude-text-light max-w-2xl mx-auto">
Claude AI Tutorials & Community
</p> <p class="mt-4 text-claude-text-light">
Explore the infinite possibilities of Claude, learn best practices, and share your creativity
</p> <div class="mt-8 flex justify-center gap-4"> <a href="/en/tutorial/" class="btn-primary">
Get Started
</a> <a href="https://github.com/openclaude" target="_blank" class="btn-secondary">
GitHub
</a> </div> </div> </div> </section>  <section class="py-16 md:py-24"> <div class="max-w-6xl mx-auto px-4"> <div class="grid md:grid-cols-3 gap-8"> ${features.map((feature) => renderTemplate`<div class="card text-center"> <div class="text-4xl mb-4">${feature.icon}</div> <h3 class="text-xl font-semibold mb-2">${feature.title}</h3> <p class="text-claude-text-light">${feature.description}</p> </div>`)} </div> </div> </section>  <section class="py-16 md:py-24 bg-claude-warm"> <div class="max-w-6xl mx-auto px-4"> <div class="text-center mb-12"> <h2 class="text-3xl md:text-4xl font-bold mb-4">Latest Tutorials</h2> <p class="text-claude-text-light">Explore the newest Claude tutorials and guides</p> </div> <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6"> ${latestTutorials.map((tutorial) => renderTemplate`${renderComponent($$result2, "TutorialCard", $$TutorialCard, { "title": tutorial.data.title, "description": tutorial.data.description, "difficulty": tutorial.data.difficulty, "tags": tutorial.data.tags, "slug": tutorial.slug, "lang": "en" })}`)} </div> <div class="text-center mt-12"> <a href="/en/tutorial/" class="btn-secondary">
View All Tutorials →
</a> </div> </div> </section>  <section class="py-16 md:py-24"> <div class="max-w-4xl mx-auto px-4 text-center"> <h2 class="text-3xl md:text-4xl font-bold mb-6">Join Our Community</h2> <p class="text-xl text-claude-text-light mb-8">
Contribute on GitHub or follow us on X for the latest updates
</p> <div class="flex justify-center gap-4"> <a href="https://github.com/openclaude" target="_blank" rel="noopener noreferrer" class="btn-primary">
GitHub
</a> <a href="https://x.com/openclaude" target="_blank" rel="noopener noreferrer" class="btn-secondary">
X (Twitter)
</a> </div> </div> </section> ` })}`;
}, "/Users/macadmin/Dev/openclaude/src/pages/en/index.astro", void 0);

const $$file = "/Users/macadmin/Dev/openclaude/src/pages/en/index.astro";
const $$url = "/en";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
