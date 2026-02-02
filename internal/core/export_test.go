package core_test

import (
	"strings"
	"testing"

	"github.com/GeoffMillerAZ/cue-wasm/internal/core"
)

func TestExport(t *testing.T) {
	svc := core.NewCueService()
	input := `
a: 1
b: "two"
`

	tests := []struct {
		name    string
		format  string
		want    string
		wantErr bool
	}{
		{"JSON", "json", `{"a":1,"b":"two"}`, false},
		{"YAML", "yaml", "a: 1\nb: two\n", false},
		{"Cue", "cue", "{\n\ta: 1\n\tb: \"two\"\n}", false},
		{"Invalid", "xml", "", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := svc.Export(input, tt.format)
			if (err != nil) != tt.wantErr {
				t.Errorf("Export() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr {
				// Trim whitespace for easier comparison
				got = strings.TrimSpace(got)
				want := strings.TrimSpace(tt.want)
				if got != want {
					t.Errorf("Export() got = %q, want %q", got, want)
				}
			}
		})
	}
}
