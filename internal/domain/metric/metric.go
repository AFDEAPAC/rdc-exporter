// Package metric holds the core domain of rdc-exporter: the framework-independent
// rules that turn a raw GPU field reading into a scaled, labelled metric point
// that a monitoring system can consume.
//
// This package is the innermost Clean Architecture layer. It must not import
// cgo/RDC bindings, the Prometheus client, gRPC, HTTP, or any other outer-layer
// concern. Outer layers (adapters and use cases) depend on these types, never
// the other way around. Keeping this package small and dependency-free is what
// allows the collection and conversion rules to be unit tested without a real
// GPU, the RDC library, or a Prometheus registry.
package metric

// FieldID identifies a single RDC field within the domain.
//
// It is a deliberately plain integer type so the core domain never depends on
// the cgo rdc_field_t enum. Adapters that talk to the RDC library are
// responsible for converting between the binding's field identifier and this
// domain identifier at the boundary.
type FieldID int

// GPUIndex identifies a GPU by its zero-based RDC device index.
//
// The index space is the one reported by the RDC library for the host, which
// after optional filtering is the set of GPUs this process exports. It is kept
// distinct from a plain integer to make label assembly and sample routing
// explicit at call sites.
type GPUIndex uint32

// Definition is the domain description of one exported metric.
//
// A Definition binds an RDC field to its external Prometheus identity (Name and
// Help) and the Scale used to convert the raw reading into the published unit.
// Definitions are derived from configuration (the catalog) in an outer layer and
// passed inward; this type carries no configuration-file or framework details.
type Definition struct {
	// FieldID is the RDC field this metric is collected from.
	FieldID FieldID
	// Name is the Prometheus metric name used when the value is published.
	Name string
	// Help is the Prometheus HELP text describing the metric.
	Help string
	// Scale multiplies the raw reading to produce the published value. A value
	// of zero or below is treated as "no scaling" (see ApplyScale) so that an
	// unset or invalid scale never zeroes out a metric.
	Scale float64
}

// ApplyScale converts a raw RDC reading into the published value.
//
// A positive Scale multiplies the reading so a metric can be re-based into a
// friendlier unit (for example bytes to megabytes). A zero or negative Scale is
// treated as the identity transform, which preserves the historical behavior
// where an unset or invalid scale leaves the raw value untouched rather than
// collapsing it to zero.
func (d Definition) ApplyScale(raw float64) float64 {
	if d.Scale > 0 {
		return raw * d.Scale
	}
	return raw
}

// Sample is one raw field reading for a single GPU, before scaling and labels.
//
// Samples are produced by a FieldReader adapter from the values returned by the
// RDC library and consumed by the collection use case. Value is the unscaled
// number as reported by RDC.
type Sample struct {
	// GPUIndex is the GPU the reading belongs to.
	GPUIndex GPUIndex
	// FieldID is the RDC field the reading belongs to.
	FieldID FieldID
	// Value is the raw, unscaled reading.
	Value float64
}

// Point is a fully prepared metric value ready to be published.
//
// A Point is the result of applying a Definition's scale to a Sample and
// assembling its label values. It carries FieldID and GPUIndex so a metric sink
// can route the value to the correct series and detect when a GPU's label set
// changed between collections. Value is already scaled and Labels are the label
// values in the order produced by LabelValues (gpu_index first).
type Point struct {
	// FieldID selects which metric series the value belongs to.
	FieldID FieldID
	// GPUIndex identifies the GPU, used together with FieldID to track label
	// changes for a series.
	GPUIndex GPUIndex
	// Value is the scaled value to publish.
	Value float64
	// Labels are the label values for this series, gpu_index first.
	Labels []string
}
