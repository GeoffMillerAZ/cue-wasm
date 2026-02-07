//go:build !reader

package core

import (
	"fmt"
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