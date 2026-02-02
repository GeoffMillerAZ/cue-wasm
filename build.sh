#!/bin/bash

set -e

# 1. Set Build Target
export GOOS=js
export GOARCH=wasm

# 2. Build WASM
echo "Building cue.wasm..."
go build -o pkg/cue-wasm/bin/cue.wasm pkg/cue-wasm/main.go

# 3. Copy wasm_exec.js (required for runtime)
echo "Copying wasm_exec.js..."
cp "$(go env GOROOT)/lib/wasm/wasm_exec.js" pkg/cue-wasm/bin/

echo "Build complete. Artifacts in pkg/cue-wasm/bin/"
