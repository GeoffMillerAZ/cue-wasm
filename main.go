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
		"parse":    parseFunc(svc),
		"format":   formatFunc(svc),
		"getSymbols": getSymbolsFunc(svc),
		"version": js.FuncOf(func(this js.Value, args []js.Value) interface{} {
			return js.ValueOf("v1.4.4") // Sync with package.json
		}),
	}))

	fmt.Println("Cue-WASM Ready.")
	
	// Keep the Go program running
	select {}
}

func exportFunc(svc *core.CueService) js.Func {
	return js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		promiseClass := js.Global().Get("Promise")
		return promiseClass.New(js.FuncOf(func(this js.Value, promiseArgs []js.Value) interface{} {
			resolve := promiseArgs[0]
			reject := promiseArgs[1]

			if len(args) < 2 {
				reject.Invoke(js.ValueOf("error: missing arguments"))
				return nil
			}

			code := args[0].String()
			format := args[1].String()

			go func() {
				res, err := svc.Export(code, format)
				if err != nil {
					reject.Invoke(js.ValueOf(err.Error()))
					return
				}
				resolve.Invoke(js.ValueOf(res))
			}()

			return nil
		}))
	})
}

func unifyFunc(svc *core.CueService) js.Func {
	return js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		promiseClass := js.Global().Get("Promise")
		return promiseClass.New(js.FuncOf(func(this js.Value, promiseArgs []js.Value) interface{} {
			resolve := promiseArgs[0]
			reject := promiseArgs[1]

			if len(args) < 1 || args[0].IsNull() || args[0].IsUndefined() {
				reject.Invoke(js.ValueOf("error: first argument must be an object or array"))
				return nil
			}

			// Convert JS Object/Array to Go Map (Files)
			jsFiles := args[0]
			files := make(map[string]string)

			if jsFiles.Type() == js.TypeObject {
				if js.Global().Get("Array").Call("isArray", jsFiles).Bool() {
					for i := 0; i < jsFiles.Length(); i++ {
						files[fmt.Sprintf("input_%d.cue", i)] = jsFiles.Index(i).String()
					}
				} else {
					keys := js.Global().Get("Object").Call("keys", jsFiles)
					for i := 0; i < keys.Length(); i++ {
						key := keys.Index(i).String()
						files[key] = jsFiles.Get(key).String()
					}
				}
			} else {
				reject.Invoke(js.ValueOf("error: first argument must be an object or array"))
				return nil
			}

			// Optional Load Paths
			var loadPaths []string
			if len(args) > 1 && !args[1].IsUndefined() && !args[1].IsNull() {
				jsPaths := args[1]
				loadPaths = make([]string, jsPaths.Length())
				for i := 0; i < jsPaths.Length(); i++ {
					loadPaths[i] = jsPaths.Index(i).String()
				}
			}

			// Optional Tags
			var tags []string
			if len(args) > 2 && !args[2].IsUndefined() && !args[2].IsNull() {
				jsTags := args[2]
				tags = make([]string, jsTags.Length())
				for i := 0; i < jsTags.Length(); i++ {
					tags[i] = jsTags.Index(i).String()
				}
			}

			go func() {
				res, err := svc.Unify(files, loadPaths, tags)
				if err != nil {
					reject.Invoke(js.ValueOf(err.Error()))
					return
				}
				resolve.Invoke(js.ValueOf(res))
			}()

			return nil
		}))
	})
}

func validateFunc(svc *core.CueService) js.Func {
	return js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		promiseClass := js.Global().Get("Promise")
		return promiseClass.New(js.FuncOf(func(this js.Value, promiseArgs []js.Value) interface{} {
			resolve := promiseArgs[0]
			reject := promiseArgs[1]

			if len(args) < 2 {
				reject.Invoke(js.ValueOf("error: missing arguments"))
				return nil
			}

			schema := args[0].String()
			data := args[1].String()

			go func() {
				err := svc.Validate(schema, data)
				if err != nil {
					reject.Invoke(js.ValueOf(err.Error()))
					return
				}
				resolve.Invoke(js.ValueOf(true))
			}()

			return nil
		}))
	})
}

func parseFunc(svc *core.CueService) js.Func {
	return js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		promiseClass := js.Global().Get("Promise")
		return promiseClass.New(js.FuncOf(func(this js.Value, promiseArgs []js.Value) interface{} {
			resolve := promiseArgs[0]
			reject := promiseArgs[1]

			if len(args) < 1 {
				reject.Invoke(js.ValueOf("error: missing arguments"))
				return nil
			}

			code := args[0].String()

			go func() {
				res, err := svc.Parse(code)
				if err != nil {
					reject.Invoke(js.ValueOf(err.Error()))
					return
				}
				resolve.Invoke(js.ValueOf(res))
			}()

			return nil
		}))
	})
}

func formatFunc(svc *core.CueService) js.Func {
	return js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		promiseClass := js.Global().Get("Promise")
		return promiseClass.New(js.FuncOf(func(this js.Value, promiseArgs []js.Value) interface{} {
			resolve := promiseArgs[0]
			reject := promiseArgs[1]

			if len(args) < 1 {
				reject.Invoke(js.ValueOf("error: missing arguments"))
				return nil
			}

			code := args[0].String()

			go func() {
				res, err := svc.Format(code)
				if err != nil {
					reject.Invoke(js.ValueOf(err.Error()))
					return
				}
				resolve.Invoke(js.ValueOf(res))
			}()

			return nil
		}))
	})
}

func getSymbolsFunc(svc *core.CueService) js.Func {
	return js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		promiseClass := js.Global().Get("Promise")
		return promiseClass.New(js.FuncOf(func(this js.Value, promiseArgs []js.Value) interface{} {
			resolve := promiseArgs[0]
			reject := promiseArgs[1]

			if len(args) < 1 {
				reject.Invoke(js.ValueOf("error: missing arguments"))
				return nil
			}

			code := args[0].String()

			go func() {
				res, err := svc.GetSymbols(code)
				if err != nil {
					reject.Invoke(js.ValueOf(err.Error()))
					return
				}
				resolve.Invoke(js.ValueOf(res))
			}()

			return nil
		}))
	})
}