import { EditorAppSDK } from '@contentful/app-sdk';
import { Note } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { FieldLabel, usePuck, type Data, type Fields } from '@puckeditor/core';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DpPage } from '@lce/components-dp';
import { Editor } from '@lce/editor';
import { pickContentfulAsset } from '../lib/contentful-assets';
import { useDocumentField, type DocData } from '../lib/useDocumentField';
import { registry, renderableManifest } from '../registry';
import { categories, puckOverrides } from '../editor-chrome';

const LOCALES = ['en', 'zh'];

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
                    overrides={puckOverrides}
                    categories={categories}
                    rootFields={ROOT_FIELDS}
                    rootLabel="Page settings"
                    locale="en"
                    fallbackLocale="en"
                    locales={LOCALES}
                    assetPicker={onPickImage}
                />
            </main>
        </div>
    );
};

export default Entry;
