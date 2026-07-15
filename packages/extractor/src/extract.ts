import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { Node, Project, type Symbol as TsSymbol, type Type } from 'ts-morph';
import type {
    ComponentManifest,
    FieldAudience,
    FieldDescriptor,
    FieldOption,
    Manifest,
    ManifestField,
} from '@lce/manifest';
import { REPO_ROOT, type ExtractProject, type ExtractTarget } from './config';
import { applyOpsMeta, audienceOf } from './ops-meta';

/** React-internal / escape-hatch props that must never become editable fields. */
const GLOBAL_SKIP = new Set(['key', 'ref', 'id', 'length', 'tabIndex', 'role', 'className', 'style']);
const REACT_NODE_RE = /ReactNode|ReactElement|JSX\.Element|ReactChild|ReactPortal/;
/** React base interfaces whose members are generic DOM / aria / event noise — not real component props. */
const NOISE_INTERFACES = new Set([
    'AriaAttributes',
    'DOMAttributes',
    'HTMLAttributes',
    'AllHTMLAttributes',
    'SVGAttributes',
    'SVGProps',
]);

/** Name of the interface that declares a prop (empty for inline type literals / a component's own props). */
function declaringInterface(decl: Node | undefined): string {
    const parent = decl?.getParent();
    return parent && Node.isInterfaceDeclaration(parent) ? parent.getName() : '';
}

