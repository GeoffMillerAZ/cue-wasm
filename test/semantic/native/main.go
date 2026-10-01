package main

import (
	"encoding/json"
	"fmt"
	"github.com/GeoffMillerAZ/cue-wasm/internal/core"
	"os"
)

type Case struct {
	Name   string
	Action string
	Args   []json.RawMessage
}

func main() {
	var cases []Case
	if err := json.NewDecoder(os.Stdin).Decode(&cases); err != nil {
		panic(err)
	}
	svc := core.NewCueService()
	out := []map[string]any{}
	for _, c := range cases {
		var result any
		var err error
		str := func(i int) string {
			var s string
			if e := json.Unmarshal(c.Args[i], &s); e != nil {
				panic(e)
			}
			return s
		}
		switch c.Action {
		case "getSymbols":
			result, err = svc.GetSymbols(str(0))
		case "validate":
			err = svc.Validate(str(0), str(1))
			result = true
		case "export":
			result, err = svc.Export(str(0), str(1))
		case "unify":
			var files map[string]string
			var paths, tags []string
			json.Unmarshal(c.Args[0], &files)
			json.Unmarshal(c.Args[1], &paths)
			json.Unmarshal(c.Args[2], &tags)
			result, err = svc.Unify(files, paths, tags)
		default:
			panic("unknown action")
		}
		row := map[string]any{"name": c.Name, "error": err != nil}
		if err == nil {
			row["result"] = result
		}
		out = append(out, row)
	}
	b, err := json.Marshal(out)
	if err != nil {
		panic(err)
	}
	fmt.Println(string(b))
}
