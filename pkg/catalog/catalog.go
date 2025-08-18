package catalog

type Catalog struct {
	Metrics []*CatalogEntry `yaml:"metrics"` // List of catalog entries
}
