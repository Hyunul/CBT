const { globSync: glob, isDynamicPattern } = require("tinyglobby");
const { isAbsolute, resolve } = require("node:path");
const { statSync } = require("node:fs");

// Scoped to Next ESLint's getRootDirs, not a general fast-glob replacement.
// tinyglobby otherwise expands a literal directory to its descendants.
exports.globSync = (pattern, options = {}) => {
  if (typeof pattern !== "string") {
    throw new TypeError("Next root discovery expects a string pattern");
  }
  if (!isDynamicPattern(pattern)) {
    const stat = statSync(resolve(options.cwd || process.cwd(), pattern), {
      throwIfNoEntry: false,
    });
    if (!stat || (options.onlyDirectories && !stat.isDirectory())) return [];
    return [pattern.length > 1 ? pattern.replace(/\/$/, "") : pattern];
  }
  return glob(pattern, {
    ...options,
    expandDirectories: false,
    absolute: isAbsolute(pattern),
  }).map((path) => path.replace(/\/$/, ""));
};
