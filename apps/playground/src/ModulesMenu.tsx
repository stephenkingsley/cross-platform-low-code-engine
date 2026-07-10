/**
 * Modules panel — rendered INSIDE the left blocks drawer (via overrides.drawer), directly above the
 * Templates. It presents the built-in preset modules using the SAME card styling as the template
 * blocks (`.lce-block`), so the two sections read as one library. Click a card to insert a COPY of
 * that module (fresh ids) at the end of the page. ⌘C / ⌘V still copy the selected block / paste it
 * (kept in the background so a composition can be moved to another builder panel), but there's no
 * visible toolbar — Modules simply offers the presets.
 */
import { useEffect, useRef } from 'react';
import { usePuck } from '@puckeditor/core';
import { PRESET_MODULES, cloneWithNewIds, findNodeBySelector, fromClip, readClip, toClip, writeClip, type Node } from './modules';

/** Stable hue per name — matches the template drawer's monogram chips (editor-chrome hueOf). */
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
        <div style={{ padding: '12px 16px 8px' }}>
            <div
                style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'var(--puck-color-grey-06)',
                    marginBottom: 10,
                }}
            >
                Modules
            </div>
            {PRESET_MODULES.map((m) => {
                const h = hueOf(m.name);
                return (
                    <div key={m.id} style={{ padding: '3px 0' }}>
                        <div
                            className="lce-block"
                            style={{ cursor: 'pointer' }}
                            title="Click to insert into the page"
                            onClick={() => insertNodes(m.content)}
                        >
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
