import { c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_CJXfXb6l.mjs';
import 'piccolore';
import { $ as $$Layout } from '../chunks/Layout_DNplPzMT.mjs';
export { renderers } from '../renderers.mjs';

const $$404 = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "404 - \u9875\u9762\u672A\u627E\u5230", "description": "\u62B1\u6B49\uFF0C\u60A8\u8BBF\u95EE\u7684\u9875\u9762\u4E0D\u5B58\u5728" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="min-h-[60vh] flex items-center justify-center"> <div class="text-center"> <h1 class="text-6xl md:text-8xl font-bold text-claude-accent mb-4">404</h1> <h2 class="text-2xl md:text-3xl font-semibold mb-4">页面未找到</h2> <p class="text-claude-text-light mb-8">
抱歉，您访问的页面不存在或已被移动。
</p> <a href="/" class="btn-primary">
返回首页
</a> </div> </div> ` })}`;
}, "/Users/macadmin/Dev/openclaude/src/pages/404.astro", void 0);

const $$file = "/Users/macadmin/Dev/openclaude/src/pages/404.astro";
const $$url = "/404";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$404,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
