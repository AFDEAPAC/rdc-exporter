package metric

import "testing"

func TestDefinitionApplyScale(t *testing.T) {
	tests := []struct {
		name  string
		scale float64
		raw   float64
		want  float64
	}{
		{name: "positive scale multiplies", scale: 0.000001, raw: 206141652992, want: 206141.652992},
		{name: "unit scale is identity", scale: 1, raw: 42, want: 42},
		{name: "zero scale falls back to identity", scale: 0, raw: 42, want: 42},
		{name: "negative scale falls back to identity", scale: -5, raw: 42, want: 42},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			d := Definition{Scale: tc.scale}
			got := d.ApplyScale(tc.raw)
			if got != tc.want {
				t.Errorf("Definition{Scale:%v}.ApplyScale(%v) = %v, want %v", tc.scale, tc.raw, got, tc.want)
			}
		})
	}
}
