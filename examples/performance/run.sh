#!/bin/bash
# Build the Docker image
echo "Building Playground Image..."
docker build -f examples/performance/Dockerfile -t cue-wasm-playground .

# Run the container
# We mount the root project directory to /app so the server can see:
# - /examples/performance (The site)
# - /bin (The WASM binaries)
# - /dist (The JS artifacts)
echo "Starting Playground on http://localhost:8080/examples/performance/"
docker run --rm -p 8080:8080 \
  -v "$(pwd):/app" \
  cue-wasm-playground