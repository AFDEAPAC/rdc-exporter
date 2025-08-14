package exporter

import (
	"log/slog"

	"github.com/ROCm/rdc-exporter/pkg/rdc"
)

type Exporter struct {
	rc *rdc.Client
}

// New creates a new instance of the Exporter with the provided RDC client.
func NewExporter() (*Exporter, error) {

	// Initialize the RDC client
	client, err := rdc.NewClient()
	if err != nil {
		slog.Error("Failed to create RDC client", "error", err)
		return nil, err
	}

	exporter := &Exporter{
		rc: client,
	}

	return exporter, nil
}

func (e *Exporter) Close() error {
	if err := e.rc.Close(); err != nil {
		slog.Error("Failed to close RDC client", "error", err)
		return err
	}

	slog.Info("Exporter closed successfully")
	return nil
}
