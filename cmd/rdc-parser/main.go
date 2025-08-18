package main

import (
	"bufio"
	"fmt"
	"os"
	"regexp"
	"sort"
	"strconv"
	"strings"

	"github.com/ROCm/rdc-exporter/internal/bindings/rdc"
	"github.com/ROCm/rdc-exporter/pkg/catalog"
	"github.com/spf13/pflag"
	"gopkg.in/yaml.v3"
)

func main() {
	var (
		sourcePath string
		destPath   string
	)

	pflag.StringVarP(&sourcePath, "source", "i", "rdc.h", "Source RDC header file path")
	pflag.StringVarP(&destPath, "output", "o", "catalog.yaml", "Destination catalog file path")
	pflag.Parse()

	file, err := os.Open(sourcePath)
	if err != nil {
		panic(err)
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	inEnum := false
	var enumLines []string

	for scanner.Scan() {
		line := scanner.Text()
		trim := strings.TrimSpace(line)
		if !inEnum {
			if trim == "typedef enum {" {
				inEnum = true
				enumLines = nil
			}
			continue
		}
		if strings.HasSuffix(trim, ";") && strings.Contains(trim, "}") {
			// Only process the end of enum block
			// Check if it is the correct rdc_field_t block
			// Example: "typedef enum { ... } rdc_field_t;"
			parts := strings.Fields(trim)
			if len(parts) >= 2 && parts[0] == "}" && strings.HasSuffix(parts[1], "rdc_field_t;") {
				// Matched rdc_field_t enum block
				break
			} else {
				// Not the rdc_field_t enum block, reset and continue
				inEnum = false
				enumLines = nil
				continue
			}
		}
		enumLines = append(enumLines, line)
	}

	if len(enumLines) == 0 {
		fmt.Fprintln(os.Stderr, "Cannot find typedef enum { ... } rdc_field_t; block")
		os.Exit(1)
	}

	entries := make(map[string]*catalog.CatalogEntry)
	// valMap := make(map[string]int)
	// descMap := make(map[string]string)
	lastVal := -1

	reField := regexp.MustCompile(`^\s*(RDC_[A-Z0-9_]+)\s*(=\s*([A-Za-z0-9_]+))?\s*$`)

	for _, line := range enumLines {
		// Skip lines that do not contain RDC_ definitions
		if !strings.Contains(line, "RDC_") {
			continue
		}

		// Split line with comma to separate enum name and description
		parts := strings.SplitN(line, ",", 2)
		left := strings.TrimSpace(parts[0])
		right := ""
		if len(parts) > 1 {
			right = strings.TrimSpace(parts[1])
			right = regexp.MustCompile(`^(//!<|//!|//|/\*|<!|!<|<!)\s*`).ReplaceAllString(right, "")
		}

		// Parse the enum definition
		m := reField.FindStringSubmatch(left)
		if m == nil {
			continue
		}
		key := m[1]
		valStr := m[3]

		var val int
		switch {
		case valStr == "":
			// Only enum name, no value
			val = lastVal + 1
		case isNumber(valStr):
			// Enum name with numeric value
			val, _ = strconv.Atoi(valStr)
		default:
			// Enum name with reference to another enum
			ref, ok := entries[valStr]
			if !ok {
				fmt.Fprintf(os.Stderr, "Reference key %s not found for %s\n", valStr, key)
				continue
			}
			val, _ = strconv.Atoi(ref.Field)

			// If the reference value is not set, use the description map
			if right == "" {
				right = ref.Desc
			}
		}
		lastVal = val

		entry := &catalog.CatalogEntry{
			Key:      key,
			PromName: toPromName(val),
			Field:    strconv.Itoa(val),
			Scale:    1,
			Desc:     right,
		}
		entries[key] = entry
	}

	// Convert entries map to slice
	out := &catalog.Catalog{
		Metrics: make([]*catalog.CatalogEntry, 0, len(entries)),
	}
	for _, entry := range entries {
		out.Metrics = append(out.Metrics, entry)
	}

	sort.SliceStable(out.Metrics, func(i, j int) bool {
		f1, _ := strconv.Atoi(out.Metrics[i].Field)
		f2, _ := strconv.Atoi(out.Metrics[j].Field)
		return f1 < f2
	})

	fileOut, err := os.Create(destPath)
	if err != nil {
		panic(err)
	}
	defer fileOut.Close()
	enc := yaml.NewEncoder(fileOut)
	enc.SetIndent(2)
	if err := enc.Encode(out); err != nil {
		panic(err)
	}
	fmt.Printf("Catalog written to %s\n", destPath)
}

// 判斷是否為純數字
func isNumber(s string) bool {
	_, err := strconv.Atoi(s)
	return err == nil
}

// 轉換成 prometheus name（範例：RDC_FI_PCIE_TX -> fi_pcie_tx）
func toPromName(enumValue int) string {
	rdcFieldID := rdc.NewFieldIDFromInt(enumValue)
	return strings.ToLower(rdcFieldID.Name())
}
