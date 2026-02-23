import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users, sessions, type User } from "@/db/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "engineering-marking-system-secret-key";
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: "trainee" | "trainer" | "admin";
  department: string | null;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { userId: number } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number };
  } catch {
    return null;
  }
}

export async function createSession(userId: number): Promise<string> {
  const token = generateToken(userId);
  const expiresAt = new Date(Date.now() + SESSION_DURATION);
  
  await db.insert(sessions).values({
    userId,
    token,
    expiresAt,
  });
  
  return token;
}

export async function deleteSession(token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.token, token));
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    
    if (!token) return null;
    
    const decoded = verifyToken(token);
    if (!decoded) return null;
    
    // Check if session is valid
    const session = await db.select().from(sessions).where(eq(sessions.token, token)).limit(1);
    if (!session.length || session[0].expiresAt < new Date()) {
      return null;
    }
    
    const user = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1);
    if (!user.length || !user[0].isActive) return null;
    
    return {
      id: user[0].id,
      email: user[0].email,
      name: user[0].name,
      role: user[0].role as "trainee" | "trainer" | "admin",
      department: user[0].department,
    };
  } catch {
    return null;
  }
}

export async function login(email: string, password: string): Promise<{ success: boolean; error?: string; user?: AuthUser }> {
  const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
  
  if (!user.length) {
    return { success: false, error: "Invalid email or password" };
  }
  
  if (!user[0].isActive) {
    return { success: false, error: "Account is deactivated" };
  }
  
  const isValid = await verifyPassword(password, user[0].passwordHash);
  if (!isValid) {
    return { success: false, error: "Invalid email or password" };
  }
  
  const token = await createSession(user[0].id);
  
  const cookieStore = await cookies();
  cookieStore.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION / 1000,
  });
  
  return {
    success: true,
    user: {
      id: user[0].id,
      email: user[0].email,
      name: user[0].name,
      role: user[0].role as "trainee" | "trainer" | "admin",
      department: user[0].department,
    },
  };
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  
  if (token) {
    await deleteSession(token);
  }
  
  cookieStore.delete("auth_token");
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireRole(role: "trainee" | "trainer" | "admin"): Promise<AuthUser> {
  const user = await requireAuth();
  if (user.role !== role && user.role !== "admin") {
    throw new Error("Forbidden");
  }
  return user;
}
