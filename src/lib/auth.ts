import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const ADMIN_COOKIE = "assmat_admin_session";
const PARENT_COOKIE_PREFIX = "assmat_parent_";

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET manquant ou trop court : definissez une variable d'environnement SESSION_SECRET (>=16 caracteres)."
    );
  }
  return new TextEncoder().encode(secret);
}

// ---------- Session admin (assistante maternelle) ----------

export type AdminSession = { userId: string; email: string; name: string };

export async function createAdminSession(payload: AdminSession) {
  const token = await new SignJWT({ ...payload, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecretKey());

  cookies().set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearAdminSession() {
  cookies().delete(ADMIN_COOKIE);
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (payload.role !== "admin") return null;
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
    };
  } catch {
    return null;
  }
}

// ---------- Session parent (acces lecture seule par enfant) ----------

export async function createParentSession(childId: string) {
  const token = await new SignJWT({ childId, role: "parent" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());

  cookies().set(PARENT_COOKIE_PREFIX + childId, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function hasParentSession(childId: string): Promise<boolean> {
  const token = cookies().get(PARENT_COOKIE_PREFIX + childId)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload.role === "parent" && payload.childId === childId;
  } catch {
    return false;
  }
}
