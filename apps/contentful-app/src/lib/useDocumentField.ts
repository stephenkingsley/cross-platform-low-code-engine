import type { EditorAppSDK } from '@contentful/app-sdk';
import { useEffect, useRef, useState } from 'react';

/** The page document the builder produces / the runtime consumes. */
export interface DocData {
    root?: { props?: Record<string, unknown> };
    content?: Array<{ type: string; props?: Record<string, unknown> }>;
    zones?: Record<string, unknown>;
}

const EMPTY_DOC: DocData = { root: { props: {} }, content: [], zones: {} };

/**
 * Two-way bind a JSON-Object entry field <-> React state.
 *
 * - Seeds from the field's current value (or an empty document).
 * - Pushes local edits back via `setValue`, debounced — Contentful autosaves the draft, and
 *   the native Save/Publish workflow takes over from there (no custom persistence needed).
 * - Subscribes to external changes (collaborators, locale switch) via `onValueChanged`, while
 *   ignoring the echo of our own writes (JSON compare).
 */
export function useDocumentField(sdk: EditorAppSDK, fieldId = 'document', debounceMs = 500) {
    const field = sdk.entry.fields[fieldId];
    const [doc, setDoc] = useState<DocData>(() => (field?.getValue() as DocData) ?? EMPTY_DOC);
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const lastWritten = useRef<string>('');

    // external changes -> state (skip our own echo)
    useEffect(() => {
        if (!field) return;
        const off = field.onValueChanged((v: unknown) => {
            const next = (v as DocData) ?? EMPTY_DOC;
            if (JSON.stringify(next) === lastWritten.current) return;
            setDoc(next);
        });
        return () => off();
    }, [field]);

    const update = (next: DocData) => {
        setDoc(next);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => {
            lastWritten.current = JSON.stringify(next);
            field?.setValue(next);
        }, debounceMs);
    };

    return [doc, update] as const;
}
