import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { logger } from '../utils/logger';

export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.type === 'field' ? (error as any).path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? (error as any).value : undefined
    }));

    logger.warn('Validation failed', {
      path: req.path,
      method: req.method,
      errors: errorMessages,
      body: req.body,
      params: req.params,
      query: req.query
    });

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    });
    return;
  }

  next();
};