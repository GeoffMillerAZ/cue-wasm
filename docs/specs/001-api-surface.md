# Specification: API Surface

**Target:** `v1.0.0`
**Status:** DRAFT

## 1. Core Interface (Go)
The Core Service must expose these high-level operations:

```go
type CueService interface {
    // Unify takes a list of Cue strings and returns the unified result as JSON.
    Unify(inputs []string) (string, error)

    // Validate checks if 'concrete' satisfies 'schema'.
    Validate(schema string, concrete string) error

    // Export converts a Cue string to a specific format (JSON, YAML).
    Export(input string, format string) (string, error)
}
```

## 2. JavaScript Bridge (WASM)
The Adapter will expose a global object `CueWasm` with the following methods:

### `CueWasm.unify(files: Record<string, string>, tags?: string[]) : Promise<string>`
*   **Input:** Map of filename to source content, optional array of tags.
*   **Output:** JSON string of the unified result.
*   **Notes:** All files must have the same package name (or none, in which case they are treated as ad-hoc). To be safe, the library will ensure they are in the same build scope.
*   **Errors:** Rejects promise with Cue error message.

### `CueWasm.export(code: string, format: "json" | "yaml" | "cue") : Promise<string>`
*   **Input:** Cuelang source code.
*   **Output:** Formatted string in target format.

### `CueWasm.version() : string`
*   **Output:** Version string of the underlying Cuelang SDK.

### Error Handling
Errors rejected by Promises will be JSON strings (if possible) or plain text:
```json
{
  "message": "field 'a' not found",
  "position": { "line": 10, "column": 4, "file": "input.cue" }
}
```

## 3. Test Scenarios
1.  **Basic Unify:** `["a: 1", "b: 2"]` -> `{"a": 1, "b": 2}`.
2.  **Conflict:** `["a: 1", "a: 2"]` -> Error "conflicting values".
3.  **Validation:** Schema `a: int`, Data `a: "string"` -> Error "mismatched types".
