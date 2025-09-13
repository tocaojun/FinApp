import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';

export interface RequestLogData {
  method: string;
  url: string;
  ip: string;
  userAgent?: string;
  userId?: string;
  statusCode?: number;
  responseTime?: number;
  contentLength?: number;
  referer?: string;
}

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  // 获取请求信息
  const requestData: Partial<RequestLogData> = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.socket.remoteAddress || 'unknown',
    userAgent: req.get('User-Agent'),
    referer: req.get('Referer'),
  };

  // 监听响应完成事件
  res.on('finish', () => {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    const logData: RequestLogData = {
      method: requestData.method!,
      url: requestData.url!,
      ip: requestData.ip!,
      userAgent: requestData.userAgent,
      referer: requestData.referer,
      statusCode: res.statusCode,
      responseTime,
      contentLength: parseInt(res.get('Content-Length') || '0'),
      userId: (req as any).user?.id,
    };

    // 记录访问日志
    const logMessage = `${logData.method} ${logData.url} ${logData.statusCode} ${logData.responseTime}ms - ${logData.ip}`;
    
    // 根据状态码决定日志级别
    const statusCode = logData.statusCode || 0;
    if (statusCode >= 500) {
      logger.error(`Server Error - ${logMessage}`, logData);
    } else if (statusCode >= 400) {
      logger.warn(`Client Error - ${logMessage}`, logData);
    } else {
      logger.info(`Request - ${logMessage}`, logData);
    }

    // 记录到访问日志文件
    logger.access(JSON.stringify(logData));
  });

  // 监听响应关闭事件（客户端断开连接）
  res.on('close', () => {
    if (!res.writableEnded) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      const logData: RequestLogData = {
        method: requestData.method!,
        url: requestData.url!,
        ip: requestData.ip!,
        userAgent: requestData.userAgent,
        statusCode: res.statusCode || 0,
        responseTime,
        userId: (req as any).user?.id,
      };

      logger.warn(`Connection closed - ${logData.method} ${logData.url} ${logData.responseTime}ms - ${logData.ip}`, logData);
    }
  });

  next();
};