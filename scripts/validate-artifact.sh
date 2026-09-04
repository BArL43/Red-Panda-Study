#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
worker="${project_root}/dist/server/index.js"

[[ -f "${worker}" ]] || {
  echo "Missing vinext server entry: dist/server/index.js" >&2
  exit 66
}

node --input-type=module - "${worker}" <<'NODE'
import { pathToFileURL } from "node:url";

const workerPath = process.argv[2];
const workerUrl = pathToFileURL(workerPath);
workerUrl.searchParams.set("artifact-validation", `${process.pid}-${Date.now()}`);
const worker = await import(workerUrl.href);
if (!worker.default || typeof worker.default.fetch !== "function") {
  throw new Error("dist/server/index.js must have an ESM default export with fetch(request, env, ctx)");
}
NODE

echo "Validated vinext artifact: ESM default.fetch is present."
