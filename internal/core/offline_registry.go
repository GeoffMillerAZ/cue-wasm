//go:build !reader

package core

import (
	"context"
	"cuelang.org/go/mod/module"
	"fmt"
)

// No environment credentials, registry requests or module cache fetches are allowed
// on the embedded path. A host must supply its local sources explicitly.
type offlineRegistry struct{}

func (offlineRegistry) Requirements(context.Context, module.Version) ([]module.Version, error) {
	return nil, fmt.Errorf("external module resolution is disabled")
}
func (offlineRegistry) Fetch(context.Context, module.Version) (module.SourceLoc, error) {
	return module.SourceLoc{}, fmt.Errorf("external module resolution is disabled")
}
func (offlineRegistry) ModuleVersions(context.Context, string) ([]string, error) {
	return nil, fmt.Errorf("external module resolution is disabled")
}
