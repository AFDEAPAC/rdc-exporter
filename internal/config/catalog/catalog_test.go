package catalog

import (
	"os"
	"path/filepath"
	"testing"
)

func TestParseCatalogYAMLDefault(t *testing.T) {
	c, err := ParseCatalogYAML("")
	if err != nil {
		t.Fatalf("ParseCatalogYAML(\"\") returned error: %v", err)
	}
	if len(c.Entities) == 0 {
		t.Fatal("default catalog has no entities")
	}
}

func TestParseCatalogYAMLMergeOverridesScale(t *testing.T) {
	// The default catalog ships RDC_FI_GPU_MEMORY_TOTAL with a sub-unit scale;
	// a merge should let a user reset it to 1 while keeping the default name.
	user := "metrics:\n  - metric: RDC_FI_GPU_MEMORY_TOTAL\n    scale: 1\n"
	path := writeTempCatalog(t, user)

	c, err := ParseCatalogYAML(path)
	if err != nil {
		t.Fatalf("ParseCatalogYAML returned error: %v", err)
	}

	e := findEntity(c, "RDC_FI_GPU_MEMORY_TOTAL")
	if e == nil {
		t.Fatal("merged catalog missing RDC_FI_GPU_MEMORY_TOTAL")
	}
	if e.Scale != 1 {
		t.Errorf("scale = %v, want 1 (user override)", e.Scale)
	}
	if e.PromName != "gpu_memory_total" {
		t.Errorf("prom_name = %q, want default gpu_memory_total", e.PromName)
	}
}

func TestParseCatalogYAMLOverwrite(t *testing.T) {
	user := "overwrite: true\nmetrics:\n  - metric: RDC_FI_GPU_CLOCK\n    prom_name: gpu_clock\n    field: \"100\"\n    scale: 1\n"
	path := writeTempCatalog(t, user)

	c, err := ParseCatalogYAML(path)
	if err != nil {
		t.Fatalf("ParseCatalogYAML returned error: %v", err)
	}
	if len(c.Entities) != 1 {
		t.Fatalf("overwrite catalog has %d entities, want 1", len(c.Entities))
	}
	if c.Entities[0].Metric != "RDC_FI_GPU_CLOCK" {
		t.Errorf("entity = %q, want RDC_FI_GPU_CLOCK", c.Entities[0].Metric)
	}
}

func TestFilterEntitiesByFields(t *testing.T) {
	c := &Catalog{Entities: []*Entity{
		{Metric: "RDC_FI_GPU_CLOCK", PromName: "gpu_clock", Field: "100"},
		{Metric: "RDC_FI_PROF_SM_ACTIVE", PromName: "valubusy", Field: "812"},
		{Metric: "RDC_FI_GPU_TEMP", PromName: "gpu_temp", Field: "201"},
	}}

	// References may be enum name, numeric field, or prom name.
	c.FilterEntitiesByFields([]string{"RDC_FI_GPU_CLOCK", "812", "gpu_temp"})

	if len(c.Entities) != 3 {
		t.Fatalf("filtered catalog has %d entities, want 3", len(c.Entities))
	}
	got := map[string]bool{}
	for _, e := range c.Entities {
		got[e.Metric] = true
	}
	for _, want := range []string{"RDC_FI_GPU_CLOCK", "RDC_FI_PROF_SM_ACTIVE", "RDC_FI_GPU_TEMP"} {
		if !got[want] {
			t.Errorf("filtered catalog missing %s", want)
		}
	}
}

func TestFilterEntitiesByFieldsDropsUnmatched(t *testing.T) {
	c := &Catalog{Entities: []*Entity{
		{Metric: "RDC_FI_GPU_CLOCK", PromName: "gpu_clock", Field: "100"},
		{Metric: "RDC_FI_GPU_TEMP", PromName: "gpu_temp", Field: "201"},
	}}
	c.FilterEntitiesByFields([]string{"gpu_clock"})
	if len(c.Entities) != 1 || c.Entities[0].Metric != "RDC_FI_GPU_CLOCK" {
		t.Errorf("filtered = %+v, want only RDC_FI_GPU_CLOCK", c.Entities)
	}
}

func TestValidate(t *testing.T) {
	tests := []struct {
		name    string
		catalog *Catalog
		wantErr bool
	}{
		{name: "empty", catalog: &Catalog{}, wantErr: true},
		{
			name:    "missing prom name",
			catalog: &Catalog{Entities: []*Entity{{Metric: "M", Field: "1"}}},
			wantErr: true,
		},
		{
			name:    "missing field",
			catalog: &Catalog{Entities: []*Entity{{Metric: "M", PromName: "m"}}},
			wantErr: true,
		},
		{
			name:    "valid",
			catalog: &Catalog{Entities: []*Entity{{Metric: "M", PromName: "m", Field: "1"}}},
			wantErr: false,
		},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			err := tc.catalog.Validate()
			if (err != nil) != tc.wantErr {
				t.Errorf("Validate() error = %v, wantErr %v", err, tc.wantErr)
			}
		})
	}
}

func TestValidateNormalizesScale(t *testing.T) {
	c := &Catalog{Entities: []*Entity{{Metric: "M", PromName: "m", Field: "1", Scale: 0}}}
	if err := c.Validate(); err != nil {
		t.Fatalf("Validate() returned error: %v", err)
	}
	if c.Entities[0].Scale != 1 {
		t.Errorf("scale = %v, want normalized to 1", c.Entities[0].Scale)
	}
}

func writeTempCatalog(t *testing.T, content string) string {
	t.Helper()
	path := filepath.Join(t.TempDir(), "catalog.yaml")
	if err := os.WriteFile(path, []byte(content), 0o600); err != nil {
		t.Fatalf("failed to write temp catalog: %v", err)
	}
	return path
}

func findEntity(c *Catalog, metric string) *Entity {
	for _, e := range c.Entities {
		if e.Metric == metric {
			return e
		}
	}
	return nil
}
