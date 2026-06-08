/**
 * PageRuntime — the standalone ReactJS runtime component (deliverable #2).
 *
 * Give it the page JSON the builder produces (the "Page JSON"); it renders the page.
 * It bundles everything the consumer would otherwise wire by hand:
 *   • the Puck-FREE <Render> walker (from @lce/runtime-react),
 *   • the component registry (dp-design + engine primitives, by type id),
 *   • the manifest (so the walker knows which props are slots / arrays / localized text),
 *   • the dp-design provider (theme tokens + ConfigProvider locale).
 *
 * So the only thing a host app passes is `doc` (+ optional `locale`):
 *
 *     import { PageRuntime } from './page-runtime';
 *     <PageRuntime doc={pageJson} locale="zh" />
 *
 * No Puck, no editor — this is what ships in production. The React Native runtime is
 * the SAME component with a native registry (dp's RN components + the engine `.native`
 * bindings); the document JSON is identical across platforms.
 */
import type { DocData, Manifest, Node } from '@lce/manifest';
import { Render } from '@lce/runtime-react';
import { DpConfig, DpProvider } from '@lce/components-dp';
import { registry, renderableManifest } from './registry';

const manifest = renderableManifest as Manifest;

export interface PageRuntimeProps {
    /** The page document produced by the builder (root + content[] + zones). */
    doc: DocData;
    /** Active content locale — localized text resolves to this language. @default 'en' */
    locale?: string;
    /** Locale to fall back to when a translation is missing. @default 'en' */
    fallbackLocale?: string;
    /** Rendered when a `node.type` has no registered component (default: skip). */
    fallback?: (node: Node) => React.ReactNode;
}

export function PageRuntime({
    doc,
    locale = 'en',
    fallbackLocale = 'en',
    fallback,
}: PageRuntimeProps) {
    return (
        <DpConfig.Provider value={{ locale }}>
            <DpProvider>
                <Render
                    data={doc}
                    registry={registry}
                    manifest={manifest}
                    locale={locale}
                    fallbackLocale={fallbackLocale}
                    fallback={fallback}
                />
            </DpProvider>
        </DpConfig.Provider>
    );
}
