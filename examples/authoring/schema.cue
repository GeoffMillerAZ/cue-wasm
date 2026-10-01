import "list"

#Panel: {
    title: string & =~"^.{1,80}$"
    kind: "diagram" | "table" | "timeline"
    limit: *100 | (int & >=1 & <=1000)
}
#Config: {
    format: *"cue-wasm.authoring-example.v1" | "cue-wasm.authoring-example.v1"
    title: string & =~"^.{1,80}$"
    appearance: *"dark" | "light"
    accent: *"#818cf8" | (string & =~"^#[0-9A-Fa-f]{6}$")
    panels: [...#Panel] & list.MinItems(1) & list.MaxItems(6)
}
#Config
// Embedding a definition permits sibling fields; reject unknown exported keys explicitly.
[string & !~"^(format|title|appearance|accent|panels)$"]: _|_
