export interface CueError {
    message: string;
    line?: number;
    column?: number;
    file?: string;
}

export type Format = 'json' | 'yaml' | 'cue';

export interface CueWasmInstance {
    /**
     * Merges multiple Cuelang strings into a single unified JSON string.
     * @param inputs Array of Cuelang source strings.
     * @param tags Optional array of tags (e.g., ["foo=bar"])
     * @returns JSON string of the result.
     */
    unify(inputs: string[], tags?: string[]): Promise<string>;

    /**
     * Validates that 'data' satisfies 'schema'.
     * @param schema Cuelang schema string.
     * @param data Cuelang or JSON data string.
     * @returns true if valid, throws StructuredError if invalid.
     */
    validate(schema: string, data: string): Promise<boolean>;

    /**
     * Converts Cuelang code to a specific format.
     * @param code Cuelang source string.
     * @param format Target format ('json', 'yaml', 'cue').
     */
    export(code: string, format: Format): Promise<string>;
}

declare global {
    const CueWasm: CueWasmInstance;
}
