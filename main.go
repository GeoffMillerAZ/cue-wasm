package main

import (
	"fmt"
	"syscall/js"

	"github.com/GeoffMillerAZ/cue-wasm/internal/core"
)

func main() {
	fmt.Println("Cue-WASM Initializing...")
	svc := core.NewCueService()

	// Expose global object
	js.Global().Set("CueWasm", js.ValueOf(map[string]interface{}{
		"unify":    unifyFunc(svc),
		"validate": validateFunc(svc),
		"export":   exportFunc(svc),
		"version": js.FuncOf(func(this js.Value, args []js.Value) interface{} {
			return js.ValueOf("v0.15.4") // Sync with go.mod version manually for now or use build tags
		}),
	}))

	fmt.Println("Cue-WASM Ready.")
	
	// Keep the Go program running
	select {}
}

func exportFunc(svc *core.CueService) js.Func {
	return js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		if len(args) < 2 {
			return js.ValueOf("error: missing arguments")
		}

		code := args[0].String()
		format := args[1].String()

		handler := js.FuncOf(func(this js.Value, promiseArgs []js.Value) interface{} {
			resolve := promiseArgs[0]
			reject := promiseArgs[1]

			go func() {
				res, err := svc.Export(code, format)
				if err != nil {
					reject.Invoke(js.ValueOf(err.Error()))
					return
				}
				resolve.Invoke(js.ValueOf(res))
			}()

			return nil
		})

		promiseClass := js.Global().Get("Promise")
		return promiseClass.New(handler)
	})
}

func unifyFunc(svc *core.CueService) js.Func {
	return js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		if len(args) < 1 {
			return js.ValueOf("error: missing arguments")
		}

		// Convert JS Object/Array to Go Map (Files)
		jsFiles := args[0]
		files := make(map[string]string)

		if jsFiles.Type() == js.TypeObject {
			if js.Global().Get("Array").Call("isArray", jsFiles).Bool() {
				// It's an array, generate names
				for i := 0; i < jsFiles.Length(); i++ {
					files[fmt.Sprintf("input_%d.cue", i)] = jsFiles.Index(i).String()
				}
			} else {
				// It's a map/object
				keys := js.Global().Get("Object").Call("keys", jsFiles)
				for i := 0; i < keys.Length(); i++ {
					key := keys.Index(i).String()
					files[key] = jsFiles.Get(key).String()
				}
			}
		} else {
			return js.ValueOf("error: first argument must be an object or array")
		}

		// Optional Tags
		var tags []string
		if len(args) > 1 && !args[1].IsUndefined() && !args[1].IsNull() {
			jsTags := args[1]
			tags = make([]string, jsTags.Length())
			for i := 0; i < jsTags.Length(); i++ {
				tags[i] = jsTags.Index(i).String()
			}
		}

		handler := js.FuncOf(func(this js.Value, promiseArgs []js.Value) interface{} {
			resolve := promiseArgs[0]
			reject := promiseArgs[1]

			go func() {
				res, err := svc.Unify(files, tags)
				if err != nil {
					reject.Invoke(js.ValueOf(err.Error()))
					return
				}
				resolve.Invoke(js.ValueOf(res))
			}()

			return nil
		})

		promiseClass := js.Global().Get("Promise")
		return promiseClass.New(handler)
	})
}

func validateFunc(svc *core.CueService) js.Func {
	return js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		if len(args) < 2 {
			return js.ValueOf("error: missing arguments")
		}

		schema := args[0].String()
		data := args[1].String()

		handler := js.FuncOf(func(this js.Value, promiseArgs []js.Value) interface{} {
			resolve := promiseArgs[0]
			reject := promiseArgs[1]

			go func() {
				err := svc.Validate(schema, data)
				if err != nil {
					reject.Invoke(js.ValueOf(err.Error()))
					return
				}
				resolve.Invoke(js.ValueOf(true))
			}()

			return nil
		})

		promiseClass := js.Global().Get("Promise")
		return promiseClass.New(handler)
	})
}
