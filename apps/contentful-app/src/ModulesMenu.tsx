/**
 * Modules panel — rendered INSIDE the left blocks drawer (via overrides.drawer), so reusable
 * modules sit with the templates, not in a header menu. Built-in presets + your saved modules;
 * click a card to insert a COPY (fresh ids), ⎘ to copy it to the clipboard (move to another
 * panel), ✕ to delete your own. A toolbar saves the current selection / pastes. All via
 * `usePuck` dispatch — data, not code, no npm release.
 */
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { usePuck } from '@puckeditor/core';
import {
    cloneWithNewIds,
    findNodeBySelector,
    fromClip,
    loadModules,
    newModuleId,
    readClip,
    saveModules,
    toClip,
    writeClip,
    type ModuleDef,
    type Node,
} from './modules';

const toolBtn: CSSProperties = {
    flex: 1,
    height: 30,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: 8,
    border: '1px solid var(--puck-color-grey-09, #cbd5e1)',
    background: 'var(--puck-color-white, #fff)',
    color: 'var(--puck-color-grey-03, #334155)',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
};
const card: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    padding: '7px 9px',
    marginBottom: 6,
    borderRadius: 10,
    border: '1px solid var(--puck-color-grey-10, #eef1f4)',
    background: 'var(--puck-color-white, #fff)',
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(10,35,51,0.04)',
};
const chip: CSSProperties = {
    width: 26,
    height: 26,
    borderRadius: 7,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12.5,
    fontWeight: 700,
    flex: 'none',
};
const iconRow: CSSProperties = { border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, padding: '2px 5px', borderRadius: 6, color: 'var(--puck-color-grey-05, #64748b)' };

/** Stable hue per name (matches the drawer's monogram chip style). */
function hueOf(name: string): number {
    let h = 0;
    for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360;
    return h;
}

export function ModulesMenu() {
    const puck = usePuck() as unknown as {
        appState: { data: { content?: Node[] }; ui: { itemSelector?: { index: number; zone?: string } } };
        dispatch: (a: Record<string, unknown>) => void;
    };
    const { appState, dispatch } = puck;
    const [mods, setMods] = useState<ModuleDef[]>(() => loadModules());
    const [toast, setToast] = useState<string | null>(null);

    const selected = findNodeBySelector(appState.data.content ?? [], appState.ui.itemSelector);
    const selRef = useRef<Node | null>(selected);
    selRef.current = selected;

    const persist = (next: ModuleDef[]) => {
        setMods(next);
        saveModules(next);
    };
    const flash = (m: string) => {
        setToast(m);
        window.setTimeout(() => setToast(null), 1500);
    };

    /** Append a subtree (fresh ids) to the end of the page. */
    const insertNodes = (nodes: Node[]) => {
        const clones = nodes.map(cloneWithNewIds);
        dispatch({ type: 'setData', data: (prev: { content: Node[] }) => ({ ...prev, content: [...(prev.content ?? []), ...clones] }) });
    };

    const copySelection = async () => {
        const n = selRef.current;
        if (!n) return flash('Select a block first');
        await writeClip(toClip([n], n.type));
        flash('Copied to clipboard');
    };
    const paste = async () => {
        const payload = fromClip((await readClip()) ?? '');
        if (!payload) return flash('Nothing to paste on the clipboard');
        insertNodes(payload.content);
        flash('Pasted');
    };
    const saveSelectionAsModule = () => {
        const n = selRef.current;
        if (!n) return flash('Select a block first');
        const name = window.prompt('Name this module', n.type);
        if (!name) return;
        persist([...mods, { id: newModuleId(), name, content: [JSON.parse(JSON.stringify(n))], createdAt: Date.now() }]);
        flash('Saved as module');
    };

    // global ⌘C / ⌘V (skip when editing a field)
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const t = e.target as HTMLElement | null;
            if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'c' && selRef.current) copySelection();
            else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'v') paste();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div style={{ padding: '10px 16px 6px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--puck-color-grey-06, #94a3b8)', textTransform: 'uppercase', marginBottom: 9 }}>Modules</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                <button style={{ ...toolBtn, opacity: selected ? 1 : 0.5 }} disabled={!selected} title="Save the selected block as a reusable module" onClick={saveSelectionAsModule}>＋ Save selection</button>
                <button style={toolBtn} title="Paste a copied block / module (⌘V)" onClick={paste}>⤵ Paste</button>
            </div>
            {mods.map((m) => {
                const h = hueOf(m.name);
                return (
                    <div key={m.id} style={card} title="Click to insert into the page" onClick={() => { insertNodes(m.content); flash('Inserted'); }}>
                        <span style={{ ...chip, background: `hsl(${h} 70% 93%)`, color: `hsl(${h} 55% 32%)` }}>{(m.name[0] || 'M').toUpperCase()}</span>
                        <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--puck-color-grey-02, #1e293b)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
                        <button style={iconRow} title="Copy to clipboard (paste into another panel)" onClick={(e) => { e.stopPropagation(); writeClip(toClip(m.content, m.name)); flash('Copied to clipboard'); }}>⎘</button>
                        {m.preset ? (
                            <span style={{ ...iconRow, cursor: 'default', opacity: 0.5, fontSize: 10, fontWeight: 700 }} title="Built-in preset">preset</span>
                        ) : (
                            <button style={{ ...iconRow, color: '#e5484d' }} title="Delete" onClick={(e) => { e.stopPropagation(); persist(mods.filter((x) => x.id !== m.id)); }}>✕</button>
                        )}
                    </div>
                );
            })}
            {toast && (
                <div style={{ position: 'fixed', top: 72, left: '50%', transform: 'translateX(-50%)', background: '#0f172a', color: '#fff', fontSize: 12, padding: '7px 12px', borderRadius: 8, zIndex: 9999, whiteSpace: 'nowrap' }}>{toast}</div>
            )}
        </div>
    );
}
