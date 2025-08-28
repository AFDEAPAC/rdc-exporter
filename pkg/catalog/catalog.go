package catalog

import (
	_ "embed"
	"fmt"
	"log/slog"
	"os"

	"gopkg.in/yaml.v3"
)

//go:embed catalog.yaml
var defaultCatalogYAML []byte

type Catalog struct {
	Entities  []*Entity `yaml:"metrics"`             // List of catalog entries
	Overwrite bool      `yaml:"overwrite,omitempty"` // Whether to overwrite existing entries
}

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

	// Handle overwrite mode
	if userCatalog.Overwrite {
		cleanCatalog := cleanAndValidateCatalog(userCatalog)
		if cleanCatalog != nil {
			slog.Debug("Use overwritten catalog", "file", filePath, "entries", len(cleanCatalog.Entities))
			return cleanCatalog, nil
		}
		// no valid entries in overwrite mode, so fall back to default
		slog.Debug("Overwrite catalog is empty, falling back to default")
		return defaultCatalog, nil
	}

	// Merge default and user catalogs
	mergedCatalog := mergeCatalogs(defaultCatalog, userCatalog)
	if err := mergedCatalog.Validate(); err != nil {
		return nil, fmt.Errorf("error validating merged catalog: %w", err)
	}

	return mergedCatalog, nil
}

func loadDefaultCatalog() (*Catalog, error) {
	var catalog Catalog
	if err := yaml.Unmarshal(defaultCatalogYAML, &catalog); err != nil {
		return nil, fmt.Errorf("error parsing default catalog: %w", err)
	}
	slog.Debug("Loaded default catalog", "entries", len(catalog.Entities))
	return &catalog, nil
}

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
			entity.Scale = 1 // default to 1 if not set or invalid
		}
	}
	return nil
}
