import { I18nProvider } from "./i18n";
import { Nav } from "./components/Nav";
import { Footer } from "./components/Footer";
import { Hero } from "./sections/Hero";
import { Purpose } from "./sections/Purpose";
import { Architecture } from "./sections/Architecture";
import { Deployment } from "./sections/Deployment";
import { Configuration } from "./sections/Configuration";
import { VsNvidia } from "./sections/VsNvidia";
import { Metrics } from "./sections/Metrics";
import { Building } from "./sections/Building";

/**
 * App is the root composition for the single-page marketing/documentation site.
 *
 * It mounts the `I18nProvider` once at the top so every section below resolves
 * its copy from the active locale; switching languages re-renders the whole
 * tree from this boundary. The two `aria-hidden` background layers are ambient
 * decoration only (fixed, negative z-index in CSS) and are intentionally kept
 * outside `<main>` so assistive technology skips them. Section order here is the
 * canonical reading order of the page and is mirrored by the in-page nav anchors.
 */
export function App() {
  return (
    <I18nProvider>
      <div className="bg-field" aria-hidden />
      <div className="bg-grid" aria-hidden />
      <Nav />
      <main>
        <Hero />
        <Purpose />
        <Architecture />
        <Deployment />
        <Configuration />
        <VsNvidia />
        <Metrics />
        <Building />
      </main>
      <Footer />
    </I18nProvider>
  );
}
