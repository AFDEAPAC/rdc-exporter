package catalog

import (
	_ "embed"
	"fmt"

	"gopkg.in/yaml.v3"
)

//go:embed catalog.yaml
var defaultCatalogYAML []byte

type Catalog struct {
	Metrics []*Entity `yaml:"metrics"` // List of catalog entries
}

func ParseCatalogYAML() (*Catalog, error) {

	var catalog Catalog
	err := yaml.Unmarshal(defaultCatalogYAML, &catalog)
	if err != nil {
		return nil, err
	}

	// Ensure all entries have a key
	for _, entry := range catalog.Metrics {
		if entry.Key == "" {
			return nil, fmt.Errorf("catalog entry missing key: %+v", entry)
		}
	}

	return &catalog, nil
}
