package catalog

type Entity struct {
	Key      string  `yaml:"key"`             // E.g. RDC_FI_PROF_SM_ACTIVE
	PromName string  `yaml:"prom_name"`       // E.g. valubusy
	Field    string  `yaml:"field"`           // E.g. "812"
	Scale    float64 `yaml:"scale,omitempty"` // E.g. 1.0
	Desc     string  `yaml:"desc,omitempty"`  // E.g. "SM Active"
	Disabled *bool   `yaml:"disabled,omitempty"`
}
