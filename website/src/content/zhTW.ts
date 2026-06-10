import type { Content } from "./types";

/**
 * Traditional Chinese (zh-Hant) locale dictionary implementing the
 * {@link Content} contract. Mirrors the `en` structure key-for-key.
 */
export const zhTW: Content = {
  langName: "繁體中文",

  nav: {
    purpose: "用途",
    architecture: "運作方式",
    deployment: "佈署",
    configuration: "設定",
    vsNvidia: "與 NVIDIA 差異",
    metrics: "指標",
    building: "建置",
  },

  hero: {
    eyebrow: "AMD GPU 的 Prometheus exporter",
    titleLead: "RDC",
    titleAccent: "Exporter",
    tagline:
      "一款針對 AMD GPU 的 Prometheus exporter。它透過 ROCm Data Center Tool (RDC) 收集 GPU 指標並暴露於 /metrics；在 Kubernetes 上還能為指標附加 namespace、pod、container 等工作負載標籤。",
    ctaQuickstart: "快速開始",
    ctaDocs: "文件",
    ctaGithub: "GitHub",
    stats: [
      { title: "ROCm RDC", desc: "指標來源" },
      { title: "/metrics", desc: "Prometheus 端點" },
      { title: "Kubernetes", desc: "工作負載歸屬" },
      { title: "免設定", desc: "開箱即用的合理預設" },
    ],
  },

  purpose: {
    kicker: "用途",
    title: "為 AMD 平台打造的 GPU 可觀測性",
    intro:
      "RDC Exporter 把 AMD GPU 的原始遙測與 profiling 計數器轉換成 Prometheus 指標。它就近執行在 GPU 旁，透過 ROCm Data Center Tool 讀取欄位、換算成易讀單位，並以單一 /metrics 端點提供給你既有的監控系統使用。",
    cards: [
      {
        title: "透過 RDC 收集",
        desc: "經由 ROCm Data Center Tool 讀取 GPU 欄位——時脈、溫度、功耗、使用率、記憶體、ECC 以及 profiling 計數器——並以固定的 5 秒週期更新。",
      },
      {
        title: "暴露給 Prometheus",
        desc: "每個被選取的欄位都會成為 /metrics 上的 Prometheus gauge。gpu_index 永遠是第一個標籤，因此每條 series 都對應到一個裝置。",
      },
      {
        title: "歸屬到工作負載",
        desc: "在 Kubernetes 上，它查詢 kubelet pod-resources API，將 namespace、pod、container 標籤附加到工作負載實際使用的 GPU。",
      },
      {
        title: "合理的預設值",
        desc: "完整的預設 catalog 已編入執行檔，並內建預設欄位選取，因此免設定即可產出有用的指標。",
      },
    ],
    outputCaption: "GPU 節點上的 /metrics 範例輸出",
    workloadNote:
      "當工作負載透過 AMD device-plugin 申請 GPU 時，同一條 series 會獲得 namespace、pod、container 標籤：",
  },

  architecture: {
    kicker: "運作方式",
    title: "從 RDC 欄位到 /metrics 端點",
    intro:
      "RDC Exporter 是一個就近執行在 GPU 旁的單一 Go 執行檔。每次抓取時，它透過 ROCm Data Center Tool 讀取原始欄位、換算成易讀單位、附加工作負載標籤，並把結果發佈於 /metrics。",
    flowTitle: "收集循環",
    flowDesc:
      "每個抓取週期，exporter 會執行一次收集流程。每個階段彼此獨立、可用記憶體內的 fake 測試——不需要 GPU、RDC 函式庫或 Prometheus registry。",
    flowSteps: [
      { title: "讀取樣本", desc: "RDC reader 為每個 (GPU, 欄位) 回傳一筆原始、未換算的樣本。" },
      { title: "更新標籤", desc: "選用的 kubelet labeler 更新它的 GPU 對工作負載對應表。" },
      { title: "換算 + 標籤", desc: "將每筆讀數乘上其 scale，並組裝成帶標籤的 points。" },
      { title: "發佈", desc: "Prometheus sink 更新 series；/metrics 提供結果。" },
    ],
  },

  deployment: {
    kicker: "佈署",
    title: "從單一 docker run 到 Kubernetes DaemonSet",
    intro:
      "用 Docker 在一個 GPU 節點上啟動，或以 DaemonSet 在整個叢集推出。官方映像檔發佈於 GitHub Container Registry (GHCR)，並對應到特定的 ROCm 版本。",
    dockerTitle: "在 GPU 節點上快速開始",
    dockerDesc:
      "暴露 GPU 裝置、為 RDC profiling 加上 SYS_PTRACE、發佈 5000 連接埠，並抓取 /metrics。",
    k8sTitle: "Kubernetes",
    k8sDesc:
      "rdc-exporter 以 DaemonSet 形式執行在每個 GPU 節點上。由 ConfigMap 提供指標清單，並掛載 kubelet pod-resources socket，讓指標能歸屬到 Pod。hostNetwork 讓 /metrics 直接暴露在節點的 5000 連接埠。",
    k8sComponents: [
      {
        title: "node-labeller",
        desc: "依節點上的 AMD GPU 屬性 (beta.amd.com/gpu.*) 為節點貼標籤，讓選擇器能鎖定 GPU 節點。它只管理標籤。",
      },
      {
        title: "device-plugin",
        desc: "將 GPU 註冊為可排程資源 amd.com/gpu，讓工作負載能透過 resources.limits 申請。",
      },
      {
        title: "rdc-exporter",
        desc: "透過 kubelet pod-resources 介面查詢 GPU 對 Pod 的對應。工作負載必須先申請 amd.com/gpu，其指標才會帶有 pod 標籤。",
      },
    ],
    imagesTitle: "釋出映像檔",
    imagesNote: "GHCR 上的官方釋出映像檔：",
    tagFormat: "標籤格式：v1-rocm<ROCm 版本>-<YYYYMMDD>",
    vllmTitle: "用真實工作負載驗證",
    vllmDesc:
      "佈署一個透過 device-plugin 申請一顆 GPU 的 vLLM 推論服務，接著確認 exporter 已把該 Pod 的標籤附加到其 GPU series。",
    prereqTitle: "前置需求",
    prereqs: [
      { title: "Kubernetes 叢集", desc: "一個可用、且能以 kubectl 連線的叢集。" },
      { title: "pod-resources API", desc: "每個 GPU 節點上都存在 kubelet socket（路徑依發行版而異）。" },
      { title: "amd64 GPU 節點", desc: "具備 amdgpu 驅動的 AMD GPU；/dev/kfd 與 /dev/dri 存在。" },
    ],
    guideTitle: "逐步佈署",
    guideDesc:
      "在既有叢集上的端到端流程：從前置元件到驗證 Pod 歸屬。",
    guideSteps: [
      { title: "佈署 node-labeller 與 device-plugin", desc: "套用官方 ROCm/k8s-device-plugin 清單，讓 GPU 節點取得標籤、且 amd.com/gpu 可被排程。" },
      { title: "設定 metric list", desc: "透過 rdc-exporter-metrics ConfigMap（掛載為 metrics.txt）提供要收集的 RDC 欄位。" },
      { title: "對齊 pod-resources socket", desc: "把 DaemonSet 的 hostPath 指向節點實際的 kubelet socket，GPU 才能對應到 Pod。" },
      { title: "佈署並驗證", desc: "建立 monitoring namespace、套用 DaemonSet，接著 curl node:5000/metrics。" },
      { title: "確認 Pod 歸屬", desc: "執行一個申請 amd.com/gpu 的工作負載，確認其 GPU series 取得 pod、namespace、container 標籤。" },
    ],
    socketTitle: "pod-resources socket 路徑",
    socketDesc:
      "rdc-exporter 透過 kubelet pod-resources socket 將 GPU 對應到 Pod。hostPath 必須與節點實際的 kubelet root-dir 相符，而這依發行版而異。可在節點上確認（無輸出代表使用預設值）：",
    socketColDistro: "發行版",
    socketColPath: "節點上的 socket 路徑",
    troubleshootTitle: "疑難排解",
    troubleshootColSymptom: "症狀",
    troubleshootColFix: "可能原因與解法",
    fullGuide: "閱讀完整 Kubernetes 佈署指南",
  },

  configuration: {
    kicker: "設定",
    title: "兩層：字典與選取",
    intro:
      "設定被拆成兩個獨立的層。catalog 是字典，定義每個指標「是什麼」——它的 Prometheus 名稱、HELP 文字、RDC 欄位 id 與單位 (scale)。metric list 則是選取，決定你實際發佈哪些指標。",
    twoLayerTitle: "模型",
    twoLayer: [
      {
        title: "Catalog — 字典",
        desc: "每個指標的身分與單位。完整的預設 catalog 內嵌於執行檔；--catalog 會把你的覆寫疊加其上（或在 overwrite 模式下完全取代）。",
      },
      {
        title: "Metric list — 選取",
        desc: "要發佈的子集合，透過 -e/--fields 或 -f/--fields-file 設定。可用列舉名稱、數字欄位 id 或 Prometheus 名稱來引用指標。",
      },
    ],
    orderTitle: "啟動順序",
    order: [
      "載入 catalog：從內嵌預設開始，再合併 --catalog（或 overwrite）。",
      "套用 metric list：只保留 -e 與 -f 選取的欄位，或內建預設。",
      "發佈：每個指標都是 gauge，發佈值 = 原始 RDC 讀數 × scale。",
    ],
    refTitle: "選取指標：欄位引用",
    refDesc:
      "metric list 的每一筆都從 catalog 選出一個指標。可用以下三種形式引用，皆指向同一個指標。無法對應到任何 catalog 項目的引用會被靜默忽略，這也是 # 開頭能當註解的原因。",
    refColForm: "引用形式",
    refColExample: "範例",
    scaleTitle: "單位換算",
    scaleDesc:
      "每筆讀數在發佈前都會做一次乘法換算。scale 為 1（或任何 ≤ 0、會被正規化為 1 的值）會保留原始值；小數的 scale 則把指標重新換算成更易讀的單位。預設 catalog 已完成常見換算：",
    scaleTableTitle: "預設單位換算",
    mergeTitle: "Merge 與 overwrite",
    mergeDesc:
      "預設情況下，你的 --catalog 會逐欄位疊加到預設之上，因此你只需列出要變更的部分。加上 overwrite: true 則完全取代 catalog。",
    mergeMode: "Merge（預設）：只疊加你變更的欄位",
    overwriteMode: "Overwrite：你的清單即為整個 catalog",
    entryTitle: "Catalog 條目參考",
    entryDesc:
      "每個 catalog 條目以其 RDC metric 名稱為鍵。merge 模式下只需填你要變更的欄位；overwrite 模式下 metric、prom_name、field 皆為必填。",
    entryColKey: "鍵",
    entryColReq: "必填",
    entryColMeaning: "意義",
    exampleTitle: "實作範例：溫度、功耗、以 bytes 表示的記憶體",
    exampleDesc:
      "只輸出溫度、功耗與記憶體用量；保留 °C 與 W 預設，但在合併的 catalog 中僅覆寫該筆 scale，讓記憶體以原始 bytes 呈現。",
    flagsTitle: "設定相關 CLI 旗標",
    fullGuide: "閱讀完整設定指南",
  },

  vsNvidia: {
    kicker: "與 NVIDIA 差異",
    title: "與 DCGM exporter 的差異",
    intro:
      "若你來自 NVIDIA 生態系，心智模型會有所不同。DCGM exporter 使用單一 CSV，把選取、命名與 help 文字混在一起。RDC Exporter 將這些關注點拆成 catalog（定義 + 單位）與 metric list（選取）。",
    colNvidia: "NVIDIA DCGM exporter",
    colRdc: "RDC Exporter",
    rows: [
      { aspect: "設定檔", nvidia: "單一 CSV（如 default-counters.csv）", rdc: "Catalog YAML（選用）+ metric list" },
      { aspect: "檔案的作用", nvidia: "同時選取欄位並設定型別/help", rdc: "Catalog = 身分 + 單位；list = 選取，彼此分離" },
      { aspect: "指標名稱", nvidia: "DCGM 欄位名稱（CSV 第一欄）", rdc: "可設定的 prom_name，並有合理預設" },
      { aspect: "單位換算", nvidia: "不在 CSV 內；之後於 rules / Grafana 處理", rdc: "可在 catalog 中設定，輸出前就先格式化" },
      { aspect: "免設定可用", nvidia: "需要一份 counters CSV", rdc: "可以——內嵌預設 catalog + 選取" },
      { aspect: "開關某指標", nvidia: "編輯 CSV", rdc: "編輯 metric list" },
      { aspect: "新增非預設欄位", nvidia: "新增一列 CSV", rdc: "新增 catalog 項目，再選取它" },
    ],
    whyTitle: "為什麼要拆分？",
    whyDesc:
      "選取經常變動，屬於營運面——我現在這個叢集要哪些指標？名稱與單位則是穩定的定義。把兩者分開，意味著你能用一個小清單（或 ConfigMap）開關指標，而無需重述名稱或單位；單位的重新換算只需在 catalog 做一次，而不必修補每個儀表板與 recording rule。",
    mappingNote:
      "許多 RDC 欄位都對應到 DCGM 等價項——例如 RDC_FI_GPU_TEMP ↔ DCGM_FI_DEV_GPU_TEMP、RDC_FI_PROF_SM_ACTIVE ↔ DCGM_FI_PROF_SM_ACTIVE——讓儀表板遷移變得直觀。",
  },

  metrics: {
    kicker: "指標",
    title: "遙測與 profiling 兩種類型",
    intro:
      "欄位分成兩類，收集成本差異很大。挑選你需要的；exporter 會為每一個換算並加上標籤。",
    telemetryTitle: "遙測 (Telemetry)",
    telemetryDesc:
      "時脈、溫度、功耗、使用率、記憶體與 ECC——來源為 amd-smi / sysfs。收集成本低，且數量沒有硬體限制。",
    profilingTitle: "Profiling",
    profilingDesc:
      "RDC_FI_PROF_* 欄位對應到 GPU 硬體效能計數器 (PMC)。功能強大，但同時收集的數量受硬體封包上限約束。",
    defaultTitle: "經驗證的預設選取",
    defaultDesc:
      "來自 Kubernetes 指南、保守且經驗證的組合：10 個遙測 + 6 個 profiling 欄位，能穩定地一起收集。",
    caveatTitle: "Profiling PMC 封包上限",
    caveatDesc:
      "Profiling 計數器被打包進單一 PMC 封包。一次要求太多可能超過 GPU 的封包容量，導致 RDC profiling 層在工作執行緒中中止——程序仍持續執行、/metrics 仍提供最後一次（過時的）快照，因此失敗很難被察覺。",
    caveatList: [
      "遙測欄位可自由新增；沒有硬體上限。",
      "profiling 欄位先從少量開始、逐步新增，邊加邊驗證。",
      "在 MI355X (gfx950) 上，6 個 profiling 欄位可穩定運作；約 18 個會觸發錯誤。",
      "這是計數器打包上限，並非權限問題——調整權限或 perf_event_paranoid 都無法解決。",
    ],
    tableTitle: "完整 RDC 指標清單",
    tableHint: "catalog 認得的每一個欄位。可依分類篩選，或只顯示預設啟用的集合。",
    colMetric: "RDC 欄位",
    colProm: "Prometheus 名稱",
    colId: "欄位 ID",
    colHelp: "說明",
    colDcgm: "DCGM 等價項",
    colEnable: "預設",
    filterAll: "全部",
    groupCore: "核心",
    groupPcie: "PCIe",
    groupEcc: "ECC",
    groupXgmi: "XGMI",
    groupProfiling: "Profiling",
    groupEvents: "事件",
    groupHealth: "健康",
    enabledOnly: "只顯示預設啟用",
    countLabel: "個欄位",
    fullList: "開啟完整指標清單",
  },

  building: {
    kicker: "建置",
    title: "從原始碼建置",
    intro:
      "Makefile 掌管 ROCm、Go 與映像檔標籤的建置參數。最關鍵的值是 ROCM_DEB——用來設定 ROCm apt repository 的 amdgpu-install 套件 URL。請讓 ROCM_VERSION 與 ROCM_DEB 保持一致。",
    steps: [
      { title: "make build", desc: "編譯 rdc-exporter 執行檔。" },
      { title: "make image", desc: "以設定好的 ROCm/Go 版本建置容器映像檔。" },
      { title: "make image-verify", desc: "在 builder 階段內編譯、vet 並測試整個 module。" },
    ],
    note: "需要時可從命令列覆寫版本：",
  },

  footer: {
    builtBy: "開發團隊",
    team: "AMD aFDE team (DCGPU System Eng TWN, AMD Inc.)",
    author: "Chen-Hao Ku <Bill.Ku@amd.com>",
    disclaimer:
      "本網站彙整專案文件與原始碼內容。如需權威細節，請一律以儲存庫文件為準。",
    docsHeading: "文件",
    docConfig: "設定指南",
    docDeploy: "Kubernetes 佈署指南",
    docMetrics: "完整指標清單",
    resourcesHeading: "資源",
    rocmRdc: "ROCm Data Center Tool (RDC)",
    devicePlugin: "AMD GPU device-plugin",
    vllm: "vLLM",
  },

  common: {
    copy: "複製",
    copied: "已複製",
    note: "備註",
    caution: "注意",
    backToTop: "回到頂部",
  },
};
