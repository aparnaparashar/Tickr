import bcrypt from 'bcryptjs';
import { prisma } from '../../db/prisma.js';
import { AppError } from '../../shared/errors/app-error.js';
import { logger } from '../../observability/logger.js';

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static async register(name: string, email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw AppError.conflict('An account with this email already exists');
    }

    const passwordHash = await this.hashPassword(password);

    // Create user and a default watchlist atomically
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        watchlists: {
          create: {
            name: 'My Watchlist',
            isDefault: true,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    logger.info({ userId: user.id, email: user.email }, 'User registered successfully');
    return user;
  }

  static async login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw AppError.unauthorized('Invalid email or password');
    }

    const isValid = await this.verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw AppError.unauthorized('Invalid email or password');
    }

    logger.info({ userId: user.id }, 'User logged in successfully');
    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }

  static async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw AppError.notFound('User not found');
    }

    return user;
  }
}
