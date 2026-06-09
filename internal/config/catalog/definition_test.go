package catalog

import "testing"

func TestDefinitionsFromEntities(t *testing.T) {
	resolver := func(id int) string {
		if id == 812 {
			return "RDC_FI_PROF_SM_ACTIVE"
		}
		return "RDC_FI_UNKNOWN"
	}

	entities := []*Entity{
		{Metric: "RDC_FI_GPU_CLOCK", PromName: "gpu_clock", Field: "100", Scale: 1, Desc: "Current GPU clock"},
		{Metric: "RDC_FI_PROF_SM_ACTIVE", PromName: "", Field: "812", Scale: 1},
		{Metric: "RDC_FI_GPU_MEMORY_TOTAL", PromName: "gpu_memory_total", Field: "502", Scale: 0.000001, Desc: ""},
	}

	defs, err := DefinitionsFromEntities(entities, resolver)
	if err != nil {
		t.Fatalf("DefinitionsFromEntities returned error: %v", err)
	}
	if len(defs) != 3 {
		t.Fatalf("got %d definitions, want 3", len(defs))
	}

	if defs[0].FieldID != 100 || defs[0].Name != "gpu_clock" || defs[0].Help != "Current GPU clock" {
		t.Errorf("def[0] = %+v, unexpected", defs[0])
	}
	// Blank PromName falls back to the lowercased resolved enum name.
	if defs[1].Name != "rdc_fi_prof_sm_active" {
		t.Errorf("def[1].Name = %q, want lowercased resolved name", defs[1].Name)
	}
	// Blank Desc falls back to the derived help text.
	if defs[2].Help != "RDC field value for gpu_memory_total" {
		t.Errorf("def[2].Help = %q, want derived help", defs[2].Help)
	}
	if defs[2].Scale != 0.000001 {
		t.Errorf("def[2].Scale = %v, want 0.000001", defs[2].Scale)
	}
}

func TestDefinitionsFromEntitiesInvalidField(t *testing.T) {
	tests := []struct {
		name  string
		field string
	}{
		{name: "not a number", field: "abc"},
		{name: "negative", field: "-1"},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			_, err := DefinitionsFromEntities([]*Entity{{Metric: "M", PromName: "m", Field: tc.field}}, nil)
			if err == nil {
				t.Errorf("DefinitionsFromEntities(field=%q) error = nil, want error", tc.field)
			}
		})
	}
}
