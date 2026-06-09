# rdc-exporter Clean Architecture 重構整合計畫

- 整合時間: 2026-06-09 17:52
- 主題: 依 `docs/development` 的 Clean Architecture + DDD spec 重構 rdc-exporter

## 1. Purpose（目的）

把目前混層的程式碼重整為 Clean Architecture 四層（Entities / Use Cases /
Interface Adapters / Frameworks and Drivers），補齊符合 `coding-style.md` 的
doc comments，並為內層加上單元測試。**對外使用方式、CLI、metrics 輸出與行為
完全不變**。`rdc-parser` 維持為周邊輔助工具，整個專案以 `rdc-exporter` 為核心。

## 2. Source Scope（來源範圍）

本計畫由下列手稿整合而成：

- `docs/plans/manuscripts/20260609-rdc-exporter-clean-arch.md`
  （rdc-exporter Clean Architecture 重構手稿，狀態:已完成 — 純 Go 套件
  gofmt/vet/test 通過;cgo 套件需 ROCm 環境經 `make image` 建置）

共 1 份來源手稿（不含作為 spec 的 `README.md`）。

## 3. Consolidated Background（整合背景）

現有程式碼為混層結構，職責分散且缺乏一致的測試與文件。重構目標是在不改變任何
對外行為的前提下，導入 Clean Architecture 的依賴方向（外層依賴內層，內層不知
道外層），並以 DDD 思維界定核心領域:GPU metric 的蒐集、scale、labeling。

核心挑戰在於 cgo 對 ROCm RDC C library 的相依:`rdc.h` 與實體 GPU 僅存在於
ROCm 容器環境，本機無法建置 cgo 套件。因此設計上需把 cgo 相依隔離在最外層，讓
內層（domain / use case / config）保持純 Go，可在任何主機 `go test` 驗證;cgo
層則透過 Docker image 建置驗證。

## 4. Confirmed Decisions（已確認決策）

- 採用 Clean Architecture 四層，依賴方向嚴格由外向內。
- ports（`FieldReader`、`LabelProvider`、`MetricSink`）由**消費端（use case）**
  定義，adapter 實作之，藉此反轉依賴、隔離 cgo。
- `rdc-parser` 為周邊輔助工具，核心是 `rdc-exporter`。
- `cmd/rdc-exporter/main.go` 路徑保留，使 `make build`/`make image`/Dockerfile/
  daemonset/README 的使用方式不變。
- cgo binding 套件 `internal/bindings/rdc` **位置不變**，本次僅補註解。
- 衝突解決原則:採較新或較明確的決策;無法解決者列入 Open Questions。

## 5. Architecture and Design Principles（架構與設計原則）

目標分層:

- **Entities**: `internal/domain/metric`
  - 型別:`FieldID`、`GPUIndex`、`Definition{FieldID, Name, Help, Scale}`、
    `Sample{GPUIndex, FieldID, Value}`、`Point{GPUIndex, Value, Labels}`。
  - 核心規則:`Definition.ApplyScale(raw)`（scale <= 0 視為 1）。
  - label 組裝規則:`gpu_index` 字串恆為第一個 label，其後接動態 label。
- **Use Cases**: `internal/usecase/collect`
  - ports（消費端定義）:`FieldReader`、`LabelProvider`、`MetricSink`。
  - `Service.Collect(ctx)` 流程:Refresh labels → ReadSamples → ApplyScale →
    組 label → Publish;回傳 `ErrNoSamples` 對應現行 "no field values updated"。
- **Interface Adapters**:
  - `internal/adapter/rdcsource`:RDC 生命週期 + 並發讀值 + binding→Sample，
    實作 `FieldReader`。
  - `internal/adapter/prommetric`:GaugeVec 註冊/更新/label delete-on-change，
    實作 `MetricSink`。
  - `internal/adapter/k8slabeler`:實作 `LabelProvider`。
- **Frameworks and Drivers**:
  - `cmd/rdc-exporter`（wiring / HTTP / loop）、`cmd/rdc-parser`（周邊工具）、
    `internal/bindings/rdc`（cgo）、`internal/config/catalog`（YAML loader）、
    `internal/hostgpu`（sysfs discovery）。

設計原則:內層純 Go、不知外層;cgo 相依僅存在最外層;以注入式 resolver 將
cgo 取得的 field name 等資訊餵給內層，避免內層直接相依 cgo。

## 6. Functional Scope（功能範圍）

- GPU metric 蒐集 5 秒 scrape loop。
- catalog 解析:default / merge / overwrite / filter / validate 規則。
- metric 輸出:名稱 / help / scale 與 label 行為（`gpu_index` 恆為第一個
  label + 動態 label，變動時 delete 舊 series）。
