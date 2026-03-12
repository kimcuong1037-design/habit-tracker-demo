import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma.js";
import { AppError } from "../middleware/error-handler.js";

const JWT_SECRET = process.env.JWT_SECRET || "habit-tracker-dev-secret";
const JWT_EXPIRES_IN = "7d";
const SALT_ROUNDS = 10;

export interface AuthResult {
  user: { id: string; username: string; createdAt: Date };
  token: string;
}

function signToken(userId: string, username: string): string {
  return jwt.sign({ userId, username }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export async function register(
  username: string,
  password: string,
): Promise<AuthResult> {
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    throw new AppError(409, "USERNAME_TAKEN", "该用户名已被使用");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { username, passwordHash },
  });

  return {
    user: { id: user.id, username: user.username, createdAt: user.createdAt },
    token: signToken(user.id, user.username),
  };
}

export async function login(
  username: string,
  password: string,
): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    throw new AppError(401, "INVALID_CREDENTIALS", "用户名或密码错误");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, "INVALID_CREDENTIALS", "用户名或密码错误");
  }

  return {
    user: { id: user.id, username: user.username, createdAt: user.createdAt },
    token: signToken(user.id, user.username),
  };
}
