import { useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import {
    getByPath,
    introspectSample,
    mapItem,
    resolveMedia,
    TEMPLATE_FILTER_HINT,
    type Action,
    type DataBinding,
    type DiscoveredField,
    type FieldMap,
    type FieldOption,
    type ManifestField,
    type MapRule,
} from '@lce/manifest';

const labelStyle: CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--puck-color-grey-03, #334155)',
    marginBottom: 7,
    fontFamily: 'inherit',
};

const inputStyle: CSSProperties = {
    flex: 1,
    width: '100%',
    height: 34,
    borderRadius: 8,
    border: '1px solid var(--puck-color-grey-09, #cbd5e1)',
    padding: '0 10px',
    fontFamily: 'inherit',
    fontSize: 13,
    background: 'var(--puck-color-white, #fff)',
    color: 'var(--puck-color-grey-02, #1f2937)',
    boxSizing: 'border-box',
};

const subLabel: CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--puck-color-grey-06, #94a3b8)',
    marginBottom: 4,
};

interface FieldProps {
    value?: string;
    onChange: (v: string) => void;
    label?: string;
}

const LOCALE_LABEL: Record<string, string> = { en: 'EN', zh: '中文', ja: '日本語', ko: '한국어' };

interface LocalizedFieldProps {
    value?: string | Record<string, string>;
    onChange: (v: Record<string, string>) => void;
    label?: string;
    locales: string[];
    multiline?: boolean;
}

/**
 * Per-locale text input. A text prop becomes a `{ locale: string }` map, so the same
 * document carries every language. A legacy plain string shows in the first locale and
 * upgrades to a map on edit (runtime/editor resolve either form).
 */
