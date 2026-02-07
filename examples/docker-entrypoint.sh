#!/bin/sh
set -e

echo "========================================"
echo "   cue-wasm Examples (Dockerized)"
echo "========================================"

if [ "$1" = "serve" ]; then
    echo "Starting Browser Playground..."
    echo "Open http://localhost:8080/examples/browser/index.html"
    exec http-server -p 8080 .
elif [ "$1" = "node" ]; then
    echo "Running Node.js Examples..."
    echo "----------------------------------------"
    for f in examples/node/*.cjs; do
        echo ">>> Running $f"
        node "$f"
        echo ""
    done
elif [ "$1" = "shell" ]; then
    exec /bin/sh
else
    echo "Usage:"
    echo "  docker run -p 8080:8080 cue-wasm-demo serve   # Serve Browser Playground"
    echo "  docker run cue-wasm-demo node            # Run all Node.js CLI examples"
    echo "  docker run -it cue-wasm-demo shell       # Interactive Shell"
fi
