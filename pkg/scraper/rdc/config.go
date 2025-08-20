package rdc

type RdcScraperConfig struct {
	GpuGroupName      string
	FieldGroupName    string
	MaxiumKeepAge     float32
	MaxiumKeepSamples int32
	UpdateFrequencey  int64
}

func NewDefaultRdcScraperConfig() *RdcScraperConfig {
	return &RdcScraperConfig{
		GpuGroupName:      "rdc_exporter_group",
		FieldGroupName:    "rdc_exporter_field_group",
		MaxiumKeepAge:     3600.0,
		MaxiumKeepSamples: 1000,
		UpdateFrequencey:  10000000,
	}
}
