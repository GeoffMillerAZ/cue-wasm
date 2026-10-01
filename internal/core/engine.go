//go:build !reader

package core

import (
	"cuelang.org/go/cue/ast"
	"cuelang.org/go/cue/parser"
	"fmt"
	"sort"
	"strings"

	"cuelang.org/go/cue"
	"cuelang.org/go/cue/cuecontext"
	"cuelang.org/go/cue/format"
	"cuelang.org/go/cue/load"
	"cuelang.org/go/encoding/yaml"
)

// Unify takes a map of filename to cue content, a list of specific paths to load,
// and a list of tags (key=value). It unifies them and returns the JSON result.
func (s *CueService) Unify(files map[string]string, loadPaths []string, tags []string) (string, error) {
	ctx := cuecontext.New()

	const virtualRoot = VirtualRoot
	overlay := make(map[string]load.Source)
	var names []string
	for name := range files {
		names = append(names, name)
	}
	sort.Strings(names)
	var allPaths []string
	for _, name := range names {
		canonical, err := NormalizeVirtualPath(name)
		if err != nil {
			return "", fmt.Errorf("%s", FormatError(err))
		}
		filename := virtualRoot + canonical
		if _, exists := overlay[filename]; exists {
			return "", fmt.Errorf("%s", FormatError(fmt.Errorf("duplicate virtual file identity")))
		}
		overlay[filename] = load.FromString(files[name])
		if !strings.HasPrefix(canonical, "/cue.mod/") {
			allPaths = append(allPaths, filename)
		}
	}
	var pathsToLoad []string
	if len(loadPaths) == 0 {
		pathsToLoad = allPaths
	} else {
		for _, name := range loadPaths {
			canonical, err := NormalizeVirtualPath(name)
			if err != nil {
				return "", fmt.Errorf("%s", FormatError(err))
			}
			filename := virtualRoot + canonical
			if _, exists := overlay[filename]; !exists {
				return "", fmt.Errorf("%s", FormatError(fmt.Errorf("entry point is not a supplied virtual file")))
			}
			pathsToLoad = append(pathsToLoad, filename)
		}
	}
	if len(pathsToLoad) == 0 {
		return "", fmt.Errorf("%s", FormatError(fmt.Errorf("no source entry points")))
	}
	cfg := &load.Config{
		Overlay: overlay, Tags: tags, Dir: virtualRoot, ModuleRoot: virtualRoot,
		Registry: offlineRegistry{}, Env: []string{},
		ParseFile: func(name string, src interface{}, cfg parser.Config) (*ast.File, error) {
			if _, exists := overlay[name]; !exists {
				return nil, fmt.Errorf("file is outside supplied virtual workspace")
			}
			return parser.ParseFile(name, src, cfg)
		},
	}

	bps := load.Instances(pathsToLoad, cfg)
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

func (s *CueService) Validate(schemaStr string, dataStr string) error {
	ctx := cuecontext.New()

	schema := ctx.CompileString(schemaStr, cue.Filename("schema.cue"))
	if schema.Err() != nil {
		return fmt.Errorf("%s", FormatError(schema.Err()))
	}
	data := ctx.CompileString(dataStr, cue.Filename("data.cue"), cue.Scope(schema))
	if data.Err() != nil {
		return fmt.Errorf("%s", FormatError(data.Err()))
	}
	val := schema.Unify(data)
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
