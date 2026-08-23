const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });

module.exports = createJestConfig({
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testPathIgnorePatterns: ["<rootDir>/e2e/", "<rootDir>/node_modules/"],
  clearMocks: true,
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
  collectCoverageFrom: [
    "src/lib/safe-next.ts",
    "src/lib/arrangement.ts",
    "src/lib/invoices/reminder-template.ts",
    "src/lib/publishing/validation.ts",
    "src/lib/payments/midtrans.ts",
    "src/lib/projects/catalog-pricing.ts",
    "src/lib/contact.ts",
  ],
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  coverageThreshold: { global: { statements: 70, branches: 55, functions: 70, lines: 70 } },
});
