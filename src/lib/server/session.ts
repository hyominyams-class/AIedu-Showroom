import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { ACCESS_COOKIE_NAME } from "../access";
import { serverEnv } from "./env";

export const VISITOR_COOKIE = "showroom_visitor";
const YEAR = 365 * 24 * 60 * 60;
const ACCESS_AGE = 6 * 60 * 60;

function secret() {
  const value = serverEnv("SHOWROOM_SESSION_SECRET");
  if (!value || value.length < 32) throw new Error("Session configuration unavailable");
  return value;
}

export function signSession(id: string, purpose: "access" | "visitor", age: number) {
  const payload = Buffer.from(JSON.stringify({ id, purpose, exp: Date.now() + age * 1000 })).toString("base64url");
  return `${payload}.${createHmac("sha256", secret()).update(payload).digest("base64url")}`;
}

export function verifySession(token: string | undefined, purpose: "access" | "visitor") {
  if (!token || token.length > 512) return undefined;
  try {
    const [payload, signature, extra] = token.split(".");
    if (!payload || !signature || extra) return undefined;
    const expected = createHmac("sha256", secret()).update(payload).digest();
    const actual = Buffer.from(signature, "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return undefined;
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (parsed.purpose !== purpose || !Number.isFinite(parsed.exp) || parsed.exp < Date.now()) return undefined;
    return typeof parsed.id === "string" && /^[a-f0-9-]{36}$/.test(parsed.id) ? parsed.id as string : undefined;
  } catch {
    return undefined;
  }
}

export function requestCookie(request: Request, name: string) {
  return request.headers.get("cookie")?.split(";").map((s) => s.trim()).find((s) => s.startsWith(`${name}=`))?.slice(name.length + 1);
}

export function visitorFromRequest(request: Request) {
  return verifySession(requestCookie(request, ACCESS_COOKIE_NAME), "access");
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  if (!origin) return true;
  try {
    const source = new URL(origin);
    // Next may normalize request.url to localhost behind its dev/reverse proxy.
    // Host represents the actual destination seen by the browser.
    return ["http:", "https:"].includes(source.protocol) && source.host === (request.headers.get("host") || new URL(request.url).host);
  } catch { return false; }
}

export function issueSession(request: Request) {
  const id = verifySession(requestCookie(request, VISITOR_COOKIE), "visitor") || visitorFromRequest(request) || randomUUID();
  const secure = new URL(request.url).protocol === "https:" || process.env.VERCEL ? "; Secure" : "";
  const headers = new Headers({ "Cache-Control": "no-store" });
  headers.append("Set-Cookie", `${ACCESS_COOKIE_NAME}=${signSession(id, "access", ACCESS_AGE)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${ACCESS_AGE}${secure}`);
  headers.append("Set-Cookie", `${VISITOR_COOKIE}=${signSession(id, "visitor", YEAR)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${YEAR}${secure}`);
  return headers;
}
