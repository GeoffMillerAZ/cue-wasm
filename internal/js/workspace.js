/**
 * Workspace manages an in-memory file system for CUE projects.
 * It ensures paths are normalized and provides the 'Overlay' format
 * required by the CUE WASM engine.
 */
class Workspace {
    constructor() {
        /** @type {Map<string, string>} */
        this.files = new Map();
        /** @type {Set<string>} */
        this.entryPoints = new Set();
        /** @type {string|null} */
        this.moduleName = null;
    }

    /**
     * Sets the CUE module name and initializes the cue.mod/module.cue file.
     * @param {string} name e.g. "github.com/acme/config"
     * @param {string} version e.g. "v0.12.0"
     */
    setModule(name, version = "v0.12.0") {
        this.moduleName = name;
        this.addFile('cue.mod/module.cue', `module: "${name}"\nlanguage: version: "${version}"`);
    }

    /**
     * Adds or updates a file in the workspace.
     */
    addFile(path, content, isEntryPoint = false) {
        if (!path || typeof path !== 'string' || path.trim() === '') {
            throw new Error('Invalid path: path must be a non-empty string');
        }
        
        let normalized = path.startsWith('/') ? path : '/' + path;
        normalized = normalized.replace(/\/+$/, '');
        
        this.files.set(normalized, content);
        if (isEntryPoint) {
            this.entryPoints.add(normalized);
        }
    }

    /**
     * Removes a file from the workspace.
     */
    removeFile(path) {
        const normalized = path.startsWith('/') ? path : '/' + path;
        this.files.delete(normalized);
        this.entryPoints.delete(normalized);
    }

    /**
     * Returns the list of entry point paths.
     */
    getEntryPoints() {
        return Array.from(this.entryPoints);
    }

    /**
     * Generates a flat object mapping paths to contents.
     */
    getOverlay() {
        const overlay = {};
        for (const [path, content] of this.files) {
            overlay[path] = content;
        }
        return overlay;
    }

    /**
     * Validates the syntax of a specific file in the workspace using the provided CUE engine.
     * @param {string} path The file to validate.
     * @param {any} cue The loaded CUE WASM instance.
     * @returns {Promise<{valid: boolean, error?: any}>}
     */
    async validateSyntax(path, cue) {
        const normalized = path.startsWith('/') ? path : '/' + path;
        const content = this.files.get(normalized);
        if (!content) throw new Error(`File not found: ${path}`);

        try {
            await cue.parse(content);
            return { valid: true };
        } catch (e) {
            try {
                return { valid: false, error: JSON.parse(e) };
            } catch (_) {
                return { valid: false, error: { message: e } };
            }
        }
    }

    /**
     * Clears all files from the workspace.
     */
    clear() {
        this.files.clear();
        this.entryPoints.clear();
        this.moduleName = null;
    }
}

module.exports = { Workspace };