export function LocalizedTextField({ value, onChange, label, locales, multiline }: LocalizedFieldProps) {
    const map: Record<string, string> =
        typeof value === 'string' ? { [locales[0]]: value } : { ...(value ?? {}) };
    const set = (loc: string, v: string) => onChange({ ...map, [loc]: v });
    return (
        <div style={{ fontFamily: 'inherit' }}>
            {label ? <div style={labelStyle}>{label}</div> : null}
            <div style={{ display: 'grid', gap: 6 }}>
                {locales.map((loc) => (
                    <div
                        key={loc}
                        style={{ display: 'flex', gap: 6, alignItems: multiline ? 'flex-start' : 'center' }}
                    >
                        <span
                            style={{
                                width: 36,
                                flex: 'none',
                                fontSize: 11,
                                fontWeight: 600,
                                color: 'var(--puck-color-grey-06, #94a3b8)',
                                paddingTop: multiline ? 9 : 0,
                            }}
                        >
                            {LOCALE_LABEL[loc] ?? loc}
                        </span>
                        {multiline ? (
                            <textarea
                                value={map[loc] ?? ''}
                                onChange={(e) => set(loc, e.target.value)}
                                style={{ ...inputStyle, height: 60, padding: 8, resize: 'vertical' }}
                            />
                        ) : (
                            <input
                                type="text"
                                value={map[loc] ?? ''}
                                onChange={(e) => set(loc, e.target.value)}
                                style={inputStyle}
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

/** Colour swatch + hex input. Auto-applied to `*color` string props. */
/**
 * dp-design colour tokens, surfaced as a palette. Selecting one stores its CSS-var reference
 * (`var(--aum-*)`) — NOT a hex — so the chosen colour tracks the active dp theme (white-label).
 * Curated to the semantic tokens (duplicates like primary≡emphasis dropped).
 */
const DP_PALETTE: { label: string; token: string; varName: string }[] = [
    { label: 'Text · Emphasis', token: 'fgEmphasisColor', varName: '--aum-fg-emphasis-color' },
    { label: 'Text · Primary', token: 'fgPrimaryColor', varName: '--aum-fg-primary-color' },
    { label: 'Text · Secondary', token: 'fgSecondaryColor', varName: '--aum-fg-secondary-color' },
    { label: 'Text · Tertiary', token: 'fgTertiaryColor', varName: '--aum-fg-tertiary-color' },
    { label: 'On dark (white)', token: 'fgEmphasisInverseColor', varName: '--aum-fg-emphasis-inverse-color' },
    { label: 'Interactive / Link', token: 'interactiveColor', varName: '--aum-interactive-color' },
    { label: 'Success', token: 'successColor', varName: '--aum-success-color' },
    { label: 'Warning', token: 'warningColor', varName: '--aum-warning-color' },
    { label: 'Error', token: 'errorColor', varName: '--aum-error-color' },
    { label: 'Border', token: 'borderDefaultColor', varName: '--aum-border-default-color' },
];

/**
 * dp colour-token swatch picker — stores the TOKEN NAME (e.g. "successColor"), which the components
 * resolve to its live `--aum-*` var at render, so re-skinning follows. The swatch previews the
 * colour through that CSS var (display only); the selected token's name is shown below the grid.
 */
function DpColorPicker({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
    const current = DP_PALETTE.find((c) => c.token === value);
    return (
        <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {DP_PALETTE.map((c) => {
                    const selected = (value || '') === c.token;
                    return (
                        <button
                            key={c.token}
                            type="button"
                            title={`${c.label} (${c.token})`}
                            aria-label={c.label}
                            onClick={() => onChange(c.token)}
                            style={{
                                width: 30,
                                height: 30,
                                borderRadius: 7,
                                cursor: 'pointer',
                                padding: 0,
                                background: `var(${c.varName})`,
                                border: selected
                                    ? '2px solid var(--puck-color-azure-05, #2563eb)'
                                    : '1px solid var(--puck-color-grey-09, #cbd5e1)',
                                boxShadow: selected ? '0 0 0 2px rgba(37,99,235,0.25)' : undefined,
                            }}
                        />
                    );
                })}
            </div>
            {/* Name the selected token so the ops user knows exactly what they picked (label + the key stored). */}
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--puck-color-grey-05, #64748b)' }}>
                {current ? (
                    <>
                        <span>{current.label}</span>
                        <code style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: 'var(--puck-color-grey-03, #334155)', background: 'var(--puck-color-grey-11, #f1f5f9)', padding: '1px 6px', borderRadius: 4 }}>{current.token}</code>
                    </>
                ) : (
                    <span style={{ fontStyle: 'italic' }}>Pick a colour token</span>
                )}
            </div>
        </div>
    );
}

type RGBA = [number, number, number, number];
function parseRgba(s: string): RGBA | null {
    if (!s) return null;
    const m = /rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+))?\s*\)/i.exec(s);
    if (m) return [+m[1], +m[2], +m[3], m[4] != null ? +m[4] : 1];
    const h = /#([0-9a-fA-F]{6})/.exec(s);
    if (h) { const n = parseInt(h[1], 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1]; }
    return null;
}
const rgbaStr = (c: RGBA): string => `rgba(${Math.round(c[0])}, ${Math.round(c[1])}, ${Math.round(c[2])}, ${+c[3].toFixed(2)})`;
const rgbaHex = (c: RGBA): string => '#' + c.slice(0, 3).map((x) => Math.round(x).toString(16).padStart(2, '0')).join('');

/** A hex colour swatch + an alpha slider → an `[r,g,b,a]` tuple. */
function AlphaSwatch({ rgba, onChange }: { rgba: RGBA; onChange: (c: RGBA) => void }) {
    return (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
                type="color"
                value={rgbaHex(rgba)}
                onChange={(e) => { const p = parseRgba(e.target.value); if (p) onChange([p[0], p[1], p[2], rgba[3]]); }}
                style={{ width: 36, height: 30, border: '1px solid var(--puck-color-grey-09, #cbd5e1)', borderRadius: 6, padding: 2, background: '#fff', cursor: 'pointer', flex: 'none' }}
            />
            <input type="range" min={0} max={100} value={Math.round(rgba[3] * 100)} onChange={(e) => onChange([rgba[0], rgba[1], rgba[2], Number(e.target.value) / 100])} style={{ flex: 1 }} />
            <span style={{ width: 38, textAlign: 'right', fontSize: 12, color: 'var(--puck-color-grey-05, #64748b)' }}>{Math.round(rgba[3] * 100)}%</span>
        </div>
    );
}

const bgTab = (active: boolean): CSSProperties => ({
    flex: 1, padding: '6px 0', fontSize: 12, fontWeight: 600, cursor: 'pointer', textAlign: 'center',
    borderRadius: 6, border: '1px solid var(--puck-color-grey-09, #cbd5e1)',
    background: active ? 'var(--puck-color-grey-02, #0f172a)' : 'var(--puck-color-white, #fff)',
    color: active ? '#fff' : 'var(--puck-color-grey-04, #475569)',
});

/**
 * Background picker — a solid colour WITH alpha, OR a 2-stop linear gradient (angle + two
 * alpha stops). Emits a plain CSS string (`rgba(...)` / `linear-gradient(...)`) the component
 * applies directly; a raw text box always mirrors/edits the value for power users.
 */
export function BackgroundField({ value, onChange, label }: FieldProps) {
    const v = value ?? '';
    const isGrad = /gradient/i.test(v);
    const stops = (v.match(/rgba?\([^)]*\)|#[0-9a-fA-F]{6}/g) || []).map(parseRgba).filter(Boolean) as RGBA[];
    const angleMatch = /(-?\d+)deg/.exec(v);
    const angle = angleMatch ? Number(angleMatch[1]) : 180;
    const from: RGBA = (isGrad && stops[0]) || [0, 0, 0, 0];
    const to: RGBA = (isGrad && stops[1]) || [0, 0, 0, 0.6];

    const emitGrad = (a: number, f: RGBA, t: RGBA) => onChange(`linear-gradient(${a}deg, ${rgbaStr(f)}, ${rgbaStr(t)})`);

    // Solid value = "<tokenName> [alpha]" e.g. "successColor 0.6"; alpha omitted = fully opaque.
    const [solidTok, solidAStr] = (isGrad ? '' : v).trim().split(/\s+/);
    const solidAlpha = solidAStr ? Number(solidAStr) : 1;
    const emitSolid = (t: string, a: number) => onChange(a < 1 ? `${t} ${+a.toFixed(2)}` : t);

    return (
        <div style={{ fontFamily: 'inherit' }}>
            {label ? <div style={labelStyle}>{label}</div> : null}
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <div style={bgTab(!isGrad)} onClick={() => { if (isGrad) onChange('fgEmphasisColor'); }}>Solid token</div>
                <div style={bgTab(isGrad)} onClick={() => { if (!isGrad) emitGrad(angle, from, to); }}>Gradient</div>
            </div>
            {!isGrad ? (
                // Solid = pick a dp colour TOKEN (re-skins) + opacity (it's an overlay); gradient stays custom.
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <DpColorPicker value={solidTok} onChange={(t) => emitSolid(t, solidAlpha)} />
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: 'var(--puck-color-grey-05, #64748b)', width: 50 }}>Opacity</span>
                        <input type="range" min={0} max={100} value={Math.round(solidAlpha * 100)} onChange={(e) => emitSolid(solidTok || 'fgEmphasisColor', Number(e.target.value) / 100)} style={{ flex: 1 }} />
                        <span style={{ width: 36, textAlign: 'right', fontSize: 12, color: 'var(--puck-color-grey-05, #64748b)' }}>{Math.round(solidAlpha * 100)}%</span>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: 'var(--puck-color-grey-05, #64748b)' }}>Angle</span>
                        <input type="number" value={angle} onChange={(e) => emitGrad(Number(e.target.value) || 0, from, to)} style={{ ...inputStyle, width: 72, flex: 'none' }} />
                        <span style={{ fontSize: 12, color: 'var(--puck-color-grey-05, #64748b)' }}>°</span>
                    </div>
                    <div style={subLabel}>From</div>
                    <AlphaSwatch rgba={from} onChange={(c) => emitGrad(angle, c, to)} />
                    <div style={subLabel}>To</div>
                    <AlphaSwatch rgba={to} onChange={(c) => emitGrad(angle, from, c)} />
                    <input
                        type="text"
                        value={v}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="linear-gradient(…)"
                        style={{ ...inputStyle, marginTop: 4, fontFamily: 'monospace', fontSize: 11 }}
                    />
                </div>
            )}
        </div>
    );
}

