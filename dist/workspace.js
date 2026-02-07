/**
 * Workspace manages an in-memory file system for CUE projects.
 */
export class Workspace {
    constructor() {
        this.files = new Map();
        this.entryPoints = new Set();
        this.moduleName = null;
    }

    setModule(name, version = "v0.12.0") {
        this.moduleName = name;
        this.addFile('cue.mod/module.cue', `module: "${name}"\nlanguage: version: "${version}"`);
    }

    addFile(path, content, isEntryPoint = false) {
        if (!path || typeof path !== 'string' || path.trim() === '') {
            throw new Error('Invalid path');
        }
        let normalized = path.startsWith('/') ? path : '/' + path;
        normalized = normalized.replace(/\/+$/, '');
        this.files.set(normalized, content);
        if (isEntryPoint) this.entryPoints.add(normalized);
    }

    removeFile(path) {
        const normalized = path.startsWith('/') ? path : '/' + path;
        this.files.delete(normalized);
        this.entryPoints.delete(normalized);
    }

    getEntryPoints() { return Array.from(this.entryPoints); }

    getOverlay() {
        const overlay = {};
        for (const [path, content] of this.files) overlay[path] = content;
        return overlay;
    }

    async validateSyntax(path, cue) {
        const normalized = path.startsWith('/') ? path : '/' + path;
        const content = this.files.get(normalized);
        try {
            await cue.parse(content);
            return { valid: true };
        } catch (e) {
            try { return { valid: false, error: JSON.parse(e) }; }
            catch (_) { return { valid: false, error: { message: e } }; }
        }
    }

    async formatFile(path, cue) {
        const normalized = path.startsWith('/') ? path : '/' + path;
        const content = this.files.get(normalized);
        const formatted = await cue.format(content);
        this.files.set(normalized, formatted);
        return formatted;
    }

    async getSymbols(path, cue) {
        const normalized = path.startsWith('/') ? path : '/' + path;
        const content = this.files.get(normalized);
        const json = await cue.getSymbols(content);
        return JSON.parse(json);
    }

    clear() {
        this.files.clear();
        this.entryPoints.clear();
        this.moduleName = null;
    }
}
