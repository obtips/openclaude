# Cloudflare Pages + Astro API 疑难杂症排查与修复记录

## 背景介绍
在为博客应用增加前后台“双语切换功能（enableEnglish）”时，涉及到通过 Astro 创建服务端 API 路由 (`/api/posts/settings`)，并利用 GitHub API 直接对配置源文件进行读写。期间在不同环境（本地 vs Cloudflare Pages）的极度差异下，由于缓存问题、不同的环境变量读取规范、以及不同平台的隐蔽拦截，遇到了一连串极其隐蔽的连环 Bug。

---

## 典型问题与终局复盘

### 1. localStorage 与服务端渲染状态冲突
- **问题现象**：前端开关明明处于“关”状态，页面一刷新却因为浏览器缓存强行将英语按钮调出来了，后台重进后开关也是乱跳。
- **根本原因**：由于前端过度依赖存在客户端的 `localStorage`，而网页又是借由 Astro 和 Cloudflare 的服务端实时渲染。客户端内存与线上数据不一致导致冲突打架。
- **解决方案**：清除了 `admin/index.astro` 与 `Header.astro` 里的 `localStorage` 数据保存逻辑，强制将修改后的配置存放在线上唯一主脑（Single Source of Truth），前端每次开启只作为真实配置的乐观 UI 下发。

### 2. 读取后端配置时的“死寂”（Missing env vars）
- **问题现象**：本地起 Dev 服务器时完美调通，只要一部署到远程 Cloudflare Pages，每次点保存都弹出 `Missing env vars`！
- **根本原因**：在本地系统中 `import.meta.env` 可以随便读，但在 Cloudflare 服务器环境下，那些机密的被视作 Secret 的环境变量，由于安全原因被封锁在了每个请求的 Runtime 环境上下文中，全局不可见！
- **解决方案**：修改了我们在服务端获取核心权限参数的语法规则：
  ```typescript
  export const PUT = async (context) => {
    // 兼顾本地测试的兼容性与 Cloudflare 发行版的读取权：
    const env = (context.locals).runtime?.env || import.meta.env;
    const token = env.GITHUB_TOKEN;
  };
  ```

### 3. 被“高级模式”静默覆盖的同名路由（Advanced Mode Bypass）
- **问题现象**：为了解决代码深处的某些逻辑，我们曾以为使用纯正的 Cloudflare Functions 语法（在根目录建立 `functions/api/posts/settings.ts`）可以避坑。但推到线上依然没有任何用，连刚写入的打印追踪字样都消失了。
- **根本原因**：由于我们采用了 Astro 并且指定 Cloudflare 作为 Adapter 构建。Astro 打包生产后会自动吐出一个巨无霸单体核心叫 `dist/_worker.js`。此时 Cloudflare 启动进入了“Advanced Mode”（高级模式），这个模式拥有绝对的高优先级，并且会**彻底无视和屏闭**你手动建在 `functions/` 目录里的源文件路由代理。
- **解决方案**：放弃挣扎，承认这个项目被 Astro 完全主宰的事实。老老实实回到原有目录下的路由 `src/pages/api/posts/settings.ts` 进行最高权重的修复。

### 4. 罕见的代码解析崩溃（Unexpected token 'R' is not valid JSON）
- **问题现象**：这可能是全场最让人崩溃的问题——尝试控制按钮保存配置时，弹出奇怪的天书般的红字：`Unexpected token 'R', "\r\nRequest fo"... is not valid JSON`。而且这压根查不到对应的抛错代码。
- **根本原因**：
  这是一起层叠性质的灾难。当服务请求在深处被网络中间件（如 Cloudflare WAF 等代理服务器）强行掐断并扔回一个 HTTP 403 的报错纯文本页面（例如里面只写了 `Request format is invalid` ），但此时代码里的强制要求是 `await request.json()`！
  由于报错网页是明文，不是正确的 JSON。NodeJS JSON 解析器刚抓狂地读到纯文本字符串中代表 Request 的首个字母 R（Request），系统立刻崩溃罢工扔出了一个极底层的系统格式解析语法异常！
- **解决方案**：
  将这种被动的 `request.json()` 转化为最全能的文本吸收：
  ```typescript
  const rawText = await request.text();
  const body = JSON.parse(rawText || '{}'); // 主动通过 try/catch 把可能的灾难格式控制在可打印的闭环范围内
  ```

### 5. GitHub 严苛的“访客证”门禁与异常吞没（"sha" wasn't supplied）
- **问题现象**：当一切语法障碍扫平后，系统终于清晰地抛出最后一行报错信息：向 GitHub 保存东西时它要求 `sha wasn't supplied`（没有带上源文件指纹验证戳）。
- **根本原因**：
  这真的是万恶之源：我们用来拿配置文件最新状态和获取验证戳指纹（`sha`）的 `GET` 接口由于在请求头里**忘了带上 `User-Agent` 标识**！
  对于别人无所谓，但 GitHub 的防恶意机器人风控直接把你这连个名字都没报的白板请求杀死了。而且由于我们的代码做了极好的容错，它竟然**默默吞掉了 403 Forbidden 这个致命警告**并在出错时默认给你塞了一个关闭的状态和不存在指纹的假数据。
  前端收到了缺少源指纹的验证数据向后端更新写入，最后因为缺斤少两被挡在了门外，并因此连环导致前端所有的按钮都被锁死成了英文显示。
- **解决方案**：
  就加了一行代码：在与 GitHub 联系时礼貌性地加上通行证（`User-Agent`）
  ```typescript
  // 补上之后 GitHub 立刻全绿放行：
  headers: {
      'User-Agent': 'Cloudflare-Pages'
  }
  ```

---
这是由于一连串不同的云端生态差异、框架深度重叠机制、以及严酷的上游第三方防备系统联合引发的不可思议的网络链 Bug，虽然曲折，却让我们完善了最严丝合缝的安全错误解析底座。
