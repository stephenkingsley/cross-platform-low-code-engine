import { useMemo, useRef, useState, type CSSProperties } from 'react';
import type { Data } from '@puckeditor/core';
import { Editor } from '@lce/editor';
import { PageRuntime } from './page-runtime';
import { DpConfig, DpPage } from '@lce/components-dp';
import { documentJsonSchema, type DocData } from '@lce/manifest';
import { registry, renderableManifest as manifest } from './registry';
import { categories, puckOverrides } from './editor-chrome';
const STORAGE_KEY = 'lce.doc.v14';

/** Content locales the builder authors. Stable reference (used as a memo dep). */
const LOCALES: string[] = ['en', 'zh'];

const HERO_IMG = 'https://picsum.photos/seed/dptravel/600/440';
const NEWS_IMG_1 = 'https://picsum.photos/seed/dpnews1/460/280';
const NEWS_IMG_2 = 'https://picsum.photos/seed/dpnews2/460/280';
const NEWS_IMG_3 = 'https://picsum.photos/seed/dpnews3/460/280';

/** A rounded icon button overlaid in a top corner of the hero image (back / order list). */
function heroButton(id: string, icon: string, align: 'start' | 'end') {
    return {
        type: 'Overlay',
        props: {
            id: `${id}-ov`,
            placement: 'top',
            align,
            scrim: false,
            padding: 'sm',
            children: [
                { type: 'Button', props: { id, children: icon, shape: 'rounded', size: 'mini', type: 'tertiary' } },
            ],
        },
    };
}

/**
 * Default page — Module 1 «顶部概览区» (top overview): a hero image with the back /
 * order buttons overlaid, then title / subtitle / description rendered with the
 * `Typography` primitive on dp-design's type scale (title 18·700·#0A2333,
 * subtitle 14·500·#4B4A4A, body 14·400·#737272) — dp's own `Text` is skeleton-only,
 * so it can't style copy.
 */
const SEED: Data = {
    root: { props: {} },
    content: [
        // hero image — back (←) top-left + order (☰) top-right overlaid on the image
        {
            type: 'Swiper',
            props: {
                id: 'hero',
                direction: 'horizontal',
                slideSize: 100,
                height: 220,
                imageFit: 'cover',
                allowTouchMove: false,
                loop: false,
                imagesList: [
                    {
                        src: HERO_IMG,
                        content: [
                            heroButton('hero-back', '←', 'start'),
                            heroButton('hero-order', '☰', 'end'),
                        ],
                    },
                ],
            },
        },
        // title / subtitle / description — styled via Typography (dp type scale)
        {
            type: 'Flex',
            props: {
                id: 'hero-text',
                direction: 'column',
                align: 'start',
                gap: 'sm',
                padding: 'md',
                children: [
                    { type: 'Typography', props: { id: 'hero-title', variant: 'title', text: { en: 'Enjoy your Travel in China', zh: '畅游中国之旅' } } },
                    { type: 'Typography', props: { id: 'hero-sub', variant: 'subtitle', text: { en: 'valid for 1 year | Refundable', zh: '一年有效 · 可退款' } } },
                    { type: 'Typography', props: { id: 'hero-desc', variant: 'body', text: { en: 'Your all-in-one pass to Beijing. Pick from xx+ attractions & experience. Bundle together and save up to 50%.', zh: '畅游北京的一站式通行证。精选 xx+ 景点与体验，打包立省 50%。' } } },
                ],
            },
        },
        // ===== «What's new» — image cards with overlaid caption (badge + title + desc) =====
        {
            type: 'Flex',
            props: {
                id: 'wn-head',
                direction: 'column',
                align: 'start',
                padding: 'md',
                children: [{ type: 'Typography', props: { id: 'wn-title', variant: 'title', text: { en: "What's new", zh: '最新动态' } } }],
            },
        },
        {
            // self-contained card carousel — Swiper.Item-style cards with a gap between them
            type: 'MediaCarousel',
            props: {
                id: 'wn-carousel',
                cardWidth: 86, // each card 86% wide → the next one peeks
                gap: 16, // spacing between cards
                height: 184,
                items: [
                    { src: NEWS_IMG_1, badge: { en: 'News', zh: '新闻' }, title: { en: 'Our network is growing', zh: '我们的网络在壮大' }, description: { en: 'More airports, more ways to simplify your travel.', zh: '更多机场，更多简化出行的方式。' } },
                    { src: NEWS_IMG_2, badge: { en: 'Product', zh: '产品' }, title: { en: 'Faster lounge check-in', zh: '更快的休息室入场' }, description: { en: 'Scan once at the door and walk straight in.', zh: '门口扫一次码，直接进入。' } },
                    { src: NEWS_IMG_3, badge: { en: 'Guide', zh: '指南' }, title: { en: 'Summer travel tips', zh: '夏日出行贴士' }, description: { en: 'Make the most of your time at the airport.', zh: '充分利用你在机场的时间。' } },
                ],
            },
        },
    ],
    zones: {},
};

