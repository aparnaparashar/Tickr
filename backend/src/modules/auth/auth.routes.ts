import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { AuthService } from './auth.service.js';
import { authenticate } from '../../security/auth.guard.js';
import { config } from '../../config/env.js';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const authRoutes = async (app: FastifyInstance) => {
  // POST /api/v1/auth/register
  app.post(
    '/register',
    {
      schema: {
        description: 'Register a new user account',
        tags: ['Auth'],
        body: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string' },
            email: { type: 'string' },
            password: { type: 'string' },
          },
        },
      },
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = registerSchema.parse(req.body);
      const user = await AuthService.register(body.name, body.email, body.password);

      const tokenPayload = { id: user.id, email: user.email, name: user.name };
      const accessToken = app.jwt.sign(tokenPayload, { expiresIn: config.JWT_EXPIRES_IN });
      const refreshToken = app.jwt.sign(tokenPayload, { expiresIn: config.REFRESH_TOKEN_EXPIRES_IN });

      reply.setCookie('accessToken', accessToken, {
        path: '/',
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60,
      });

      reply.setCookie('refreshToken', refreshToken, {
        path: '/api/v1/auth/refresh',
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
      });

      return reply.code(201).send({
        data: {
          user,
          accessToken,
          refreshToken,
        },
        meta: { requestId: req.id },
      });
    }
  );

  // POST /api/v1/auth/login
  app.post(
    '/login',
    {
      schema: {
        description: 'Login with email and password',
        tags: ['Auth'],
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string' },
            password: { type: 'string' },
          },
        },
      },
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = loginSchema.parse(req.body);
      const user = await AuthService.login(body.email, body.password);

      const tokenPayload = { id: user.id, email: user.email, name: user.name };
      const accessToken = app.jwt.sign(tokenPayload, { expiresIn: config.JWT_EXPIRES_IN });
      const refreshToken = app.jwt.sign(tokenPayload, { expiresIn: config.REFRESH_TOKEN_EXPIRES_IN });

      reply.setCookie('accessToken', accessToken, {
        path: '/',
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60,
      });

      reply.setCookie('refreshToken', refreshToken, {
        path: '/api/v1/auth/refresh',
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
      });

      return reply.send({
        data: {
          user,
          accessToken,
          refreshToken,
        },
        meta: { requestId: req.id },
      });
    }
  );

  // POST /api/v1/auth/refresh
  app.post(
    '/refresh',
    {
      schema: {
        description: 'Rotate access and refresh tokens',
        tags: ['Auth'],
      },
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      let refreshToken = req.cookies?.refreshToken;
      if (!refreshToken && req.body && typeof req.body === 'object' && 'refreshToken' in req.body) {
        refreshToken = (req.body as { refreshToken: string }).refreshToken;
      }

      if (!refreshToken) {
        return reply.code(401).send({
          error: { code: 'AUTH_REQUIRED', message: 'Refresh token is required' },
          meta: { requestId: req.id },
        });
      }

      try {
        const decoded = app.jwt.verify<{ id: string; email: string; name: string }>(refreshToken);
        const user = await AuthService.getUserById(decoded.id);

        const tokenPayload = { id: user.id, email: user.email, name: user.name };
        const newAccessToken = app.jwt.sign(tokenPayload, { expiresIn: config.JWT_EXPIRES_IN });
        const newRefreshToken = app.jwt.sign(tokenPayload, { expiresIn: config.REFRESH_TOKEN_EXPIRES_IN });

        reply.setCookie('accessToken', newAccessToken, {
          path: '/',
          httpOnly: true,
          secure: config.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 15 * 60,
        });

        reply.setCookie('refreshToken', newRefreshToken, {
          path: '/api/v1/auth/refresh',
          httpOnly: true,
          secure: config.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60,
        });

        return reply.send({
          data: {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          },
          meta: { requestId: req.id },
        });
      } catch {
        return reply.code(401).send({
          error: { code: 'AUTH_REQUIRED', message: 'Invalid or expired refresh token' },
          meta: { requestId: req.id },
        });
      }
    }
  );

  // POST /api/v1/auth/logout
  app.post(
    '/logout',
    {
      schema: {
        description: 'Clear authentication cookies and logout',
        tags: ['Auth'],
      },
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      reply.clearCookie('accessToken', { path: '/' });
      reply.clearCookie('refreshToken', { path: '/api/v1/auth/refresh' });
      return reply.send({
        data: { message: 'Logged out successfully' },
        meta: { requestId: req.id },
      });
    }
  );

  // GET /api/v1/auth/me
  app.get(
    '/me',
    {
      preHandler: [authenticate],
      schema: {
        description: 'Get current authenticated user profile',
        tags: ['Auth'],
      },
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const user = await AuthService.getUserById(req.user!.id);
      return reply.send({
        data: { user },
        meta: { requestId: req.id },
      });
    }
  );
};
