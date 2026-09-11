import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';

  // Never expose raw stack traces to client
  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'An internal error occurred'
      : err.message || 'Something went wrong';

  res.status(statusCode).json({
    success: false,
    error: message,
    code,
  });
};

export const createError = (message: string, statusCode: number, code: string): AppError => {
  const err: AppError = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
};
