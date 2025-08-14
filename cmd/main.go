package main

import (
	"log/slog"
	"os"

	"github.com/ROCm/rdc-exporter/pkg/exporter"
)

func init() {
	// Initialize the logger configuration
	logger := slog.New(slog.NewTextHandler(os.Stderr, nil))
	slog.SetDefault(logger)
}

func main() {

	exp, err := exporter.NewExporter()
	if err != nil {
		slog.Error("Failed to create exporter: %v", err)
		return
	}

	defer exp.Close()
}
