package core_test

import (
	"testing"

	"pac/pkg/cue-wasm/internal/core"
)

func TestUnify(t *testing.T) {
	svc := core.NewCueService()

	tests := []struct {
		name    string
		inputs  []string
		want    string
		wantErr bool
	}{
		{
			name:   "Basic Merge",
			inputs: []string{`a: 1`, `b: 2`},
			want:   `{"a":1,"b":2}`,
		},
		{
			name:   "Overwrite/Unify",
			inputs: []string{`a: 1`, `a: int`}, // 1 is an int, so this passes
			want:   `{"a":1}`,
		},
		{
			name:    "Conflict",
			inputs:  []string{`a: 1`, `a: 2`},
			wantErr: true,
		},
		{
			name:    "Syntax Error",
			inputs:  []string{`a: ;`},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := svc.Unify(tt.inputs)
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
		})
	}
}
