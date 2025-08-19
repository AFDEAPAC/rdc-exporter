package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/ROCm/rdc-exporter/pkg/catalog"
	"github.com/ROCm/rdc-exporter/pkg/exporter"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/collectors"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/spf13/pflag"
)

func main() {

	var (
		addr           string
		catalogPath    string
		enableDebug    bool
		fields         []string
		fieldsFilePath string
		selfMonitoring bool
	)

	// Define command line flags
	pflag.StringVarP(&addr, "listen-address", "l", ":8080", "Address to listen on for HTTP requests")
	pflag.StringVar(&catalogPath, "catalog", "", "Path to the catalog YAML file")
	pflag.StringSliceVarP(&fields, "fields", "e", nil, "Fields to scrape (e.g., 100,812)")
	pflag.StringVarP(&fieldsFilePath, "fields-file", "f", "", "Path to a file containing fields to scrape (one per line)")
	pflag.BoolVarP(&enableDebug, "debug", "d", false, "Enable debug logging")
	pflag.BoolVar(&selfMonitoring, "self-monitoring", false, "Enable self-monitoring metrics")
	pflag.Parse()

	// Configure the logger
	var logOpts *slog.HandlerOptions
	if enableDebug {
		logOpts = &slog.HandlerOptions{
			Level: slog.LevelDebug,
		}
	}
	slog.SetDefault(slog.New(slog.NewTextHandler(os.Stderr, logOpts)))

	// Parse the catalog
	catalg, err := catalog.ParseCatalogYAML(catalogPath)
	if err != nil {
		slog.Error("Failed to parse catalog YAML", "error", err)
		return
	}

	if fieldsFilePath != "" {
		// Read metrics from file, one per line
		file, err := os.ReadFile(fieldsFilePath)
		if err != nil {
			slog.Error("Failed to read fields file", "error", err)
			return
		}
		lines := strings.Split(string(file), "\n")
		for _, line := range lines {
			line = strings.TrimSpace(line)
			if line != "" {
				fields = append(fields, line)
			}
		}
	}

	// If fields are provided, filter the catalog entities
	if len(fields) > 0 {
		catalg.FilterEntitiesByFields(fields)
	}

	if len(catalg.Entities) == 0 {
		slog.Error("No valid entities found in the catalog")
		return
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	reg := prometheus.NewRegistry()
	if selfMonitoring {
		reg.Register(collectors.NewGoCollector())
		reg.Register(collectors.NewProcessCollector(collectors.ProcessCollectorOpts{}))
	}

	exp, err := exporter.NewExporter(reg, catalg)
	if err != nil {
		slog.Error("Failed to create exporter: %v", err)
		return
	}
	defer exp.Close()

	go func() {
		for {
			select {
			case <-ctx.Done():
				slog.Info("Shutting down exporter")
				return
			default:
				exp.Scrape()
				time.Sleep(5 * time.Second) // Scrape every 5 seconds
			}
		}
	}()

	server := &http.Server{
		Addr:    addr,
		Handler: http.DefaultServeMux,
	}

	http.Handle("/metrics", promhttp.HandlerFor(reg, promhttp.HandlerOpts{}))
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, "/metrics", http.StatusFound)
	})

	go func() {
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("http server error", "err", err)
		}
	}()

	// Wait for Ctrl+C or SIGTERM
	<-ctx.Done()
	slog.Info("Shutting down exporter and HTTP server...")

	shutdownCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		slog.Error("HTTP server shutdown error", "err", err)
	}

	slog.Info("Exporter exited")
}
