import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_DmFGXfjQ.mjs';
import { manifest } from './manifest_bWyF-k8n.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/404.astro.mjs');
const _page2 = () => import('./pages/admin/admin-app.astro.mjs');
const _page3 = () => import('./pages/admin.astro.mjs');
const _page4 = () => import('./pages/api/github/posts/_id_.astro.mjs');
const _page5 = () => import('./pages/api/github/posts.astro.mjs');
const _page6 = () => import('./pages/blog.astro.mjs');
const _page7 = () => import('./pages/blog/_---slug_.astro.mjs');
const _page8 = () => import('./pages/en/tutorial.astro.mjs');
const _page9 = () => import('./pages/en/tutorial/_---slug_.astro.mjs');
const _page10 = () => import('./pages/en.astro.mjs');
const _page11 = () => import('./pages/tutorial.astro.mjs');
const _page12 = () => import('./pages/tutorial/_---slug_.astro.mjs');
const _page13 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/node.js", _page0],
    ["src/pages/404.astro", _page1],
    ["src/pages/admin/admin-app.ts", _page2],
    ["src/pages/admin/index.astro", _page3],
    ["src/pages/api/github/posts/[id].ts", _page4],
    ["src/pages/api/github/posts/index.ts", _page5],
    ["src/pages/blog/index.astro", _page6],
    ["src/pages/blog/[...slug].astro", _page7],
    ["src/pages/en/tutorial/index.astro", _page8],
    ["src/pages/en/tutorial/[...slug].astro", _page9],
    ["src/pages/en/index.astro", _page10],
    ["src/pages/tutorial/index.astro", _page11],
    ["src/pages/tutorial/[...slug].astro", _page12],
    ["src/pages/index.astro", _page13]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./noop-entrypoint.mjs'),
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "mode": "standalone",
    "client": "file:///Users/macadmin/Dev/openclaude/dist/client/",
    "server": "file:///Users/macadmin/Dev/openclaude/dist/server/",
    "host": false,
    "port": 4321,
    "assets": "_astro",
    "experimentalStaticHeaders": false
};
const _exports = createExports(_manifest, _args);
const handler = _exports['handler'];
const startServer = _exports['startServer'];
const options = _exports['options'];
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) {
	serverEntrypointModule[_start](_manifest, _args);
}

export { handler, options, pageMap, startServer };
