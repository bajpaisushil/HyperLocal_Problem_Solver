import type { Request, Response, NextFunction, RequestHandler } from 'express';

/** Wrap an async route handler so rejected promises reach Express' error handler. */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => unknown): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
