import path from "node:path";

const toCwdPaths = (cwd, files) =>
  files
    .map((file) => path.relative(cwd, file))
    .filter((file) => file && !file.startsWith(".."))
    .map((file) => `"${file}"`)
    .join(" ");

export default {
  "apps/backend/**/*.{ts,tsx,js,mjs,cjs}": (files) => {
    const targets = toCwdPaths("apps/backend", files);
    if (!targets) return [];

    return [
      `cd apps/backend && bunx eslint --fix ${targets}`,
      `cd apps/backend && bunx prettier --write ${targets}`,
    ];
  },
  "apps/backend/**/*.{json,md,yml,yaml}": (files) => {
    const targets = toCwdPaths("apps/backend", files);
    if (!targets) return [];

    return [`cd apps/backend && bunx prettier --write ${targets}`];
  },
  "apps/frontend/**/*.{ts,tsx,js,mjs,cjs}": (files) => {
    const targets = toCwdPaths("apps/frontend", files);
    if (!targets) return [];

    return [`cd apps/frontend && bunx eslint --fix ${targets}`];
  },
};
