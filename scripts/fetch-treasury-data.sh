#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🏛️  Treasury.gov 国债数据获取程序${NC}\n"

# 检查 Node.js 是否已安装
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js 未安装，请先安装 Node.js${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js 已安装${NC}"
echo -e "   版本: $(node --version)\n"

# 进入项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo -e "${BLUE}📁 项目目录: $PROJECT_ROOT${NC}\n"

# 检查依赖
if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules 不存在，正在安装依赖...${NC}"
    cd "$PROJECT_ROOT"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 依赖安装失败${NC}"
        exit 1
    fi
fi

# 检查必要的包
if ! npm list axios &> /dev/null; then
    echo -e "${YELLOW}⚠️  正在安装 axios...${NC}"
    npm install axios
fi

# 运行 TypeScript 脚本
echo -e "${BLUE}🚀 开始获取国债数据...${NC}\n"

npx ts-node "$PROJECT_ROOT/scripts/fetch-treasury-data.ts"

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✨ 数据获取完成！${NC}"
    echo -e "${BLUE}📁 CSV 文件已保存到: $PROJECT_ROOT/backups/${NC}"
else
    echo -e "\n${RED}❌ 数据获取失败${NC}"
    exit 1
fi
