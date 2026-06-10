/**
 * Identifier for a supported UI locale.
 *
 * Used as the key type for the dictionary map and persisted choice. The codes
 * are app-internal (`zhTW` / `zhCN`, not BCP-47); the provider maps them to
 * `<html lang>` tags separately. Adding a member here forces a matching
 * dictionary in `./en`, `./zhTW`, `./zhCN` and an entry in `LANG_ORDER`.
 */
export type Lang = "en" | "zhTW" | "zhCN";

/**
 * A title + description pair, the repeated shape behind most content lists
 * (purpose cards, flow steps, prerequisites, etc.).
 *
 * Both fields are localized display strings; rendering order is the array order.
 */
export interface LabeledList {
  title: string;
  desc: string;
}

/**
 * Content is the full localized-copy contract for a single locale.
 *
 * Every locale module (`en`, `zhTW`, `zhCN`) implements this interface, so
 * TypeScript guarantees the locales stay structurally in sync: a key added here
 * must be translated in all of them before the build type-checks. It holds only
 * human-facing strings, grouped by the section that consumes them. Strictly
 * language-neutral data (shell/YAML snippets, RDC field identifiers, reference
 * tables) lives in `./data` and is intentionally not part of this contract.
 */
export interface Content {
  /** Native language label shown inside the language switcher. */
  langName: string;

  nav: {
    purpose: string;
    architecture: string;
    deployment: string;
    configuration: string;
    vsNvidia: string;
    metrics: string;
    building: string;
  };

  hero: {
    eyebrow: string;
    titleLead: string;
    titleAccent: string;
    tagline: string;
    ctaQuickstart: string;
    ctaDocs: string;
    ctaGithub: string;
    stats: LabeledList[];
  };

  purpose: {
    kicker: string;
    title: string;
    intro: string;
    cards: LabeledList[];
    outputCaption: string;
    workloadNote: string;
  };

  architecture: {
    kicker: string;
    title: string;
    intro: string;
    flowTitle: string;
    flowDesc: string;
    flowSteps: LabeledList[];
  };

  deployment: {
    kicker: string;
    title: string;
    intro: string;
    dockerTitle: string;
    dockerDesc: string;
    k8sTitle: string;
    k8sDesc: string;
    k8sComponents: LabeledList[];
    imagesTitle: string;
    imagesNote: string;
    tagFormat: string;
    vllmTitle: string;
    vllmDesc: string;
    prereqTitle: string;
    prereqs: LabeledList[];
    guideTitle: string;
    guideDesc: string;
    guideSteps: LabeledList[];
    socketTitle: string;
    socketDesc: string;
    socketColDistro: string;
    socketColPath: string;
    troubleshootTitle: string;
    troubleshootColSymptom: string;
    troubleshootColFix: string;
    fullGuide: string;
  };

  configuration: {
    kicker: string;
    title: string;
    intro: string;
    twoLayerTitle: string;
    twoLayer: LabeledList[];
    orderTitle: string;
    order: string[];
    refTitle: string;
    refDesc: string;
    refColForm: string;
    refColExample: string;
    scaleTitle: string;
    scaleDesc: string;
    scaleTableTitle: string;
    mergeTitle: string;
    mergeDesc: string;
    mergeMode: string;
    overwriteMode: string;
    entryTitle: string;
    entryDesc: string;
    entryColKey: string;
    entryColReq: string;
    entryColMeaning: string;
    exampleTitle: string;
    exampleDesc: string;
    flagsTitle: string;
    fullGuide: string;
  };

  vsNvidia: {
    kicker: string;
    title: string;
    intro: string;
    colNvidia: string;
    colRdc: string;
    rows: { aspect: string; nvidia: string; rdc: string }[];
    whyTitle: string;
    whyDesc: string;
    mappingNote: string;
  };

  metrics: {
    kicker: string;
    title: string;
    intro: string;
    telemetryTitle: string;
    telemetryDesc: string;
    profilingTitle: string;
    profilingDesc: string;
    defaultTitle: string;
    defaultDesc: string;
    caveatTitle: string;
    caveatDesc: string;
    caveatList: string[];
    tableTitle: string;
    tableHint: string;
    colMetric: string;
    colProm: string;
    colId: string;
    colHelp: string;
    colDcgm: string;
    colEnable: string;
    filterAll: string;
    groupCore: string;
    groupPcie: string;
    groupEcc: string;
    groupXgmi: string;
    groupProfiling: string;
    groupEvents: string;
    groupHealth: string;
    enabledOnly: string;
    countLabel: string;
    fullList: string;
  };

  building: {
    kicker: string;
    title: string;
    intro: string;
    steps: LabeledList[];
    note: string;
  };

  footer: {
    builtBy: string;
    team: string;
    author: string;
    disclaimer: string;
    docsHeading: string;
    docConfig: string;
    docDeploy: string;
    docMetrics: string;
    resourcesHeading: string;
    rocmRdc: string;
    devicePlugin: string;
    vllm: string;
  };

  common: {
    copy: string;
    copied: string;
    note: string;
    caution: string;
    backToTop: string;
  };
}
