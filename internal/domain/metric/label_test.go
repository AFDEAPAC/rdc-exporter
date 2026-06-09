package metric

import (
	"slices"
	"testing"
)

func TestLabelKeys(t *testing.T) {
	tests := []struct {
		name    string
		dynamic []string
		want    []string
	}{
		{name: "no dynamic keys", dynamic: nil, want: []string{GPUIndexLabel}},
		{
			name:    "dynamic keys follow gpu index",
			dynamic: []string{"pod", "namespace", "container"},
			want:    []string{GPUIndexLabel, "pod", "namespace", "container"},
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := LabelKeys(tc.dynamic)
			if !slices.Equal(got, tc.want) {
				t.Errorf("LabelKeys(%v) = %v, want %v", tc.dynamic, got, tc.want)
			}
		})
	}
}

func TestLabelValues(t *testing.T) {
	tests := []struct {
		name     string
		gpuIndex GPUIndex
		dynamic  []string
		want     []string
	}{
		{name: "only gpu index", gpuIndex: 3, dynamic: nil, want: []string{"3"}},
		{
			name:     "dynamic values follow gpu index",
			gpuIndex: 0,
			dynamic:  []string{"app", "user1", "main"},
			want:     []string{"0", "app", "user1", "main"},
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := LabelValues(tc.gpuIndex, tc.dynamic)
			if !slices.Equal(got, tc.want) {
				t.Errorf("LabelValues(%v, %v) = %v, want %v", tc.gpuIndex, tc.dynamic, got, tc.want)
			}
		})
	}
}
