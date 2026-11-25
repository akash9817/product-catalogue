import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  FAKESTORE_BASE_URL: z.string().url().default("https://fakestoreapi.com"),
  CACHE_TTL_MS: z.coerce.number().int().nonnegative().default(5 * 60 * 1000),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  SMTP_HOST: z.string().default("localhost"),
  SMTP_PORT: z.coerce.number().int().positive().default(1025),
  SMTP_FROM: z.string().default("Catalogue <no-reply@catalogue.local>"),
  SALES_INBOX: z.string().email().default("sales@catalogue.local"),
});

export type AppConfig = z.infer<typeof envSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    throw new Error(`Invalid configuration: ${parsed.error.message}`);
  }
  return parsed.data;
}
