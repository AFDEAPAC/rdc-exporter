package k8slabeler

import (
	"context"
	"fmt"

	podresources "k8s.io/kubelet/pkg/apis/podresources/v1"
)

// containerResources is the subset of a kubelet container record the labeler
// needs: its identity and the GPU device IDs assigned to it.
//
// GPUs holds the device identifiers reported by the AMD GPU device plugin, which
// are matched against host GPU identifiers (PCI address or render node path) to
// resolve a GPU index. The identity fields are pointers so a missing value is
// distinguishable from an empty string when labels are assembled.
type containerResources struct {
	// Name is the container name.
	Name *string
	// PodName is the owning pod's name.
	PodName *string
	// Namespace is the owning pod's namespace.
	Namespace *string
	// GPUs are the device IDs allocated to the container, for example
	// /dev/dri/renderD128 or 0000:1b:00.0.
	GPUs []string
}

// listContainers queries the kubelet pod resources API and returns one record
// per container, carrying only the AMD GPU device allocations.
//
// It respects ctx cancellation through the gRPC call and wraps transport errors
// with context. Only devices whose resource name is the AMD GPU resource are
// collected, so containers using other accelerators contribute no GPU IDs.
func (l *Labeler) listContainers(ctx context.Context) ([]*containerResources, error) {
	resp, err := l.client.List(ctx, &podresources.ListPodResourcesRequest{})
	if err != nil {
		return nil, fmt.Errorf("list pod resources: %w", err)
	}

	containers := make([]*containerResources, 0, len(resp.GetPodResources()))
	for _, pod := range resp.GetPodResources() {
		for _, container := range pod.GetContainers() {
			record := &containerResources{
				Name:      strPtr(container.GetName()),
				PodName:   strPtr(pod.GetName()),
				Namespace: strPtr(pod.GetNamespace()),
			}

			for _, device := range container.GetDevices() {
				if device.GetResourceName() == amdGPUResource {
					record.GPUs = append(record.GPUs, device.GetDeviceIds()...)
				}
			}

			containers = append(containers, record)
		}
	}

	return containers, nil
}
