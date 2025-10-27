import { Request, Response } from 'express';
import { PriceSyncService } from '../services/PriceSyncService';

export class PriceSyncController {
  private priceSyncService: PriceSyncService;

  constructor() {
    this.priceSyncService = new PriceSyncService();
  }

  // ==================== 数据源管理 ====================

  getDataSources = async (req: Request, res: Response): Promise<void> => {
    try {
      const dataSources = await this.priceSyncService.getDataSources();
      res.json({
        success: true,
        data: dataSources,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get data sources',
      });
    }
  };

  getDataSource = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const dataSource = await this.priceSyncService.getDataSource(id);
      
      if (!dataSource) {
        res.status(404).json({
          success: false,
          message: 'Data source not found',
        });
        return;
      }

      res.json({
        success: true,
        data: dataSource,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get data source',
      });
    }
  };

  createDataSource = async (req: Request, res: Response): Promise<void> => {
    try {
      const dataSource = await this.priceSyncService.createDataSource(req.body);
      res.status(201).json({
        success: true,
        data: dataSource,
        message: 'Data source created successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create data source',
      });
    }
  };

  updateDataSource = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const dataSource = await this.priceSyncService.updateDataSource(id, req.body);
      res.json({
        success: true,
        data: dataSource,
        message: 'Data source updated successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update data source',
      });
    }
  };

  deleteDataSource = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      await this.priceSyncService.deleteDataSource(id);
      res.json({
        success: true,
        message: 'Data source deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete data source',
      });
    }
  };

  // ==================== 同步任务管理 ====================

  getSyncTasks = async (req: Request, res: Response): Promise<void> => {
    try {
      const tasks = await this.priceSyncService.getSyncTasks();
      res.json({
        success: true,
        data: tasks,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get sync tasks',
      });
    }
  };

  getSyncTask = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const task = await this.priceSyncService.getSyncTask(id);
      
      if (!task) {
        res.status(404).json({
          success: false,
          message: 'Sync task not found',
        });
        return;
      }

      res.json({
        success: true,
        data: task,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get sync task',
      });
    }
  };

  createSyncTask = async (req: Request, res: Response): Promise<void> => {
    try {
      const task = await this.priceSyncService.createSyncTask(req.body);
      res.status(201).json({
        success: true,
        data: task,
        message: 'Sync task created successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create sync task',
      });
    }
  };

  updateSyncTask = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const task = await this.priceSyncService.updateSyncTask(id, req.body);
      res.json({
        success: true,
        data: task,
        message: 'Sync task updated successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update sync task',
      });
    }
  };

  deleteSyncTask = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      await this.priceSyncService.deleteSyncTask(id);
      res.json({
        success: true,
        message: 'Sync task deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete sync task',
      });
    }
  };

  // ==================== 同步执行 ====================

  executeSyncTask = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      
      // 异步执行同步任务
      this.priceSyncService.executeSyncTask(id)
        .then(result => {
          console.log(`Sync task ${id} completed:`, result);
        })
        .catch(error => {
          console.error(`Sync task ${id} failed:`, error);
        });

      res.json({
        success: true,
        message: 'Sync task started',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to execute sync task',
      });
    }
  };

  // ==================== 同步日志 ====================

  getSyncLogs = async (req: Request, res: Response): Promise<void> => {
    try {
      const { taskId } = req.query;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      
      const logs = await this.priceSyncService.getSyncLogs(
        taskId as string | undefined,
        limit
      );
      
      res.json({
        success: true,
        data: logs,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get sync logs',
      });
    }
  };

  getSyncLog = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const log = await this.priceSyncService.getSyncLog(id);
      
      if (!log) {
        res.status(404).json({
          success: false,
          message: 'Sync log not found',
        });
        return;
      }

      res.json({
        success: true,
        data: log,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get sync log',
      });
    }
  };
}
