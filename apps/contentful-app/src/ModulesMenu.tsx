/**
 * Modules panel — rendered INSIDE the left blocks drawer (via overrides.drawer), directly above the
 * Templates, and styled to be visually indistinguishable from Puck's own category sections: a
 * collapsible header (label + chevron, `_ComponentList-title_` look) and the two built-in preset
 * cards using the same `.lce-block` styling as the template blocks. It sits in the same
 * `_BlocksPlugin_` padding box as the categories, so it must add NO horizontal padding of its own
 * (otherwise the cards get double-inset, go narrow, and the label wraps). Click a card to insert a
 * COPY (fresh ids). ⌘C / ⌘V still copy the selected block / paste it (background, no visible UI).
 */
import { useEffect, useRef, useState } from 'react';
import { usePuck } from '@puckeditor/core';
import { PRESET_MODULES, cloneWithNewIds, findNodeBySelector, fromClip, readClip, toClip, writeClip, type Node } from './modules';

/** Stable hue per name — matches the template drawer's monogram chips (editor-chrome hueOf). */
function hueOf(name: string): number {
    let h = 0;
    for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360;
    return h;
}

/** The lucide chevron Puck uses for its collapsible category headers (12px, up = expanded). */
function Chevron({ up }: { up: boolean }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={up ? 'm18 15-6-6-6 6' : 'm6 9 6 6 6-6'} />
        </svg>
    );
}

export function ModulesMenu() {
    const puck = usePuck() as unknown as {
        appState: { data: { content?: Node[] }; ui: { itemSelector?: { index: number; zone?: string } } };
        dispatch: (a: Record<string, unknown>) => void;
    };
    const { appState, dispatch } = puck;
    const [open, setOpen] = useState(true);

    const selected = findNodeBySelector(appState.data.content ?? [], appState.ui.itemSelector);
    const selRef = useRef<Node | null>(selected);
    selRef.current = selected;

    /** Append a subtree (fresh ids) to the end of the page. */
    const insertNodes = (nodes: Node[]) => {
        const clones = nodes.map(cloneWithNewIds);
        dispatch({ type: 'setData', data: (prev: { content: Node[] }) => ({ ...prev, content: [...(prev.content ?? []), ...clones] }) });
    };

    // ⌘C / ⌘V — copy the selected block / paste a copied block (background power-user shortcuts, no UI).
    useEffect(() => {
        const onKey = async (e: KeyboardEvent) => {
            const t = e.target as HTMLElement | null;
            if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
            if (!(e.metaKey || e.ctrlKey)) return;
            const key = e.key.toLowerCase();
            if (key === 'c' && selRef.current) {
                await writeClip(toClip([selRef.current], selRef.current.type));
            } else if (key === 'v') {
                const payload = fromClip((await readClip()) ?? '');
                if (payload) insertNodes(payload.content);
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div>
            <button
                type="button"
                title={open ? 'Collapse Modules' : 'Expand Modules'}
                onClick={() => setOpen((v) => !v)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    width: '100%',
                    height: 33.5,
                    padding: 8,
                    margin: '0 0 6px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: 'rgb(118, 118, 118)',
                    fontSize: 12,
                    fontWeight: 400,
                    textTransform: 'uppercase',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                }}
            >
                <div>Modules</div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                    <Chevron up={open} />
                </div>
            </button>
            {open &&
                PRESET_MODULES.map((m) => {
                    const h = hueOf(m.name);
                    return (
                        <div key={m.id} style={{ padding: '3px 0' }}>
                            <div className="lce-block" style={{ cursor: 'pointer' }} title="Click to insert into the page" onClick={() => insertNodes(m.content)}>
                                <span className="lce-block__chip" style={{ background: `hsl(${h} 70% 93%)`, color: `hsl(${h} 55% 32%)` }}>
                                    {(m.name[0] || 'M').toUpperCase()}
                                </span>
                                <span className="lce-block__name">{m.name}</span>
                                <span className="lce-block__grip" aria-hidden>
                                    ⠿
                                </span>
                            </div>
                        </div>
                    );
                })}
        </div>
    );
}