export function ColorField({ value, onChange, label }: FieldProps) {
    // Colour = pick a dp design token (stores `var(--aum-*)`, re-skins) — not a raw hex.
    return (
        <div style={{ fontFamily: 'inherit' }}>
            {label ? <div style={labelStyle}>{label}</div> : null}
            <DpColorPicker value={value} onChange={onChange} />
        </div>
    );
}

const pickBtnStyle: CSSProperties = {
    height: 34,
    borderRadius: 8,
    border: '1px solid var(--puck-color-azure-05, #2680eb)',
    background: 'var(--puck-color-azure-05, #2680eb)',
    color: '#fff',
    fontFamily: 'inherit',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
};

interface ImageFieldProps {
    /** A plain URL string, or a `{ $media }` reference. */
    value?: unknown;
    onChange: (v: unknown) => void;
    label?: string;
    /** Optional host-provided picker (e.g. Contentful) → returns the value to store. */
    assetPicker?: () => Promise<unknown | null>;
}

/**
 * Image preview + URL input, plus an optional "pick from CMS" button.
 *
 * The value can be a plain URL string OR a hybrid `{ $media }` reference; the preview always
 * shows the resolved snapshot URL. When `assetPicker` is supplied (e.g. the Contentful
 * Entry-Editor app passes the native media browser), picking stores whatever it returns.
 */
export function ImageField({ value, onChange, label, assetPicker }: ImageFieldProps) {
    const url = (resolveMedia(value) as string) || '';
    const isRef = value != null && typeof value === 'object';
    return (
        <div style={{ fontFamily: 'inherit' }}>
            {label ? <div style={labelStyle}>{label}</div> : null}
            <div style={{ display: 'grid', gap: 8 }}>
                {url ? (
                    <img
                        src={url}
                        alt=""
                        style={{
                            width: '100%',
                            maxHeight: 130,
                            objectFit: 'cover',
                            borderRadius: 10,
                            border: '1px solid var(--puck-color-grey-10, #e5e7eb)',
                        }}
                    />
                ) : (
                    <div
                        style={{
                            height: 88,
                            borderRadius: 10,
                            border: '1px dashed var(--puck-color-grey-08, #cbd5e1)',
                            display: 'grid',
                            placeItems: 'center',
                            color: 'var(--puck-color-grey-06, #94a3b8)',
                            fontSize: 12,
                        }}
                    >
                        No image yet
                    </div>
                )}
                {assetPicker ? (
                    <button
                        type="button"
                        style={pickBtnStyle}
                        onClick={async () => {
                            const v = await assetPicker();
                            if (v != null) onChange(v);
                        }}
                    >
                        ＋ Pick from Contentful
                    </button>
                ) : null}
                {isRef ? (
                    <div style={{ fontSize: 11, color: 'var(--puck-color-grey-06, #94a3b8)' }}>
                        Linked CMS asset · snapshot URL below
                    </div>
                ) : null}
                <input
                    type="text"
                    value={isRef ? url : ((value as string) ?? '')}
                    placeholder="Paste image URL…"
                    onChange={(e) => onChange(e.target.value)}
                    style={inputStyle}
                />
            </div>
        </div>
    );
}

interface ActionFieldProps {
    value?: Action;
    onChange: (v: Action | undefined) => void;
    label?: string;
}

const selectStyle: CSSProperties = { ...inputStyle, cursor: 'pointer' };

