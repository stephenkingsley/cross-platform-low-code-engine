import { Component, createElement, type ComponentType, type CSSProperties, type ReactNode } from 'react';
import type { Config, Field, Fields } from '@puckeditor/core';
import {
    resolveLocalized,
    resolveMedia,
    type Action,
    type ComponentManifest,
    type DataBinding,
    type FieldAudience,
    type FieldOption,
    type ManifestField,
    type Manifest,
} from '@lce/manifest';
import {
    ActionField,
    BackgroundField,
    ColorField,
    DataMapField,
    HideWhenEmptyField,
    ImageField,
    LocalizedTextField,
    LooksRow,
    VisibilityField,
    type ActionEvent,
    type VisibilityFlag,
} from './custom-fields';

/**
 * Field kinds shown as "content" (before "style") in the config panel. Content = the data a block
 * carries (copy, media, nested slots, click behaviour); everything else (select/radio/number/
 * colour/background) is treated as style. Panel order is Visibility → content → style.
 *
 * Also the default ops/design split ({@link audienceOf}). MUST mirror the extractor's copy of this
 * set — there it only feeds a coverage stat, here it decides what ops can reach.
 */
const CONTENT_FIELD_KINDS = new Set(['text', 'textarea', 'url', 'image', 'slot', 'array', 'action']);

/** Keeps one misbehaving component from crashing the whole editor canvas. */
class Boundary extends Component<{ name: string; children?: ReactNode }, { failed: boolean }> {
    state = { failed: false };
    static getDerivedStateFromError() {
        return { failed: true };
    }
    render() {
        if (this.state.failed) {
            return createElement(
                'div',
                {
                    style: {
                        padding: '8px 10px',
                        border: '1px dashed #e5a0a0',
                        borderRadius: 6,
                        color: '#b42318',
                        fontSize: 12,
                        fontFamily: 'system-ui, sans-serif',
                        background: '#fff5f5',
                    },
                },
                `⚠ ${this.props.name} couldn't render here`,
            );
        }
        return this.props.children;
    }
}

/** Type id → concrete React component to mount in the editor canvas. */
export type ComponentRegistry = Record<string, ComponentType<any>>;

/** Which tier the config panel serves. */
export type PanelMode = 'ops' | 'design';

export interface BuildOptions {
    /**
     * Optional canvas root wrapper, used as Puck's `root.render`. Runs inside the
     * iframe canvas — e.g. a design-system provider that sets up theming/styles.
     */
    rootRender?: ComponentType<{ children: ReactNode }>;
    /** Group the component drawer into categories: `{ key: { title, components } }`. */
    categories?: Record<string, { title?: string; components: string[] }>;
    /** Active content locale — localized text renders in this language on the canvas. */
    locale?: string;
    /** Locale to fall back to for missing translations. */
    fallbackLocale?: string;
    /** Locales to author. When more than one, text fields become per-locale inputs. */
    locales?: string[];
    /** Optional host-provided image picker (e.g. Contentful) injected into image fields. */
    assetPicker?: () => Promise<unknown | null>;
    /** Extra fields shown in Puck's root "PAGE" panel (they edit `data.root.props`). */
    rootFields?: Fields;
    /** Heading for the root "PAGE" panel (defaults to Puck's "Page"). */
    rootLabel?: string;
    /**
     * Feature-flag catalog for the universal per-block Visibility control. When set, every block
     * gets a "显示条件 / Visibility" field to gate it on an entitlement key; ops pick from this list
     * (so the document's flag names always match what the server returns). Empty/undefined → the
     * control still appears but with no flags to choose (visibility left unconfigured).
     */
    flagCatalog?: VisibilityFlag[];
    /**
     * Which tier the config panel serves.
     *
     * `design` (the default, so an existing host keeps the panel it has today) offers every prop the
     * manifest declares, tokens raw — `md`/`lg` is the designer's shared vocabulary with Figma.
     * `ops` drops the design tier's CONTROLS and leads with the reserved questions instead.
     *
     * Presentation only either way: the saved document is identical, because the tier decides what
     * the panel OFFERS, never what a block stores or renders.
     */
    mode?: PanelMode;
    /**
     * Ops mode only: keep the design tier editable instead of collapsing it into the read-only
     * "Looks" row. A build-time decision for a host whose ops team owns styling too — deliberately
     * not an in-panel unlock, since a reachable escape hatch just becomes muscle memory.
     */
    allowStyleOverride?: boolean;
    /** What a flag IS to this host, in ops words ("benefit", "tier", "plan"). Defaults to "benefit". */
    flagNoun?: string;
    /**
     * App events a block's `action` may fire, declared by the host. Empty/undefined → the event name
     * falls back to a free-text input (ops can then only guess a name the dispatcher may not know).
     */
    eventCatalog?: ActionEvent[];
    /**
     * A REAL sample of what the host will pass the runtime as `bindings` — used only to show ops
     * what a `{{ … }}` reads as while they write it, and to offer the paths that sample contained.
     * Never saved into the document.
     *
     * A sample rather than a declared list of paths, because the host's data is dynamic: any list
     * would be a promise it can't keep, while a response is simply what came back. Empty/undefined
     * → text still accepts `{{ … }}`, ops just writes it blind.
     */
    sampleBindings?: Record<string, unknown>;
}

