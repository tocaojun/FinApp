import { Router } from 'express';
import { WealthProductController } from '../controllers/WealthProductController';
import { requirePermission } from '../middleware/permissionMiddleware';

const router = Router();
const wealthProductController = new WealthProductController();

/**
 * 财富产品管理路由
 * 
 * 功能模块：
 * - 收益对比分析 (分红型/净值型)
 * - 偏差原因分析
 * - 交易记录
 * - 产品汇总信息
 * - 收益趋势
 */

// ============================================
// 分红型产品收益对比
// ============================================
/**
 * POST /api/wealth/dividend/:assetId/comparison
 * 获取分红型产品的预期收益与实际收益对比
 * 
 * 请求体:
 * {
 *   "investment": 100000,      // 投资金额
 *   "expectedReturn": 5,        // 预期年化收益率 (%)
 *   "startDate": "2024-01-01"   // 投资开始日期 (可选)
 * }
 * 
 * 响应示例:
 * {
 *   "success": true,
 *   "data": {
 *     "productType": "DIVIDEND",
 *     "totalDividends": 3500,
 *     "expectedReturn": 5000,
 *     "actualReturn": 3500,
 *     "deviation": -1500,
 *     "deviationRatio": -30,
 *     "status": "ALERT",
 *     "dividendsList": [...],
 *     "analysis": {
 *       "status": "ALERT",
 *       "deviationPercentage": "-30.00",
 *       "recommendation": "收益偏差严重，建议咨询经理或考虑赎回",
 *       "alert": true
 *     }
 *   }
 * }
 */
router.post(
  '/dividend/:assetId/comparison',
  requirePermission('wealth', 'read'),
  wealthProductController.getDividendComparison
);

// ============================================
// 净值型产品收益对比
// ============================================
/**
 * POST /api/wealth/nav/:assetId/comparison
 * 获取净值型产品的预期收益与实际收益对比
 * 
 * 请求体:
 * {
 *   "investment": 100000,        // 投资金额
 *   "purchaseNav": 10.00,        // 购买净值
 *   "expectedAnnualReturn": 6,   // 预期年化收益率 (%)
 *   "holdingDays": 90            // 持有天数 (可选，默认365)
 * }
 * 
 * 响应示例:
 * {
 *   "success": true,
 *   "data": {
 *     "productType": "NAV",
 *     "purchaseNav": 10.00,
 *     "currentNav": 10.50,
 *     "shareCount": 10000,
 *     "marketValue": 105000,
 *     "gainAmount": 5000,
 *     "gainRate": 5.0,
 *     "expectedReturn": 1.48,
 *     "deviation": 3520,
 *     "deviationRatio": 238,
 *     "status": "NORMAL",
 *     "navHistory": [...],
 *     "analysis": {
 *       "status": "NORMAL",
 *       "deviationPercentage": "238.00",
 *       "gainPercentage": "5.00",
 *       "recommendation": "产品运作正常，收益符合预期，建议继续持有",
 *       "alert": false
 *     }
 *   }
 * }
 */
router.post(
  '/nav/:assetId/comparison',
  requirePermission('wealth', 'read'),
  wealthProductController.getNAVComparison
);

// ============================================
// 偏差分析
// ============================================
/**
 * GET /api/wealth/:assetId/analysis
 * 分析产品的收益偏差原因
 * 
 * 查询参数: (无)
 * 
 * 响应示例:
 * {
 *   "success": true,
 *   "data": {
 *     "assetId": "xxx",
 *     "analysis": {
 *       "level": "WARNING",
 *       "threshold": "±5%",
 *       "reasons": ["分红延迟", "费用高于预期"],
 *       "recommendation": "收益偏差较大，建议咨询产品经理或核查费用",
 *       "trend": [1.2, 2.1, 1.8, 3.2, ...],
 *       "trendSummary": "偏差持续扩大，需要关注"
 *     }
 *   }
 * }
 */
router.get(
  '/:assetId/analysis',
  requirePermission('wealth', 'read'),
  wealthProductController.analyzeDeviations
);

// ============================================
// 交易记录
// ============================================
/**
 * POST /api/wealth/transaction
 * 记录财富产品交易 (购买、赎回、分红等)
 * 
 * 请求体:
 * {
 *   "assetId": "uuid",
 *   "type": "PURCHASE|REDEMPTION|DIVIDEND|FEE|ADJUSTMENT",
 *   "date": "2024-01-01",
 *   "amount": 1000,
 *   "quantity": 100,              // 份额数 (可选)
 *   "navPerShare": 10.0,          // 单位净值 (可选)
 *   "dividendRate": 5,            // 分红率 (可选)
 *   "feeAmount": 50,              // 费用金额 (可选)
 *   "feeDescription": "管理费",   // 费用说明 (可选)
 *   "notes": "备注信息"           // 备注 (可选)
 * }
 * 
 * 响应示例:
 * {
 *   "success": true,
 *   "message": "Transaction recorded successfully",
 *   "data": {...}
 * }
 */
