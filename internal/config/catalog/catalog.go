package catalog

import (
	_ "embed"
	"fmt"
	"log/slog"
	"os"

	"gopkg.in/yaml.v3"
)

// defaultCatalogYAML is the full metric catalog generated from the RDC field
// enum and shipped inside the binary. It is the baseline that user catalogs are
// merged onto, and the fallback when no user catalog is provided. The list is
// intentionally complete; which metrics are exported by default is decided in
// the entry point, not here.
//
//go:embed catalog.yaml
var defaultCatalogYAML []byte

// Catalog is a parsed set of metric entities plus the loading mode flag.
//
// Catalog is a configuration aggregate, not a domain type. Overwrite selects how
// a user-supplied catalog combines with the embedded default (see
// ParseCatalogYAML). Callers convert a finished Catalog into domain definitions
// with DefinitionsFromEntities once the desired entities are selected.
type Catalog struct {
	// Entities is the configured metric list.
	Entities []*Entity `yaml:"metrics"`
	// Overwrite, when true, makes a user catalog replace the default entirely
	// instead of being merged onto it.
	Overwrite bool `yaml:"overwrite,omitempty"`
}

// ParseCatalogYAML loads the effective catalog from filePath, combined with the
// embedded default.
//
// With an empty filePath the embedded default catalog is returned unchanged. A
// user catalog with overwrite set replaces the default with its own valid,
// enabled entries, falling back to the default when it has none. Otherwise the
// user catalog is merged onto the default (user fields win, defaults fill gaps)
// and the merged result is validated. It returns an error when the file cannot
// be read or parsed, or when the merged catalog fails validation.
func ParseCatalogYAML(filePath string) (*Catalog, error) {
	defaultCatalog, err := loadDefaultCatalog()
	if err != nil {
		return nil, fmt.Errorf("failed to load default catalog: %w", err)
	}

	if filePath == "" {
		slog.Debug("Using default catalog")
		return defaultCatalog, nil
	}

	userCatalog, err := loadUserCatalog(filePath)
	if err != nil {
		return nil, err
	}

	// Overwrite mode discards the default entirely, but only if the user catalog
	// still has valid, enabled entries; otherwise fall back to the default so the
	// exporter never starts with an empty catalog.
	if userCatalog.Overwrite {
		cleanCatalog := cleanAndValidateCatalog(userCatalog)
		if cleanCatalog != nil {
			slog.Debug("Use overwritten catalog", "file", filePath, "entries", len(cleanCatalog.Entities))
			return cleanCatalog, nil
		}
		slog.Debug("Overwrite catalog is empty, falling back to default")
		return defaultCatalog, nil
	}

	mergedCatalog := mergeCatalogs(defaultCatalog, userCatalog)
	if err := mergedCatalog.Validate(); err != nil {
		return nil, fmt.Errorf("error validating merged catalog: %w", err)
	}

	return mergedCatalog, nil
}

// loadDefaultCatalog unmarshals the embedded default catalog. A parse failure
// here indicates a corrupt or malformed embedded asset, which is a build-time
// rather than user error.
func loadDefaultCatalog() (*Catalog, error) {
	var catalog Catalog
	if err := yaml.Unmarshal(defaultCatalogYAML, &catalog); err != nil {
		return nil, fmt.Errorf("error parsing default catalog: %w", err)
	}
	slog.Debug("Loaded default catalog", "entries", len(catalog.Entities))
	return &catalog, nil
}

// loadUserCatalog reads and parses the user-supplied catalog file. Errors are
// wrapped with the path to help locate a misconfigured deployment.
func loadUserCatalog(filePath string) (*Catalog, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("error reading catalog file: %w", err)
	}

	var catalog Catalog
	if err := yaml.Unmarshal(data, &catalog); err != nil {
		return nil, fmt.Errorf("error parsing catalog file %s: %w", filePath, err)
	}

	slog.Info("Parsed catalog file", "file", filePath, "entries", len(catalog.Entities), "overwrite", catalog.Overwrite)
	return &catalog, nil
}

// cleanAndValidateCatalog prepares an overwrite-mode catalog by dropping disabled
// metrics and validating the rest. It returns nil when nothing valid remains so
// the caller can fall back to the default catalog.
func cleanAndValidateCatalog(catalog *Catalog) *Catalog {
	catalog.removeDisabledMetrics()
	if len(catalog.Entities) == 0 {
		return nil
	}
	if err := catalog.Validate(); err != nil {
		slog.Error("Invalid overwrite catalog", "error", err)
		return nil
	}
	return catalog
}

