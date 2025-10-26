#!/bin/bash

echo "=== FinApp Token名称统一修复脚本 ==="
echo "将所有 localStorage.getItem('token') 和 localStorage.getItem('accessToken')"
echo "统一替换为 localStorage.getItem('auth_token')"
echo ""

# 设置工作目录
FRONTEND_DIR="/Users/caojun/code/FinApp/frontend/src"
BACKUP_DIR="/Users/caojun/code/FinApp/token-backup-$(date +%Y%m%d_%H%M%S)"

# 检查目录是否存在
if [ ! -d "$FRONTEND_DIR" ]; then
    echo "错误: 前端源码目录不存在: $FRONTEND_DIR"
    exit 1
fi

# 创建备份目录
mkdir -p "$BACKUP_DIR"
echo "创建备份目录: $BACKUP_DIR"

# 进入前端目录
cd "$FRONTEND_DIR"

echo "查找需要修复的文件..."

# 查找包含需要替换token的文件
files_token=$(grep -r "localStorage\.getItem('token')" . --include="*.ts" --include="*.tsx" -l 2>/dev/null || true)
files_accessToken=$(grep -r "localStorage\.getItem('accessToken')" . --include="*.ts" --include="*.tsx" -l 2>/dev/null || true)

# 合并并去重
all_files=$(echo -e "$files_token\n$files_accessToken" | sort | uniq | grep -v "^$" || true)

if [ -z "$all_files" ]; then
    echo "没有找到需要修复的文件"
    exit 0
fi

echo "找到需要修复的文件:"
echo "$all_files"
echo ""

# 处理每个文件
count=0
for file in $all_files; do
    if [ -f "$file" ]; then
        echo "处理: $file"
        
        # 创建备份
        cp "$file" "$BACKUP_DIR/$(basename "$file" .ts)-$(date +%H%M%S).backup"
        
        # 执行替换 - 使用不同的分隔符避免冲突
        sed -i '' "s|localStorage\.getItem('token')|localStorage.getItem('auth_token')|g" "$file"
        sed -i '' "s|localStorage\.getItem('accessToken')|localStorage.getItem('auth_token')|g" "$file"
        sed -i '' 's|localStorage\.getItem("token")|localStorage.getItem("auth_token")|g' "$file"
        sed -i '' 's|localStorage\.getItem("accessToken")|localStorage.getItem("auth_token")|g' "$file"
        
        count=$((count + 1))
        echo "  ✓ 完成"
    fi
done

echo ""
echo "修复完成! 共处理 $count 个文件"

# 验证结果
echo "验证修复结果..."
remaining_token=$(grep -r "localStorage\.getItem('token')" . --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
remaining_accessToken=$(grep -r "localStorage\.getItem('accessToken')" . --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')

echo "剩余 'token' 引用: $remaining_token"
echo "剩余 'accessToken' 引用: $remaining_accessToken"

if [ "$remaining_token" -eq 0 ] && [ "$remaining_accessToken" -eq 0 ]; then
    echo "✅ 所有token名称已成功统一为 'auth_token'"
else
    echo "⚠️  仍有部分token未替换，请手动检查:"
    if [ "$remaining_token" -gt 0 ]; then
        echo "剩余 'token' 使用:"
        grep -r "localStorage\.getItem('token')" . --include="*.ts" --include="*.tsx" 2>/dev/null || true
    fi
    if [ "$remaining_accessToken" -gt 0 ]; then
        echo "剩余 'accessToken' 使用:"
        grep -r "localStorage\.getItem('accessToken')" . --include="*.ts" --include="*.tsx" 2>/dev/null || true
    fi
fi

echo ""
echo "📁 备份文件保存在: $BACKUP_DIR"
echo "如需恢复，请从备份目录复制文件"
echo ""
echo "🔧 修复完成后，请重启前端服务以使更改生效"