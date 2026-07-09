/**
 * Modules menu (rendered in the editor header). Turns a selected block — or the clipboard — into
 * a reusable, data-defined module: Save as module (→ persistent library), Copy (→ system clipboard
 * so it moves to any other panel), Paste, and per-module Insert / Copy / Delete. All via `usePuck`
 * dispatch — no component registration, no npm release.
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

const btn: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    height: 32,
    padding: '0 12px',
    borderRadius: 8,
    border: '1px solid var(--puck-color-grey-09, #cbd5e1)',
    background: 'var(--puck-color-white, #fff)',
    color: 'var(--puck-color-grey-02, #1f2937)',
    fontSize: 12.5,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
};
const rowBtn: CSSProperties = { border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, padding: '2px 6px', borderRadius: 6, color: 'var(--puck-color-grey-05, #64748b)' };

export function ModulesMenu() {
    const puck = usePuck() as unknown as {
        appState: { data: { content?: Node[] }; ui: { itemSelector?: { index: number; zone?: string } } };
        dispatch: (a: Record<string, unknown>) => void;
    };
    const { appState, dispatch } = puck;
    const [open, setOpen] = useState(false);
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
        window.setTimeout(() => setToast(null), 1600);
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

    // global ⌘C / ⌘V (skip when editing a field)
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const t = e.target as HTMLElement | null;
            if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'c' && selRef.current) {
                copySelection();
            } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'v') {
                paste();
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const saveSelectionAsModule = () => {
        const n = selRef.current;
        if (!n) return flash('Select a block first');
        const name = window.prompt('Name this module', n.type);
        if (!name) return;
        persist([...mods, { id: newModuleId(), name, content: [JSON.parse(JSON.stringify(n))], createdAt: Date.now() }]);
        flash('Saved as module');
    };

    return (
        <div style={{ position: 'relative' }}>
            <button style={btn} onClick={() => setOpen((o) => !o)} title="Reusable modules (save / copy / paste)">
                ▚ Modules{mods.length ? ` · ${mods.length}` : ''}
            </button>
            {toast && (
                <div style={{ position: 'absolute', top: 38, right: 0, background: '#0f172a', color: '#fff', fontSize: 12, padding: '6px 10px', borderRadius: 7, whiteSpace: 'nowrap', zIndex: 60 }}>{toast}</div>
            )}
            {open && (
                <>
                    <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                    <div style={{ position: 'absolute', top: 38, right: 0, width: 300, maxHeight: 460, overflow: 'auto', background: 'var(--puck-color-white, #fff)', border: '1px solid var(--puck-color-grey-09, #e2e8f0)', borderRadius: 12, boxShadow: '0 12px 32px rgba(10,35,51,0.16)', zIndex: 50, padding: 8 }}>
                        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                            <button style={{ ...btn, flex: 1, justifyContent: 'center', opacity: selected ? 1 : 0.5 }} disabled={!selected} onClick={saveSelectionAsModule}>＋ Save as module</button>
                        </div>
                        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                            <button style={{ ...btn, flex: 1, justifyContent: 'center', opacity: selected ? 1 : 0.5 }} disabled={!selected} onClick={copySelection}>⎘ Copy selection <span style={{ opacity: 0.5, marginLeft: 4 }}>⌘C</span></button>
                            <button style={{ ...btn, flex: 1, justifyContent: 'center' }} onClick={paste}>⤵ Paste <span style={{ opacity: 0.5, marginLeft: 4 }}>⌘V</span></button>
                        </div>
                        <div style={{ height: 1, background: 'var(--puck-color-grey-10, #f1f5f9)', margin: '4px 0 8px' }} />
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--puck-color-grey-06, #94a3b8)', padding: '0 4px 6px' }}>My modules</div>
                        {mods.length === 0 && <div style={{ fontSize: 12, color: 'var(--puck-color-grey-06, #94a3b8)', padding: '6px 4px' }}>None yet — select a block, then "Save as module".</div>}
                        {mods.map((m) => (
                            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 4px', borderRadius: 8 }}>
                                <span style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--puck-color-grey-11, #f1f5f9)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#334155' }}>{(m.name[0] || 'M').toUpperCase()}</span>
                                <span style={{ flex: 1, fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
                                <button style={{ ...rowBtn, color: 'var(--puck-color-azure-05, #2680eb)', fontWeight: 600 }} title="Insert into page" onClick={() => { insertNodes(m.content); flash('Inserted'); }}>Insert</button>
                                <button style={rowBtn} title="Copy to clipboard (paste into another panel)" onClick={async () => { await writeClip(toClip(m.content, m.name)); flash('Copied to clipboard'); }}>⎘</button>
                                {m.preset ? (
                                    <span style={{ ...rowBtn, cursor: 'default', opacity: 0.55, fontSize: 10, fontWeight: 700 }} title="Built-in preset">preset</span>
                                ) : (
                                    <button style={{ ...rowBtn, color: '#e5484d' }} title="Delete" onClick={() => persist(mods.filter((x) => x.id !== m.id))}>✕</button>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
