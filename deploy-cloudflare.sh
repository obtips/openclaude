#!/bin/bash

# Cloudflare Pages 部署脚本

set -e

echo "🚀 OpenClaude Cloudflare Pages 部署脚本"
echo "========================================"

# 检查是否安装了 wrangler
if ! command -v wrangler &> /dev/null; then
    echo "❌ wrangler 未安装，请先运行: npm install -g wrangler"
    exit 1
fi

# 检查是否已登录
echo "📋 检查 wrangler 登录状态..."
if ! wrangler whoami &> /dev/null; then
    echo "⚠️  未登录 Cloudflare，请登录:"
    wrangler login
fi

# 构建项目
echo ""
echo "🔨 构建项目..."
npm run build

# 检查构建是否成功
if [ ! -d "dist" ]; then
    echo "❌ 构建失败，dist 目录不存在"
    exit 1
fi

# 部署
echo ""
echo "📤 部署到 Cloudflare Pages..."
wrangler pages deploy dist --project-name=openclaude

echo ""
echo "✅ 部署完成！"
echo ""
echo "📝 接下来需要:"
echo "1. 在 Cloudflare Dashboard 配置环境变量"
echo "2. 创建并绑定 KV Namespace (SESSIONS)"
echo "3. 更新 GitHub OAuth App 回调 URL"
echo ""
echo "详见: docs/CLOUDFLARE_DEPLOYMENT.md"
