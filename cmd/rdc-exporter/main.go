package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/ROCm/rdc-exporter/pkg/exporter"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/collectors"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/spf13/pflag"
)

func main() {

	var (
		addr        string
		enableDebug bool
	)

	// Define command line flags
	pflag.StringVarP(&addr, "listen-address", "l", ":8080", "Address to listen on for HTTP requests")
	pflag.BoolVarP(&enableDebug, "debug", "d", false, "Enable debug logging")
	pflag.Parse()

	// Configure the logger
	var logOpts *slog.HandlerOptions
	if enableDebug {
		logOpts = &slog.HandlerOptions{
			Level: slog.LevelDebug,
		}
	}
	slog.SetDefault(slog.New(slog.NewTextHandler(os.Stderr, logOpts)))

	reg := prometheus.NewRegistry()
	reg.Register(collectors.NewGoCollector())
	reg.Register(collectors.NewProcessCollector(collectors.ProcessCollectorOpts{}))

	_, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer cancel()

	exp, err := exporter.NewExporter()
	if err != nil {
		slog.Error("Failed to create exporter: %v", err)
		return
	}
	defer exp.Close()

	http.Handle("/metrics", promhttp.HandlerFor(reg, promhttp.HandlerOpts{}))
	if err := http.ListenAndServe(addr, nil); err != nil {
		fmt.Printf("http server error: %v\n", err)
	}
}