function load(): Data {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw) as Data;
    } catch {
        // ignore malformed storage
    }
    return SEED;
}

/** Download any JS value as a pretty-printed .json file. */
function downloadJson(filename: string, data: unknown) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

type Save = 'idle' | 'saving' | 'saved';
type Lang = 'en' | 'zh';

function Logo() {
    return (
        <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true">
            <rect width="32" height="32" rx="9" fill="#0a2333" />
            <rect x="8" y="8" width="16" height="4.5" rx="2" fill="#ffffff" />
            <rect x="8" y="14.5" width="16" height="4.5" rx="2" fill="#7c9db5" />
            <rect x="8" y="21" width="10" height="4.5" rx="2" fill="#ffffff" opacity="0.85" />
        </svg>
    );
}

function SaveStatus({ status }: { status: Save }) {
    const map: Record<Save, [string, string]> = {
        idle: ['#94a3b8', 'Ready'],
        saving: ['#f59e0b', 'Saving…'],
        saved: ['#16a34a', 'All changes saved'],
    };
    const [dot, text] = map[status];
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: '#64748b' }}>
            <span style={{ width: 7, height: 7, borderRadius: 99, background: dot }} />
            {text}
        </span>
    );
}

function Seg<T extends string>({
    options,
    value,
    onChange,
}: {
    options: { label: string; value: T }[];
    value: T;
    onChange: (v: T) => void;
}) {
    return (
        <div style={{ display: 'inline-flex', background: 'var(--lce-seg-bg, #eef2f6)', borderRadius: 9, padding: 3, gap: 2 }}>
            {options.map((o) => {
                const active = o.value === value;
                return (
                    <button
                        key={o.value}
                        onClick={() => onChange(o.value)}
                        style={{
                            border: 'none',
                            borderRadius: 7,
                            padding: '5px 12px',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            background: active ? 'var(--lce-seg-active-bg, #fff)' : 'transparent',
                            color: active ? 'var(--lce-bar-fg, #0a2333)' : '#7b8794',
                            boxShadow: active ? '0 1px 3px rgba(10,35,51,0.14)' : 'none',
                        }}
                    >
                        {o.label}
                    </button>
                );
            })}
        </div>
    );
}

const barStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '10px 18px',
    borderBottom: '1px solid var(--lce-bar-border, #e5e7eb)',
    background: 'var(--lce-bar-bg, #fff)',
    fontFamily: "'Poppins', system-ui, sans-serif",
};

const iconBtnStyle: CSSProperties = {
    border: '1px solid var(--lce-bar-border, #e2e8f0)',
    background: 'var(--lce-seg-bg, #fff)',
    borderRadius: 9,
    width: 34,
    height: 34,
    cursor: 'pointer',
    fontSize: 15,
    display: 'grid',
    placeItems: 'center',
};

