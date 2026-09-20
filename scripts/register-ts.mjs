// Node 22.15+ test loader for this small TypeScript project; no test dependency.
import { registerHooks, stripTypeScriptTypes } from "node:module";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve as resolvePath } from "node:path";

const workspaceRoot = process.cwd();

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/"))
      specifier = pathToFileURL(
        resolvePath(workspaceRoot, "src", specifier.slice(2)),
      ).href;
    if (specifier.startsWith(".") || specifier.startsWith("file:")) {
      const url = new URL(specifier, context.parentURL);
      if (
        !/\.[cm]?[jt]sx?$/.test(url.pathname) &&
        existsSync(fileURLToPath(url) + ".ts")
      )
        url.pathname += ".ts";
      return nextResolve(url.href, context);
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.endsWith(".ts"))
      return {
        format: "module",
        source: stripTypeScriptTypes(readFileSync(new URL(url), "utf8")),
        shortCircuit: true,
      };
    return nextLoad(url, context);
  },
});
