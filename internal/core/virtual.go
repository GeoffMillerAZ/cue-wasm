package core

import (
	"fmt"
	"strings"
	"unicode/utf8"
)

// VirtualRoot is reserved for supplied files, never host filesystem input.
const VirtualRoot = "/__cue_wasm_workspace__"

// NormalizeVirtualPath accepts relative or root-relative virtual file names, never
// host paths, traversal, URLs, globs or directory selectors. The leading slash is
// virtual and must be remapped before passing a path to an OS-aware loader.
func NormalizeVirtualPath(name string) (string, error) {
	if name == "" || len(name) > 1024 || !utf8.ValidString(name) || strings.ContainsAny(name, "\\\\\x00:*?\r\n") {
		return "", fmt.Errorf("invalid virtual file path")
	}
	name = strings.TrimPrefix(name, "/")
	if len(name)+1 > 1024 {
		return "", fmt.Errorf("virtual file path exceeds byte limit")
	}
	for _, part := range strings.Split(name, "/") {
		if part == "" || part == "." || part == ".." || part == "..." {
			return "", fmt.Errorf("invalid virtual file path")
		}
	}
	return "/" + name, nil
}
