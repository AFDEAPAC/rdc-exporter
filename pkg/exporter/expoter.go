package exporter

import (
	"log/slog"

	"github.com/ROCm/rdc-exporter/pkg/scraper/rdc"
	"github.com/prometheus/client_golang/prometheus"
)

type Exporter struct {
	rs *rdc.RdcScraper
}

// New creates a new instance of the Exporter with the provided RDC client.
func NewExporter(reg *prometheus.Registry) (*Exporter, error) {

	var (
		rdcFieldGroupName = "rdc_exporter_field_group"
		rdcGpuGroupName   = "rdc_exporter_group"
	)

	// Initialize the RDC scraper
	rdcScraper, err := rdc.NewRdcScraper(rdcGpuGroupName, rdcFieldGroupName, reg)
	if err != nil {
		slog.Error("Failed to create RDC scraper", "error", err)
		return nil, err
	}

	exporter := &Exporter{
		rs: rdcScraper,
	}

	return exporter, nil
}

func (e *Exporter) Close() error {
	if err := e.rs.Close(); err != nil {
		slog.Error("Failed to close RDC scraper", "error", err)
		return err
	}

	slog.Info("Exporter closed successfully")
	return nil
}

func (e *Exporter) Scrape() error {
	if err := e.rs.Scrape(); err != nil {
		slog.Error("Failed to scrape RDC data", "error", err)
		return err
	}
	return nil
}