export function App() {
    const [view, setView] = useState<'edit' | 'preview'>('edit');
    const [data, setData] = useState<Data>(load);
    const [save, setSave] = useState<Save>('saved');
    const [lang, setLang] = useState<Lang>('en');
    const [dark, setDark] = useState(false);
    const dataRef = useRef<Data>(data);
    const timer = useRef<number | undefined>(undefined);

    // Debounced autosave. We keep the live document in a ref (not state) so Puck keeps
    // its own editing state — `data` is only re-seeded when entering preview / publish.
    const scheduleSave = (d: Data) => {
        dataRef.current = d;
        setSave('saving');
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
            setSave('saved');
        }, 700);
    };

    const goTo = (v: 'edit' | 'preview') => {
        if (v === 'preview') setData(dataRef.current);
        setView(v);
    };

    // JSON preview: the protocol schema (draft-07, generated from the manifest), its
    // i18n variant, and the live document. The schema always matches what the builder
    // can produce — it's derived from the same manifest the editor/runtime use.
    const [schemaOpen, setSchemaOpen] = useState(false);
    // Default to the page document — that's the JSON the runtime <Render> consumes.
    const [schemaTab, setSchemaTab] = useState<'doc' | 'schema' | 'i18n'>('doc');
    const schemas = useMemo(
        () => ({
            schema: documentJsonSchema(manifest),
            i18n: documentJsonSchema(manifest, { localize: true }),
        }),
        [],
    );
    const schemaJson = JSON.stringify(
        schemaTab === 'doc' ? dataRef.current : schemas[schemaTab],
        null,
        2,
    );

    return (
        <DpConfig.Provider value={{ locale: lang }}>
            <div
                data-theme={dark ? 'dark' : 'light'}
                className="lce-root"
                style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--lce-app-bg, #fff)' }}
            >
                <header style={barStyle}>
                    <Logo />
                    <strong style={{ fontSize: 15, color: 'var(--lce-bar-fg, #0a2333)' }}>DragonPass Builder</strong>
                    <span style={{ fontSize: 12.5, color: '#94a3b8' }}>dp-design · no-code</span>
                    <span style={{ flex: 1 }} />
                    <SaveStatus status={save} />
                    <Seg
                        options={[
                            { label: 'EN', value: 'en' },
                            { label: '中文', value: 'zh' },
                        ]}
                        value={lang}
                        onChange={(l) => {
                            // Sync live edits before the editor config rebuilds for the new
                            // locale, so Puck re-mounts with the current document, not stale state.
                            setData(dataRef.current);
                            setLang(l);
                        }}
                    />
                    <button
                        style={{ ...iconBtnStyle, width: 'auto', padding: '0 12px', fontSize: 12.5, fontWeight: 600, gap: 6 }}
                        title="Preview the JSON Schema & document (protocol contract)"
                        onClick={() => setSchemaOpen(true)}
                    >
                        {'{ }'} JSON
                    </button>
                    <button style={iconBtnStyle} title="Toggle theme" onClick={() => setDark((d) => !d)}>
                        {dark ? '☀️' : '🌙'}
                    </button>
                    <Seg
                        options={[
                            { label: 'Edit', value: 'edit' },
                            { label: 'Preview', value: 'preview' },
                        ]}
                        value={view}
                        onChange={goTo}
                    />
                </header>
                <main style={{ flex: 1, minHeight: 0 }}>
                    {view === 'edit' ? (
                        <Editor
                            manifest={manifest}
                            registry={registry}
                            data={data}
                            canvasWrapper={DpPage}
                            iframe={false}
                            overrides={puckOverrides}
                            categories={categories}
                            locale={lang}
                            fallbackLocale="en"
                            locales={LOCALES}
                            onChange={scheduleSave}
                            onPublish={(d) => {
                                dataRef.current = d;
                                setData(d);
                                localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
                                setSave('saved');
                                setView('preview');
                            }}
                        />
                    ) : (
                        <div style={{ height: '100%', overflow: 'auto', background: 'var(--lce-stage-bg, #eef1f4)' }}>
                            {/* The published page rendered by the standalone runtime component —
                                give it the document JSON + locale, it renders. No Puck, no editor. */}
                            <DpPage>
                                <PageRuntime doc={data as unknown as DocData} locale={lang} fallbackLocale="en" />
                            </DpPage>
                        </div>
                    )}
                </main>
                {schemaOpen && (
                    <div
                        onClick={() => setSchemaOpen(false)}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 1000,
                            background: 'rgba(8, 18, 28, 0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 24,
                        }}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                width: 'min(880px, 100%)',
                                height: 'min(82vh, 780px)',
                                background: 'var(--lce-card-bg, #fff)',
                                borderRadius: 14,
                                boxShadow: '0 24px 80px rgba(8, 18, 28, 0.4)',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden',
                                fontFamily: "'Poppins', system-ui, sans-serif",
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    padding: '12px 14px',
                                    borderBottom: '1px solid var(--lce-bar-border, #e5e7eb)',
                                }}
                            >
                                <strong style={{ fontSize: 14, color: 'var(--lce-bar-fg, #0a2333)' }}>JSON</strong>
                                <Seg
                                    options={[
                                        { label: 'Page JSON', value: 'doc' },
                                        { label: 'Schema', value: 'schema' },
                                        { label: 'i18n Schema', value: 'i18n' },
                                    ]}
                                    value={schemaTab}
                                    onChange={setSchemaTab}
                                />
                                <span style={{ fontSize: 11.5, color: '#94a3b8' }}>
                                    {schemaTab === 'doc'
                                        ? '← the document the runtime <Render> renders'
                                        : 'protocol contract (validation / tooling)'}
                                </span>
                                <span style={{ flex: 1 }} />
                                <button
                                    style={iconBtnStyle}
                                    title="Copy to clipboard"
                                    onClick={() => navigator.clipboard?.writeText(schemaJson)}
                                >
                                    ⧉
                                </button>
                                <button
                                    style={iconBtnStyle}
                                    title="Download .json"
                                    onClick={() =>
                                        downloadJson(
                                            schemaTab === 'doc' ? 'document.json' : `schema${schemaTab === 'i18n' ? '.i18n' : ''}.json`,
                                            schemaTab === 'doc' ? dataRef.current : schemas[schemaTab],
                                        )
                                    }
                                >
                                    ⤓
                                </button>
                                <button style={iconBtnStyle} title="Close" onClick={() => setSchemaOpen(false)}>
                                    ✕
                                </button>
                            </div>
                            <pre
                                style={{
                                    margin: 0,
                                    flex: 1,
                                    overflow: 'auto',
                                    padding: 16,
                                    fontFamily: "'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
                                    fontSize: 12,
                                    lineHeight: 1.6,
                                    color: 'var(--lce-bar-fg, #0a2333)',
                                    background: 'var(--lce-stage-bg, #f6f8fa)',
                                    whiteSpace: 'pre',
                                }}
                            >
                                {schemaJson}
                            </pre>
                        </div>
                    </div>
                )}
            </div>
        </DpConfig.Provider>
    );
}
