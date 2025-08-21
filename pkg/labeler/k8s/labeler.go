package k8s

import (
	"context"
	"log/slog"
	"strings"

	"github.com/ROCm/rdc-exporter/pkg/hostgpu"
	"github.com/ROCm/rdc-exporter/pkg/labeler"
	"github.com/ROCm/rdc-exporter/pkg/ptr"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	podresources "k8s.io/kubelet/pkg/apis/podresources/v1"
)

type K8sLabeler struct {
	client podresources.PodResourcesListerClient
	conn   *grpc.ClientConn

	gpuDevices map[string]int            // Maps device ID to GPUDevice
	labels     map[int]map[string]string // Maps GPU index to labels
}

func NewK8sLabeler(endpoint string) (labeler.Labeler, error) {

	// Ensure the endpoint is a Unix socket path
	if !strings.HasPrefix(endpoint, "unix://") {
		endpoint = "unix://" + endpoint
	}

	// Connect to the kubelet's pod resources API
	conn, err := grpc.NewClient(endpoint, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		slog.Error("Failed to create gRPC connection", "endpoint", endpoint, "error", err)
		return nil, err
	}

	gpuDevices, err := hostgpu.GetAMDGpuDevices()
	if err != nil {
		slog.Error("Failed to get AMD GPU devices", "error", err)
		return nil, err
	}

	lb := &K8sLabeler{
		conn:       conn,
		client:     podresources.NewPodResourcesListerClient(conn),
		gpuDevices: make(map[string]int),
		labels:     make(map[int]map[string]string),
	}

	for _, gpu := range gpuDevices {
		lb.labels[gpu.Index] = make(map[string]string)
		if pciAddr := gpu.PCIAddress; pciAddr != nil {
			lb.gpuDevices[*pciAddr] = gpu.Index
		}
		if renderDev := gpu.RenderDevice; renderDev != nil {
			lb.gpuDevices[*renderDev] = gpu.Index
		}
	}

	return lb, nil
}

func (l *K8sLabeler) Close() error {
	if l.conn != nil {
		if err := l.conn.Close(); err != nil {
			slog.Error("Failed to close gRPC connection", "error", err)
			return err
		}
	}
	return nil
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

func (l *K8sLabeler) Update(ctx context.Context) error {

	containers, err := l.GetContainers(ctx)
	if err != nil {
		slog.Error("Failed to get containers from pod resources API", "error", err)
		return err
	}

	// Clear old labels for all GPU indices
	for gpuIndex := range l.labels {
		if _, ok := l.labels[gpuIndex]; !ok {
			l.labels[gpuIndex] = make(map[string]string)
			continue
		}
		for key := range l.labels[gpuIndex] {
			delete(l.labels[gpuIndex], key)
		}
	}

	for _, container := range containers {
		if len(container.GPUs) == 0 {
			continue // Skip containers without GPU resources
		}
		for _, gpuAddr := range container.GPUs {
			gpuIndex, exists := l.gpuDevices[gpuAddr]
			if !exists {
				slog.Warn("GPU device not found in labeler", "container", container.Name, "gpu", gpuAddr)
				continue
			}

			podName := container.PodName
			if podName == nil {
				podName = ptr.StringToPtr("")
			}

			namespace := container.Namespace
			if namespace == nil {
				namespace = ptr.StringToPtr("")
			}

			containerName := container.Name
			if containerName == nil {
				containerName = ptr.StringToPtr("")
			}

			l.labels[gpuIndex]["pod"] = *podName
			l.labels[gpuIndex]["namespace"] = *namespace
			l.labels[gpuIndex]["container"] = *containerName
		}
	}

	return nil
}
