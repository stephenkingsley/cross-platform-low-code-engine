import type { BaseAppSDK } from '@contentful/app-sdk';
import type { MediaRef } from '@lce/manifest';

interface AssetFile {
    url?: string;
    contentType?: string;
    details?: { image?: { width?: number; height?: number } };
}
interface ContentfulAsset {
    sys: { id: string };
    fields: { title?: unknown; file?: unknown };
}

/**
 * Pull a value from a Contentful field that may be **locale-keyed** (`{ [locale]: V }`) OR
 * **already resolved** to `V` — the asset-picker dialog and the CMA can each return either.
 */
function unwrap<T>(
    field: unknown,
    locale: string,
    fallback: string,
    isResolved: (v: unknown) => boolean,
): T | undefined {
    if (field == null) return undefined;
    if (isResolved(field)) return field as T;
    const map = field as Record<string, T>;
    return map[locale] ?? map[fallback] ?? (Object.values(map)[0] as T | undefined);
}

const fileResolved = (v: unknown): boolean =>
    typeof v === 'object' && v !== null && 'url' in (v as Record<string, unknown>);
const stringResolved = (v: unknown): boolean => typeof v === 'string';

/** Map a Contentful asset entity to our hybrid MediaRef (id + denormalized snapshot). */
export function assetToMediaRef(asset: ContentfulAsset, locale: string, fallback: string): MediaRef {
    const file = unwrap<AssetFile>(asset.fields.file, locale, fallback, fileResolved);
    const title = unwrap<string>(asset.fields.title, locale, fallback, stringResolved);
    const rawUrl = file?.url ?? '';
    const url = rawUrl.startsWith('//') ? `https:${rawUrl}` : rawUrl;
    return {
        provider: 'contentful',
        kind: 'asset',
        id: asset.sys.id,
        url,
        alt: title,
        width: file?.details?.image?.width,
        height: file?.details?.image?.height,
        contentType: file?.contentType,
    };
}

/**
 * Open Contentful's native media browser and return the chosen asset as a MediaRef.
 * If the dialog's snapshot URL is empty, fall back to fetching the full asset via the CMA
 * by id (authoritative). Returns `null` if the user dismisses.
 */
export async function pickContentfulAsset(sdk: BaseAppSDK): Promise<MediaRef | null> {
    const selected = (await sdk.dialogs.selectSingleAsset()) as ContentfulAsset | null;
    if (!selected?.sys?.id) return null;
    const locale = sdk.locales.default;

    let ref = assetToMediaRef(selected, locale, locale);
    if (!ref.url) {
        try {
            const cma = sdk.cma as unknown as {
                asset: { get: (p: { assetId: string }) => Promise<ContentfulAsset> };
            };
            const full = await cma.asset.get({ assetId: selected.sys.id });
            ref = assetToMediaRef(full, locale, locale);
        } catch {
            // keep the snapshot-less ref — it still carries the id for later resolution
        }
    }
    return ref;
}
