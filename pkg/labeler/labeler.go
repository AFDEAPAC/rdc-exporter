package labeler

type Labeler interface {
	GetLabelKeys() []string // Keys returns the list of keys that can be used to label GPUs
	GetLabelsByGpu(gpuIndex int) []string
	Update() error
}
