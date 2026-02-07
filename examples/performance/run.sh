#!/bin/bash
# Build the Docker image
echo "Building Playground Image..."
docker build -f examples/performance/Dockerfile -t cue-wasm-playground .

# Stop existing container if any
docker stop cue-wasm-playground-instance 2>/dev/null || true

# Run the container in background
echo "Starting Playground on http://localhost:9876/examples/performance/"
docker run -d --name cue-wasm-playground-instance --rm -p 9876:8080 \
  -v "$(pwd):/app" \
  cue-wasm-playground

echo "Container started. Logs available with: docker logs -f cue-wasm-playground-instance"