/** `loadingSize` → `Loading Size` */
function humanize(name: string): string {
    const spaced = name.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** Parse a JSDoc `@default` payload into a real JSON value. */
function parseLiteral(text: string): unknown {
    const t = text.trim();
    if (!t) return undefined;
    const quoted = t.match(/^['"`](.*)['"`]$/);
    if (quoted) return quoted[1];
    if (t === 'true') return true;
    if (t === 'false') return false;
    const n = Number(t);
    if (t !== '' && !Number.isNaN(n)) return n;
    return t;
}

/** Drop `undefined` / `null` members so optional props classify by their real type. */
function nonNullable(type: Type): Type[] {
    const parts = type.isUnion() ? type.getUnionTypes() : [type];
    return parts.filter((t) => !t.isUndefined() && !t.isNull());
}

/**
 * Map a resolved scalar TS type to a field descriptor. Returns null for anything not
 * representable as a simple editor field (objects, arrays, mixed unions).
 *
 * `answers` carries JSDoc `@yes`/`@no`. A boolean has no designer vocabulary to preserve
 * (unlike a `md`/`lg` token), so these relabel the OPTIONS in both tiers rather than
 * living in {@link ManifestField.answers} as an ops-only gloss.
 */
function classifyScalar(
    type: Type,
    answers?: { yes?: string; no?: string },
): FieldDescriptor | null {
    const parts = nonNullable(type);
    if (parts.length === 0) return null;

    const isBool =
        parts.some((t) => t.isBoolean()) || parts.every((t) => t.isBooleanLiteral());
    if (isBool) {
        return {
            kind: 'radio',
            options: [
                { label: answers?.yes ?? 'On', value: true },
                { label: answers?.no ?? 'Off', value: false },
            ],
        };
    }

    if (parts.every((t) => t.isStringLiteral())) {
        const options: FieldOption[] = parts.map((t) => {
            const value = String(t.getLiteralValue());
            return { label: value, value };
        });
        return { kind: 'select', options };
    }

    if (parts.every((t) => t.isNumber() || t.isNumberLiteral())) {
        return { kind: 'number' };
    }

    if (parts.every((t) => t.isString() || t.isStringLiteral())) {
        return { kind: 'text' };
    }

    // Mixed `number | string` (e.g. a size/height prop accepting 150 or '150px').
    // Treat as a number field — the common, builder-friendly case.
    if (
        parts.every(
            (t) =>
                t.isNumber() || t.isNumberLiteral() || t.isString() || t.isStringLiteral(),
        )
    ) {
        return { kind: 'number' };
    }

    return null;
}

/**
 * Prop copy recovered from JSDoc. `description` is the engineer-facing body; the tags are
 * the ops-facing overrides. Everything here loses to {@link OPS_META}.
 */
interface JsDocMeta {
    description?: string;
    defaultValue?: unknown;
    label?: string;
    help?: string;
    audience?: FieldAudience;
    /** `@yes` / `@no` — outcome labels for a boolean's two options. */
    yes?: string;
    no?: string;
}

function readJsDoc(decl: Node): JsDocMeta {
    if (!Node.isPropertySignature(decl)) return {};
    const docs = decl.getJsDocs();
    if (docs.length === 0) return {};
    const doc = docs[docs.length - 1];
    const meta: JsDocMeta = { description: doc.getDescription().trim() || undefined };
    for (const tag of doc.getTags()) {
        const text = tag.getCommentText()?.trim() ?? '';
        switch (tag.getTagName()) {
            case 'default':
                meta.defaultValue = parseLiteral(text);
                break;
            case 'label':
                meta.label = text || undefined;
                break;
            case 'help':
                meta.help = text || undefined;
                break;
            case 'audience':
                // Unknown values are ignored so a typo falls back to kind-inference.
                if (text === 'ops' || text === 'design') meta.audience = text;
                break;
            case 'yes':
                meta.yes = text || undefined;
                break;
            case 'no':
                meta.no = text || undefined;
                break;
        }
    }
    return meta;
}

/**
 * Classify a single prop into a {@link ManifestField}, or return null to drop it.
 *
 * Drop rules (these keep the builder "props-only" and cross-platform):
 *  - `className` / `style` / any `CSSProperties`-typed prop  → CSS escape hatch
 *  - function-typed props (event handlers)                  → not serializable
 *  - non-`children` ReactNode props (icons, prefix, suffix) → not a scalar field
 */
/** The object element type of an array — directly, or the object array within a union (`T[] | string[]`). */
function objectArrayElement(type: Type): Type | undefined {
    const candidates = type.isUnion() ? type.getUnionTypes() : [type];
    for (const c of candidates) {
        if (!c.isArray()) continue;
        const el = c.getArrayElementType();
        if (!el || el.isArray() || el.getCallSignatures().length > 0) continue;
        const scalar =
            el.isString() ||
            el.isNumber() ||
            el.isBoolean() ||
            el.isStringLiteral() ||
            el.isNumberLiteral() ||
            el.isBooleanLiteral();
        if (!scalar && el.getProperties().length > 0) return el;
    }
    return undefined;
}

/** Classify one property of an array element type (a row). ReactNode → nested slot. */
function classifyItemProp(prop: TsSymbol, loc: Node): ManifestField | null {
    const name = prop.getName();
    if (GLOBAL_SKIP.has(name)) return null;
    const sig = prop.getDeclarations().find(Node.isPropertySignature);
    if (NOISE_INTERFACES.has(declaringInterface(sig))) return null;
    const declaredText = sig?.getTypeNode()?.getText() ?? '';
    if (/CSSProperties/.test(declaredText)) return null;
    const type = sig ? sig.getType() : prop.getTypeAtLocation(loc);
    if (type.getCallSignatures().length > 0) return null;
    const required = sig ? !sig.hasQuestionToken() : false;
    const tags: JsDocMeta = sig ? readJsDoc(sig) : {};
    const { description, defaultValue, help, audience } = tags;
    if (name === 'action') {
        // A per-row declarative click action (e.g. a carousel card's link).
        return { name, label: tags.label ?? 'On click', description, help, audience, field: { kind: 'action' }, required };
    }
    if (REACT_NODE_RE.test(declaredText) || REACT_NODE_RE.test(type.getText())) {
        return { name, label: tags.label ?? humanize(name), description, help, audience, field: { kind: 'slot' }, required };
    }
    let field = classifyScalar(type, tags);
    if (!field) return null;
    if (field.kind === 'text') {
        if (/colou?r$/i.test(name)) field = { kind: 'color' };
        else if (/^background$/i.test(name)) field = { kind: 'background' };
        else if (/^(src|image|imageurl|cover|avatar|photo|logo|decoration)$/i.test(name))
            field = { kind: 'image' };
        else if (/(href|url|link)$/i.test(name) && !/(image|img|photo|avatar|logo|icon|cover|thumb|src|media)/i.test(name))
            field = { kind: 'url' };
    }
    return { name, label: tags.label ?? humanize(name), description, help, audience, field, defaultValue, required };
}

/**
 * Classify a prop, then let {@link OPS_META} override the extracted copy. Wraps
 * {@link classifyProp} so EVERY return path (slot, array, scalar, coerced text) gets patched.
 */
function classify(prop: TsSymbol, target: ExtractTarget, loc: Node): ManifestField | null {
    const field = classifyProp(prop, target, loc);
    return field ? applyOpsMeta(field, target.name) : null;
}

function classifyProp(prop: TsSymbol, target: ExtractTarget, loc: Node): ManifestField | null {
    const name = prop.getName();
    if (GLOBAL_SKIP.has(name)) return null;
    if (target.include && !target.include.includes(name)) return null;
    if (target.exclude?.includes(name)) return null;

    // Props inherited through antd `Omit<>`/`Pick<>` or native HTML attrs often have
    // NO single value declaration. Resolve the type at the props-type location rather
    // than bailing, so those inherited props still classify.
    const sig = prop.getDeclarations().find(Node.isPropertySignature);

    // Drop generic DOM / aria / event attributes inherited from React's base
    // interfaces — but never drop `children` or an explicitly-declared text slot.
    const exempt =
        name === 'children' ||
        !!target.textProps?.includes(name) ||
        !!target.slotProps?.includes(name);
    if (!exempt && NOISE_INTERFACES.has(declaringInterface(sig))) return null;

    const declaredText = sig?.getTypeNode()?.getText() ?? '';

    const type = prop.getTypeAtLocation(loc);
    if (/CSSProperties/.test(declaredText) || /CSSProperties/.test(type.getText())) return null;
    if (type.getCallSignatures().length > 0) return null;

    const required = sig ? !sig.hasQuestionToken() : false;
    const tags: JsDocMeta = sig ? readJsDoc(sig) : {};
    const { description, defaultValue, help, audience } = tags;
    const isReactNode =
        REACT_NODE_RE.test(declaredText) || REACT_NODE_RE.test(type.getText());

    // Coerce declared "text slots" (ReactNode props that are really text) to a text
    // field. A string is a valid ReactNode, so the component still accepts the value.
    if (target.textProps?.includes(name)) {
        return { name, label: tags.label ?? humanize(name), description, help, audience, field: { kind: 'text' }, required, defaultValue };
    }
    // Named ReactNode slots — drop other components inside (component-in-component).
    if (target.slotProps?.includes(name)) {
        return { name, label: tags.label ?? humanize(name), description, help, audience, field: { kind: 'slot' }, required };
    }

    if (name === 'children') {
        // Text-bearing leaves (Button) want a text field; containers want a slot.
        if (target.childrenAs === 'text') {
            return { name, label: tags.label ?? 'Children', description, help, audience, field: { kind: 'text' }, required, defaultValue };
        }
        if (target.childrenAs === 'slot' || isReactNode) {
            return { name, label: tags.label ?? 'Children', description, help, audience, field: { kind: 'slot' }, required };
        }
        // string children with no override → fall through to scalar classification
    } else if (isReactNode) {
        // Auto-discovery treats every ReactNode prop as a nesting slot.
        if (target.reactNodeAsSlot) {
            return { name, label: tags.label ?? humanize(name), description, help, audience, field: { kind: 'slot' }, required };
        }
        return null;
    }

    // Array of OBJECTS → a repeatable list of rows (each row may contain slots).
    // Handles `T[]` and the object member of a union (`T[] | string[]`, e.g. Swiper).
    // Arrays of scalars (string[], number[]) are NOT configurable as rows → dropped.
    const arrEl = objectArrayElement(type);
    if (arrEl) {
        const itemFields: ManifestField[] = [];
        for (const ip of arrEl.getProperties()) {
            const f = classifyItemProp(ip, loc);
            if (f) itemFields.push(f);
        }
        if (itemFields.length) {
            const itemLabel = itemFields.find((f) =>
                ['title', 'label', 'name', 'text', 'key'].includes(f.name),
            )?.name;
            return {
                name,
                label: tags.label ?? humanize(name),
                description,
                help,
                audience,
                field: { kind: 'array', itemFields, itemLabel },
                required,
            };
        }
    }
    if (type.isArray()) return null;

    let field = classifyScalar(type, tags);
    if (!field) return null;

    // Heuristic upgrades to richer controls based on the prop name.
    if (field.kind === 'text') {
        if (/colou?r$/i.test(name)) field = { kind: 'color' };
        else if (/^background$/i.test(name)) field = { kind: 'background' };
        else if (/^(src|image|imageurl|cover|avatar|photo|logo|decoration)$/i.test(name))
            field = { kind: 'image' };
        else if (/(href|url|link)$/i.test(name) && !/(image|img|photo|avatar|logo|icon|cover|thumb|src|media)/i.test(name))
            field = { kind: 'url' };
    }

    return { name, label: tags.label ?? humanize(name), description, help, audience, field, defaultValue, required };
}

function extractComponent(
    project: Project,
    root: string,
    target: ExtractTarget,
): ComponentManifest {
    const sf = project.getSourceFileOrThrow(path.resolve(root, target.file));
    const decl = sf.getTypeAlias(target.propsType) ?? sf.getInterface(target.propsType);
    if (!decl) {
        throw new Error(`Props type "${target.propsType}" not found in ${target.file}`);
    }

    const fields: ManifestField[] = [];
    for (const prop of decl.getType().getProperties()) {
        const field = classify(prop, target, decl);
        if (field) fields.push(field);
    }
    if (target.action) {
        // Synthetic declarative "on click" — the component's real handler is a function
        // (stripped from the manifest); this is the data the runtime wires to onClick.
        // Patched too: synthetic fields have no JSDoc to carry ops copy.
        fields.push(
            applyOpsMeta({ name: 'action', label: 'On click', field: { kind: 'action' }, required: false }, target.name),
        );
    }
    if (target.dataBound) {
        // Synthetic data binding — source id + field map. The runtime maps the project's
        // real data onto `items`; until then the component shows its static example. We copy
        // the `items` array's item fields onto the descriptor so the editor knows which target
        // fields to offer in the mapping UI.
        const itemsField = fields.find((f) => f.field.kind === 'array');
        const itemFields = itemsField?.field.kind === 'array' ? itemsField.field.itemFields : undefined;
        fields.push(
            applyOpsMeta(
                { name: 'binding', label: 'Data binding', field: { kind: 'dataMap', itemFields }, required: false },
                target.name,
            ),
        );
    }

    return {
        name: target.name,
        source: target.source,
        category: target.category,
        fields,
        slotFields: fields.filter((f) => f.field.kind === 'slot').map((f) => f.name),
    };
}

/** Extract every target in a project. Throws if the tsconfig / a Props type is missing. */
export function extractComponents(project: ExtractProject): ComponentManifest[] {
    const proj = new Project({
        tsConfigFilePath: path.resolve(project.root, project.tsConfigFilePath),
    });
    const out: ComponentManifest[] = [];
    for (const target of project.targets) {
        try {
            out.push(extractComponent(proj, project.root, target));
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error(`  ✗ ${target.name}: ${message}`);
        }
    }
    return out;
}

/** Auto-discover every `*Props` component exported from the barrel that isn't already handled. */
export function extractBarrel(
    root: string,
    tsConfigFilePath: string,
    barrelRel: string,
    handled: Set<string>,
    aliases: Record<string, string>,
): ComponentManifest[] {
    const proj = new Project({ tsConfigFilePath: path.resolve(root, tsConfigFilePath) });
    const barrel = proj.getSourceFileOrThrow(path.resolve(root, barrelRel));
    const out: ComponentManifest[] = [];
    for (const [typeName, decls] of barrel.getExportedDeclarations()) {
        if (!/Props$/.test(typeName)) continue;
        const name = aliases[typeName] ?? typeName.slice(0, -'Props'.length);
        if (handled.has(name)) continue;
        const decl = decls.find((d) => Node.isInterfaceDeclaration(d) || Node.isTypeAliasDeclaration(d));
        if (!decl) continue;
        const target: ExtractTarget = {
            name,
            propsType: typeName,
            file: '',
            source: 'dp-design',
            category: 'dp-design',
            reactNodeAsSlot: true,
        };
        const fields: ManifestField[] = [];
        try {
            for (const prop of decl.getType().getProperties()) {
                const f = classify(prop, target, decl);
                if (f) fields.push(f);
            }
        } catch {
            continue;
        }
        handled.add(name);
        out.push({
            name,
            source: 'dp-design',
            category: 'dp-design',
            fields,
            slotFields: fields.filter((f) => f.field.kind === 'slot').map((f) => f.name),
        });
    }
    return out;
}

/** Write the merged manifest and print a per-component summary. */
export function writeManifest(components: ComponentManifest[], outRel: string): Manifest {
    const manifest: Manifest = { version: 1, components };
    const outPath = path.resolve(REPO_ROOT, outRel);
    mkdirSync(path.dirname(outPath), { recursive: true });
    writeFileSync(outPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

    for (const c of components) {
        const summary = c.fields.map((f) => `${f.name}:${f.field.kind}`).join(', ');
        console.log(`✓ ${c.name.padEnd(12)} → ${summary}`);
    }
    console.log(`\nManifest (${components.length} components) → ${outRel}`);

    // Ops copy coverage — an ops field still labelled `humanize(name)` with no help is
    // showing a non-engineer the ENGINEER's word for the prop. Reported, never enforced:
    // the fallback chain always yields a usable label, so this is a backlog signal.
    const ops = components.flatMap((c) => c.fields).filter((f) => audienceOf(f) === 'ops');
    const bare = ops.filter((f) => f.label === humanize(f.name) && !f.help);
    const pct = ops.length === 0 ? 100 : Math.round(((ops.length - bare.length) / ops.length) * 100);
    console.log(`ops copy coverage: ${pct}% (${ops.length - bare.length}/${ops.length} ops fields have authored copy)`);
    return manifest;
}
