import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";
import unusedImports from "eslint-plugin-unused-imports";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  globalIgnores([
    ".next/**",
    "coverage/**",
    "node_modules/**",
    "public/**",
    "src/types/database.generated.ts",
    "**/*.bak",
    "**/*.old",
    "**/*backup*",
  ]),
  {
    plugins: { "unused-imports": unusedImports },
    linterOptions: { reportUnusedDisableDirectives: "off" },
    rules: {
      "unused-imports/no-unused-imports": "error",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          args: "none",
          caughtErrors: "none",
          ignoreRestSiblings: true,
          varsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "off",
      "react-hooks/immutability": "off",
      "react-hooks/purity": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/static-components": "off",
    },
  },
]);
