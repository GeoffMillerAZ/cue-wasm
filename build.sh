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

# 3. Copy wasm_exec.js (required for runtime)
echo "Copying wasm_exec.js..."
cp -f "$(go env GOROOT)/lib/wasm/wasm_exec.js" bin/

# 4. Generate JS Loader (Inject Version)
echo "Generating dist/index.js..."
VERSION=$(node -p "require('./package.json').version")
echo "Package Version: $VERSION"

mkdir -p dist
sed "s/__VERSION__/$VERSION/g" internal/js/loader.js > dist/index.js

echo "Build complete. Artifacts in bin/ and dist/"