- Kubernetes pod resources 對應 GPU 的 labeling（透過 `LabelProvider`）。
- `/metrics` 端點與 `/` 轉址。
- self-monitoring 與 debug 選項。

## 7. Constraints and Rules（限制與規則）

嚴格不變量（對外行為）:

- CLI flags 完全相同:`-l/--listen-address`、`-d/--debug`、`--catalog`、
  `-e/--fields`、`-f/--fields-file`、`-i/--gpu-indexes`、`-k/--kubelet`、
  `--self-monitoring`。
- `/metrics` 與 `/` 轉址、5 秒 scrape loop、watch 參數、預設 fields 清單、
  catalog merge/overwrite/filter 規則、metric 名稱/help/scale、label 行為、
  "no field values updated" 行為全部保留。
- `make build` / `make image` / Dockerfile / daemonset / README 的使用方式不變
  （`cmd/rdc-exporter/main.go` 路徑保留）。

建置與驗證限制:

- cgo 層（`internal/bindings/rdc`、`internal/adapter/rdcsource`、`cmd/*`）需
  `/opt/rocm` 與實體 GPU，本機無法建置驗證，僅靜態審閱，透過 `make image` 在
  Docker 內建置。
- 純 Go 套件（domain / usecase / config / hostgpu）可在本機 `go test` 驗證。

## 8. Data Model and Format Notes（資料模型與格式註記）

- 領域型別集中於 `internal/domain/metric`:`FieldID`、`GPUIndex`、`Definition`、
  `Sample`、`Point`。
- `Definition.Scale` <= 0 時視為 1（不縮放）。
- label 順序固定:`gpu_index`（字串）恆為第一個，之後為動態 label。
- catalog 由 YAML 載入並 embed `catalog.yaml`（移至 `internal/config/catalog`）。
- `DefinitionsFromEntities` 將 catalog entity 映射為內層 `Definition`，透過注入
  的 resolver 取得 cgo field name，使內層不直接相依 cgo。

## 9. CLI / API / Config Notes（CLI / API / 設定註記）

- CLI flags 與預設值完全沿用（見 Constraints）。
- HTTP API:`/metrics`（Prometheus exposition）、`/` 轉址至 `/metrics`。
- 設定來源:`--catalog` YAML、`-e/--fields`、`-f/--fields-file`、
  `-i/--gpu-indexes`、`-k/--kubelet`。
- catalog 規則:default / merge / overwrite / filter / validate。

## 10. Implementation Plan（實作計畫）

套件搬遷對照:

- `pkg/exporter/expoter.go` → `internal/usecase/collect/`。
- `pkg/scraper/rdc/scraper.go` → 拆為 `internal/adapter/rdcsource` 與
  `internal/adapter/prommetric`;`config.go` → `rdcsource/config.go`。
- `pkg/labeler/labeler.go` interface → 移除，改由 use case 定義 `LabelProvider`。
- `pkg/labeler/k8s/*` → `internal/adapter/k8slabeler/`。
- `pkg/hostgpu` → `internal/hostgpu`。
- `pkg/catalog/*` → `internal/config/catalog/*`（含 `catalog.yaml` embed）。
- `pkg/ptr` → 移除（以區域變數取址取代）。
- `internal/bindings/rdc/*` 位置不變，僅補註解。

命名修正（僅內部符號）:

- `RdcScraper` → `RDCScraper` 類比。
- 拼字修正:`MaxiumKeepAge`/`MaxiumKeepSamples`/`UpdateFrequencey`、`gpuIndexs`、
  `catalg`、`k8sLabler`。
- getter 命名:`GetLabelKeys` → `LabelKeys`、`GetLabelsByGpu` → `LabelsFor`。

測試（內層，免 GPU）:

- `domain/metric`:`ApplyScale`、label 組裝/驗證，table-driven。
- `usecase/collect`:fake ports 驗證流程、scale、label、空樣本錯誤。
- `config/catalog`:default / merge / overwrite / filter / validate 與
  `DefinitionsFromEntities`（注入假 resolver）。

## 11. Non-goals（非目標）

- 不改變任何對外行為:CLI、metrics 輸出、HTTP 端點、scrape 行為皆維持原樣。
- 不改變 `cmd/rdc-exporter/main.go` 路徑與既有建置/部署使用方式。
- 不變動 `internal/bindings/rdc` 的位置與行為（僅補註解）。
- 不引入來源手稿未支持的大型新設計。
- `rdc-parser` 不升格為核心，維持周邊輔助工具定位。

## 12. Open Questions（待解問題）

目前來源手稿未留下未解衝突或待決問題。（無）

## 13. Future Work（未來工作）

- 持續為 cgo 層尋找可在 CI/Docker 中自動化的編譯與整合驗證方式。
- 視需要為 adapter 層補上可在無 GPU 環境執行的整合測試（以 fake/contract 測試
  覆蓋 ports）。
