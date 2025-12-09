#!/bin/bash
# 日志清理脚本

echo "🗑️  清理日志文件..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ ! -d "logs" ]; then
    echo -e "${YELLOW}⚠️  logs目录不存在${NC}"
    exit 0
fi

echo ""
echo "📊 清理前日志大小:"
du -sh logs/
echo ""

# 列出大文件
echo "📄 超过10MB的日志文件:"
find logs/ -type f -size +10M -exec ls -lh {} \; | awk '{print $9, $5}'
echo ""

# 询问确认
read -p "是否清理超过7天的日志文件? (y/n): " CONFIRM

if [ "$CONFIRM" = "y" ]; then
    echo ""
    echo "🗑️  清理中..."
    
    # 清理超过7天的日志
    DELETED_COUNT=$(find logs/ -type f -name "*.log" -mtime +7 | wc -l)
    find logs/ -type f -name "*.log" -mtime +7 -delete
    find logs/ -type f -name "*.log.*" -mtime +7 -delete
    
    # 截断大日志文件(保留最后1000行)
    for log in logs/*.log; do
        if [ -f "$log" ] && [ $(wc -l < "$log") -gt 10000 ]; then
            echo "  截断: $log"
            tail -1000 "$log" > "$log.tmp" && mv "$log.tmp" "$log"
        fi
    done
    
    echo ""
    echo -e "${GREEN}✅ 已删除 $DELETED_COUNT 个旧日志文件${NC}"
    echo ""
    echo "📊 清理后日志大小:"
    du -sh logs/
else
    echo -e "${YELLOW}⚠️  已取消清理${NC}"
fi
