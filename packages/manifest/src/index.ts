/**
 * @lce/manifest — the single source of truth (SSOT) contract.
 *
 * A {@link Manifest} is emitted by `@lce/extractor` from component TypeScript prop
 * types, then consumed by `@lce/editor` (to build Puck fields) and
 * `@lce/runtime-react` (to render saved documents).
 *
 * It is deliberately platform-agnostic: it never contains CSS strings, `className`,
 * `style`, or any web-only type. Layout is expressed through component props
 * (flexbox tokens), never through raw styles. This is what lets the same document
 * render on React (web) today and React Native later.
 */

/** An option for `select` / `radio` fields. */
export interface FieldOption {
    label: string;
    value: string | number | boolean;
}

/**
 * Field descriptors. Each maps 1:1 onto a Puck field type, but is declared here
 * independently so the runtime never has to depend on Puck.
 *
 * `kind` is the discriminant (kept distinct from {@link Node.type} and Puck's own
 * `field.type` to avoid confusion).
 */
export type FieldDescriptor =
    | { kind: 'text' }
    | { kind: 'textarea' }
    | { kind: 'number'; min?: number; max?: number }
    | { kind: 'select'; options: FieldOption[] }
    | { kind: 'radio'; options: FieldOption[] }
    | { kind: 'slot' }
    | { kind: 'color' }
    | { kind: 'image' }
    | { kind: 'url' }
    | { kind: 'action' }
    | { kind: 'dataMap'; itemFields?: ManifestField[] }
    | { kind: 'array'; itemFields: ManifestField[]; itemLabel?: string };

/** One configurable prop of a component. */
export interface ManifestField {
    /** Prop name as declared on the component. */
    name: string;
    /** Human label (defaults to a humanized `name`); sourced from the JSDoc summary. */
    label: string;
    /** Longer help text, sourced from JSDoc. */
    description?: string;
    /** Which editor field to render, and how the runtime treats the value. */
    field: FieldDescriptor;
    /** Recovered from a JSDoc `@default` tag or a destructuring default. */
    defaultValue?: unknown;
    /** Whether the prop is required (non-optional in TS). */
    required: boolean;
}

/** Where a component implementation is resolved from at render time. */
export type ComponentSource = 'engine' | 'dp-design';

/** One component the builder can place on the canvas. */
export interface ComponentManifest {
    /** Stable type id used in saved documents ({@link Node.type}) and as the registry key. */
    name: string;
    /** Which package the component is imported from (for docs / tooling). */
    source: ComponentSource;
    /** Optional grouping for the editor's component list. */
    category?: string;
    /** Configurable props, already filtered (no css/className/style, no functions). */
    fields: ManifestField[];
    /**
     * Names of the `slot` fields. The runtime recurses into these prop values
     * (each holds a `Node[]`) to render nested children.
     */
    slotFields: string[];
}

export interface Manifest {
    /** Manifest schema version. */
    version: 1;
    components: ComponentManifest[];
}

// ---- Saved document shape (Puck-compatible, but Puck-independent) ------------

/** A placed component instance. Slot-typed props hold a `Node[]`. */
export interface Node {
    type: string;
    props: Record<string, unknown> & { id: string };
}

/**
 * The document the editor saves and the runtime renders. Shape is compatible with
 * Puck's `Data` so `<Puck>` can produce it, but nothing here imports Puck.
 */
export interface DocData {
    root: { props?: Record<string, unknown> };
    content: Node[];
    /** Legacy Puck `zones` — unused (we nest via slot fields), kept for forward-compat. */
    zones?: Record<string, Node[]>;
}

// ---- Helpers ----------------------------------------------------------------

/** Look up a component manifest by its type id. */
export function findComponent(
    manifest: Manifest,
    type: string,
): ComponentManifest | undefined {
    return manifest.components.find((c) => c.name === type);
}

/** The slot-field names for a given component type (empty if unknown). */
export function slotFieldsOf(manifest: Manifest, type: string): string[] {
    return findComponent(manifest, type)?.slotFields ?? [];
}

// ---- JSON Schema export (protocol contract) ---------------------------------
export * from './schema';

// ---- i18n (localized text content) ------------------------------------------
export * from './i18n';

// ---- media references (image assets, $media) --------------------------------
export * from './media';

// ---- actions (declarative click behaviour) ----------------------------------
export * from './action';

// ---- data binding (server data → component items) ---------------------------
export * from './mapping';
