package core

import (
	"encoding/json"
	"fmt"
	"strings"

	"cuelang.org/go/cue"
	"cuelang.org/go/cue/ast"
	"cuelang.org/go/cue/cuecontext"
	"cuelang.org/go/cue/errors"
	"cuelang.org/go/cue/format"
	"cuelang.org/go/cue/load"
	"cuelang.org/go/cue/parser"
	"cuelang.org/go/cue/token"
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

// Unify takes a map of filename to cue content, a list of specific paths to load, 
// and a list of tags (key=value). It unifies them and returns the JSON result.
func (s *CueService) Unify(files map[string]string, loadPaths []string, tags []string) (string, error) {
	ctx := cuecontext.New()
	
	overlay := make(map[string]load.Source)
	var allPaths []string
	for name, content := range files {
		// Ensure absolute path for overlay
		path := name
		if !strings.HasPrefix(path, "/") {
			path = "/" + path
		}
		overlay[path] = load.FromString(content)
		allPaths = append(allPaths, path)
	}

	// Use specific load paths if provided, otherwise load all files from overlay
	pathsToLoad := loadPaths
	if len(pathsToLoad) == 0 {
		pathsToLoad = allPaths
	}

	cfg := &load.Config{
		Overlay: overlay,
		Tags:    tags,
		Dir:     "/",
	}

	// If we find a cue.mod/module.cue, CUE load should naturally find it from Dir: "/"
	// but we need to make sure the paths we pass to load.Instances are relative to that root
	// if we want module resolution to work.
	
	// Clean paths for loading
	var cleanLoadPaths []string
	for _, p := range pathsToLoad {
		cp := p
		if strings.HasPrefix(cp, "/") {
			cp = cp[1:]
		}
		cleanLoadPaths = append(cleanLoadPaths, cp)
	}

	bps := load.Instances(cleanLoadPaths, cfg)
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

// Parse takes a CUE string and returns a JSON-encoded AST.
func (s *CueService) Parse(input string) (string, error) {
	// We use the basic parser to get the AST node
	f, err := parser.ParseFile("input.cue", input)
	if err != nil {
		return "", fmt.Errorf("%s", FormatError(err))
	}

	// For now, we return a simple confirmation of success or a flattened JSON.
	// In a full implementation, we would use a Go-to-JSON AST converter.
	// Here, we'll return the formatted version to prove we parsed it.
	b, err := format.Node(f)
	if err != nil {
		return "", fmt.Errorf(`{"message": "format error: %s"}`, err.Error())
	}
	
			return string(b), nil
	
		}
	
		
	
		// Symbol represents a field or package definition in the AST
	
		type Symbol struct {
	
			Name   string `json:"name"`
	
			Type   string `json:"type"`
	
			Line   int    `json:"line"`
	
			Column int    `json:"column"`
	
		}
	
		
	
		// GetSymbols walks the AST and returns a list of symbols
	
		func (s *CueService) GetSymbols(input string) (string, error) {
	
			f, err := parser.ParseFile("input.cue", input, parser.ParseComments)
	
			if err != nil {
	
				return "", fmt.Errorf("%s", FormatError(err))
	
			}
	
		
	
			var symbols []Symbol
	
		
	
			// Helper to add symbols
	
			add := func(name, kind string, pos token.Pos) {
	
				symbols = append(symbols, Symbol{
	
					Name:   name,
	
					Type:   kind,
	
					Line:   pos.Line(),
	
					Column: pos.Column(),
	
				})
	
			}
	
		
	
			// Walk the top-level declarations
	
			for _, decl := range f.Decls {
	
				switch d := decl.(type) {
	
				case *ast.Package:
	
					add(d.Name.Name, "package", d.Pos())
	
				case *ast.Field:
	
					// Extract field name (handles both simple and quoted labels)
	
					if label, _, err := ast.LabelName(d.Label); err == nil {
	
						add(label, "field", d.Label.Pos())
	
					}
	
				}
	
			}
	
		
	
			b, err := json.Marshal(symbols)
	
			if err != nil {
	
				return "", fmt.Errorf(`{"message": "marshal error: %s"}`, err.Error())
	
			}
	
		
	
			return string(b), nil
	
		}
	
		
	
	
	
	// Format parses the input CUE and returns a formatted/simplified version.
	
	// This is equivalent to 'cue fmt'.
	
	func (s *CueService) Format(input string) (string, error) {
	
		f, err := parser.ParseFile("input.cue", input, parser.ParseComments)
	
		if err != nil {
	
			return "", fmt.Errorf("%s", FormatError(err))
	
		}
	
	
	
		b, err := format.Node(f)
	
		if err != nil {
	
			return "", fmt.Errorf(`{"message": "format error: %s"}`, err.Error())
	
		}
	
	
	
		return string(b), nil
	
	}
	
	