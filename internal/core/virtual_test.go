package core_test

import (
	"encoding/json"
	"github.com/GeoffMillerAZ/cue-wasm/internal/core"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"sync/atomic"
	"testing"
)

func TestVirtualPathBoundary(t *testing.T) {
	for _, bad := range []string{"", "/", "../x.cue", "a/../x.cue", "./a.cue", "a//b.cue", "//a.cue", "a\\b.cue", "a\x00b", "https://x/a.cue", "x?", "x*", "...", strings.Repeat("x", 1024), "x:", string([]byte{0xff})} {
		if _, err := core.NormalizeVirtualPath(bad); err == nil {
			t.Errorf("accepted %q", bad)
		}
	}
	for _, good := range []string{"a.cue", "/a.cue", "nested/λ.cue", "cue.mod/module.cue", strings.Repeat("x", 1023)} {
		p, err := core.NormalizeVirtualPath(good)
		if err != nil {
			t.Fatal(err)
		}
		again, err := core.NormalizeVirtualPath(p)
		if err != nil || p != again {
			t.Fatalf("not idempotent %q", p)
		}
	}
}
func TestUnifyRejectsUnsuppliedHostEntryAndAlias(t *testing.T) {
	svc := core.NewCueService()
	file, err := os.CreateTemp(t.TempDir(), "private-*.cue")
	if err != nil {
		t.Fatal(err)
	}
	if _, err = file.WriteString(`secret: "HOST_SENTINEL"`); err != nil {
		t.Fatal(err)
	}
	file.Close()
	for _, paths := range [][]string{{file.Name()}, {"../escape.cue"}, {"."}, {"..."}} {
		result, err := svc.Unify(map[string]string{"a.cue": "a:1"}, paths, nil)
		if err == nil || strings.Contains(result, "HOST_SENTINEL") {
			t.Fatalf("outside entry admitted: %s %v", result, err)
		}
	}
	if _, err := svc.Unify(map[string]string{"a.cue": "a:1", "/a.cue": "a:2"}, nil, nil); err == nil {
		t.Fatal("alias collision accepted")
	}
}
func TestUnifyLocalModuleAndBuiltinWithoutRegistry(t *testing.T) {
	svc := core.NewCueService()
	files := map[string]string{
		"cue.mod/module.cue": `module: "example.test/work@v0"
language: version: "v0.12.0"`,
		"main.cue": `package main
import "example.test/work/lib"
import "strings"
answer: lib.value
label: strings.ToUpper("app")`,
		"lib/lib.cue": `package lib
value: 42`,
	}
	got, err := svc.Unify(files, []string{"main.cue"}, nil)
	if err != nil {
		t.Fatal(err)
	}
	if got != `{"answer":42,"label":"APP"}` {
		t.Fatal(got)
	}
}
func TestUnifyExternalRegistryIsExplicitlyOffline(t *testing.T) {
	var requests atomic.Int64
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { requests.Add(1); w.WriteHeader(500) }))
	defer server.Close()
	t.Setenv("CUE_REGISTRY", strings.TrimPrefix(server.URL, "http://")+"+insecure")
	svc := core.NewCueService()
	_, err := svc.Unify(map[string]string{
		"cue.mod/module.cue": `module: "example.test/work@v0"
language: version: "v0.12.0"
deps: "example.test/remote@v0": v: "v0.1.0"`,
		"main.cue": `package main
import "example.test/remote"
x: remote.value`,
	}, []string{"main.cue"}, nil)
	if err == nil {
		t.Fatal("external dependency admitted")
	}
	if requests.Load() != 0 {
		t.Fatalf("made %d registry requests", requests.Load())
	}
}
func FuzzNormalizeVirtualPath(f *testing.F) {
	for _, seed := range []string{"a.cue", "/nested/λ.cue", "../escape.cue", "https://a", "a\x00b", "//x"} {
		f.Add(seed)
	}
	f.Fuzz(func(t *testing.T, name string) {
		p, err := core.NormalizeVirtualPath(name)
		if err != nil {
			return
		}
		if !strings.HasPrefix(p, "/") || strings.Contains(p, "\\") {
			t.Fatalf("invalid canonical path %q", p)
		}
		again, err := core.NormalizeVirtualPath(p)
		if err != nil || again != p {
			t.Fatalf("not idempotent %q", p)
		}
	})
}

func TestUnifyDiagnosticUsesVirtualFileAnchor(t *testing.T) {
	_, err := core.NewCueService().Unify(map[string]string{"nested/main.cue": "value: ;"}, []string{"nested/main.cue"}, nil)
	if err == nil {
		t.Fatal("invalid source accepted")
	}
	var diagnostic core.StructuredError
	if e := json.Unmarshal([]byte(err.Error()), &diagnostic); e != nil {
		t.Fatal(e)
	}
	if diagnostic.File != "/nested/main.cue" || diagnostic.Line != 1 {
		t.Fatalf("wrong virtual anchor: %+v", diagnostic)
	}
}
