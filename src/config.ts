import { z } from "zod";

const ConfigSchema = z.object({
  MANTIS_URL: z
    .string()
    .min(1, "MANTIS_URL is required")
    .url("MANTIS_URL must be a valid URL")
    .transform((u) => u.replace(/\/+$/, "")),
  MANTIS_TOKEN: z.string().min(1, "MANTIS_TOKEN is required"),
  MANTIS_MODE: z
    .enum(["read", "readwrite"])
    .default("read"),
});

export type Mode = "read" | "readwrite";

export interface Config {
  url: string;
  token: string;
  mode: Mode;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = ConfigSchema.safeParse({
    MANTIS_URL: env.MANTIS_URL,
    MANTIS_TOKEN: env.MANTIS_TOKEN,
    MANTIS_MODE: env.MANTIS_MODE,
  });

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  return {
    url: parsed.data.MANTIS_URL,
    token: parsed.data.MANTIS_TOKEN,
    mode: parsed.data.MANTIS_MODE,
  };
}
