# Maintainer Guide: Extracting Cue-WASM

This guide details the steps to extract `pkg/cue-wasm` into its own standalone repository, publish it, and reintegrate it back into PAC-CLI.

## 1. Extraction Strategy (Git Subtree)

To preserve commit history while moving the folder:

### A. Create New Repository
1.  Create a new empty repo on GitHub: `git@github.com:GeoffMillerAZ/cue-wasm.git`.

### B. Extract and Push
Run these commands from the root of `poc--google-gen-ai-sdk`:

```bash
# 1. Create a synthetic branch containing only the pkg/cue-wasm history
git subtree split --prefix=pkg/cue-wasm -b split-cue-wasm

# 2. Push this branch to the new repo's main branch
git push git@github.com:GeoffMillerAZ/cue-wasm.git split-cue-wasm:main

# 3. Clean up local branch
git branch -D split-cue-wasm
```

## 2. Setting up the New Repo

Once the code is in the new repo, you need to "Hydrate" it to be a proper Go/Node module.

### A. Initialize
1.  `go mod init github.com/GeoffMillerAZ/cue-wasm`
2.  `go mod tidy`
3.  Update `package.json` with correct repository links.

### B. CI/CD (GitHub Actions)
Create `.github/workflows/release.yml`:
*   Trigger: `on: release`
*   Job 1: Run `build.sh`.
*   Job 2: Upload `bin/cue.wasm` to GitHub Releases.
*   Job 3: `npm publish` (see below).

## 3. Publishing to Package Managers

### A. NPM (JavaScript)
1.  Create an account on `npmjs.com`.
2.  Login locally: `npm login`.
3.  Publish:
    ```bash
    # Ensure build is fresh
    ./build.sh
    # Publish from the root (where package.json is)
    npm publish --access public
    ```
4.  **Note:** The package name `@pac/cue-wasm` requires an NPM Org. Use `cue-wasm-go` or similar if you don't have an Org.

### B. Go Packages
Go modules are decentralized. Merely pushing the code to GitHub makes it available.
*   Users install via: `go get github.com/GeoffMillerAZ/cue-wasm`
*   Register documentation: Visit `pkg.go.dev/github.com/GeoffMillerAZ/cue-wasm` to trigger the crawler.

## 4. Re-integration into PAC-CLI

Once published, you have two options to use it here:

### Option A: Go Module (Backend)
Replace the local `pkg/cue-wasm` usage with the remote module.
1.  Delete `pkg/cue-wasm`.
2.  `go get github.com/GeoffMillerAZ/cue-wasm`.
3.  Update imports in `cmd/pac-cli/main.go`.

### Option B: NPM Module (Frontend)
When building the Web UI (Phase 4):
1.  `npm install @pac/cue-wasm`
2.  Load it in your React/Vue app.

## 5. Marketing & Community

### A. "Show HN" Prompt
> Title: Show HN: Run Cuelang in the Browser with WebAssembly
>
> I built a lightweight WASM wrapper for Cuelang that lets you Validate, Unify, and Export configs entirely client-side. It supports a Promise-based API and structured error handling.
>
> Repo: [Link]
> Demo: [Link to index.html hosted on GitHub Pages]

### B. Cuelang Slack Message
> "Hey everyone, I needed to validate some schemas in a React app, so I wrapped the Go SDK in WASM. It supports Overlays and Tags. Thought it might be useful for anyone building config UIs: [Link]"

### C. GitHub Artifacts?
**Is it worth it?**
*   **Yes:** For the `cue.wasm` binary itself.
*   **Why?** Users who don't want to run `go build` can just `curl -L` the binary from your GitHub Release page.
