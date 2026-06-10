import type { Content } from "./types";

/**
 * Simplified Chinese (zh-Hans) locale dictionary implementing the
 * {@link Content} contract. Mirrors the `en` structure key-for-key.
 */
export const zhCN: Content = {
  langName: "简体中文",

  nav: {
    purpose: "用途",
    architecture: "运作方式",
    deployment: "部署",
    configuration: "配置",
    vsNvidia: "与 NVIDIA 差异",
    metrics: "指标",
    building: "构建",
  },

  hero: {
    eyebrow: "面向 AMD GPU 的 Prometheus exporter",
    titleLead: "RDC",
    titleAccent: "Exporter",
    tagline:
      "一款面向 AMD GPU 的 Prometheus exporter。它通过 ROCm Data Center Tool (RDC) 采集 GPU 指标并暴露在 /metrics；在 Kubernetes 上还能为指标附加 namespace、pod、container 等工作负载标签。",
    ctaQuickstart: "快速开始",
    ctaDocs: "文档",
    ctaGithub: "GitHub",
    stats: [
      { title: "ROCm RDC", desc: "指标来源" },
      { title: "/metrics", desc: "Prometheus 端点" },
      { title: "Kubernetes", desc: "工作负载归属" },
      { title: "免配置", desc: "开箱即用的合理默认" },
    ],
  },

  purpose: {
    kicker: "用途",
    title: "为 AMD 平台打造的 GPU 可观测性",
    intro:
      "RDC Exporter 把 AMD GPU 的原始遥测与 profiling 计数器转换为 Prometheus 指标。它就近运行在 GPU 旁，通过 ROCm Data Center Tool 读取字段、换算成易读单位，并以单一 /metrics 端点提供给你既有的监控系统使用。",
    cards: [
      {
        title: "通过 RDC 采集",
        desc: "经由 ROCm Data Center Tool 读取 GPU 字段——时钟、温度、功耗、利用率、显存、ECC 以及 profiling 计数器——并以固定的 5 秒周期刷新。",
      },
      {
        title: "暴露给 Prometheus",
        desc: "每个被选中的字段都会成为 /metrics 上的 Prometheus gauge。gpu_index 永远是第一个标签，因此每条 series 都对应到一个设备。",
      },
      {
        title: "归属到工作负载",
        desc: "在 Kubernetes 上，它查询 kubelet pod-resources API，将 namespace、pod、container 标签附加到工作负载实际使用的 GPU。",
      },
      {
        title: "合理的默认值",
        desc: "完整的默认 catalog 已编入可执行文件，并内置默认字段选择，因此无需配置即可产出有用的指标。",
      },
    ],
    outputCaption: "GPU 节点上的 /metrics 示例输出",
    workloadNote:
      "当工作负载通过 AMD device-plugin 申请 GPU 时，同一条 series 会获得 namespace、pod、container 标签：",
  },

  architecture: {
    kicker: "运作方式",
    title: "从 RDC 字段到 /metrics 端点",
    intro:
      "RDC Exporter 是一个就近运行在 GPU 旁的单一 Go 可执行文件。每次抓取时，它通过 ROCm Data Center Tool 读取原始字段、换算成易读单位、附加工作负载标签，并把结果发布在 /metrics。",
    flowTitle: "采集循环",
    flowDesc:
      "每个抓取周期，exporter 会执行一次采集流程。每个阶段彼此独立、可用内存中的 fake 测试——无需 GPU、RDC 库或 Prometheus registry。",
    flowSteps: [
      { title: "读取样本", desc: "RDC reader 为每个 (GPU, 字段) 返回一条原始、未换算的样本。" },
      { title: "刷新标签", desc: "可选的 kubelet labeler 更新它的 GPU 到工作负载映射表。" },
      { title: "换算 + 标签", desc: "将每条读数乘上其 scale，并组装成带标签的 points。" },
      { title: "发布", desc: "Prometheus sink 更新 series；/metrics 提供结果。" },
    ],
  },

  deployment: {
    kicker: "部署",
    title: "从单条 docker run 到 Kubernetes DaemonSet",
    intro:
      "用 Docker 在一个 GPU 节点上启动，或以 DaemonSet 在整个集群推出。官方镜像发布于 GitHub Container Registry (GHCR)，并对应到特定的 ROCm 版本。",
    dockerTitle: "在 GPU 节点上快速开始",
    dockerDesc:
      "暴露 GPU 设备、为 RDC profiling 加上 SYS_PTRACE、发布 5000 端口，并抓取 /metrics。",
    k8sTitle: "Kubernetes",
    k8sDesc:
      "rdc-exporter 以 DaemonSet 形式运行在每个 GPU 节点上。由 ConfigMap 提供指标清单，并挂载 kubelet pod-resources socket，让指标能归属到 Pod。hostNetwork 让 /metrics 直接暴露在节点的 5000 端口。",
    k8sComponents: [
      {
        title: "node-labeller",
        desc: "依节点上的 AMD GPU 属性 (beta.amd.com/gpu.*) 为节点打标签，让选择器能锁定 GPU 节点。它只管理标签。",
      },
      {
        title: "device-plugin",
        desc: "将 GPU 注册为可调度资源 amd.com/gpu，让工作负载能通过 resources.limits 申请。",
      },
      {
        title: "rdc-exporter",
        desc: "通过 kubelet pod-resources 接口查询 GPU 到 Pod 的映射。工作负载必须先申请 amd.com/gpu，其指标才会带有 pod 标签。",
      },
    ],
    imagesTitle: "发布镜像",
    imagesNote: "GHCR 上的官方发布镜像：",
    tagFormat: "标签格式：v1-rocm<ROCm 版本>-<YYYYMMDD>",
    vllmTitle: "用真实工作负载验证",
    vllmDesc:
      "部署一个通过 device-plugin 申请一块 GPU 的 vLLM 推理服务，接着确认 exporter 已把该 Pod 的标签附加到其 GPU series。",
    prereqTitle: "前置需求",
    prereqs: [
      { title: "Kubernetes 集群", desc: "一个可用、且能以 kubectl 连接的集群。" },
      { title: "pod-resources API", desc: "每个 GPU 节点上都存在 kubelet socket（路径因发行版而异）。" },
      { title: "amd64 GPU 节点", desc: "具备 amdgpu 驱动的 AMD GPU；/dev/kfd 与 /dev/dri 存在。" },
    ],
    guideTitle: "逐步部署",
    guideDesc:
      "在既有集群上的端到端流程：从前置组件到验证 Pod 归属。",
    guideSteps: [
      { title: "部署 node-labeller 与 device-plugin", desc: "套用官方 ROCm/k8s-device-plugin 清单，让 GPU 节点取得标签、且 amd.com/gpu 可被调度。" },
      { title: "设置 metric list", desc: "通过 rdc-exporter-metrics ConfigMap（挂载为 metrics.txt）提供要采集的 RDC 字段。" },
      { title: "对齐 pod-resources socket", desc: "把 DaemonSet 的 hostPath 指向节点实际的 kubelet socket，GPU 才能对应到 Pod。" },
      { title: "部署并验证", desc: "创建 monitoring namespace、套用 DaemonSet，接着 curl node:5000/metrics。" },
      { title: "确认 Pod 归属", desc: "运行一个申请 amd.com/gpu 的工作负载，确认其 GPU series 取得 pod、namespace、container 标签。" },
    ],
    socketTitle: "pod-resources socket 路径",
    socketDesc:
      "rdc-exporter 通过 kubelet pod-resources socket 将 GPU 对应到 Pod。hostPath 必须与节点实际的 kubelet root-dir 相符，而这因发行版而异。可在节点上确认（无输出代表使用默认值）：",
    socketColDistro: "发行版",
    socketColPath: "节点上的 socket 路径",
    troubleshootTitle: "疑难排查",
    troubleshootColSymptom: "症状",
    troubleshootColFix: "可能原因与解法",
    fullGuide: "阅读完整 Kubernetes 部署指南",
  },

  configuration: {
    kicker: "配置",
    title: "两层：字典与选择",
    intro:
      "配置被拆成两个独立的层。catalog 是字典，定义每个指标“是什么”——它的 Prometheus 名称、HELP 文本、RDC 字段 id 与单位 (scale)。metric list 则是选择，决定你实际发布哪些指标。",
    twoLayerTitle: "模型",
    twoLayer: [
      {
        title: "Catalog — 字典",
        desc: "每个指标的身份与单位。完整的默认 catalog 内嵌于可执行文件；--catalog 会把你的覆盖叠加其上（或在 overwrite 模式下完全替换）。",
      },
      {
        title: "Metric list — 选择",
        desc: "要发布的子集，通过 -e/--fields 或 -f/--fields-file 设置。可用枚举名称、数字字段 id 或 Prometheus 名称来引用指标。",
      },
    ],
    orderTitle: "启动顺序",
    order: [
      "加载 catalog：从内嵌默认开始，再合并 --catalog（或 overwrite）。",
      "套用 metric list：只保留 -e 与 -f 选择的字段，或内置默认。",
      "发布：每个指标都是 gauge，发布值 = 原始 RDC 读数 × scale。",
    ],
    refTitle: "选择指标：字段引用",
    refDesc:
      "metric list 的每一条都从 catalog 选出一个指标。可用以下三种形式引用，皆指向同一个指标。无法对应到任何 catalog 条目的引用会被静默忽略，这也是 # 开头能当注释的原因。",
    refColForm: "引用形式",
    refColExample: "示例",
    scaleTitle: "单位换算",
    scaleDesc:
      "每条读数在发布前都会做一次乘法换算。scale 为 1（或任何 ≤ 0、会被规范化为 1 的值）会保留原始值；小数的 scale 则把指标重新换算成更易读的单位。默认 catalog 已完成常见换算：",
    scaleTableTitle: "默认单位换算",
    mergeTitle: "Merge 与 overwrite",
    mergeDesc:
      "默认情况下，你的 --catalog 会逐字段叠加到默认之上，因此你只需列出要变更的部分。加上 overwrite: true 则完全替换 catalog。",
    mergeMode: "Merge（默认）：只叠加你变更的字段",
    overwriteMode: "Overwrite：你的清单即为整个 catalog",
    entryTitle: "Catalog 条目参考",
    entryDesc:
      "每个 catalog 条目以其 RDC metric 名称为键。merge 模式下只需填你要变更的字段；overwrite 模式下 metric、prom_name、field 皆为必填。",
    entryColKey: "键",
    entryColReq: "必填",
    entryColMeaning: "含义",
    exampleTitle: "实战示例：温度、功耗、以 bytes 表示的显存",
    exampleDesc:
      "只输出温度、功耗与显存用量；保留 °C 与 W 默认，但在合并的 catalog 中仅覆盖该条 scale，让显存以原始 bytes 呈现。",
    flagsTitle: "配置相关 CLI 标志",
    fullGuide: "阅读完整配置指南",
  },

  vsNvidia: {
    kicker: "与 NVIDIA 差异",
    title: "与 DCGM exporter 的差异",
    intro:
      "若你来自 NVIDIA 生态，心智模型会有所不同。DCGM exporter 使用单一 CSV，把选择、命名与 help 文本混在一起。RDC Exporter 将这些关注点拆成 catalog（定义 + 单位）与 metric list（选择）。",
    colNvidia: "NVIDIA DCGM exporter",
    colRdc: "RDC Exporter",
    rows: [
      { aspect: "配置文件", nvidia: "单一 CSV（如 default-counters.csv）", rdc: "Catalog YAML（可选）+ metric list" },
      { aspect: "文件的作用", nvidia: "同时选择字段并设置类型/help", rdc: "Catalog = 身份 + 单位；list = 选择，彼此分离" },
      { aspect: "指标名称", nvidia: "DCGM 字段名称（CSV 第一列）", rdc: "可配置的 prom_name，并有合理默认" },
      { aspect: "单位换算", nvidia: "不在 CSV 内；之后于 rules / Grafana 处理", rdc: "可在 catalog 中配置，输出前就先格式化" },
      { aspect: "无配置可用", nvidia: "需要一份 counters CSV", rdc: "可以——内嵌默认 catalog + 选择" },
      { aspect: "开关某指标", nvidia: "编辑 CSV", rdc: "编辑 metric list" },
      { aspect: "新增非默认字段", nvidia: "新增一行 CSV", rdc: "新增 catalog 条目，再选择它" },
    ],
    whyTitle: "为什么要拆分？",
    whyDesc:
      "选择经常变动，属于运维面——我现在这个集群要哪些指标？名称与单位则是稳定的定义。把两者分开，意味着你能用一个小清单（或 ConfigMap）开关指标，而无需重述名称或单位；单位的重新换算只需在 catalog 做一次，而不必修补每个仪表板与 recording rule。",
    mappingNote:
      "许多 RDC 字段都对应到 DCGM 等价项——例如 RDC_FI_GPU_TEMP ↔ DCGM_FI_DEV_GPU_TEMP、RDC_FI_PROF_SM_ACTIVE ↔ DCGM_FI_PROF_SM_ACTIVE——让仪表板迁移变得直观。",
  },

  metrics: {
    kicker: "指标",
    title: "遥测与 profiling 两种类型",
    intro:
      "字段分成两类，采集成本差异很大。挑选你需要的；exporter 会为每一个换算并加上标签。",
    telemetryTitle: "遥测 (Telemetry)",
    telemetryDesc:
      "时钟、温度、功耗、利用率、显存与 ECC——来源为 amd-smi / sysfs。采集成本低，且数量没有硬件限制。",
    profilingTitle: "Profiling",
    profilingDesc:
      "RDC_FI_PROF_* 字段对应到 GPU 硬件性能计数器 (PMC)。功能强大，但同时采集的数量受硬件封包上限约束。",
    defaultTitle: "经验证的默认选择",
    defaultDesc:
      "来自 Kubernetes 指南、保守且经验证的组合：10 个遥测 + 6 个 profiling 字段，能稳定地一起采集。",
    caveatTitle: "Profiling PMC 封包上限",
    caveatDesc:
      "Profiling 计数器被打包进单一 PMC 封包。一次请求太多可能超过 GPU 的封包容量，导致 RDC profiling 层在工作线程中中止——进程仍持续运行、/metrics 仍提供最后一次（过时的）快照，因此失败很难被察觉。",
    caveatList: [
      "遥测字段可自由新增；没有硬件上限。",
      "profiling 字段先从少量开始、逐步新增，边加边验证。",
      "在 MI355X (gfx950) 上，6 个 profiling 字段可稳定运行；约 18 个会触发错误。",
      "这是计数器打包上限，并非权限问题——调整权限或 perf_event_paranoid 都无法解决。",
    ],
    tableTitle: "完整 RDC 指标清单",
    tableHint: "catalog 认得的每一个字段。可按分类筛选，或只显示默认启用的集合。",
    colMetric: "RDC 字段",
    colProm: "Prometheus 名称",
    colId: "字段 ID",
    colHelp: "说明",
    colDcgm: "DCGM 等价项",
    colEnable: "默认",
    filterAll: "全部",
    groupCore: "核心",
    groupPcie: "PCIe",
    groupEcc: "ECC",
    groupXgmi: "XGMI",
    groupProfiling: "Profiling",
    groupEvents: "事件",
    groupHealth: "健康",
    enabledOnly: "只显示默认启用",
    countLabel: "个字段",
    fullList: "打开完整指标清单",
  },

  building: {
    kicker: "构建",
    title: "从源代码构建",
    intro:
      "Makefile 掌管 ROCm、Go 与镜像标签的构建参数。最关键的值是 ROCM_DEB——用来配置 ROCm apt repository 的 amdgpu-install 包 URL。请让 ROCM_VERSION 与 ROCM_DEB 保持一致。",
    steps: [
      { title: "make build", desc: "编译 rdc-exporter 可执行文件。" },
      { title: "make image", desc: "以配置好的 ROCm/Go 版本构建容器镜像。" },
      { title: "make image-verify", desc: "在 builder 阶段内编译、vet 并测试整个 module。" },
    ],
    note: "需要时可从命令行覆盖版本：",
  },

  footer: {
    builtBy: "开发团队",
    team: "AMD aFDE team (DCGPU System Eng TWN, AMD Inc.)",
    author: "Chen-Hao Ku <Bill.Ku@amd.com>",
    disclaimer:
      "本网站汇整项目文档与源代码内容。如需权威细节，请一律以仓库文档为准。",
    docsHeading: "文档",
    docConfig: "配置指南",
    docDeploy: "Kubernetes 部署指南",
    docMetrics: "完整指标清单",
    resourcesHeading: "资源",
    rocmRdc: "ROCm Data Center Tool (RDC)",
    devicePlugin: "AMD GPU device-plugin",
    vllm: "vLLM",
  },

  common: {
    copy: "复制",
    copied: "已复制",
    note: "备注",
    caution: "注意",
    backToTop: "回到顶部",
  },
};
