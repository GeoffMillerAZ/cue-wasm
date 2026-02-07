package core

import (
	"encoding/json"
	"fmt"

	"cuelang.org/go/cue/ast"
	"cuelang.org/go/cue/errors"
	"cuelang.org/go/cue/format"
	"cuelang.org/go/cue/parser"
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

// Format parses the input CUE and returns a formatted version.
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

// Parse takes a CUE string and returns a confirmation or formatted version.
func (s *CueService) Parse(input string) (string, error) {
	return s.Format(input)
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

	// Recursive walk using ast.Walk
	ast.Walk(f, func(n ast.Node) bool {
		switch d := n.(type) {
		case *ast.Package:
			symbols = append(symbols, Symbol{
				Name:   d.Name.Name,
				Type:   "package",
				Line:   d.Pos().Line(),
				Column: d.Pos().Column(),
			})
		case *ast.Field:
			if label, _, err := ast.LabelName(d.Label); err == nil {
				symbols = append(symbols, Symbol{
					Name:   label,
					Type:   "field",
					Line:   d.Label.Pos().Line(),
					Column: d.Label.Pos().Column(),
				})
			}
		}
		return true
	}, nil)

	b, err := json.Marshal(symbols)
	if err != nil {
		return "", fmt.Errorf(`{"message": "marshal error: %s"}`, err.Error())
	}

	return string(b), nil
}