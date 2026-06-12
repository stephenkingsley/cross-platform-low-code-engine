import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { StyleProvider } from '@ant-design/cssinjs';
import { ConfigProvider } from '@dragonpass/atom-ui-mobile';
// Side-effect CSS for the main-document runtime / preview view.
import '@dragonpass/atom-ui-mobile/dist/es/style/index.css';
import '@dragonpass/atom-ui-mobile/dist/style/style.ga.css';
// The same CSS as raw strings, to inject into Puck's iframe document for the canvas.
import themeCss from '@dragonpass/atom-ui-mobile/dist/style/theme.ga.css?inline';
import styleCss from '@dragonpass/atom-ui-mobile/dist/style/style.ga.css?inline';
import { DpProvider, dpRegistry, DpConfig, type DpConfigValue } from 'pandora-box-dp';

/**
 * Single source of truth: the dp registry + provider + locale context come from the published
 * `pandora-box-dp` — the SAME code the runtime ships. This package now adds only the EDITOR chrome
 * (phone-frame page, Puck-iframe styling, dp CSS), which is builder-only and absent from the runtime.
 */
export { DpProvider, dpRegistry, DpConfig, type DpConfigValue };

const stageStyle: CSSProperties = {
    minHeight: '100%',
    background: 'var(--lce-stage-bg, #eef1f4)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'stretch', // phone card fills the canvas height → short pages don't scroll
    padding: '32px 16px',
    boxSizing: 'border-box',
};
const phoneStyle: CSSProperties = {
    width: 375,
    maxWidth: '100%',
    background: '#fff',
    borderRadius: 22,
    // Clip full-bleed content (e.g. a hero image) to the card's rounded corners.
    overflow: 'hidden',
    boxShadow: '0 12px 40px rgba(10, 35, 51, 0.16)',
};

/**
 * Phone-frame page: a centred white card on a soft backdrop. `width` defaults to 375 — the design
 * base width, so a full-bleed `width:100%` module is exactly 375 device-px (1rem = 37.5px) in BOTH
 * the editor canvas and the content preview (no 390-vs-375 drift). A prop can override per surface.
 */
export function DpPage({ children, width }: { children: ReactNode; width?: number }) {
    return (
        <DpProvider>
            <div style={stageStyle}>
                <div style={{ ...phoneStyle, ...(width != null ? { width } : null) }}>{children}</div>
            </div>
        </DpProvider>
    );
}

/**
 * Editor-canvas provider for Puck's iframe: injects dp-design's static CSS into the iframe document
 * and points cssinjs's StyleProvider at the iframe <head>, so components rendered inside the iframe
 * are fully styled. Used as Puck's `root.render`.
 */
export function DpCanvas({ children }: { children: ReactNode }) {
    const ref = useRef<HTMLDivElement>(null);
    const [head, setHead] = useState<HTMLHeadElement | null>(null);
    useEffect(() => {
        setHead(ref.current?.ownerDocument.head ?? null);
    }, []);
    return (
        <div ref={ref}>
            <style dangerouslySetInnerHTML={{ __html: themeCss }} />
            <style dangerouslySetInnerHTML={{ __html: styleCss }} />
            <ConfigProvider biz="global-app" locale="en">
                {head ? <StyleProvider container={head}>{children}</StyleProvider> : null}
            </ConfigProvider>
        </div>
    );
}
