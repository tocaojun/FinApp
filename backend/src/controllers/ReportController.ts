import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auth';
import { reportService } from '../services/ReportService';

export class ReportController {
  /**
   * 获取季度报表列表
   */
  async getQuarterlyReports(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const reports = await reportService.getQuarterlyReports(userId);
      res.json(reports);
    } catch (error) {
      console.error('Error fetching quarterly reports:', error);
      res.status(500).json({ error: 'Failed to fetch quarterly reports' });
    }
  }

  /**
   * 获取季度概览统计
   */
  async getQuarterlySummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { quarter } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      if (!quarter) {
        res.status(400).json({ error: 'Quarter parameter is required' });
        return;
      }

      const summary = await reportService.getQuarterlySummary(userId, quarter);
      res.json(summary);
    } catch (error) {
      console.error('Error fetching quarterly summary:', error);
      res.status(500).json({ error: 'Failed to fetch quarterly summary' });
    }
  }

  /**
   * 生成季度报表
   */
  async generateQuarterlyReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { quarter } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      if (!quarter) {
        res.status(400).json({ error: 'Quarter is required' });
        return;
      }

      const result = await reportService.generateQuarterlyReport(userId, quarter);
      res.json(result);
    } catch (error) {
      console.error('Error generating quarterly report:', error);
      res.status(500).json({ error: 'Failed to generate quarterly report' });
    }
  }

  /**
   * 获取IRR分析
   */
  async getIRRAnalysis(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { portfolioId } = req.query;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const irrData = await reportService.getIRRAnalysis(
        userId,
        portfolioId ? String(portfolioId) : undefined
      );
      res.json(irrData);
    } catch (error) {
      console.error('Error fetching IRR analysis:', error);
      res.status(500).json({ error: 'Failed to fetch IRR analysis' });
    }
  }

  /**
   * 重新计算IRR
   */
  async recalculateIRR(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { portfolioId } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const irrData = await reportService.recalculateIRR(userId, portfolioId);
      res.json(irrData);
    } catch (error) {
      console.error('Error recalculating IRR:', error);
      res.status(500).json({ error: 'Failed to recalculate IRR' });
    }
  }

  /**
   * 获取自定义报表列表
   */
  async getCustomReports(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const reports = await reportService.getCustomReports(userId);
      res.json(reports);
    } catch (error) {
      console.error('Error fetching custom reports:', error);
      res.status(500).json({ error: 'Failed to fetch custom reports' });
    }
  }

  /**
   * 创建自定义报表
   */
  async createCustomReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { name, type, dateRange, filters } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      if (!name || !type || !dateRange) {
        res.status(400).json({
          error: 'name, type, and dateRange are required'
        });
        return;
      }

      const report = await reportService.createCustomReport(userId, {
        name,
        type,
        dateRange,
        filters
      });

      res.status(201).json(report);
    } catch (error) {
      console.error('Error creating custom report:', error);
      res.status(500).json({ error: 'Failed to create custom report' });
    }
  }

  /**
   * 运行自定义报表
   */
  async runCustomReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { reportId } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      if (!reportId) {
        res.status(400).json({ error: 'reportId is required' });
        return;
      }

      const result = await reportService.runCustomReport(userId, reportId);
      res.json(result);
    } catch (error) {
      console.error('Error running custom report:', error);
      res.status(500).json({ error: 'Failed to run custom report' });
    }
  }

  /**
   * 更新自定义报表
   */
  async updateCustomReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { reportId } = req.params;
      const { name, type, dateRange, filters } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      if (!reportId) {
        res.status(400).json({ error: 'reportId is required' });
        return;
      }

      const report = await reportService.updateCustomReport(userId, reportId, {
        name,
        type,
        dateRange,
        filters
      });

      res.json(report);
    } catch (error) {
      console.error('Error updating custom report:', error);
      res.status(500).json({ error: 'Failed to update custom report' });
    }
  }

  /**
   * 删除自定义报表
   */
  async deleteCustomReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { reportId } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      if (!reportId) {
        res.status(400).json({ error: 'reportId is required' });
        return;
      }

      const result = await reportService.deleteCustomReport(userId, reportId);
      res.json(result);
    } catch (error) {
      console.error('Error deleting custom report:', error);
      res.status(500).json({ error: 'Failed to delete custom report' });
    }
  }

  /**
   * 获取报表详情
   */
  async getReportDetails(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { type, reportId } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      if (!type || !reportId) {
        res.status(400).json({ error: 'type and reportId are required' });
        return;
      }

      const details = await reportService.getReportDetails(
        userId,
        reportId,
        type as 'quarterly' | 'custom'
      );
      res.json(details);
    } catch (error) {
      console.error('Error fetching report details:', error);
      res.status(500).json({ error: 'Failed to fetch report details' });
    }
  }

  /**
   * 下载报表
   */
  async downloadReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { type, reportId } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      if (!type || !reportId) {
        res.status(400).json({ error: 'type and reportId are required' });
        return;
      }

      const buffer = await reportService.downloadReport(
        userId,
        reportId,
        type as 'quarterly' | 'custom'
      );

      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="report-${reportId}.json"`);
      res.send(buffer);
    } catch (error) {
      console.error('Error downloading report:', error);
      res.status(500).json({ error: 'Failed to download report' });
    }
  }
}

export const reportController = new ReportController();
