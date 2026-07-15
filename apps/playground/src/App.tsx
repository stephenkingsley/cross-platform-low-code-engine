import { useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { Data } from '@puckeditor/core';
import { Editor, type PanelMode } from '@lce/editor';
import { PageRuntime } from './page-runtime';
import { DpConfig, DpPage } from '@lce/components-dp';
import { documentJsonSchema, type DocData } from '@lce/manifest';
import { registry, renderableManifest as manifest } from './registry';
import { categories, puckOverrides } from './editor-chrome';
import { ModulesMenu } from './ModulesMenu';
import seedPrepareTrip from './seed-prepare-trip.json';
const STORAGE_KEY = 'lce.doc.v14';

/** Content locales the builder authors. Stable reference (used as a memo dep). */
const LOCALES: string[] = ['en', 'zh'];

/**
 * Feature-flag catalog — the entitlement keys ops can gate a block on (the builder's Visibility
 * dropdown) AND the switches the Preview simulates. In production this list comes from your
 * entitlement service / config; the server returns the SAME keys, and each block's `visibleWhen`
 * references them by name. This one list is the entire contract between build-time and runtime.
 *
 * Deliberately key-only: the dropdown shows the KEY, so what ops picks is visibly the exact value
 * the document stores. A `label` gloss is supported but not used here — it would hide the stored
 * value behind prose, and ops needs to be able to quote the key back to whoever owns the server.
 */
const FLAG_CATALOG = [
    { key: 'Lounge' },
    { key: 'FastTrack' },
    { key: 'Limo' },
    { key: 'localOffer' },
    { key: 'Dining' },
    { key: 'eSIM' },
];

/** Preview-only switches that simulate the server's entitlement map, so you can watch blocks show/hide. */
function FlagBar({ catalog, flags, onToggle }: { catalog: { key: string; label?: string }[]; flags: Record<string, boolean>; onToggle: (k: string) => void }) {
    return (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', padding: '10px 16px', background: '#fff', borderBottom: '1px solid #eef1f4', position: 'sticky', top: 0, zIndex: 5 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>Entitlements</span>
            {catalog.map((f) => {
                const on = !!flags[f.key];
                return (
                    <button
                        key={f.key}
                        onClick={() => onToggle(f.key)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 28, padding: '0 12px', borderRadius: 999, cursor: 'pointer', border: '1px solid', borderColor: on ? '#2680eb' : '#cbd5e1', background: on ? '#2680eb' : '#fff', color: on ? '#fff' : '#64748b', fontSize: 12.5, fontWeight: 600 }}
                    >
                        <span style={{ width: 8, height: 8, borderRadius: 999, background: on ? '#fff' : '#cbd5e1' }} />
                        {f.label ?? f.key}
                    </button>
                );
            })}
        </div>
    );
}

/**
 * Default page — a worked example built ENTIRELY from layout primitives (no bespoke
 * template): a "Prepare for your trip" card stack. Hero card = full-bleed `Image`
 * (clipped to the rounded corners via `Card.clipContent`) + a `Positioned` badge over it;
 * each action card = text + a `Positioned` image panel that bleeds to the edge and is
 * clipped. Authored in the builder, exported, and checked in as `seed-prepare-trip.json`.
 */
const SEED = seedPrepareTrip as unknown as Data;

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

/**
 * The playground opens in `ops` so the tier that needs showing is the one you land on; the library
 * default stays `design`, which is what an existing host keeps without changing a line. Both tiers
 * read and write the same document — the toggle changes the panel, never the page.
 */
const DEFAULT_MODE: PanelMode = 'ops';

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

/**
 * Puck UI overrides. Module-level and frozen at import: Puck keys the drawer subtree off these
 * component identities, so rebuilding the object each render remounts the whole drawer (and wipes
 * anything transient living in it).
 */
const EDITOR_OVERRIDES = {
    ...puckOverrides,
    // Reusable modules live in the left blocks drawer (with the templates), above the component
    // categories — not in a header menu.
    drawer: ({ children }: { children: ReactNode }) => (
        <>
            <ModulesMenu />
            {children}
        </>
    ),
};

export function App() {
    const [view, setView] = useState<'edit' | 'preview'>('edit');
    const [data, setData] = useState<Data>(load);
    const [save, setSave] = useState<Save>('saved');
    const [lang, setLang] = useState<Lang>('en');
    const [mode, setMode] = useState<PanelMode>(DEFAULT_MODE);
    const [dark, setDark] = useState(false);
    // Preview entitlement switches (default: all on). The runtime evaluates each block's
    // `visibleWhen` against this map — toggling a chip shows/hides the gated blocks live.
    const [flags, setFlags] = useState<Record<string, boolean>>(() => Object.fromEntries(FLAG_CATALOG.map((f) => [f.key, true])));
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
                            { label: 'Ops', value: 'ops' },
                            { label: 'Design', value: 'design' },
                        ]}
                        value={mode}
                        onChange={(m) => {
                            // Switching tiers remounts the editor (see `key` below), so hand it the
                            // live document first or the remount restores stale state.
                            setData(dataRef.current);
                            setMode(m);
                        }}
                    />
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
                            // Puck resolves a selected block's panel once, at selection, so a config
                            // rebuilt for the new tier never reaches an already-selected block. Remount
                            // on the tier instead — `data` was just re-seeded from the live document, so
                            // the edits carry over and only the selection resets.
                            key={mode}
                            manifest={manifest}
                            registry={registry}
                            data={data}
                            canvasWrapper={DpPage}
                            iframe={false}
                            overrides={EDITOR_OVERRIDES}
                            categories={categories}
                            locale={lang}
                            fallbackLocale="en"
                            locales={LOCALES}
                            flagCatalog={FLAG_CATALOG}
                            mode={mode}
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
                            {/* Simulate the server's entitlements; the runtime hides gated blocks accordingly. */}
                            <FlagBar catalog={FLAG_CATALOG} flags={flags} onToggle={(k) => setFlags((f) => ({ ...f, [k]: !f[k] }))} />
                            {/* The published page rendered by the standalone runtime component — give it the
                                document JSON + locale + entitlement flags, it renders. No Puck, no editor. */}
                            <DpPage>
                                <PageRuntime
                                    doc={data as unknown as DocData}
                                    locale={lang}
                                    fallbackLocale="en"
                                    flags={flags}
                                    onAction={(action) => {
                                        // Demo dispatcher — a real host navigates / emits app events here.
                                        // eslint-disable-next-line no-console
                                        console.log('[action]', action);
                                        if (action.type === 'navigate') window.alert(`Navigate → ${action.href}`);
                                        else window.alert(`Event → ${action.name}`);
                                    }}
                                />
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
