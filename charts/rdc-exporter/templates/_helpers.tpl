{{/*
Expand the name of the chart.
*/}}
{{- define "rdc-exporter.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
*/}}
{{- define "rdc-exporter.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "rdc-exporter.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Common labels.
*/}}
{{- define "rdc-exporter.labels" -}}
helm.sh/chart: {{ include "rdc-exporter.chart" . }}
{{ include "rdc-exporter.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{/*
Selector labels.
*/}}
{{- define "rdc-exporter.selectorLabels" -}}
app.kubernetes.io/name: {{ include "rdc-exporter.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{/*
The name of the ServiceAccount to use.
*/}}
{{- define "rdc-exporter.serviceAccountName" -}}
{{- if .Values.serviceAccount.create -}}
{{- default (include "rdc-exporter.fullname" .) .Values.serviceAccount.name -}}
{{- else -}}
{{- default "default" .Values.serviceAccount.name -}}
{{- end -}}
{{- end -}}

{{/*
The container image reference, defaulting the tag to the chart appVersion.
*/}}
{{- define "rdc-exporter.image" -}}
{{- $tag := .Values.image.tag | default .Chart.AppVersion -}}
{{- printf "%s:%s" .Values.image.repository $tag -}}
{{- end -}}

{{/*
The name of the metrics ConfigMap (existing or generated).
*/}}
{{- define "rdc-exporter.metricsConfigMapName" -}}
{{- if .Values.metrics.existingConfigMap -}}
{{- .Values.metrics.existingConfigMap -}}
{{- else -}}
{{- printf "%s-metrics" (include "rdc-exporter.fullname" .) -}}
{{- end -}}
{{- end -}}
