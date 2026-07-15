import { EditorAppSDK } from '@contentful/app-sdk';
import { Note } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { FieldLabel, usePuck, type Data, type Fields } from '@puckeditor/core';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { DpPage } from '@lce/components-dp';
import { Editor } from '@lce/editor';
import { pickContentfulAsset } from '../lib/contentful-assets';
import { useDocumentField, type DocData } from '../lib/useDocumentField';
import { registry, renderableManifest } from '../registry';
import { categories, puckOverrides } from '../editor-chrome';
import { ModulesMenu } from '../ModulesMenu';

/**
 * Content locales the builder authors. One for now — multi-language is coming back as its own
 * design, and until then the panel shouldn't ask ops a question we haven't decided the answer to.
 *
 * Text still SAVES as a `{ locale: string }` map and the panel writes only this locale, so the
 * translations already in a published document are carried through untouched, not destroyed.
 */
const LOCALES = ['en'];

/**
 * A REAL sample of the data this project passes the runtime as `bindings`. Ops can put `{{ … }}`
 * in any text; this is what makes that usable: the paths it contains become click-to-insert chips
 * and every slot shows what it reads as, live — including calling out a name that matches nothing,
 * which is the only way a typo is visible before publishing (an unresolved slot renders as empty,
 * and empty looks exactly like a value that happened to be blank).
 *
 * Replace this with a real response from YOUR API. It is used only in the editor and is never
 * written into the document, so it costs a published page nothing.
 */
const SAMPLE_BINDINGS = {
    guests: 2,
    time: '14:00',
    date: '8 June 2026',
    lounge: 'Aspire',
    at: '2026-06-08T14:00:00+01:00',
};

/**
 * Feature-flag catalog for the per-block Visibility control. In production, source this from
 * your entitlement config (or a Contentful entry) so it matches what the server returns; each
 * block's `visibleWhen` references these keys and the runtime hides blocks the user isn't
 * entitled to (the app passes the fetched flags to the runtime).
 *
 * `key` is the server's word; `label` is the ops word. Only the key is ever written to the
 * document — a label is display-only, so rewording one never touches a saved page.
 */
const FLAG_CATALOG = [
    { key: 'Lounge' },
    { key: 'FastTrack' },
    { key: 'Limo' },
    { key: 'localOffer' },
    { key: 'Dining' },
    { key: 'eSIM' },
];