/** Everything a field control needs beyond its own {@link ManifestField}. */
interface FieldCtx {
    locales?: string[];
    assetPicker?: () => Promise<unknown | null>;
    mode: PanelMode;
    /** The block the field belongs to, so a question can name what it's asking about. */
    blockLabel: string;
    flagNoun?: string;
    eventCatalog?: ActionEvent[];
    sampleBindings?: Record<string, unknown>;
}

/**
 * Which tier owns a field: an explicit `audience` wins, else content kinds are ops' and the rest
 * (select/radio/number/colour/background) are design's. The fallback is what lets ~67 auto-discovered
 * components land in a sane tier with zero per-component authoring.
 *
 * `dataMap` is called out because it is neither, and the fallback's "everything else is design" would
 * file this block's SERVER WIRING under "Looks — set by design" — where the row would also render a
 * structured `DataBinding` into a text box and destroy it on the first keystroke. It belongs with
 * content: it decides what the block shows.
 */
function audienceOf(f: ManifestField): FieldAudience {
    if (f.audience) return f.audience;
    if (f.field.kind === 'dataMap') return 'ops';
    return CONTENT_FIELD_KINDS.has(f.field.kind) ? 'ops' : 'design';
}

/**
 * Option labels for a select/radio. In ops mode an authored `answers` entry reframes the option as
 * the OUTCOME it produces ("The main action"); design mode keeps the raw token label.
 *
 * The option VALUE is never touched — only the gloss around it — so the document stores the same
 * token whichever tier picked it.
 */
function optionsFor(f: ManifestField, options: FieldOption[], ctx: FieldCtx): FieldOption[] {
    const answers = f.answers;
    if (ctx.mode !== 'ops' || !answers) return options;
    return options.map((o) => ({ ...o, label: answers[String(o.value)] ?? o.label }));
}

/** Map one manifest field to its Puck field config. */
function toPuckField(field: ManifestField, ctx: FieldCtx): Field {
    const d = field.field;
    switch (d.kind) {
        case 'text':
        case 'textarea':
            // Always the custom control, even for a single locale: it carries the `{{ … }}` insert
            // chips and the live preview, which a native text input has nowhere to put.
            return {
                type: 'custom',
                label: field.label,
                render: ({ onChange, value }: { onChange: (v: unknown) => void; value?: unknown }) =>
                    createElement(LocalizedTextField, {
                        value: value as string | Record<string, string> | undefined,
                        onChange: onChange as (v: Record<string, string>) => void,
                        label: field.label,
                        locales: ctx.locales?.length ? ctx.locales : ['en'],
                        multiline: d.kind === 'textarea',
                        sample: ctx.sampleBindings,
                    }),
            } as Field;
        case 'url':
            // A link / route — a plain single-line string, never per-locale.
            return { type: 'text', label: field.label } as Field;
        case 'number':
            return { type: 'number', label: field.label } as Field;
        case 'select':
            return { type: 'select', label: field.label, options: optionsFor(field, d.options, ctx) } as Field;
        case 'radio':
            return { type: 'radio', label: field.label, options: optionsFor(field, d.options, ctx) } as Field;
        case 'slot':
            return { type: 'slot' } as Field;
        case 'color':
            return {
                type: 'custom',
                label: field.label,
                render: ({ onChange, value }: { onChange: (v: unknown) => void; value?: string }) =>
                    createElement(ColorField, { value, onChange, label: field.label }),
            } as Field;
        case 'background':
            return {
                type: 'custom',
                label: field.label,
                render: ({ onChange, value }: { onChange: (v: unknown) => void; value?: string }) =>
                    createElement(BackgroundField, { value, onChange, label: field.label }),
            } as Field;
        case 'image':
            return {
                type: 'custom',
                label: field.label,
                render: ({ onChange, value }: { onChange: (v: unknown) => void; value?: unknown }) =>
                    createElement(ImageField, { value, onChange, label: field.label, assetPicker: ctx.assetPicker }),
            } as Field;
        case 'action':
            return {
                type: 'custom',
                label: field.label,
                render: ({ onChange, value }: { onChange: (v: unknown) => void; value?: unknown }) =>
                    createElement(ActionField, {
                        value: value as Action | undefined,
                        onChange: onChange as (v: Action | undefined) => void,
                        label: field.label,
                        blockLabel: ctx.blockLabel,
                        eventCatalog: ctx.eventCatalog,
                    }),
            } as Field;
        case 'dataMap':
            return {
                type: 'custom',
                label: field.label,
                render: ({ onChange, value }: { onChange: (v: unknown) => void; value?: unknown }) =>
                    createElement(DataMapField, {
                        value: value as DataBinding | undefined,
                        onChange: onChange as (v: DataBinding | undefined) => void,
                        label: field.label,
                        targetFields: d.itemFields,
                    }),
            } as Field;
        case 'array': {
            const arrayFields: Fields = {};
            // Row fields carry no help line: a row repeats, so per-row help would say the same
            // sentence N times inside an already-dense item body.
            for (const itf of d.itemFields) arrayFields[itf.name] = toPuckField(itf, ctx);
            const defaultItemProps: Record<string, unknown> = {};
            for (const itf of d.itemFields) {
                if (itf.field.kind === 'slot') defaultItemProps[itf.name] = [];
                else if (itf.defaultValue !== undefined) defaultItemProps[itf.name] = itf.defaultValue;
            }
            const labelKey = d.itemLabel;
            return {
                type: 'array',
                label: field.label,
                arrayFields,
                defaultItemProps,
                getItemSummary: labelKey
                    ? (item: Record<string, unknown>, i = 0) => {
                          // `labelKey` is often a slot (ReactNode) → its value is an
                          // array/empty; only use it as a label when it's real text.
                          const v = item?.[labelKey];
                          return typeof v === 'string' && v.trim() ? v : `Item ${i + 1}`;
                      }
                    : undefined,
            } as Field;
        }
    }
}

