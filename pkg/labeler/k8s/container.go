package k8s

import (
	"context"
	"log/slog"

	"github.com/ROCm/rdc-exporter/pkg/ptr"
	podresources "k8s.io/kubelet/pkg/apis/podresources/v1"
)

type Container struct {
	Name      *string  `json:"name,omitempty"`
	PodName   *string  `json:"pod,omitempty"`
	Namespace *string  `json:"namespace,omitempty"`
	GPUs      []string `json:"gpus,omitempty"` // e.g.: /dev/dri/renderD128, 0000:1b:00.0
}

func (l *K8sLabeler) GetContainers(ctx context.Context) ([]*Container, error) {

	in := &podresources.ListPodResourcesRequest{}

	resp, err := l.client.List(ctx, in)
	if err != nil {
		slog.Error("Failed to list pod resources", "error", err)
		return nil, err
	}

	containers := make([]*Container, 0, resp.Size())
	for _, pod := range resp.PodResources {

		for _, container := range pod.GetContainers() {
			metadata := &Container{
				Name:      &container.Name,
				PodName:   ptr.StringToPtr(pod.GetName()),
				Namespace: ptr.StringToPtr(pod.GetNamespace()),
			}

			for _, dev := range container.Devices {
				if dev.ResourceName == "amd.com/gpu" {
					metadata.GPUs = append(metadata.GPUs, dev.DeviceIds...)
				}
			}

			containers = append(containers, metadata)
		}

	}

	return containers, nil
}