/** Configure a declarative click action (navigate / emit event). Stored as data in the doc. */
export function ActionField({ value, onChange, label }: ActionFieldProps) {
    const type = value?.type ?? 'none';
    return (
        <div style={{ fontFamily: 'inherit' }}>
            {label ? <div style={labelStyle}>{label}</div> : null}
            <div style={{ display: 'grid', gap: 6 }}>
                <select
                    value={type}
                    style={selectStyle}
                    onChange={(e) => {
                        const t = e.target.value;
                        if (t === 'navigate')
                            onChange({ type: 'navigate', href: value?.type === 'navigate' ? value.href : '', target: '_self' });
                        else if (t === 'event')
                            onChange({ type: 'event', name: value?.type === 'event' ? value.name : '' });
                        else onChange(undefined);
                    }}
                >
                    <option value="none">None</option>
                    <option value="navigate">Navigate (URL / route)</option>
                    <option value="event">Emit event</option>
                </select>
                {value?.type === 'navigate' ? (
                    <>
                        <input
                            type="text"
                            value={value.href}
                            placeholder="/path or https://…"
                            style={inputStyle}
                            onChange={(e) => onChange({ ...value, href: e.target.value })}
                        />
                        <select
                            value={value.target ?? '_self'}
                            style={selectStyle}
                            onChange={(e) => onChange({ ...value, target: e.target.value as '_self' | '_blank' })}
                        >
                            <option value="_self">Same tab</option>
                            <option value="_blank">New tab</option>
                        </select>
                    </>
                ) : null}
                {value?.type === 'event' ? (
                    <input
                        type="text"
                        value={value.name}
                        placeholder="event name (e.g. addToCart)"
                        style={inputStyle}
                        onChange={(e) => onChange({ ...value, name: e.target.value })}
                    />
                ) : null}
            </div>
        </div>
    );
}

interface DataMapFieldProps {
    value?: DataBinding;
    onChange: (v: DataBinding | undefined) => void;
    label?: string;
    /** The component's per-item target fields (what each row maps INTO). */
    targetFields?: ManifestField[];
}

const monoInput: CSSProperties = {
    ...inputStyle,
    height: 160,
    padding: 8,
    resize: 'vertical',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 12,
    lineHeight: 1.5,
};
const hintStyle: CSSProperties = { fontSize: 11, color: 'var(--puck-color-grey-06, #94a3b8)', marginTop: 4 };
const errStyle: CSSProperties = { fontSize: 11, color: '#b42318', marginTop: 4 };
const cardStyle: CSSProperties = {
    border: '1px solid var(--puck-color-grey-10, #e5e7eb)',
    borderRadius: 10,
    padding: 10,
    background: 'var(--puck-color-white, #fff)',
};
const discloseBtn: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--puck-color-grey-03, #334155)',
};
const linkBtn: CSSProperties = {
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--puck-color-azure-05, #2680eb)',
};
const chipStyle: CSSProperties = {
    fontFamily: 'ui-monospace, Menlo, monospace',
    fontSize: 11,
    padding: '2px 7px',
    borderRadius: 6,
    border: '1px solid var(--puck-color-grey-10, #e5e7eb)',
    background: 'var(--puck-color-grey-11, #f8fafc)',
    color: 'var(--puck-color-azure-05, #2680eb)',
    cursor: 'pointer',
    lineHeight: 1.6,
    whiteSpace: 'nowrap',
};

// ---- rule <-> UI helpers ----------------------------------------------------

interface RuleParts {
    path?: string;
    format?: string;
    valueMap?: Record<string, unknown>;
    default?: unknown;
    custom?: string;
}

const isTemplateStr = (s: string) => /\{\{/.test(s);

/** Decompose a saved {@link MapRule} into the editable parts the row UI shows. */
function ruleToParts(rule: MapRule | undefined): RuleParts {
    if (rule == null) return {};
    if (typeof rule === 'string') return isTemplateStr(rule) ? { custom: rule } : { path: rule };
    if ('const' in rule) return {}; // action const → handled by its own row
    return { path: rule.path, format: rule.format, valueMap: rule.valueMap, default: rule.default };
}

/** Recompose the editable parts into a compact {@link MapRule} (string when possible). */
function partsToRule(p: RuleParts): MapRule | undefined {
    if (p.custom != null) return p.custom.trim() ? p.custom : undefined;
    if (!p.path) return undefined;
    const hasFmt = !!p.format;
    const hasVM = !!p.valueMap && Object.keys(p.valueMap).length > 0;
    if (!hasFmt && !hasVM) return p.path;
    const r: Record<string, unknown> = { path: p.path };
    if (hasFmt) r.format = p.format;
    if (hasVM) {
        r.valueMap = p.valueMap;
        if (p.default != null && p.default !== '') r.default = p.default;
    }
    return r as MapRule;
}

/** Read the href out of an action rule (`{ const: { type:'navigate', href } }`). */
function actionHref(rule: MapRule | undefined): string {
    if (rule && typeof rule === 'object' && 'const' in rule) {
        const c = (rule as { const?: { href?: string } }).const;
        return c?.href ?? '';
    }
    return '';
}

const FORMAT_OPTS: FieldOption[] = [
    { label: 'No format', value: '' },
    { label: 'Date', value: 'date' },
    { label: 'Date + time', value: 'datetime' },
    { label: 'Time', value: 'time' },
];

// ---- sub-components ----------------------------------------------------------

function RowShell({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '88px 1fr', gap: 10, alignItems: 'start' }}>
            <div style={{ ...subLabel, marginBottom: 0, paddingTop: 8 }}>{label}</div>
            <div>{children}</div>
        </div>
    );
}

interface ValueMapEditorProps {
    path: string;
    sample: unknown[];
    options: FieldOption[];
    valueMap?: Record<string, unknown>;
    defaultValue?: unknown;
    onChange: (valueMap: Record<string, unknown>, def: unknown) => void;
}