/**
 * Keys for the panel's read-only rows.
 *
 * Puck renders one field per key in `fields`, in key order, and only writes a prop when a field
 * calls `onChange`. So a row that never calls it stores nothing: the saved document keeps exactly
 * the props the manifest declares, and these synthetic keys stay presentation.
 */
const LOOKS_KEY = '__lce_looks';
const helpKey = (name: string) => `__lce_help_${name}`;

/**
 * Puck spaces sibling fields 12px apart (`.InputWrapper + .InputWrapper`), so an unstyled help row
 * would sit equidistant between its own control and the NEXT field's label and read as either.
 * Pull it up to bind it to the control above.
 */
const helpStyle: CSSProperties = {
    fontSize: 11,
    lineHeight: 1.45,
    color: 'var(--puck-color-grey-06, #94a3b8)',
    fontFamily: 'inherit',
    marginTop: -6,
};

/**
 * The help text for a field, in the voice of the tier reading it: `help` is the ops-facing rewrite,
 * `description` the engineer-facing JSDoc body the extractor lifts off the prop.
 */
function helpFor(f: ManifestField, mode: PanelMode): string | undefined {
    return mode === 'ops' ? f.help ?? f.description : f.description;
}

/** Help text as its own field — Puck's fields have no description slot to render it in. */
function helpField(text: string): Field {
    return {
        type: 'custom',
        render: () => createElement('div', { style: helpStyle }, text),
    } as unknown as Field;
}

/** Offline-safe placeholder image so freshly-dropped media shows something, not a broken box. */
const PLACEHOLDER_IMG =
    'data:image/svg+xml,' +
    encodeURIComponent(
        "<svg xmlns='http://www.w3.org/2000/svg' width='320' height='180'>" +
            "<rect width='100%' height='100%' fill='#e9eef5'/>" +
            "<text x='50%' y='50%' fill='#9aa7b8' font-family='sans-serif' font-size='16'" +
            " text-anchor='middle' dominant-baseline='middle'>Image</text></svg>",
    );

