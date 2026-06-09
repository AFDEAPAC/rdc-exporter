package metric

import "strconv"

// GPUIndexLabel is the name of the label that always carries the GPU index.
//
// Every exported series is identified first by the GPU it came from. This label
// name is part of the exporter's external contract: existing dashboards and
// scrape configurations rely on it, so it must not change without a deliberate
// compatibility decision.
const GPUIndexLabel = "gpu_index"

// LabelKeys returns the ordered label names for every exported series.
//
// The GPU index label is always first, followed by any dynamic label keys
// supplied by a label provider (for example the Kubernetes pod, namespace, and
// container). The ordering here must match LabelValues so that a series'
// values line up with its registered label names. A nil or empty dynamic slice
// yields just the GPU index label.
func LabelKeys(dynamic []string) []string {
	keys := make([]string, 0, len(dynamic)+1)
	keys = append(keys, GPUIndexLabel)
	keys = append(keys, dynamic...)
	return keys
}

// LabelValues returns the ordered label values for one GPU's series.
//
// The GPU index is rendered as a base-10 string and placed first to match the
// position of GPUIndexLabel in LabelKeys; the dynamic values follow in the same
// order their keys were declared. Callers must pass dynamic values that align
// positionally with the dynamic keys given to LabelKeys, otherwise the series
// would carry mismatched labels.
func LabelValues(gpuIndex GPUIndex, dynamic []string) []string {
	values := make([]string, 0, len(dynamic)+1)
	values = append(values, strconv.FormatUint(uint64(gpuIndex), 10))
	values = append(values, dynamic...)
	return values
}
