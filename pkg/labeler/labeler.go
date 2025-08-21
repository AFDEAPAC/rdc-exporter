package labeler

import "context"

type Labeler interface {
	Close() error
	GetLabelKeys() []string // Keys returns the list of keys that can be used to label GPUs
	GetLabelsByGpu(gpuIndex int) []string
	Update(context.Context) error
}
