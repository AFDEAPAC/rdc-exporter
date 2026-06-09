// Package rdcsource adapts the RDC library into the collect.FieldReader port.
//
// This is an interface-adapter package: it owns the RDC session lifecycle (init,
// embedded handler, GPU group, field group, and field watch) and converts the
// binding's field values into domain metric.Sample values. It is the only place,
// besides the cgo bindings themselves, that knows RDC concepts; the use case and
// domain layers never see an RDC type. The package depends on the outer cgo
// bindings (internal/bindings/rdc) and the inner domain, never on the Prometheus
// or HTTP layers.
package rdcsource

// Config holds the tuning parameters for the RDC GPU group, field group, and
// field watch used by the reader.
//
// The group names identify (and let the reader reuse) the RDC-side groups across
// restarts, so they are part of the operational contract with a running RDC
// daemon. The watch parameters control how RDC caches samples; they must match
// the values the exporter has always used so collected data keeps the same
// freshness characteristics.
type Config struct {
	// GPUGroupName is the RDC GPU group the reader creates or reuses.
	GPUGroupName string
	// FieldGroupName is the RDC field group the reader creates or reuses.
	FieldGroupName string
	// MaxKeepAge is the maximum age, in seconds, RDC keeps a watched sample.
	MaxKeepAge float32
	// MaxKeepSamples is the maximum number of samples RDC keeps per field.
	MaxKeepSamples int32
	// UpdateFrequency is the RDC field update period in microseconds.
	UpdateFrequency int64
}

// DefaultConfig returns the standard RDC reader configuration used by the
// exporter. The values are the long-standing defaults and changing them alters
// the freshness and retention of collected samples, so they should only move
// with a deliberate operational decision.
func DefaultConfig() *Config {
	return &Config{
		GPUGroupName:    "rdc_exporter_group",
		FieldGroupName:  "rdc_exporter_field_group",
		MaxKeepAge:      3600.0,
		MaxKeepSamples:  1000,
		UpdateFrequency: 10000000,
	}
}
