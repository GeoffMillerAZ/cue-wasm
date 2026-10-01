/** Adapt only the reserved overlay mount; never provide a host filesystem. */
export function prepareVirtualFilesystem(host = globalThis) {
    const backing = host.fs;
    if (!backing) throw new Error('Load the matching Go shim before preparing the filesystem');
    // Go captures this constant during package initialization, before main runs.
    // Its browser stub uses -1, rejecting directory reads before consulting fs.open.
    const filesystem = {...backing, constants: {...backing.constants}};
    if (filesystem.constants.O_DIRECTORY === -1) filesystem.constants.O_DIRECTORY = 0;
    const root = '/__cue_wasm_workspace__';
    for (const name of ['open', 'stat', 'lstat', 'readdir']) {
        filesystem[name] = function(path, ...args) {
            if (typeof path === 'string' && (path === root || path.startsWith(root + '/'))) {
                args.at(-1)(Object.assign(new Error('No backing file for virtual workspace'), {code: 'ENOENT'}));
                return;
            }
            return backing[name].call(backing, path, ...args);
        };
    }
    host.fs = filesystem;
}
