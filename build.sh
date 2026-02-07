#!/bin/bash

set -e

# 1. Set Build Target
export GOOS=js
export GOARCH=wasm

# Create bin directory if it doesn't exist
mkdir -p bin

# 2. Build WASM Binaries (Dual Phased Build)

# A. The Reader (Lightweight, Syntax only)
echo "Building cue-reader.wasm..."
go build -ldflags="-s -w" -tags netgo,osusergo,reader -o bin/cue-reader.wasm main.go

# B. The Engine (Full features)
echo "Building cue-engine.wasm..."
go build -ldflags="-s -w" -tags netgo,osusergo -o bin/cue-engine.wasm main.go

# Optimization (Optional)
if command -v wasm-opt &> /dev/null; then
    echo "Optimizing binaries with wasm-opt..."
    wasm-opt -Oz --strip-debug --enable-bulk-memory bin/cue-reader.wasm -o bin/cue-reader.wasm
    wasm-opt -Oz --strip-debug --enable-bulk-memory bin/cue-engine.wasm -o bin/cue-engine.wasm
else
    echo "wasm-opt not found. Skipping extra optimization."
fi

# 3. Copy wasm_exec.js
cp -f "$(go env GOROOT)/lib/wasm/wasm_exec.js" bin/

# 4. Generate JS Loader
VERSION=$(grep '"version":' package.json | head -1 | cut -d '"' -f 4)
mkdir -p dist
sed "s/__VERSION__/$VERSION/g" internal/js/loader.js > dist/index.js
cp internal/js/workspace.js dist/
cp internal/js/worker.js dist/
cp internal/js/worker-manager.js dist/

# 5. Build React Helpers
echo "Building React helpers..."
mkdir -p dist/react
cp internal/react/index.js dist/react/
cp internal/react/index.d.ts dist/react/
# Fix the import path in the built file: ../../dist/index.js -> ../index.js
sed -i '' "s|\.\./\.\./dist/index\.js|\../index.js|g" dist/react/index.js 2>/dev/null || sed -i "s|\.\./\.\./dist/index\.js|\../index.js|g" dist/react/index.js

echo "Build complete."