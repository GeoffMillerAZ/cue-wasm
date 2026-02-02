package main

import (
	"fmt"
	"syscall/js"

	"pac/pkg/cue-wasm/internal/core"
)

func main() {
	fmt.Println("Cue-WASM Initializing...")
	svc := core.NewCueService()

	// Expose global object
	js.Global().Set("CueWasm", js.ValueOf(map[string]interface{}{
		"unify":    unifyFunc(svc),
		"validate": validateFunc(svc),
	}))

	fmt.Println("Cue-WASM Ready.")
	
	// Keep the Go program running
	select {}
}

func unifyFunc(svc *core.CueService) js.Func {
	return js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		if len(args) < 1 {
			return js.ValueOf("error: missing arguments")
		}

		// Convert JS Array to Go Slice
		jsInputs := args[0]
		inputs := make([]string, jsInputs.Length())
		for i := 0; i < jsInputs.Length(); i++ {
			inputs[i] = jsInputs.Index(i).String()
		}

		// We use a Promise to handle the async nature of the work if needed,
		// though Cue unification is synchronous in Go. 
		// To match the Spec's Promise return type:
		handler := js.FuncOf(func(this js.Value, promiseArgs []js.Value) interface{} {
			resolve := promiseArgs[0]
			reject := promiseArgs[1]

			go func() {
				res, err := svc.Unify(inputs)
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
