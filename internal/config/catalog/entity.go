// Package catalog loads the metric catalog that configures which RDC fields the
// exporter publishes and how each one is named, described, and scaled.
//
// This is a Frameworks and Drivers layer package: it owns YAML parsing, the
// embedded default catalog, and the merge/overwrite/filter rules applied to
// user-supplied configuration. The YAML-tagged Entity type and these loading
// rules are configuration concerns and must stay out of the domain and use-case
// layers. The boundary toward the core domain is DefinitionsFromEntities, which
// converts validated entities into framework-free metric.Definition values.
package catalog

// Entity is one configured metric in the catalog, as read from YAML.
//
// An Entity ties an RDC field enum name and numeric field id to the Prometheus
// identity (PromName, Desc) and the Scale used to convert the raw reading.
// Entity is a configuration record, not a domain type: it carries YAML tags and
// the optional Disabled flag used only while loading and merging catalogs.
// Production code consumes the converted metric.Definition, not Entity.
type Entity struct {
	// Metric is the RDC field enum name, for example RDC_FI_PROF_SM_ACTIVE. It
	// is the stable key used to merge user entries onto the default catalog.
	Metric string `yaml:"metric"`
	// PromName is the exported Prometheus metric name, for example valubusy.
	PromName string `yaml:"prom_name"`
	// Field is the numeric RDC field id rendered as a string, for example "812".
	Field string `yaml:"field"`
	// Scale multiplies the raw reading; omitted or non-positive means no scaling.
	Scale float64 `yaml:"scale,omitempty"`
	// Desc is the Prometheus HELP text for the metric.
	Desc string `yaml:"desc,omitempty"`
	// Disabled, when true, excludes the metric while loading and merging. It is
	// a pointer so an unset flag is distinguishable from an explicit false,
	// which matters when a user entry overrides a default entry.
	Disabled *bool `yaml:"disabled,omitempty"`
}
