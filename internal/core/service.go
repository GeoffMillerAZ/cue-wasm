package core

import (
	"fmt"

	"cuelang.org/go/cue"
	"cuelang.org/go/cue/cuecontext"
)

type CueService struct{}

func NewCueService() *CueService {
	return &CueService{}
}

// Unify takes multiple cue strings, unifies them, and returns the formatted Cuelang string result (or JSON/YAML if we expand).
// For now, let's return the Result as a JSON string for easy JS consumption.
func (s *CueService) Unify(inputs []string) (string, error) {
	ctx := cuecontext.New()
	var val cue.Value

	for _, input := range inputs {
		v := ctx.CompileString(input)
		if v.Err() != nil {
			return "", fmt.Errorf("compile error: %w", v.Err())
		}
		if val.Exists() {
			val = val.Unify(v)
		} else {
			val = v
		}
	}

	if err := val.Validate(); err != nil {
		return "", fmt.Errorf("validation error: %w", err)
	}

	// Export to JSON
	// We use the JSON encoder provided by Cue? Or just Marshal?
	// val.MarshalJSON() is convenient.
	jsonBytes, err := val.MarshalJSON()
	if err != nil {
		return "", fmt.Errorf("json marshal error: %w", err)
	}

	return string(jsonBytes), nil
}

func (s *CueService) Validate(schemaStr string, dataStr string) error {
	ctx := cuecontext.New()
	
	// Compile together to share scope (e.g. definitions)
	val := ctx.CompileString(schemaStr + "\n" + dataStr)
	if val.Err() != nil {
		return fmt.Errorf("compile error: %w", val.Err())
	}

	return val.Validate(cue.Concrete(true))
}
