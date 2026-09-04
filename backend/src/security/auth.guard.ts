import { FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from '../shared/errors/app-error.js';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AuthUser;
    user: AuthUser;
  }
}

export const authenticate = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return reply.code(401).send({
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Authentication token is missing',
        },
        meta: { requestId: req.id },
      });
    }

    const decoded = await req.jwtVerify<AuthUser>();
    req.user = decoded;
  } catch {
    return reply.code(401).send({
      error: {
        code: 'AUTH_REQUIRED',
        message: 'Invalid or expired authentication token',
      },
      meta: { requestId: req.id },
    });
  }
};

/**
 * Authorization guard: Enforces strict BOLA / IDOR protection
 */
export const requireOwnership = (resourceUserId: string, currentUserId: string): void => {
  if (resourceUserId !== currentUserId) {
    throw AppError.forbidden('You do not have permission to access or modify this resource');
  }
};
