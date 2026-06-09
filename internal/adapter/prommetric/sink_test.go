package prommetric

import (
	"testing"

	"github.com/ROCm/rdc-exporter/internal/domain/metric"
	"github.com/prometheus/client_golang/prometheus"
	dto "github.com/prometheus/client_model/go"
)

func TestSinkPublishesValuesWithLabels(t *testing.T) {
	reg := prometheus.NewRegistry()
	defs := []metric.Definition{
		{FieldID: 100, Name: "gpu_clock", Help: "GPU clock"},
		{FieldID: 502, Name: "gpu_memory_total", Help: "Total memory"},
	}
	sink, err := New(reg, defs, nil)
	if err != nil {
		t.Fatalf("New returned error: %v", err)
	}

	err = sink.Publish([]metric.Point{
		{FieldID: 100, GPUIndex: 0, Value: 1500, Labels: []string{"0"}},
		{FieldID: 502, GPUIndex: 1, Value: 206141.65, Labels: []string{"1"}},
	})
	if err != nil {
		t.Fatalf("Publish returned error: %v", err)
	}

	if got := gaugeValue(t, reg, "gpu_clock", map[string]string{"gpu_index": "0"}); got != 1500 {
		t.Errorf("gpu_clock{gpu_index=0} = %v, want 1500", got)
	}
	if got := gaugeValue(t, reg, "gpu_memory_total", map[string]string{"gpu_index": "1"}); got != 206141.65 {
		t.Errorf("gpu_memory_total{gpu_index=1} = %v, want 206141.65", got)
	}
}

func TestSinkDeletesSeriesWhenLabelsChange(t *testing.T) {
	reg := prometheus.NewRegistry()
	defs := []metric.Definition{{FieldID: 100, Name: "gpu_clock", Help: "GPU clock"}}
	sink, err := New(reg, defs, []string{"pod"})
	if err != nil {
		t.Fatalf("New returned error: %v", err)
	}

	// First publish associates GPU 0 with pod "a".
	if err := sink.Publish([]metric.Point{{FieldID: 100, GPUIndex: 0, Value: 1, Labels: []string{"0", "a"}}}); err != nil {
		t.Fatalf("Publish returned error: %v", err)
	}
	if got := seriesCount(t, reg, "gpu_clock"); got != 1 {
		t.Fatalf("series count after first publish = %d, want 1", got)
	}

	// Second publish moves GPU 0 to pod "b"; the stale "a" series must be gone.
	if err := sink.Publish([]metric.Point{{FieldID: 100, GPUIndex: 0, Value: 2, Labels: []string{"0", "b"}}}); err != nil {
		t.Fatalf("Publish returned error: %v", err)
	}
	if got := seriesCount(t, reg, "gpu_clock"); got != 1 {
		t.Errorf("series count after label change = %d, want 1 (old series deleted)", got)
	}
	if got := gaugeValue(t, reg, "gpu_clock", map[string]string{"gpu_index": "0", "pod": "b"}); got != 2 {
		t.Errorf("gpu_clock for pod b = %v, want 2", got)
	}
}

func TestSinkRejectsDuplicateMetricName(t *testing.T) {
	reg := prometheus.NewRegistry()
	// Two distinct fields resolving to the same Prometheus name must fail
	// registration rather than silently collide.
	defs := []metric.Definition{
		{FieldID: 100, Name: "dup", Help: "h"},
		{FieldID: 101, Name: "dup", Help: "h"},
	}
	if _, err := New(reg, defs, nil); err == nil {
		t.Error("New with duplicate metric name returned nil error, want error")
	}
}

func gaugeValue(t *testing.T, reg *prometheus.Registry, name string, labels map[string]string) float64 {
	t.Helper()
	families, err := reg.Gather()
	if err != nil {
		t.Fatalf("Gather returned error: %v", err)
	}
	for _, mf := range families {
		if mf.GetName() != name {
			continue
		}
		for _, m := range mf.GetMetric() {
			if metricHasLabels(m, labels) {
				return m.GetGauge().GetValue()
			}
		}
	}
	t.Fatalf("metric %s with labels %v not found", name, labels)
	return 0
}

func seriesCount(t *testing.T, reg *prometheus.Registry, name string) int {
	t.Helper()
	families, err := reg.Gather()
	if err != nil {
		t.Fatalf("Gather returned error: %v", err)
	}
	for _, mf := range families {
		if mf.GetName() == name {
			return len(mf.GetMetric())
		}
	}
	return 0
}

func metricHasLabels(m *dto.Metric, labels map[string]string) bool {
	found := map[string]string{}
	for _, lp := range m.GetLabel() {
		found[lp.GetName()] = lp.GetValue()
	}
	for k, v := range labels {
		if found[k] != v {
			return false
		}
	}
	return true
}
