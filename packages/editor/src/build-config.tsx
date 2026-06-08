import { Component, createElement, type ComponentType, type ReactNode } from 'react';
import type { Config, Field, Fields } from '@puckeditor/core';
import { resolveLocalized, type ComponentManifest, type ManifestField, type Manifest } from '@lce/manifest';
import { ColorField, ImageField, LocalizedTextField } from './custom-fields';

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
}

/** Map one manifest field to its Puck field config. */
function toPuckField(field: ManifestField, locales?: string[]): Field {
    const d = field.field;
    const i18n = !!locales && locales.length > 1;
    switch (d.kind) {
        case 'text':
        case 'textarea':
            if (i18n) {
                return {
                    type: 'custom',
                    label: field.label,
                    render: ({ onChange, value }: { onChange: (v: unknown) => void; value?: unknown }) =>
                        createElement(LocalizedTextField, {
                            value: value as string | Record<string, string> | undefined,
                            onChange: onChange as (v: Record<string, string>) => void,
                            label: field.label,
                            locales: locales!,
                            multiline: d.kind === 'textarea',
                        }),
                } as Field;
            }
            return { type: d.kind, label: field.label } as Field;
        case 'number':
            return { type: 'number', label: field.label } as Field;
        case 'select':
            return { type: 'select', label: field.label, options: d.options } as Field;
        case 'radio':
            return { type: 'radio', label: field.label, options: d.options } as Field;
        case 'slot':
            return { type: 'slot' } as Field;
        case 'color':
            return {
                type: 'custom',
                label: field.label,
                render: ({ onChange, value }: { onChange: (v: unknown) => void; value?: string }) =>
                    createElement(ColorField, { value, onChange, label: field.label }),
            } as Field;
        case 'image':
            return {
                type: 'custom',
                label: field.label,
                render: ({ onChange, value }: { onChange: (v: unknown) => void; value?: string }) =>
                    createElement(ImageField, { value, onChange, label: field.label }),
            } as Field;
        case 'array': {
            const arrayFields: Fields = {};
            for (const itf of d.itemFields) arrayFields[itf.name] = toPuckField(itf, locales);
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
    if (kind === 'text' || kind === 'textarea') {
        return resolveLocalized(value, locale, fallbackLocale);
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
                } else if (itf.field.kind === 'text' || itf.field.kind === 'textarea') {
                    row[k] = resolveLocalized(item?.[k], locale, fallbackLocale);
                }
            }
            return row;
        });
    }
    return value;
}

function buildComponentConfig(c: ComponentManifest, registry: ComponentRegistry, opts: BuildOptions) {
    const Comp = registry[c.name];
    const fields: Fields = {};
    for (const f of c.fields) fields[f.name] = toPuckField(f, opts.locales);

    return {
        label: c.name,
        fields,
        defaultProps: defaultPropsOf(c),
        render: (props: Record<string, any>) => {
            if (!Comp) return null;
            const finalProps: Record<string, unknown> = {};
            for (const f of c.fields) {
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
    if (options.rootRender) {
        const Root = options.rootRender;
        config.root = {
            render: ({ children }: { children?: ReactNode }) =>
                createElement(Root, null, children),
        };
    }
    return config as Config;
}
