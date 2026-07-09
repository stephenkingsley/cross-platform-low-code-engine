/**
 * Custom interactive outline (layers) panel with SMOOTH drag-reorder, built on @dnd-kit
 * (the same engine Puck uses) — Puck's native outline only selects, it can't reorder.
 *
 * Each parent's children get their own `SortableContext`, so dragging reorders siblings within
 * a container cleanly (no cross-zone jumpiness). Drag is initiated from the grip handle; clicking
 * a row selects; hover reveals duplicate + delete (delete is two-step to guard against accidents).
 * Structural edits commit via `dispatch({ type:'setData' })` with a path-based mutation.
 */
import { useState, type CSSProperties, type ReactNode } from 'react';
import { usePuck } from '@puckeditor/core';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

const ROOT_ZONE = 'root:default-zone';

const LABELS: Record<string, string> = {
    HeroOverview: 'Hero overview',
    WhatsNew: "What's new",
    UpcomingList: 'Upcoming',
    ServiceList: 'Available services',
    FeatureCard: 'Feature Card',
    ActionCard: 'Action Card',
    LinkCard: 'Link Card',
    DataRow: 'Data Row',
};
function labelOf(name: string): string {
    return LABELS[name] ?? name.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
}

type Item = { type: string; props: Record<string, unknown> };
type PathStep = [index: number, slotKey: string];

function isSlot(v: unknown): v is Item[] {
    return Array.isArray(v) && v.length > 0 && v.every((x) => x != null && typeof x === 'object' && 'type' in (x as object) && 'props' in (x as object));
}
function slotEntries(item: Item): Array<[string, Item[]]> {
    const out: Array<[string, Item[]]> = [];
    for (const [k, v] of Object.entries(item?.props ?? {})) {
        if (k !== 'id' && isSlot(v)) out.push([k, v]);
    }
    return out;
}

/** Walk a path from `content` to the array that holds a node, in a cloned doc. */
function containerOf(content: Item[], path: PathStep[]): Item[] {
    let arr: Item[] = content;
    for (const [idx, key] of path) arr = arr[idx].props[key] as Item[];
    return arr;
}

/** Find a node by its `props.id`, searching every slot (used for cross-zone moves). */
function findNodeById(nodes: Item[], id: string): Item | null {
    for (const n of nodes) {
        if (n.props?.id === id) return n;
        for (const [, v] of slotEntries(n)) {
            const f = findNodeById(v, id);
            if (f) return f;
        }
    }
    return null;
}
/** Find the array + index that directly holds a node with `id`. */
function findLoc(nodes: Item[], id: string): { arr: Item[]; index: number } | null {
    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].props?.id === id) return { arr: nodes, index: i };
        for (const [, v] of slotEntries(nodes[i])) {
            const r = findLoc(v, id);
            if (r) return r;
        }
    }
    return null;
}
/** True when `id` is `node` itself or anywhere inside its subtree (cycle guard for moves). */
function subtreeContains(node: Item, id: string): boolean {
    if (node.props?.id === id) return true;
    for (const [, v] of slotEntries(node)) for (const c of v) if (subtreeContains(c, id)) return true;
    return false;
}

let dupSeq = 0;
function cloneWithNewIds(node: Item): Item {
    const copy = JSON.parse(JSON.stringify(node)) as Item;
    const reid = (n: Item) => {
        if (n?.props && 'id' in n.props) n.props.id = `${n.type || 'node'}-c${(dupSeq++).toString(36)}`;
        for (const [, v] of slotEntries(n)) v.forEach(reid);
    };
    reid(copy);
    return copy;
}

const iconBtn: CSSProperties = {
    width: 22,
    height: 22,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    background: 'transparent',
    borderRadius: 5,
    cursor: 'pointer',
    fontSize: 13,
    lineHeight: 1,
    padding: 0,
};

interface RowCtx {
    selKey: string | null;
    hover: string | null;
    setHover: (v: string | null) => void;
    confirmId: string | null;
    setConfirmId: (v: string | null) => void;
    select: (zone: string, index: number) => void;
    remove: (path: PathStep[], index: number) => void;
    duplicate: (path: PathStep[], index: number) => void;
}