/** Map each distinct sample value of `path` → one of the target field's options (+ a fallback). */
function ValueMapEditor({ path, sample, options, valueMap, defaultValue, onChange }: ValueMapEditorProps) {
    const distinct = useMemo(() => {
        const set = new Set<string>();
        for (const row of sample) {
            const v = getByPath(row, path);
            if (v != null) set.add(String(v));
        }
        return [...set];
    }, [sample, path]);
    if (distinct.length === 0) return null;
    const vm = valueMap ?? {};
    const opts = (
        <>
            <option value="">—</option>
            {options.map((o) => (
                <option key={String(o.value)} value={String(o.value)}>
                    {o.label}
                </option>
            ))}
        </>
    );
    const rowStyle: CSSProperties = {
        display: 'grid',
        gridTemplateColumns: '1fr 14px 1fr',
        gap: 6,
        alignItems: 'center',
    };
    const smallSelect: CSSProperties = { ...selectStyle, height: 30 };
    return (
        <div style={{ display: 'grid', gap: 5, background: 'var(--puck-color-grey-11, #f8fafc)', borderRadius: 8, padding: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--puck-color-grey-06, #94a3b8)' }}>Map each value → option</div>
            {distinct.map((raw) => (
                <div key={raw} style={rowStyle}>
                    <code style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{raw}</code>
                    <span style={{ textAlign: 'center', color: '#94a3b8' }}>→</span>
                    <select
                        value={String(vm[raw] ?? '')}
                        style={smallSelect}
                        onChange={(e) => {
                            const next = { ...vm };
                            if (e.target.value) next[raw] = e.target.value;
                            else delete next[raw];
                            onChange(next, defaultValue);
                        }}
                    >
                        {opts}
                    </select>
                </div>
            ))}
            <div style={rowStyle}>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>fallback</span>
                <span style={{ textAlign: 'center', color: '#94a3b8' }}>→</span>
                <select
                    value={String(defaultValue ?? '')}
                    style={smallSelect}
                    onChange={(e) => onChange(vm, e.target.value || undefined)}
                >
                    {opts}
                </select>
            </div>
        </div>
    );
}

interface TemplateInputProps {
    value: string;
    onChange: (v: string) => void;
    discovered: DiscoveredField[];
    placeholder?: string;
}

/** A template text input with clickable field chips (insert `{{path}}` at the cursor) + filter hint. */
function TemplateInput({ value, onChange, discovered, placeholder }: TemplateInputProps) {
    const ref = useRef<HTMLInputElement>(null);
    const insert = (token: string) => {
        const el = ref.current;
        const cur = value ?? '';
        if (!el) {
            onChange(cur + token);
            return;
        }
        const start = el.selectionStart ?? cur.length;
        const end = el.selectionEnd ?? cur.length;
        onChange(cur.slice(0, start) + token + cur.slice(end));
        requestAnimationFrame(() => {
            el.focus();
            const pos = start + token.length;
            el.setSelectionRange(pos, pos);
        });
    };
    return (
        <div style={{ display: 'grid', gap: 5 }}>
            <input
                ref={ref}
                type="text"
                value={value}
                placeholder={placeholder}
                spellCheck={false}
                style={{ ...inputStyle, fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12 }}
                onChange={(e) => onChange(e.target.value)}
            />
            {discovered.length ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxHeight: 58, overflowY: 'auto' }}>
                    {discovered.map((d) => (
                        <button key={d.path} type="button" style={chipStyle} title={`Insert {{${d.path}}}`} onClick={() => insert(`{{${d.path}}}`)}>
                            {d.path}
                        </button>
                    ))}
                </div>
            ) : null}
            <div style={hintStyle}>filters: {TEMPLATE_FILTER_HINT}</div>
        </div>
    );
}

// ---- Link builder (structured URL authoring → generates an href template) ----

interface LinkParam {
    name: string;
    field: string;
    encode: boolean;
}
interface LinkBranchRow {
    value: string;
    seg: string;
}
interface LinkModel {
    /** Field whose value chooses the leading path segment (optional branch). */
    branchField: string;
    branchRows: LinkBranchRow[];
    branchDefault: string;
    /** Static path (appended after the optional branch segment), e.g. `/order-detail`. */
    path: string;
    query: LinkParam[];
}

const emptyLink = (): LinkModel => ({ branchField: '', branchRows: [], branchDefault: '', path: '', query: [] });

/** Build an href template from the structured model (the inverse of {@link parseHref}). */
function generateHref(m: LinkModel): string {
    let pathExpr = m.path || '';
    if (m.branchField) {
        const pairs = m.branchRows.filter((r) => r.value && r.seg).map((r) => `${r.value}=${r.seg}`).join(', ');
        const filters = [pairs ? `map: ${pairs}` : '', m.branchDefault ? `default: ${m.branchDefault}` : ''].filter(Boolean).join(' | ');
        pathExpr = `/{{${m.branchField}${filters ? ` | ${filters}` : ''}}}${m.path || ''}`;
    }
    const q = m.query.filter((p) => p.name && p.field).map((p) => `${p.name}={{${p.field}${p.encode ? '|encode' : ''}}}`).join('&');
    return pathExpr + (q ? `?${q}` : '');
}

