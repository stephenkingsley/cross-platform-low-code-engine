/**
 * Custom interactive outline (layers) panel — smooth drag to REORDER *and* to NEST, built on @dnd-kit.
 *
 * The whole document renders as ONE flat sortable list so a drag can cross container boundaries
 * ("drag a Card into a Flex"). Where a drop lands follows the file-tree convention, decided by the
 * pointer's position within the row it's over:
 *   • a row's top / bottom edge  → reorder as a sibling before / after it
 *   • the middle of a CONTAINER  → nest inside it (as its first child)
 * A live indicator (insertion line for reorder, outline box for nest) shows exactly where it will go.
 * Structural edits commit via `dispatch({ type:'setData' })`. Rows also select, duplicate, delete.
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { usePuck } from '@puckeditor/core';
import {
    DndContext,
    DragOverlay,
    pointerWithin,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
    MeasuringStrategy,
    type DragStartEvent,
    type DragOverEvent,
    type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, sortableKeyboardCoordinates } from '@dnd-kit/sortable';

const ROOT_ZONE = 'root:default-zone';
const INDENT = 16; // px per nesting level

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
/** Find a node by its `props.id`, searching every slot. */
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
/** Find the array + index that directly holds the node with `id`. */
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

// ── flattened tree (render + drop math) ─────────────────────────────────────
interface Flat {
    id: string;
    type: string;
    depth: number;
    parentId: string | null;
    slotKey: string | null; // which slot of the parent this node lives in
    zone: string; // Puck itemSelector zone
    index: number; // position within its sibling group
}
function flatten(content: Item[]): Flat[] {
    const out: Flat[] = [];
    const walk = (nodes: Item[], parentId: string | null, slotKey: string | null, depth: number, zone: string) => {
        nodes.forEach((node, index) => {
            const id = (node.props.id as string) ?? `${zone}-${index}`;
            out.push({ id, type: node.type, depth, parentId, slotKey, zone, index });
            for (const [k, kids] of slotEntries(node)) walk(kids, id, k, depth + 1, `${id}:${k}`);
        });
    };
    walk(content, null, null, 0, ROOT_ZONE);
    return out;
}
/** Ids inside `id`'s subtree (excluding itself) — hidden while it's being dragged. */
function descendantIds(flat: Flat[], id: string): Set<string> {
    const byParent = new Map<string | null, string[]>();
    for (const f of flat) {
        const list = byParent.get(f.parentId) ?? [];
        list.push(f.id);
        byParent.set(f.parentId, list);
    }
    const out = new Set<string>();
    const stack = [id];
    while (stack.length) {
        const cur = stack.pop() as string;
        for (const child of byParent.get(cur) ?? []) {
            out.add(child);
            stack.push(child);
        }
    }
    return out;
}

type DropMode = 'before' | 'after' | 'nest';
interface Drop {
    mode: DropMode;
    overId: string;
    depth: number; // depth the dropped node will sit at (for the indicator)
    parentId: string | null;
    slotKey: string | null;
    anchorId: string | null; // insert relative to this sibling (null → append)
    place: 'before' | 'after' | 'end';
}

/**
 * Decide the drop from the pointer's vertical position within the `over` row:
 *   leaf      → top half = before, bottom half = after (sibling reorder)
 *   container → top 30% = before, bottom 30% = after (sibling reorder), middle = nest inside (first child)
 */
function computeDrop(flat: Flat[], overId: string, pointerY: number, slotKeyOf: (t: string) => string | null): Drop | null {
    const over = flat.find((f) => f.id === overId);
    if (!over) return null;
    const el = typeof document !== 'undefined' ? document.querySelector(`[data-outline-id="${overId}"]`) : null;
    const rect = el?.getBoundingClientRect();
    const rel = rect && rect.height ? (pointerY - rect.top) / rect.height : 0.5;
    const container = slotKeyOf(over.type) != null;

    const before: Drop = { mode: 'before', overId, depth: over.depth, parentId: over.parentId, slotKey: over.slotKey, anchorId: over.id, place: 'before' };
    const after: Drop = { mode: 'after', overId, depth: over.depth, parentId: over.parentId, slotKey: over.slotKey, anchorId: over.id, place: 'after' };

    if (!container) return rel < 0.5 ? before : after;
    if (rel < 0.3) return before;
    if (rel > 0.7) return after;
    const firstChild = flat.filter((f) => f.parentId === over.id).sort((a, b) => a.index - b.index)[0]?.id ?? null;
    return {
        mode: 'nest',
        overId,
        depth: over.depth + 1,
        parentId: over.id,
        slotKey: slotKeyOf(over.type),
        anchorId: firstChild,
        place: firstChild ? 'before' : 'end',
    };
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
    activeId: string | null;
    drop: Drop | null;
    select: (zone: string, index: number) => void;
    remove: (id: string) => void;
    duplicate: (id: string) => void;
}

