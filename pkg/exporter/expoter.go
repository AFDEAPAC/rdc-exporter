package exporter

import (
	"context"
	"log/slog"

	"github.com/ROCm/rdc-exporter/pkg/catalog"
	"github.com/ROCm/rdc-exporter/pkg/labeler"
	"github.com/ROCm/rdc-exporter/pkg/scraper/rdc"
	"github.com/prometheus/client_golang/prometheus"
)

type Exporter struct {
	lb labeler.Labeler
	rs *rdc.RdcScraper
}

// New creates a new instance of the Exporter with the provided RDC client.
func NewExporter(reg *prometheus.Registry, catalg *catalog.Catalog, gpuIndexes []int, k8sLabler labeler.Labeler) (*Exporter, error) {

	var dynamicLabels []string
	if k8sLabler != nil {
		dynamicLabels = k8sLabler.GetLabelKeys()
	}

	// Initialize the RDC scraper
	rc := rdc.NewDefaultRdcScraperConfig()
	rdcScraper, err := rdc.NewRdcScraper(rc, gpuIndexes, catalg.Entities)
	if err != nil {
		slog.Error("Failed to create RDC scraper", "error", err)
		return nil, err
	}

	if err := rdcScraper.RegisterGaugeVecs(reg, dynamicLabels); err != nil {
		slog.Error("Failed to create GaugeVecs from RDC scraper", "err", err)
		return nil, err
	}

	exporter := &Exporter{
		lb: k8sLabler,
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

func (e *Exporter) Scrape(ctx context.Context) error {
	if e.lb != nil {
		if err := e.lb.Update(ctx); err != nil {
			slog.Error("Failed to update labels from labeler", "error", err)
			return err
		}
	}

	if err := e.rs.Scrape(e.lb); err != nil {
		slog.Error("Failed to scrape RDC data", "error", err)
		return err
	}
	return nil
}