/** Parse an href template back into the structured model, or null if it's too custom (→ raw mode). */
function parseHref(href: string): LinkModel | null {
    const m = emptyLink();
    if (!href) return m;
    const qIdx = href.indexOf('?');
    const pathPart = qIdx >= 0 ? href.slice(0, qIdx) : href;
    const queryPart = qIdx >= 0 ? href.slice(qIdx + 1) : '';

    if (pathPart.includes('{{')) {
        const pm = pathPart.match(/^\/\{\{\s*([\w.]+)\s*(\|[^}]*)?\}\}(.*)$/);
        if (!pm) return null;
        m.branchField = pm[1];
        m.path = pm[3] || '';
        for (const seg of (pm[2] || '').replace(/^\|/, '').split('|')) {
            const s = seg.trim();
            if (s.startsWith('map:')) {
                for (const pair of s.slice(4).split(',')) {
                    const i = pair.indexOf('=');
                    if (i >= 0) m.branchRows.push({ value: pair.slice(0, i).trim(), seg: pair.slice(i + 1).trim() });
                }
            } else if (s.startsWith('default:')) {
                m.branchDefault = s.slice(8).trim();
            } else if (s) {
                return null; // unknown filter in the path → can't represent visually
            }
        }
    } else {
        m.path = pathPart;
    }

    if (queryPart) {
        for (const kv of queryPart.split('&')) {
            const eq = kv.indexOf('=');
            if (eq < 0) return null;
            const vm = kv.slice(eq + 1).match(/^\{\{\s*([\w.]+)\s*(\|\s*encode\s*)?\}\}$/);
            if (!vm) return null; // a literal / filtered query value → raw
            m.query.push({ name: kv.slice(0, eq), field: vm[1], encode: !!vm[2] });
        }
    }
    return m;
}

const subCard: CSSProperties = { background: 'var(--puck-color-grey-11, #f8fafc)', borderRadius: 8, padding: 8, display: 'grid', gap: 6 };
const smallInput: CSSProperties = { ...inputStyle, height: 30, fontSize: 12, fontFamily: 'ui-monospace, Menlo, monospace' };
const xBtn: CSSProperties = { border: 'none', background: 'none', cursor: 'pointer', color: '#b42318', fontSize: 16, lineHeight: 1, padding: '0 2px' };

/**
 * Structured URL authoring for an action: a Path (+ optional "branch by field" segment) and
 * Query-param rows (name + field + encode). Generates an href template under the hood, so the
 * stored value stays a portable template the runtime resolves; "Advanced" drops to the raw
 * template for anything the builder can't express.
 */
function LinkBuilder({
    href,
    discovered,
    sample,
    onChange,
}: {
    href: string;
    discovered: DiscoveredField[];
    sample: unknown[];
    onChange: (href: string) => void;
}) {
    const parsedOnce = useMemo(() => parseHref(href), []); // eslint-disable-line react-hooks/exhaustive-deps
    const [advanced, setAdvanced] = useState(parsedOnce === null);
    const [model, setModel] = useState<LinkModel>(parsedOnce ?? emptyLink());

    const update = (m: LinkModel) => {
        setModel(m);
        onChange(generateHref(m));
    };
    const distinctFor = (path: string): LinkBranchRow[] => {
        if (!path) return [];
        const set = new Set<string>();
        for (const row of sample) {
            const v = getByPath(row, path);
            if (v != null) set.add(String(v));
        }
        return [...set].map((value) => ({ value, seg: '' }));
    };

    if (advanced) {
        const canBuild = parseHref(href) !== null;
        return (
            <div style={{ display: 'grid', gap: 6 }}>
                <TemplateInput value={href} discovered={discovered} placeholder="/{{type|map:A=x}}/detail?id={{id|encode}}" onChange={onChange} />
                {canBuild ? (
                    <button type="button" style={linkBtn} onClick={() => { setModel(parseHref(href) ?? emptyLink()); setAdvanced(false); }}>
                        ↩ Back to builder
                    </button>
                ) : (
                    <div style={hintStyle}>This URL is too custom for the builder — editing as a raw template.</div>
                )}
            </div>
        );
    }

    return (
        <div style={{ display: 'grid', gap: 8 }}>
            <div>
                <div style={subLabel}>Path</div>
                <input
                    type="text"
                    value={model.path}
                    placeholder="/order-detail"
                    style={smallInput}
                    onChange={(e) => update({ ...model, path: e.target.value })}
                />
            </div>

            {!model.branchField ? (
                <button type="button" style={linkBtn} onClick={() => update({ ...model, branchField: discovered[0]?.path ?? '', branchRows: distinctFor(discovered[0]?.path ?? '') })}>
                    ＋ Branch path by a field
                </button>
            ) : (
                <div style={subCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ ...subLabel, marginBottom: 0 }}>Leading segment by</span>
                        <button type="button" style={linkBtn} onClick={() => update({ ...model, branchField: '', branchRows: [], branchDefault: '' })}>remove</button>
                    </div>
                    <select value={model.branchField} style={selectStyle} onChange={(e) => update({ ...model, branchField: e.target.value, branchRows: distinctFor(e.target.value) })}>
                        {discovered.map((d) => (
                            <option key={d.path} value={d.path}>{d.path}</option>
                        ))}
                    </select>
                    {model.branchRows.map((r, i) => (
                        <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <input value={r.value} placeholder="value" style={smallInput} onChange={(e) => { const rows = [...model.branchRows]; rows[i] = { ...r, value: e.target.value }; update({ ...model, branchRows: rows }); }} />
                            <span style={{ color: '#94a3b8' }}>→</span>
                            <input value={r.seg} placeholder="segment" style={smallInput} onChange={(e) => { const rows = [...model.branchRows]; rows[i] = { ...r, seg: e.target.value }; update({ ...model, branchRows: rows }); }} />
                            <button type="button" style={xBtn} onClick={() => update({ ...model, branchRows: model.branchRows.filter((_, j) => j !== i) })}>×</button>
                        </div>
                    ))}
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: '#94a3b8', width: 64, flex: 'none' }}>else →</span>
                        <input value={model.branchDefault} placeholder="default segment" style={smallInput} onChange={(e) => update({ ...model, branchDefault: e.target.value })} />
                        <button type="button" style={linkBtn} onClick={() => update({ ...model, branchRows: [...model.branchRows, { value: '', seg: '' }] })}>＋ value</button>
                    </div>
                </div>
            )}

            <div>
                <div style={subLabel}>Query params</div>
                <div style={{ display: 'grid', gap: 5 }}>
                    {model.query.map((p, i) => (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 10px 1fr auto auto', gap: 5, alignItems: 'center' }}>
                            <input value={p.name} placeholder="name" style={smallInput} onChange={(e) => { const q = [...model.query]; q[i] = { ...p, name: e.target.value }; update({ ...model, query: q }); }} />
                            <span style={{ color: '#94a3b8' }}>=</span>
                            <select value={p.field} style={{ ...selectStyle, height: 30 }} onChange={(e) => { const q = [...model.query]; q[i] = { ...p, field: e.target.value }; update({ ...model, query: q }); }}>
                                <option value="">— field —</option>
                                {discovered.map((d) => (
                                    <option key={d.path} value={d.path}>{d.path}</option>
                                ))}
                            </select>
                            <label style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap' }}>
                                <input type="checkbox" checked={p.encode} onChange={(e) => { const q = [...model.query]; q[i] = { ...p, encode: e.target.checked }; update({ ...model, query: q }); }} />enc
                            </label>
                            <button type="button" style={xBtn} onClick={() => update({ ...model, query: model.query.filter((_, j) => j !== i) })}>×</button>
                        </div>
                    ))}
                    <button type="button" style={linkBtn} onClick={() => update({ ...model, query: [...model.query, { name: '', field: '', encode: true }] })}>＋ add param</button>
                </div>
            </div>

            <button type="button" style={{ ...linkBtn, justifySelf: 'start', color: 'var(--puck-color-grey-06, #94a3b8)' }} onClick={() => setAdvanced(true)}>Advanced (raw template)</button>
        </div>
    );
}

