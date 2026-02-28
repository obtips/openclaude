#!/bin/bash

# Cloudflare Pages 构建脚本
# 临时重命名 API 目录以避免 SSR 冲突

echo "🔧 Preparing for Cloudflare Pages build..."

# 如果存在 API 目录，临时重命名
if [ -d "src/pages/api" ]; then
  echo "📦 Temporarily moving src/pages/api..."
  mv src/pages/api src/pages/api.bak
fi

echo "🏗️  Building..."
npm run build

BUILD_STATUS=$?

# 恢复 API 目录
if [ -d "src/pages/api.bak" ]; then
  echo "📦 Restoring src/pages/api..."
  mv src/pages/api.bak src/pages/api
fi

if [ $BUILD_STATUS -eq 0 ]; then
  echo "✅ Build successful!"
else
  echo "❌ Build failed!"
  exit $BUILD_STATUS
fi
