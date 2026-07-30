import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      all: true,
      include: ["**/*.js"],
      exclude: [
        "generated/**",
        "prisma/**",
        "emails/**",
        "node_modules/**",
        "**/*.test.ts",
        "**/*.config.*",
        // Reine Bootstrap-/Infrastruktur-Dateien ohne eigene Fachlogik -
        // server.js verdrahtet nur Express/Cron/Socket.io, prismaClient.js
        // instanziiert nur den PrismaClient. Sinnvoll nur per Integrationstest
        // gegen eine echte DB zu pruefen, nicht per Unit-Test.
        "server.js",
        "prismaClient.js",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});