/** A sensible default value for a field, so freshly-dropped components aren't blank. */
function sampleForField(f: ManifestField, compName: string): unknown {
    // A documented default (JSDoc @default) matches the component's real behaviour,
    // so it's safe — editor and runtime agree.
    if (f.defaultValue !== undefined) return f.defaultValue;
    const d = f.field;
    switch (d.kind) {
        case 'slot':
            return [];
        case 'text':
            return f.name === 'children' ? compName : undefined;
        case 'image':
            return PLACEHOLDER_IMG;
        case 'array':
            // one starter row so the component shows its structure when dropped
            return [
                Object.fromEntries(
                    d.itemFields
                        .map((itf) => [itf.name, sampleForField(itf, itf.name)])
                        .filter(([, v]) => v !== undefined),
                ),
            ];
        default:
            // number / color / select / radio → leave UNSET so the component's OWN
            // default applies. Imposing e.g. the first select option here would
            // override the component default in the editor while the Puck-free
            // runtime falls through to it → editor/runtime divergence (e.g. Swiper
            // `direction` defaulting to 'vertical' in the editor but 'horizontal' live).
            return undefined;
    }
}

/**
 * Defaults for a freshly-dropped block — from the WHOLE manifest, never the panel's field map.
 * A design-tier prop is hidden from ops, not removed: filtering it here would drop a block onto the
 * canvas without its design defaults, which is a change to the document, not to the panel.
 */
function defaultPropsOf(c: ComponentManifest): Record<string, unknown> {
    const dp: Record<string, unknown> = {};
    for (const f of c.fields) {
        const v = sampleForField(f, c.name);
        if (v !== undefined) dp[f.name] = v;
    }
    return dp;
}

/**
 * Resolve a Puck field value into the real prop the component expects:
 *  - text  → resolve a localized `{ locale: string }` map to the active language.
 *  - slot  → Puck hands a render component; invoke it (the nested children).
 *  - array → map rows, rendering per-row slots and resolving per-row localized text.
 *  - else  → pass through.
 */
function resolveProp(
    field: ManifestField,
    value: any,
    locale?: string,
    fallbackLocale?: string,
): unknown {
    const kind = field.field.kind;
    if (kind === 'text' || kind === 'textarea' || kind === 'url') {
        // `url` isn't localized, but resolveLocalized is a no-op on plain strings and
        // gracefully unwraps any legacy localized value.
        return resolveLocalized(value, locale, fallbackLocale);
    }
    if (kind === 'image') {
        return resolveMedia(value);
    }
    if (kind === 'slot') {
        return typeof value === 'function' ? createElement(value as ComponentType<any>) : value;
    }
    if (field.field.kind === 'array' && Array.isArray(value)) {
        const itemFields = field.field.itemFields;
        return value.map((item: Record<string, any>) => {
            const row = { ...item };
            for (const itf of itemFields) {
                const k = itf.name;
                if (itf.field.kind === 'slot' && typeof item?.[k] === 'function') {
                    row[k] = createElement(item[k]);
                } else if (itf.field.kind === 'text' || itf.field.kind === 'textarea' || itf.field.kind === 'url') {
                    row[k] = resolveLocalized(item?.[k], locale, fallbackLocale);
                } else if (itf.field.kind === 'image') {
                    row[k] = resolveMedia(item?.[k]);
                } else if (itf.field.kind === 'action') {
                    delete row[k]; // editor previews layout, not per-card clicks
                }
            }
            return row;
        });
    }
    return value;
}

