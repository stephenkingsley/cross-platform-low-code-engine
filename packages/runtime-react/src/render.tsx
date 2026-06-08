import { Component, createElement, Fragment, type ComponentType, type ReactNode } from 'react';
import {
    findComponent,
    resolveLocalized,
    type DocData,
    type ManifestField,
    type Manifest,
    type Node,
} from '@lce/manifest';

/** Keeps one misbehaving component from crashing the whole runtime render. */
class Boundary extends Component<{ name: string; children?: ReactNode }, { failed: boolean }> {
    state = { failed: false };
    static getDerivedStateFromError() {
        return { failed: true };
    }
    render() {
        return this.state.failed ? null : this.props.children;
    }
}

/** Maps a component type id (`node.type`) to its concrete React implementation. */
export type ComponentRegistry = Record<string, ComponentType<any>>;

export interface RenderProps {
    /** The document produced by the editor. */
    data: DocData;
    /** Type id → React component. */
    registry: ComponentRegistry;
    /** Manifest, used to know which props are slots / arrays (and so must recurse). */
    manifest: Manifest;
    /** Active content locale — localized text props ({@link LocalizedString}) resolve to it. */
    locale?: string;
    /** Locale to fall back to when a string is missing for `locale`. */
    fallbackLocale?: string;
    /** Rendered when a `node.type` is missing from the registry. */
    fallback?: (node: Node) => ReactNode;
}

type Ctx = Pick<RenderProps, 'registry' | 'manifest' | 'fallback' | 'locale' | 'fallbackLocale'>;

/**
 * Turn a saved prop value into the real React prop: recurse into slots/arrays, and
 * resolve localized text (a `{ locale: string }` map) to the active language.
 */
function resolveValue(field: ManifestField | undefined, value: unknown, ctx: Ctx): unknown {
    if (!field) return value;
    const kind = field.field.kind;
    if (kind === 'text' || kind === 'textarea') {
        return resolveLocalized(value, ctx.locale, ctx.fallbackLocale);
    }
    if (kind === 'slot' && Array.isArray(value)) {
        return renderList(value as Node[], ctx);
    }
    if (field.field.kind === 'array' && Array.isArray(value)) {
        const itemFields = field.field.itemFields;
        return (value as Record<string, unknown>[]).map((item) => {
            const row = { ...item };
            for (const itf of itemFields) {
                const v = item[itf.name];
                if (itf.field.kind === 'slot' && Array.isArray(v)) {
                    row[itf.name] = renderList(v as Node[], ctx);
                } else if (itf.field.kind === 'text' || itf.field.kind === 'textarea') {
                    row[itf.name] = resolveLocalized(v, ctx.locale, ctx.fallbackLocale);
                }
            }
            return row;
        });
    }
    return value;
}

function renderNode(node: Node, ctx: Ctx): ReactNode {
    const Comp = ctx.registry[node.type];
    if (!Comp) return ctx.fallback ? ctx.fallback(node) : null;

    const fieldByName = new Map<string, ManifestField>(
        (findComponent(ctx.manifest, node.type)?.fields ?? []).map((f) => [f.name, f]),
    );
    const { id, ...rest } = node.props;

    const props: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(rest)) {
        props[key] = resolveValue(fieldByName.get(key), value, ctx);
    }

    return createElement(
        Boundary,
        { key: id, name: node.type },
        createElement(Comp, props),
    );
}

function renderList(nodes: Node[], ctx: Ctx): ReactNode {
    return createElement(Fragment, null, ...nodes.map((node) => renderNode(node, ctx)));
}

/**
 * Render a saved document to React elements.
 *
 * This is the framework runtime: it depends only on the registry + manifest, never on
 * Puck. The React Native runtime will be the same walk over the same JSON with a native
 * component registry.
 */
export function Render({ data, registry, manifest, fallback, locale, fallbackLocale }: RenderProps) {
    return renderList(data.content, { registry, manifest, fallback, locale, fallbackLocale });
}
