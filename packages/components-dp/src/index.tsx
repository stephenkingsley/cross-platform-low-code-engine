import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    type ComponentType,
    type CSSProperties,
    type ReactNode,
} from 'react';
import { StyleProvider } from '@ant-design/cssinjs';
import {
    Alert,
    Bill,
    Button,
    CheckboxButtonGroup,
    Collapse,
    ConfigProvider,
    DataRow,
    Form,
    Image,
    LabelInput,
    Link,
    LinkCard,
    NavHeader,
    RadioButtonGroup,
    Rate,
    Segmented,
    Stepper,
    Swiper,
    Switch,
    Tabs,
    Tag,
    Text,
} from '@dragonpass/atom-ui-mobile';
// Side-effect CSS for the main-document runtime view.
import '@dragonpass/atom-ui-mobile/dist/es/style/index.css';
import '@dragonpass/atom-ui-mobile/dist/style/style.ga.css';
// The same CSS as raw strings, to inject into Puck's iframe document for the canvas.
import themeCss from '@dragonpass/atom-ui-mobile/dist/style/theme.ga.css?inline';
import styleCss from '@dragonpass/atom-ui-mobile/dist/style/style.ga.css?inline';

/** Editor + runtime config shared via React context (e.g. the active language). */
export interface DpConfigValue {
    locale: string;
}
export const DpConfig = createContext<DpConfigValue>({ locale: 'en' });

/** Wraps children in dp-design's ConfigProvider, reading locale from {@link DpConfig}. */
export function DpProvider({ children }: { children: ReactNode }) {
    const { locale } = useContext(DpConfig);
    return (
        <ConfigProvider biz="global-app" locale={locale}>
            {children}
        </ConfigProvider>
    );
}

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
    width: 390,
    maxWidth: '100%',
    // No fixed min-height: the card stretches to fill the available canvas height,
    // so an empty/short page never overflows (no scrollbar). It only grows — and the
    // canvas only scrolls — when the content genuinely exceeds the viewport.
    background: '#fff',
    borderRadius: 22,
    boxShadow: '0 12px 40px rgba(10, 35, 51, 0.16)',
};

/**
 * Phone-frame page: a centred ~390px white card on a soft backdrop. Used as BOTH the
 * editor canvas wrapper and the runtime preview wrapper, so the two match exactly and
 * mobile components preview at a realistic device width.
 */
export function DpPage({ children }: { children: ReactNode }) {
    return (
        <DpProvider>
            <div style={stageStyle}>
                <div style={phoneStyle}>{children}</div>
            </div>
        </DpProvider>
    );
}

/**
 * Editor-canvas provider for Puck's iframe. dp-design styles via `@ant-design/cssinjs`,
 * which injects into a document head — by default the host document, not the iframe.
 * So here we (a) inject the static theme/base CSS into the iframe document and
 * (b) point cssinjs's StyleProvider at the iframe's <head>, so components rendered
 * inside the iframe are fully styled. Used as Puck's `root.render`.
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
                {head ? (
                    // Inject dp-design's cssinjs styles into the iframe's <head>.
                    // Known caveat: the brand PRIMARY token can still resolve to antd's
                    // default *inside the iframe* due to cssinjs cross-document cascade
                    // ordering. The runtime view (host document) renders correct brand
                    // colours; full iframe fidelity needs dp-design's ConfigProvider to
                    // accept a style container.
                    <StyleProvider container={head}>{children}</StyleProvider>
                ) : null}
            </ConfigProvider>
        </div>
    );
}

/** Registry fragment shared by the editor + runtime, under the manifest's type ids. */
export const dpRegistry: Record<string, ComponentType<any>> = {
    Text,
    Image,
    Button,
    LabelInput,
    Tag,
    Alert,
    Switch,
    Bill,
    NavHeader,
    DataRow,
    Link,
    Rate,
    Stepper,
    LinkCard,
    Form,
    Collapse,
    Tabs,
    Segmented,
    RadioButtonGroup,
    CheckboxButtonGroup,
    Swiper,
};
