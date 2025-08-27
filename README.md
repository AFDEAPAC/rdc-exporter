# AMD RDC Exporter

`rdc-exporter` is a Prometheus Exporter written in Go, integrating RDC (ROCm Data Center Tool) to collect GPU-related monitoring metrics. It can be deployed in GPU container environments to enable reliable and scalable GPU resource monitoring and visualization.

# Quickstart

Start rdc-exporter container on a GPU node:

```bash
$ docker run -dit --name rdc-exporter --device=/dev/kfd --device=/dev/dri --cap-add SYS_ADMIN -p 5000:5000 rdc-exporter:v1-rocm6.3-20250827
$ curl localhost:5000/metrics
# HELP active_cycles RDC field value for active_cycles
# TYPE active_cycles gauge
active_cycles{gpu_index="0"} 4.470398e+06
active_cycles{gpu_index="1"} 3.790848e+06
active_cycles{gpu_index="2"} 3.712511e+06
active_cycles{gpu_index="3"} 4.169626e+06
active_cycles{gpu_index="4"} 4.527142e+06
active_cycles{gpu_index="5"} 4.112354e+06
active_cycles{gpu_index="6"} 4.16357e+06
active_cycles{gpu_index="7"} 3.324068e+06
# HELP gpu_memory_usage Memory usage of the GPU instance
# TYPE gpu_memory_usage gauge
gpu_memory_usage{gpu_index="0"} 1335.6769279999999
gpu_memory_usage{gpu_index="1"} 1335.611392
gpu_memory_usage{gpu_index="2"} 1997.991936
gpu_memory_usage{gpu_index="3"} 1335.697408
gpu_memory_usage{gpu_index="4"} 1335.615488
gpu_memory_usage{gpu_index="5"} 1335.615488
gpu_memory_usage{gpu_index="6"} 1335.615488
gpu_memory_usage{gpu_index="7"} 1335.607296
```

## Quickstart on Kubernetes

Deploy rdc-exporter using a k8s DaemonSet:

```bash
$ kubectl create ns monitoring
$ kubectl -n monitoring apply -f exmaple/rdc-exporter-daemonset.yml
$ curl localhost:5000/metrics
# HELP active_cycles RDC field value for active_cycles
# TYPE active_cycles gauge
active_cycles{container="app-a",gpu_index="0",namespace="user1",pod="app-a-deploy-7c9f7d8b9c-abcde"} 3.4287908e+06
active_cycles{container="app-a",gpu_index="1",namespace="user1",pod="app-a-deploy-7c9f7d8b9c-abcde"} 3.9199674e+06
active_cycles{container="app-b",gpu_index="2",namespace="user2",pod="app-b-deploy-6df866c796-mhb7k"} 3.9111702e+06
active_cycles{container="app-b",gpu_index="3",namespace="user2",pod="app-b-deploy-6df866c796-mhb7k"} 3.6580778e+06
active_cycles{container="app-c",gpu_index="4",namespace="user3",pod="app-c-deploy-5d8f7c9b7c-xyz01"} 4.3101352e+06
active_cycles{container="app-c",gpu_index="5",namespace="user3",pod="app-c-deploy-5d8f7c9b7c-xyz01"} 3.9691476e+06
active_cycles{container="app-c",gpu_index="6",namespace="user3",pod="app-c-deploy-5d8f7c9b7c-xyz01"} 3.9955356e+06
active_cycles{container="app-c",gpu_index="7",namespace="user3",pod="app-c-deploy-5d8f7c9b7c-xyz01"} 3.7312112e+06
```

# Usage

## Monitoring specific metrics

### Pass metrics in arguments

```bash
rdc-exporter -e RDC_FI_GPU_CLOCK,812
```

### Run with a metric file

```bash
cat > metrics.txt <<EOF
RDC_FI_GPU_CLOCK
812
EOF
rdc-exporter -f metrics.txt
```

## Monitoring specific gpus

```bash
rdc-exporter -i 0,1
```

## Scaling metric values

If you want to change the output unit of a specific metric, you can use an external catalog file and set the scale for that metric. For example, for RDC_FI_GPU_MEMORY_TOTAL:

RDC_FI_GPU_MEMORY_TOTAL outputs values in Bytes by default from RDC. However, rdc-exporter sets the scale for RDC_FI_GPU_MEMORY_TOTAL to 0.000001 by default. Therefore, the value you get from rdc-exporter will be in MB.

```
# HELP gpu_memory_total Total memory of the GPU instance
# TYPE gpu_memory_total gauge
gpu_memory_total{gpu_index="0"} 206141.652992
gpu_memory_total{gpu_index="1"} 206141.652992
gpu_memory_total{gpu_index="2"} 206141.652992
gpu_memory_total{gpu_index="3"} 206141.652992
gpu_memory_total{gpu_index="4"} 206141.652992
gpu_memory_total{gpu_index="5"} 206141.652992
gpu_memory_total{gpu_index="6"} 206141.652992
gpu_memory_total{gpu_index="7"} 206141.652992
```

If you want to change the unit back to Bytes, you can create a catalog YAML to update the metric configuration:

```yaml
metrics:
  - metric: RDC_FI_GPU_MEMORY_TOTAL
    scale: 1
```

Then run rdc-exporter with the --catalog parameter and specify your YAML config file:

```bash
rdc-exporter --catalog catalog.yml
```

```
# HELP gpu_memory_total Total memory of the GPU instance
# TYPE gpu_memory_total gauge
gpu_memory_total{gpu_index="0"} 2.06141652992e+11
gpu_memory_total{gpu_index="1"} 2.06141652992e+11
gpu_memory_total{gpu_index="2"} 2.06141652992e+11
gpu_memory_total{gpu_index="3"} 2.06141652992e+11
gpu_memory_total{gpu_index="4"} 2.06141652992e+11
gpu_memory_total{gpu_index="5"} 2.06141652992e+11
gpu_memory_total{gpu_index="6"} 2.06141652992e+11
gpu_memory_total{gpu_index="7"} 2.06141652992e+11
```