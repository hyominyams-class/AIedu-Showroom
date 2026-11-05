/** Next loads .env.local in development; Vercel injects production secrets. */
export function serverEnv(name: string): string | undefined {
  return process.env[name] || undefined;
}
