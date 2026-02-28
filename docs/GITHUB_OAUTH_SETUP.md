# GitHub OAuth 配置指南

## 1. 创建 GitHub OAuth App

### 步骤：

1. 访问 [GitHub Developer Settings](https://github.com/settings/developers)
2. 点击 **OAuth Apps** → **New OAuth App**
3. 填写信息：

   | 项 | 值 |
   |---|---|
   | Application name | `OpenClaude Admin` |
   | Homepage URL | `http://localhost:4321` (本地) 或 `https://openclau.de` (生产) |
   | Application description | `OpenClaude 管理后台` |
   | Authorization callback URL | `http://localhost:4321/functions/api/auth/callback` (本地) |

4. 点击 **Register application**

5. 记录以下信息（部署时需要）：
   - **Client ID**
   - **Client Secret** (点击 Generate new secret 生成)

### 生产环境回调 URL

在 GitHub OAuth App 设置中添加生产环境回调 URL：
```
https://your-domain.com/functions/api/auth/callback
```

---

## 2. 生成 Personal Access Token

OAuth App 授权后仍需要一个有 `repo` 权限的 Token 来操作仓库：

1. 访问 https://github.com/settings/tokens/new
2. 勾选 `repo` 权限
3. 生成并保存 Token

---

## 3. 本地开发配置

### A. 设置环境变量

复制 `.env.example` 到 `.env` 并填写：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# GitHub OAuth
GITHUB_CLIENT_ID=iv1234567890abcdef
GITHUB_CLIENT_SECRET=ghp_xxxxxxxxxxxx

# GitHub API (文章管理)
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
GITHUB_REPO_OWNER=your-username
GITHUB_REPO_NAME=openclaude
```

### B. 启动开发服务器

```bash
npm install
npm run dev
```

访问 http://localhost:4321/admin 测试登录。

---

## 4. 部署到 Cloudflare Pages

### A. 创建 KV Namespace (用于 Session 存储)

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages** → **KV** → **Create a namespace**
3. 命名为 `SESSIONS`
4. 记录 **Namespace ID**

### B. 部署项目

#### 方式 1: 直接部署

```bash
npm run build
npx wrangler pages deploy ./dist --project-name=openclaude
```

#### 方式 2: 连接 Git 仓库（推荐）

1. 在 Cloudflare Pages 创建项目
2. 连接 GitHub 仓库
3. 配置构建设置：
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`

### C. 配置环境变量

在 Cloudflare Pages 项目设置中添加环境变量：

| 变量名 | 值 |
|---|---|
| `GITHUB_CLIENT_ID` | 你的 GitHub Client ID |
| `GITHUB_CLIENT_SECRET` | 你的 GitHub Client Secret |
| `GITHUB_TOKEN` | 你的 GitHub Token |
| `GITHUB_REPO_OWNER` | 仓库所有者 |
| `GITHUB_REPO_NAME` | 仓库名称 |

### D. 绑定 KV Namespace

在 Cloudflare Pages 项目设置中：

1. 进入 **Settings** → **Functions**
2. 在 **KV Namespace Bindings** 添加：
   - **Variable name**: `SESSIONS`
   - **KV namespace**: 选择创建的命名空间

---

## 5. 文件结构

```
openclaude/
├── functions/
│   ├── api/
│   │   └── auth/
│   │       └── callback.ts      # OAuth 回调处理
│   ├── auth/
│   │   ├── login.ts             # 登录接口
│   │   └── logout.ts            # 登出接口
│   └── posts/
│       ├── index.ts             # 文章列表/创建
│       └── [id].ts              # 文章更新/删除
├── lib/
│   └── auth-cloudflare.ts       # 认证辅助函数
├── wrangler.toml                # Cloudflare 配置
└── .env.example                 # 环境变量模板
```

---

## 6. 故障排查

### 登录后立即退出

- 检查 KV Namespace 是否正确绑定
- 检查 `GITHUB_CLIENT_SECRET` 是否正确

### OAuth 回调错误

- 确认回调 URL 与 GitHub OAuth App 设置完全一致
- 本地开发: `http://localhost:4321/functions/api/auth/callback`
- 生产环境: `https://your-domain.com/functions/api/auth/callback`

### 文章操作失败

- 确认 GitHub Token 有 `repo` 权限
- 确认 `GITHUB_REPO_OWNER` 和 `GITHUB_REPO_NAME` 正确
