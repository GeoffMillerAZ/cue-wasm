package core_test

import (
	"strings"
	"testing"

	"github.com/GeoffMillerAZ/cue-wasm/internal/core"
)

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
		name      string
		schema    string
		data      string
		wantErr   bool
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
