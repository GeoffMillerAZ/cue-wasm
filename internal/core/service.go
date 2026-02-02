package core

import (
	"encoding/json"
	"fmt"
	"strings"

	"cuelang.org/go/cue"
	"cuelang.org/go/cue/cuecontext"
	"cuelang.org/go/cue/errors"
	"cuelang.org/go/cue/format"
	"cuelang.org/go/cue/load"
	"cuelang.org/go/encoding/yaml"
)

type CueService struct{}

func NewCueService() *CueService {
	return &CueService{}
}

// StructuredError represents a parse/validation error
type StructuredError struct {
	Message string `json:"message"`
	Line    int    `json:"line,omitempty"`
	Column  int    `json:"column,omitempty"`
	File    string `json:"file,omitempty"`
}

// Unify takes a map of filename to cue content and a list of tags (key=value), 
// unifies them, and returns the JSON result.
func (s *CueService) Unify(files map[string]string, tags []string) (string, error) {
	ctx := cuecontext.New()
	
	overlay := make(map[string]load.Source)
	var paths []string
	for name, content := range files {
		// Ensure absolute path for overlay
		path := name
		if !strings.HasPrefix(path, "/") {
			path = "/" + path
		}
		overlay[path] = load.FromString(content)
		paths = append(paths, path)
	}

	cfg := &load.Config{
		Overlay: overlay,
		Tags:    tags,
		Dir:     "/",
	}

	bps := load.Instances(paths, cfg)
	if len(bps) == 0 {
		return "", fmt.Errorf(`{"message": "failed to load instances"}`)
	}

	var final cue.Value
	for _, bp := range bps {
		if bp.Err != nil {
			return "", fmt.Errorf("%s", FormatError(bp.Err))
		}
		v := ctx.BuildInstance(bp)
		if v.Err() != nil {
			return "", fmt.Errorf("%s", FormatError(v.Err()))
		}
		if !final.Exists() {
			final = v
		} else {
			final = final.Unify(v)
		}
	}

	if err := final.Validate(); err != nil {
		return "", fmt.Errorf("%s", FormatError(err))
	}

	jsonBytes, err := final.MarshalJSON()
	if err != nil {
		return "", fmt.Errorf(`{"message": "json marshal error: %s"}`, err.Error())
	}

	return string(jsonBytes), nil
}

// formatError attempts to extract structured info from a cue error
func FormatError(err error) string {
	if err == nil {
		return ""
	}
	
	msg := err.Error()
	sErr := StructuredError{Message: msg}

	// Try to unwrap specific cue errors
	if cErr := errors.Errors(err); len(cErr) > 0 {
		first := cErr[0]
		pos := first.Position()
		fMsg, args := first.Msg()
		formatted := fmt.Sprintf(fMsg, args...)
		if formatted != "" {
			sErr.Message = formatted
		}
		sErr.Line = pos.Line()
		sErr.Column = pos.Column()
		sErr.File = pos.Filename()
	}

	b, _ := json.Marshal(sErr)
	return string(b)
}

func (s *CueService) Validate(schemaStr string, dataStr string) error {
	ctx := cuecontext.New()
	
	val := ctx.CompileString(schemaStr + "\n" + dataStr)
	if val.Err() != nil {
		return fmt.Errorf("%s", FormatError(val.Err()))
	}

	if err := val.Validate(cue.Concrete(true)); err != nil {
		return fmt.Errorf("%s", FormatError(err))
	}
	return nil
}

func (s *CueService) Export(input string, targetFmt string) (string, error) {
	ctx := cuecontext.New()
	val := ctx.CompileString(input)
	if val.Err() != nil {
		return "", fmt.Errorf("%s", FormatError(val.Err()))
	}

	if err := val.Validate(cue.Concrete(true)); err != nil {
		return "", fmt.Errorf("%s", FormatError(err))
	}

	switch targetFmt {
	case "json":
		b, err := val.MarshalJSON()
		return string(b), err
	case "yaml":
		b, err := yaml.Encode(val)
		return string(b), err
	case "cue":
		node := val.Syntax(cue.Final())
		b, err := format.Node(node)
		return string(b), err
	default:
		return "", fmt.Errorf(`{"message": "unsupported format: %s"}`, targetFmt)
	}
}