import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import type { Role } from '../config/constants.js';

function getToken(req: Request): string | null {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

export function signToken(userId: string): string {
  const secret = process.env.JWT_SECRET as string;
  const options = { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions;
  return jwt.sign({ id: userId }, secret, options);
}

/** Require a valid Bearer token; attaches req.user. */
export async function protect(req: Request, res: Response, next: NextFunction) {
  try {
    const token = getToken(req);
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: 'User no longer exists' });

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

/** Optional auth: attaches req.user if a valid token is present, else continues. */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = getToken(req);
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
      const user = await User.findById(decoded.id);
      if (user) req.user = user;
    }
  } catch {
    /* treat as anonymous */
  }
  next();
}

/** Restrict to specific roles (use after protect). */
export function restrictTo(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
}
