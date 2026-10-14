// @vitest-environment node
import { expect, it } from "vitest";
import { createRequire } from "node:module";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { ESLint } from "eslint";

const require = createRequire(import.meta.url);
const pluginRequire = createRequire(
  require.resolve("@next/eslint-plugin-next"),
);
const { getRootDirs } = pluginRequire("./utils/get-root-dirs.js");

it("keeps Next root discovery compatible with the scoped tinyglobby replacement", () => {
  const root = mkdtempSync(join(tmpdir(), "cbt-glob-"));
  try {
    for (const name of ["one", "two"]) mkdirSync(join(root, name));
    writeFileSync(join(root, "file.txt"), "not a directory");
    mkdirSync(join(root, "one", "child"));
    const normalized = root.replaceAll("\\", "/");
    const context = (rootDir: string | string[]) => ({
      cwd: root,
      settings: { next: { rootDir } },
    });
    const expected = [normalized + "/one", normalized + "/two"];
    expect(getRootDirs(context(normalized + "/one"))).toEqual([
      normalized + "/one",
    ]);
    // Next joins these roots to app/pages; relative paths and trailing slashes are equivalent.
    const discover = (setting: string | string[]) =>
      (getRootDirs(context(setting)) as string[])
        .map((dir) => resolve(dir).replaceAll("\\", "/"))
        .sort();
    expect(discover(normalized + "/*")).toEqual(expected);
    expect(discover(normalized + "/{one,two}")).toEqual(expected);
    expect(discover([normalized + "/one", normalized + "/two"])).toEqual(
      expected,
    );
    expect(discover(root.replaceAll("/", "\\") + "\\*")).toEqual(expected);
    expect(getRootDirs(context(normalized + "/missing/*"))).toEqual([]);
  } finally {
    if (
      !resolve(root).startsWith(resolve(tmpdir()) + sep) ||
      !root.includes("cbt-glob-")
    ) {
      throw new Error("Unexpected fixture path");
    }
    rmSync(root, { recursive: true, force: true });
  }
});

it("still enforces Next lint rules after replacing the glob dependency", async () => {
  const eslint = new ESLint({
    overrideConfig: {
      settings: { next: { rootDir: process.cwd().replaceAll("\\", "/") } },
    },
  });
  const [result] = await eslint.lintText(
    'export default function Page() { return <><script src="/example.js" /><a href="/">Home</a></>; }',
    { filePath: "app/dependency-check.tsx" },
  );
  expect(
    result.messages.some(
      (message) => message.ruleId === "@next/next/no-sync-scripts",
    ),
  ).toBe(true);
  expect(
    result.messages.some(
      (message) => message.ruleId === "@next/next/no-html-link-for-pages",
    ),
  ).toBe(true);
}, 30_000); // ESLint 초기화가 전체 병렬 실행 중에는 기본 5초를 넘긴다