interface BindingRowProps {
    field: ManifestField;
    rule: MapRule | undefined;
    discovered: DiscoveredField[];
    sample: unknown[];
    onRule: (rule: MapRule | undefined) => void;
}

/** One target field → its mapping control (source dropdown + optional format / value-map). */
function BindingRow({ field, rule, discovered, sample, onRule }: BindingRowProps) {
    const fd = field.field;

    // An action target → a structured Link builder that generates a navigate href template.
    if (fd.kind === 'action') {
        return (
            <RowShell label={field.label}>
                <LinkBuilder
                    href={actionHref(rule)}
                    discovered={discovered}
                    sample={sample}
                    onChange={(v) => onRule(v.trim() ? { const: { type: 'navigate', href: v } } : undefined)}
                />
            </RowShell>
        );
    }

    const parts = ruleToParts(rule);
    const isCustom = parts.custom != null;
    const selectVal = isCustom ? '__custom__' : parts.path ?? '';
    const isText = fd.kind === 'text' || fd.kind === 'textarea';
    const setParts = (p: RuleParts) => onRule(partsToRule(p));

    return (
        <RowShell label={field.label}>
            <div style={{ display: 'grid', gap: 6 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                    <select
                        value={selectVal}
                        style={{ ...selectStyle, flex: 1, minWidth: 0 }}
                        onChange={(e) => {
                            const v = e.target.value;
                            if (v === '') onRule(undefined);
                            else if (v === '__custom__') onRule(parts.path ? `{{${parts.path}}}` : '');
                            else setParts({ ...parts, custom: undefined, path: v });
                        }}
                    >
                        <option value="">— Not mapped —</option>
                        {discovered.map((d) => (
                            <option key={d.path} value={d.path}>
                                {d.path}
                            </option>
                        ))}
                        <option value="__custom__">Custom / template…</option>
                    </select>
                    {isText && !isCustom && parts.path ? (
                        <select
                            value={parts.format ?? ''}
                            style={{ ...selectStyle, width: 116, flex: 'none' }}
                            onChange={(e) => setParts({ ...parts, format: e.target.value || undefined })}
                        >
                            {FORMAT_OPTS.map((o) => (
                                <option key={String(o.value)} value={String(o.value)}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                    ) : null}
                </div>

                {isCustom ? (
                    <TemplateInput
                        value={parts.custom ?? ''}
                        discovered={discovered}
                        placeholder="{{a}} ({{b}}) or {{x | map: … }}"
                        onChange={(v) => onRule(v ? v : undefined)}
                    />
                ) : null}

                {fd.kind === 'select' && parts.path && !isCustom ? (
                    <ValueMapEditor
                        path={parts.path}
                        sample={sample}
                        options={fd.options}
                        valueMap={parts.valueMap}
                        defaultValue={parts.default}
                        onChange={(valueMap, def) => setParts({ ...parts, valueMap, default: def })}
                    />
                ) : null}
            </div>
        </RowShell>
    );
}

function PreviewValue({ field, value }: { field: ManifestField; value: unknown }) {
    if (value == null || value === '') return <span style={{ color: '#cbd5e1' }}>—</span>;
    if (field.field.kind === 'image' && typeof value === 'string') {
        return (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                <img src={value} alt="" style={{ width: 24, height: 24, borderRadius: 4, objectFit: 'cover', flex: 'none' }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#64748b' }}>{value}</span>
            </span>
        );
    }
    if (field.field.kind === 'action') {
        const href = value && typeof value === 'object' ? (value as { href?: string }).href : undefined;
        return <code style={{ fontSize: 11 }}>{href ? `→ ${href}` : JSON.stringify(value)}</code>;
    }
    const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
    return <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{text}</span>;
}

/**
 * Bind a component to server data — the visual field mapper.
 *
 * Flow: paste a sample server response → it's introspected into bindable fields → map each
 * card field to a discovered field (with format / value-map transforms) → see a live preview.
 * The saved config is just `{ source, fields, sample }`; the runtime maps the project's REAL
 * data with the SAME engine ({@link mapItem}) the preview uses, so what ops sees is what ships.
 */
export function DataMapField({ value, onChange, label, targetFields }: DataMapFieldProps) {
    const binding: DataBinding = value ?? {};
    const fields = (binding.fields ?? {}) as FieldMap;
    const sample = Array.isArray(binding.sample) ? binding.sample : [];
    const discovered = useMemo(() => introspectSample(sample), [sample]);
    const targets = (targetFields ?? []).filter((f) => f.field.kind !== 'slot');

    const [sampleText, setSampleText] = useState(() => (sample.length ? JSON.stringify(sample, null, 2) : ''));
    const [sampleErr, setSampleErr] = useState<string | null>(null);
    const [showSample, setShowSample] = useState(sample.length === 0);
    const [rawMode, setRawMode] = useState(false);
    const [rawText, setRawText] = useState(() => JSON.stringify(fields, null, 2));
    const [rawErr, setRawErr] = useState<string | null>(null);

    const patch = (next: Partial<DataBinding>) => onChange({ ...binding, ...next });
    const setRule = (name: string, rule: MapRule | undefined) => {
        const f: FieldMap = { ...fields };
        if (rule === undefined) delete f[name];
        else f[name] = rule;
        patch({ fields: f });
    };
    const commitSample = (t: string) => {
        setSampleText(t);
        if (!t.trim()) {
            setSampleErr(null);
            patch({ sample: [] });
            return;
        }
        try {
            const parsed = JSON.parse(t);
            patch({ sample: Array.isArray(parsed) ? parsed : [parsed] });
            setSampleErr(null);
        } catch (e) {
            setSampleErr((e as Error).message);
        }
    };
    const commitRaw = (t: string) => {
        setRawText(t);
        try {
            patch({ fields: t.trim() ? JSON.parse(t) : {} });
            setRawErr(null);
        } catch (e) {
            setRawErr((e as Error).message);
        }
    };

    const preview = sample.length ? mapItem(sample[0] as Record<string, unknown>, fields) : null;

    return (
        <div style={{ fontFamily: 'inherit' }}>
            {label ? <div style={labelStyle}>{label}</div> : null}
            <div style={{ display: 'grid', gap: 12 }}>
                <div>
                    <div style={subLabel}>Source id</div>
                    <input
                        type="text"
                        value={binding.source ?? ''}
                        placeholder="e.g. userBookings"
                        style={inputStyle}
                        onChange={(e) => patch({ source: e.target.value })}
                    />
                    <div style={hintStyle}>The project passes its data array under this key.</div>
                </div>

                <div style={cardStyle}>
                    <button type="button" style={discloseBtn} onClick={() => setShowSample((s) => !s)}>
                        <span>{showSample ? '▾' : '▸'} Sample response</span>
                        {sample.length ? (
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#15803d' }}>
                                ✓ {sample.length} rows · {discovered.length} fields
                            </span>
                        ) : (
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>paste to detect fields</span>
                        )}
                    </button>
                    {showSample ? (
                        <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
                            <textarea
                                value={sampleText}
                                spellCheck={false}
                                placeholder='[ { "id": 1, "title": "…" } ]'
                                style={monoInput}
                                onChange={(e) => commitSample(e.target.value)}
                            />
                            {sampleErr ? (
                                <div style={errStyle}>Invalid JSON · {sampleErr}</div>
                            ) : discovered.length ? (
                                <div style={hintStyle}>Detected: {discovered.map((d) => d.path).join(', ')}</div>
                            ) : null}
                        </div>
                    ) : null}
                </div>

                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={subLabel}>Map fields</div>
                        <button
                            type="button"
                            style={linkBtn}
                            onClick={() => {
                                if (!rawMode) setRawText(JSON.stringify(fields, null, 2));
                                setRawMode((m) => !m);
                            }}
                        >
                            {rawMode ? 'Visual' : 'Edit as JSON'}
                        </button>
                    </div>

                    {rawMode ? (
                        <>
                            <textarea value={rawText} spellCheck={false} style={monoInput} onChange={(e) => commitRaw(e.target.value)} />
                            {rawErr ? <div style={errStyle}>Invalid JSON · {rawErr}</div> : null}
                        </>
                    ) : targets.length ? (
                        <div style={{ display: 'grid', gap: 10 }}>
                            {targets.map((f) => (
                                <BindingRow
                                    key={f.name}
                                    field={f}
                                    rule={fields[f.name]}
                                    discovered={discovered}
                                    sample={sample}
                                    onRule={(rule) => setRule(f.name, rule)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div style={hintStyle}>This component exposes no item fields to map.</div>
                    )}
                </div>

                {preview ? (
                    <div style={cardStyle}>
                        <div style={{ ...subLabel, marginBottom: 6 }}>Live preview · row 1</div>
                        <div style={{ display: 'grid', gap: 4 }}>
                            {targets.map((f) => (
                                <div key={f.name} style={{ display: 'grid', gridTemplateColumns: '88px 1fr', gap: 8, fontSize: 12, minWidth: 0 }}>
                                    <span style={{ color: '#94a3b8' }}>{f.label}</span>
                                    <PreviewValue field={f} value={(preview as Record<string, unknown>)[f.name]} />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