/** name → url-safe slug (lowercase, non-alphanumerics → single hyphen, trimmed). */
function slugify(s: string): string {
    return s
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Read-only Slug display — derived LIVE from the Name via Puck's store, so it tracks the
 * Name in real time as you type. (Puck doesn't re-feed a read-only custom field's `value`
 * from external data changes, so reading the passed `value` leaves it stale/empty; reading
 * `usePuck().appState` instead always reflects the current name.)
 */
function SlugDisplay() {
    const { appState } = usePuck();
    const props = (appState?.data?.root?.props ?? {}) as Record<string, unknown>;
    const value = slugify((props.name as string | undefined) ?? '');
    return (
        <FieldLabel label="Slug">
            <input
                type="text"
                value={value}
                readOnly
                disabled
                style={{
                    width: '100%',
                    height: 34,
                    borderRadius: 8,
                    border: '1px solid var(--puck-color-grey-10, #e5e7eb)',
                    padding: '0 10px',
                    fontSize: 13,
                    background: 'var(--puck-color-grey-11, #f3f4f6)',
                    color: 'var(--puck-color-grey-05, #6b7280)',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    cursor: 'not-allowed',
                }}
            />
            <div style={{ fontSize: 11, color: 'var(--puck-color-grey-06, #9aa7b8)', marginTop: 4 }}>
                Auto-generated from Name
            </div>
        </FieldLabel>
    );
}

/** Page-level metadata in Puck's "Page settings" panel. `Name` editable; `Slug` derived. */
const ROOT_FIELDS: Fields = {
    name: { type: 'text', label: 'Name' },
    slug: { type: 'custom', label: 'Slug', render: () => <SlugDisplay /> },
};

/** Two-way bind a Contentful Symbol (short-text) field <-> state. */
function useStringField(sdk: EditorAppSDK, fieldId: string) {
    const field = sdk.entry.fields[fieldId];
    const [value, setValue] = useState<string>(() => (field?.getValue() as string) ?? '');
    useEffect(() => {
        if (!field) return;
        const off = field.onValueChanged((v: unknown) => setValue((v as string) ?? ''));
        return () => off();
    }, [field]);
    return {
        value,
        update: (v: string) => {
            setValue(v);
            field?.setValue(v);
        },
    };
}

/**
 * Entry Editor — the full Puck builder. The entry's `name` is editable in Puck's
 * "Page settings" panel; `slug` is auto-derived from it (read-only). Both mirror back to
 * the Contentful entry fields, so there's no separate metadata bar. The builder binds
 * `document`.
 */
/**
 * Puck UI overrides. Module-level and frozen at import: Puck keys the drawer subtree off these
 * component identities, so rebuilding the object each render remounts the whole drawer (and wipes
 * anything transient living in it).
 */
const EDITOR_OVERRIDES = {
    ...puckOverrides,
    drawer: ({ children }: { children: ReactNode }) => (
        <>
            <ModulesMenu />
            {children}
        </>
    ),
};

const Entry = () => {
    const sdk = useSDK<EditorAppSDK>();
    const [doc, setDoc] = useDocumentField(sdk, 'document');
    const name = useStringField(sdk, 'name');
    const slug = useStringField(sdk, 'slug');

    const onPickImage = useCallback(async () => {
        const ref = await pickContentfulAsset(sdk);
        return ref ? { $media: ref } : null;
    }, [sdk]);

    // Seed the PAGE panel: Name from the entry (or doc), Slug always derived from Name.
    const data = useMemo<Data>(() => {
        const rootProps = (doc.root?.props ?? {}) as Record<string, unknown>;
        const nameVal = (rootProps.name as string | undefined) ?? name.value;
        return {
            ...doc,
            root: {
                ...doc.root,
                props: { ...rootProps, name: nameVal, slug: slugify(nameVal) },
            },
        } as unknown as Data;
    }, [doc, name.value]);

    // On edit: push Name + the derived Slug back to the Contentful entry, and save the doc.
    const onChange = useCallback(
        (d: Data) => {
            const props = ((d as unknown as DocData).root?.props ?? {}) as { name?: string };
            const nm = typeof props.name === 'string' ? props.name : name.value;
            const sl = slugify(nm);
            if (nm !== name.value) name.update(nm);
            if (sl !== slug.value) slug.update(sl);
            setDoc(d as unknown as DocData);
        },
        [name, slug, setDoc],
    );

    if (!sdk.entry.fields.document) {
        return (
            <div style={{ margin: 24 }}>
                <Note variant="warning" title="缺少 document 字段">
                    当前内容类型没有 id 为 <code>document</code> 的 JSON(Object)字段。给它加一个,或换用含该字段的类型。
                </Note>
            </div>
        );
    }

    return (
        <div
            className="lce-root"
            style={{ height: '100%', display: 'flex', flexDirection: 'column', paddingBottom: 20, boxSizing: 'border-box' }}
        >
            <main style={{ flex: 1, minHeight: 0 }}>
                <Editor
                    manifest={renderableManifest}
                    registry={registry}
                    data={data}
                    onChange={onChange}
                    canvasWrapper={DpPage}
                    iframe={false}
                    overrides={EDITOR_OVERRIDES}
                    categories={categories}
                    rootFields={ROOT_FIELDS}
                    rootLabel="Page settings"
                    locale="en"
                    fallbackLocale="en"
                    locales={LOCALES}
                    assetPicker={onPickImage}
                    flagCatalog={FLAG_CATALOG}
                    sampleBindings={SAMPLE_BINDINGS}
                    mode="ops"
                />
            </main>
        </div>
    );
};

export default Entry;