/** One sortable row + its nested zones. */
function Row({ item, zone, index, path, depth, ctx }: { item: Item; zone: string; index: number; path: PathStep[]; depth: number; ctx: RowCtx }) {
    const id = (item.props.id as string) ?? `${zone}-${index}`;
    const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
        id,
        data: { id, type: item.type, zone, index, path },
    });
    const selected = ctx.selKey === `${zone}#${index}`;
    const isHover = ctx.hover === id;
    const slots = slotEntries(item);

    const style: CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        position: 'relative',
        zIndex: isDragging ? 2 : 'auto',
    };
    const btnColor = selected ? '#fff' : 'var(--puck-color-grey-05, #64748b)';

    return (
        <div ref={setNodeRef} style={style}>
            <div
                onMouseEnter={() => ctx.setHover(id)}
                onMouseLeave={() => {
                    if (ctx.hover === id) ctx.setHover(null);
                    if (ctx.confirmId === id) ctx.setConfirmId(null);
                }}
                onClick={() => ctx.select(zone, index)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    height: 32,
                    paddingLeft: 6 + depth * 14,
                    paddingRight: 6,
                    borderRadius: 7,
                    cursor: 'pointer',
                    userSelect: 'none',
                    background: selected ? 'var(--puck-color-azure-04, #2680eb)' : isHover ? 'var(--puck-color-grey-11, #f1f5f9)' : 'transparent',
                    color: selected ? '#fff' : 'var(--puck-color-grey-02, #1e293b)',
                }}
            >
                <span
                    ref={setActivatorNodeRef}
                    {...attributes}
                    {...listeners}
                    title="Drag to reorder"
                    aria-label="Drag to reorder"
                    onClick={(e) => e.stopPropagation()}
                    style={{ cursor: 'grab', opacity: 0.5, fontSize: 13, padding: '0 2px', touchAction: 'none' }}
                >
                    ⠿
                </span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: selected ? 600 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {labelOf(item.type)}
                </span>
                {isHover && ctx.confirmId !== id && (
                    <span style={{ display: 'inline-flex', gap: 1 }} onClick={(e) => e.stopPropagation()}>
                        <button title="Duplicate" style={{ ...iconBtn, color: btnColor }} onClick={() => ctx.duplicate(path, index)}>⧉</button>
                        <button title="Delete" style={{ ...iconBtn, color: selected ? '#fff' : '#e5484d' }} onClick={() => ctx.setConfirmId(id)}>✕</button>
                    </span>
                )}
                {isHover && ctx.confirmId === id && (
                    <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: selected ? '#fff' : '#e5484d' }}>Delete?</span>
                        <button title="Confirm delete" style={{ ...iconBtn, width: 'auto', padding: '0 7px', color: '#fff', background: '#e5484d', fontWeight: 600 }} onClick={() => { ctx.remove(path, index); ctx.setConfirmId(null); }}>Yes</button>
                        <button title="Cancel" style={{ ...iconBtn, width: 'auto', padding: '0 6px', color: btnColor }} onClick={() => ctx.setConfirmId(null)}>No</button>
                    </span>
                )}
            </div>
            {slots.map(([key, children]) => (
                <Zone key={key} items={children} zone={`${id}:${key}`} path={[...path, [index, key]]} depth={depth + 1} ctx={ctx} />
            ))}
        </div>
    );
}

/** A sortable list of siblings (one container/zone). */
function Zone({ items, zone, path, depth, ctx }: { items: Item[]; zone: string; path: PathStep[]; depth: number; ctx: RowCtx }): ReactNode {
    const ids = items.map((it, i) => (it.props.id as string) ?? `${zone}-${i}`);
    return (
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            {items.map((item, index) => (
                <Row key={ids[index]} item={item} zone={zone} index={index} path={path} depth={depth} ctx={ctx} />
            ))}
        </SortableContext>
    );
}

