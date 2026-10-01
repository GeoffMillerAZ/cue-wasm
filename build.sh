#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
# Reproducible baseline: explicit upstream toolchain, no ambient wasm-opt.
export GOTOOLCHAIN=go1.24.4
export CGO_ENABLED=0
export GOOS=js GOARCH=wasm
mkdir -p bin
package_version=$(node -p 'JSON.parse(require("fs").readFileSync("package.json","utf8")).version')
for mode in reader engine; do
  tags=netgo,osusergo
  if [ "$mode" = reader ]; then tags="$tags,reader"; fi
  go build -mod=readonly -trimpath -buildvcs=false -ldflags="-s -w -X main.packageVersion=v${package_version}" -tags "$tags" -o "bin/cue-${mode}.wasm" .
done
cp -f bin/cue-engine.wasm bin/cue.wasm
cp -f "$(go env GOROOT)/lib/wasm/wasm_exec.js" bin/
printf '%s\n' '{"type":"commonjs"}' > bin/package.json
node scripts/generate-js.mjs
node scripts/generate-notices.mjs
node scripts/build-manifest.mjs