function buildComponentConfig(c: ComponentManifest, registry: ComponentRegistry, opts: BuildOptions) {
    const Comp = registry[c.name];
    const mode: PanelMode = opts.mode ?? 'design';
    const ctx: FieldCtx = {
        locales: opts.locales,
        assetPicker: opts.assetPicker,
        mode,
        blockLabel: c.name,
        flagNoun: opts.flagNoun,
        eventCatalog: opts.eventCatalog,
        sampleBindings: opts.sampleBindings,
    };

    // In ops mode the design tier has no CONTROL: its props are omitted from Puck's field map, not
    // disabled — a greyed-out control still teaches that the knob is there and worth asking about.
    // They stay in `defaultProps` and in render() below, so the block ships and looks the same; only
    // the offer to tune it is gone, replaced by the read-only Looks row.
    const hideDesign = mode === 'ops' && !opts.allowStyleOverride;
    const opsFields = c.fields.filter((f) => audienceOf(f) === 'ops');
    const designFields = c.fields.filter((f) => audienceOf(f) === 'design');
    const actionFields = opsFields.filter((f) => f.field.kind === 'action');
    const hasSlots = c.fields.some((f) => f.field.kind === 'slot');

    // Puck renders fields in key order, and the render() below iterates only the manifest's
    // `c.fields`, so the reserved keys are never forwarded to the component.
    const fields: Fields = {};
    const add = (f: ManifestField) => {
        fields[f.name] = toPuckField(f, ctx);
        const help = helpFor(f, mode);
        // A slot draws no control in the panel (Puck renders it on the canvas), so help under one
        // would caption nothing and drift onto the next field.
        if (help && f.field.kind !== 'slot') fields[helpKey(f.name)] = helpField(help);
    };

    // ── The reserved props: node props owned by the runtime walker, not component props ──
    const visibleWhen = {
        type: 'custom',
        render: ({ onChange, value }: { onChange: (v: unknown) => void; value?: unknown }) =>
            createElement(VisibilityField, {
                value,
                onChange,
                flags: opts.flagCatalog ?? [],
                blockLabel: c.name,
                flagNoun: opts.flagNoun,
            }),
    } as unknown as Field;
    const hideWhenEmpty = {
        type: 'custom',
        render: ({ onChange, value }: { onChange: (v: unknown) => void; value?: unknown }) =>
            createElement(HideWhenEmptyField, {
                value: value as boolean | undefined,
                onChange: onChange as (v: boolean) => void,
                blockLabel: c.name,
            }),
    } as unknown as Field;

    if (mode === 'ops') {
        // Ops order: who sees it → content → on tap → if empty → Looks.
        //
        // `visibleWhen` leads because it is the only field here with no `if`: content is 0-12 rows
        // depending on how many props a component author happened to write, `action` and
        // `hideWhenEmpty` only exist on some blocks, and Looks needs designFields. Anything else in
        // first position would sit at a different depth on every block, which is no position at all
        // — ops would have to hunt for it each time. Not because it's edited often (it isn't), but
        // because a wrong answer here is the one mistake the editor cannot show you: a copy typo is
        // visible on the canvas and self-corrects, while a bad gate only resolves in the runtime
        // walker and ships silently. Design mode already leads with it, below.
        fields.visibleWhen = visibleWhen;
        for (const f of opsFields) if (f.field.kind !== 'action') add(f);
        for (const f of actionFields) add(f);
        if (hasSlots) fields.hideWhenEmpty = hideWhenEmpty;
        // The design tier lands last either way: as one read-only row ops can quote in a ticket,
        // or — when the host opted in — as the real controls.
        if (hideDesign) {
            if (designFields.length > 0) {
                fields[LOOKS_KEY] = {
                    type: 'custom',
                    render: () => createElement(LooksRow, { fields: designFields, blockLabel: c.name }),
                } as unknown as Field;
            }
        } else {
            for (const f of designFields) add(f);
        }
    } else {
        // Design order: Visibility → content → style, preserving manifest order within each tier.
        fields.visibleWhen = visibleWhen;
        if (hasSlots) fields.hideWhenEmpty = hideWhenEmpty;
        const isContent = (f: ManifestField) => CONTENT_FIELD_KINDS.has(f.field.kind);
        for (const f of c.fields) if (isContent(f)) add(f);
        for (const f of c.fields) if (!isContent(f)) add(f);
    }

    return {
        label: c.name,
        fields,
        defaultProps: defaultPropsOf(c),
        render: (props: Record<string, any>) => {
            if (!Comp) return null;
            const finalProps: Record<string, unknown> = {};
            for (const f of c.fields) {
                // The editor previews layout, not clicks — Puck owns canvas selection, so we
                // don't wire `action` to onClick here (it's configured in the right panel).
                // `dataMap` (binding) is resolved by the RUNTIME against real data; the editor
                // shows the component's static example, so skip it here too.
                if (f.field.kind === 'action' || f.field.kind === 'dataMap') continue;
                finalProps[f.name] = resolveProp(f, props[f.name], opts.locale, opts.fallbackLocale);
            }
            return createElement(Boundary, { name: c.name }, createElement(Comp, finalProps));
        },
    };
}

/**
 * Build a Puck {@link Config} from a manifest + a component registry.
 *
 * Crucially, fields come ONLY from the manifest (which the extractor already
 * stripped of className/style/CSS and functions), so the editor can never expose
 * anything outside a component's real, safe props.
 */
export function buildPuckConfig(
    manifest: Manifest,
    registry: ComponentRegistry,
    options: BuildOptions = {},
): Config {
    const components: Record<string, unknown> = {};
    for (const c of manifest.components) {
        components[c.name] = buildComponentConfig(c, registry, options);
    }

    const config: Record<string, unknown> = { components };
    if (options.categories) config.categories = options.categories;
    const root: Record<string, unknown> = {};
    if (options.rootRender) {
        const Root = options.rootRender;
        root.render = ({ children }: { children?: ReactNode }) => createElement(Root, null, children);
    }
    if (options.rootFields) root.fields = options.rootFields;
    if (options.rootLabel) root.label = options.rootLabel;
    if (Object.keys(root).length > 0) config.root = root;
    return config as Config;
}