router.post(
  '/transaction',
  requirePermission('wealth', 'create'),
  wealthProductController.recordTransaction
);

// ============================================
// 产品汇总
// ============================================
/**
 * GET /api/wealth/users/:userId/summary
 * 获取用户的财富产品汇总信息
 * 
 * 查询参数:
 *   ?productSubtype=DIVIDEND|NAV  (可选，筛选产品类型)
 * 
 * 响应示例:
 * {
 *   "success": true,
 *   "data": {
 *     "summary": {
 *       "totalProducts": 5,
 *       "productsByType": {
 *         "DIVIDEND": 3,
 *         "NAV": 2
 *       },
 *       "products": [
 *         {
 *           "assetId": "xxx",
 *           "name": "银行理财产品A",
 *           "type": "WEALTH_PRODUCT",
 *           "subtype": "DIVIDEND",
 *           "issuer": "工商银行",
 *           "expectedReturn": 5.5,
 *           "totalInvestment": 100000,
 *           "dividendsReceived": 2500,
 *           "currentValue": 102500,
 *           "transactionCount": 5,
 *           "lastTransactionDate": "2024-11-01"
 *         },
 *         ...
 *       ]
 *     }
 *   }
 * }
 */
router.get(
  '/users/:userId/summary',
  requirePermission('wealth', 'read'),
  wealthProductController.getWealthProductSummary
);

// ============================================
// 收益趋势
// ============================================
/**
 * GET /api/wealth/:assetId/trend
 * 获取产品的收益趋势数据
 * 
 * 查询参数:
 *   ?days=30                    (可选，默认30天)
 *   ?groupBy=daily|weekly|monthly (可选，默认daily)
 * 
 * 响应示例:
 * {
 *   "success": true,
 *   "data": {
 *     "assetId": "xxx",
 *     "period": "30 days",
 *     "granularity": "daily",
 *     "data": [
 *       {
 *         "date": "2024-10-01",
 *         "nav": "10.0000",
 *         "dailyReturn": "0.50",
 *         "cumulativeReturn": "0.50"
 *       },
 *       ...
 *     ]
 *   }
 * }
 */
router.get(
  '/:assetId/trend',
  requirePermission('wealth', 'read'),
  wealthProductController.getReturnTrend
);

// ============================================
// 告警管理
// ============================================

/**
 * GET /api/wealth/users/:userId/alerts
 * 获取用户的告警列表
 * 
 * 查询参数:
 *   ?days=30              (可选，默认30天)
 *   ?status=ACTIVE|RESOLVED|ACKNOWLEDGED (可选，筛选告警状态)
 * 
 * 响应示例:
 * {
 *   "success": true,
 *   "data": {
 *     "userId": "xxx",
 *     "total": 5,
 *     "alerts": [
 *       {
 *         "id": "alert-id",
 *         "assetId": "asset-id",
 *         "alertLevel": "WARNING",
 *         "message": "⚠️ 预警 - 银行理财产品A: 偏差: 3.21%",
 *         "deviationRatio": 3.21,
 *         "recommendation": "收益偏差较大，建议咨询产品经理或核查费用",
 *         "triggeredAt": "2024-11-08T10:30:00Z",
 *         "status": "ACTIVE"
 *       },
 *       ...
 *     ]
 *   }
 * }
 */
router.get(
  '/users/:userId/alerts',
  requirePermission('wealth', 'read'),
  wealthProductController.getUserAlerts
);

/**
 * GET /api/wealth/users/:userId/alerts/stats
 * 获取用户的告警统计
 * 
 * 响应示例:
 * {
 *   "success": true,
 *   "data": {
 *     "userId": "xxx",
 *     "stats": {
 *       "total": 10,
 *       "active": 3,
 *       "byLevel": {
 *         "NORMAL": { "total": 2, "active": 0 },
 *         "WARNING": { "total": 5, "active": 2 },
 *         "ALERT": { "total": 3, "active": 1 }
 *       }
 *     }
 *   }
 * }
 */
router.get(
  '/users/:userId/alerts/stats',
  requirePermission('wealth', 'read'),
  wealthProductController.getAlertStats
);

/**
 * PUT /api/wealth/alerts/:alertId/acknowledge
 * 确认告警
 * 
 * 响应示例:
 * {
 *   "success": true,
 *   "message": "Alert acknowledged"
 * }
 */
router.put(
  '/alerts/:alertId/acknowledge',
  requirePermission('wealth', 'update'),
  wealthProductController.acknowledgeAlert
);

/**
 * PUT /api/wealth/alerts/:alertId/resolve
 * 解决告警
 * 
 * 响应示例:
 * {
 *   "success": true,
 *   "message": "Alert resolved"
 * }
 */
router.put(
  '/alerts/:alertId/resolve',
  requirePermission('wealth', 'update'),
  wealthProductController.resolveAlert
);

export default router;
