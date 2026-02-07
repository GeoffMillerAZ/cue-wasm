FROM node:18-alpine

WORKDIR /app

# Install simple http server
RUN npm install -g http-server

# Copy WASM artifacts from the build context (passed via -v or copy)
# We assume the user mounts the project root to /project
# So we serve /project/workspace/playground as root, but map /bin and /dist

EXPOSE 8080

CMD ["http-server", ".", "-p", "8080", "--cors", "-c-1"]
