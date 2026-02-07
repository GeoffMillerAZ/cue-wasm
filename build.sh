#!/bin/bash

set -e

# 1. Set Build Target
export GOOS=js
export GOARCH=wasm

# Create bin directory if it doesn't exist
mkdir -p bin

# 2. Build WASM
echo "Building cue.wasm..."
go build -ldflags="-s -w" -tags netgo,osusergo -o bin/cue.wasm main.go

# Optimization (Optional)
if command -v wasm-opt &> /dev/null; then
    echo "Optimizing cue.wasm with wasm-opt..."
    wasm-opt -Oz --strip-debug --enable-bulk-memory bin/cue.wasm -o bin/cue.wasm
else
    echo "wasm-opt not found. Skipping extra optimization."
    echo "Tip: Install binaryen (wasm-opt) for smaller builds."
fi

# 3. Copy wasm_exec.js (required for runtime)
echo "Copying wasm_exec.js..."
cp -f "$(go env GOROOT)/lib/wasm/wasm_exec.js" bin/

# 4. Generate JS Loader (Inject Version)
echo "Generating dist/index.js..."
VERSION=$(grep '"version":' package.json | head -1 | cut -d '"' -f 4)
echo "Package Version: $VERSION"

mkdir -p dist
sed "s/__VERSION__/$VERSION/g" internal/js/loader.js > dist/index.js
cp internal/js/workspace.js dist/

# 5. Build React Helpers
echo "Building React helpers..."
mkdir -p dist/react
# Copy source
cp internal/react/index.js dist/react/
cp internal/react/index.d.ts dist/react/
# Fix the require path in the built file: ../../dist/index.js -> ../index.js
sed -i '' "s|\.\./\.\./dist/index\.js|\../index.js|g" dist/react/index.js 2>/dev/null || sed -i "s|\.\./\.\./dist/index\.js|\../index.js|g" dist/react/index.js

echo "Build complete. Artifacts in bin/ and dist/"
