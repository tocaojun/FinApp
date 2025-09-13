import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  meta?: any;
}

class Logger {
  private logLevel: LogLevel;
  private logDir: string;
  private logStreams: Map<string, NodeJS.WritableStream>;

  constructor() {
    this.logLevel = this.getLogLevel();
    this.logDir = join(process.cwd(), 'logs');
    this.logStreams = new Map();
    
    this.ensureLogDirectory();
    this.setupLogStreams();
  }

  private getLogLevel(): LogLevel {
    const level = process.env.LOG_LEVEL?.toLowerCase() || 'info';
    switch (level) {
      case 'error':
        return LogLevel.ERROR;
      case 'warn':
        return LogLevel.WARN;
      case 'info':
        return LogLevel.INFO;
      case 'debug':
        return LogLevel.DEBUG;
      default:
        return LogLevel.INFO;
    }
  }

  private ensureLogDirectory(): void {
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }
  }

  private setupLogStreams(): void {
    const today = new Date().toISOString().split('T')[0];
    
    // 应用日志
    const appLogFile = join(this.logDir, `app-${today}.log`);
    this.logStreams.set('app', createWriteStream(appLogFile, { flags: 'a' }));
    
    // 错误日志
    const errorLogFile = join(this.logDir, `error-${today}.log`);
    this.logStreams.set('error', createWriteStream(errorLogFile, { flags: 'a' }));
    
    // 访问日志
    const accessLogFile = join(this.logDir, `access-${today}.log`);
    this.logStreams.set('access', createWriteStream(accessLogFile, { flags: 'a' }));
  }

  private formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...(meta && { meta }),
    };
    
    return JSON.stringify(logEntry) + '\n';
  }

  private writeToFile(streamName: string, content: string): void {
    const stream = this.logStreams.get(streamName);
    if (stream) {
      stream.write(content);
    }
  }

  private log(level: LogLevel, levelName: string, message: string, meta?: any): void {
    if (level > this.logLevel) {
      return;
    }

    const formattedMessage = this.formatMessage(levelName, message, meta);
    
    // 写入文件
    this.writeToFile('app', formattedMessage);
    if (level === LogLevel.ERROR) {
      this.writeToFile('error', formattedMessage);
    }

    // 控制台输出
    if (process.env.NODE_ENV !== 'production') {
      const timestamp = new Date().toISOString();
      const coloredLevel = this.colorizeLevel(levelName);
      const consoleMessage = `[${timestamp}] ${coloredLevel}: ${message}`;
      
      if (meta) {
        console.log(consoleMessage, meta);
      } else {
        console.log(consoleMessage);
      }
    }
  }

  private colorizeLevel(level: string): string {
    const colors = {
      ERROR: '\x1b[31m', // 红色
      WARN: '\x1b[33m',  // 黄色
      INFO: '\x1b[36m',  // 青色
      DEBUG: '\x1b[35m', // 紫色
    };
    const reset = '\x1b[0m';
    const color = colors[level as keyof typeof colors] || '';
    return `${color}${level}${reset}`;
  }

  public error(message: string, meta?: any): void {
    this.log(LogLevel.ERROR, 'ERROR', message, meta);
  }

  public warn(message: string, meta?: any): void {
    this.log(LogLevel.WARN, 'WARN', message, meta);
  }

  public info(message: string, meta?: any): void {
    this.log(LogLevel.INFO, 'INFO', message, meta);
  }

  public debug(message: string, meta?: any): void {
    this.log(LogLevel.DEBUG, 'DEBUG', message, meta);
  }

  public access(message: string): void {
    const formattedMessage = this.formatMessage('ACCESS', message);
    this.writeToFile('access', formattedMessage);
  }

  public close(): void {
    this.logStreams.forEach((stream) => {
      if (stream && typeof stream.end === 'function') {
        stream.end();
      }
    });
    this.logStreams.clear();
  }
}

// 导出单例实例
export const logger = new Logger();

// 进程退出时关闭日志流
process.on('exit', () => {
  logger.close();
});

process.on('SIGINT', () => {
  logger.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.close();
  process.exit(0);
});