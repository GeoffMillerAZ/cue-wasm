/** Virtual sources stay owned by the host; asynchronous helpers never overwrite newer drafts. */
const fault=(code,message)=>Object.assign(new Error(message),{code});
const normalizedPath=path=>{
    if(typeof path!=='string'||!path||path.length>1024||new TextEncoder().encode(path).length>1024||/[\\\u0000:*?\r\n\uD800-\uDFFF]/u.test(path))throw fault('path','Invalid virtual file path');
    const relative=path.startsWith('/')?path.slice(1):path;
    if(relative.split('/').some(part=>!part||part==='.'||part==='..'||part==='...'))throw fault('path','Invalid virtual file path');
    if(new TextEncoder().encode('/'+relative).length>1024)throw fault('path','Virtual file path exceeds byte limit');
    return '/'+relative;
};
export class Workspace {
    #sequence=0; #versions=new Map();
    constructor(){this.files=new Map();this.entryPoints=new Set();this.moduleName=null;}
    setModule(name,version='v0.12.0'){
        if(typeof name!=='string'||!name||name.length>1024||typeof version!=='string'||!/^v\d+\.\d+\.\d+$/.test(version))throw fault('module','Invalid module identity or language version');
        this.addFile('cue.mod/module.cue',`module: ${JSON.stringify(name)}\nlanguage: version: ${JSON.stringify(version)}`);
        this.moduleName=name;
    }
    addFile(path,content,isEntryPoint=false){
        const key=normalizedPath(path);if(typeof content!=='string')throw fault('input','Source must be a string');
        this.files.set(key,content);this.#versions.set(key,++this.#sequence);
        if(isEntryPoint)this.entryPoints.add(key);
    }
    removeFile(path){const key=normalizedPath(path);this.files.delete(key);this.entryPoints.delete(key);this.#versions.delete(key);++this.#sequence;}
    getEntryPoints(){return [...this.entryPoints];}
    getOverlay(){return Object.fromEntries(this.files);}
    #capture(path){
        const key=normalizedPath(path);if(!this.files.has(key))throw fault('missing','Virtual file does not exist');
        return {key,source:this.files.get(key),version:this.#versions.get(key)};
    }
    #current(draft){
        if(!this.files.has(draft.key)||this.files.get(draft.key)!==draft.source||this.#versions.get(draft.key)!==draft.version)throw fault('stale_result','Source changed while the operation was running');
    }
    async validateSyntax(path,cue){
        const draft=this.#capture(path);let error,failed=false;
        try{await cue.parse(draft.source);}catch(e){error=e;failed=true;}
        this.#current(draft);
        if(failed){
            const text=error instanceof Error?error.message:String(error);
            try{return {valid:false,error:JSON.parse(text)};}catch{return {valid:false,error:{message:text}};}
        }
        return {valid:true};
    }
    async formatFile(path,cue){
        const draft=this.#capture(path),formatted=await cue.format(draft.source);
        this.#current(draft);this.addFile(draft.key,formatted);return formatted;
    }
    async getSymbols(path,cue){
        const draft=this.#capture(path),result=await cue.getSymbols(draft.source);
        this.#current(draft);return JSON.parse(result);
    }
    clear(){this.files.clear();this.entryPoints.clear();this.#versions.clear();this.moduleName=null;++this.#sequence;}
}