// mergeCatalogs overlays userCatalog onto defaultCatalog keyed by Metric.
//
// Default entries seed the result; each user entry then overrides the matching
// default field by field (see mergeEntity). Entries with an empty Metric key or
// no resolvable Field are skipped, and entries explicitly disabled by the user
// are dropped from the result.
func mergeCatalogs(defaultCatalog, userCatalog *Catalog) *Catalog {
	entities := make(map[string]*Entity)

	for _, entity := range defaultCatalog.Entities {
		entities[entity.Metric] = entity
	}

	for _, entity := range userCatalog.Entities {
		if entity.Metric == "" {
			slog.Warn("Skipping entity with empty key", "entity", entity)
			continue
		}

		mergedEntity := mergeEntity(entities[entity.Metric], entity)
		if mergedEntity.Field == "" {
			slog.Warn("Entity field is empty, skipping", "entity", entity)
			continue
		}
		entities[entity.Metric] = mergedEntity
	}

	result := &Catalog{
		Entities: make([]*Entity, 0, len(entities)),
	}

	for _, entity := range entities {
		if entity.Disabled == nil || !*entity.Disabled {
			result.Entities = append(result.Entities, entity)
		}
	}

	return result
}

// mergeEntity produces the effective entity for one metric by taking the user
// entry's explicit values and filling any gaps from the matching default entry.
// A user-supplied non-positive scale is treated as unset and falls back to the
// default scale, matching how ApplyScale later treats non-positive scales.
func mergeEntity(defaultEntity, userEntity *Entity) *Entity {
	merged := &Entity{
		Metric:   userEntity.Metric,
		PromName: userEntity.PromName,
		Desc:     userEntity.Desc,
		Scale:    userEntity.Scale,
		Field:    userEntity.Field,
		Disabled: userEntity.Disabled,
	}

	if defaultEntity != nil {
		if merged.PromName == "" {
			merged.PromName = defaultEntity.PromName
		}
		if merged.Desc == "" {
			merged.Desc = defaultEntity.Desc
		}
		if merged.Scale <= 0 {
			merged.Scale = defaultEntity.Scale
		}
		if merged.Field == "" {
			merged.Field = defaultEntity.Field
		}
	}

	return merged
}

// FilterEntitiesByFields restricts the catalog to the entities selected by the
// given field references.
//
// Each reference matches an entity by its Metric name, numeric Field id, or
// PromName. Matched entities are re-enabled (their Disabled flag is cleared) and
// kept in catalog order; all others are removed. This is how the entry point
// narrows the full catalog down to the requested metric set.
func (c *Catalog) FilterEntitiesByFields(fields []string) {
	keep := make(map[*Entity]bool)
	for _, f := range fields {
		for _, e := range c.Entities {
			if e.Metric == f || e.Field == f || e.PromName == f {
				keep[e] = true
				break
			}
		}
	}

	filtered := make([]*Entity, 0, len(keep))
	for _, e := range c.Entities {
		if keep[e] {
			e.Disabled = nil
			filtered = append(filtered, e)
		}
	}
	c.Entities = filtered
}

// removeDisabledMetrics drops every entity flagged Disabled, keeping catalog
// order for the rest.
func (c *Catalog) removeDisabledMetrics() {
	enabledEntities := make([]*Entity, 0, len(c.Entities))
	for _, entity := range c.Entities {
		if entity.Disabled == nil || !*entity.Disabled {
			enabledEntities = append(enabledEntities, entity)
		}
	}
	c.Entities = enabledEntities
	slog.Debug("Removed disabled metrics", "remaining", len(c.Entities))
}

// Validate checks that the catalog is usable and normalizes scales.
//
// It requires a non-empty catalog where every entity has a Metric key, a
// PromName, and a Field id. As a side effect it rewrites any non-positive Scale
// to 1 so downstream consumers see an explicit identity scale. It returns an
// error describing the first invalid entity.
func (c *Catalog) Validate() error {
	if len(c.Entities) == 0 {
		return fmt.Errorf("catalog contains no metrics")
	}

	for _, entity := range c.Entities {
		if entity.Metric == "" {
			return fmt.Errorf("entity metric is empty: %v", entity)
		}
		if entity.PromName == "" {
			return fmt.Errorf("entity Prometheus name is empty for metric: %s", entity.Metric)
		}
		if entity.Field == "" {
			return fmt.Errorf("entity field is empty for metric: %s", entity.Metric)
		}
		if entity.Scale <= 0 {
			slog.Debug("Entity scale is not set or invalid, defaulting to 1", "metric", entity.Metric, "scale", entity.Scale)
			entity.Scale = 1
		}
	}
	return nil
}