export function CustomOutline() {
    const puck = usePuck() as unknown as {
        appState: { data: { content?: Item[] }; ui: { itemSelector?: { index: number; zone?: string } } };
        dispatch: (action: Record<string, unknown>) => void;
        config: { components?: Record<string, { fields?: Record<string, { type?: string }> }> };
    };
    const { appState, dispatch } = puck;
    /** The slot prop name of a component type (→ its children zone), or null if it's not a container. */
    const slotKeyOf = (type: string): string | null => {
        const fields = puck.config?.components?.[type]?.fields ?? {};
        for (const [k, f] of Object.entries(fields)) if (f?.type === 'slot') return k;
        return null;
    };
    const content = appState.data.content ?? [];
    const sel = appState.ui.itemSelector;
    const selKey = sel != null ? `${sel.zone ?? ROOT_ZONE}#${sel.index}` : null;

    const [hover, setHover] = useState<string | null>(null);
    const [confirmId, setConfirmId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const editData = (fn: (content: Item[]) => void) =>
        dispatch({
            type: 'setData',
            data: (prev: { content: Item[] }) => {
                const next = JSON.parse(JSON.stringify(prev)) as { content: Item[] };
                fn(next.content);
                return next;
            },
        });

    const ctx: RowCtx = {
        selKey,
        hover,
        setHover,
        confirmId,
        setConfirmId,
        select: (zone, index) => dispatch({ type: 'setUi', ui: { itemSelector: { index, zone } } }),
        remove: (path, index) => editData((c) => containerOf(c, path).splice(index, 1)),
        duplicate: (path, index) => editData((c) => { const arr = containerOf(c, path); arr.splice(index + 1, 0, cloneWithNewIds(arr[index])); }),
    };

    const onDragEnd = (e: DragEndEvent) => {
        const { active, over } = e;
        if (!over || active.id === over.id) return;
        const a = active.data.current as { id: string; type: string; zone: string; index: number; path: PathStep[] } | undefined;
        const o = over.data.current as { id: string; type: string; zone: string; index: number; path: PathStep[] } | undefined;
        if (!a || !o) return;

        // ── Same parent → plain reorder (smooth path, unchanged) ──
        if (a.zone === o.zone) {
            editData((c) => {
                const arr = containerOf(c, a.path);
                const [it] = arr.splice(a.index, 1);
                arr.splice(o.index, 0, it);
            });
            return;
        }

        // ── Cross-zone MOVE (e.g. drag a Card into a Flex) ──
        // Drop onto a CONTAINER → nest into its slot; drop onto a leaf → drop into that leaf's
        // container at the leaf's position. Both put the node inside the target's parent. Never
        // drop a node into its own subtree.
        const overSlot = slotKeyOf(o.type);
        editData((c) => {
            const activeNode = findNodeById(c, a.id);
            if (!activeNode || subtreeContains(activeNode, o.id)) return; // cycle guard
            const src = findLoc(c, a.id);
            if (!src) return;
            const [node] = src.arr.splice(src.index, 1);
            if (overSlot) {
                // nest into the container (append to its slot)
                const overNode = findNodeById(c, o.id);
                if (!overNode) {
                    src.arr.splice(src.index, 0, node); // target vanished → undo
                    return;
                }
                const slot = (overNode.props[overSlot] as Item[] | undefined) ?? [];
                slot.push(node);
                overNode.props[overSlot] = slot;
            } else {
                // drop as a sibling of the leaf, in the leaf's container
                const dst = findLoc(c, o.id);
                if (!dst) {
                    src.arr.splice(src.index, 0, node);
                    return;
                }
                dst.arr.splice(dst.index, 0, node);
            }
        });
    };

    if (content.length === 0) {
        return <div style={{ padding: 16, color: 'var(--puck-color-grey-05, #94a3b8)', fontSize: 13 }}>Empty page — drag a block in from the left.</div>;
    }

    return (
        <div style={{ padding: '6px 4px' }}>
            <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis]} onDragEnd={onDragEnd}>
                <Zone items={content} zone={ROOT_ZONE} path={[]} depth={0} ctx={ctx} />
            </DndContext>
        </div>
    );
}
