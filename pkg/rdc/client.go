package rdc

import (
	"log/slog"

	"github.com/ROCm/rdc-exporter/internal/bindings/rdc"
)

type Client struct {
	handle *rdc.Handle
}

func NewClient() (*Client, error) {

	if err := rdc.Init(0); err != nil {
		slog.Error("Failed to initialize RDC: %v", err)
		return nil, err
	}

	slog.Info("RDC initialized successfully")

	// Start the embedded RDC service
	handle, err := rdc.StartEmbedded(rdc.OperationModeAuto)
	if err != nil {
		slog.Error("Failed to start embedded RDC: %v", err)
		return nil, err
	}
	slog.Info("Embedded RDC started successfully")

	client := &Client{
		handle: handle,
	}

	slog.Info("RDC client created successfully")
	return client, nil
}

func (c *Client) Close() error {
	if err := rdc.StopEmbedded(c.handle); err != nil {
		slog.Error("Failed to stop embedded RDC: %v", err)
		return err
	}
	slog.Info("RDC stopped successfully")
	return nil
}
