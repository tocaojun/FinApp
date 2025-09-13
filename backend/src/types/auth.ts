import { Request } from 'express';

export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    userId: string;
    email: string;
    username?: string;
  };
}