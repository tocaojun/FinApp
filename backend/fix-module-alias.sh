#!/bin/bash
# 修复生产环境模块别名问题

cd "$(dirname "$0")"

echo "📦 安装 module-alias..."
npm install module-alias --save

echo "✏️  添加别名配置到 package.json..."
# 使用 node 脚本添加 _moduleAliases 配置
node << 'NODESCRIPT'
const fs = require('fs');
const path = require('path');

const packagePath = path.join(__dirname, 'package.json');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// 添加 module-alias 配置
pkg._moduleAliases = {
  "@": "./dist",
  "@/config": "./dist/config",
  "@/controllers": "./dist/controllers",
  "@/services": "./dist/services",
  "@/models": "./dist/models",
  "@/middleware": "./dist/middleware",
  "@/utils": "./dist/utils",
  "@/types": "./dist/types"
};

fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
console.log('✅ package.json 已更新');
NODESCRIPT

echo "✅ 修复完成！"
