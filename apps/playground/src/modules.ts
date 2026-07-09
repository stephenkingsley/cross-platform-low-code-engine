/**
 * Composable "modules" — reusable block compositions defined as DATA, not code (so adding one
 * never needs an npm release). A module is just a saved document subtree; using it inserts a
 * COPY (approach A, detached — after insertion it's normal, editable blocks with fresh ids).
 *
 * Two reuse channels share the same serialize ⇄ insert primitive:
 *   1) a persistent library (localStorage here; a Contentful `pandoraModule` type in prod), shown
 *      in the "Modules" menu — save a selection, drop it back anywhere.
 *   2) the system clipboard (⌘C/⌘V) carrying a self-describing blob, to move a block/module to a
 *      DIFFERENT builder panel / tab / machine with no shared store.
 */

/** A document node (loosely typed — `{ type, props }`, props may hold slot child arrays). */
export interface Node {
    type: string;
    props: Record<string, unknown>;
}

/** A saved module = a named document fragment. */
export interface ModuleDef {
    id: string;
    name: string;
    /** Monogram/emoji for the menu (defaults to the first block's initial). */
    icon?: string;
    content: Node[];
    createdAt: number;
}

/** Puck's root content zone id (`${rootAreaId}:${rootZone}`). */
export const ROOT_ZONE = 'root:default-zone';

const LIB_KEY = 'lce.modules.v1';
const CLIP_KEY = 'lce.module.clip.v1'; // in-app clipboard fallback when the system one is blocked
const CLIP_MAGIC = '__pandoraModule';

/** A slot value is an array of nodes (`{ type, props }`) — distinct from array-FIELD rows. */
export function isSlot(v: unknown): v is Node[] {
    return Array.isArray(v) && v.length > 0 && v.every((x) => x != null && typeof x === 'object' && 'type' in (x as object) && 'props' in (x as object));
}

let idSeq = 0;
/** Deep-clone a node, assigning fresh ids to it and every nested slot child (avoid id collisions). */
export function cloneWithNewIds(node: Node): Node {
    const copy = JSON.parse(JSON.stringify(node)) as Node;
    const reid = (n: Node) => {
        if (n?.props && 'id' in n.props) {
            n.props.id = `${n.type || 'node'}-m${(idSeq++).toString(36)}${Math.random().toString(36).slice(2, 5)}`;
        }
        for (const v of Object.values(n?.props ?? {})) if (isSlot(v)) v.forEach(reid);
    };
    reid(copy);
    return copy;
}

/** Recursively find a node by its `props.id` (searches every slot). */
export function findNodeById(nodes: Node[], id: string): Node | null {
    for (const n of nodes) {
        if (n.props?.id === id) return n;
        for (const v of Object.values(n.props ?? {})) {
            if (isSlot(v)) {
                const found = findNodeById(v, id);
                if (found) return found;
            }
        }
    }
    return null;
}

/** Resolve Puck's `{ index, zone }` selection to the actual node subtree (or null). */
export function findNodeBySelector(content: Node[], sel: { index: number; zone?: string } | undefined): Node | null {
    if (!sel) return null;
    if (!sel.zone || sel.zone === ROOT_ZONE) return content[sel.index] ?? null;
    const [pid, slot] = sel.zone.split(':');
    const parent = findNodeById(content, pid);
    const arr = parent?.props?.[slot];
    return Array.isArray(arr) ? ((arr as Node[])[sel.index] ?? null) : null;
}

// ── persistent library ─────────────────────────────────────────────────────
export function loadModules(): ModuleDef[] {
    try {
        const raw = localStorage.getItem(LIB_KEY);
        return raw ? (JSON.parse(raw) as ModuleDef[]) : [];
    } catch {
        return [];
    }
}
export function saveModules(mods: ModuleDef[]): void {
    localStorage.setItem(LIB_KEY, JSON.stringify(mods));
}
export function newModuleId(): string {
    return `mod-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

// ── clipboard blob (self-describing, portable across panels/machines) ────────
export function toClip(content: Node[], name?: string): string {
    return JSON.stringify({ [CLIP_MAGIC]: 1, name, content });
}
/** Parse a clipboard string into a module payload, tolerating a raw node or a full page paste. */
export function fromClip(text: string): { name?: string; content: Node[] } | null {
    try {
        const v = JSON.parse(text);
        if (v && v[CLIP_MAGIC] && Array.isArray(v.content)) return { name: v.name, content: v.content };
        if (v && Array.isArray(v.content) && v.root) return { content: v.content }; // a whole page document
        if (v && v.type && v.props) return { content: [v] }; // a bare node
        return null;
    } catch {
        return null;
    }
}

/** System clipboard with an in-app localStorage fallback (when clipboard perms are blocked). */
export async function writeClip(text: string): Promise<void> {
    try {
        await navigator.clipboard.writeText(text);
    } catch {
        // ignore — fall through to the in-app copy
    }
    try {
        localStorage.setItem(CLIP_KEY, text);
    } catch {
        /* ignore */
    }
}
export async function readClip(): Promise<string | null> {
    try {
        const t = await navigator.clipboard.readText();
        if (t) return t;
    } catch {
        // permission blocked — fall back
    }
    try {
        return localStorage.getItem(CLIP_KEY);
    } catch {
        return null;
    }
}
