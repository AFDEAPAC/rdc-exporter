package hostgpu

import (
	"fmt"
	"log/slog"
	"os"
	"regexp"
	"sort"
)

type GpuDevice struct {
	Index        int     `json:"index"`            // Gpu index, e.g.: 0, 1, 2...
	PCIAddress   *string `json:"pci,omitempty"`    // PCI address, if available
	RenderDevice *string `json:"render,omitempty"` // Render device path, e.g.: /dev/dri/renderD128, ...
}

func GetAMDGpuDevices() ([]*GpuDevice, error) {

	entries, err := os.ReadDir("/sys/module/amdgpu/drivers/pci:amdgpu/")
	if err != nil {
		slog.Error("Failed to read AMD GPU directory", "error", err)
		return nil, err
	}

	// Sort the entries by name
	sort.Slice(entries, func(i, j int) bool {
		return entries[i].Name() < entries[j].Name()
	})

	// Regex pattern for matching PCI addresses
	// Supports multiple addresses in hex (case-insensitive)
	// E.g.：0000:1b:00.0 , 0000:3D:00.0 , 0000:cd:00.0
	re := regexp.MustCompile(`^(0000:[0-9a-fA-F]{2}:00\.0\s*)+$`)

	devices := make([]*GpuDevice, 0, len(entries))
	for _, e := range entries {
		pciAddr := e.Name()

		if !re.MatchString(pciAddr) {
			// Skip entries that do not match the PCI address format
			slog.Debug("Skipping non-PCI address entry", "entry", pciAddr)
			continue
		}

		slog.Debug("Processing AMD GPU device", "pciAddress", pciAddr)

		renderDev, err := GetRenderDeviceByPCI(pciAddr)
		if err != nil {
			slog.Error("Skipping device due to render device error", "pciAddress", pciAddr, "error", err)
			continue
		}

		slog.Debug("Found render device", "pciAddress", pciAddr, "renderDevice", renderDev)
		device := &GpuDevice{
			Index:        len(devices),
			PCIAddress:   &pciAddr,
			RenderDevice: &renderDev,
		}

		devices = append(devices, device)
	}

	return devices, nil
}

// GetRenderDeviceByPCI finds the DRM render device (e.g., /dev/renderD128) for a given PCI address.
func GetRenderDeviceByPCI(pciAddr string) (string, error) {
	drmBasePath := "/sys/module/amdgpu/drivers/pci:amdgpu/" + pciAddr + "/drm"

	entries, err := os.ReadDir(drmBasePath)
	if err != nil {
		slog.Error("Failed to read DRM base path", "path", drmBasePath, "error", err)
		return "", err
	}

	re := regexp.MustCompile(`^(renderD[0-9]*)$`)
	for _, e := range entries {
		renderDev := e.Name()

		if !re.MatchString(renderDev) {
			slog.Debug("Skipping non-render device entry", "entry", renderDev)
			continue
		}

		slog.Debug("Render device found", "renderDevice", renderDev, "pciAddress", pciAddr)
		return "/dev/dri/" + renderDev, nil
	}

	return "", fmt.Errorf("no render device found for PCI address %s", pciAddr)
}
