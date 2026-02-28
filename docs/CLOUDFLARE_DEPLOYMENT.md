# Cloudflare Pages 部署指南

## 前置准备

### 1. 创建 GitHub 仓库

如果还没有，需要先创建 GitHub 仓库：

```bash
cd /Users/macadmin/Dev/openclaude
git init
git add .
git commit -m "Initial commit"

# 创建远程仓库后
git remote add origin https://github.com/your-username/openclaude.git
git push -u origin main
```

### 2. 创建 GitHub OAuth App

1. 访问 [GitHub Developer Settings](https://github.com/settings/developers)
2. 点击 **OAuth Apps** → **New OAuth App**
3. 填写信息：

   | 项 | 值 |
   |---|---|
   | Application name | `OpenClaude Admin` |
   | Homepage URL | `https://your-domain.pages.dev` |
   | Application description | `OpenClaude 管理后台` |
   | Authorization callback URL | `https://your-domain.pages.dev/api/auth/callback` |

4. 记录 **Client ID** 和 **Client Secret**

### 3. 创建 GitHub Personal Access Token

1. 访问 https://github.com/settings/tokens/new
2. 勾选 `repo` 权限
3. 生成并保存 Token

---

## 部署步骤

### 方式 1: 通过 Cloudflare Dashboard（推荐）

#### 1. 创建 Pages 项目

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
3. 选择你的 GitHub 仓库
4. 配置构建设置：

   | 设置 | 值 |
   |---|---|
   | Project name | `openclaude` |
   | Production branch | `main` |
   | Build command | `npm run build` |
   | Build output directory | `dist` |

5. 点击 **Save and Deploy**

#### 2. 配置环境变量

部署后，进入项目设置：

1. 点击 **Settings** → **Environment variables**
2. 添加以下变量：

   ```bash
   GITHUB_CLIENT_ID=iv1234567890abcdef
   GITHUB_CLIENT_SECRET=ghp_xxxxxxxxxxxx
   GITHUB_TOKEN=ghp_xxxxxxxxxxxx
   GITHUB_REPO_OWNER=your-username
   GITHUB_REPO_NAME=openclaude
   ```

#### 3. 创建 KV Namespace

1. 进入 **Workers & Pages** → **KV** → **Create a namespace**
2. 命名为 `SESSIONS`
3. 记录 **Namespace ID**

#### 4. 绑定 KV Namespace

1. 回到 Pages 项目 → **Settings** → **Functions**
2. 在 **KV Namespace Bindings** 添加：
   - **Variable name**: `SESSIONS`
   - **KV namespace**: 选择创建的命名空间

#### 5. 更新 OAuth 回调 URL

回到 GitHub OAuth App 设置，添加生产环境回调：
```
https://openclaude.pages.dev/api/auth/callback
```

---

### 方式 2: 使用 Wrangler CLI

```bash
# 安装 wrangler
npm install -g wrangler

# 登录
wrangler login

# 构建项目
npm run build

# 部署
npx wrangler pages deploy dist --project-name=openclaude
```

然后按照方式 1 的步骤 2-5 配置环境变量和 KV。

---

## 本地开发

Cloudflare Functions 在本地开发时不会生效，项目使用 `src/pages/api/` 下的本地 API 路由：

- `src/pages/api/posts/` - 文章管理 API
- `src/pages/api/auth/` - 认证 API

部署到 Cloudflare Pages 时，`functions/` 目录下的文件会自动启用。

---

## 文件结构说明

```
openclaude/
├── src/
│   └── pages/
│       ├── api/              # 本地开发 API (Node.js)
│       │   ├── posts/
│       │   └── auth/
│       └── admin/            # 管理后台页面
├── functions/                # Cloudflare Pages Functions (生产环境)
│   ├── api/
│   │   ├── auth/
│   │   │   └── callback.ts   # OAuth 回调
│   │   └── posts/            # 文章管理 API
│   └── auth/
│       ├── login.ts          # 登录接口
│       └── logout.ts         # 登出接口
├── lib/
│   └── auth-cloudflare.ts    # Cloudflare 认证辅助
└── wrangler.toml             # Cloudflare 配置
```

---

## 故障排查

### 登录后立即退出

- 检查 KV Namespace 是否正确绑定
- 确认 `GITHUB_CLIENT_SECRET` 正确

### OAuth 回调错误

- 确认回调 URL 与 GitHub OAuth App 设置完全一致
- 本地开发: `http://localhost:4321/api/auth/callback`
- 生产环境: `https://your-domain.pages.dev/api/auth/callback`

### 文章操作失败

- 确认 GitHub Token 有 `repo` 权限
- 确认 `GITHUB_REPO_OWNER` 和 `GITHUB_REPO_NAME` 正确

---

## 自定义域名（可选）

1. 在 Pages 项目 → **Custom domains**
2. 添加你的域名（如 `openclau.de`）
3. 按照提示配置 DNS 记录
4. 更新 GitHub OAuth App 的回调 URL 为新域名