const LINE = 'var(--puck-color-azure-05, #2680eb)';

/** One flat sortable row + its drop indicator. */
function Row({ item, ctx }: { item: Flat; ctx: RowCtx }) {
    const { id, type, depth } = item;
    const { attributes, listeners, setNodeRef, setActivatorNodeRef } = useSortable({ id });
    const selected = ctx.selKey === `${item.zone}#${item.index}`;
    const isHover = ctx.hover === id;
    const isActive = ctx.activeId === id;
    const d = ctx.drop && ctx.drop.overId === id ? ctx.drop : null;
    const nesting = d?.mode === 'nest';

    return (
        <div ref={setNodeRef} data-outline-id={id} style={{ position: 'relative', opacity: isActive ? 0.4 : 1 }}>
            {/* insertion line for before/after */}
            {d && d.mode !== 'nest' && (
                <div
                    style={{
                        position: 'absolute',
                        left: 6 + d.depth * INDENT,
                        right: 6,
                        height: 2,
                        borderRadius: 2,
                        background: LINE,
                        top: d.mode === 'before' ? -1 : undefined,
                        bottom: d.mode === 'after' ? -1 : undefined,
                        zIndex: 3,
                        pointerEvents: 'none',
                    }}
                />
            )}
            <div
                onMouseEnter={() => ctx.setHover(id)}
                onMouseLeave={() => {
                    if (ctx.hover === id) ctx.setHover(null);
                    if (ctx.confirmId === id) ctx.setConfirmId(null);
                }}
                onClick={() => ctx.select(item.zone, item.index)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    height: 32,
                    marginLeft: depth * INDENT,
                    paddingLeft: 6,
                    paddingRight: 6,
                    borderRadius: 7,
                    cursor: 'pointer',
                    userSelect: 'none',
                    boxShadow: nesting ? `inset 0 0 0 1.5px ${LINE}` : 'none',
                    background: selected
                        ? 'var(--puck-color-azure-04, #2680eb)'
                        : nesting
                          ? 'var(--puck-color-azure-11, #eaf2fe)'
                          : isHover
                            ? 'var(--puck-color-grey-11, #f1f5f9)'
                            : 'transparent',
                    color: selected ? '#fff' : 'var(--puck-color-grey-02, #1e293b)',
                }}
            >
                <span
                    ref={setActivatorNodeRef}
                    {...attributes}
                    {...listeners}
                    title="Drag to reorder / nest"
                    aria-label="Drag to reorder or nest"
                    onClick={(e) => e.stopPropagation()}
                    style={{ cursor: 'grab', opacity: 0.5, fontSize: 13, padding: '0 2px', touchAction: 'none' }}
                >
                    ⠿
                </span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: selected ? 600 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {labelOf(type)}
                </span>
                {isHover && ctx.confirmId !== id && (
                    <span style={{ display: 'inline-flex', gap: 1 }} onClick={(e) => e.stopPropagation()}>
                        <button title="Duplicate" style={{ ...iconBtn, color: selected ? '#fff' : 'var(--puck-color-grey-05, #64748b)' }} onClick={() => ctx.duplicate(id)}>⧉</button>
                        <button title="Delete" style={{ ...iconBtn, color: selected ? '#fff' : '#e5484d' }} onClick={() => ctx.setConfirmId(id)}>✕</button>
                    </span>
                )}
                {isHover && ctx.confirmId === id && (
                    <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: selected ? '#fff' : '#e5484d' }}>Delete?</span>
                        <button title="Confirm delete" style={{ ...iconBtn, width: 'auto', padding: '0 7px', color: '#fff', background: '#e5484d', fontWeight: 600 }} onClick={() => { ctx.remove(id); ctx.setConfirmId(null); }}>Yes</button>
                        <button title="Cancel" style={{ ...iconBtn, width: 'auto', padding: '0 6px', color: selected ? '#fff' : 'var(--puck-color-grey-05, #64748b)' }} onClick={() => ctx.setConfirmId(null)}>No</button>
                    </span>
                )}
            </div>
        </div>
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
    const slotKeyOf = useMemo(() => {
        const cache = new Map<string, string | null>();
        return (type: string): string | null => {
            if (cache.has(type)) return cache.get(type) as string | null;
            const fields = puck.config?.components?.[type]?.fields ?? {};
            let key: string | null = null;
            for (const [k, f] of Object.entries(fields)) if (f?.type === 'slot') { key = k; break; }
            cache.set(type, key);
            return key;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [puck.config]);

    const content = appState.data.content ?? [];
    const sel = appState.ui.itemSelector;
    const selKey = sel != null ? `${sel.zone ?? ROOT_ZONE}#${sel.index}` : null;

    const [hover, setHover] = useState<string | null>(null);
    const [confirmId, setConfirmId] = useState<string | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [drop, setDrop] = useState<Drop | null>(null);
    const pointerY = useRef(0);

    // Track the live pointer Y so we can tell "top edge / middle / bottom edge" of the row being dragged over.
    useEffect(() => {
        const onMove = (e: PointerEvent) => (pointerY.current = e.clientY);
        window.addEventListener('pointermove', onMove, { passive: true });
        return () => window.removeEventListener('pointermove', onMove);
    }, []);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const flat = useMemo(() => flatten(content), [content]);
    const hidden = useMemo(() => (activeId ? descendantIds(flat, activeId) : new Set<string>()), [flat, activeId]);
    const visible = useMemo(() => flat.filter((f) => !hidden.has(f.id)), [flat, hidden]);
    const ids = useMemo(() => visible.map((f) => f.id), [visible]);

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
        activeId,
        drop,
        select: (zone, index) => dispatch({ type: 'setUi', ui: { itemSelector: { index, zone } } }),
        remove: (id) => editData((c) => { const loc = findLoc(c, id); if (loc) loc.arr.splice(loc.index, 1); }),
        duplicate: (id) => editData((c) => { const loc = findLoc(c, id); if (loc) loc.arr.splice(loc.index + 1, 0, cloneWithNewIds(loc.arr[loc.index])); }),
    };

    const resetDrag = () => {
        setActiveId(null);
        setDrop(null);
    };
    const onDragStart = (e: DragStartEvent) => {
        setActiveId(String(e.active.id));
        setDrop(null);
    };
    const onDragOver = (e: DragOverEvent) => {
        const overId = e.over ? String(e.over.id) : null;
        if (!overId || overId === String(e.active.id)) return setDrop(null);
        setDrop(computeDrop(visible, overId, pointerY.current, slotKeyOf));
    };
    const onDragEnd = (e: DragEndEvent) => {
        const activeIdStr = String(e.active.id);
        const overId = e.over ? String(e.over.id) : null;
        const target = overId && overId !== activeIdStr ? computeDrop(visible, overId, pointerY.current, slotKeyOf) : null;
        resetDrag();
        if (!target) return;
        editData((c) => {
            const activeNode = findNodeById(c, activeIdStr);
            if (!activeNode) return;
            if (target.parentId && subtreeContains(activeNode, target.parentId)) return; // cycle guard
            const loc = findLoc(c, activeIdStr);
            if (!loc) return;
            const [node] = loc.arr.splice(loc.index, 1);
            // resolve the destination array
            let arr: Item[];
            if (target.parentId == null) arr = c;
            else {
                const parent = findNodeById(c, target.parentId);
                if (!parent) { loc.arr.splice(loc.index, 0, node); return; } // target vanished → undo
                const sk = target.slotKey ?? 'children';
                if (!Array.isArray(parent.props[sk])) parent.props[sk] = [];
                arr = parent.props[sk] as Item[];
            }
            // resolve the insert index
            let idx: number;
            if (target.place === 'end' || !target.anchorId) idx = arr.length;
            else {
                const at = arr.findIndex((n) => n.props.id === target.anchorId);
                idx = at < 0 ? arr.length : target.place === 'after' ? at + 1 : at;
            }
            arr.splice(idx, 0, node);
        });
    };

    if (content.length === 0) {
        return <div style={{ padding: 16, color: 'var(--puck-color-grey-05, #94a3b8)', fontSize: 13 }}>Empty page — drag a block in from the left.</div>;
    }

    const activeFlat = activeId ? flat.find((f) => f.id === activeId) ?? null : null;

    return (
        <div style={{ padding: '6px 4px' }}>
            <DndContext
                sensors={sensors}
                collisionDetection={pointerWithin}
                measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
                onDragCancel={resetDrag}
            >
                <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                    {visible.map((f) => (
                        <Row key={f.id} item={f} ctx={ctx} />
                    ))}
                </SortableContext>
                <DragOverlay dropAnimation={null}>
                    {activeFlat ? (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                height: 32,
                                padding: '0 10px',
                                borderRadius: 7,
                                background: 'var(--puck-color-white, #fff)',
                                boxShadow: '0 6px 20px rgba(10,35,51,0.18)',
                                border: '1px solid var(--puck-color-grey-10, #e5e7eb)',
                                fontSize: 13,
                                fontWeight: 600,
                                color: 'var(--puck-color-grey-02, #1e293b)',
                                pointerEvents: 'none',
                            }}
                        >
                            <span style={{ opacity: 0.5 }}>⠿</span>
                            {labelOf(activeFlat.type)}
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
