package core_test

import (
	"encoding/json"
	"strings"
	"testing"

	"github.com/GeoffMillerAZ/cue-wasm/internal/core"
)

func TestGetSymbols(t *testing.T) {
	svc := core.NewCueService()
	for _, tc := range []struct {
		name, input, want string
		wantErr           bool
	}{
		{name: "empty", input: "", want: "[]"},
		{name: "symbol-free scalar", input: "42", want: "[]"},
		{name: "field", input: "answer: 42", want: `[{"name":"answer","type":"field","line":1,"column":1}]`},
		{name: "invalid syntax", input: "answer: ;", wantErr: true},
	} {
		t.Run(tc.name, func(t *testing.T) {
			got, err := svc.GetSymbols(tc.input)
			if (err != nil) != tc.wantErr {
				t.Fatalf("GetSymbols() error = %v, wantErr %v", err, tc.wantErr)
			}
			if tc.wantErr {
				var detail core.StructuredError
				if got != "" || json.Unmarshal([]byte(err.Error()), &detail) != nil || detail.Message == "" {
					t.Fatalf("expected empty output and structured error, got %q, %v", got, err)
				}
			} else if got != tc.want {
				t.Fatalf("GetSymbols() = %q, want %q", got, tc.want)
			}
		})
	}
}

func TestUnify(t *testing.T) {
	svc := core.NewCueService()

	tests := []struct {
		name    string
		files   map[string]string
		tags    []string
		want    string
		wantErr bool
	}{
		{
			name:  "Basic Merge",
			files: map[string]string{"a.cue": `a: 1`, "b.cue": `b: 2`},
			want:  `{"a":1,"b":2}`,
		},
		{
			name:  "Overwrite/Unify",
			files: map[string]string{"a.cue": `a: 1`, "schema.cue": `a: int`},
			want:  `{"a":1}`,
		},
		{
			name:    "Conflict",
			files:   map[string]string{"a.cue": `a: 1`, "b.cue": `a: 2`},
			wantErr: true,
		},
		{
			name:    "Syntax Error",
			files:   map[string]string{"a.cue": `a: ;`},
			wantErr: true,
		},
		{
			name:  "With Tags",
			files: map[string]string{"a.cue": `a: string @tag(foo)`},
			want:  `{"a":"bar"}`,
			tags:  []string{"foo=bar"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := svc.Unify(tt.files, nil, tt.tags)
			if (err != nil) != tt.wantErr {
				t.Errorf("Unify() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr && got != tt.want {
				t.Errorf("Unify() got = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestValidate(t *testing.T) {
	svc := core.NewCueService()

	tests := []struct {
		name    string
		schema  string
		data    string
		wantErr bool
	}{
		{
			name:    "Valid",
			schema:  `#User: { name: string, age: int }`,
			data:    `#User & { name: "Alice", age: 30 }`,
			wantErr: false,
		},
		{
			name:    "Invalid Type",
			schema:  `#User: { age: int }`,
			data:    `#User & { age: "old" }`,
			wantErr: true,
		},
		{
			name:    "Missing Field",
			schema:  `#User: { name: string }`,
			data:    `#User & {}`, // name is required
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := svc.Validate(tt.schema, tt.data)
			if (err != nil) != tt.wantErr {
				t.Errorf("Validate() error = %v, wantErr %v", err, tt.wantErr)
			}
			if tt.wantErr && err != nil {
				if !strings.Contains(err.Error(), "message") {
					t.Errorf("Expected structured error JSON, got %v", err)
				}
			}
		})
	}
}

func TestValidateIndependentValues(t *testing.T) {
	svc := core.NewCueService()
	for _, tc := range []struct {
		name, schema, data string
		valid              bool
	}{
		{"scalar", "int & >0", "3", true},
		{"scalar conflict", "int & >0", "-1", false},
		{"list", "[...int]", "[1,2]", true},
		{"list conflict", "[...int]", "[1,\"bad\"]", false},
		{"schema local binding", "let Limit = 10\nx: int & <Limit", "x: 9", true},
		{"data binding cannot override schema", "let Limit = 10\nx: int & <Limit", "let Limit = 100\nx: 90\ny: Limit", false},
		{"data reuses definition", "#User: {name: string}", "#User & {name: \"Ada\"}", true},
		{"incomplete", "x: int", "{}", false},
	} {
		t.Run(tc.name, func(t *testing.T) {
			err := svc.Validate(tc.schema, tc.data)
			if (err == nil) != tc.valid {
				t.Fatalf("valid=%v error=%v", tc.valid, err)
			}
		})
	}
}
