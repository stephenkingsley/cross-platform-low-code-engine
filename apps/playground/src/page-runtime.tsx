/**
 * PageRuntime — now powered by the PUBLISHED `pandora-box-react` package.
 *
 * The preview renders through the exact runtime a consumer would `npm install`:
 * `createRuntime` pre-binds this app's dp-design registry + manifest + provider, so
 * the bound component just takes `{ doc, locale, fallbackLocale }`. No editor, no Puck.
 *
 *     import { PageRuntime } from './page-runtime';
 *     <PageRuntime doc={pageJson} locale="zh" />
 */
import type { ReactNode } from 'react';
import { createRuntime, type Manifest } from 'pandora-box-react';
import { DpConfig, DpProvider } from '@lce/components-dp';
import { registry, renderableManifest } from './registry';

/** dp-design provider that also sets the active locale on DpConfig (dp's ConfigProvider). */
function DpWrapper({ locale, children }: { locale?: string; children: ReactNode }) {
    return (
        <DpConfig.Provider value={{ locale: locale ?? 'en' }}>
            <DpProvider>{children}</DpProvider>
        </DpConfig.Provider>
    );
}

export const PageRuntime = createRuntime({
    registry,
    manifest: renderableManifest as unknown as Manifest,
    wrapper: DpWrapper,
    fallbackLocale: 'en',
});
