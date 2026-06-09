import { useEffect, useState, type CSSProperties } from 'react';
import { DpPage } from '@lce/components-dp';
import { Render } from '@lce/runtime-react';
import type { DocData } from '@lce/manifest';
import { fetchPageEntry } from './lib/fetch-document';
import { registry, renderableManifest } from './registry';

const msgStyle: CSSProperties = {
    display: 'grid',
    placeItems: 'center',
    height: '100vh',
    fontFamily: "'Poppins', system-ui, sans-serif",
    color: '#667085',
    fontSize: 14,
};

/**
 * Content-preview page (standalone — NO Contentful App SDK). Reads `entryId` from the URL,
 * fetches the page document via the Contentful Preview API, and renders it with the same
 * Puck-free runtime + dp registry the builder targets. This is what a Contentful "custom
 * content preview" URL points at: `…/?entryId={entry.sys.id}&locale={locale}`.
 */
export function PreviewPage({ entryId, locale }: { entryId: string; locale: string }) {
    const [doc, setDoc] = useState<DocData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let alive = true;
        setDoc(null);
        setError(null);
        fetchPageEntry(entryId)
            .then((fields) => {
                if (!alive) return;
                if (!fields?.document) setError(`Entry ${entryId} has no "document" field`);
                else setDoc(fields.document as DocData);
            })
            .catch((e: unknown) => alive && setError(e instanceof Error ? e.message : String(e)));
        return () => {
            alive = false;
        };
    }, [entryId]);

    if (error) return <div style={{ ...msgStyle, color: '#b42318' }}>Preview error: {error}</div>;
    if (!doc) return <div style={msgStyle}>Loading preview…</div>;

    // own scroll container so the editor theme's body{overflow:hidden} doesn't clip the page
    return (
        <div style={{ height: '100vh', overflow: 'auto' }}>
            <DpPage>
                <Render
                    data={doc}
                    registry={registry}
                    manifest={renderableManifest}
                    locale={locale}
                    fallbackLocale="en"
                    onAction={(action) => {
                        // Preview has no real app router: open external links, log the rest.
                        if (action.type === 'navigate') {
                            if (/^https?:\/\//.test(action.href))
                                window.open(action.href, '_blank', 'noopener,noreferrer');
                            else console.log('[preview] navigate →', action.href, action.target ?? '_self');
                        } else if (action.type === 'event') {
                            console.log('[preview] event →', action.name, action.payload ?? {});
                        }
                    }}
                />
            </DpPage>
        </div>
    );
}
