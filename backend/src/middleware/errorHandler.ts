import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { logger } from '@/utils/logger';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export class AppError extends Error implements ApiError {
  public statusCode: number;
  public code: string;
  public details?: any;
  public isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';
  let code = error.code || 'INTERNAL_ERROR';
  let details = error.details;

  // Prisma 错误处理
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    ({ statusCode, message, code, details } = handlePrismaError(error));
  } else if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    statusCode = 500;
    message = 'Database error occurred';
    code = 'DATABASE_ERROR';
  } else if (error instanceof Prisma.PrismaClientRustPanicError) {
    statusCode = 500;
    message = 'Database connection error';
    code = 'DATABASE_CONNECTION_ERROR';
  } else if (error instanceof Prisma.PrismaClientInitializationError) {
    statusCode = 500;
    message = 'Database initialization error';
    code = 'DATABASE_INIT_ERROR';
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Invalid request data';
    code = 'VALIDATION_ERROR';
  }

  // JWT 错误处理
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    code = 'INVALID_TOKEN';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    code = 'TOKEN_EXPIRED';
  }

  // 验证错误处理
  if (error.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
  }

  // 记录错误日志
  const errorLog = {
    message: error.message,
    stack: error.stack,
    statusCode,
    code,
    details,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id,
  };

  if (statusCode >= 500) {
    logger.error('Server Error:', errorLog);
  } else {
    logger.warn('Client Error:', errorLog);
  }

  // 响应错误信息
  const errorResponse: any = {
    success: false,
    error: {
      code,
      message,
    },
  };

  // 开发环境下包含更多错误信息
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = error.stack;
    if (details) {
      errorResponse.error.details = details;
    }
  }

  res.status(statusCode).json(errorResponse);
};

function handlePrismaError(error: Prisma.PrismaClientKnownRequestError): {
  statusCode: number;
  message: string;
  code: string;
  details?: any;
} {
  switch (error.code) {
    case 'P2000':
      return {
        statusCode: 400,
        message: 'The provided value is too long',
        code: 'VALUE_TOO_LONG',
        details: error.meta,
      };
    case 'P2001':
      return {
        statusCode: 404,
        message: 'Record not found',
        code: 'RECORD_NOT_FOUND',
        details: error.meta,
      };
    case 'P2002':
      return {
        statusCode: 409,
        message: 'Unique constraint violation',
        code: 'UNIQUE_CONSTRAINT_VIOLATION',
        details: error.meta,
      };
    case 'P2003':
      return {
        statusCode: 400,
        message: 'Foreign key constraint violation',
        code: 'FOREIGN_KEY_CONSTRAINT_VIOLATION',
        details: error.meta,
      };
    case 'P2004':
      return {
        statusCode: 400,
        message: 'Constraint violation',
        code: 'CONSTRAINT_VIOLATION',
        details: error.meta,
      };
    case 'P2005':
      return {
        statusCode: 400,
        message: 'Invalid value for field',
        code: 'INVALID_FIELD_VALUE',
        details: error.meta,
      };
    case 'P2006':
      return {
        statusCode: 400,
        message: 'Invalid value provided',
        code: 'INVALID_VALUE',
        details: error.meta,
      };
    case 'P2007':
      return {
        statusCode: 400,
        message: 'Data validation error',
        code: 'DATA_VALIDATION_ERROR',
        details: error.meta,
      };
    case 'P2008':
      return {
        statusCode: 400,
        message: 'Failed to parse query',
        code: 'QUERY_PARSE_ERROR',
        details: error.meta,
      };
    case 'P2009':
      return {
        statusCode: 400,
        message: 'Failed to validate query',
        code: 'QUERY_VALIDATION_ERROR',
        details: error.meta,
      };
    case 'P2010':
      return {
        statusCode: 500,
        message: 'Raw query failed',
        code: 'RAW_QUERY_FAILED',
        details: error.meta,
      };
    case 'P2011':
      return {
        statusCode: 400,
        message: 'Null constraint violation',
        code: 'NULL_CONSTRAINT_VIOLATION',
        details: error.meta,
      };
    case 'P2012':
      return {
        statusCode: 400,
        message: 'Missing required value',
        code: 'MISSING_REQUIRED_VALUE',
        details: error.meta,
      };
    case 'P2013':
      return {
        statusCode: 400,
        message: 'Missing required argument',
        code: 'MISSING_REQUIRED_ARGUMENT',
        details: error.meta,
      };
    case 'P2014':
      return {
        statusCode: 400,
        message: 'Relation violation',
        code: 'RELATION_VIOLATION',
        details: error.meta,
      };
    case 'P2015':
      return {
        statusCode: 404,
        message: 'Related record not found',
        code: 'RELATED_RECORD_NOT_FOUND',
        details: error.meta,
      };
    case 'P2016':
      return {
        statusCode: 400,
        message: 'Query interpretation error',
        code: 'QUERY_INTERPRETATION_ERROR',
        details: error.meta,
      };
    case 'P2017':
      return {
        statusCode: 400,
        message: 'Records not connected',
        code: 'RECORDS_NOT_CONNECTED',
        details: error.meta,
      };
    case 'P2018':
      return {
        statusCode: 400,
        message: 'Required connected records not found',
        code: 'REQUIRED_CONNECTED_RECORDS_NOT_FOUND',
        details: error.meta,
      };
    case 'P2019':
      return {
        statusCode: 400,
        message: 'Input error',
        code: 'INPUT_ERROR',
        details: error.meta,
      };
    case 'P2020':
      return {
        statusCode: 400,
        message: 'Value out of range',
        code: 'VALUE_OUT_OF_RANGE',
        details: error.meta,
      };
    case 'P2021':
      return {
        statusCode: 404,
        message: 'Table does not exist',
        code: 'TABLE_NOT_EXISTS',
        details: error.meta,
      };
    case 'P2022':
      return {
        statusCode: 404,
        message: 'Column does not exist',
        code: 'COLUMN_NOT_EXISTS',
        details: error.meta,
      };
    case 'P2025':
      return {
        statusCode: 404,
        message: 'Record not found',
        code: 'RECORD_NOT_FOUND',
        details: error.meta,
      };
    default:
      return {
        statusCode: 500,
        message: 'Database error occurred',
        code: 'DATABASE_ERROR',
        details: error.meta,
      };
  }
}

// 404 处理中间件
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new AppError(
    `Route ${req.originalUrl} not found`,
    404,
    'ROUTE_NOT_FOUND'
  );
  next(error);
};

// 异步错误捕获包装器
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};