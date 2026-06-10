# Dashboard TypeScript + React Coding Style

本文件定義 dashboard 撰寫與修改 TypeScript + React 程式碼時的 coding style rule，適用於所有開發人員與 AI agent。

本文以本專案實務為準，並整理自以下參考：

- [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
- [Airbnb React/JSX Style Guide](https://github.com/airbnb/javascript/tree/master/react)

若本文件、工具設定與外部 style guide 有衝突，優先順序為：

1. 本文件。
2. Codebase 內既有 ESLint、TypeScript、Vite 與測試設定。
3. 鄰近檔案既有風格。
4. Google TypeScript Style Guide。
5. Airbnb React/JSX Style Guide。

## 核心原則

Dashboard 程式碼必須優先滿足以下目標，順序不可顛倒：

1. 清晰：讀者能理解 UI 在呈現什麼、資料從哪裡來，以及互動會造成什麼影響。
2. 可維護：component、hook、helper 的責任邊界明確，未來修改者能安全演進。
3. 型別安全：用 TypeScript 表達資料契約，避免讓 runtime 才暴露可由型別捕捉的錯誤。
4. 可存取性：互動元件與內容必須能被鍵盤、輔助科技與不同使用情境正確使用。
5. 一致：遵守本文件、工具設定與同目錄既有寫法。

若規則之間有衝突，優先選擇更清楚、更容易維護、較不容易誤用的寫法。

## 檔案與模組

- 所有 TypeScript/TSX 檔案使用 UTF-8。
- React component 檔案使用 `.tsx`；純 TypeScript helper、type、constant 使用 `.ts`。
- 檔案順序固定為：檔案層級 JSDoc（若需要）、imports、module constants/types、implementation。
- 優先使用 named exports；除非工具或框架明確要求，不使用 default export。
- 同一檔案原則上只放一個主要 React component；只服務該 component 的小型 helper component 可放在同檔。
- Imports 交由工具排序時遵守工具；人工調整時維持分組清楚：React/第三方、本專案模組、相對路徑。
- 避免深層 `../../../` imports。若路徑顯示模組邊界混亂，優先整理檔案位置或建立清楚的 barrel/module boundary。
- Side-effect import 只可用於 CSS、polyfill 或明確需要註冊 side effect 的模組；非直覺 side effect 必須加註說明。

## 命名

- Component、type、interface、enum 與 type parameter 使用 `UpperCamelCase`。
- 變數、函式、hook、method、property、module alias 與 props 使用 `lowerCamelCase`。
- React component 檔名應與 component 名稱一致，例如 `WorkerList.tsx` 匯出 `WorkerList`。
- Hook 必須以 `use` 開頭，且名稱描述其取得的狀態或封裝的行為，例如 `useWorkerStatus`。
- 全域常數可使用 `CONSTANT_CASE`；區域變數即使是 `const` 也使用 `lowerCamelCase`。
- 名稱必須清楚，不使用只有局部團隊才懂的縮寫。Acronym 視為單字處理，例如 `requestId`、`apiClient`、`loadHttpUrl`。
- 不在名稱中重複型別已表達的資訊，例如避免 `isEnabledBoolean`、`userListArray`。
- 不使用 `_` 作為 prefix/suffix，也不以 `_` 表示未使用參數；應移除未使用參數或調整函式簽名。

## TypeScript 規範

- 讓 TypeScript 推斷明顯型別，例如 `const isOpen = true`；複雜表達式、跨模組 API、exported function 與重要 callback 應明確標註型別。
- Object shape 優先使用 `interface`；union、tuple、mapped type、utility type composition 使用 `type`。
- 禁止任意使用 `any`。若因第三方 API 或逐步遷移不得不用 `any`，必須用註解說明原因與安全邊界。
- 優先使用 `unknown` 表示尚未驗證的外部資料，驗證或 narrowing 後再使用。
- Optional field/parameter 使用 `?`，不要把 `| undefined` 放進共用 type alias。
- 不把 `null` 或 `undefined` 隱藏在廣泛共用的 alias 中；缺值語意應靠近產生或消費的位置清楚表達。
- Array 型別：簡單型別使用 `T[]` 或 `readonly T[]`；複雜 union/object 使用 `Array<T>` 或 `ReadonlyArray<T>`。
- 優先使用 `readonly` 表達不可變資料，尤其是 props、設定、查詢結果與不應由 component 修改的集合。
- 不使用 wrapper object 型別，例如 `String`、`Number`、`Boolean`；使用 `string`、`number`、`boolean`。
- 型別斷言只能用在已知安全但 TypeScript 無法推斷的情境；不可用來跳過真實型別問題。

## React 與 JSX

- 優先撰寫 function component，不新增 class component。
- Component 使用 `UpperCamelCase`，component instance 或 JSX fragment 變數使用 `lowerCamelCase`。
- Props 名稱使用 `lowerCamelCase`；若 prop 接收 React component，可使用 `UpperCamelCase`，例如 `Icon={StatusIcon}`。
- Boolean prop 為 `true` 時省略值，例如 `<Dialog open />`。
- JSX attribute 使用雙引號；一般 TypeScript 字串遵守專案格式工具或既有風格。
- 多行 JSX 每個 prop 獨立成行，closing bracket 與內容縮排保持一致。
- 條件渲染必須讓 false/null/undefined 的顯示結果清楚。複雜條件先抽成具名變數，避免在 JSX 裡堆疊難讀邏輯。
- List rendering 必須使用穩定 key，例如資料 ID；除非列表永不重排、永不插入刪除且無 local state，否則不得使用 array index 當 key。
- Spread props 只用在 HOC、proxy component、測試 fixture，或已知且範圍小的 props 物件；傳到 DOM 前必須過濾非 DOM attributes。
- 不直接修改 props、state 或 context value；以 immutable update 建立新值。
- Hook 必須遵守 React Hooks 規則：只在 function component 或 custom hook 頂層呼叫，不放入條件、迴圈或巢狀函式。
- `useEffect` 必須描述外部同步、副作用或訂閱。能由 render、memo 或 event handler 完成的邏輯，不應塞進 effect。
- `useMemo`、`useCallback` 只在能改善 referential stability、避免昂貴計算或符合 dependency contract 時使用；不可作為預設包裝。

## 可存取性

- 所有 `<img>` 必須有 `alt`。裝飾圖片使用空字串 `alt=""` 或適合的 presentation 語意。
- `alt` 不重複寫入 "image"、"photo"、"picture" 等輔助科技已會朗讀的字詞。
- 互動元素優先使用語意化 HTML，例如 `<button>`、`<a>`、`<label>`、`<input>`。
- 若必須使用非語意元素模擬互動，必須補齊 `role`、keyboard interaction、focus state 與必要 ARIA attributes。
- 只使用有效且非抽象的 ARIA role。ARIA 不應用來掩蓋錯誤 HTML 結構。
- 不使用 `accessKey`。
- 表單欄位必須有可辨識 label，錯誤訊息必須能被使用者與輔助科技理解。

## 註解與 JSDoc

本專案要求「必要註解必須撰寫」。註解不是裝飾，而是 API 契約、UI 意圖與維護知識的一部分。

只重述 component、hook、helper、type 或 props 名稱的 JSDoc 不合格。這類 JSDoc 即使能滿足形式要求，也視為缺少文件。例如 `/** Renders the user table. */`、`/** User props. */`、`/** Calls the API. */` 都不是有效文件。

合格 JSDoc 必須補足讀者無法只從名稱、props 型別與 JSX 推論出的資訊：使用情境、資料來源、權限與可見性假設、loading/error/empty state、side effect lifecycle、accessibility 意圖、或跨 API/schema/glossary 邊界的 contract。

### 必須撰寫註解的情況

- 所有 top-level export 必須有 JSDoc，包括 component、hook、type、interface、constant 與 helper function。
- Page component、route guard、app shell、provider、custom hook、API adapter、storage adapter、DTO mapper、use case helper、permission helper 即使未 export，只要是重要 application boundary，也必須有 JSDoc。
- Reusable component 必須說明用途、主要情境，以及重要 props 的語意。
- Custom hook 必須說明它封裝的狀態來源、副作用、訂閱、快取或生命週期。
- Shared helper 必須說明輸入輸出契約、錯誤語意、單位、排序、filter 條件或資料轉換假設。
- 非直覺 UI 行為、權限判斷、資料一致性假設、效能取捨、相容性考量、edge case 必須註解說明。
- `useEffect` 若包含訂閱、timer、network request、DOM API 或 cleanup，必須用註解說明副作用目的與 cleanup 條件。
- 刻意忽略錯誤、刻意省略 dependency、使用 type assertion、使用 `any`、使用 index key 或繞過 lint 時，必須註解原因。
- 跨模組 contract 或與後端/API/schema/glossary 相關的資料語意，必須在 type 或轉換邏輯附近說明。
- 涉及 JWT storage/refresh、admin route guard、current-user data visibility、Conductor DTO mapping、browser storage、network effects、accessibility workaround、theme token mapping、或 token secret display 時，必須註解安全假設與維護限制。

### JSDoc 最低審查標準

Top-level export 與重要 internal boundary 的 JSDoc 必須能回答與該 symbol 相關的問題。不是每個 symbol 都需要回答所有問題，但缺少 relevant answer 時視為文件不足。

- Usage context：此 component/hook/helper 在哪個 user flow 或 route 中使用。
- Data source and ownership：資料來自 props、use case、adapter、browser storage、route、或後端 API；資料屬於 current User、admin scope、或 public scope。
- Props and return semantics：重要 props、callback、hook return state 的語意與限制。
- UI state contract：loading、empty、error、success、permission-denied 狀態如何呈現。
- Side effect lifecycle：network request、subscription、timer、storage、navigation、focus management 的啟動與 cleanup 條件。
- Accessibility intent：非標準互動、ARIA、keyboard behavior、focus management 或 status message 的使用原因。
- Compatibility and security：哪些行為是 API contract、glossary term、token/security rule、或未來改版不能任意破壞的。

### Clean Architecture 分層註解標準

- Domain type：JSDoc 必須描述 dashboard 使用的 domain meaning、allowed state、與 glossary/API term 的關係，不得只描述畫面欄位。
- Application use case/helper：JSDoc 必須描述 user intent、port dependency、狀態轉換、錯誤語意與權限假設。
- Adapter/DTO mapper：JSDoc 必須描述外部 API/browser storage/route shape 如何轉成內層 model，以及哪些欄位是 published contract。
- UI component/page：JSDoc 必須描述使用情境、資料可見性、重要 props、狀態呈現與 accessibility 意圖。
- Infrastructure/provider：JSDoc 必須描述 browser API、storage key、network client、router、theme、或 environment variable 的 lifecycle 與安全限制。

### 註解寫法

- 使用 `/** JSDoc */` 描述程式碼使用者需要知道的 API、component、hook、type 與 module contract。
- 使用 `//` 描述 implementation detail，例如某段分支為何存在或某個 workaround 的原因。
- 註解應說明 why、contract、assumption、edge case，不應重述程式碼已清楚表達的 what。
- 註解必須與程式碼同步更新；過期註解視為 bug。
- JSDoc 可以使用 Markdown。多個重點用 Markdown list，不用手動排版空白對齊。
- TypeScript 已表達的型別不要再寫在 `@param` 或 `@returns` 中；只有在補充限制、單位、範圍或副作用時才使用 tag。
- 多行 implementation comment 使用連續 `//`，不要使用 `/* ... */` 區塊註解。

```tsx
/**
 * WorkerCapacityCard displays Worker capacity in the operator dashboard.
 *
 * The card keeps stale Workers visible because operators compare current
 * capacity with the last heartbeat observed by Conductor. `workers` must
 * already be mapped from the Conductor DTO into dashboard domain rows.
 */
export function WorkerCapacityCard(props: WorkerCapacityCardProps) {
  // Keep stale workers visible so operators can compare current and last known capacity.
  const visibleWorkers = includeStaleWorkers(props.workers);

  return <CapacityChart workers={visibleWorkers} />;
}
```

避免無意義註解：

```tsx
/** Renders the home page. */
function HomePage() {
  return <WorkerList />;
}

/** Calls the API. */
export async function loadWorkers(): Promise<readonly Worker[]> {
  // ...
}
```

撰寫有維護價值的註解：

```tsx
/**
 * HomePage is the authenticated regular User landing page.
 *
 * In M0 it shows only the current User's Workers. It must not call the
 * platform-wide Worker list contract because that endpoint requires admin
 * capability and would leak other Users' Workers.
 */
function HomePage() {
  return <MyWorkerListBlock />;
}

/**
 * loadWorkers retrieves Workers through the dashboard WorkerRepository port.
 *
 * The returned rows are dashboard domain rows, not Conductor DTOs. The adapter
 * owns response validation and maps authorization failures to an application
 * error that UI components can display without exposing backend internals.
 */
export async function loadWorkers(): Promise<readonly Worker[]> {
  // ...
}

// Keep the previous route visible while the refresh is pending to avoid
// briefly showing an empty dashboard during worker heartbeat updates.
const routeRows = pendingRoutes ?? previousRouteRows;
```

## 狀態、資料與副作用

- Component state 只保存 UI 真正需要記住的狀態；可由 props 或資料計算出的值不重複存 state。
- 遠端資料、URL state、form state、local UI state 應保持邊界清楚，不混在同一個大型 state object 中。
- 資料轉換應放在具名 helper 或 hook 中；複雜 map/filter/sort 不直接塞在 JSX 內。
- Network request、subscription、timer、browser storage、DOM API 都屬於副作用，必須集中管理 cleanup 與錯誤處理。
- 對外部資料進入 UI 前應完成必要 parsing、validation 或 narrowing，不讓 component 內散落重複防禦邏輯。
- Error state、loading state、empty state 必須明確建模，不以 magic string 或不清楚的 boolean 組合暗示。

## 錯誤處理

- 可失敗的 async helper 必須清楚回傳錯誤、丟出錯誤，或轉成明確 UI state；不得默默吞掉錯誤。
- 捕捉錯誤後若只為了 fallback，必須保留足夠脈絡供 log、debug 或 UI 呈現。
- 使用者可見錯誤訊息應描述可採取的下一步；開發者診斷資訊應放在 log 或 debug context，不直接暴露敏感資料。
- 不使用 `alert` 作為一般錯誤處理或使用者通知機制。

## 測試規範

- 測試應驗證使用者可觀察行為與資料契約，不只驗證 implementation detail。
- Component test 優先從角色、label、文字與互動結果查詢元素。
- 測試名稱必須描述場景與期待結果。
- 對 hook、helper、資料轉換與錯誤處理新增或修改行為時，應補上對應測試。
- Test fixture 應小而明確；避免共享可變 fixture 造成測試彼此影響。

## Agent 執行規則

AI agent 修改 dashboard 程式碼時必須遵守以下規則：

- 先閱讀鄰近檔案與本文件，再進行修改。
- 新增 top-level export、component、hook、type 或 helper 時，必須同步新增有維護價值的 JSDoc。
- `top-level export` 只是最低門檻；page、route guard、provider、app shell、adapter、storage、use case helper、permission/data visibility boundary 即使未 export，也必須撰寫有維護價值的 JSDoc。
- 修改 props、hook return value、資料轉換、錯誤語意、副作用或 accessibility 行為時，必須同步更新註解與測試。
- 若實作需要複雜條件、workaround、type assertion、`any` 或 lint disable，必須先嘗試簡化；無法簡化時用註解說明必要原因。
- 形式 JSDoc、identifier summary comment、只描述 `what` 的 comment 視為不符合規範；必須補足 usage context、state contract、data visibility、side effect lifecycle、accessibility intent 或 why。
- 新增 JWT/session storage、Conductor API adapter、admin/current-user route guard、browser storage、network effect、theme token mapping、或 token secret display 時，必須先確認註解是否達到本文件的最低審查標準。
- 不得用大量低價值註解填充；註解必須幫助未來讀者避免誤用或誤改。
- 不得引入與 dashboard 既有工具鏈不一致的抽象、命名、狀態管理或測試工具，除非修改本身就是為了統一風格。
- 完成修改前應執行或建議執行相關 lint、typecheck、test 與 format 指令。

