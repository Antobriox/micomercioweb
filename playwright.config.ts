import { defineConfig } from "@playwright/test";

const url = "http://127.0.0.1:4173";

export default defineConfig({
  testDir: "./tests/e2e",
  use: { baseURL: url, channel: process.env.PLAYWRIGHT_CHANNEL },
  webServer: {
    command: "npm start -- --hostname 127.0.0.1 --port 4173",
    url,
    env: {
      VERCEL_ENV: "preview",
      SUPABASE_SERVICE_ROLE_KEY: "fixture-solo-servidor-spec-001",
    },
  },
});
