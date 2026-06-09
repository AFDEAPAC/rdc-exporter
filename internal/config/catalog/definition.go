package catalog

import (
	"fmt"
	"strconv"
	"strings"

	"github.com/ROCm/rdc-exporter/internal/domain/metric"
)

// DefinitionsFromEntities converts configured catalog entities into the
// framework-free metric.Definition values consumed by the core domain.
//
// This is the boundary that keeps configuration details out of the inner layers:
// the numeric Field string is parsed into a domain FieldID, and the Prometheus
// name and help text fall back to derived values when the entity leaves them
// blank, exactly as the metric registration did before. The blank-name fallback
// lowercases the field's enum name; because resolving that name requires the RDC
// library, it is injected as fieldName so this package stays independent of cgo.
//
// fieldName may be nil only when every entity already has a PromName (the case
// for the embedded default catalog and any validated catalog). It returns an
// error if an entity's Field is not a non-negative integer.
func DefinitionsFromEntities(entities []*Entity, fieldName func(fieldID int) string) ([]metric.Definition, error) {
	definitions := make([]metric.Definition, 0, len(entities))
	for _, entity := range entities {
		id, err := strconv.Atoi(entity.Field)
		if err != nil {
			return nil, fmt.Errorf("invalid field ID %q for metric %s: %w", entity.Field, entity.Metric, err)
		}
		if id < 0 {
			return nil, fmt.Errorf("invalid field ID %q for metric %s: must not be negative", entity.Field, entity.Metric)
		}

		name := entity.PromName
		if name == "" && fieldName != nil {
			name = strings.ToLower(fieldName(id))
		}

		help := entity.Desc
		if help == "" {
			help = "RDC field value for " + name
		}

		definitions = append(definitions, metric.Definition{
			FieldID: metric.FieldID(id),
			Name:    name,
			Help:    help,
			Scale:   entity.Scale,
		})
	}
	return definitions, nil
}
