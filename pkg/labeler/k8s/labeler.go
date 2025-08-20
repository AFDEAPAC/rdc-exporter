package k8s

import (
	"log/slog"

	"github.com/ROCm/rdc-exporter/pkg/labeler"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	podresources "k8s.io/kubelet/pkg/apis/podresources/v1"
)

type K8sLabeler struct {
	client podresources.PodResourcesListerClient
	conn   *grpc.ClientConn

	labels map[int]map[string]string // Maps GPU index to labels
}

func NewK8sLabeler(endpoint string) (labeler.Labeler, error) {
	// Connect to the kubelet's pod resources API
	conn, err := grpc.NewClient(endpoint, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		slog.Error("Failed to create gRPC connection", "endpoint", endpoint, "error", err)
		return nil, err
	}

	lb := &K8sLabeler{
		conn:   conn,
		client: podresources.NewPodResourcesListerClient(conn),
		labels: make(map[int]map[string]string),
	}
	return lb, nil
}

func (l *K8sLabeler) GetLabelKeys() []string {
	return []string{"pod", "namespace", "container"}
}

func (l *K8sLabeler) GetLabelsByGpu(gpuIndex int) []string {
	keys := l.GetLabelKeys()
	labels := make([]string, len(keys))

	if gpuLabels, ok := l.labels[gpuIndex]; ok {
		for i, key := range keys {
			if value, exists := gpuLabels[key]; exists {
				labels[i] = value
			} else {
				labels[i] = "" // Default to empty if label not found
			}
		}
	}
	return labels
}

func (l *K8sLabeler) Update() error {
	return nil
}
