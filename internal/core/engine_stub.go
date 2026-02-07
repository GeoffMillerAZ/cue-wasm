//go:build reader

package core

import "fmt"

func (s *CueService) Unify(files map[string]string, loadPaths []string, tags []string) (string, error) {
	return "", fmt.Errorf(`{"message": "Evaluation (Unify) requires the Full Engine"}`)
}

func (s *CueService) Validate(schemaStr string, dataStr string) error {
	return fmt.Errorf(`{"message": "Validation requires the Full Engine"}`)
}

func (s *CueService) Export(input string, targetFmt string) (string, error) {
	// Simple formatting can work in reader, but evaluation requires engine.
	if targetFmt == "cue" {
		return s.Format(input)
	}
	return "", fmt.Errorf(`{"message": "Evaluation exports require the Full Engine"}`)
}