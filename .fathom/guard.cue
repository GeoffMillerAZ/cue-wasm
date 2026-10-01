guards: [
 {scopes: ["package.json", "build.sh", "scripts/generate-js.mjs"], note: "ADR-0002: package closure previously failed despite checkout tests. Run installed archive positive/negative smoke, generated drift checks, and retain matching WASM/shim provenance. Never rely on ambient wasm-opt.", max_rules: 3},
 {scopes: ["internal/js/worker*.js", "internal/react/*.js"], note: "ADR-0001: readiness previously preceded evaluation and callbacks leaked on failure. Preserve explicit capabilities, bounded ownership and promise settlement; verify abort/crash/disposal and actual browser tasks.", max_rules: 3},
 {scopes: ["internal/core/*.go", "main.go"], note: "ADR-0002: validation previously concatenated schema/data and temporary Go callbacks were not released. Preserve schema scope and independent values; run native regressions, rebuilt WASM differential corpus and browser lifecycle. Successful validation is not factual authority.", max_rules: 3},
]
