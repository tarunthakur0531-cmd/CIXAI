/**
 * JWT-based authentication system
 * Replaces the complex OAuth flow with simple JWT tokens
 */

import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { SignJWT, jwtVerify } from "jose";
import type { Request, Response } from "express";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";
import { getSessionCookieOptions } from "./cookies";
import { nanoid } from "nanoid";

// Get JWT secret from environment
function getJwtSecret(): Uint8Array {
  if (!ENV.cookieSecret) {
    throw new Error(
      "JWT_SECRET environment variable is required for authentication"
    );
  }
  // Convert secret string to Uint8Array for jose
  return new TextEncoder().encode(ENV.cookieSecret);
}

export interface AuthPayload {
  userId: number;
  openId: string;
  iat?: number;
  exp?: number;
}

/**
 * Create a JWT token for a user
 */
export async function createSessionToken(user: User): Promise<string> {
  const token = await new SignJWT({
    userId: user.id,
    openId: user.openId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1y")
    .sign(getJwtSecret());

  return token;
}

/**
 * Verify and decode a JWT token
 */
export async function verifySessionToken(
  token: string
): Promise<AuthPayload | null> {
  try {
    const verified = await jwtVerify(token, getJwtSecret());
    return verified.payload as AuthPayload;
  } catch (error) {
    console.error("[Auth] JWT verification failed:", error);
    return null;
  }
}

/**
 * Extract user from request (JWT or session cookie)
 */
export async function getUserFromRequest(req: Request): Promise<User | null> {
  try {
    // Try to get token from Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }

    // Fallback to session cookie
    if (!token && req.cookies[COOKIE_NAME]) {
      token = req.cookies[COOKIE_NAME];
    }

    if (!token) {
      return null;
    }

    const payload = await verifySessionToken(token);
    if (!payload) {
      return null;
    }

    // Fetch user from database
    const user = await db.getUserByOpenId(payload.openId);
    return user || null;
  } catch (error) {
    console.error("[Auth] Failed to get user from request:", error);
    return null;
  }
}

/**
 * Login a user by creating an account if needed and returning a session token
 * Used for testing and development
 */
export async function loginUser(
  openId: string,
  userInfo?: { name?: string; email?: string }
): Promise<string> {
  // Upsert user in database
  await db.upsertUser({
    openId,
    name: userInfo?.name || null,
    email: userInfo?.email || null,
    loginMethod: "dev",
    lastSignedIn: new Date(),
  });

  // Get user and create token
  const user = await db.getUserByOpenId(openId);
  if (!user) {
    throw new Error("Failed to create user");
  }

  const token = await createSessionToken(user);
  return token;
}

/**
 * Express middleware to set session cookie
 */
export function setSessionCookie(
  res: Response,
  token: string,
  req: Request
): void {
  const cookieOptions = getSessionCookieOptions(req);
  res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
}

/**
 * Express middleware to clear session cookie
 */
export function clearSessionCookie(res: Response, req: Request): void {
  const cookieOptions = getSessionCookieOptions(req);
  res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
}
